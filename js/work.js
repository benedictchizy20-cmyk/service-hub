/* =========================================================
   SERVICEHUB - MY WORK PAGE
   REAL BACKEND + SUPABASE STORAGE
   IMAGE + VIDEO UPLOAD
========================================================= */

(function () {
    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        user: null,

        work: [],

        filteredWork: [],

        editingId: null,

        selectedMedia: [],

        existingMedia: []

    };


    /* =====================================================
       HELPERS
    ===================================================== */

    function $(id) {
        return document.getElementById(id);
    }


    function firstDefined(...values) {

        return values.find(
            value =>
                value !== undefined &&
                value !== null &&
                value !== ""
        );
    }


    function unwrapData(response) {

        if (!response) {
            return null;
        }


        if (
            response.data !== undefined
        ) {
            return response.data;
        }


        if (
            response.result !== undefined
        ) {
            return response.result;
        }


        return response;
    }


    function extractArray(response) {

        const data =
            unwrapData(response);


        if (Array.isArray(data)) {
            return data;
        }


        if (
            data &&
            Array.isArray(data.work)
        ) {
            return data.work;
        }


        if (
            data &&
            Array.isArray(data.items)
        ) {
            return data.items;
        }


        if (
            data &&
            Array.isArray(data.results)
        ) {
            return data.results;
        }


        return [];
    }


    function escapeHTML(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }


    function getInitials(name) {

        const parts =
            String(name || "ServiceHub")
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (!parts.length) {
            return "SH";
        }


        if (parts.length === 1) {

            return parts[0]
                .slice(0, 2)
                .toUpperCase();
        }


        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }


    function formatPrice(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {
            return "Not specified";
        }


        return new Intl.NumberFormat(
            "en-NG",
            {
                style: "currency",
                currency: "NGN",
                maximumFractionDigits: 0
            }
        ).format(number);
    }


    function formatDate(value) {

        if (!value) {
            return "";
        }


        const date =
            new Date(value);


        if (
            Number.isNaN(
                date.getTime()
            )
        ) {
            return "";
        }


        return new Intl.DateTimeFormat(
            "en-NG",
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        ).format(date);
    }


    /* =====================================================
       MEDIA HELPERS
    ===================================================== */

    function isImage(file) {

        return Boolean(
            file &&
            file.type &&
            file.type.startsWith("image/")
        );
    }


    function isVideo(file) {

        return Boolean(
            file &&
            file.type &&
            file.type.startsWith("video/")
        );
    }


    function isAllowedMedia(file) {

        return (
            isImage(file) ||
            isVideo(file)
        );
    }


    function getMediaIcon(file) {

        return isVideo(file)
            ? "bi-camera-video-fill"
            : "bi-image-fill";
    }


    function formatFileSize(bytes) {

        if (!bytes) {
            return "0 KB";
        }


        if (
            bytes <
            1024 * 1024
        ) {

            return (
                Math.round(
                    bytes / 1024
                ) +
                " KB"
            );
        }


        return (
            (
                bytes /
                (1024 * 1024)
            ).toFixed(1) +
            " MB"
        );
    }


    function normalizeMedia(
        media,
        defaultType = ""
    ) {

        if (!media) {
            return null;
        }


        if (
            typeof media === "string"
        ) {

            const video =
                /\.(mp4|webm|mov|m4v)$/i
                    .test(media);


            return {

                url: media,

                type:
                    video
                        ? "video"
                        : (
                            defaultType ||
                            "image"
                        )

            };
        }


        const url =
            firstDefined(
                media.url,
                media.media_url,
                media.file_url,
                media.fileUrl,
                media.src
            );


        if (!url) {
            return null;
        }


        return {

            url,

            type:
                firstDefined(
                    media.type,
                    media.mime_type,
                    media.mimeType
                ) || defaultType || "image",

            name:
                firstDefined(
                    media.name,
                    media.file_name,
                    media.filename
                ) || ""
        };
    }


    /* =====================================================
       EXTRACT BACKEND MEDIA
    ===================================================== */

    function extractWorkMedia(work) {

        const media = [];


        function addMedia(
            item,
            type = ""
        ) {

            const normalized =
                normalizeMedia(
                    item,
                    type
                );


            if (
                normalized &&
                normalized.url &&
                !media.some(
                    existing =>
                        existing.url ===
                        normalized.url
                )
            ) {

                media.push(
                    normalized
                );
            }
        }


        /*
         * Main image
         */
        if (work.image) {

            addMedia(
                work.image,
                "image"
            );
        }


        /*
         * Images JSONB array
         */
        if (
            Array.isArray(
                work.images
            )
        ) {

            work.images.forEach(
                item => {

                    addMedia(
                        item,
                        "image"
                    );

                }
            );
        }


        /*
         * Video column.
         *
         * IMPORTANT:
         * The database column is "video",
         * not "videos".
         *
         * The backend stores the first
         * uploaded video URL here.
         */
        if (work.video) {

            if (
                Array.isArray(
                    work.video
                )
            ) {

                work.video.forEach(
                    item => {

                        addMedia(
                            item,
                            "video"
                        );

                    }
                );

            } else {

                addMedia(
                    work.video,
                    "video"
                );
            }
        }


        /*
         * Backwards compatibility.
         *
         * This allows older records using
         * "videos" to continue working.
         */
        if (work.videos) {

            if (
                Array.isArray(
                    work.videos
                )
            ) {

                work.videos.forEach(
                    item => {

                        addMedia(
                            item,
                            "video"
                        );

                    }
                );

            } else {

                addMedia(
                    work.videos,
                    "video"
                );
            }
        }


        /*
         * Backwards compatibility.
         */
        if (
            Array.isArray(
                work.media
            )
        ) {

            work.media.forEach(
                item => {

                    addMedia(
                        item
                    );

                }
            );
        }


        if (
            Array.isArray(
                work.media_files
            )
        ) {

            work.media_files.forEach(
                item => {

                    addMedia(
                        item
                    );

                }
            );
        }


        if (
            Array.isArray(
                work.files
            )
        ) {

            work.files.forEach(
                item => {

                    addMedia(
                        item
                    );

                }
            );
        }


        return media;
    }


    /* =====================================================
       NORMALIZE WORK
    ===================================================== */

    function normalizeWork(
        work
    ) {

        work =
            work || {};


        let published;


        if (
            work.published !==
            undefined
        ) {

            published =
                work.published === true ||
                work.published === "true" ||
                work.published === 1 ||
                work.published === "1";

        } else if (
            work.is_published !==
            undefined
        ) {

            published =
                work.is_published === true ||
                work.is_published === "true" ||
                work.is_published === 1 ||
                work.is_published === "1";

        } else if (
            work.status
        ) {

            published =
                String(
                    work.status
                ).toLowerCase() ===
                "published";

        } else {

            published = true;
        }


        return {

            id:
                firstDefined(
                    work.id,
                    work._id,
                    work.work_id,
                    work.project_id
                ) ||
                (
                    "work-" +
                    Date.now() +
                    "-" +
                    Math.random()
                ),


            title:
                firstDefined(
                    work.title,
                    work.name,
                    work.project_title
                ) ||
                "Untitled Project",


            category:
                firstDefined(
                    work.category
                ) ||
                "Other",


            description:
                firstDefined(
                    work.description,
                    work.details
                ) ||
                "",


            type:
                firstDefined(
                    work.type
                ) ||
                "previous",


            location:
                firstDefined(
                    work.location
                ) ||
                "",


            media:
                extractWorkMedia(
                    work
                ),


            published,


            status:
                published
                    ? "published"
                    : "draft",


            price:
                firstDefined(
                    work.price,
                    work.amount,
                    work.project_value
                ) || 0,


            createdAt:
                firstDefined(
                    work.created_at,
                    work.createdAt
                ) ||
                new Date().toISOString(),


            updatedAt:
                firstDefined(
                    work.updated_at,
                    work.updatedAt
                ) ||
                new Date().toISOString()
        };
    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(
        message,
        type = "success"
    ) {

        const alert =
            $("workAlert");


        if (!alert) {
            return;
        }


        alert.className =
            "dashboard-alert " +
            (
                type === "danger"
                    ? "dashboard-alert-danger"
                    : "dashboard-alert-success"
            );


        alert.textContent =
            message;


        alert.classList.remove(
            "d-none"
        );


        window.clearTimeout(
            showAlert.timer
        );


        showAlert.timer =
            window.setTimeout(
                () => {

                    alert.classList.add(
                        "d-none"
                    );

                },
                4000
            );
    }


    /* =====================================================
       USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getCurrentUser ===
                    "function"
            ) {

                const response =
                    await ServiceHubAPI.getCurrentUser();


                state.user =
                    unwrapData(
                        response
                    ) ||
                    response;

            } else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.getCurrentUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubAuth.getCurrentUser();

            } else if (
                window.ServiceHubApp &&
                typeof ServiceHubApp.getCurrentUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubApp.getCurrentUser();

            } else {

                state.user = null;
            }

        } catch (error) {

            console.error(
                "ServiceHub Work: unable to load user",
                error
            );


            state.user = null;
        }


        if (!state.user) {

            const currentPath =
                window.location.pathname;


            if (
                !currentPath.includes(
                    "login.html"
                )
            ) {

                window.location.href =
                    "./login.html";


                return false;
            }
        }


        return true;
    }


    function renderUser() {

        const user =
            state.user || {};


        const name =
            firstDefined(
                user.full_name,
                user.fullName,
                user.name,
                user.username,
                user.email
            ) ||
            "ServiceHub User";


        const role =
            firstDefined(
                user.role,
                user.user_type,
                user.account_type,
                user.type
            ) ||
            "Provider";


        const initials =
            getInitials(name);


        const sidebarName =
            $("sidebarUserName");


        if (sidebarName) {

            sidebarName.textContent =
                name;
        }


        const sidebarType =
            $("sidebarUserType");


        if (sidebarType) {

            sidebarType.textContent =
                String(role)
                    .replace(
                        /_/g,
                        " "
                    );
        }


        const avatar =
            firstDefined(
                user.avatar,
                user.avatar_url,
                user.profile_image,
                user.profileImage,
                user.photo
            );


        const sidebarAvatar =
            $("sidebarAvatar");


        if (sidebarAvatar) {

            if (avatar) {

                sidebarAvatar.innerHTML =
                    `
                    <img
                        src="${escapeHTML(avatar)}"
                        alt="Profile"
                    >
                    `;

            } else {

                sidebarAvatar.innerHTML =
                    `
                    <span>
                        ${escapeHTML(initials)}
                    </span>
                    `;

            }
        }


        const topbarName =
            $("topbarUserName");


        if (topbarName) {

            topbarName.textContent =
                name;
        }


        const topbarAvatar =
            $("topbarAvatar");


        if (topbarAvatar) {

            if (avatar) {

                topbarAvatar.innerHTML =
                    `
                    <img
                        src="${escapeHTML(avatar)}"
                        alt="Profile"
                    >
                    `;

            } else {

                topbarAvatar.innerHTML =
                    `
                    <span>
                        ${escapeHTML(initials)}
                    </span>
                    `;

            }
        }
    }


    /* =====================================================
       LOAD WORK
    ===================================================== */

    async function loadWork() {

        state.work = [];


        try {

            if (
                !window.ServiceHubAPI ||
                typeof ServiceHubAPI.getWork !==
                    "function"
            ) {

                throw new Error(
                    "Work API is not available."
                );
            }


            const response =
                await ServiceHubAPI.getWork();


            state.work =
                extractArray(response)
                    .map(
                        normalizeWork
                    );


        } catch (error) {

            console.error(
                "ServiceHub Work: load error",
                error
            );


            showAlert(
                error.message ||
                "Unable to load your work.",
                "danger"
            );
        }


        renderAll();
    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredWork() {

        const search =
            String(
                $("workSearch")?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const status =
            $("workStatusFilter")?.value ||
            "all";


        return state.work.filter(
            project => {

                const title =
                    String(
                        project.title ||
                        ""
                    ).toLowerCase();


                const description =
                    String(
                        project.description ||
                        ""
                    ).toLowerCase();


                const category =
                    String(
                        project.category ||
                        ""
                    ).toLowerCase();


                const location =
                    String(
                        project.location ||
                        ""
                    ).toLowerCase();


                const type =
                    String(
                        project.type ||
                        ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    description.includes(search) ||
                    category.includes(search) ||
                    location.includes(search) ||
                    type.includes(search);


                const matchesStatus =
                    status === "all" ||

                    (
                        status ===
                            "published" &&
                        project.published
                    ) ||

                    (
                        status === "draft" &&
                        !project.published
                    );


                return (
                    matchesSearch &&
                    matchesStatus
                );
            }
        );
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {

        const total =
            state.work.length;


        const published =
            state.work.filter(
                project =>
                    project.published
            ).length;


        const drafts =
            total -
            published;


        const withMedia =
            state.work.filter(
                project =>
                    Array.isArray(
                        project.media
                    ) &&
                    project.media.length >
                        0
            ).length;


        if ($("totalWork")) {

            $("totalWork")
                .textContent =
                total;
        }


        if ($("publishedWork")) {

            $("publishedWork")
                .textContent =
                published;
        }


        if ($("draftWork")) {

            $("draftWork")
                .textContent =
                drafts;
        }


        if ($("workWithImages")) {

            $("workWithImages")
                .textContent =
                withMedia;
        }
    }


    /* =====================================================
       ICON
    ===================================================== */

    function getWorkIcon(
        category
    ) {

        const value =
            String(
                category || ""
            ).toLowerCase();


        if (
            value.includes("design")
        ) {
            return "bi-palette-fill";
        }


        if (
            value.includes("development") ||
            value.includes("software")
        ) {
            return "bi-code-slash";
        }


        if (
            value.includes("photo")
        ) {
            return "bi-camera-fill";
        }


        if (
            value.includes("marketing")
        ) {
            return "bi-megaphone-fill";
        }


        if (
            value.includes("writing")
        ) {
            return "bi-pencil-fill";
        }


        if (
            value.includes("business")
        ) {
            return "bi-building-fill";
        }


        if (
            value.includes("consult")
        ) {
            return "bi-chat-square-text-fill";
        }


        return "bi-images";
    }


    /* =====================================================
       CARD MEDIA
    ===================================================== */

    function renderCardMedia(
        project
    ) {

        const media =
            Array.isArray(
                project.media
            )
                ? project.media
                : [];


        const firstMedia =
            media[0];


        if (
            !firstMedia ||
            !firstMedia.url
        ) {

            return `
                <div class="work-card-image-placeholder">
                    <i class="bi ${getWorkIcon(
                        project.category
                    )}"></i>
                </div>
            `;
        }


        const type =
            String(
                firstMedia.type ||
                ""
            ).toLowerCase();


        const isVideoMedia =
            type.includes("video") ||
            /\.(mp4|webm|mov|m4v)$/i
                .test(
                    firstMedia.url
                );


        if (isVideoMedia) {

            return `
                <video
                    class="work-card-media"
                    src="${escapeHTML(
                        firstMedia.url
                    )}"
                    muted
                    preload="metadata"
                    controls
                ></video>

                <div class="work-card-video-icon">
                    <i class="bi bi-play-fill"></i>
                </div>
            `;
        }


        return `
            <img
                class="work-card-media"
                src="${escapeHTML(
                    firstMedia.url
                )}"
                alt="${escapeHTML(
                    project.title
                )}"
                loading="lazy"
            >
        `;
    }


    /* =====================================================
       WORK CARD
    ===================================================== */

    function renderWork() {

        const grid =
            $("workGrid");


        if (!grid) {
            return;
        }


        const projects =
            getFilteredWork();


        state.filteredWork =
            projects;


        grid.innerHTML =
            "";


        const empty =
            $("workEmpty");


        const noResults =
            $("workNoResults");


        if (!state.work.length) {

            grid.classList.add(
                "d-none"
            );


            empty?.classList.remove(
                "d-none"
            );


            noResults?.classList.add(
                "d-none"
            );


            return;
        }


        if (!projects.length) {

            grid.classList.add(
                "d-none"
            );


            empty?.classList.add(
                "d-none"
            );


            noResults?.classList.remove(
                "d-none"
            );


            return;
        }


        grid.classList.remove(
            "d-none"
        );


        empty?.classList.add(
            "d-none"
        );


        noResults?.classList.add(
            "d-none"
        );


        grid.innerHTML =
            projects
                .map(
                    project => {

                        const statusClass =
                            project.published
                                ? "published"
                                : "draft";


                        const statusText =
                            project.published
                                ? "Published"
                                : "Draft";


                        const category =
                            project.category
                                ? escapeHTML(
                                    project.category
                                )
                                : "Other";


                        const type =
                            project.type
                                ? escapeHTML(
                                    project.type
                                )
                                : "";


                        const location =
                            project.location;


                        const mediaCount =
                            Array.isArray(
                                project.media
                            )
                                ? project.media.length
                                : 0;


                        return `
                            <article
                                class="work-card"
                                data-work-id="${escapeHTML(
                                    project.id
                                )}"
                            >

                                <div
                                    class="work-card-image"
                                >

                                    ${renderCardMedia(
                                        project
                                    )}

                                    <span
                                        class="work-card-status ${statusClass}"
                                    >
                                        <i
                                            class="bi bi-circle-fill"
                                        ></i>

                                        ${statusText}
                                    </span>


                                    ${
                                        mediaCount > 1
                                            ? `
                                                <span
                                                    class="work-media-count"
                                                >
                                                    <i
                                                        class="bi bi-images"
                                                    ></i>

                                                    ${mediaCount}
                                                </span>
                                            `
                                            : ""
                                    }

                                </div>


                                <div
                                    class="work-card-body"
                                >

                                    <div
                                        class="work-card-category"
                                    >
                                        ${category}
                                    </div>


                                    <h3
                                        class="work-card-title"
                                    >
                                        ${escapeHTML(
                                            project.title
                                        )}
                                    </h3>


                                    <p
                                        class="work-card-description"
                                    >
                                        ${escapeHTML(
                                            project.description ||
                                            "No description provided."
                                        )}
                                    </p>


                                    <div
                                        class="work-card-meta"
                                    >

                                        ${
                                            type
                                                ? `
                                                    <span
                                                        class="work-meta-item"
                                                    >
                                                        <i class="bi bi-briefcase-fill"></i>
                                                        ${type}
                                                    </span>
                                                `
                                                : ""
                                        }


                                        ${
                                            location
                                                ? `
                                                    <span
                                                        class="work-meta-item"
                                                    >
                                                        <i class="bi bi-geo-alt-fill"></i>
                                                        ${escapeHTML(
                                                            location
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }


                                        ${
                                            project.createdAt
                                                ? `
                                                    <span
                                                        class="work-meta-item"
                                                    >
                                                        <i class="bi bi-calendar3"></i>
                                                        ${escapeHTML(
                                                            formatDate(
                                                                project.createdAt
                                                            )
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>


                                    <div
                                        class="work-card-footer"
                                    >

                                        <div
                                            class="work-project-price"
                                        >

                                            <span>
                                                Project Value
                                            </span>

                                            <strong>
                                                ${formatPrice(
                                                    project.price
                                                )}
                                            </strong>

                                        </div>


                                        <div
                                            class="work-card-actions"
                                        >

                                            <button
                                                type="button"
                                                class="work-action-button"
                                                data-action="edit"
                                                data-id="${escapeHTML(
                                                    project.id
                                                )}"
                                                title="Edit project"
                                            >
                                                <i
                                                    class="bi bi-pencil"
                                                ></i>
                                            </button>


                                            <button
                                                type="button"
                                                class="work-action-button delete"
                                                data-action="delete"
                                                data-id="${escapeHTML(
                                                    project.id
                                                )}"
                                                title="Delete project"
                                            >
                                                <i
                                                    class="bi bi-trash3"
                                                ></i>
                                            </button>

                                        </div>

                                    </div>

                                </div>

                            </article>
                        `;
                    }
                )
                .join("");
    }


    function renderAll() {

        renderStats();

        renderWork();
    }


    /* =====================================================
       SELECTED MEDIA PREVIEW
    ===================================================== */

    function renderSelectedMedia() {

        const container =
            $("workMediaPreview");


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (
            !state.selectedMedia.length
        ) {
            return;
        }


        state.selectedMedia.forEach(
            (
                file,
                index
            ) => {

                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "work-media-preview-item";


                const url =
                    URL.createObjectURL(
                        file
                    );


                let mediaHTML;


                if (
                    isImage(file)
                ) {

                    mediaHTML = `
                        <img
                            src="${url}"
                            alt="${escapeHTML(
                                file.name
                            )}"
                        >
                    `;

                } else {

                    mediaHTML = `
                        <video
                            src="${url}"
                            controls
                            preload="metadata"
                        ></video>
                    `;
                }


                item.innerHTML = `

                    <div
                        class="work-media-preview-content"
                    >
                        ${mediaHTML}
                    </div>


                    <div
                        class="work-media-preview-info"
                    >

                        <div
                            class="work-media-file-icon"
                        >
                            <i
                                class="bi ${getMediaIcon(
                                    file
                                )}"
                            ></i>
                        </div>


                        <div
                            class="work-media-file-details"
                        >

                            <strong>
                                ${escapeHTML(
                                    file.name
                                )}
                            </strong>

                            <span>
                                ${formatFileSize(
                                    file.size
                                )}
                            </span>

                        </div>


                        <button
                            type="button"
                            class="work-media-remove"
                            data-media-index="${index}"
                            title="Remove file"
                        >
                            <i
                                class="bi bi-x-lg"
                            ></i>
                        </button>

                    </div>
                `;


                container.appendChild(
                    item
                );
            }
        );
    }


    function addSelectedFiles(
        files
    ) {

        const incoming =
            Array.from(
                files || []
            );


        if (!incoming.length) {
            return;
        }


        let added = 0;


        incoming.forEach(
            file => {

                if (
                    !isAllowedMedia(file)
                ) {

                    showAlert(
                        `${file.name} is not a supported image or video.`,
                        "danger"
                    );

                    return;
                }


                const maxSize =
                    50 *
                    1024 *
                    1024;


                if (
                    file.size >
                    maxSize
                ) {

                    showAlert(
                        `${file.name} is larger than 50 MB.`,
                        "danger"
                    );

                    return;
                }


                const duplicate =
                    state.selectedMedia.some(
                        existing =>
                            existing.name ===
                                file.name &&
                            existing.size ===
                                file.size &&
                            existing.lastModified ===
                                file.lastModified
                    );


                if (!duplicate) {

                    state.selectedMedia.push(
                        file
                    );

                    added++;
                }
            }
        );


        if (added > 0) {

            renderSelectedMedia();
        }
    }


    function removeSelectedMedia(
        index
    ) {

        if (
            index < 0 ||
            index >=
                state.selectedMedia.length
        ) {
            return;
        }


        state.selectedMedia.splice(
            index,
            1
        );


        renderSelectedMedia();
    }


    function clearSelectedMedia() {

        state.selectedMedia = [];

        renderSelectedMedia();
    }


    /* =====================================================
       FILE UPLOAD
    ===================================================== */

    function setupMediaUpload() {

        const input =
            $("workMediaInput");


        const dropzone =
            $("workMediaDropzone");


        if (!input) {

            console.warn(
                "ServiceHub Work: workMediaInput not found."
            );

            return;
        }


        input.addEventListener(
            "change",
            event => {

                addSelectedFiles(
                    event.target.files
                );


                input.value = "";
            }
        );


        if (dropzone) {

            dropzone.addEventListener(
                "dragover",
                event => {

                    event.preventDefault();

                    dropzone.classList.add(
                        "drag-over"
                    );
                }
            );


            dropzone.addEventListener(
                "dragleave",
                () => {

                    dropzone.classList.remove(
                        "drag-over"
                    );
                }
            );


            dropzone.addEventListener(
                "drop",
                event => {

                    event.preventDefault();

                    dropzone.classList.remove(
                        "drag-over"
                    );


                    addSelectedFiles(
                        event.dataTransfer.files
                    );
                }
            );
        }


        $("workMediaPreview")
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-media-index]"
                        );


                    if (!button) {
                        return;
                    }


                    removeSelectedMedia(
                        Number(
                            button.dataset.mediaIndex
                        )
                    );
                }
            );
    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openWorkModal(
        project = null
    ) {

        const modal =
            $("workModal");


        if (!modal) {
            return;
        }


        state.editingId =
            project
                ? project.id
                : null;


        state.existingMedia =
            project?.media || [];


        clearSelectedMedia();


        $("workModalTitle").textContent =
            project
                ? "Edit Project"
                : "Add Work";


        $("workId").value =
            project?.id || "";


        $("workTitle").value =
            project?.title || "";


        $("workCategory").value =
            project?.category || "";


        $("workType").value =
            project?.type ||
            "previous";


        $("workDescription").value =
            project?.description || "";


        $("workPrice").value =
            project?.price || "";


        $("workLocation").value =
            project?.location || "";


        $("workPublished").checked =
            project
                ? Boolean(
                    project.published
                )
                : true;


        updateDescriptionCount();


        renderExistingMedia();


        modal.classList.add(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow =
            "hidden";


        window.setTimeout(
            () => {

                $("workTitle")?.focus();

            },
            100
        );
    }


    function closeWorkModal() {

        const modal =
            $("workModal");


        if (!modal) {
            return;
        }


        modal.classList.remove(
            "open"
        );


        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow =
            "";


        $("workForm")?.reset();


        $("workId").value =
            "";


        state.editingId =
            null;


        state.existingMedia =
            [];


        clearSelectedMedia();


        $("workPublished").checked =
            true;


        updateDescriptionCount();


        const existing =
            $("existingWorkMedia");


        if (existing) {

            existing.innerHTML =
                "";
        }
    }


    /* =====================================================
       EXISTING MEDIA
    ===================================================== */

    function renderExistingMedia() {

        let container =
            $("existingWorkMedia");


        if (
            !container &&
            $("workMediaPreview")
        ) {

            container =
                document.createElement(
                    "div"
                );


            container.id =
                "existingWorkMedia";


            container.className =
                "existing-work-media";


            $("workMediaPreview")
                .parentNode
                .insertBefore(
                    container,
                    $("workMediaPreview")
                );
        }


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (
            !state.existingMedia.length
        ) {
            return;
        }


        const heading =
            document.createElement(
                "div"
            );


        heading.className =
            "existing-work-media-heading";


        heading.innerHTML = `
            <strong>
                Existing Media
            </strong>

            <span>
                ${state.existingMedia.length}
                file${
                    state.existingMedia.length === 1
                        ? ""
                        : "s"
                }
            </span>
        `;


        container.appendChild(
            heading
        );


        const grid =
            document.createElement(
                "div"
            );


        grid.className =
            "existing-work-media-grid";


        state.existingMedia.forEach(
            media => {

                if (
                    !media ||
                    !media.url
                ) {
                    return;
                }


                const item =
                    document.createElement(
                        "div"
                    );


                item.className =
                    "existing-work-media-item";


                const type =
                    String(
                        media.type ||
                        ""
                    ).toLowerCase();


                const video =
                    type.includes(
                        "video"
                    ) ||
                    /\.(mp4|webm|mov|m4v)$/i
                        .test(
                            media.url
                        );


                item.innerHTML =
                    video
                        ? `
                            <video
                                src="${escapeHTML(
                                    media.url
                                )}"
                                controls
                                preload="metadata"
                            ></video>
                        `
                        : `
                            <img
                                src="${escapeHTML(
                                    media.url
                                )}"
                                alt="Existing project media"
                            >
                        `;


                grid.appendChild(
                    item
                );
            }
        );


        container.appendChild(
            grid
        );
    }


    /* =====================================================
       SAVE WORK
    ===================================================== */

    async function saveWork(
        event
    ) {

        event.preventDefault();


        const title =
            $("workTitle")
                .value
                .trim();


        const description =
            $("workDescription")
                .value
                .trim();


        if (
            !title ||
            !description
        ) {

            showAlert(
                "Please enter the project title and description.",
                "danger"
            );

            return;
        }


        /*
         * New work requires at least
         * one image or video.
         */
        if (
            !state.editingId &&
            !state.selectedMedia.length
        ) {

            showAlert(
                "Please upload at least one image or video.",
                "danger"
            );

            return;
        }


        const published =
            $("workPublished")
                .checked;


        const wasEditing =
            Boolean(
                state.editingId
            );


        const button =
            $("saveWorkButton");


        const originalButtonHTML =
            button?.innerHTML;


        if (button) {

            button.disabled =
                true;


            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                ></span>

                Saving...
            `;
        }


        try {

            /*
             * ===============================================
             * CREATE
             * ===============================================
             */

            if (
                !state.editingId
            ) {

                const formData =
                    new FormData();


                formData.append(
                    "title",
                    title
                );


                formData.append(
                    "category",
                    $("workCategory").value ||
                    "Other"
                );


                formData.append(
                    "description",
                    description
                );


                formData.append(
                    "price",
                    String(
                        Number(
                            $("workPrice").value
                        ) || 0
                    )
                );


                formData.append(
                    "type",
                    $("workType").value ||
                    "previous"
                );


                formData.append(
                    "location",
                    $("workLocation").value
                        .trim()
                );


                formData.append(
                    "published",
                    String(
                        published
                    )
                );


                state.selectedMedia.forEach(
                    file => {

                        formData.append(
                            "media",
                            file,
                            file.name
                        );
                    }
                );


                const response =
                    await ServiceHubAPI.createWork(
                        formData
                    );


                const responseData =
                    unwrapData(
                        response
                    );


                const createdWork =
                    responseData?.work ||
                    responseData;


                const created =
                    normalizeWork(
                        createdWork
                    );


                state.work.unshift(
                    created
                );
            }


            /*
             * ===============================================
             * UPDATE
             * ===============================================
             */

            else {

                const formData =
                    new FormData();


                formData.append(
                    "title",
                    title
                );


                formData.append(
                    "category",
                    $("workCategory").value ||
                    "Other"
                );


                formData.append(
                    "description",
                    description
                );


                formData.append(
                    "price",
                    String(
                        Number(
                            $("workPrice").value
                        ) || 0
                    )
                );


                formData.append(
                    "type",
                    $("workType").value ||
                    "previous"
                );


                formData.append(
                    "location",
                    $("workLocation").value
                        .trim()
                );


                formData.append(
                    "published",
                    String(
                        published
                    )
                );


                /*
                 * New media added during edit.
                 */
                state.selectedMedia.forEach(
                    file => {

                        formData.append(
                            "media",
                            file,
                            file.name
                        );
                    }
                );


                const response =
                    await ServiceHubAPI.updateWork(
                        state.editingId,
                        formData
                    );


                const responseData =
                    unwrapData(
                        response
                    );


                const updatedWork =
                    responseData?.work ||
                    responseData;


                const updated =
                    normalizeWork(
                        updatedWork
                    );


                const index =
                    state.work.findIndex(
                        project =>
                            String(
                                project.id
                            ) ===
                            String(
                                state.editingId
                            )
                    );


                if (
                    index !== -1
                ) {

                    state.work[index] =
                        updated;
                }
            }


            closeWorkModal();


            renderAll();


            showAlert(
                wasEditing
                    ? "Project updated successfully."
                    : "Project added successfully."
            );


        } catch (error) {

            console.error(
                "ServiceHub Work: save error",
                error
            );


            showAlert(
                error.message ||
                "Unable to save this project.",
                "danger"
            );

        } finally {

            if (button) {

                button.disabled =
                    false;


                button.innerHTML =
                    originalButtonHTML;
            }
        }
    }


    /* =====================================================
       DELETE WORK
    ===================================================== */

    async function deleteWork(
        id
    ) {

        const project =
            state.work.find(
                item =>
                    String(item.id) ===
                    String(id)
            );


        if (!project) {
            return;
        }


        const confirmed =
            window.confirm(
                `Delete "${project.title}"? This action cannot be undone.`
            );


        if (!confirmed) {
            return;
        }


        try {

            await ServiceHubAPI.deleteWork(
                id
            );


            state.work =
                state.work.filter(
                    item =>
                        String(item.id) !==
                        String(id)
                );


            renderAll();


            showAlert(
                "Project deleted successfully."
            );


        } catch (error) {

            console.error(
                "ServiceHub Work: delete error",
                error
            );


            showAlert(
                error.message ||
                "Unable to delete this project.",
                "danger"
            );
        }
    }


    /* =====================================================
       DESCRIPTION COUNTER
    ===================================================== */

    function updateDescriptionCount() {

        const textarea =
            $("workDescription");


        const counter =
            $("workDescriptionCount");


        if (
            !textarea ||
            !counter
        ) {
            return;
        }


        counter.textContent =
            textarea.value.length;
    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function openSidebar() {

        $("dashboardSidebar")
            ?.classList.add(
                "open"
            );


        $("sidebarOverlay")
            ?.classList.add(
                "show"
            );
    }


    function closeSidebar() {

        $("dashboardSidebar")
            ?.classList.remove(
                "open"
            );


        $("sidebarOverlay")
            ?.classList.remove(
                "show"
            );
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.logout ===
                    "function"
            ) {

                await ServiceHubAPI.logout();

            } else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.logout ===
                    "function"
            ) {

                await ServiceHubAuth.logout();

            } else if (
                window.ServiceHubApp &&
                typeof ServiceHubApp.logout ===
                    "function"
            ) {

                await ServiceHubApp.logout();
            }

        } catch (error) {

            console.error(
                "ServiceHub logout error",
                error
            );

        } finally {

            window.location.href =
                "./login.html";
        }
    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        $("addWorkButton")
            ?.addEventListener(
                "click",
                () =>
                    openWorkModal()
            );


        $("emptyAddWorkButton")
            ?.addEventListener(
                "click",
                () =>
                    openWorkModal()
            );


        $("closeWorkModal")
            ?.addEventListener(
                "click",
                closeWorkModal
            );


        $("cancelWorkButton")
            ?.addEventListener(
                "click",
                closeWorkModal
            );


        $("workModal")
            ?.querySelector(
                ".work-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                closeWorkModal
            );


        $("workForm")
            ?.addEventListener(
                "submit",
                saveWork
            );


        $("workDescription")
            ?.addEventListener(
                "input",
                updateDescriptionCount
            );


        $("workSearch")
            ?.addEventListener(
                "input",
                renderWork
            );


        $("workStatusFilter")
            ?.addEventListener(
                "change",
                renderWork
            );


        $("workGrid")
            ?.addEventListener(
                "click",
                event => {

                    const button =
                        event.target.closest(
                            "[data-action]"
                        );


                    if (!button) {
                        return;
                    }


                    const action =
                        button.dataset.action;


                    const id =
                        button.dataset.id;


                    if (
                        action ===
                        "edit"
                    ) {

                        const project =
                            state.work.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(id)
                            );


                        if (project) {

                            openWorkModal(
                                project
                            );
                        }
                    }


                    if (
                        action ===
                        "delete"
                    ) {

                        deleteWork(
                            id
                        );
                    }
                }
            );


        $("mobileMenuButton")
            ?.addEventListener(
                "click",
                openSidebar
            );


        $("sidebarClose")
            ?.addEventListener(
                "click",
                closeSidebar
            );


        $("sidebarOverlay")
            ?.addEventListener(
                "click",
                closeSidebar
            );


        $("logoutButton")
            ?.addEventListener(
                "click",
                logout
            );


        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key ===
                        "Escape" &&
                    $("workModal")
                        ?.classList.contains(
                            "open"
                        )
                ) {

                    closeWorkModal();
                }
            }
        );


        setupMediaUpload();
    }


    /* =====================================================
       INIT
    ===================================================== */

    async function init() {

        const authenticated =
            await loadCurrentUser();


        if (!authenticated) {
            return;
        }


        renderUser();


        setupEvents();


        await loadWork();


        console.log(
            "ServiceHub My Work page loaded successfully."
        );
    }


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ServiceHubWork = {

        reload:
            loadWork,

        getState:
            function () {
                return state;
            },

        openModal:
            openWorkModal,

        closeModal:
            closeWorkModal

    };

})();
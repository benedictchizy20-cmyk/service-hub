/* =========================================================
   SERVICEHUB - MY WORK PAGE
   REAL IMAGE + VIDEO FILE UPLOAD
   FRONTEND / MOCK-READY
   BACKEND-READY API DETECTION
   ========================================================= */

(function () {
    "use strict";

    const state = {
        user: null,
        work: [],
        filteredWork: [],
        editingId: null,

        /*
         * Real files selected from the computer.
         */
        selectedMedia: [],

        /*
         * Existing media returned by backend.
         */
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

        if (response.data !== undefined) {
            return response.data;
        }

        if (response.result !== undefined) {
            return response.result;
        }

        return response;
    }


    function extractArray(response) {

        const data = unwrapData(response);

        if (Array.isArray(data)) {
            return data;
        }

        if (data && Array.isArray(data.work)) {
            return data.work;
        }

        if (data && Array.isArray(data.items)) {
            return data.items;
        }

        if (data && Array.isArray(data.results)) {
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

        const value =
            String(name || "ServiceHub")
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (!value.length) {
            return "SH";
        }


        if (value.length === 1) {
            return value[0]
                .slice(0, 2)
                .toUpperCase();
        }


        return (
            value[0].charAt(0) +
            value[value.length - 1].charAt(0)
        ).toUpperCase();
    }


    function formatPrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) {
            return "Not specified";
        }

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(number);
    }


    function formatDate(value) {

        if (!value) {
            return "";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
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

        return isImage(file) || isVideo(file);
    }


    function getMediaIcon(file) {

        if (isVideo(file)) {
            return "bi-camera-video-fill";
        }

        return "bi-image-fill";
    }


    function formatFileSize(bytes) {

        if (!bytes) {
            return "0 KB";
        }

        if (bytes < 1024 * 1024) {
            return (
                Math.round(bytes / 1024) +
                " KB"
            );
        }

        return (
            (bytes / (1024 * 1024))
                .toFixed(1) +
            " MB"
        );
    }


    function normalizeMedia(media) {

        if (!media) {
            return null;
        }


        if (typeof media === "string") {

            return {
                url: media,
                type: "image"
            };
        }


        return {
            url: firstDefined(
                media.url,
                media.media_url,
                media.file_url,
                media.fileUrl,
                media.src
            ) || "",

            type: firstDefined(
                media.type,
                media.mime_type,
                media.mimeType
            ) || "",

            name: firstDefined(
                media.name,
                media.file_name,
                media.filename
            ) || ""
        };
    }


    function extractWorkMedia(work) {

        const media = [];


        /*
         * New backend media array.
         */
        if (Array.isArray(work.media)) {

            work.media.forEach(item => {

                const normalized =
                    normalizeMedia(item);

                if (normalized) {
                    media.push(normalized);
                }

            });
        }


        /*
         * Alternative backend names.
         */
        if (Array.isArray(work.media_files)) {

            work.media_files.forEach(item => {

                const normalized =
                    normalizeMedia(item);

                if (normalized) {
                    media.push(normalized);
                }

            });
        }


        if (Array.isArray(work.files)) {

            work.files.forEach(item => {

                const normalized =
                    normalizeMedia(item);

                if (normalized) {
                    media.push(normalized);
                }

            });
        }


        /*
         * Backwards compatibility with old image URL data.
         */
        const oldImage =
            firstDefined(
                work.image,
                work.image_url,
                work.cover_image,
                work.cover_image_url,
                work.thumbnail
            );


        if (
            oldImage &&
            !media.some(
                item =>
                    item.url === oldImage
            )
        ) {

            media.push({
                url: oldImage,
                type: "image"
            });
        }


        return media;
    }


    /* =====================================================
       NORMALIZE WORK
    ===================================================== */

    function normalizeWork(work) {

        work = work || {};


        const published =
            work.published !== undefined
                ? Boolean(work.published)

                : work.is_published !== undefined
                    ? Boolean(work.is_published)

                    : work.status
                        ? String(
                            work.status
                        ).toLowerCase() ===
                          "published"

                        : true;


        return {

            id: firstDefined(
                work.id,
                work._id,
                work.work_id,
                work.project_id
            ) || (
                "work-" +
                Date.now() +
                "-" +
                Math.random()
            ),


            title: firstDefined(
                work.title,
                work.name,
                work.project_title
            ) || "Untitled Project",


            category: firstDefined(
                work.category,
                work.type
            ) || "Other",


            description: firstDefined(
                work.description,
                work.details
            ) || "",


            media:
                extractWorkMedia(work),


            status:
                published
                    ? "published"
                    : "draft",


            published,


            price: firstDefined(
                work.price,
                work.amount,
                work.project_value
            ) || 0,


            client: firstDefined(
                work.client,
                work.client_name,
                work.company,
                work.company_name
            ) || "",


            completionDate: firstDefined(
                work.completionDate,
                work.completion_date,
                work.completed_at
            ) || "",


            createdAt: firstDefined(
                work.createdAt,
                work.created_at
            ) || new Date().toISOString(),


            updatedAt: firstDefined(
                work.updatedAt,
                work.updated_at
            ) || new Date().toISOString()
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
                    unwrapData(response) ||
                    response;
            }

            else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.getCurrentUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubAuth.getCurrentUser();

            }

            else if (
                window.ServiceHubApp &&
                typeof ServiceHubApp.getCurrentUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubApp.getCurrentUser();

            }

            else if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getCurrentDevUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubAPI.getCurrentDevUser();

            }

            else {

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
            ) || "ServiceHub User";


        const role =
            firstDefined(
                user.role,
                user.user_type,
                user.account_type,
                user.type
            ) || "Provider";


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
                    `<img
                        src="${escapeHTML(avatar)}"
                        alt="Profile"
                    >`;

            } else {

                sidebarAvatar.innerHTML =
                    `<span>
                        ${escapeHTML(initials)}
                    </span>`;
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
                    `<img
                        src="${escapeHTML(avatar)}"
                        alt="Profile"
                    >`;

            } else {

                topbarAvatar.innerHTML =
                    `<span>
                        ${escapeHTML(initials)}
                    </span>`;
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
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getWork ===
                    "function"
            ) {

                const response =
                    await ServiceHubAPI.getWork();


                state.work =
                    extractArray(response)
                        .map(normalizeWork);
            }

        } catch (error) {

            console.error(
                "ServiceHub Work: load error",
                error
            );


            showAlert(
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
                        project.title || ""
                    ).toLowerCase();


                const description =
                    String(
                        project.description || ""
                    ).toLowerCase();


                const category =
                    String(
                        project.category || ""
                    ).toLowerCase();


                const client =
                    String(
                        project.client || ""
                    ).toLowerCase();


                const matchesSearch =
                    !search ||
                    title.includes(search) ||
                    description.includes(search) ||
                    category.includes(search) ||
                    client.includes(search);


                const matchesStatus =
                    status === "all" ||

                    (
                        status === "published" &&
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
            total - published;


        const withMedia =
            state.work.filter(
                project =>
                    Array.isArray(
                        project.media
                    ) &&
                    project.media.length > 0
            ).length;


        if ($("totalWork")) {
            $("totalWork").textContent =
                total;
        }


        if ($("publishedWork")) {
            $("publishedWork").textContent =
                published;
        }


        if ($("draftWork")) {
            $("draftWork").textContent =
                drafts;
        }


        if ($("workWithImages")) {
            $("workWithImages").textContent =
                withMedia;
        }
    }


    /* =====================================================
       ICON
    ===================================================== */

    function getWorkIcon(category) {

        const value =
            String(category || "")
                .toLowerCase();


        if (value.includes("design")) {
            return "bi-palette-fill";
        }


        if (
            value.includes("development") ||
            value.includes("software")
        ) {
            return "bi-code-slash";
        }


        if (value.includes("photo")) {
            return "bi-camera-fill";
        }


        if (value.includes("marketing")) {
            return "bi-megaphone-fill";
        }


        if (value.includes("writing")) {
            return "bi-pencil-fill";
        }


        if (value.includes("business")) {
            return "bi-building-fill";
        }


        if (value.includes("consult")) {
            return "bi-chat-square-text-fill";
        }


        return "bi-images";
    }


    /* =====================================================
       CARD MEDIA
    ===================================================== */

    function renderCardMedia(project) {

        const media =
            Array.isArray(project.media)
                ? project.media
                : [];


        const firstMedia =
            media[0];


        if (!firstMedia || !firstMedia.url) {

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
                firstMedia.type || ""
            ).toLowerCase();


        const isVideoMedia =
            type.includes("video") ||
            /\.(mp4|webm|mov|m4v)$/i.test(
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
       RENDER WORK
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
                .map(project => {

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


                    const client =
                        project.client
                            ? `
                                <span
                                    class="work-meta-item"
                                >
                                    <i class="bi bi-person-fill"></i>
                                    ${escapeHTML(
                                        project.client
                                    )}
                                </span>
                            `
                            : "";


                    const date =
                        project.completionDate
                            ? `
                                <span
                                    class="work-meta-item"
                                >
                                    <i class="bi bi-calendar3"></i>
                                    ${escapeHTML(
                                        formatDate(
                                            project.completionDate
                                        )
                                    )}
                                </span>
                            `
                            : "";


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

                                    ${client}

                                    ${date}

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
                })
                .join("");
    }


    function renderAll() {

        renderStats();

        renderWork();
    }


    /* =====================================================
       MEDIA PREVIEW
    ===================================================== */

    function renderSelectedMedia() {

        const container =
            $("workMediaPreview");


        if (!container) {
            return;
        }


        container.innerHTML =
            "";


        if (!state.selectedMedia.length) {
            return;
        }


        state.selectedMedia.forEach(
            (file, index) => {

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


                let mediaHTML = "";


                if (isImage(file)) {

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


    function addSelectedFiles(files) {

        const incoming =
            Array.from(
                files || []
            );


        if (!incoming.length) {
            return;
        }


        let added = 0;


        incoming.forEach(file => {

            if (!isAllowedMedia(file)) {

                showAlert(
                    `${file.name} is not a supported image or video.`,
                    "danger"
                );

                return;
            }


            /*
             * 100 MB frontend safety limit.
             * We can change this when backend storage
             * limits are decided.
             */
            const maxSize =
                100 * 1024 * 1024;


            if (file.size > maxSize) {

                showAlert(
                    `${file.name} is larger than 100 MB.`,
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
        });


        if (added > 0) {
            renderSelectedMedia();
        }
    }


    function removeSelectedMedia(index) {

        if (
            index < 0 ||
            index >= state.selectedMedia.length
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
       FILE UPLOAD EVENTS
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


                /*
                 * Allows selecting the same
                 * file again later.
                 */
                input.value = "";
            }
        );


        /*
         * Drag and drop.
         */
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


        /*
         * Remove selected media.
         */
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


        $("workDate").value =
            project?.completionDate
                ? String(
                    project.completionDate
                ).slice(0, 10)
                : "";


        $("workDescription").value =
            project?.description || "";


        /*
         * There is intentionally NO:
         *
         * workImage
         * image URL
         * image_url
         *
         * New media comes from
         * workMediaInput.
         */


        $("workPrice").value =
            project?.price || "";


        $("workClient").value =
            project?.client || "";


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


        /*
         * If the HTML does not have the container yet,
         * create it directly after the upload preview.
         */
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

                if (!media.url) {
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
                        media.type || ""
                    ).toLowerCase();


                const video =
                    type.includes(
                        "video"
                    ) ||
                    /\.(mp4|webm|mov|m4v)$/i.test(
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
       SAVE
    ===================================================== */

    async function saveWork(event) {

        event.preventDefault();


        const title =
            $("workTitle")
                .value
                .trim();


        const description =
            $("workDescription")
                .value
                .trim();


        if (!title || !description) {

            showAlert(
                "Please enter the project title and description.",
                "danger"
            );


            return;
        }


        /*
         * New projects require at least
         * one real media file.
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


        const existing =
            state.work.find(
                project =>
                    String(project.id) ===
                    String(state.editingId)
            );


        const published =
            $("workPublished").checked;


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
             * =================================================
             * BACKEND CREATE
             * =================================================
             *
             * If createWork exists, send actual files
             * through FormData.
             */
            if (
                !state.editingId &&
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.createWork ===
                    "function"
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
                    "client_name",
                    $("workClient").value.trim()
                );


                formData.append(
                    "completion_date",
                    $("workDate").value || ""
                );


                formData.append(
                    "published",
                    String(published)
                );


                /*
                 * IMPORTANT:
                 *
                 * "media" is the backend field
                 * that will receive the files.
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
                    await ServiceHubAPI.createWork(
                        formData
                    );


                const created =
                    normalizeWork(
                        unwrapData(
                            response
                        )
                    );


                state.work.unshift(
                    created
                );
            }


            /*
             * =================================================
             * BACKEND UPDATE
             * =================================================
             */
            else if (
                state.editingId &&
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateWork ===
                    "function"
            ) {

                /*
                 * Use FormData because an edited
                 * project may have new media.
                 */
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
                    "client_name",
                    $("workClient").value.trim()
                );


                formData.append(
                    "completion_date",
                    $("workDate").value || ""
                );


                formData.append(
                    "published",
                    String(published)
                );


                /*
                 * Only newly selected files are
                 * appended during an edit.
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


                const updated =
                    normalizeWork(
                        unwrapData(
                            response
                        )
                    );


                const index =
                    state.work.findIndex(
                        project =>
                            String(project.id) ===
                            String(
                                state.editingId
                            )
                    );


                if (index !== -1) {

                    state.work[index] =
                        updated;
                }
            }


            /*
             * =================================================
             * FRONTEND MOCK MODE
             * =================================================
             *
             * There is no permanent file storage yet.
             * Files remain available for this page session.
             */
            else {

                const media =
                    state.selectedMedia.map(
                        file => {

                            return {
                                url:
                                    URL.createObjectURL(
                                        file
                                    ),

                                type:
                                    file.type,

                                name:
                                    file.name,

                                size:
                                    file.size,

                                file
                            };
                        }
                    );


                /*
                 * Keep existing media if editing
                 * and no replacement was selected.
                 */
                const finalMedia =
                    media.length
                        ? media
                        : (
                            existing?.media ||
                            []
                        );


                const workData = {

                    id:
                        state.editingId ||
                        "local-work-" +
                        Date.now(),

                    title,

                    category:
                        $("workCategory").value ||
                        "Other",

                    description,

                    price:
                        Number(
                            $("workPrice").value
                        ) || 0,

                    client:
                        $("workClient")
                            .value
                            .trim(),

                    completionDate:
                        $("workDate").value ||
                        "",

                    published,

                    status:
                        published
                            ? "published"
                            : "draft",

                    media:
                        finalMedia,

                    createdAt:
                        existing?.createdAt ||
                        new Date().toISOString(),

                    updatedAt:
                        new Date().toISOString()
                };


                if (
                    state.editingId &&
                    existing
                ) {

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


                    if (index !== -1) {

                        state.work[index] =
                            normalizeWork(
                                workData
                            );
                    }

                } else {

                    state.work.unshift(
                        normalizeWork(
                            workData
                        )
                    );
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
       DELETE
    ===================================================== */

    async function deleteWork(id) {

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

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.deleteWork ===
                    "function"
            ) {

                await ServiceHubAPI.deleteWork(
                    id
                );
            }


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
                "Unable to delete this project.",
                "danger"
            );
        }
    }


    /* =====================================================
       DESCRIPTION COUNT
    ===================================================== */

    function updateDescriptionCount() {

        const textarea =
            $("workDescription");


        const counter =
            $("workDescriptionCount");


        if (!textarea || !counter) {
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

            }

            else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.logout ===
                    "function"
            ) {

                await ServiceHubAuth.logout();

            }

            else if (
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
                        action === "edit"
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
                        action === "delete"
                    ) {

                        deleteWork(id);
                    }
                }
            );


        /*
         * Mobile sidebar.
         */
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


        /*
         * Escape modal.
         */
        document.addEventListener(
            "keydown",
            event => {

                if (
                    event.key === "Escape" &&
                    $("workModal")
                        ?.classList.contains(
                            "open"
                        )
                ) {

                    closeWorkModal();
                }
            }
        );


        /*
         * REAL FILE UPLOAD.
         */
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
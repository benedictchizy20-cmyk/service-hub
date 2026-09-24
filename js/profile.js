"use strict";

/* =========================================================
   SERVICEHUB PROFILE.JS
   DYNAMIC + INTERACTIVE PROFILE
   ========================================================= */

console.log("SERVICEHUB PROFILE.JS LOADED");


/* =========================================================
   PROFILE STATE
========================================================= */

const ProfileState = {

    profile: null,

    user: null,

    username: null,

    isPublic: false,

    isOwner: false,

    editing: false,

    relatedData: {

        services: [],

        work: [],

        reviews: []

    }

};


/* =========================================================
   DOM HELPER
========================================================= */

function $(id) {

    return document.getElementById(id);

}


function showElement(element) {

    if (element) {

        element.style.display = "";

    }

}


function hideElement(element) {

    if (element) {

        element.style.display = "none";

    }

}


function setText(id, value) {

    const element = $(id);

    if (element) {

        element.textContent =
            value ?? "";

    }

}


function escapeHTML(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }

    const div =
        document.createElement("div");

    div.textContent =
        String(value);

    return div.innerHTML;

}


function getInitials(name) {

    if (!name) {

        return "SH";

    }

    const words =
        String(name)
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (words.length === 1) {

        return words[0]
            .substring(0, 2)
            .toUpperCase();

    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();

}


/* =========================================================
   CURRENT USER
========================================================= */

async function getCurrentServiceHubUser() {

    try {

        if (
            typeof ServiceHubAPI !== "undefined"
        ) {

            if (
                typeof ServiceHubAPI.isMockMode ===
                "function" &&
                ServiceHubAPI.isMockMode()
            ) {

                const user =
                    ServiceHubAPI.getCurrentDevUser();

                if (user) {

                    return user;

                }

            }


            if (
                typeof ServiceHubAPI.getCurrentUser ===
                "function"
            ) {

                const response =
                    await ServiceHubAPI.getCurrentUser();

                if (
                    response &&
                    response.user
                ) {

                    return response.user;

                }

                if (response) {

                    return response;

                }

            }

        }

    } catch (error) {

        console.error(
            "SERVICEHUB PROFILE CURRENT USER ERROR:",
            error
        );

    }


    try {

        if (
            typeof ServiceHubAPI !== "undefined" &&
            typeof ServiceHubAPI.getCurrentUserSnapshot ===
            "function"
        ) {

            return ServiceHubAPI.getCurrentUserSnapshot();

        }

    } catch (error) {

        console.warn(
            "SERVICEHUB USER SNAPSHOT ERROR:",
            error
        );

    }


    return null;

}


/* =========================================================
   MODE
========================================================= */

function determineMode() {

    const params =
        new URLSearchParams(
            window.location.search
        );

    const requestedUsername =
        params.get("username");

    const user =
        ProfileState.user || {};

    const currentUsername =
        user.username ||
        "";


    if (requestedUsername) {

        ProfileState.isPublic =
            true;

        ProfileState.isOwner =
            false;

        ProfileState.username =
            requestedUsername
                .trim()
                .toLowerCase();

    } else {

        ProfileState.isPublic =
            false;

        ProfileState.isOwner =
            true;

        ProfileState.username =
            currentUsername;

    }

}


/* =========================================================
   LOADING / ERROR
========================================================= */

function showLoading() {

    showElement($("profileLoading"));

    hideElement($("profilePage"));

    hideElement($("profileError"));

}


function hideLoading() {

    hideElement(
        $("profileLoading")
    );

}


function showProfilePage() {

    hideElement(
        $("profileLoading")
    );

    hideElement(
        $("profileError")
    );

    showElement(
        $("profilePage")
    );

}


function showProfileError(
    title,
    message
) {

    hideElement(
        $("profileLoading")
    );

    hideElement(
        $("profilePage")
    );

    showElement(
        $("profileError")
    );

    setText(
        "errorTitle",
        title ||
        "Profile not found"
    );

    setText(
        "errorMessage",
        message ||
        "Your profile could not be loaded."
    );

}


/* =========================================================
   LOAD PROFILE
========================================================= */

async function loadProfile() {

    console.log(
        "SERVICEHUB PROFILE: LOADING..."
    );

    showLoading();


    try {

        const currentUser =
            await getCurrentServiceHubUser();


        if (currentUser) {

            ProfileState.user =
                currentUser;

        }


        determineMode();


        if (
            typeof ServiceHubAPI ===
            "undefined"
        ) {

            throw new Error(
                "ServiceHub API is not available."
            );

        }


        /* =====================================================
           PUBLIC PROFILE
        ===================================================== */

        if (ProfileState.isPublic) {

            if (!ProfileState.username) {

                throw new Error(
                    "No profile username was provided."
                );

            }


            const response =
                await ServiceHubAPI
                    .getPublicDevUserData(
                        ProfileState.username
                    );


            if (!response) {

                throw new Error(
                    "Profile not found."
                );

            }


            ProfileState.profile =
                response.profile ||
                null;

            ProfileState.user =
                response.user ||
                ProfileState.user;


            if (!ProfileState.profile) {

                throw new Error(
                    "Profile data not found."
                );

            }


            ProfileState.relatedData.services =
                Array.isArray(
                    response.services
                )
                    ? response.services
                    : [];


            ProfileState.relatedData.work =
                Array.isArray(
                    response.work
                )
                    ? response.work
                    : [];


            ProfileState.relatedData.reviews =
                Array.isArray(
                    response.reviews
                )
                    ? response.reviews
                    : [];


            try {

                if (
                    typeof ServiceHubAPI
                        .trackProfileView ===
                    "function"
                ) {

                    await ServiceHubAPI
                        .trackProfileView(
                            ProfileState.username
                        );

                }

            } catch (error) {

                console.warn(
                    "PROFILE VIEW TRACKING FAILED:",
                    error
                );

            }

        }


        /* =====================================================
           OWNER PROFILE
        ===================================================== */

        else {

            if (!ProfileState.user) {

                throw new Error(
                    "No authenticated user was found. Please log in again."
                );

            }


            const response =
                await ServiceHubAPI
                    .getProfile();


            if (!response) {

                throw new Error(
                    "Profile could not be loaded."
                );

            }


            ProfileState.profile =
                response.profile ||
                null;

            ProfileState.user =
                response.user ||
                ProfileState.user;


            if (!ProfileState.profile) {

                throw new Error(
                    "Profile data not found."
                );

            }


            await loadRelatedData();

        }


        renderEverything();

        setupAllControls();

        showProfilePage();


        console.log(
            "SERVICEHUB PROFILE LOADED SUCCESSFULLY"
        );


    } catch (error) {

        console.error(
            "SERVICEHUB PROFILE ERROR:",
            error
        );


        showProfileError(
            "Unable to load profile",
            error.message ||
            "Your profile could not be loaded."
        );

    }

}


/* =========================================================
   LOAD RELATED DATA
========================================================= */

async function loadRelatedData() {

    if (
        typeof ServiceHubAPI ===
        "undefined"
    ) {

        return;

    }


    /* SERVICES */

    try {

        if (
            typeof ServiceHubAPI.getServices ===
            "function"
        ) {

            const response =
                await ServiceHubAPI.getServices();

            ProfileState.relatedData.services =
                Array.isArray(
                    response?.services
                )
                    ? response.services
                    : [];

        }

    } catch (error) {

        console.warn(
            "PROFILE SERVICES LOAD ERROR:",
            error
        );

        ProfileState.relatedData.services = [];

    }


    /* WORK */

    try {

        if (
            typeof ServiceHubAPI.getWork ===
            "function"
        ) {

            const response =
                await ServiceHubAPI.getWork();

            ProfileState.relatedData.work =
                Array.isArray(
                    response?.work
                )
                    ? response.work
                    : [];

        }

    } catch (error) {

        console.warn(
            "PROFILE WORK LOAD ERROR:",
            error
        );

        ProfileState.relatedData.work = [];

    }


    /* REVIEWS */

    try {

        if (
            typeof ServiceHubAPI.getReviews ===
            "function"
        ) {

            const response =
                await ServiceHubAPI.getReviews();

            ProfileState.relatedData.reviews =
                Array.isArray(
                    response?.reviews
                )
                    ? response.reviews
                    : [];

        }

    } catch (error) {

        console.warn(
            "PROFILE REVIEWS LOAD ERROR:",
            error
        );

        ProfileState.relatedData.reviews = [];

    }

}


/* =========================================================
   RENDER EVERYTHING
========================================================= */

function renderEverything() {

    renderProfile();

    renderServices(
        ProfileState.relatedData.services
    );

    renderWork(
        ProfileState.relatedData.work
    );

    renderReviews(
        ProfileState.relatedData.reviews
    );

    renderHowIWork(
        ProfileState.profile
    );

    renderProfileCompletion();

    updateSidebar();

    updateTopbar();

}


/* =========================================================
   MAIN PROFILE
========================================================= */

function renderProfile() {

    const profile =
        ProfileState.profile || {};

    const user =
        ProfileState.user || {};


    const fullName =
        profile.full_name ||
        user.full_name ||
        "Service Provider";


    const profession =
        profile.profession ||
        "Service Provider";


    const location =
        profile.location ||
        "";


    const category =
        profile.category ||
        user.profile_type ||
        "Professional";


    const rating =
        Number(
            profile.rating ||
            profile.average_rating ||
            0
        );


    const reviewCount =
        Number(
            profile.review_count ||
            profile.reviews_count ||
            ProfileState.relatedData.reviews.length ||
            0
        );


    setText(
        "profileName",
        fullName
    );


    setText(
        "profileProfession",
        profession
    );


    setText(
        "profileLocation",
        location ||
        "Location not provided"
    );


    setText(
        "profileCategory",
        category
    );


    setText(
        "ratingValue",
        rating.toFixed(1)
    );


    setText(
        "reviewCount",
        `${reviewCount} ${
            reviewCount === 1
                ? "review"
                : "reviews"
        }`
    );


    renderRatingStars(
        rating
    );


    renderProfilePicture(
        profile,
        fullName
    );


    renderCoverImage(
        profile
    );


    renderPublishedBadge(
        profile
    );


    renderAbout(
        profile
    );


    renderContactDetails(
        profile,
        user
    );


    renderLocationDetails(
        profile
    );


    renderWorkingHours(
        profile
    );


    renderSocialLinks(
        profile
    );


    renderPublicProfileCard(
        profile,
        fullName
    );

}


/* =========================================================
   PROFILE PICTURE
========================================================= */

function renderProfilePicture(
    profile,
    fullName
) {

    const wrapper =
        $("profilePicture");

    const image =
        $("profilePictureImage");

    const initials =
        $("profileInitials");


    if (!wrapper) {

        return;

    }


    const imageUrl =
        profile.profile_image ||
        "";


    const userInitials =
        getInitials(fullName);


    if (initials) {

        initials.textContent =
            userInitials;

    }


    if (
        image &&
        imageUrl
    ) {

        image.src =
            imageUrl;

        image.alt =
            `${fullName} profile picture`;

        image.style.display =
            "block";

        wrapper.classList.add(
            "has-profile-image"
        );


        if (initials) {

            initials.style.display =
                "none";

        }


        image.onerror =
            function () {

                image.style.display =
                    "none";

                wrapper.classList.remove(
                    "has-profile-image"
                );


                if (initials) {

                    initials.style.display =
                        "flex";

                }

            };

    } else {

        if (image) {

            image.src =
                "";

            image.style.display =
                "none";

        }


        wrapper.classList.remove(
            "has-profile-image"
        );


        if (initials) {

            initials.style.display =
                "flex";

        }

    }


    renderSmallAvatar(
        $("sidebarAvatar"),
        profile,
        fullName
    );


    renderSmallAvatar(
        $("topbarProfileAvatar"),
        profile,
        fullName
    );

}


/* =========================================================
   SMALL AVATAR
========================================================= */

function renderSmallAvatar(
    element,
    profile,
    fullName
) {

    if (!element) {

        return;

    }


    const imageUrl =
        profile.profile_image ||
        "";


    const initials =
        getInitials(fullName);


    if (imageUrl) {

        element.innerHTML = `
            <img
                src="${escapeHTML(imageUrl)}"
                alt="${escapeHTML(fullName)}"
            >
        `;

    } else {

        element.innerHTML = `
            <span>
                ${escapeHTML(initials)}
            </span>
        `;

    }

}


/* =========================================================
   COVER
========================================================= */

function renderCoverImage(
    profile
) {

    const cover =
        $("profileCover");

    if (!cover) {

        return;

    }


    const coverImage =
        profile.cover_image ||
        "";


    if (coverImage) {

        cover.style.backgroundImage =
            `url("${coverImage}")`;

    } else {

        cover.style.backgroundImage =
            "";

    }

}


/* =========================================================
   PUBLISHED
========================================================= */

function renderPublishedBadge(
    profile
) {

    const badge =
        $("publishedBadge");

    if (!badge) {

        return;

    }


    const published =
        profile.published === true;


    badge.style.display =
        "inline-flex";


    badge.innerHTML =
        published
            ? `
                <i class="bi bi-check-circle-fill"></i>
                Published
              `
            : `
                <i class="bi bi-eye-slash-fill"></i>
                Not Published
              `;

}


/* =========================================================
   RATING
========================================================= */

function renderRatingStars(
    rating
) {

    const stars =
        $("ratingStars");

    if (!stars) {

        return;

    }


    const rounded =
        Math.max(
            0,
            Math.min(
                5,
                Math.round(
                    Number(rating) || 0
                )
            )
        );


    stars.textContent =
        "★".repeat(rounded) +
        "☆".repeat(5 - rounded);

}


/* =========================================================
   ABOUT
========================================================= */

function renderAbout(
    profile
) {

    const container =
        $("aboutContent");

    if (!container) {

        return;

    }


    const bio =
        profile.bio ||
        "";


    if (!bio) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-person-lines-fill"></i>
                <p>
                    No profile description has been added yet.
                </p>
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="profile-text-content">
            ${escapeHTML(bio).replace(/\n/g, "<br>")}
        </div>
    `;

}


/* =========================================================
   SERVICES
========================================================= */

function renderServices(
    services
) {

    const container =
        $("servicesList");

    if (!container) {

        return;

    }


    if (
        !Array.isArray(services) ||
        services.length === 0
    ) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-briefcase"></i>
                <p>No services have been added yet.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        services.map(
            function(service) {

                const name =
                    service.name ||
                    service.title ||
                    "Service";


                const description =
                    service.description ||
                    "";


                const price =
                    service.price ||
                    service.amount ||
                    "";


                return `
                    <div
                        class="profile-service-item"
                        data-service-id="${escapeHTML(
                            service.id || ""
                        )}"
                    >

                        <div class="profile-service-icon">
                            <i class="bi bi-check2-circle"></i>
                        </div>

                        <div class="profile-service-content">

                            <h4>
                                ${escapeHTML(name)}
                            </h4>

                            ${
                                description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                            ${
                                price
                                    ? `
                                        <span class="profile-service-price">
                                            ${escapeHTML(
                                                String(price)
                                            )}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   WORK
========================================================= */

function renderWork(
    workItems
) {

    const container =
        $("workList");

    if (!container) {

        return;

    }


    if (
        !Array.isArray(workItems) ||
        workItems.length === 0
    ) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-images"></i>
                <p>No completed work has been added yet.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        workItems.map(
            function(item, index) {

                const title =
                    item.title ||
                    "Completed Work";


                const description =
                    item.description ||
                    "";


                const image =
                    item.image ||
                    item.image_url ||
                    "";


                return `
                    <article
                        class="profile-work-item"
                        data-work-index="${index}"
                        role="${
                            image
                                ? "button"
                                : ""
                        }"
                        tabindex="${
                            image
                                ? "0"
                                : "-1"
                        }"
                    >

                        ${
                            image
                                ? `
                                    <div class="profile-work-image">
                                        <img
                                            src="${escapeHTML(image)}"
                                            alt="${escapeHTML(title)}"
                                        >
                                    </div>
                                `
                                : `
                                    <div class="profile-work-image profile-work-placeholder">
                                        <i class="bi bi-image"></i>
                                    </div>
                                `
                        }

                        <div class="profile-work-content">

                            <h4>
                                ${escapeHTML(title)}
                            </h4>

                            ${
                                description
                                    ? `
                                        <p>
                                            ${escapeHTML(
                                                description
                                            )}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </article>
                `;

            }
        ).join("");


    setupWorkPreview();

}


/* =========================================================
   WORK PREVIEW
========================================================= */

function setupWorkPreview() {

    document
        .querySelectorAll(
            ".profile-work-item[data-work-index]"
        )
        .forEach(
            function(item) {

                const index =
                    Number(
                        item.dataset.workIndex
                    );


                const work =
                    ProfileState
                        .relatedData
                        .work[index];


                if (
                    !work ||
                    !(
                        work.image ||
                        work.image_url
                    )
                ) {

                    return;

                }


                item.addEventListener(
                    "click",
                    function() {

                        openImagePreview(
                            work
                        );

                    }
                );


                item.addEventListener(
                    "keydown",
                    function(event) {

                        if (
                            event.key ===
                            "Enter"
                        ) {

                            openImagePreview(
                                work
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   IMAGE PREVIEW
========================================================= */

function openImagePreview(
    work
) {

    const image =
        $("imagePreview");

    const title =
        $("imagePreviewTitle");

    const description =
        $("imagePreviewDescription");


    if (image) {

        image.src =
            work.image ||
            work.image_url ||
            "";

    }


    setText(
        "imagePreviewTitle",
        work.title ||
        "Work Preview"
    );


    setText(
        "imagePreviewDescription",
        work.description ||
        ""
    );


    const modalElement =
        $("imagePreviewModal");


    if (
        modalElement &&
        typeof bootstrap !==
        "undefined"
    ) {

        bootstrap.Modal
            .getOrCreateInstance(
                modalElement
            )
            .show();

    }

}


/* =========================================================
   HOW I WORK
========================================================= */

function renderHowIWork(
    profile
) {

    const container =
        $("howWorkContent");

    if (!container) {

        return;

    }


    const content =
        profile.how_i_work ||
        "";


    if (!content) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-list-check"></i>
                <p>No information has been added yet.</p>
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="profile-text-content">
            ${escapeHTML(content).replace(/\n/g, "<br>")}
        </div>
    `;

}


/* =========================================================
   REVIEWS
========================================================= */

function renderReviews(
    reviews
) {

    const summary =
        $("reviewsSummary");

    const list =
        $("reviewsList");


    const profileRating =
        Number(
            ProfileState.profile?.rating ||
            ProfileState.profile?.average_rating ||
            0
        );


    if (summary) {

        summary.innerHTML = `
            <div class="profile-review-score">

                <strong>
                    ${profileRating.toFixed(1)}
                </strong>

                <div>

                    <div class="profile-review-stars">

                        ${"★".repeat(
                            Math.round(
                                profileRating
                            )
                        )}

                        ${"☆".repeat(
                            Math.max(
                                0,
                                5 -
                                Math.round(
                                    profileRating
                                )
                            )
                        )}

                    </div>

                    <span>
                        ${reviews.length}
                        ${
                            reviews.length === 1
                                ? "review"
                                : "reviews"
                        }
                    </span>

                </div>

            </div>
        `;

    }


    if (!list) {

        return;

    }


    if (
        !Array.isArray(reviews) ||
        reviews.length === 0
    ) {

        list.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-chat-square-text"></i>
                <p>No reviews yet.</p>
            </div>
        `;

        return;

    }


    list.innerHTML =
        reviews.map(
            function(review) {

                const name =
                    review.customer_name ||
                    review.name ||
                    "Customer";


                const comment =
                    review.comment ||
                    review.message ||
                    "";


                const rating =
                    Number(
                        review.rating ||
                        5
                    );


                return `
                    <div class="profile-review-item">

                        <div class="profile-review-avatar">
                            ${escapeHTML(
                                getInitials(name)
                            )}
                        </div>

                        <div class="profile-review-content">

                            <div class="profile-review-header">

                                <strong>
                                    ${escapeHTML(name)}
                                </strong>

                                <span>
                                    ${"★".repeat(
                                        Math.round(rating)
                                    )}
                                </span>

                            </div>

                            ${
                                comment
                                    ? `
                                        <p>
                                            ${escapeHTML(comment)}
                                        </p>
                                    `
                                    : ""
                            }

                        </div>

                    </div>
                `;

            }
        ).join("");

}


/* =========================================================
   CONTACT DETAILS
========================================================= */

function renderContactDetails(
    profile,
    user
) {

    const container =
        $("contactDetails");

    if (!container) {

        return;

    }


    const phone =
        profile.phone ||
        "";


    const whatsapp =
        profile.whatsapp ||
        phone;


    const email =
        profile.email ||
        user.email ||
        "";


    const website =
        profile.website ||
        "";


    const items = [];


    if (phone) {

        items.push(`
            <div
                class="profile-contact-item profile-contact-clickable"
                data-contact-type="phone"
                data-contact-value="${escapeHTML(phone)}"
            >
                <div class="profile-contact-icon">
                    <i class="bi bi-telephone"></i>
                </div>

                <div>
                    <small>Phone</small>
                    <strong>
                        ${escapeHTML(phone)}
                    </strong>
                </div>
            </div>
        `);

    }


    if (whatsapp) {

        items.push(`
            <div
                class="profile-contact-item profile-contact-clickable"
                data-contact-type="whatsapp"
                data-contact-value="${escapeHTML(whatsapp)}"
            >
                <div class="profile-contact-icon">
                    <i class="bi bi-whatsapp"></i>
                </div>

                <div>
                    <small>WhatsApp</small>
                    <strong>
                        ${escapeHTML(whatsapp)}
                    </strong>
                </div>
            </div>
        `);

    }


    if (email) {

        items.push(`
            <div
                class="profile-contact-item profile-contact-clickable"
                data-contact-type="email"
                data-contact-value="${escapeHTML(email)}"
            >
                <div class="profile-contact-icon">
                    <i class="bi bi-envelope"></i>
                </div>

                <div>
                    <small>Email</small>
                    <strong>
                        ${escapeHTML(email)}
                    </strong>
                </div>
            </div>
        `);

    }


    if (website) {

        items.push(`
            <div
                class="profile-contact-item profile-contact-clickable"
                data-contact-type="website"
                data-contact-value="${escapeHTML(website)}"
            >
                <div class="profile-contact-icon">
                    <i class="bi bi-globe"></i>
                </div>

                <div>
                    <small>Website</small>
                    <strong>
                        ${escapeHTML(website)}
                    </strong>
                </div>
            </div>
        `);

    }


    if (!items.length) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-person-lines-fill"></i>
                <p>No contact information added.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        items.join("");


    setupContactDetailClicks();

}


/* =========================================================
   CONTACT DETAIL ACTIONS
========================================================= */

function setupContactDetailClicks() {

    document
        .querySelectorAll(
            ".profile-contact-clickable"
        )
        .forEach(
            function(element) {

                element.addEventListener(
                    "click",
                    function() {

                        const type =
                            element.dataset.contactType;

                        const value =
                            element.dataset.contactValue;


                        if (!value) {

                            return;

                        }


                        if (type === "phone") {

                            window.location.href =
                                `tel:${value}`;

                        }


                        if (type === "email") {

                            window.location.href =
                                `mailto:${value}`;

                        }


                        if (type === "website") {

                            let url =
                                value.trim();

                            if (
                                !/^https?:\/\//i
                                    .test(url)
                            ) {

                                url =
                                    "https://" +
                                    url;

                            }

                            window.open(
                                url,
                                "_blank"
                            );

                        }


                        if (
                            type ===
                            "whatsapp"
                        ) {

                            openWhatsApp(
                                value
                            );

                        }

                    }
                );

            }
        );

}


/* =========================================================
   LOCATION
========================================================= */

function renderLocationDetails(
    profile
) {

    setText(
        "mainLocation",
        profile.location ||
        "Not provided"
    );


    setText(
        "serviceArea",
        profile.service_area ||
        "Not specified"
    );

}


/* =========================================================
   WORKING HOURS
========================================================= */

function renderWorkingHours(
    profile
) {

    const container =
        $("workingHours");

    if (!container) {

        return;

    }


    const hours =
        profile.working_hours ||
        "";


    if (!hours) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-clock"></i>
                <p>Working hours not provided.</p>
            </div>
        `;

        return;

    }


    container.innerHTML = `
        <div class="profile-text-content">
            ${escapeHTML(hours).replace(/\n/g, "<br>")}
        </div>
    `;

}


/* =========================================================
   SOCIAL LINKS
========================================================= */

function renderSocialLinks(
    profile
) {

    const container =
        $("socialLinks");

    if (!container) {

        return;

    }


    const social = [

        {
            key: "instagram",
            icon: "bi-instagram",
            label: "Instagram"
        },

        {
            key: "facebook",
            icon: "bi-facebook",
            label: "Facebook"
        },

        {
            key: "tiktok",
            icon: "bi-tiktok",
            label: "TikTok"
        },

        {
            key: "linkedin",
            icon: "bi-linkedin",
            label: "LinkedIn"
        }

    ];


    const links = [];


    social.forEach(
        function(item) {

            const url =
                profile[item.key];


            if (!url) {

                return;

            }


            let safeUrl =
                String(url).trim();


            if (
                !/^https?:\/\//i
                    .test(safeUrl)
            ) {

                safeUrl =
                    "https://" +
                    safeUrl;

            }


            links.push(`
                <a
                    href="${escapeHTML(safeUrl)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="profile-social-link"
                    title="${escapeHTML(item.label)}"
                >
                    <i class="bi ${item.icon}"></i>
                </a>
            `);

        }
    );


    if (!links.length) {

        container.innerHTML = `
            <div class="dashboard-empty">
                <i class="bi bi-share"></i>
                <p>No social links added.</p>
            </div>
        `;

        return;

    }


    container.innerHTML =
        links.join("");

}


/* =========================================================
   PUBLIC PROFILE CARD
========================================================= */

function renderPublicProfileCard(
    profile,
    fullName
) {

    setText(
        "publicPageName",
        fullName
    );


    const username =
        profile.username ||
        ProfileState.username;


    if (!username) {

        return;

    }


    const publicUrl =
        buildPublicProfileUrl(
            username
        );


    const urlElement =
        $("publicProfileUrl");


    if (urlElement) {

        urlElement.textContent =
            publicUrl;

        urlElement.dataset.url =
            publicUrl;

    }

}


/* =========================================================
   PUBLIC PROFILE URL
========================================================= */

function buildPublicProfileUrl(
    username
) {

    if (
        typeof ServiceHubAPI !==
        "undefined" &&
        typeof ServiceHubAPI
            .getPublicProfileUrl ===
        "function"
    ) {

        return ServiceHubAPI
            .getPublicProfileUrl(
                username
            );

    }


    return (
        `${window.location.origin}` +
        `${window.location.pathname}` +
        `?username=${encodeURIComponent(
            username || ""
        )}`
    );

}


function getPublicProfileUrl() {

    const element =
        $("publicProfileUrl");


    if (
        element &&
        element.dataset.url
    ) {

        return element.dataset.url;

    }


    return buildPublicProfileUrl(
        ProfileState.profile?.username ||
        ProfileState.username
    );

}


/* =========================================================
   PROFILE COMPLETION
========================================================= */

function calculateProfileCompletion() {

    const profile =
        ProfileState.profile || {};

    const user =
        ProfileState.user || {};


    const fields = [

        profile.full_name ||
        user.full_name,

        profile.profession,

        profile.category,

        profile.bio,

        profile.phone,

        profile.location,

        profile.service_area,

        profile.working_hours,

        profile.profile_image,

        profile.cover_image,

        profile.how_i_work,

        profile.instagram ||
        profile.facebook ||
        profile.tiktok ||
        profile.linkedin

    ];


    const completed =
        fields.filter(
            function(value) {

                return Boolean(
                    String(
                        value || ""
                    ).trim()
                );

            }
        ).length;


    return Math.round(
        (
            completed /
            fields.length
        ) * 100
    );

}


function renderProfileCompletion() {

    const percentage =
        calculateProfileCompletion();


    let existing =
        document.getElementById(
            "profileCompletionCard"
        );


    if (!existing) {

        const ownerCard =
            $("profileOwnerCard");

        if (!ownerCard) {

            return;

        }


        existing =
            document.createElement(
                "div"
            );


        existing.id =
            "profileCompletionCard";

        existing.className =
            "profile-completion-inline";


        ownerCard.appendChild(
            existing
        );

    }


    const profile =
        ProfileState.profile || {};


    const missing = [];


    if (!profile.bio) {

        missing.push("bio");

    }

    if (!profile.phone) {

        missing.push("phone");

    }

    if (!profile.location) {

        missing.push("location");

    }

    if (!profile.profile_image) {

        missing.push("profile photo");

    }

    if (!profile.working_hours) {

        missing.push("working hours");

    }


    existing.innerHTML = `
        <div class="profile-completion-header">

            <div>

                <span>
                    PROFILE COMPLETION
                </span>

                <strong>
                    ${percentage}%
                </strong>

            </div>

            <i class="bi bi-graph-up-arrow"></i>

        </div>

        <div class="profile-completion-track">

            <div
                class="profile-completion-bar"
                style="width:${percentage}%"
            ></div>

        </div>

        ${
            missing.length
                ? `
                    <small>
                        Complete your ${
                            missing
                                .slice(0, 3)
                                .join(", ")
                        }${
                            missing.length > 3
                                ? " and more"
                                : ""
                        }.
                    </small>
                `
                : `
                    <small>
                        Your profile is fully completed.
                    </small>
                `
        }
    `;

}


/* =========================================================
   OWNER CONTROLS
========================================================= */

function setupOwnerControls() {

    const card =
        $("profileOwnerCard");


    if (!card) {

        return;

    }


    if (!ProfileState.isOwner) {

        card.style.display =
            "none";

        return;

    }


    card.style.display =
        "";


    const publishButton =
        $("publishProfileButton");


    if (publishButton) {

        const published =
            ProfileState.profile?.published ===
            true;


        publishButton.innerHTML =
            published
                ? `
                    <i class="bi bi-eye-slash"></i>
                    Unpublish
                  `
                : `
                    <i class="bi bi-globe2"></i>
                    Publish Profile
                  `;


        publishButton.onclick =
            handlePublishToggle;

    }


    const editButton =
        $("editProfileButton");


    if (editButton) {

        editButton.onclick =
            openEditProfileModal;

    }

}


/* =========================================================
   EDIT PROFILE MODAL
========================================================= */

function createEditProfileModal() {

    if (
        $("serviceHubEditProfileModal")
    ) {

        return;

    }


    const modal =
        document.createElement("div");


    modal.id =
        "serviceHubEditProfileModal";


    modal.className =
        "sh-profile-edit-modal";


    modal.innerHTML = `

        <div class="sh-profile-edit-backdrop"></div>

        <div
            class="sh-profile-edit-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shEditProfileTitle"
        >

            <div class="sh-profile-edit-header">

                <div>

                    <span>
                        PROFILE SETTINGS
                    </span>

                    <h2 id="shEditProfileTitle">
                        Edit Your Profile
                    </h2>

                    <p>
                        Keep your ServiceHub profile
                        professional and up to date.
                    </p>

                </div>

                <button
                    type="button"
                    id="shEditProfileClose"
                    class="sh-profile-edit-close"
                    aria-label="Close"
                >
                    <i class="bi bi-x-lg"></i>
                </button>

            </div>


            <form id="shEditProfileForm">

                <div class="sh-profile-edit-body">

                    <div
                        id="shEditProfileAlert"
                        class="sh-profile-edit-alert"
                        style="display:none;"
                    ></div>


                    <!-- =================================================
                         BASIC INFORMATION
                    ================================================== -->

                    <div class="sh-edit-section">

                        <div class="sh-edit-section-title">
                            <i class="bi bi-person-circle"></i>
                            Basic Information
                        </div>


                        <div class="sh-edit-grid">

                            <div class="sh-edit-field">

                                <label for="editFullName">
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    id="editFullName"
                                    name="full_name"
                                    autocomplete="name"
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editProfession">
                                    Profession
                                </label>

                                <input
                                    type="text"
                                    id="editProfession"
                                    name="profession"
                                    placeholder="e.g. Graphic Designer"
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editCategory">
                                    Category
                                </label>

                                <input
                                    type="text"
                                    id="editCategory"
                                    name="category"
                                    placeholder="e.g. Design & Creative"
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editLocation">
                                    Location
                                </label>

                                <input
                                    type="text"
                                    id="editLocation"
                                    name="location"
                                    placeholder="e.g. Port Harcourt, Rivers"
                                >

                            </div>


                            <div class="sh-edit-field sh-edit-full">

                                <label for="editServiceArea">
                                    Service Area
                                </label>

                                <input
                                    type="text"
                                    id="editServiceArea"
                                    name="service_area"
                                    placeholder="e.g. Port Harcourt and surrounding areas"
                                >

                            </div>


                            <div class="sh-edit-field sh-edit-full">

                                <label for="editBio">
                                    About Me
                                </label>

                                <textarea
                                    id="editBio"
                                    name="bio"
                                    rows="5"
                                    placeholder="Tell customers about yourself, your experience and what makes your service special."
                                ></textarea>

                                <small>
                                    <span id="editBioCount">0</span>
                                    characters
                                </small>

                            </div>

                        </div>

                    </div>


                    <!-- =================================================
                         CONTACT INFORMATION
                    ================================================== -->

                    <div class="sh-edit-section">

                        <div class="sh-edit-section-title">
                            <i class="bi bi-telephone-fill"></i>
                            Contact Information
                        </div>


                        <div class="sh-edit-grid">

                            <div class="sh-edit-field">

                                <label for="editPhone">
                                    Phone
                                </label>

                                <input
                                    type="tel"
                                    id="editPhone"
                                    name="phone"
                                    placeholder="+234..."
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editWhatsapp">
                                    WhatsApp
                                </label>

                                <input
                                    type="tel"
                                    id="editWhatsapp"
                                    name="whatsapp"
                                    placeholder="+234..."
                                >

                            </div>


                            <!-- =================================================
                                 PRICE TAGS
                            ================================================== -->

                            <div class="sh-edit-field sh-edit-full">

                                <label>
                                    Price Tags
                                </label>

                                <div
                                    id="priceTagsContainer"
                                    class="sh-price-tags-container"
                                ></div>


                                <button
                                    type="button"
                                    id="addPriceTagButton"
                                    class="sh-price-tag-add-button"
                                >
                                    <i class="bi bi-plus-lg"></i>
                                    Add Price Tag
                                </button>


                                <small>
                                    Add the services you offer and their prices.
                                </small>


                                <!--
                                    This hidden field stores all price tags
                                    in JSON format so the existing profile
                                    save function can access them.
                                -->

                                <input
                                    type="hidden"
                                    id="editPriceTags"
                                    name="price_tags"
                                    value="[]"
                                >

                            </div>

                        </div>

                    </div>


                    <!-- =================================================
                         HOW I WORK
                    ================================================== -->

                    <div class="sh-edit-section">

                        <div class="sh-edit-section-title">
                            <i class="bi bi-list-check"></i>
                            How I Work
                        </div>


                        <div class="sh-edit-field">

                            <label for="editHowIWork">
                                Your Process
                            </label>

                            <textarea
                                id="editHowIWork"
                                name="how_i_work"
                                rows="5"
                                placeholder="Explain how customers work with you from start to finish."
                            ></textarea>

                        </div>

                    </div>


                    <!-- =================================================
                         WORKING HOURS
                    ================================================== -->

                    <div class="sh-edit-section">

                        <div class="sh-edit-section-title">
                            <i class="bi bi-clock-fill"></i>
                            Working Hours
                        </div>


                        <div class="sh-edit-field">

                            <label for="editWorkingHours">
                                Availability
                            </label>

                            <textarea
                                id="editWorkingHours"
                                name="working_hours"
                                rows="4"
                                placeholder="Monday - Friday: 8:00 AM - 6:00 PM&#10;Saturday: 9:00 AM - 3:00 PM"
                            ></textarea>

                        </div>

                    </div>


                    <!-- =================================================
                         SOCIAL LINKS
                    ================================================== -->

                    <div class="sh-edit-section">

                        <div class="sh-edit-section-title">
                            <i class="bi bi-share-fill"></i>
                            Social Links
                        </div>


                        <div class="sh-edit-grid">

                            <div class="sh-edit-field">

                                <label for="editInstagram">
                                    Instagram
                                </label>

                                <input
                                    type="url"
                                    id="editInstagram"
                                    name="instagram"
                                    placeholder="https://instagram.com/..."
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editFacebook">
                                    Facebook
                                </label>

                                <input
                                    type="url"
                                    id="editFacebook"
                                    name="facebook"
                                    placeholder="https://facebook.com/..."
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editTikTok">
                                    TikTok
                                </label>

                                <input
                                    type="url"
                                    id="editTikTok"
                                    name="tiktok"
                                    placeholder="https://tiktok.com/@..."
                                >

                            </div>


                            <div class="sh-edit-field">

                                <label for="editLinkedIn">
                                    LinkedIn
                                </label>

                                <input
                                    type="url"
                                    id="editLinkedIn"
                                    name="linkedin"
                                    placeholder="https://linkedin.com/in/..."
                                >

                            </div>

                        </div>

                    </div>

                </div>


                <!-- =====================================================
                     FOOTER
                ====================================================== -->

                <div class="sh-profile-edit-footer">

                    <button
                        type="button"
                        id="shEditProfileCancel"
                        class="sh-edit-cancel"
                    >
                        Cancel
                    </button>


                    <button
                        type="submit"
                        id="shEditProfileSave"
                        class="sh-edit-save"
                    >

                        <span id="shEditSaveText">
                            Save Changes
                        </span>

                        <span
                            id="shEditSaveSpinner"
                            class="spinner-border spinner-border-sm"
                            style="display:none;"
                        ></span>

                    </button>

                </div>

            </form>

        </div>
    `;


    document.body.appendChild(
        modal
    );


    /* =========================================================
       PRICE TAG MANAGEMENT
    ========================================================= */

    const priceTagsContainer =
        $("priceTagsContainer");

    const addPriceTagButton =
        $("addPriceTagButton");

    const priceTagsInput =
        $("editPriceTags");


    function getPriceTags() {

        if (!priceTagsInput) {
            return [];
        }


        try {

            const value =
                priceTagsInput.value.trim();


            if (!value) {
                return [];
            }


            const parsed =
                JSON.parse(value);


            if (
                !Array.isArray(parsed)
            ) {

                return [];

            }


            return parsed;

        } catch (error) {

            console.warn(
                "SERVICEHUB PRICE TAGS: Invalid price tags data.",
                error
            );

            return [];

        }

    }


    function savePriceTags() {

        if (!priceTagsInput) {
            return;
        }


        const rows =
            priceTagsContainer
                ?.querySelectorAll(
                    ".sh-price-tag-row"
                );


        const priceTags = [];


        if (rows) {

            rows.forEach(function(row) {

                const serviceInput =
                    row.querySelector(
                        ".sh-price-tag-service"
                    );


                const priceInput =
                    row.querySelector(
                        ".sh-price-tag-price"
                    );


                const service =
                    serviceInput
                        ? serviceInput.value.trim()
                        : "";


                const price =
                    priceInput
                        ? priceInput.value.trim()
                        : "";


                if (
                    service ||
                    price
                ) {

                    priceTags.push({
                        service: service,
                        price: price
                    });

                }

            });

        }


        priceTagsInput.value =
            JSON.stringify(priceTags);

    }


    function removePriceTag(row) {

        if (!row) {
            return;
        }


        row.remove();


        savePriceTags();

    }


    function createPriceTagRow(
        service = "",
        price = ""
    ) {

        if (!priceTagsContainer) {
            return;
        }


        const row =
            document.createElement("div");


        row.className =
            "sh-price-tag-row";


        row.innerHTML = `

            <div class="sh-price-tag-input-group">

                <label>
                    Service
                </label>

                <input
                    type="text"
                    class="sh-price-tag-service"
                    placeholder="e.g. Logo Design"
                    value="${escapeHtml(service)}"
                >

            </div>


            <div class="sh-price-tag-input-group">

                <label>
                    Price
                </label>

                <input
                    type="text"
                    class="sh-price-tag-price"
                    placeholder="e.g. ₦25,000"
                    value="${escapeHtml(price)}"
                >

            </div>


            <button
                type="button"
                class="sh-price-tag-remove"
                aria-label="Remove price tag"
                title="Remove price tag"
            >
                <i class="bi bi-trash3"></i>
            </button>

        `;


        priceTagsContainer.appendChild(
            row
        );


        const serviceInput =
            row.querySelector(
                ".sh-price-tag-service"
            );


        const priceInput =
            row.querySelector(
                ".sh-price-tag-price"
            );


        const removeButton =
            row.querySelector(
                ".sh-price-tag-remove"
            );


        serviceInput?.addEventListener(
            "input",
            savePriceTags
        );


        priceInput?.addEventListener(
            "input",
            savePriceTags
        );


        removeButton?.addEventListener(
            "click",
            function() {

                removePriceTag(row);

            }
        );


        savePriceTags();

    }


    function renderPriceTags(
        priceTags
    ) {

        if (!priceTagsContainer) {
            return;
        }


        priceTagsContainer.innerHTML =
            "";


        if (
            !Array.isArray(priceTags) ||
            priceTags.length === 0
        ) {

            return;

        }


        priceTags.forEach(function(tag) {

            if (!tag) {
                return;
            }


            createPriceTagRow(
                tag.service || "",
                tag.price || ""
            );

        });


        savePriceTags();

    }


    function escapeHtml(value) {

        return String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    addPriceTagButton?.addEventListener(
        "click",
        function() {

            createPriceTagRow();

        }
    );


    /* =========================================================
       START WITH ONE EMPTY PRICE TAG
    ========================================================= */

    createPriceTagRow();


    /* =========================================================
       MODAL EVENTS
    ========================================================= */

    document.body.appendChild(
        modal
    );


    setupEditProfileModalEvents();

}

function injectEditProfileModalStyles() {

    if (
        $("shProfileEditModalStyles")
    ) {
        return;
    }


    const style =
        document.createElement("style");


    style.id =
        "shProfileEditModalStyles";


    style.textContent = `

        /* =====================================================
           SERVICEHUB EDIT PROFILE MODAL
           SCROLL FIX
        ===================================================== */

        #serviceHubEditProfileModal {

            position: fixed;

            inset: 0;

            width: 100%;
            height: 100%;

            z-index: 10000;

            display: none;

            align-items: center;
            justify-content: center;

            padding: 20px;

            box-sizing: border-box;

            overflow: hidden;

        }


        #serviceHubEditProfileModal.open {

            display: flex;

        }


        /* =====================================================
           BACKDROP
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-backdrop {

            position: absolute;

            inset: 0;

            background:
                rgba(23, 23, 23, 0.68);

            backdrop-filter:
                blur(3px);

            -webkit-backdrop-filter:
                blur(3px);

        }


        /* =====================================================
           MODAL DIALOG
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-dialog {

            position: relative;

            z-index: 2;

            width: 100%;

            max-width: 850px;

            max-height:
                calc(100vh - 40px);

            background: #ffffff;

            border-radius: 18px;

            display: flex;

            flex-direction: column;

            overflow: hidden;

            box-shadow:
                0 25px 70px
                rgba(0, 0, 0, 0.28);

        }


        /* =====================================================
           HEADER
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-header {

            flex: 0 0 auto;

            display: flex;

            align-items: flex-start;

            justify-content: space-between;

            gap: 20px;

            padding: 24px 28px;

            background: #ffffff;

            border-bottom:
                1px solid #e6e0d5;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-header span {

            display: block;

            margin-bottom: 5px;

            color: #c6a15b;

            font-size: 11px;

            font-weight: 700;

            letter-spacing: 1.5px;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-header h2 {

            margin: 0;

            color: #171717;

            font-size: 22px;

            font-weight: 700;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-header p {

            margin: 6px 0 0;

            color: #77736b;

            font-size: 13px;

            line-height: 1.5;

        }


        /* =====================================================
           CLOSE BUTTON
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-close {

            width: 40px;

            height: 40px;

            flex: 0 0 40px;

            display: flex;

            align-items: center;

            justify-content: center;

            border: none;

            border-radius: 50%;

            background: #f7f3eb;

            color: #171717;

            cursor: pointer;

            transition:
                all 0.2s ease;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-close:hover {

            background: #c6a15b;

            color: #ffffff;

            transform:
                rotate(90deg);

        }


        /* =====================================================
           FORM
        ===================================================== */

        #serviceHubEditProfileModal
        #shEditProfileForm {

            flex: 1 1 auto;

            min-height: 0;

            display: flex;

            flex-direction: column;

            overflow: hidden;

        }


        /* =====================================================
           IMPORTANT:
           THIS IS THE SCROLLABLE AREA
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-body {

            flex: 1 1 auto;

            min-height: 0;

            overflow-y: auto;

            overflow-x: hidden;

            padding: 26px 28px;

            -webkit-overflow-scrolling: touch;

            overscroll-behavior: contain;

        }


        /* =====================================================
           SCROLLBAR
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-body::-webkit-scrollbar {

            width: 8px;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-body::-webkit-scrollbar-track {

            background: #f7f3eb;

            border-radius: 10px;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-body::-webkit-scrollbar-thumb {

            background: #c6a15b;

            border-radius: 10px;

        }


        #serviceHubEditProfileModal
        .sh-profile-edit-body::-webkit-scrollbar-thumb:hover {

            background: #a98645;

        }


        /* Firefox */

        #serviceHubEditProfileModal
        .sh-profile-edit-body {

            scrollbar-width: thin;

            scrollbar-color:
                #c6a15b
                #f7f3eb;

        }


        /* =====================================================
           FOOTER
        ===================================================== */

        #serviceHubEditProfileModal
        .sh-profile-edit-footer {

            flex: 0 0 auto;

            display: flex;

            align-items: center;

            justify-content: flex-end;

            gap: 12px;

            padding: 18px 28px;

            background: #ffffff;

            border-top:
                1px solid #e6e0d5;

        }


        /* =====================================================
           MOBILE
        ===================================================== */

        @media (max-width: 768px) {

            #serviceHubEditProfileModal {

                padding: 10px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-dialog {

                max-height:
                    calc(100vh - 20px);

                border-radius: 14px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-header {

                padding: 18px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-body {

                padding: 20px 18px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-footer {

                padding: 14px 18px;

            }

        }


        /* =====================================================
           SMALL MOBILE
        ===================================================== */

        @media (max-width: 480px) {

            #serviceHubEditProfileModal {

                padding: 0;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-dialog {

                width: 100%;

                height: 100%;

                max-height: 100vh;

                border-radius: 0;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-header {

                padding: 16px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-body {

                padding: 18px 16px;

            }


            #serviceHubEditProfileModal
            .sh-profile-edit-footer {

                padding: 14px 16px;

                flex-wrap: wrap;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   EDIT MODAL EVENTS
========================================================= */

function setupEditProfileModalEvents() {

    const modal =
        $("serviceHubEditProfileModal");


    const closeButton =
        $("shEditProfileClose");


    const cancelButton =
        $("shEditProfileCancel");


    const backdrop =
        modal?.querySelector(
            ".sh-profile-edit-backdrop"
        );


    const form =
        $("shEditProfileForm");


    if (closeButton) {

        closeButton.addEventListener(
            "click",
            closeEditProfileModal
        );

    }


    if (cancelButton) {

        cancelButton.addEventListener(
            "click",
            closeEditProfileModal
        );

    }


    if (backdrop) {

        backdrop.addEventListener(
            "click",
            closeEditProfileModal
        );

    }


    if (form) {

        form.addEventListener(
            "submit",
            saveEditedProfile
        );

    }


    const bio =
        $("editBio");


    if (bio) {

        bio.addEventListener(
            "input",
            updateBioCounter
        );

    }


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key === "Escape" &&
                modal &&
                modal.classList.contains("open")
            ) {

                closeEditProfileModal();

            }

        }
    );

}


/* =========================================================
   OPEN EDIT MODAL
========================================================= */

function openEditProfileModal() {

    if (!ProfileState.isOwner) {

        return;

    }


    createEditProfileModal();


    populateEditForm();


    const modal =
        $("serviceHubEditProfileModal");


    if (!modal) {

        return;

    }


    modal.classList.add(
        "open"
    );


    document.body.classList.add(
        "profile-edit-open"
    );


    setTimeout(
        function() {

            $("editFullName")?.focus();

        },
        100
    );

}


/* =========================================================
   POPULATE EDIT FORM
========================================================= */

function populateEditForm() {

    const profile =
        ProfileState.profile || {};

    const user =
        ProfileState.user || {};


    setInputValue(
        "editFullName",
        profile.full_name ||
        user.full_name ||
        ""
    );


    setInputValue(
        "editProfession",
        profile.profession ||
        ""
    );


    setInputValue(
        "editCategory",
        profile.category ||
        ""
    );


    setInputValue(
        "editLocation",
        profile.location ||
        ""
    );


    setInputValue(
        "editServiceArea",
        profile.service_area ||
        ""
    );


    setInputValue(
        "editBio",
        profile.bio ||
        ""
    );


    setInputValue(
        "editPhone",
        profile.phone ||
        ""
    );


    setInputValue(
        "editWhatsapp",
        profile.whatsapp ||
        ""
    );


    setInputValue(
        "editWebsite",
        profile.website ||
        ""
    );


    setInputValue(
        "editHowIWork",
        profile.how_i_work ||
        ""
    );


    setInputValue(
        "editWorkingHours",
        profile.working_hours ||
        ""
    );


    setInputValue(
        "editInstagram",
        profile.instagram ||
        ""
    );


    setInputValue(
        "editFacebook",
        profile.facebook ||
        ""
    );


    setInputValue(
        "editTikTok",
        profile.tiktok ||
        ""
    );


    setInputValue(
        "editLinkedIn",
        profile.linkedin ||
        ""
    );


    updateBioCounter();

    clearEditAlert();

}


function setInputValue(
    id,
    value
) {

    const element =
        $(id);

    if (element) {

        element.value =
            value ?? "";

    }

}


/* =========================================================
   BIO COUNTER
========================================================= */

function updateBioCounter() {

    const bio =
        $("editBio");

    const counter =
        $("editBioCount");


    if (
        bio &&
        counter
    ) {

        counter.textContent =
            bio.value.length;

    }

}


/* =========================================================
   SAVE PROFILE
========================================================= */

async function saveEditedProfile(
    event
) {

    event.preventDefault();


    if (
        typeof ServiceHubAPI ===
        "undefined" ||
        typeof ServiceHubAPI.updateProfile !==
        "function"
    ) {

        showEditAlert(
            "Profile update is not available. Please check your API configuration.",
            "error"
        );

        return;

    }


    const saveButton =
        $("shEditProfileSave");

    const saveText =
        $("shEditSaveText");

    const spinner =
        $("shEditSaveSpinner");


    const data = {

        full_name:
            $("editFullName")?.value.trim() ||
            "",

        profession:
            $("editProfession")?.value.trim() ||
            "",

        category:
            $("editCategory")?.value.trim() ||
            "",

        location:
            $("editLocation")?.value.trim() ||
            "",

        service_area:
            $("editServiceArea")?.value.trim() ||
            "",

        bio:
            $("editBio")?.value.trim() ||
            "",

        phone:
            $("editPhone")?.value.trim() ||
            "",

        whatsapp:
            $("editWhatsapp")?.value.trim() ||
            "",

        website:
            $("editWebsite")?.value.trim() ||
            "",

        how_i_work:
            $("editHowIWork")?.value.trim() ||
            "",

        working_hours:
            $("editWorkingHours")?.value.trim() ||
            "",

        instagram:
            $("editInstagram")?.value.trim() ||
            "",

        facebook:
            $("editFacebook")?.value.trim() ||
            "",

        tiktok:
            $("editTikTok")?.value.trim() ||
            "",

        linkedin:
            $("editLinkedIn")?.value.trim() ||
            ""

    };


    if (!data.full_name) {

        showEditAlert(
            "Please enter your full name.",
            "error"
        );

        return;

    }


    try {

        if (saveButton) {

            saveButton.disabled =
                true;

        }


        if (saveText) {

            saveText.textContent =
                "Saving...";

        }


        if (spinner) {

            spinner.style.display =
                "inline-block";

        }


        const result =
            await ServiceHubAPI
                .updateProfile(
                    data
                );


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to update profile."
            );

        }


        /*
         * Update local state immediately.
         */

        ProfileState.profile =
            {
                ...ProfileState.profile,
                ...data
            };


        if (
            ProfileState.user
        ) {

            ProfileState.user =
                {
                    ...ProfileState.user,
                    full_name:
                        data.full_name
                };

        }


        /*
         * Re-render everything.
         */

        renderEverything();

        setupOwnerControls();

        setupContactButtons();

        setupPublicProfileControls();


        closeEditProfileModal();


        showProfileToast(
            "Profile updated",
            "Your profile has been saved successfully."
        );


        /*
         * Refresh from backend after save.
         */

        setTimeout(
            async function() {

                try {

                    if (
                        ProfileState.isOwner
                    ) {

                        const fresh =
                            await ServiceHubAPI
                                .getProfile();


                        if (
                            fresh?.profile
                        ) {

                            ProfileState.profile =
                                fresh.profile;

                            ProfileState.user =
                                fresh.user ||
                                ProfileState.user;

                            renderEverything();

                            setupOwnerControls();

                            setupContactButtons();

                            setupPublicProfileControls();

                        }

                    }

                } catch (refreshError) {

                    console.warn(
                        "PROFILE REFRESH AFTER SAVE FAILED:",
                        refreshError
                    );

                }

            },
            300
        );


    } catch (error) {

        console.error(
            "SERVICEHUB PROFILE UPDATE ERROR:",
            error
        );


        showEditAlert(
            error.message ||
            "Unable to save your profile.",
            "error"
        );


    } finally {

        if (saveButton) {

            saveButton.disabled =
                false;

        }


        if (saveText) {

            saveText.textContent =
                "Save Changes";

        }


        if (spinner) {

            spinner.style.display =
                "none";

        }

    }

}


/* =========================================================
   CLOSE EDIT MODAL
========================================================= */

function closeEditProfileModal() {

    const modal =
        $("serviceHubEditProfileModal");


    if (!modal) {

        return;

    }


    modal.classList.remove(
        "open"
    );


    document.body.classList.remove(
        "profile-edit-open"
    );

}


function showEditAlert(
    message,
    type = "error"
) {

    const alert =
        $("shEditProfileAlert");


    if (!alert) {

        return;

    }


    alert.textContent =
        message;


    alert.className =
        "sh-profile-edit-alert " +
        (
            type === "success"
                ? "success"
                : "error"
        );


    alert.style.display =
        "block";

}


function clearEditAlert() {

    const alert =
        $("shEditProfileAlert");


    if (!alert) {

        return;

    }


    alert.textContent =
        "";

    alert.style.display =
        "none";

}


/* =========================================================
   PUBLISH / UNPUBLISH
========================================================= */

async function handlePublishToggle() {

    const profile =
        ProfileState.profile || {};


    const published =
        profile.published === true;


    const button =
        $("publishProfileButton");


    try {

        if (button) {

            button.disabled =
                true;

            button.innerHTML = `
                <span
                    class="spinner-border spinner-border-sm"
                ></span>
                Updating...
            `;

        }


        const result =
            await ServiceHubAPI
                .updateProfile({

                    published:
                        !published

                });


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to update profile."
            );

        }


        ProfileState.profile.published =
            !published;


        renderPublishedBadge(
            ProfileState.profile
        );


        setupOwnerControls();


        showProfileToast(
            published
                ? "Profile unpublished"
                : "Profile published",
            published
                ? "Your public profile is now hidden."
                : "Your profile is now visible to customers."
        );


    } catch (error) {

        console.error(
            "PUBLISH PROFILE ERROR:",
            error
        );


        showProfileToast(
            "Update failed",
            error.message ||
            "Unable to update profile."
        );


        setupOwnerControls();

    }

}


/* =========================================================
   CONTACT BUTTONS
========================================================= */

function setupContactButtons() {

    const profile =
        ProfileState.profile || {};


    const phone =
        profile.phone ||
        "";


    const whatsapp =
        profile.whatsapp ||
        phone;


    const email =
        profile.email ||
        ProfileState.user?.email ||
        "";


    const whatsappButton =
        $("whatsappButton");


    const callButton =
        $("callButton");


    const emailButton =
        $("emailButton");


    if (whatsappButton) {

        if (whatsapp) {

            whatsappButton.style.display =
                "inline-flex";


            whatsappButton.onclick =
                function() {

                    openWhatsApp(
                        whatsapp
                    );

                };

        } else {

            whatsappButton.style.display =
                "none";

        }

    }


    if (callButton) {

        if (phone) {

            callButton.style.display =
                "inline-flex";


            callButton.onclick =
                function() {

                    window.location.href =
                        `tel:${phone}`;

                };

        } else {

            callButton.style.display =
                "none";

        }

    }


    if (emailButton) {

        if (email) {

            emailButton.style.display =
                "inline-flex";


            emailButton.onclick =
                function() {

                    window.location.href =
                        `mailto:${email}`;

                };

        } else {

            emailButton.style.display =
                "none";

        }

    }

}


function openWhatsApp(
    phone
) {

    let cleaned =
        String(phone)
            .replace(
                /[^0-9+]/g,
                ""
            );


    cleaned =
        cleaned.replace(
            /^\+/,
            ""
        );


    if (
        cleaned.startsWith("0")
    ) {

        cleaned =
            "234" +
            cleaned.substring(1);

    }


    window.open(
        `https://wa.me/${cleaned}`,
        "_blank"
    );

}


/* =========================================================
   PUBLIC PROFILE CONTROLS
========================================================= */

function setupPublicProfileControls() {

    const username =
        ProfileState.profile?.username ||
        ProfileState.username;


    if (!username) {

        return;

    }


    const publicUrl =
        buildPublicProfileUrl(
            username
        );


    const urlElement =
        $("publicProfileUrl");


    if (urlElement) {

        urlElement.textContent =
            publicUrl;

        urlElement.dataset.url =
            publicUrl;

    }


    const viewButton =
        $("viewPublicProfileButton");


    if (viewButton) {

        viewButton.onclick =
            function() {

                window.open(
                    publicUrl,
                    "_blank"
                );

            };

    }

}


/* =========================================================
   COPY BUTTONS
========================================================= */

function setupCopyButtons() {

    const ids = [

        "copyPublicLinkButton",

        "copyProfileLinkButton",

        "copyPublicLinkButtonSecondary"

    ];


    ids.forEach(
        function(id) {

            const button =
                $(id);


            if (!button) {

                return;

            }


            button.onclick =
                async function() {

                    const url =
                        getPublicProfileUrl();


                    if (!url) {

                        showProfileToast(
                            "No profile link",
                            "Your public profile link is not available yet."
                        );

                        return;

                    }


                    const copied =
                        await copyToClipboard(
                            url
                        );


                    if (copied) {

                        showProfileToast(
                            "Link copied",
                            "Your public profile link has been copied."
                        );

                    }

                };

        }
    );

}


async function copyToClipboard(
    text
) {

    if (!text) {

        return false;

    }


    try {

        if (
            navigator.clipboard &&
            window.isSecureContext
        ) {

            await navigator.clipboard.writeText(
                text
            );

            return true;

        }

    } catch (error) {

        console.warn(
            "CLIPBOARD API ERROR:",
            error
        );

    }


    try {

        const textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";

        textarea.style.left =
            "-9999px";


        document.body.appendChild(
            textarea
        );


        textarea.focus();

        textarea.select();


        const result =
            document.execCommand(
                "copy"
            );


        textarea.remove();


        return result;

    } catch (error) {

        console.error(
            "COPY ERROR:",
            error
        );

        return false;

    }

}


/* =========================================================
   SERVICE REQUEST
========================================================= */

function setupRequestService() {

    const requestButtons = [

        $("requestServiceButton"),

        $("sidebarRequestButton")

    ];


    requestButtons.forEach(
        function(button) {

            if (!button) {

                return;

            }


            button.onclick =
                openRequestModal;

        }
    );


    populateRequestedServices();


    const form =
        $("serviceRequestForm");


    if (form) {

        form.addEventListener(
            "submit",
            submitServiceRequest
        );

    }

}


function populateRequestedServices() {

    const select =
        $("requestedService");


    if (!select) {

        return;

    }


    const services =
        ProfileState.relatedData.services;


    select.innerHTML = `
        <option value="">
            Select a service
        </option>
    `;


    services.forEach(
        function(service) {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                service.name ||
                service.title ||
                "";


            option.textContent =
                service.name ||
                service.title ||
                "Service";


            select.appendChild(
                option
            );

        }
    );


    if (!services.length) {

        const option =
            document.createElement(
                "option"
            );


        option.value =
            "General Service Request";


        option.textContent =
            "General Service Request";


        select.appendChild(
            option
        );

    }

}


function openRequestModal() {

    const modal =
        $("serviceRequestModal");


    if (!modal) {

        return;

    }


    populateRequestedServices();


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        bootstrap.Modal
            .getOrCreateInstance(
                modal
            )
            .show();

        return;

    }


    modal.classList.add(
        "show"
    );

    modal.style.display =
        "block";

}


function closeRequestModal() {

    const modal =
        $("serviceRequestModal");


    if (!modal) {

        return;

    }


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        const instance =
            bootstrap.Modal
                .getInstance(
                    modal
                );

        if (instance) {

            instance.hide();

            return;

        }

    }


    modal.classList.remove(
        "show"
    );

    modal.style.display =
        "none";

}


async function submitServiceRequest(
    event
) {

    event.preventDefault();


    const submitButton =
        $("submitRequestButton");

    const submitText =
        $("submitRequestText");

    const spinner =
        $("submitRequestSpinner");


    const requestData = {

        provider_username:
            ProfileState.username,

        customer_name:
            $("customerName")?.value.trim() ||
            "",

        customer_phone:
            $("customerPhone")?.value.trim() ||
            "",

        customer_email:
            $("customerEmail")?.value.trim() ||
            "",

        requested_service:
            $("requestedService")?.value.trim() ||
            "",

        message:
            $("customerMessage")?.value.trim() ||
            ""

    };


    if (
        !requestData.customer_name ||
        !requestData.customer_phone ||
        !requestData.requested_service ||
        !requestData.message
    ) {

        showProfileToast(
            "Missing information",
            "Please complete all required service request fields."
        );

        return;

    }


    try {

        if (submitButton) {

            submitButton.disabled =
                true;

        }


        if (submitText) {

            submitText.style.display =
                "none";

        }


        if (spinner) {

            spinner.style.display =
                "inline-block";

        }


        const result =
            await ServiceHubAPI
                .createServiceRequest(
                    requestData
                );


        if (
            result &&
            result.success === false
        ) {

            throw new Error(
                result.message ||
                "Unable to send service request."
            );

        }


        const form =
            $("serviceRequestForm");


        if (form) {

            form.reset();

        }


        closeRequestModal();


        showProfileToast(
            "Request sent",
            "Your service request has been submitted successfully."
        );


    } catch (error) {

        console.error(
            "SERVICE REQUEST ERROR:",
            error
        );


        showProfileToast(
            "Request failed",
            error.message ||
            "Unable to send your request."
        );


    } finally {

        if (submitButton) {

            submitButton.disabled =
                false;

        }


        if (submitText) {

            submitText.style.display =
                "inline";

        }


        if (spinner) {

            spinner.style.display =
                "none";

        }

    }

}


/* =========================================================
   SIDEBAR
========================================================= */

function updateSidebar() {

    const profile =
        ProfileState.profile || {};

    const user =
        ProfileState.user || {};


    const fullName =
        profile.full_name ||
        user.full_name ||
        "Service Provider";


    setText(
        "sidebarUserName",
        fullName
    );


    setText(
        "sidebarUserType",
        profile.profession ||
        profile.category ||
        "Provider"
    );


    document
        .querySelectorAll(
            ".sidebar-nav-item, .sidebar-nav-link"
        )
        .forEach(
            function(link) {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    href &&
                    href.includes(
                        "profile.html"
                    )
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

}


/* =========================================================
   TOPBAR
========================================================= */

function updateTopbar() {

    const profile =
        ProfileState.profile || {};

    const user =
        ProfileState.user || {};


    const fullName =
        profile.full_name ||
        user.full_name ||
        "Service Provider";


    setText(
        "topbarProfileName",
        fullName
    );


    setText(
        "topbarProfileType",
        profile.profession ||
        profile.category ||
        "Provider"
    );

}


/* =========================================================
   MOBILE SIDEBAR
========================================================= */

function setupSidebar() {

    const sidebar =
        $("dashboardSidebar");

    const overlay =
        $("sidebarOverlay");

    const openButton =
        $("mobileMenuButton");

    const closeButton =
        $("sidebarClose");


    if (
        openButton &&
        sidebar
    ) {

        openButton.onclick =
            function() {

                sidebar.classList.add(
                    "open"
                );


                if (overlay) {

                    overlay.classList.add(
                        "active"
                    );

                    overlay.classList.add(
                        "show"
                    );

                }


                document.body.classList.add(
                    "sidebar-open"
                );

            };

    }


    if (
        closeButton &&
        sidebar
    ) {

        closeButton.onclick =
            closeSidebar;

    }


    if (overlay) {

        overlay.onclick =
            closeSidebar;

    }

}


function closeSidebar() {

    const sidebar =
        $("dashboardSidebar");

    const overlay =
        $("sidebarOverlay");


    if (sidebar) {

        sidebar.classList.remove(
            "open"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "active"
        );

        overlay.classList.remove(
            "show"
        );

    }


    document.body.classList.remove(
        "sidebar-open"
    );

}


/* =========================================================
   RETRY
========================================================= */

function setupRetryButton() {

    const button =
        $("retryProfileButton");


    if (!button) {

        return;

    }


    button.onclick =
        function() {

            loadProfile();

        };

}


/* =========================================================
   TOAST
========================================================= */

function showProfileToast(
    title,
    message
) {

    const toast =
        $("profileToast");


    if (!toast) {

        return;

    }


    setText(
        "profileToastTitle",
        title
    );


    setText(
        "profileToastMessage",
        message
    );


    if (
        typeof bootstrap !==
        "undefined"
    ) {

        bootstrap.Toast
            .getOrCreateInstance(
                toast,
                {
                    delay: 3500
                }
            )
            .show();

        return;

    }


    toast.style.display =
        "flex";

    toast.classList.add(
        "show"
    );


    clearTimeout(
        window.serviceHubToastTimer
    );


    window.serviceHubToastTimer =
        setTimeout(
            hideProfileToast,
            3500
        );

}


function hideProfileToast() {

    const toast =
        $("profileToast");


    if (!toast) {

        return;

    }


    toast.classList.remove(
        "show"
    );


    toast.style.display =
        "none";

}


/* =========================================================
   MODALS
========================================================= */

function setupModalHandlers() {

    document
        .querySelectorAll(
            "[data-close-modal]"
        )
        .forEach(
            function(button) {

                button.addEventListener(
                    "click",
                    function() {

                        const modalId =
                            button.getAttribute(
                                "data-close-modal"
                            );


                        if (
                            modalId ===
                            "serviceRequestModal"
                        ) {

                            closeRequestModal();

                        }

                    }
                );

            }
        );


    document.addEventListener(
        "keydown",
        function(event) {

            if (
                event.key ===
                "Escape"
            ) {

                closeRequestModal();

                hideProfileToast();

            }

        }
    );

}


/* =========================================================
   LOGOUT
========================================================= */

function setupLogout() {

    const button =
        $("logoutButton");


    if (!button) {

        return;

    }


    button.addEventListener(
        "click",
        async function() {

            const original =
                button.innerHTML;


            try {

                button.disabled =
                    true;


                button.innerHTML = `
                    <span
                        class="spinner-border spinner-border-sm"
                    ></span>
                    <span>Logging out...</span>
                `;


                if (
                    typeof ServiceHubAPI !==
                    "undefined"
                ) {

                    await ServiceHubAPI.logout();

                }


                window.location.href =
                    "./login.html";


            } catch (error) {

                console.error(
                    "SERVICEHUB LOGOUT ERROR:",
                    error
                );


                window.location.href =
                    "./login.html";


                button.disabled =
                    false;

                button.innerHTML =
                    original;

            }

        }
    );

}


/* =========================================================
   ALL CONTROLS
========================================================= */

function setupAllControls() {

    setupOwnerControls();

    setupContactButtons();

    setupPublicProfileControls();

    setupRequestService();

    setupCopyButtons();

    setupRetryButton();

    createEditProfileModal();

}


/* =========================================================
   EDIT PROFILE STYLES
========================================================= */

function injectProfileEditorStyles() {

    if (
        $("serviceHubProfileEditorStyles")
    ) {

        return;

    }


    const style =
        document.createElement(
            "style"
        );


    style.id =
        "serviceHubProfileEditorStyles";


    style.textContent = `

        .profile-completion-inline {

            margin-top:18px;

            padding:15px 17px;

            border-radius:12px;

            background:
                rgba(255,255,255,0.05);

            border:
                1px solid rgba(255,255,255,0.08);

            color:white;

        }


        .profile-completion-header {

            display:flex;

            align-items:center;

            justify-content:space-between;

            gap:15px;

            margin-bottom:9px;

        }


        .profile-completion-header div {

            display:flex;

            align-items:center;

            gap:10px;

        }


        .profile-completion-header span {

            color:
                rgba(255,255,255,0.55);

            font-size:9px;

            font-weight:800;

            letter-spacing:1.4px;

        }


        .profile-completion-header strong {

            color:
                var(--gold, #c6a15b);

            font-size:13px;

        }


        .profile-completion-header > i {

            color:
                var(--gold, #c6a15b);

        }


        .profile-completion-track {

            height:6px;

            overflow:hidden;

            border-radius:20px;

            background:
                rgba(255,255,255,0.10);

        }


        .profile-completion-bar {

            height:100%;

            border-radius:20px;

            background:
                var(--gold, #c6a15b);

            transition:
                width .5s ease;

        }


        .profile-completion-inline small {

            display:block;

            margin-top:8px;

            color:
                rgba(255,255,255,0.48);

            font-size:10px;

        }


        .profile-contact-clickable {

            cursor:pointer;

            transition:
                transform .2s ease,
                background .2s ease;

        }


        .profile-contact-clickable:hover {

            transform:
                translateX(3px);

        }


        .profile-work-item[role="button"] {

            cursor:pointer;

        }


        .profile-work-item[role="button"]:focus {

            outline:
                2px solid var(--gold, #c6a15b);

            outline-offset:3px;

        }


        .sh-profile-edit-modal {

            position:fixed;

            inset:0;

            z-index:10000;

            display:none;

        }


        .sh-profile-edit-modal.open {

            display:block;

        }


        .sh-profile-edit-backdrop {

            position:absolute;

            inset:0;

            background:
                rgba(0,0,0,.72);

            backdrop-filter:
                blur(5px);

        }


        .sh-profile-edit-dialog {

            position:relative;

            width:
                min(900px, calc(100% - 30px));

            max-height:
                calc(100vh - 30px);

            margin:15px auto;

            background:#fff;

            border-radius:18px;

            overflow:hidden;

            box-shadow:
                0 30px 80px rgba(0,0,0,.28);

            display:flex;

            flex-direction:column;

        }


        .sh-profile-edit-header {

            display:flex;

            justify-content:space-between;

            gap:20px;

            padding:24px 26px;

            background:
                var(--black, #171717);

            color:white;

        }


        .sh-profile-edit-header > div {

            min-width:0;

        }


        .sh-profile-edit-header span {

            display:block;

            margin-bottom:5px;

            color:
                var(--gold, #c6a15b);

            font-size:9px;

            font-weight:800;

            letter-spacing:1.6px;

        }


        .sh-profile-edit-header h2 {

            margin:0;

            font-family:Georgia,serif;

            font-size:25px;

            font-weight:500;

        }


        .sh-profile-edit-header p {

            margin:7px 0 0;

            color:
                rgba(255,255,255,.58);

            font-size:12px;

        }


        .sh-profile-edit-close {

            width:40px;

            height:40px;

            flex:0 0 40px;

            border:1px solid
                rgba(255,255,255,.12);

            border-radius:10px;

            background:
                rgba(255,255,255,.06);

            color:white;

            cursor:pointer;

        }


        .sh-profile-edit-close:hover {

            background:
                rgba(255,255,255,.12);

        }


        .sh-profile-edit-body {

            padding:25px;

            overflow-y:auto;

        }


        .sh-profile-edit-alert {

            padding:12px 14px;

            border-radius:9px;

            margin-bottom:18px;

            font-size:12px;

        }


        .sh-profile-edit-alert.error {

            background:
                rgba(220,53,69,.08);

            border:
                1px solid rgba(220,53,69,.16);

            color:#a61e2d;

        }


        .sh-profile-edit-alert.success {

            background:
                rgba(25,135,84,.08);

            border:
                1px solid rgba(25,135,84,.16);

            color:#146c43;

        }


        .sh-edit-section {

            padding:20px 0;

            border-bottom:
                1px solid #e6e0d5;

        }


        .sh-edit-section:first-of-type {

            padding-top:0;

        }


        .sh-edit-section:last-child {

            border-bottom:0;

        }


        .sh-edit-section-title {

            display:flex;

            align-items:center;

            gap:9px;

            margin-bottom:17px;

            color:#171717;

            font-size:13px;

            font-weight:800;

        }


        .sh-edit-section-title i {

            color:
                var(--gold, #c6a15b);

            font-size:17px;

        }


        .sh-edit-grid {

            display:grid;

            grid-template-columns:
                repeat(2,minmax(0,1fr));

            gap:16px;

        }


        .sh-edit-field {

            min-width:0;

        }


        .sh-edit-field.sh-edit-full {

            grid-column:
                1 / -1;

        }


        .sh-edit-field label {

            display:block;

            margin-bottom:7px;

            color:#4d4a45;

            font-size:11px;

            font-weight:700;

        }


        .sh-edit-field input,

        .sh-edit-field textarea {

            width:100%;

            border:
                1px solid #e2ddd3;

            border-radius:9px;

            background:#fff;

            color:#202020;

            padding:11px 12px;

            font-size:13px;

            outline:none;

            transition:
                border-color .2s ease,
                box-shadow .2s ease;

        }


        .sh-edit-field textarea {

            resize:vertical;

            min-height:100px;

        }


        .sh-edit-field input:focus,

        .sh-edit-field textarea:focus {

            border-color:
                var(--gold, #c6a15b);

            box-shadow:
                0 0 0 3px
                rgba(198,161,91,.12);

        }


        .sh-edit-field small {

            display:block;

            margin-top:5px;

            color:#99938a;

            font-size:10px;

            text-align:right;

        }


        .sh-profile-edit-footer {

            display:flex;

            align-items:center;

            justify-content:flex-end;

            gap:10px;

            padding:16px 25px;

            border-top:
                1px solid #e6e0d5;

            background:#faf8f3;

        }


        .sh-edit-cancel,

        .sh-edit-save {

            min-height:42px;

            padding:0 18px;

            border-radius:8px;

            font-size:12px;

            font-weight:700;

            cursor:pointer;

        }


        .sh-edit-cancel {

            border:
                1px solid #ded8cd;

            background:white;

            color:#555;

        }


        .sh-edit-save {

            border:
                1px solid var(--gold, #c6a15b);

            background:
                var(--gold, #c6a15b);

            color:
                var(--black, #171717);

        }


        .sh-edit-save:hover {

            background:
                var(--gold-light, #e1c98a);

        }


        .sh-edit-save:disabled {

            opacity:.65;

            cursor:not-allowed;

        }


        @media(max-width:700px) {

            .sh-profile-edit-dialog {

                width:
                    calc(100% - 16px);

                max-height:
                    calc(100vh - 16px);

                margin:8px auto;

                border-radius:14px;

            }


            .sh-profile-edit-header {

                padding:20px;

            }


            .sh-profile-edit-body {

                padding:20px;

            }


            .sh-edit-grid {

                grid-template-columns:1fr;

            }


            .sh-edit-field.sh-edit-full {

                grid-column:auto;

            }


            .sh-profile-edit-footer {

                padding:14px 20px;

            }


            .sh-edit-cancel,

            .sh-edit-save {

                flex:1;

            }

        }

    `;


    document.head.appendChild(
        style
    );

}


/* =========================================================
   INITIALIZE
========================================================= */

async function initializeProfile() {

    console.log(
        "SERVICEHUB PROFILE INITIALIZING..."
    );


    try {

        injectProfileEditorStyles();

        setupSidebar();

        setupModalHandlers();

        setupLogout();

        await loadProfile();


        console.log(
            "SERVICEHUB PROFILE INITIALIZED"
        );


    } catch (error) {

        console.error(
            "SERVICEHUB PROFILE INITIALIZATION ERROR:",
            error
        );


        showProfileError(
            "Profile error",
            error.message ||
            "Unable to initialize profile."
        );

    }

}


/* =========================================================
   GLOBAL EXPORTS
========================================================= */

window.ProfileState =
    ProfileState;

window.loadProfile =
    loadProfile;

window.initializeProfile =
    initializeProfile;

window.openRequestModal =
    openRequestModal;

window.closeRequestModal =
    closeRequestModal;

window.openEditProfileModal =
    openEditProfileModal;

window.closeEditProfileModal =
    closeEditProfileModal;

window.showProfileToast =
    showProfileToast;

window.hideProfileToast =
    hideProfileToast;


/* =========================================================
   START
========================================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeProfile
    );

} else {

    initializeProfile();

}
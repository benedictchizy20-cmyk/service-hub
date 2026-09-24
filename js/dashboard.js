/* =========================================================
   SERVICEHUB
   FULLY DYNAMIC DASHBOARD
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    const DashboardState = {

        user: null,

        profile: null,

        services: [],

        work: [],

        reviews: [],

        analytics: null,

        publicUrl: "",

        loading: false

    };


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function $(id) {

        return document.getElementById(id);

    }


    /* =====================================================
       SAFE VALUE HELPER
    ===================================================== */

    function firstDefined() {

        const values = arguments;

        for (let i = 0; i < values.length; i++) {

            const value = values[i];

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                return value;

            }

        }

        return null;

    }


    /* =====================================================
       UNWRAP API RESPONSE
    ===================================================== */

    function unwrapData(response) {

        if (!response) {
            return null;
        }


        if (
            response.data !== undefined &&
            response.data !== null
        ) {

            return response.data;

        }


        if (
            response.result !== undefined &&
            response.result !== null
        ) {

            return response.result;

        }


        return response;

    }


    /* =====================================================
       ARRAY NORMALIZER
    ===================================================== */

    function extractArray(response, possibleKeys) {

        const data = unwrapData(response);


        if (Array.isArray(data)) {

            return data;

        }


        if (!data || typeof data !== "object") {

            return [];

        }


        for (const key of possibleKeys) {

            if (Array.isArray(data[key])) {

                return data[key];

            }

        }


        return [];

    }


    /* =====================================================
       PROFILE NORMALIZER
    ===================================================== */

    function normalizeProfile(profile, user) {

        profile = profile || {};

        user = user || {};


        return {

            id: firstDefined(
                profile.id,
                user.id
            ),

            fullName: firstDefined(
                profile.full_name,
                profile.fullName,
                profile.name,
                user.full_name,
                user.fullName,
                user.name,
                "Service Provider"
            ),

            username: firstDefined(
                profile.username,
                profile.slug,
                profile.public_username,
                user.username,
                user.slug
            ),

            profession: firstDefined(
                profile.profession,
                profile.job_title,
                profile.service_type,
                profile.profile_type,
                user.profession,
                user.profile_type,
                "Professional"
            ),

            location: firstDefined(
                profile.location,
                profile.address,
                profile.city,
                user.location,
                "Location not added"
            ),

            bio: firstDefined(
                profile.bio,
                profile.about,
                profile.description,
                ""
            ),

            profileImage: firstDefined(
                profile.profile_image,
                profile.profile_image_url,
                profile.avatar_url,
                profile.image_url,
                profile.photo_url,
                profile.image,
                user.profile_image,
                user.avatar_url,
                user.photo_url
            ),

            businessName: firstDefined(
                profile.business_name,
                profile.businessName,
                profile.company_name,
                user.business_name
            ),

            phone: firstDefined(
                profile.phone,
                profile.phone_number,
                user.phone
            ),

            email: firstDefined(
                profile.email,
                user.email
            ),

            website: firstDefined(
                profile.website,
                profile.website_url
            ),

            workingHours: firstDefined(
                profile.working_hours,
                profile.hours
            ),

            createdAt: firstDefined(
                profile.created_at,
                user.created_at
            ),

            updatedAt: firstDefined(
                profile.updated_at,
                user.updated_at
            )

        };

    }


    /* =====================================================
       SERVICES NORMALIZER
    ===================================================== */

    function normalizeService(service) {

        service = service || {};


        return {

            id: firstDefined(
                service.id,
                service.service_id
            ),

            name: firstDefined(
                service.name,
                service.title,
                service.service_name,
                "Untitled Service"
            ),

            description: firstDefined(
                service.description,
                service.details,
                ""
            ),

            price: firstDefined(
                service.price,
                service.amount,
                service.starting_price,
                service.price_amount
            ),

            currency: firstDefined(
                service.currency,
                "NGN"
            ),

            active:
                service.is_active !== undefined
                    ? service.is_active
                    : service.active !== undefined
                        ? service.active
                        : true,

            createdAt: firstDefined(
                service.created_at,
                service.createdAt
            ),

            updatedAt: firstDefined(
                service.updated_at,
                service.updatedAt
            )

        };

    }


    /* =====================================================
       WORK NORMALIZER
    ===================================================== */

    function normalizeWork(work) {

        work = work || {};


        return {

            id: firstDefined(
                work.id,
                work.work_id
            ),

            title: firstDefined(
                work.title,
                work.name,
                work.project_title,
                "Untitled Project"
            ),

            description: firstDefined(
                work.description,
                work.details,
                work.summary,
                ""
            ),

            image: firstDefined(
                work.image_url,
                work.cover_image,
                work.cover_image_url,
                work.thumbnail_url,
                work.image,
                work.photo_url
            ),

            status: firstDefined(
                work.status,
                work.publish_status,
                work.state,
                "published"
            ),

            published:
                work.is_published !== undefined
                    ? work.is_published
                    : work.published !== undefined
                        ? work.published
                        : true,

            price: firstDefined(
                work.price,
                work.amount,
                work.project_price
            ),

            createdAt: firstDefined(
                work.created_at,
                work.createdAt,
                work.completed_at,
                work.published_at
            ),

            updatedAt: firstDefined(
                work.updated_at,
                work.updatedAt
            )

        };

    }


    /* =====================================================
       REVIEW NORMALIZER
    ===================================================== */

    function normalizeReview(review) {

        review = review || {};


        return {

            id: firstDefined(
                review.id,
                review.review_id
            ),

            name: firstDefined(
                review.customer_name,
                review.reviewer_name,
                review.name,
                review.customer?.name,
                review.user?.full_name,
                "Customer"
            ),

            avatar: firstDefined(
                review.customer_avatar,
                review.reviewer_avatar,
                review.avatar_url,
                review.user?.avatar_url
            ),

            rating: Number(
                firstDefined(
                    review.rating,
                    review.stars,
                    0
                )
            ) || 0,

            comment: firstDefined(
                review.comment,
                review.review,
                review.message,
                review.text,
                ""
            ),

            createdAt: firstDefined(
                review.created_at,
                review.createdAt
            )

        };

    }


    /* =====================================================
       NUMBER FORMAT
    ===================================================== */

    function formatNumber(value) {

        if (
            value === undefined ||
            value === null ||
            value === ""
        ) {

            return "—";

        }


        const number = Number(value);


        if (!Number.isFinite(number)) {

            return String(value);

        }


        return new Intl.NumberFormat().format(number);

    }


    /* =====================================================
       PRICE FORMAT
    ===================================================== */

    function formatPrice(price, currency) {

        if (
            price === undefined ||
            price === null ||
            price === ""
        ) {

            return "Price not set";

        }


        const numericPrice = Number(price);


        if (!Number.isFinite(numericPrice)) {

            return String(price);

        }


        const safeCurrency = currency || "NGN";


        try {

            return new Intl.NumberFormat(
                "en-NG",
                {
                    style: "currency",
                    currency: safeCurrency,
                    maximumFractionDigits: 0
                }
            ).format(numericPrice);

        } catch (error) {

            return `${safeCurrency} ${formatNumber(numericPrice)}`;

        }

    }


    /* =====================================================
       DATE FORMAT
    ===================================================== */

    function formatDate(value) {

        if (!value) {

            return "Date unavailable";

        }


        const date = new Date(value);


        if (Number.isNaN(date.getTime())) {

            return "Date unavailable";

        }


        return date.toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric"
            }
        );

    }


    /* =====================================================
       RELATIVE DATE
    ===================================================== */

    function relativeTime(value) {

        if (!value) {

            return "Recently";

        }


        const date = new Date(value);


        if (Number.isNaN(date.getTime())) {

            return formatDate(value);

        }


        const difference =
            Date.now() - date.getTime();


        const seconds =
            Math.floor(difference / 1000);


        if (seconds < 60) {

            return "Just now";

        }


        const minutes =
            Math.floor(seconds / 60);


        if (minutes < 60) {

            return `${minutes} min ago`;

        }


        const hours =
            Math.floor(minutes / 60);


        if (hours < 24) {

            return `${hours} hr ago`;

        }


        const days =
            Math.floor(hours / 24);


        if (days < 7) {

            return `${days} day${days === 1 ? "" : "s"} ago`;

        }


        return formatDate(value);

    }


    /* =====================================================
       ESCAPE HTML
    ===================================================== */

    function escapeHTML(value) {

        if (
            value === undefined ||
            value === null
        ) {

            return "";

        }


        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }


    /* =====================================================
       INITIALS
    ===================================================== */

    function getInitials(name) {

        if (!name) {

            return "S";

        }


        const parts =
            String(name)
                .trim()
                .split(/\s+/)
                .filter(Boolean);


        if (!parts.length) {

            return "S";

        }


        if (parts.length === 1) {

            return parts[0]
                .substring(0, 2)
                .toUpperCase();

        }


        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();

    }


    /* =====================================================
       AVATAR
    ===================================================== */

    function setAvatar(element, image, name) {

        if (!element) {

            return;

        }


        const initials =
            getInitials(name);


        if (image) {

            element.innerHTML = `
                <img
                    src="${escapeHTML(image)}"
                    alt="${escapeHTML(name || "Profile")}"
                    onerror="this.parentElement.innerHTML='<span>${escapeHTML(initials)}</span>';"
                >
            `;

        } else {

            element.innerHTML =
                `<span>${escapeHTML(initials)}</span>`;

        }

    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(message, type) {

        const alert = $("dashboardAlert");


        if (!alert) {

            return;

        }


        alert.className =
            `dashboard-alert ${type || "error"}`;


        alert.textContent =
            message || "Something went wrong.";


        alert.classList.remove("d-none");

    }


    function hideAlert() {

        const alert = $("dashboardAlert");


        if (!alert) {

            return;

        }


        alert.classList.add("d-none");

    }


    /* =====================================================
       GET USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            if (
                typeof ServiceHubAPI !== "undefined" &&
                typeof ServiceHubAPI.getCurrentUser === "function"
            ) {

                const response =
                    await ServiceHubAPI.getCurrentUser();


                const user =
                    unwrapData(response);


                if (user) {

                    return user;

                }

            }


            if (
                typeof ServiceHubAuth !== "undefined" &&
                typeof ServiceHubAuth.getCurrentUser === "function"
            ) {

                return await ServiceHubAuth.getCurrentUser();

            }


            return null;

        } catch (error) {

            console.error(
                "ServiceHub dashboard user error:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       LOAD PROFILE
    ===================================================== */

    async function loadProfile(user) {

        const username =
            firstDefined(
                user?.username,
                user?.slug,
                user?.public_username
            );


        if (
            username &&
            typeof ServiceHubAPI.getProfile === "function"
        ) {

            try {

                const response =
                    await ServiceHubAPI.getProfile(username);


                const profile =
                    unwrapData(response);


                if (profile) {

                    return normalizeProfile(
                        profile,
                        user
                    );

                }

            } catch (error) {

                console.warn(
                    "Could not load public profile:",
                    error
                );

            }

        }


        return normalizeProfile(
            user,
            user
        );

    }


    /* =====================================================
       LOAD SERVICES
    ===================================================== */

    async function loadServices() {

        if (
            typeof ServiceHubAPI === "undefined" ||
            typeof ServiceHubAPI.getServices !== "function"
        ) {

            return [];

        }


        const response =
            await ServiceHubAPI.getServices();


        return extractArray(
            response,
            [
                "services",
                "items",
                "results",
                "data"
            ]
        ).map(normalizeService);

    }


    /* =====================================================
       LOAD WORK
    ===================================================== */

    async function loadWork() {

        if (
            typeof ServiceHubAPI === "undefined" ||
            typeof ServiceHubAPI.getWork !== "function"
        ) {

            return [];

        }


        const response =
            await ServiceHubAPI.getWork();


        return extractArray(
            response,
            [
                "work",
                "works",
                "projects",
                "items",
                "results",
                "data"
            ]
        ).map(normalizeWork);

    }


    /* =====================================================
       LOAD REVIEWS
    ===================================================== */

    async function loadReviews(profile) {

        if (
            typeof ServiceHubAPI === "undefined" ||
            typeof ServiceHubAPI.getReviews !== "function"
        ) {

            return [];

        }


        const username =
            firstDefined(
                profile?.username
            );


        try {

            const response =
                await ServiceHubAPI.getReviews(username);


            return extractArray(
                response,
                [
                    "reviews",
                    "items",
                    "results",
                    "data"
                ]
            ).map(normalizeReview);

        } catch (error) {

            console.warn(
                "Could not load reviews:",
                error
            );


            return [];

        }

    }


    /* =====================================================
       LOAD ANALYTICS
    ===================================================== */

    async function loadAnalytics() {

        if (
            typeof ServiceHubAPI === "undefined" ||
            typeof ServiceHubAPI.getAnalytics !== "function"
        ) {

            return null;

        }


        try {

            const response =
                await ServiceHubAPI.getAnalytics();


            return unwrapData(response);

        } catch (error) {

            console.warn(
                "Could not load analytics:",
                error
            );


            return null;

        }

    }


    /* =====================================================
       PUBLIC PROFILE URL
    ===================================================== */

    function buildPublicUrl(profile) {

        if (!profile) {

            return "";

        }


        const username =
            firstDefined(
                profile.username
            );


        if (!username) {

            return "";

        }


        const base =
            typeof APP_CONFIG !== "undefined" &&
            APP_CONFIG.FRONTEND_URL
                ? APP_CONFIG.FRONTEND_URL
                : window.location.origin;


        const path =
            typeof APP_CONFIG !== "undefined" &&
            APP_CONFIG.PUBLIC_PROFILE_PATH
                ? APP_CONFIG.PUBLIC_PROFILE_PATH
                : "/profile.html?username=";


        return (
            base.replace(/\/$/, "") +
            path +
            encodeURIComponent(username)
        );

    }


    /* =====================================================
       PROFILE COMPLETION
    ===================================================== */

    function calculateProfileCompletion(profile) {

        if (!profile) {

            return 0;

        }


        const fields = [

            profile.fullName,

            profile.profession,

            profile.location,

            profile.bio,

            profile.profileImage,

            profile.phone,

            profile.email,

            profile.username

        ];


        const completed =
            fields.filter(
                value =>
                    value !== undefined &&
                    value !== null &&
                    String(value).trim() !== ""
            ).length;


        return Math.round(
            (completed / fields.length) * 100
        );

    }


    /* =====================================================
       RATING
    ===================================================== */

    function calculateRating(reviews) {

        const validReviews =
            reviews.filter(
                review =>
                    Number(review.rating) > 0
            );


        if (!validReviews.length) {

            return null;

        }


        const total =
            validReviews.reduce(
                (sum, review) =>
                    sum + Number(review.rating),
                0
            );


        return (
            total / validReviews.length
        ).toFixed(1);

    }


    /* =====================================================
       ANALYTICS PROFILE VIEWS
    ===================================================== */

    function getProfileViews(analytics) {

        if (!analytics) {

            return null;

        }


        return firstDefined(

            analytics.profile_views,

            analytics.profileViews,

            analytics.views,

            analytics.total_views,

            analytics.totalViews,

            analytics.overview?.profile_views,

            analytics.overview?.profileViews,

            analytics.data?.profile_views,

            analytics.data?.views

        );

    }


    /* =====================================================
       UPDATE HEADER
    ===================================================== */

    function renderHeader() {

        const profile =
            DashboardState.profile;


        const name =
            profile?.fullName ||
            "Service Provider";


        const profession =
            profile?.profession ||
            "Provider";


        if ($("sidebarUserName")) {

            $("sidebarUserName").textContent =
                name;

        }


        if ($("sidebarUserType")) {

            $("sidebarUserType").textContent =
                profession;

        }


        if ($("topbarUserName")) {

            $("topbarUserName").textContent =
                name;

        }


        setAvatar(
            $("sidebarAvatar"),
            profile?.profileImage,
            name
        );


        setAvatar(
            $("topbarAvatar"),
            profile?.profileImage,
            name
        );

    }


    /* =====================================================
       UPDATE WELCOME
    ===================================================== */

    function renderWelcome() {

        const profile =
            DashboardState.profile;


        const name =
            profile?.fullName ||
            "there";


        const firstName =
            String(name)
                .trim()
                .split(/\s+/)[0] ||
                "there";


        if ($("welcomeHeading")) {

            $("welcomeHeading").textContent =
                `Welcome back, ${firstName}.`;

        }


        if ($("welcomeDescription")) {

            $("welcomeDescription").textContent =
                "Manage your professional presence, services and work from one place.";

        }

    }


    /* =====================================================
       UPDATE STATISTICS
    ===================================================== */

    function renderStats() {

        const services =
            DashboardState.services;


        const work =
            DashboardState.work;


        const reviews =
            DashboardState.reviews;


        const analytics =
            DashboardState.analytics;


        const activeServices =
            services.filter(
                service => service.active !== false
            );


        const publishedWork =
            work.filter(
                item => item.published !== false
            );


        const views =
            getProfileViews(analytics);


        const rating =
            calculateRating(reviews);


        const completion =
            calculateProfileCompletion(
                DashboardState.profile
            );


        if ($("profileViews")) {

            $("profileViews").textContent =
                views !== null
                    ? formatNumber(views)
                    : "—";

        }


        if ($("serviceCount")) {

            $("serviceCount").textContent =
                formatNumber(
                    activeServices.length
                );

        }


        if ($("workCount")) {

            $("workCount").textContent =
                formatNumber(
                    publishedWork.length
                );

        }


        if ($("reviewCount")) {

            $("reviewCount").textContent =
                formatNumber(
                    reviews.length
                );

        }


        if ($("averageRating")) {

            $("averageRating").textContent =
                rating
                    ? `${rating}/5`
                    : "—";

        }


        if ($("profileCompletion")) {

            $("profileCompletion").textContent =
                `${completion}%`;

        }


        if ($("completionPercent")) {

            $("completionPercent").textContent =
                `${completion}%`;

        }


        if ($("completionProgressBar")) {

            $("completionProgressBar")
                .style.width =
                    `${completion}%`;

        }


        if ($("completionMessage")) {

            if (completion >= 90) {

                $("completionMessage").textContent =
                    "Your profile is well prepared for customers.";

            } else if (completion >= 60) {

                $("completionMessage").textContent =
                    "Your profile is taking shape. Add a few more details.";

            } else {

                $("completionMessage").textContent =
                    "Complete your profile to give customers more information.";

            }

        }

    }


    /* =====================================================
       UPDATE PROFILE CARD
    ===================================================== */

    function renderProfile() {

        const profile =
            DashboardState.profile;


        if (!profile) {

            return;

        }


        if ($("profileDisplayName")) {

            $("profileDisplayName").textContent =
                profile.fullName;

        }


        if ($("profileProfession")) {

            $("profileProfession").textContent =
                profile.profession;

        }


        if ($("profileLocation")) {

            $("profileLocation").textContent =
                profile.location;

        }


        setAvatar(
            $("profileLargeAvatar"),
            profile.profileImage,
            profile.fullName
        );

    }


    /* =====================================================
       UPDATE PUBLIC PAGE
    ===================================================== */

    function renderPublicPage() {

        const profile =
            DashboardState.profile;


        const url =
            buildPublicUrl(profile);


        DashboardState.publicUrl =
            url;


        if ($("publicPageName")) {

            $("publicPageName").textContent =
                firstDefined(
                    profile?.businessName,
                    profile?.fullName,
                    "Your professional page"
                );

        }


        if ($("publicProfileUrl")) {

            $("publicProfileUrl").textContent =
                url || "Create your username to get your public link";

        }


        if ($("viewPublicProfileButton")) {

            if (url) {

                $("viewPublicProfileButton").href =
                    url;

                $("viewPublicProfileButton")
                    .classList.remove("disabled");

            } else {

                $("viewPublicProfileButton").href =
                    "#";

                $("viewPublicProfileButton")
                    .classList.add("disabled");

            }

        }

    }


    /* =====================================================
       RENDER WORK
    ===================================================== */

    function renderWork() {

        const container =
            $("recentWorkList");


        if (!container) {

            return;

        }


        const work =
            DashboardState.work
                .filter(
                    item =>
                        item.published !== false
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                )
                .slice(0, 4);


        if (!work.length) {

            container.innerHTML = `

                <div class="dashboard-empty">

                    <div class="dashboard-empty-icon">
                        <i class="bi bi-images"></i>
                    </div>

                    <strong>
                        No work published yet
                    </strong>

                    <span>
                        Add your completed projects to build your portfolio.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            work.map(item => {

                const image =
                    item.image
                        ? `
                            <img
                                src="${escapeHTML(item.image)}"
                                alt="${escapeHTML(item.title)}"
                                onerror="this.style.display='none';"
                            >
                          `
                        : `
                            <i class="bi bi-image"></i>
                          `;


                return `

                    <div class="work-item">

                        <div class="work-thumbnail">
                            ${image}
                        </div>

                        <div class="work-info">

                            <h4>
                                ${escapeHTML(item.title)}
                            </h4>

                            <p>
                                ${escapeHTML(
                                    item.description ||
                                    "Portfolio project"
                                )}
                            </p>

                            <div class="work-date">
                                ${relativeTime(item.createdAt)}
                            </div>

                        </div>

                        <span class="work-status">
                            ${escapeHTML(
                                item.status || "Published"
                            )}
                        </span>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       RENDER SERVICES
    ===================================================== */

    function renderServices() {

        const container =
            $("serviceList");


        if (!container) {

            return;

        }


        const services =
            DashboardState.services
                .filter(
                    service =>
                        service.active !== false
                )
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                )
                .slice(0, 5);


        if (!services.length) {

            container.innerHTML = `

                <div class="dashboard-empty">

                    <div class="dashboard-empty-icon">
                        <i class="bi bi-tags"></i>
                    </div>

                    <strong>
                        No services added yet
                    </strong>

                    <span>
                        Add your services and prices so customers know what you offer.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            services.map(service => {

                return `

                    <div class="service-item">

                        <div class="service-icon">
                            <i class="bi bi-tag"></i>
                        </div>

                        <div class="service-info">

                            <strong>
                                ${escapeHTML(service.name)}
                            </strong>

                            <span>
                                ${escapeHTML(
                                    service.description ||
                                    "Service available"
                                )}
                            </span>

                        </div>

                        <div class="service-price">
                            ${formatPrice(
                                service.price,
                                service.currency
                            )}
                        </div>

                        <div class="service-status"></div>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       STAR HTML
    ===================================================== */

    function stars(rating) {

        const value =
            Math.max(
                0,
                Math.min(
                    5,
                    Number(rating) || 0
                )
            );


        let html = "";


        for (let i = 1; i <= 5; i++) {

            if (i <= Math.round(value)) {

                html +=
                    `<i class="bi bi-star-fill"></i>`;

            } else {

                html +=
                    `<i class="bi bi-star"></i>`;

            }

        }


        return html;

    }


    /* =====================================================
       RENDER REVIEWS
    ===================================================== */

    function renderReviews() {

        const container =
            $("recentReviewsList");


        if (!container) {

            return;

        }


        const reviews =
            DashboardState.reviews
                .sort(
                    (a, b) =>
                        new Date(
                            b.createdAt || 0
                        ) -
                        new Date(
                            a.createdAt || 0
                        )
                )
                .slice(0, 3);


        if (!reviews.length) {

            container.innerHTML = `

                <div class="dashboard-empty">

                    <div class="dashboard-empty-icon">
                        <i class="bi bi-star"></i>
                    </div>

                    <strong>
                        No reviews yet
                    </strong>

                    <span>
                        Customer reviews will appear here when they are received.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            reviews.map(review => {

                const reviewerName =
                    review.name || "Customer";


                const avatar =
                    review.avatar
                        ? `
                            <img
                                src="${escapeHTML(review.avatar)}"
                                alt="${escapeHTML(reviewerName)}"
                            >
                          `
                        : escapeHTML(
                            getInitials(
                                reviewerName
                            )
                        );


                return `

                    <div class="review-item">

                        <div class="review-header">

                            <div class="reviewer">

                                <div class="reviewer-avatar">
                                    ${avatar}
                                </div>

                                <div>

                                    <strong>
                                        ${escapeHTML(reviewerName)}
                                    </strong>

                                    <span>
                                        ${relativeTime(
                                            review.createdAt
                                        )}
                                    </span>

                                </div>

                            </div>

                            <div class="review-stars">
                                ${stars(review.rating)}
                            </div>

                        </div>

                        <p class="review-text">
                            ${escapeHTML(
                                review.comment ||
                                "No written comment."
                            )}
                        </p>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       BUILD ACTIVITY
    ===================================================== */

    function buildActivities() {

        const activities = [];


        const profile =
            DashboardState.profile;


        if (profile?.updatedAt) {

            activities.push({

                icon: "bi-person-check",

                title: "Profile updated",

                date: profile.updatedAt

            });

        }


        DashboardState.services
            .forEach(service => {

                if (service.createdAt) {

                    activities.push({

                        icon: "bi-tag",

                        title:
                            `Service added: ${service.name}`,

                        date:
                            service.createdAt

                    });

                }

            });


        DashboardState.work
            .forEach(work => {

                if (work.createdAt) {

                    activities.push({

                        icon: "bi-images",

                        title:
                            `Work published: ${work.title}`,

                        date:
                            work.createdAt

                    });

                }

            });


        DashboardState.reviews
            .forEach(review => {

                if (review.createdAt) {

                    activities.push({

                        icon: "bi-star",

                        title:
                            `New ${review.rating}-star review received`,

                        date:
                            review.createdAt

                    });

                }

            });


        return activities
            .sort(
                (a, b) =>
                    new Date(b.date || 0) -
                    new Date(a.date || 0)
            )
            .slice(0, 6);

    }


    /* =====================================================
       RENDER ACTIVITY
    ===================================================== */

    function renderActivity() {

        const container =
            $("activityList");


        if (!container) {

            return;

        }


        const activities =
            buildActivities();


        if (!activities.length) {

            container.innerHTML = `

                <div class="dashboard-empty">

                    <div class="dashboard-empty-icon">
                        <i class="bi bi-clock-history"></i>
                    </div>

                    <strong>
                        No recent activity
                    </strong>

                    <span>
                        Your profile activity will appear here.
                    </span>

                </div>

            `;

            return;

        }


        container.innerHTML =
            activities.map(activity => {

                return `

                    <div class="activity-item">

                        <div class="activity-icon">
                            <i class="bi ${escapeHTML(activity.icon)}"></i>
                        </div>

                        <div class="activity-content">

                            <strong>
                                ${escapeHTML(activity.title)}
                            </strong>

                            <span>
                                ${relativeTime(activity.date)}
                            </span>

                        </div>

                    </div>

                `;

            }).join("");

    }


    /* =====================================================
       COPY PROFILE LINK
    ===================================================== */

    async function copyProfileLink() {

        const url =
            DashboardState.publicUrl;


        if (!url) {

            showAlert(
                "Your public profile link is not available yet.",
                "error"
            );

            return;

        }


        try {

            await navigator.clipboard.writeText(url);


            showAlert(
                "Your public profile link has been copied.",
                "success"
            );


        } catch (error) {

            console.error(
                "Copy link error:",
                error
            );


            showAlert(
                "Could not copy the link automatically.",
                "error"
            );

        }

    }


    /* =====================================================
       SIDEBAR
    ===================================================== */

    function openSidebar() {

        $("dashboardSidebar")
            ?.classList.add("open");


        $("sidebarOverlay")
            ?.classList.add("active");

    }


    function closeSidebar() {

        $("dashboardSidebar")
            ?.classList.remove("open");


        $("sidebarOverlay")
            ?.classList.remove("active");

    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            if (
                typeof ServiceHubApp !== "undefined" &&
                typeof ServiceHubApp.logout === "function"
            ) {

                await ServiceHubApp.logout();

                return;

            }


            if (
                typeof ServiceHubAPI !== "undefined" &&
                typeof ServiceHubAPI.logout === "function"
            ) {

                await ServiceHubAPI.logout();

            }

        } catch (error) {

            console.error(
                "ServiceHub logout error:",
                error
            );

        }


        window.location.href =
            "./login.html";

    }


    /* =====================================================
       EVENT LISTENERS
    ===================================================== */

    function setupEvents() {

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


        $("copyProfileLinkButton")
            ?.addEventListener(
                "click",
                copyProfileLink
            );


        $("copyPublicLinkButton")
            ?.addEventListener(
                "click",
                copyProfileLink
            );


        $("viewPublicProfileButton")
            ?.addEventListener(
                "click",
                function (event) {

                    if (!DashboardState.publicUrl) {

                        event.preventDefault();

                        showAlert(
                            "Your public profile link is not available yet.",
                            "error"
                        );

                    }

                }
            );


        document
            .querySelectorAll(".sidebar-nav-link")
            .forEach(link => {

                link.addEventListener(
                    "click",
                    closeSidebar
                );

            });

    }


    /* =====================================================
       LOAD EVERYTHING
    ===================================================== */

    async function loadDashboard() {

        if (DashboardState.loading) {

            return;

        }


        DashboardState.loading = true;


        hideAlert();


        try {

            /*
             * STEP 1
             * Get authenticated user
             */

            const user =
                await loadCurrentUser();


            if (!user) {

                window.location.href =
                    "./login.html";

                return;

            }


            DashboardState.user =
                user;


            /*
             * STEP 2
             * Load profile
             */

            DashboardState.profile =
                await loadProfile(user);


            /*
             * STEP 3
             * Load the remaining dashboard
             * resources at the same time.
             */

            const results =
                await Promise.allSettled([

                    loadServices(),

                    loadWork(),

                    loadReviews(
                        DashboardState.profile
                    ),

                    loadAnalytics()

                ]);


            DashboardState.services =
                results[0].status === "fulfilled"
                    ? results[0].value
                    : [];


            DashboardState.work =
                results[1].status === "fulfilled"
                    ? results[1].value
                    : [];


            DashboardState.reviews =
                results[2].status === "fulfilled"
                    ? results[2].value
                    : [];


            DashboardState.analytics =
                results[3].status === "fulfilled"
                    ? results[3].value
                    : null;


            /*
             * STEP 4
             * Render everything
             */

            renderHeader();

            renderWelcome();

            renderStats();

            renderProfile();

            renderPublicPage();

            renderWork();

            renderServices();

            renderReviews();

            renderActivity();


            /*
             * Tell the console exactly what
             * the dashboard loaded.
             */

            console.log(
                "SERVICEHUB DASHBOARD LOADED",
                {
                    user:
                        DashboardState.user,

                    profile:
                        DashboardState.profile,

                    services:
                        DashboardState.services.length,

                    work:
                        DashboardState.work.length,

                    reviews:
                        DashboardState.reviews.length,

                    analytics:
                        DashboardState.analytics
                }
            );


        } catch (error) {

            console.error(
                "SERVICEHUB DASHBOARD ERROR:",
                error
            );


            showAlert(
                "We could not load your dashboard. Please refresh and try again.",
                "error"
            );


        } finally {

            DashboardState.loading =
                false;

        }

    }


    /* =====================================================
       INITIALIZE
    ===================================================== */

    function init() {

        setupEvents();

        loadDashboard();

    }


    /* =====================================================
       PUBLIC DASHBOARD API
    ===================================================== */

    window.ServiceHubDashboard = {

        reload:
            loadDashboard,

        getState:
            function () {

                return DashboardState;

            }

    };


    /* =====================================================
       START
    ===================================================== */

    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            init
        );

    } else {

        init();

    }


})();
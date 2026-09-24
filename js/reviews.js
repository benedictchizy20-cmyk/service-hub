/* =========================================================
   SERVICEHUB - REVIEWS
   FRONTEND / MOCK BACKEND READY
   ========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STATE
    ====================================================== */

    const state = {
        user: null,
        reviews: [],
        filteredReviews: [],
        responseReviewId: null
    };


    /* =====================================================
       HELPERS
    ====================================================== */

    const $ = (id) => document.getElementById(id);


    function firstDefined(...values) {

        for (const value of values) {

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


    function unwrapData(response) {

        if (!response) {
            return null;
        }

        if (response.data !== undefined) {
            return response.data;
        }

        return response;
    }


    function extractArray(response) {

        const data = unwrapData(response);

        if (Array.isArray(data)) {
            return data;
        }

        if (Array.isArray(data?.reviews)) {
            return data.reviews;
        }

        if (Array.isArray(data?.items)) {
            return data.items;
        }

        if (Array.isArray(data?.data)) {
            return data.data;
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

        const safeName = String(name || "Customer").trim();

        if (!safeName) {
            return "C";
        }

        const parts = safeName.split(/\s+/);

        if (parts.length === 1) {
            return parts[0].substring(0, 2).toUpperCase();
        }

        return (
            parts[0].charAt(0) +
            parts[parts.length - 1].charAt(0)
        ).toUpperCase();
    }


    function formatDate(value) {

        if (!value) {
            return "Recently";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return String(value);
        }

        return date.toLocaleDateString(
            undefined,
            {
                day: "numeric",
                month: "short",
                year: "numeric"
            }
        );
    }


    function renderStars(rating) {

        const value = Math.max(
            0,
            Math.min(5, Number(rating) || 0)
        );

        let html = "";

        for (let i = 1; i <= 5; i++) {

            html += i <= value
                ? '<i class="bi bi-star-fill"></i>'
                : '<i class="bi bi-star"></i>';

        }

        return html;
    }


    /* =====================================================
       NORMALIZE REVIEW
    ====================================================== */

    function normalizeReview(review) {

        const rating = Number(
            firstDefined(
                review.rating,
                review.stars,
                review.score,
                0
            )
        );

        return {

            id: firstDefined(
                review.id,
                review._id,
                `review-${Date.now()}-${Math.random()}`
            ),

            customerName: firstDefined(
                review.customerName,
                review.customer_name,
                review.reviewerName,
                review.reviewer_name,
                review.name,
                "Customer"
            ),

            customerEmail: firstDefined(
                review.customerEmail,
                review.customer_email,
                review.email,
                ""
            ),

            rating,

            comment: firstDefined(
                review.comment,
                review.review,
                review.message,
                review.text,
                "No review comment."
            ),

            service: firstDefined(
                review.service,
                review.serviceName,
                review.service_name,
                "Service"
            ),

            date: firstDefined(
                review.date,
                review.createdAt,
                review.created_at,
                review.updatedAt
            ),

            response: firstDefined(
                review.response,
                review.providerResponse,
                review.provider_response,
                ""
            ),

            status: firstDefined(
                review.status,
                "published"
            )

        };

    }


    /* =====================================================
       DEMO REVIEWS
    ====================================================== */

    function getDemoReviews() {

        return [

            {
                id: "review-1",
                customerName: "Michael Johnson",
                rating: 5,
                comment:
                    "Excellent service from start to finish. The work was delivered exactly as requested and the communication was very professional.",
                service: "Logo Design",
                date: "2026-09-18T10:00:00",
                response: ""
            },

            {
                id: "review-2",
                customerName: "Sarah Williams",
                rating: 5,
                comment:
                    "Very professional and creative. I was impressed with the attention to detail and how quickly everything was completed.",
                service: "Brand Identity",
                date: "2026-09-12T14:30:00",
                response: ""
            },

            {
                id: "review-3",
                customerName: "David Okafor",
                rating: 4,
                comment:
                    "Good experience overall. The final design looked great and the revisions were handled properly.",
                service: "Flyer Design",
                date: "2026-09-04T09:20:00",
                response: ""
            },

            {
                id: "review-4",
                customerName: "Grace Anderson",
                rating: 5,
                comment:
                    "I would definitely recommend this service. Everything was clear, professional and delivered on time.",
                service: "Social Media Design",
                date: "2026-08-27T16:45:00",
                response:
                    "Thank you so much, Grace. It was a pleasure working with you."
            }

        ].map(normalizeReview);

    }


    /* =====================================================
       LOAD USER
    ====================================================== */

    async function loadUser() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getCurrentUser === "function"
            ) {

                const result =
                    await ServiceHubAPI.getCurrentUser();

                if (result) {
                    state.user = unwrapData(result);
                }

            }

        } catch (error) {

            console.warn(
                "Reviews: API user lookup failed.",
                error
            );

        }


        if (!state.user) {

            try {

                if (
                    window.ServiceHubAuth &&
                    typeof ServiceHubAuth.getCurrentUser === "function"
                ) {

                    state.user =
                        await ServiceHubAuth.getCurrentUser();

                }

            } catch (error) {

                console.warn(
                    "Reviews: Auth user lookup failed.",
                    error
                );

            }

        }


        if (!state.user) {

            window.location.href = "./login.html";
            return false;

        }

        return true;
    }


    /* =====================================================
       USER UI
    ====================================================== */

    function renderUser() {

        const user = state.user || {};

        const name = firstDefined(
            user.fullName,
            user.full_name,
            user.name,
            user.email,
            "User"
        );

        const role = firstDefined(
            user.role,
            user.accountType,
            user.account_type,
            "Service Provider"
        );

        const initials = getInitials(name);


        if ($("sidebarUserName")) {
            $("sidebarUserName").textContent = name;
        }

        if ($("sidebarUserType")) {
            $("sidebarUserType").textContent =
                role === "provider"
                    ? "Service Provider"
                    : role;
        }

        if ($("sidebarUserAvatar")) {
            $("sidebarUserAvatar").textContent = initials;
        }

        if ($("topbarUserName")) {
            $("topbarUserName").textContent = name;
        }

        if ($("topbarAvatar")) {
            $("topbarAvatar").textContent = initials;
        }

    }


    /* =====================================================
       LOAD REVIEWS
    ====================================================== */

    async function loadReviews() {

        let reviews = [];


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getReviews === "function"
            ) {

                const result =
                    await ServiceHubAPI.getReviews();

                reviews = extractArray(result);

            }

        } catch (error) {

            console.warn(
                "Reviews API unavailable. Using mock data.",
                error
            );

        }


        if (!reviews.length) {

            reviews = getDemoReviews();

        }


        state.reviews =
            reviews.map(normalizeReview);

        state.filteredReviews =
            [...state.reviews];


        renderSummary();
        renderReviews();

    }


    /* =====================================================
       SUMMARY
    ====================================================== */

    function renderSummary() {

        const reviews = state.reviews;

        const total = reviews.length;

        const average = total
            ? reviews.reduce(
                (sum, review) =>
                    sum + Number(review.rating || 0),
                0
            ) / total
            : 0;


        if ($("averageRating")) {
            $("averageRating").textContent =
                average.toFixed(1);
        }

        if ($("totalReviews")) {
            $("totalReviews").textContent =
                `${total} ${total === 1 ? "review" : "reviews"}`;
        }


        const counts = {
            5: 0,
            4: 0,
            3: 0,
            2: 0,
            1: 0
        };


        reviews.forEach(review => {

            const rating = Math.round(
                Number(review.rating || 0)
            );

            if (counts[rating] !== undefined) {
                counts[rating]++;
            }

        });


        for (let rating = 5; rating >= 1; rating--) {

            const count = counts[rating];

            const percentage = total
                ? (count / total) * 100
                : 0;


            const countElement =
                $(`ratingCount${rating}`);

            const barElement =
                $(`ratingBar${rating}`);


            if (countElement) {
                countElement.textContent = count;
            }

            if (barElement) {
                barElement.style.width =
                    `${percentage}%`;
            }

        }

    }


    /* =====================================================
       RENDER REVIEWS
    ====================================================== */

    function renderReviews() {

        const grid = $("reviewsList");
        const empty = $("reviewsEmpty");
        const noResults = $("reviewsNoResults");

        if (!grid) {
            return;
        }


        grid.innerHTML = "";


        if (!state.reviews.length) {

            if (empty) {
                empty.classList.remove("d-none");
            }

            if (noResults) {
                noResults.classList.add("d-none");
            }

            return;
        }


        if (!state.filteredReviews.length) {

            if (empty) {
                empty.classList.add("d-none");
            }

            if (noResults) {
                noResults.classList.remove("d-none");
            }

            return;
        }


        if (empty) {
            empty.classList.add("d-none");
        }

        if (noResults) {
            noResults.classList.add("d-none");
        }


        state.filteredReviews.forEach(review => {

            const card =
                document.createElement("article");

            card.className = "review-card";

            card.dataset.id = review.id;


            const responseHTML =
                review.response
                    ? `
                        <div class="review-response">
                            <strong>Your response</strong>
                            <span>
                                ${escapeHTML(review.response)}
                            </span>
                        </div>
                    `
                    : "";


            const responseButton =
                review.response
                    ? `
                        <button
                            type="button"
                            class="review-action-button"
                            data-action="respond"
                            data-id="${escapeHTML(review.id)}"
                        >
                            <i class="bi bi-pencil"></i>
                            Edit Response
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="review-action-button primary"
                            data-action="respond"
                            data-id="${escapeHTML(review.id)}"
                        >
                            <i class="bi bi-reply-fill"></i>
                            Respond
                        </button>
                    `;


            card.innerHTML = `

                <div class="review-card-header">

                    <div class="reviewer-info">

                        <div class="reviewer-avatar">
                            ${escapeHTML(
                                getInitials(
                                    review.customerName
                                )
                            )}
                        </div>

                        <div>

                            <span class="reviewer-name">
                                ${escapeHTML(
                                    review.customerName
                                )}
                            </span>

                            <span class="reviewer-date">
                                ${escapeHTML(
                                    formatDate(review.date)
                                )}
                            </span>

                        </div>

                    </div>

                    <div class="review-stars">
                        ${renderStars(review.rating)}
                    </div>

                </div>


                <div class="review-comment">
                    ${escapeHTML(review.comment)}
                </div>


                <div class="review-service">
                    <i class="bi bi-briefcase-fill"></i>
                    ${escapeHTML(review.service)}
                </div>

                ${responseHTML}


                <div class="review-actions">

                    ${responseButton}

                </div>
            `;


            grid.appendChild(card);

        });

    }


    /* =====================================================
       FILTER
    ====================================================== */

    function filterReviews() {

        const search =
            String(
                $("reviewSearch")?.value || ""
            )
                .trim()
                .toLowerCase();


        const rating =
            $("reviewRatingFilter")?.value || "all";


        state.filteredReviews =
            state.reviews.filter(review => {

                const searchable = [
                    review.customerName,
                    review.comment,
                    review.service
                ]
                    .join(" ")
                    .toLowerCase();


                const matchesSearch =
                    !search ||
                    searchable.includes(search);


                const matchesRating =
                    rating === "all" ||
                    Number(review.rating) === Number(rating);


                return (
                    matchesSearch &&
                    matchesRating
                );

            });


        renderReviews();

    }


    /* =====================================================
       RESPONSE MODAL
    ====================================================== */

    function openResponseModal(id) {

        const review =
            state.reviews.find(
                item => String(item.id) === String(id)
            );

        if (!review) {
            return;
        }


        state.responseReviewId = review.id;


        if ($("responseCustomerName")) {
            $("responseCustomerName").textContent =
                review.customerName;
        }

        if ($("responseComment")) {
            $("responseComment").textContent =
                review.comment;
        }

        if ($("reviewResponseText")) {
            $("reviewResponseText").value =
                review.response || "";
        }


        const modalElement =
            $("responseModal");

        if (!modalElement) {
            return;
        }


        const modal =
            bootstrap.Modal.getOrCreateInstance(
                modalElement
            );

        modal.show();

    }


    async function saveResponse() {

        const id =
            state.responseReviewId;

        const review =
            state.reviews.find(
                item => String(item.id) === String(id)
            );

        if (!review) {
            return;
        }


        const response =
            String(
                $("reviewResponseText")?.value || ""
            ).trim();


        if (!response) {

            showAlert(
                "Please write a response before saving.",
                "warning"
            );

            return;
        }


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.respondToReview === "function"
            ) {

                await ServiceHubAPI.respondToReview(
                    id,
                    {
                        response
                    }
                );

            } else if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateReview === "function"
            ) {

                await ServiceHubAPI.updateReview(
                    id,
                    {
                        response
                    }
                );

            }

        } catch (error) {

            console.warn(
                "Review response API unavailable.",
                error
            );

        }


        review.response = response;


        renderReviews();


        const modalElement =
            $("responseModal");

        if (modalElement) {

            const modal =
                bootstrap.Modal.getInstance(
                    modalElement
                );

            if (modal) {
                modal.hide();
            }

        }


        showAlert(
            "Your response has been saved.",
            "success"
        );

    }


    /* =====================================================
       ALERT
    ====================================================== */

    function showAlert(message, type = "success") {

        const container =
            $("reviewsAlert");

        if (!container) {
            return;
        }


        container.innerHTML = `

            <div
                class="alert alert-${type} alert-dismissible fade show"
                role="alert"
            >
                ${escapeHTML(message)}

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                ></button>
            </div>

        `;

    }


    /* =====================================================
       MOBILE SIDEBAR
    ====================================================== */

    function setupMobileMenu() {

        const button =
            $("mobileMenuButton");

        const sidebar =
            $("sidebar");


        if (!button || !sidebar) {
            return;
        }


        button.addEventListener(
            "click",
            () => {

                sidebar.classList.toggle(
                    "show"
                );

            }
        );

    }


    /* =====================================================
       LOGOUT
    ====================================================== */

    async function logout() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.logout === "function"
            ) {

                await ServiceHubAPI.logout();

            } else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.logout === "function"
            ) {

                await ServiceHubAuth.logout();

            }

        } catch (error) {

            console.warn(
                "Logout error:",
                error
            );

        }


        window.location.href =
            "./login.html";

    }


    /* =====================================================
       EVENTS
    ====================================================== */

    function setupEvents() {

        $("reviewSearch")?.addEventListener(
            "input",
            filterReviews
        );

        $("reviewRatingFilter")?.addEventListener(
            "change",
            filterReviews
        );


        $("reviewsList")?.addEventListener(
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


                if (action === "respond") {
                    openResponseModal(id);
                }

            }
        );


        $("saveReviewResponse")?.addEventListener(
            "click",
            saveResponse
        );


        $("logoutButton")?.addEventListener(
            "click",
            logout
        );


        setupMobileMenu();

    }


    /* =====================================================
       INITIALIZE
    ====================================================== */

    async function init() {

        const authenticated =
            await loadUser();

        if (!authenticated) {
            return;
        }


        renderUser();

        setupEvents();

        await loadReviews();

    }


    /* =====================================================
       PUBLIC API
    ====================================================== */

    window.ServiceHubReviews = {

        reload: loadReviews,

        getState: () => state,

        filter: filterReviews

    };


    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();
/* =========================================================
   SERVICEHUB - SERVICES PAGE
   REAL BACKEND / SUPABASE READY
   ========================================================= */

// (function () {

    "use strict";


    /* =====================================================
       STATE
    ===================================================== */

    const state = {

        user: null,

        services: [],

        filteredServices: [],

        editingId: null

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
            Array.isArray(data.services)
        ) {

            return data.services;

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

        const value =
            String(
                name || "ServiceHub"
            )
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

            value[value.length - 1]
                .charAt(0)

        ).toUpperCase();

    }


    /* =====================================================
       UUID VALIDATION
       ===================================================== */

    function isValidUUID(value) {

        if (!value) {

            return false;

        }


        const uuid =
            String(value).trim();


        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
            .test(uuid);

    }


    /* =====================================================
       PRICE
    ===================================================== */

    function formatPrice(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {

            return "Contact";

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


    function formatAveragePrice(value) {

        const number =
            Number(value);


        if (
            !Number.isFinite(number) ||
            number <= 0
        ) {

            return "₦0";

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


    /* =====================================================
       NORMALIZE SERVICE
       ===================================================== */

    function normalizeService(service) {

        service =
            service || {};


        const rawId =
            firstDefined(
                service.id,
                service.service_id
            );


        /*
         * IMPORTANT:
         *
         * Do NOT generate a fake ID.
         *
         * Supabase services.id is a UUID.
         */

        const id =
            isValidUUID(rawId)
                ? String(rawId)
                : null;


        return {

            id,

            name:
                firstDefined(
                    service.name,
                    service.title,
                    service.service_name
                ) ||
                "Untitled Service",


            category:
                firstDefined(
                    service.category,
                    service.type
                ) ||
                "Other",


            description:
                firstDefined(
                    service.description,
                    service.details
                ) ||
                "",


            price:
                firstDefined(
                    service.price,
                    service.amount,
                    service.starting_price
                ) || 0,


            /*
             * Database column:
             *
             * price_type
             */

            pricingType:
                firstDefined(
                    service.price_type,
                    service.pricingType
                ) ||
                "fixed",


            duration:
                firstDefined(
                    service.duration,
                    service.estimated_duration
                ) ||
                "",


            /*
             * Database column:
             *
             * active
             */

            active:
                service.active !== undefined

                    ? Boolean(
                        service.active
                    )

                    : service.is_active !== undefined

                        ? Boolean(
                            service.is_active
                        )

                        : true,


            image:
                firstDefined(
                    service.image
                ) || null,


            createdAt:
                firstDefined(
                    service.created_at,
                    service.createdAt
                ) ||
                null,


            updatedAt:
                firstDefined(
                    service.updated_at,
                    service.updatedAt
                ) ||
                null

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
            $("servicesAlert");


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
                    ) || response;

            }

            else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.getCurrentUser ===
                    "function"
            ) {

                state.user =
                    await ServiceHubAuth.getCurrentUser();

            }

            else {

                state.user = null;

            }

        }

        catch (error) {

            console.error(
                "ServiceHub Services: unable to load user",
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


    /* =====================================================
       RENDER USER
    ===================================================== */

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


        const sidebarAvatar =
            $("sidebarAvatar");


        if (sidebarAvatar) {

            const image =
                firstDefined(
                    user.avatar,
                    user.avatar_url,
                    user.profile_image,
                    user.profileImage,
                    user.photo
                );


            if (image) {

                sidebarAvatar.innerHTML =
                    '<img src="' +
                    escapeHTML(image) +
                    '" alt="Profile">';

            }

            else {

                sidebarAvatar.innerHTML =
                    "<span>" +
                    escapeHTML(initials) +
                    "</span>";

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

            const image =
                firstDefined(
                    user.avatar,
                    user.avatar_url,
                    user.profile_image,
                    user.profileImage,
                    user.photo
                );


            if (image) {

                topbarAvatar.innerHTML =
                    '<img src="' +
                    escapeHTML(image) +
                    '" alt="Profile">';

            }

            else {

                topbarAvatar.innerHTML =
                    "<span>" +
                    escapeHTML(initials) +
                    "</span>";

            }

        }

    }


    /* =====================================================
       LOAD SERVICES
       ===================================================== */

    async function loadServices() {

        state.services = [];


        try {

            if (
                !window.ServiceHubAPI ||
                typeof ServiceHubAPI.getServices !==
                    "function"
            ) {

                throw new Error(
                    "Service API is not available."
                );

            }


            const response =
                await ServiceHubAPI.getServices();


            const rawServices =
                extractArray(response);


            const normalized =
                rawServices.map(
                    normalizeService
                );


            /*
             * Only keep services that have
             * a real Supabase UUID.
             *
             * This prevents old mock records
             * from entering the edit/delete flow.
             */

            state.services =
                normalized.filter(
                    service =>
                        isValidUUID(
                            service.id
                        )
                );


            /*
             * If old mock records are still
             * coming from the API, warn clearly.
             */

            if (
                normalized.length &&
                state.services.length !==
                    normalized.length
            ) {

                console.warn(
                    "ServiceHub: ignored service records without valid Supabase UUIDs.",
                    normalized
                );

            }

        }

        catch (error) {

            console.error(
                "ServiceHub Services: load error",
                error
            );


            showAlert(
                error?.message ||
                "Unable to load services.",
                "danger"
            );

        }


        renderAll();

    }


    /* =====================================================
       FILTER
    ===================================================== */

    function getFilteredServices() {

        const search =
            String(
                $("serviceSearch")?.value ||
                ""
            )
                .trim()
                .toLowerCase();


        const status =
            $("serviceStatusFilter")?.value ||
            "all";


        return state.services.filter(
            service => {

                const matchesSearch =

                    !search ||

                    service.name
                        .toLowerCase()
                        .includes(search) ||

                    service.description
                        .toLowerCase()
                        .includes(search) ||

                    service.category
                        .toLowerCase()
                        .includes(search);


                const matchesStatus =

                    status === "all" ||

                    (
                        status === "active" &&
                        service.active
                    ) ||

                    (
                        status === "inactive" &&
                        !service.active
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
            state.services.length;


        const active =
            state.services.filter(
                service =>
                    service.active
            ).length;


        const inactive =
            total - active;


        const prices =
            state.services

                .map(
                    service =>
                        Number(
                            service.price
                        )
                )

                .filter(
                    price =>
                        Number.isFinite(price) &&
                        price > 0
                );


        const average =
            prices.length

                ? prices.reduce(
                    (sum, value) =>
                        sum + value,
                    0
                ) / prices.length

                : 0;


        if ($("totalServices")) {

            $("totalServices")
                .textContent =
                total;

        }


        if ($("activeServices")) {

            $("activeServices")
                .textContent =
                active;

        }


        if ($("inactiveServices")) {

            $("inactiveServices")
                .textContent =
                inactive;

        }


        if ($("averageServicePrice")) {

            $("averageServicePrice")
                .textContent =
                formatAveragePrice(
                    average
                );

        }

    }


    /* =====================================================
       SERVICE ICON
    ===================================================== */

    function getServiceIcon(
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


        return "bi-briefcase-fill";

    }


    /* =====================================================
       PRICE LABEL
    ===================================================== */

    function getPricingLabel(
        service
    ) {

        switch (
            service.pricingType
        ) {

            case "starting":

                return "Starting from";


            case "negotiable":

                return "Negotiable";


            case "contact":

                return "Price on request";


            default:

                return "Fixed price";

        }

    }


    /* =====================================================
       RENDER SERVICES
    ===================================================== */

    function renderServices() {

        const grid =
            $("servicesGrid");


        if (!grid) {

            return;

        }


        const services =
            getFilteredServices();


        state.filteredServices =
            services;


        grid.innerHTML = "";


        const empty =
            $("servicesEmpty");


        const noResults =
            $("servicesNoResults");


        if (!state.services.length) {

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


        if (!services.length) {

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
            services
                .map(
                    service => {

                        const icon =
                            getServiceIcon(
                                service.category
                            );


                        const statusClass =
                            service.active
                                ? "active"
                                : "inactive";


                        const statusText =
                            service.active
                                ? "Active"
                                : "Inactive";


                        const duration =
                            service.duration

                                ? `
                                    <span class="service-detail">
                                        <i class="bi bi-clock"></i>
                                        ${escapeHTML(
                                            service.duration
                                        )}
                                    </span>
                                  `

                                : "";


                        const category =
                            service.category
                                ? escapeHTML(
                                    service.category
                                )
                                : "Other";


                        return `

                            <article
                                class="service-card"
                                data-service-id="${escapeHTML(
                                    service.id
                                )}"
                            >

                                <div class="service-card-top">

                                    <div class="service-card-icon">
                                        <i class="bi ${icon}"></i>
                                    </div>


                                    <span
                                        class="service-status-badge ${statusClass}"
                                    >

                                        <i class="bi bi-circle-fill"></i>

                                        ${statusText}

                                    </span>

                                </div>


                                <h3>
                                    ${escapeHTML(
                                        service.name
                                    )}
                                </h3>


                                <div class="service-card-category">

                                    ${category}

                                </div>


                                <p class="service-card-description">

                                    ${escapeHTML(
                                        service.description ||
                                        "No description provided."
                                    )}

                                </p>


                                <div class="service-card-details">

                                    <span class="service-detail">

                                        <i class="bi bi-tag-fill"></i>

                                        ${escapeHTML(
                                            getPricingLabel(
                                                service
                                            )
                                        )}

                                    </span>


                                    ${duration}

                                </div>


                                <div class="service-card-price">

                                    <div class="service-price-copy">

                                        <span>

                                            ${escapeHTML(
                                                getPricingLabel(
                                                    service
                                                )
                                            )}

                                        </span>


                                        <strong>

                                            ${formatPrice(
                                                service.price
                                            )}

                                        </strong>

                                    </div>


                                    <div class="service-card-actions">

                                        <button
                                            type="button"
                                            class="service-action-button"
                                            data-action="edit"
                                            data-id="${escapeHTML(
                                                service.id
                                            )}"
                                            title="Edit service"
                                        >

                                            <i class="bi bi-pencil"></i>

                                        </button>


                                        <button
                                            type="button"
                                            class="service-action-button delete"
                                            data-action="delete"
                                            data-id="${escapeHTML(
                                                service.id
                                            )}"
                                            title="Delete service"
                                        >

                                            <i class="bi bi-trash3"></i>

                                        </button>

                                    </div>

                                </div>

                            </article>

                        `;

                    }
                )
                .join("");

    }


    /* =====================================================
       RENDER ALL
    ===================================================== */

    function renderAll() {

        renderStats();

        renderServices();

    }


    /* =====================================================
       MODAL
    ===================================================== */

    function openServiceModal(
        service = null
    ) {

        const modal =
            $("serviceModal");


        if (!modal) {

            return;

        }


        /*
         * Editing requires a real UUID.
         */

        if (
            service &&
            !isValidUUID(
                service.id
            )
        ) {

            showAlert(
                "This service does not have a valid database ID. Please reload the page.",
                "danger"
            );

            return;

        }


        state.editingId =
            service
                ? service.id
                : null;


        $("serviceModalTitle")
            .textContent =

            service
                ? "Edit Service"
                : "Add Service";


        $("serviceId").value =
            service?.id || "";


        $("serviceName").value =
            service?.name || "";


        $("serviceCategory").value =
            service?.category || "";


        $("serviceDuration").value =
            service?.duration || "";


        $("serviceDescription").value =
            service?.description || "";


        $("servicePrice").value =
            service?.price || "";


        $("servicePricingType").value =
            service?.pricingType ||
            "fixed";


        $("serviceActive").checked =
            service
                ? Boolean(
                    service.active
                )
                : true;


        updateDescriptionCount();


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

                $("serviceName")
                    ?.focus();

            },
            100
        );

    }


    function closeServiceModal() {

        const modal =
            $("serviceModal");


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


        $("serviceForm")
            ?.reset();


        if ($("serviceId")) {

            $("serviceId").value =
                "";

        }


        state.editingId =
            null;


        if ($("serviceActive")) {

            $("serviceActive").checked =
                true;

        }


        updateDescriptionCount();

    }


    /* =====================================================
       SAVE SERVICE
       ===================================================== */

    async function saveService(
        event
    ) {

        event.preventDefault();


        const name =
            $("serviceName")
                .value
                .trim();


        const description =
            $("serviceDescription")
                .value
                .trim();


        if (
            !name ||
            !description
        ) {

            showAlert(
                "Please enter the service name and description.",
                "danger"
            );

            return;

        }


        /*
         * IMPORTANT:
         *
         * Only send fields that exist
         * in the real Supabase table.
         *
         * services:
         *
         * id
         * user_id
         * name
         * category
         * description
         * price
         * price_type
         * duration
         * active
         * created_at
         * updated_at
         * image
         */

        const serviceData = {

            name,

            category:
                $("serviceCategory")
                    .value ||
                "Other",

            description,

            price:
                Number(
                    $("servicePrice")
                        .value
                ) || 0,

            price_type:
                $("servicePricingType")
                    .value ||
                "fixed",

            duration:
                $("serviceDuration")
                    .value
                    .trim(),

            active:
                $("serviceActive")
                    .checked

        };


        try {

            /* =================================================
               UPDATE
            ================================================= */

            if (
                state.editingId
            ) {

                if (
                    !isValidUUID(
                        state.editingId
                    )
                ) {

                    throw new Error(
                        "Invalid service ID. Please reload the Services page."
                    );

                }


                if (
                    !window.ServiceHubAPI ||
                    typeof ServiceHubAPI.updateService !==
                        "function"
                ) {

                    throw new Error(
                        "Service update API is not available."
                    );

                }


                const response =
                    await ServiceHubAPI.updateService(
                        state.editingId,
                        serviceData
                    );


                const rawUpdated =
                    unwrapData(
                        response
                    );


                const updated =
                    normalizeService(
                        rawUpdated
                    );


                if (
                    !isValidUUID(
                        updated.id
                    )
                ) {

                    throw new Error(
                        "The backend did not return a valid service ID."
                    );

                }


                const index =
                    state.services.findIndex(
                        service =>
                            String(
                                service.id
                            ) ===
                            String(
                                state.editingId
                            )
                    );


                if (index !== -1) {

                    state.services[index] =
                        updated;

                }


                closeServiceModal();

                renderAll();


                showAlert(
                    "Service updated successfully."
                );


                return;

            }


            /* =================================================
               CREATE
            ================================================= */

            if (
                !window.ServiceHubAPI ||
                typeof ServiceHubAPI.createService !==
                    "function"
            ) {

                throw new Error(
                    "Service creation API is not available."
                );

            }


            const response =
                await ServiceHubAPI.createService(
                    serviceData
                );


            const rawCreated =
                unwrapData(
                    response
                );


            const created =
                normalizeService(
                    rawCreated
                );


            /*
             * Supabase must generate
             * a real UUID.
             */

            if (
                !isValidUUID(
                    created.id
                )
            ) {

                throw new Error(
                    "The backend did not return a valid service ID. Make sure the real ServiceHub backend is enabled."
                );

            }


            state.services.unshift(
                created
            );


            closeServiceModal();

            renderAll();


            showAlert(
                "Service added successfully."
            );

        }

        catch (error) {

            console.error(
                "ServiceHub Services: save error",
                error
            );


            showAlert(
                error?.message ||
                "Unable to save this service.",
                "danger"
            );

        }

    }


    /* =====================================================
       DELETE
       ===================================================== */

    async function deleteService(
        id
    ) {

        if (
            !isValidUUID(id)
        ) {

            showAlert(
                "Invalid service ID. Please reload the Services page.",
                "danger"
            );

            return;

        }


        const service =
            state.services.find(
                item =>
                    String(
                        item.id
                    ) ===
                    String(id)
            );


        if (!service) {

            return;

        }


        const confirmed =
            window.confirm(
                `Delete "${service.name}"? This action cannot be undone.`
            );


        if (!confirmed) {

            return;

        }


        try {

            if (
                !window.ServiceHubAPI ||
                typeof ServiceHubAPI.deleteService !==
                    "function"
            ) {

                throw new Error(
                    "Service delete API is not available."
                );

            }


            await ServiceHubAPI.deleteService(
                id
            );


            state.services =
                state.services.filter(
                    item =>
                        String(
                            item.id
                        ) !==
                        String(id)
                );


            renderAll();


            showAlert(
                "Service deleted successfully."
            );

        }

        catch (error) {

            console.error(
                "ServiceHub Services: delete error",
                error
            );


            showAlert(
                error?.message ||
                "Unable to delete this service.",
                "danger"
            );

        }

    }


    /* =====================================================
       DESCRIPTION COUNT
    ===================================================== */

    function updateDescriptionCount() {

        const textarea =
            $("serviceDescription");


        const counter =
            $("serviceDescriptionCount");


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

        const sidebar =
            $("dashboardSidebar");


        const overlay =
            $("sidebarOverlay");


        sidebar?.classList.add(
            "open"
        );


        overlay?.classList.add(
            "show"
        );

    }


    function closeSidebar() {

        const sidebar =
            $("dashboardSidebar");


        const overlay =
            $("sidebarOverlay");


        sidebar?.classList.remove(
            "open"
        );


        overlay?.classList.remove(
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

        }

        catch (error) {

            console.error(
                "ServiceHub logout error",
                error
            );

        }

        finally {

            window.location.href =
                "./login.html";

        }

    }


    /* =====================================================
       EVENTS
    ===================================================== */

    function setupEvents() {

        $("addServiceButton")
            ?.addEventListener(
                "click",
                () =>
                    openServiceModal()
            );


        $("emptyAddServiceButton")
            ?.addEventListener(
                "click",
                () =>
                    openServiceModal()
            );


        $("closeServiceModal")
            ?.addEventListener(
                "click",
                closeServiceModal
            );


        $("cancelServiceButton")
            ?.addEventListener(
                "click",
                closeServiceModal
            );


        $("serviceModal")
            ?.querySelector(
                ".service-modal-backdrop"
            )
            ?.addEventListener(
                "click",
                closeServiceModal
            );


        $("serviceForm")
            ?.addEventListener(
                "submit",
                saveService
            );


        $("serviceDescription")
            ?.addEventListener(
                "input",
                updateDescriptionCount
            );


        $("serviceSearch")
            ?.addEventListener(
                "input",
                renderServices
            );


        $("serviceStatusFilter")
            ?.addEventListener(
                "change",
                renderServices
            );


        $("servicesGrid")
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

                        const service =
                            state.services.find(
                                item =>
                                    String(
                                        item.id
                                    ) ===
                                    String(id)
                            );


                        if (service) {

                            openServiceModal(
                                service
                            );

                        }

                    }


                    if (
                        action === "delete"
                    ) {

                        deleteService(
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
                    event.key === "Escape" &&
                    $("serviceModal")
                        ?.classList
                        .contains("open")
                ) {

                    closeServiceModal();

                }

            }
        );

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

        await loadServices();


        console.log(
            "ServiceHub Services page loaded successfully."
        );

    }


    document.addEventListener(
        "DOMContentLoaded",
        init
    );


    /* =====================================================
       PUBLIC API
    ===================================================== */

    window.ServiceHubServices = {

        reload:
            loadServices,


        getState:
            function () {

                return state;

            },


        openModal:
            openServiceModal,


        closeModal:
            closeServiceModal

    };

})();
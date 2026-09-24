/* =========================================================
   SERVICEHUB - SERVICES PAGE
   Frontend / mock-ready
   Backend-ready API detection
   ========================================================= */

(function () {
    "use strict";

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
            value => value !== undefined &&
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

        if (data && Array.isArray(data.services)) {
            return data.services;
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

        const value = String(name || "ServiceHub")
            .trim()
            .split(/\s+/)
            .filter(Boolean);

        if (!value.length) {
            return "SH";
        }

        if (value.length === 1) {
            return value[0].slice(0, 2).toUpperCase();
        }

        return (
            value[0].charAt(0) +
            value[value.length - 1].charAt(0)
        ).toUpperCase();
    }


    function formatPrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) {
            return "Contact";
        }

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(number);
    }


    function formatAveragePrice(value) {

        const number = Number(value);

        if (!Number.isFinite(number) || number <= 0) {
            return "₦0";
        }

        return new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency: "NGN",
            maximumFractionDigits: 0
        }).format(number);
    }


    function normalizeService(service) {

        service = service || {};

        return {
            id: firstDefined(
                service.id,
                service._id,
                service.service_id
            ) || ("service-" + Date.now() + "-" + Math.random()),

            name: firstDefined(
                service.name,
                service.title,
                service.service_name
            ) || "Untitled Service",

            category: firstDefined(
                service.category,
                service.type
            ) || "Other",

            description: firstDefined(
                service.description,
                service.details
            ) || "",

            price: firstDefined(
                service.price,
                service.amount,
                service.starting_price
            ) || 0,

            currency: firstDefined(
                service.currency
            ) || "NGN",

            pricingType: firstDefined(
                service.pricingType,
                service.pricing_type
            ) || "fixed",

            duration: firstDefined(
                service.duration,
                service.estimated_duration
            ) || "",

            active: service.active !== undefined
                ? Boolean(service.active)
                : service.is_active !== undefined
                    ? Boolean(service.is_active)
                    : true,

            createdAt: firstDefined(
                service.createdAt,
                service.created_at
            ) || new Date().toISOString(),

            updatedAt: firstDefined(
                service.updatedAt,
                service.updated_at
            ) || new Date().toISOString()
        };
    }


    function showAlert(message, type = "success") {

        const alert = $("servicesAlert");

        if (!alert) {
            return;
        }

        alert.className =
            "dashboard-alert " +
            (type === "danger"
                ? "dashboard-alert-danger"
                : "dashboard-alert-success");

        alert.textContent = message;

        alert.classList.remove("d-none");

        window.clearTimeout(showAlert.timer);

        showAlert.timer = window.setTimeout(() => {
            alert.classList.add("d-none");
        }, 4000);
    }


    /* =====================================================
       USER
    ===================================================== */

    async function loadCurrentUser() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getCurrentUser === "function"
            ) {

                const response =
                    await ServiceHubAPI.getCurrentUser();

                state.user = unwrapData(response) || response;
            }

            else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.getCurrentUser === "function"
            ) {

                state.user =
                    await ServiceHubAuth.getCurrentUser();

            }

            else {

                state.user = null;

            }

        } catch (error) {

            console.error(
                "ServiceHub Services: unable to load user",
                error
            );

            state.user = null;
        }


        if (!state.user) {

            const currentPath =
                window.location.pathname;

            if (!currentPath.includes("login.html")) {
                window.location.href = "./login.html";
                return false;
            }
        }

        return true;
    }


    function renderUser() {

        const user = state.user || {};

        const name = firstDefined(
            user.full_name,
            user.fullName,
            user.name,
            user.username,
            user.email
        ) || "ServiceHub User";


        const role = firstDefined(
            user.role,
            user.user_type,
            user.account_type,
            user.type
        ) || "Provider";


        const initials = getInitials(name);


        const sidebarName = $("sidebarUserName");

        if (sidebarName) {
            sidebarName.textContent = name;
        }


        const sidebarType = $("sidebarUserType");

        if (sidebarType) {
            sidebarType.textContent =
                String(role).replace(/_/g, " ");
        }


        const sidebarAvatar = $("sidebarAvatar");

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

            } else {

                sidebarAvatar.innerHTML =
                    '<span>' +
                    escapeHTML(initials) +
                    "</span>";
            }
        }


        const topbarName = $("topbarUserName");

        if (topbarName) {
            topbarName.textContent = name;
        }


        const topbarAvatar = $("topbarAvatar");

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

            } else {

                topbarAvatar.innerHTML =
                    '<span>' +
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
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.getServices === "function"
            ) {

                const response =
                    await ServiceHubAPI.getServices();

                state.services =
                    extractArray(response)
                        .map(normalizeService);

            }

            else {

                /*
                 * No backend endpoint yet.
                 * The page starts empty and allows frontend
                 * interaction until the API is connected.
                 */
                state.services = [];
            }

        } catch (error) {

            console.error(
                "ServiceHub Services: load error",
                error
            );

            showAlert(
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
                $("serviceSearch")?.value || ""
            )
                .trim()
                .toLowerCase();


        const status =
            $("serviceStatusFilter")?.value || "all";


        return state.services.filter(service => {

            const matchesSearch =
                !search ||
                service.name.toLowerCase().includes(search) ||
                service.description.toLowerCase().includes(search) ||
                service.category.toLowerCase().includes(search);


            const matchesStatus =
                status === "all" ||
                (status === "active" && service.active) ||
                (status === "inactive" && !service.active);


            return matchesSearch && matchesStatus;
        });
    }


    /* =====================================================
       STATS
    ===================================================== */

    function renderStats() {

        const total =
            state.services.length;


        const active =
            state.services.filter(
                service => service.active
            ).length;


        const inactive =
            total - active;


        const prices =
            state.services
                .map(service => Number(service.price))
                .filter(price =>
                    Number.isFinite(price) &&
                    price > 0
                );


        const average =
            prices.length
                ? prices.reduce(
                    (sum, value) => sum + value,
                    0
                ) / prices.length
                : 0;


        $("totalServices").textContent = total;
        $("activeServices").textContent = active;
        $("inactiveServices").textContent = inactive;
        $("averageServicePrice").textContent =
            formatAveragePrice(average);
    }


    /* =====================================================
       SERVICE ICON
    ===================================================== */

    function getServiceIcon(category) {

        const value =
            String(category || "").toLowerCase();


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

        return "bi-briefcase-fill";
    }


    /* =====================================================
       PRICE LABEL
    ===================================================== */

    function getPricingLabel(service) {

        switch (service.pricingType) {

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

        const grid = $("servicesGrid");

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

            grid.classList.add("d-none");

            empty.classList.remove("d-none");
            noResults.classList.add("d-none");

            return;
        }


        if (!services.length) {

            grid.classList.add("d-none");

            empty.classList.add("d-none");
            noResults.classList.remove("d-none");

            return;
        }


        grid.classList.remove("d-none");

        empty.classList.add("d-none");
        noResults.classList.add("d-none");


        grid.innerHTML =
            services.map(service => {

                const icon =
                    getServiceIcon(service.category);


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
                                ${escapeHTML(service.duration)}
                            </span>
                          `
                        : "";


                const category =
                    service.category
                        ? escapeHTML(service.category)
                        : "Other";


                return `
                    <article
                        class="service-card"
                        data-service-id="${escapeHTML(service.id)}"
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
                            ${escapeHTML(service.name)}
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
                                    getPricingLabel(service)
                                )}
                            </span>

                            ${duration}

                        </div>


                        <div class="service-card-price">

                            <div class="service-price-copy">

                                <span>
                                    ${escapeHTML(
                                        getPricingLabel(service)
                                    )}
                                </span>

                                <strong>
                                    ${formatPrice(service.price)}
                                </strong>

                            </div>


                            <div class="service-card-actions">

                                <button
                                    type="button"
                                    class="service-action-button"
                                    data-action="edit"
                                    data-id="${escapeHTML(service.id)}"
                                    title="Edit service"
                                >
                                    <i class="bi bi-pencil"></i>
                                </button>


                                <button
                                    type="button"
                                    class="service-action-button delete"
                                    data-action="delete"
                                    data-id="${escapeHTML(service.id)}"
                                    title="Delete service"
                                >
                                    <i class="bi bi-trash3"></i>
                                </button>

                            </div>

                        </div>

                    </article>
                `;
            }).join("");
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

    function openServiceModal(service = null) {

        const modal =
            $("serviceModal");


        if (!modal) {
            return;
        }


        state.editingId =
            service ? service.id : null;


        $("serviceModalTitle").textContent =
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
            service?.pricingType || "fixed";


        $("serviceActive").checked =
            service
                ? Boolean(service.active)
                : true;


        updateDescriptionCount();


        modal.classList.add("open");

        modal.setAttribute(
            "aria-hidden",
            "false"
        );


        document.body.style.overflow = "hidden";


        window.setTimeout(() => {
            $("serviceName")?.focus();
        }, 100);
    }


    function closeServiceModal() {

        const modal =
            $("serviceModal");


        if (!modal) {
            return;
        }


        modal.classList.remove("open");

        modal.setAttribute(
            "aria-hidden",
            "true"
        );


        document.body.style.overflow = "";


        $("serviceForm")?.reset();

        $("serviceId").value = "";

        state.editingId = null;

        $("serviceActive").checked = true;

        updateDescriptionCount();
    }


    /* =====================================================
       FORM
    ===================================================== */

    async function saveService(event) {

        event.preventDefault();


        const name =
            $("serviceName").value.trim();


        const description =
            $("serviceDescription").value.trim();


        if (!name || !description) {

            showAlert(
                "Please enter the service name and description.",
                "danger"
            );

            return;
        }


        const existing =
            state.services.find(
                service =>
                    String(service.id) ===
                    String(state.editingId)
            );


        const serviceData = {

            name,

            category:
                $("serviceCategory").value ||
                "Other",

            description,

            price:
                Number(
                    $("servicePrice").value
                ) || 0,

            currency: "NGN",

            pricingType:
                $("servicePricingType").value ||
                "fixed",

            duration:
                $("serviceDuration").value.trim(),

            active:
                $("serviceActive").checked,

            updatedAt:
                new Date().toISOString()
        };


        try {

            /*
             * Backend-ready.
             * When CRUD endpoints exist, they are used.
             */

            if (
                state.editingId &&
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateService === "function"
            ) {

                const response =
                    await ServiceHubAPI.updateService(
                        state.editingId,
                        serviceData
                    );


                const updated =
                    normalizeService(
                        unwrapData(response)
                    );


                const index =
                    state.services.findIndex(
                        service =>
                            String(service.id) ===
                            String(state.editingId)
                    );


                if (index !== -1) {
                    state.services[index] = updated;
                }

            }

            else if (
                !state.editingId &&
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.createService === "function"
            ) {

                const response =
                    await ServiceHubAPI.createService(
                        serviceData
                    );


                state.services.unshift(
                    normalizeService(
                        unwrapData(response)
                    )
                );

            }

            else {

                /*
                 * Frontend-only mode while backend CRUD
                 * endpoints are not available.
                 */

                if (state.editingId && existing) {

                    Object.assign(
                        existing,
                        serviceData
                    );

                } else {

                    state.services.unshift(
                        normalizeService({
                            ...serviceData,
                            id:
                                "local-service-" +
                                Date.now(),
                            createdAt:
                                new Date().toISOString()
                        })
                    );
                }
            }


            closeServiceModal();

            renderAll();


            showAlert(
                state.editingId
                    ? "Service updated successfully."
                    : "Service added successfully."
            );


        } catch (error) {

            console.error(
                "ServiceHub Services: save error",
                error
            );


            showAlert(
                "Unable to save this service.",
                "danger"
            );
        }
    }


    /* =====================================================
       DELETE
    ===================================================== */

    async function deleteService(id) {

        const service =
            state.services.find(
                item =>
                    String(item.id) === String(id)
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
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.deleteService === "function"
            ) {

                await ServiceHubAPI.deleteService(id);
            }


            state.services =
                state.services.filter(
                    item =>
                        String(item.id) !== String(id)
                );


            renderAll();


            showAlert(
                "Service deleted successfully."
            );


        } catch (error) {

            console.error(
                "ServiceHub Services: delete error",
                error
            );


            showAlert(
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

        const sidebar =
            $("dashboardSidebar");

        const overlay =
            $("sidebarOverlay");


        sidebar?.classList.add("open");
        overlay?.classList.add("show");
    }


    function closeSidebar() {

        const sidebar =
            $("dashboardSidebar");

        const overlay =
            $("sidebarOverlay");


        sidebar?.classList.remove("open");
        overlay?.classList.remove("show");
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.logout === "function"
            ) {

                await ServiceHubAPI.logout();

            }

            else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.logout === "function"
            ) {

                await ServiceHubAuth.logout();

            }

            else if (
                window.ServiceHubApp &&
                typeof ServiceHubApp.logout === "function"
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

        $("addServiceButton")
            ?.addEventListener(
                "click",
                () => openServiceModal()
            );


        $("emptyAddServiceButton")
            ?.addEventListener(
                "click",
                () => openServiceModal()
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
            ?.querySelector(".service-modal-backdrop")
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


                    if (action === "edit") {

                        const service =
                            state.services.find(
                                item =>
                                    String(item.id) ===
                                    String(id)
                            );


                        if (service) {
                            openServiceModal(service);
                        }
                    }


                    if (action === "delete") {
                        deleteService(id);
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
                    $("serviceModal")?.classList.contains("open")
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


    window.ServiceHubServices = {
        reload: loadServices,

        getState: function () {
            return state;
        },

        openModal: openServiceModal,

        closeModal: closeServiceModal
    };

})();
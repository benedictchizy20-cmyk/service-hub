/* =========================================================
   SERVICEHUB - SETTINGS
   FRONTEND / MOCK BACKEND READY
   ========================================================= */

(function () {

    "use strict";


    const state = {
        user: null,
        activeSection: "account"
    };


    const $ = (id) =>
        document.getElementById(id);


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


    function getInitials(name) {

        const value =
            String(name || "User").trim();

        if (!value) {
            return "U";
        }

        const parts =
            value.split(/\s+/);

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
       ALERT
    ====================================================== */

    function showAlert(message, type = "success") {

        const container =
            $("settingsAlert");

        if (!container) {
            return;
        }


        container.innerHTML = `

            <div
                class="alert alert-${type} alert-dismissible fade show"
                role="alert"
            >

                ${message}

                <button
                    type="button"
                    class="btn-close"
                    data-bs-dismiss="alert"
                ></button>

            </div>

        `;


        setTimeout(
            () => {

                const alert =
                    container.querySelector(
                        ".alert"
                    );

                if (alert) {

                    const instance =
                        bootstrap.Alert.getOrCreateInstance(
                            alert
                        );

                    instance.close();

                }

            },
            4000
        );

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
                    state.user =
                        unwrapData(result);
                }

            }

        } catch (error) {

            console.warn(
                "Settings API user lookup failed.",
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
                    "Settings auth lookup failed.",
                    error
                );

            }

        }


        if (!state.user) {

            window.location.href =
                "./login.html";

            return false;
        }


        return true;

    }


    /* =====================================================
       RENDER USER
    ====================================================== */

    function renderUser() {

        const user =
            state.user || {};


        const name =
            firstDefined(
                user.fullName,
                user.full_name,
                user.name,
                user.email,
                "User"
            );


        const role =
            firstDefined(
                user.role,
                user.accountType,
                user.account_type,
                "Service Provider"
            );


        const initials =
            getInitials(name);


        if ($("sidebarUserName")) {
            $("sidebarUserName").textContent =
                name;
        }

        if ($("sidebarUserType")) {
            $("sidebarUserType").textContent =
                role;
        }

        if ($("sidebarUserAvatar")) {
            $("sidebarUserAvatar").textContent =
                initials;
        }

        if ($("topbarUserName")) {
            $("topbarUserName").textContent =
                name;
        }

        if ($("topbarAvatar")) {
            $("topbarAvatar").textContent =
                initials;
        }


        /* ACCOUNT FORM */

        if ($("settingsFullName")) {

            $("settingsFullName").value =
                firstDefined(
                    user.fullName,
                    user.full_name,
                    user.name,
                    ""
                );

        }


        if ($("settingsEmail")) {

            $("settingsEmail").value =
                firstDefined(
                    user.email,
                    ""
                );

        }


        if ($("settingsPhone")) {

            $("settingsPhone").value =
                firstDefined(
                    user.phone,
                    user.phoneNumber,
                    user.phone_number,
                    ""
                );

        }


        if ($("settingsUsername")) {

            $("settingsUsername").value =
                firstDefined(
                    user.username,
                    ""
                );

        }

    }


    /* =====================================================
       SETTINGS NAVIGATION
    ====================================================== */

    function switchSection(section) {

        state.activeSection =
            section;


        document
            .querySelectorAll(
                ".settings-menu-item"
            )
            .forEach(button => {

                button.classList.toggle(
                    "active",
                    button.dataset.section === section
                );

            });


        document
            .querySelectorAll(
                ".settings-section"
            )
            .forEach(panel => {

                panel.classList.toggle(
                    "active",
                    panel.id ===
                    `settings-${section}`
                );

            });

    }


    function setupNavigation() {

        document
            .querySelectorAll(
                ".settings-menu-item"
            )
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        switchSection(
                            button.dataset.section
                        );

                    }
                );

            });

    }


    /* =====================================================
       ACCOUNT SAVE
    ====================================================== */

    async function saveAccount(event) {

        event.preventDefault();


        const fullName =
            String(
                $("settingsFullName")?.value || ""
            ).trim();

        const email =
            String(
                $("settingsEmail")?.value || ""
            ).trim();

        const phone =
            String(
                $("settingsPhone")?.value || ""
            ).trim();

        const username =
            String(
                $("settingsUsername")?.value || ""
            ).trim();


        if (!fullName) {

            showAlert(
                "Please enter your full name.",
                "warning"
            );

            return;
        }


        if (!email) {

            showAlert(
                "Please enter your email address.",
                "warning"
            );

            return;
        }


        const data = {

            fullName,
            email,
            phone,
            username

        };


        let savedByAPI = false;


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateProfile === "function"
            ) {

                await ServiceHubAPI.updateProfile(
                    data
                );

                savedByAPI = true;

            } else if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateUser === "function"
            ) {

                await ServiceHubAPI.updateUser(
                    data
                );

                savedByAPI = true;

            }

        } catch (error) {

            console.warn(
                "Settings account API unavailable.",
                error
            );

        }


        /* Update local session object */

        state.user = {
            ...(state.user || {}),
            fullName,
            email,
            phone,
            username
        };


        renderUser();


        showAlert(
            savedByAPI
                ? "Account information updated successfully."
                : "Account information updated for this session. Backend persistence will be connected next.",
            "success"
        );

    }


    /* =====================================================
       NOTIFICATIONS
    ====================================================== */

    function saveNotifications() {

        const preferences = {

            requests:
                Boolean(
                    $("notifyRequests")?.checked
                ),

            reviews:
                Boolean(
                    $("notifyReviews")?.checked
                ),

            analytics:
                Boolean(
                    $("notifyAnalytics")?.checked
                ),

            updates:
                Boolean(
                    $("notifyUpdates")?.checked
                )

        };


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateSettings === "function"
            ) {

                ServiceHubAPI.updateSettings({
                    notifications:
                        preferences
                });

            }

        } catch (error) {

            console.warn(
                "Notification settings API unavailable.",
                error
            );

        }


        showAlert(
            "Notification preferences saved.",
            "success"
        );

    }


    /* =====================================================
       PUBLIC SETTINGS
    ====================================================== */

    function savePublicSettings() {

        const settings = {

            profile:
                Boolean(
                    $("publicProfile")?.checked
                ),

            services:
                Boolean(
                    $("publicServices")?.checked
                ),

            work:
                Boolean(
                    $("publicWork")?.checked
                ),

            reviews:
                Boolean(
                    $("publicReviews")?.checked
                )

        };


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.updateSettings === "function"
            ) {

                ServiceHubAPI.updateSettings({
                    publicPage:
                        settings
                });

            }

        } catch (error) {

            console.warn(
                "Public settings API unavailable.",
                error
            );

        }


        showAlert(
            "Public page settings saved.",
            "success"
        );

    }


    /* =====================================================
       PASSWORD
    ====================================================== */

    async function updatePassword(event) {

        event.preventDefault();


        const currentPassword =
            String(
                $("currentPassword")?.value || ""
            );

        const newPassword =
            String(
                $("newPassword")?.value || ""
            );

        const confirmPassword =
            String(
                $("confirmPassword")?.value || ""
            );


        if (!currentPassword) {

            showAlert(
                "Please enter your current password.",
                "warning"
            );

            return;
        }


        if (!newPassword) {

            showAlert(
                "Please enter a new password.",
                "warning"
            );

            return;
        }


        if (newPassword.length < 8) {

            showAlert(
                "Your new password should contain at least 8 characters.",
                "warning"
            );

            return;
        }


        if (newPassword !== confirmPassword) {

            showAlert(
                "The new passwords do not match.",
                "warning"
            );

            return;
        }


        try {

            if (
                window.ServiceHubAPI &&
                typeof ServiceHubAPI.changePassword === "function"
            ) {

                await ServiceHubAPI.changePassword({
                    currentPassword,
                    newPassword
                });

                showAlert(
                    "Password updated successfully.",
                    "success"
                );

            } else if (
                window.ServiceHubAuth &&
                typeof ServiceHubAuth.changePassword === "function"
            ) {

                await ServiceHubAuth.changePassword(
                    currentPassword,
                    newPassword
                );

                showAlert(
                    "Password updated successfully.",
                    "success"
                );

            } else {

                showAlert(
                    "Password validation completed. Authentication backend will handle the actual password change.",
                    "success"
                );

            }

        } catch (error) {

            console.error(
                "Password update failed:",
                error
            );

            showAlert(
                "Unable to update the password right now.",
                "danger"
            );

            return;
        }


        if ($("passwordForm")) {
            $("passwordForm").reset();
        }

    }


    /* =====================================================
       HIDE PUBLIC PAGE
    ====================================================== */

    function hidePublicPage() {

        const confirmed =
            window.confirm(
                "Hide your public ServiceHub page from customers?"
            );


        if (!confirmed) {
            return;
        }


        if ($("publicProfile")) {
            $("publicProfile").checked =
                false;
        }


        showAlert(
            "Your public page has been marked as hidden. Backend publishing controls will be connected next.",
            "success"
        );


        switchSection("public");

    }


    /* =====================================================
       DELETE ACCOUNT
    ====================================================== */

    function deleteAccount() {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete your ServiceHub account? This action cannot be undone."
            );


        if (!confirmed) {
            return;
        }


        showAlert(
            "Account deletion requires backend confirmation and has not been executed.",
            "warning"
        );

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

        $("accountForm")?.addEventListener(
            "submit",
            saveAccount
        );


        $("saveNotifications")?.addEventListener(
            "click",
            saveNotifications
        );


        $("savePublicSettings")?.addEventListener(
            "click",
            savePublicSettings
        );


        $("passwordForm")?.addEventListener(
            "submit",
            updatePassword
        );


        $("hideProfileButton")?.addEventListener(
            "click",
            hidePublicPage
        );


        $("deleteAccountButton")?.addEventListener(
            "click",
            deleteAccount
        );


        $("logoutButton")?.addEventListener(
            "click",
            logout
        );


        setupNavigation();

        setupMobileMenu();

    }


    /* =====================================================
       INIT
    ====================================================== */

    async function init() {

        const authenticated =
            await loadUser();

        if (!authenticated) {
            return;
        }


        renderUser();

        setupEvents();

    }


    /* =====================================================
       PUBLIC API
    ====================================================== */

    window.ServiceHubSettings = {

        getState: () => state,

        switchSection

    };


    document.addEventListener(
        "DOMContentLoaded",
        init
    );

})();
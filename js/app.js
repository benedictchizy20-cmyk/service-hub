/* =========================================================
   SERVICEHUB
   GLOBAL APPLICATION
   ========================================================= */

"use strict";


const ServiceHubApp = {

    /* =====================================================
       INITIALIZE
    ===================================================== */

    init() {

        console.log(
            "ServiceHub application initialized."
        );

        this.setupGlobalEvents();

    },


    /* =====================================================
       GLOBAL EVENTS
    ===================================================== */

    setupGlobalEvents() {

        document.addEventListener(
            "click",
            (event) => {

                const logoutButton =
                    event.target.closest(
                        "[data-action='logout']"
                    );


                if (logoutButton) {

                    this.logout();

                }

            }
        );

    },


    /* =====================================================
       LOGOUT
    ===================================================== */

    async logout() {

        try {

            await ServiceHubAPI.logout();

        } catch (error) {

            console.warn(
                "Logout request failed:",
                error
            );

        }


        window.location.href =
            "./login.html";

    },


    /* =====================================================
       PUBLIC PROFILE URL
    ===================================================== */

    getProfileUrl(username) {

        return `${window.location.origin}${APP_CONFIG.PUBLIC_PROFILE_PATH}${encodeURIComponent(username)}`;

    },


    /* =====================================================
       COPY PROFILE LINK
    ===================================================== */

    async copyProfileLink(username) {

        const url =
            this.getProfileUrl(username);


        try {

            await navigator.clipboard.writeText(url);

            alert(
                "Profile link copied!"
            );

        } catch (error) {

            console.error(
                "Could not copy profile link:",
                error
            );

        }

    }

};


document.addEventListener(
    "DOMContentLoaded",
    () => {

        ServiceHubApp.init();

    }
);
"use strict";

/* =========================================================
   SERVICEHUB CONFIGURATION
   PRODUCTION / VERCEL + RENDER
   ========================================================= */

const APP_CONFIG = {

    APP_NAME: "ServiceHub",
    APP_VERSION: "1.0.0",

    ENVIRONMENT: "production",

    /*
       TRUE = use frontend development/mock data
       FALSE = connect to the real Render backend
    */
    USE_MOCK_BACKEND: false,

    /*
       LIVE SERVICEHUB BACKEND
    */
    API_BASE_URL:
        "https://service-platform-backend-lktg.onrender.com/api",

    /*
       FRONTEND WILL BE HOSTED ON VERCEL
       We will replace this with the actual Vercel URL
       after deployment.
    */
    FRONTEND_URL:
         "https://service-hub-lilac-ten.vercel.app",

    AUTH_COOKIE_NAME:
        "servicehub_access_token",

    USER_STORAGE_KEY:
        "servicehub_user",

    DEV_SESSION_KEY:
        "servicehub_dev_session",

    DEV_USERS_KEY:
        "servicehub_dev_users",

    DEV_DATA_KEY:
        "servicehub_dev_data",

    PUBLIC_PROFILE_PATH:
        "/profile.html?username=",

    MAX_IMAGE_SIZE_MB: 10,

    MAX_VIDEO_SIZE_MB: 50,

    DEFAULT_PAGE_SIZE: 12,

    DEBUG: true
};


/* =========================================================
   DEBUG
========================================================= */

if (APP_CONFIG.DEBUG) {

    console.log(
        `${APP_CONFIG.APP_NAME} config loaded successfully.`
    );

    console.log(
        "Environment:",
        APP_CONFIG.ENVIRONMENT
    );

    console.log(
        "Mock Backend:",
        APP_CONFIG.USE_MOCK_BACKEND
    );

    console.log(
        "API:",
        APP_CONFIG.API_BASE_URL
    );

}
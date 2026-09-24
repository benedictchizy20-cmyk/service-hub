"use strict";

/* =========================================================
   SERVICEHUB CONFIGURATION
   FRONTEND DEVELOPMENT MODE
   ========================================================= */

const APP_CONFIG = {

    APP_NAME: "ServiceHub",
    APP_VERSION: "1.0.0",

    ENVIRONMENT: "development",

    /*
       TRUE = use frontend development/mock data
       FALSE = connect to real backend
    */
    USE_MOCK_BACKEND: true,

    /*
       Real backend - we will use this later
    */
    API_BASE_URL: "http://localhost:7000/api",

    FRONTEND_URL: "http://localhost:5500",

    AUTH_COOKIE_NAME: "servicehub_access_token",

    USER_STORAGE_KEY: "servicehub_user",

    DEV_SESSION_KEY: "servicehub_dev_session",

    DEV_USERS_KEY: "servicehub_dev_users",

    DEV_DATA_KEY: "servicehub_dev_data",

    PUBLIC_PROFILE_PATH: "/profile.html?username=",

    MAX_IMAGE_SIZE_MB: 10,

    MAX_VIDEO_SIZE_MB: 50,

    DEFAULT_PAGE_SIZE: 12,

    DEBUG: true
};

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
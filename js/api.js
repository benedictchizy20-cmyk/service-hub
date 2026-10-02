"use strict";

/* =========================================================
   SERVICEHUB API
   =========================================================
   FRONTEND DEVELOPMENT / REAL BACKEND

   IMPORTANT:
   - USE_MOCK_BACKEND = true
     means NO backend server is required.

   - USE_MOCK_BACKEND = false
     means requests are sent to the real backend.

   DEVELOPMENT STORAGE:
   - Users are stored in localStorage.
   - Provider data is stored in localStorage.
   - Current development session is stored in sessionStorage.

   REAL BACKEND:
   - Authentication uses HttpOnly cookies.
   - Services use the real ServiceHub backend.
========================================================= */


(function () {


    /* =====================================================
       BASIC HELPERS
    ===================================================== */

    function getConfig() {

        if (
            typeof APP_CONFIG === "undefined"
        ) {

            console.error(
                "SERVICEHUB ERROR: APP_CONFIG is not available."
            );

            throw new Error(
                "ServiceHub configuration is not loaded."
            );
        }

        return APP_CONFIG;
    }


    function log() {

        if (
            typeof APP_CONFIG !== "undefined" &&
            APP_CONFIG.DEBUG
        ) {

            console.log.apply(
                console,
                arguments
            );
        }
    }


    function generateId() {

        if (
            typeof crypto !== "undefined" &&
            crypto.randomUUID
        ) {

            return crypto.randomUUID();
        }

        return (
            Date.now().toString(36) +
            Math.random()
                .toString(36)
                .substring(2, 10)
        );
    }


    function nowISO() {

        return new Date().toISOString();
    }


    function getJSON(
        key,
        fallback
    ) {

        try {

            const value =
                localStorage.getItem(key);


            if (!value) {

                return fallback;
            }


            return JSON.parse(
                value
            );

        } catch (error) {

            console.error(
                "SERVICEHUB JSON READ ERROR:",
                error
            );

            return fallback;
        }
    }


    function setJSON(
        key,
        value
    ) {

        try {

            localStorage.setItem(
                key,
                JSON.stringify(value)
            );

            return true;

        } catch (error) {

            console.error(
                "SERVICEHUB JSON WRITE ERROR:",
                error
            );

            return false;
        }
    }


    function removeStorageItem(
        key
    ) {

        try {

            localStorage.removeItem(
                key
            );

        } catch (error) {

            console.error(
                "SERVICEHUB STORAGE REMOVE ERROR:",
                error
            );
        }
    }


    function normalizeEmail(
        email
    ) {

        return String(
            email || ""
        )
            .trim()
            .toLowerCase();
    }


    function normalizeUsername(
        username
    ) {

        return String(
            username || ""
        )
            .trim()
            .toLowerCase()
            .replace(
                /^@/,
                ""
            );
    }


    function escapeUsernamePart(
        value
    ) {

        return String(
            value || ""
        )
            .toLowerCase()
            .trim()
            .replace(
                /[^a-z0-9\s-]/g,
                ""
            )
            .replace(
                /\s+/g,
                "-"
            )
            .replace(
                /-+/g,
                "-"
            )
            .replace(
                /^-|-$/g,
                ""
            );
    }


    /* =====================================================
       USERNAME
    ===================================================== */

    function createUsername(
        fullName
    ) {

        let username =
            escapeUsernamePart(
                fullName
            );


        if (!username) {

            username =
                "provider-" +
                Date.now().toString(36);
        }


        return username;
    }


    function makeUniqueUsername(
        baseUsername,
        users
    ) {

        const base =
            normalizeUsername(
                baseUsername
            ) ||
            "provider";


        let username =
            base;


        let counter =
            1;


        while (
            users.some(
                function (user) {

                    return (
                        normalizeUsername(
                            user.username
                        ) ===
                        username
                    );

                }
            )
        ) {

            counter++;


            username =
                base +
                "-" +
                counter;
        }


        return username;
    }


    /* =====================================================
       SERVICEHUB API OBJECT
    ===================================================== */

    const ServiceHubAPI = {


        /* =================================================
           MOCK MODE
        ================================================= */

        isMockMode: function () {

            return (
                getConfig()
                    .USE_MOCK_BACKEND === true
            );
        },


        /* =================================================
           DEVELOPMENT USERS
        ================================================= */

        getDevUsers: function () {

            return getJSON(
                getConfig()
                    .DEV_USERS_KEY,
                []
            );
        },


        saveDevUsers: function (
            users
        ) {

            return setJSON(
                getConfig()
                    .DEV_USERS_KEY,
                users
            );
        },


        /* =================================================
           DEVELOPMENT DATA
        ================================================= */

        getDevData: function () {

            return getJSON(
                getConfig()
                    .DEV_DATA_KEY,
                {}
            );
        },


        saveDevData: function (
            data
        ) {

            return setJSON(
                getConfig()
                    .DEV_DATA_KEY,
                data
            );
        },


        /* =================================================
           DEVELOPMENT SESSION
        ================================================= */

        saveDevSession: function (
            userId
        ) {

            try {

                sessionStorage.setItem(
                    getConfig()
                        .DEV_SESSION_KEY,
                    userId
                );


                return true;

            } catch (error) {

                console.error(
                    "SERVICEHUB SESSION SAVE ERROR:",
                    error
                );

                return false;
            }
        },


        getDevSession: function () {

            try {

                return sessionStorage.getItem(
                    getConfig()
                        .DEV_SESSION_KEY
                );

            } catch (error) {

                return null;
            }
        },


        clearDevSession: function () {

            try {

                sessionStorage.removeItem(
                    getConfig()
                        .DEV_SESSION_KEY
                );


                sessionStorage.removeItem(
                    getConfig()
                        .USER_STORAGE_KEY
                );

            } catch (error) {

                console.error(
                    "SERVICEHUB SESSION CLEAR ERROR:",
                    error
                );
            }
        },


        /* =================================================
           CURRENT USER SNAPSHOT
        ================================================= */

        saveCurrentUserSnapshot: function (
            user
        ) {

            try {

                sessionStorage.setItem(
                    getConfig()
                        .USER_STORAGE_KEY,
                    JSON.stringify(
                        user
                    )
                );


                return true;

            } catch (error) {

                console.error(
                    "SERVICEHUB USER SNAPSHOT ERROR:",
                    error
                );

                return false;
            }
        },


        getCurrentUserSnapshot: function () {

            try {

                const value =
                    sessionStorage.getItem(
                        getConfig()
                            .USER_STORAGE_KEY
                    );


                if (!value) {

                    return null;
                }


                return JSON.parse(
                    value
                );

            } catch (error) {

                return null;
            }
        },


        /* =================================================
           FIND DEVELOPMENT USER
        ================================================= */

        findDevUserById: function (
            userId
        ) {

            const users =
                this.getDevUsers();


            return (
                users.find(
                    function (user) {

                        return (
                            user.id ===
                            userId
                        );

                    }
                ) ||
                null
            );
        },


        findDevUserByEmail: function (
            email
        ) {

            const normalized =
                normalizeEmail(
                    email
                );


            const users =
                this.getDevUsers();


            return (
                users.find(
                    function (user) {

                        return (
                            normalizeEmail(
                                user.email
                            ) ===
                            normalized
                        );

                    }
                ) ||
                null
            );
        },


        findDevUserByUsername: function (
            username
        ) {

            const normalized =
                normalizeUsername(
                    username
                );


            if (!normalized) {

                return null;
            }


            const users =
                this.getDevUsers();


            return (
                users.find(
                    function (user) {

                        return (
                            normalizeUsername(
                                user.username
                            ) ===
                            normalized
                        );

                    }
                ) ||
                null
            );
        },


        /* =================================================
           GET CURRENT DEVELOPMENT USER
        ================================================= */

        getCurrentDevUser: function () {

            const sessionUserId =
                this.getDevSession();


            if (!sessionUserId) {

                return null;
            }


            return this.findDevUserById(
                sessionUserId
            );
        },


        /* =================================================
           GET CURRENT USER DATA
        ================================================= */

        getCurrentUserData: function () {

            const user =
                this.getCurrentDevUser();


            if (!user) {

                return null;
            }


            const allData =
                this.getDevData();


            return (
                allData[user.id] ||
                null
            );
        },


        saveCurrentUserData: function (
            data
        ) {

            const user =
                this.getCurrentDevUser();


            if (!user) {

                return false;
            }


            const allData =
                this.getDevData();


            allData[user.id] =
                data;


            return this.saveDevData(
                allData
            );
        },


        /* =================================================
           PUBLIC USER DATA
        ================================================= */

        getPublicDevUserData: function (
            username
        ) {

            const user =
                this.findDevUserByUsername(
                    username
                );


            if (!user) {

                return null;
            }


            const allData =
                this.getDevData();


            const data =
                allData[user.id];


            if (!data) {

                return null;
            }


            return {

                user:
                    user,

                profile:
                    data.profile ||
                    null,

                services:
                    data.services ||
                    [],

                work:
                    data.work ||
                    [],

                reviews:
                    data.reviews ||
                    [],

                analytics:
                    data.analytics ||
                    {
                        profile_views: 0,
                        service_requests: 0,
                        total_contacts: 0
                    },

                service_requests:
                    data.service_requests ||
                    []
            };
        },


        /* =================================================
           REAL BACKEND REQUEST
        ================================================= */

        request: async function (
            endpoint,
            options
        ) {

            const config =
                getConfig();


            options =
                options ||
                {};


            const url =
                config.API_BASE_URL +
                endpoint;


            log(
                "SERVICEHUB API REQUEST:",
                options.method ||
                    "GET",
                url
            );


           const isFormData =
    options.body instanceof FormData;


const requestOptions = {
    method: options.method || "GET",

    credentials: "include",

    headers: {
        ...(isFormData
            ? {}
            : {
                "Content-Type":
                    "application/json"
            }),

        ...(options.headers || {})
    }
};


if (options.body !== undefined) {

    requestOptions.body =
        isFormData
            ? options.body
            : typeof options.body === "string"
                ? options.body
                : JSON.stringify(
                    options.body
                );
}

            try {

                const response =
                    await fetch(
                        url,
                        requestOptions
                    );


                let data =
                    null;


                const contentType =
                    response.headers.get(
                        "content-type"
                    );


                if (
                    contentType &&
                    contentType.includes(
                        "application/json"
                    )
                ) {

                    data =
                        await response.json();

                } else {

                    const text =
                        await response.text();


                    data =
                        text
                            ? {
                                message:
                                    text
                            }
                            : null;
                }


                if (!response.ok) {

                    const message =
                        data &&
                        (
                            data.message ||
                            data.error
                        )
                            ? (
                                data.message ||
                                data.error
                            )
                            : (
                                "ServiceHub request failed."
                            );


                    throw new Error(
                        message
                    );
                }


                log(
                    "SERVICEHUB API RESPONSE:",
                    data
                );


                return data;

            } catch (error) {

                console.error(
                    "SERVICEHUB NETWORK ERROR:",
                    error
                );


                if (
                    error &&
                    error.message &&
                    error.message !==
                    "Failed to fetch"
                ) {

                    throw error;
                }


                throw new Error(
                    "Unable to connect to the ServiceHub server."
                );
            }
        },


        /* =================================================
           REGISTER
        ================================================= */

        register: async function (
            userData
        ) {

            if (
                this.isMockMode()
            ) {

                log(
                    "SERVICEHUB REGISTER: MOCK MODE"
                );


                userData =
                    userData ||
                    {};


                const fullName =
                    String(
                        userData.full_name ||
                        userData.fullName ||
                        ""
                    ).trim();


                const email =
                    normalizeEmail(
                        userData.email
                    );


                const password =
                    String(
                        userData.password ||
                        ""
                    );


                const profileType =
                    String(
                        userData.profile_type ||
                        userData.profileType ||
                        "professional"
                    ).trim();


                if (!fullName) {

                    throw new Error(
                        "Full name is required."
                    );
                }


                if (!email) {

                    throw new Error(
                        "Email address is required."
                    );
                }


                if (!password) {

                    throw new Error(
                        "Password is required."
                    );
                }


                if (
                    password.length < 6
                ) {

                    throw new Error(
                        "Password must be at least 6 characters."
                    );
                }


                const users =
                    this.getDevUsers();


                const existingUser =
                    users.find(
                        function (user) {

                            return (
                                normalizeEmail(
                                    user.email
                                ) ===
                                email
                            );

                        }
                    );


                if (existingUser) {

                    throw new Error(
                        "An account with this email already exists."
                    );
                }


                const username =
                    makeUniqueUsername(
                        createUsername(
                            fullName
                        ),
                        users
                    );


                const userId =
                    generateId();


                const timestamp =
                    nowISO();


                const user = {

                    id:
                        userId,

                    full_name:
                        fullName,

                    email:
                        email,

                    password:
                        password,

                    profile_type:
                        profileType,

                    username:
                        username,

                    role:
                        "provider",

                    is_active:
                        true,

                    created_at:
                        timestamp,

                    updated_at:
                        timestamp
                };


                users.push(
                    user
                );


                this.saveDevUsers(
                    users
                );


                const profile = {

                    id:
                        generateId(),

                    user_id:
                        userId,

                    username:
                        username,

                    full_name:
                        fullName,

                    business_name:
                        "",

                    profession:
                        "",

                    category:
                        profileType,

                    bio:
                        "",

                    profile_image:
                        "",

                    cover_image:
                        "",

                    phone:
                        "",

                    whatsapp:
                        "",

                    email:
                        email,

                    location:
                        "",

                    service_area:
                        "",

                    website:
                        "",

                    instagram:
                        "",

                    facebook:
                        "",

                    tiktok:
                        "",

                    linkedin:
                        "",

                    working_hours:
                        "",

                    how_i_work:
                        "",

                    published:
                        false,

                    created_at:
                        timestamp,

                    updated_at:
                        timestamp
                };


                const providerData = {

                    profile:
                        profile,

                    services:
                        [],

                    work:
                        [],

                    reviews:
                        [],

                    analytics: {

                        profile_views:
                            0,

                        service_requests:
                            0,

                        total_contacts:
                            0
                    },

                    service_requests:
                        []
                };


                const allData =
                    this.getDevData();


                allData[userId] =
                    providerData;


                this.saveDevData(
                    allData
                );


                this.saveDevSession(
                    userId
                );


                this.saveCurrentUserSnapshot(
                    user
                );


                log(
                    "SERVICEHUB MOCK REGISTRATION SUCCESS:",
                    user
                );


                return {

                    success:
                        true,

                    message:
                        "Account created successfully.",

                    user:
                        user,

                    profile:
                        profile,

                    token:
                        "development-mock-token"
                };
            }


            return this.request(
                "/auth/register",
                {

                    method:
                        "POST",

                    body:
                        userData
                }
            );
        },


        /* =================================================
           LOGIN
        ================================================= */

        login: async function (
            credentials
        ) {

            credentials =
                credentials ||
                {};


            if (
                this.isMockMode()
            ) {

                log(
                    "SERVICEHUB LOGIN: MOCK MODE"
                );


                const email =
                    normalizeEmail(
                        credentials.email
                    );


                const password =
                    String(
                        credentials.password ||
                        ""
                    );


                if (!email) {

                    throw new Error(
                        "Email address is required."
                    );
                }


                if (!password) {

                    throw new Error(
                        "Password is required."
                    );
                }


                const user =
                    this.findDevUserByEmail(
                        email
                    );


                if (!user) {

                    throw new Error(
                        "No account was found with this email."
                    );
                }


                if (
                    user.password !==
                    password
                ) {

                    throw new Error(
                        "Incorrect password."
                    );
                }


                if (
                    user.is_active ===
                    false
                ) {

                    throw new Error(
                        "This account has been disabled."
                    );
                }


                this.saveDevSession(
                    user.id
                );


                this.saveCurrentUserSnapshot(
                    user
                );


                log(
                    "SERVICEHUB MOCK LOGIN SUCCESS:",
                    user
                );


                return {

                    success:
                        true,

                    message:
                        "Login successful.",

                    user:
                        user,

                    token:
                        "development-mock-token"
                };
            }


            return this.request(
                "/auth/login",
                {

                    method:
                        "POST",

                    body:
                        credentials
                }
            );
        },


        /* =================================================
           LOGOUT
        ================================================= */

        logout: async function () {

            if (
                this.isMockMode()
            ) {

                log(
                    "SERVICEHUB LOGOUT: MOCK MODE"
                );


                this.clearDevSession();


                return {

                    success:
                        true,

                    message:
                        "Logged out successfully."
                };
            }


            return this.request(
                "/auth/logout",
                {

                    method:
                        "POST"
                }
            );
        },


        /* =================================================
           CURRENT USER
        ================================================= */

        getCurrentUser: async function () {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    return null;
                }


                return {

                    success:
                        true,

                    user:
                        user
                };
            }


            return this.request(
                "/auth/me",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           PROFILE
        ================================================= */

        getProfile: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                if (username) {

                    const data =
                        this.getPublicDevUserData(
                            username
                        );


                    if (!data) {

                        throw new Error(
                            "Profile not found."
                        );
                    }


                    return {

                        success:
                            true,

                        profile:
                            data.profile,

                        user:
                            data.user
                    };
                }


                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const data =
                    this.getCurrentUserData();


                if (!data) {

                    throw new Error(
                        "Profile data not found."
                    );
                }


                return {

                    success:
                        true,

                    profile:
                        data.profile,

                    user:
                        user
                };
            }


            if (username) {

                return this.request(
                    "/profiles/" +
                    encodeURIComponent(
                        username
                    ),
                    {

                        method:
                            "GET"
                    }
                );
            }


            return this.request(
                "/profile",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           UPDATE PROFILE
        ================================================= */

        updateProfile: async function (
            profileData
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const providerData =
                    allData[user.id];


                if (!providerData) {

                    throw new Error(
                        "Profile data not found."
                    );
                }


                providerData.profile = {

                    ...providerData.profile,

                    ...profileData,

                    updated_at:
                        nowISO()
                };


                allData[user.id] =
                    providerData;


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Profile updated successfully.",

                    profile:
                        providerData.profile
                };
            }


            return this.request(
                "/profile",
                {

                    method:
                        "PUT",

                    body:
                        profileData
                }
            );
        },


        /* =================================================
           PROFILE PUBLISHED STATUS
        ================================================= */

        isProfilePublished: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                let data;


                if (username) {

                    data =
                        this.getPublicDevUserData(
                            username
                        );

                } else {

                    data = {

                        profile:
                            (
                                this.getCurrentUserData() ||
                                {}
                            ).profile
                    };
                }


                return !!(
                    data &&
                    data.profile &&
                    data.profile.published ===
                    true
                );
            }


            const profile =
                await this.getProfile(
                    username
                );


            return !!(
                profile &&
                profile.profile &&
                profile.profile.published
            );
        },


        /* =================================================
           SERVICES
        ================================================= */

        getServices: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                let data;


                if (username) {

                    data =
                        this.getPublicDevUserData(
                            username
                        );

                } else {

                    data =
                        this.getCurrentUserData();
                }


                return {

                    success:
                        true,

                    services:
                        data &&
                        Array.isArray(
                            data.services
                        )
                            ? data.services
                            : []
                };
            }


            if (username) {

                return this.request(
                    "/profiles/" +
                    encodeURIComponent(
                        username
                    ) +
                    "/services",
                    {

                        method:
                            "GET"
                    }
                );
            }


            return this.request(
                "/services",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           GET SINGLE SERVICE
        ================================================= */

        getService: async function (
            serviceId
        ) {

            if (
                this.isMockMode()
            ) {

                const data =
                    this.getCurrentUserData();


                const services =
                    data &&
                    Array.isArray(
                        data.services
                    )
                        ? data.services
                        : [];


                const service =
                    services.find(
                        function (item) {

                            return (
                                item.id ===
                                serviceId
                            );

                        }
                    );


                if (!service) {

                    throw new Error(
                        "Service not found."
                    );
                }


                return {

                    success:
                        true,

                    service:
                        service
                };
            }


            return this.request(
                "/services/" +
                encodeURIComponent(
                    serviceId
                ),
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           CREATE SERVICE
        ================================================= */

        createService: async function (
            serviceData
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const service = {

                    id:
                        generateId(),

                    user_id:
                        user.id,

                    name:
                        String(
                            serviceData.name ||
                            ""
                        ).trim(),

                    description:
                        String(
                            serviceData.description ||
                            ""
                        ).trim(),

                    price:
                        serviceData.price !==
                        undefined
                            ? serviceData.price
                            : 0,

                    currency:
                        serviceData.currency ||
                        "NGN",

                    pricing_type:
                        serviceData.pricing_type ||
                        serviceData.pricingType ||
                        "fixed",

                    category:
                        serviceData.category ||
                        "",

                    duration:
                        serviceData.duration ||
                        "",

                    is_active:
                        serviceData.is_active !==
                        undefined
                            ? serviceData.is_active
                            : serviceData.active !==
                              false,

                    created_at:
                        nowISO(),

                    updated_at:
                        nowISO()
                };


                if (!service.name) {

                    throw new Error(
                        "Service name is required."
                    );
                }


                data.services =
                    Array.isArray(
                        data.services
                    )
                        ? data.services
                        : [];


                data.services.push(
                    service
                );


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Service created successfully.",

                    service:
                        service
                };
            }


            /*
             * REAL BACKEND
             *
             * The frontend uses:
             *   pricingType
             *   active
             *
             * The database uses:
             *   pricing_type
             *   is_active
             */

            serviceData =
                serviceData ||
                {};


            const payload = {

                name:
                    String(
                        serviceData.name ||
                        ""
                    ).trim(),

                category:
                    serviceData.category ||
                    "Other",

                description:
                    String(
                        serviceData.description ||
                        ""
                    ).trim(),

                price:
                    serviceData.price !==
                    undefined
                        ? Number(
                            serviceData.price
                        )
                        : 0,

                currency:
                    serviceData.currency ||
                    "NGN",

                pricing_type:
                    serviceData.pricing_type ||
                    serviceData.pricingType ||
                    "fixed",

                duration:
                    serviceData.duration ||
                    "",

                is_active:
                    serviceData.is_active !==
                    undefined
                        ? Boolean(
                            serviceData.is_active
                        )
                        : serviceData.active !==
                          undefined
                            ? Boolean(
                                serviceData.active
                            )
                            : true
            };


            return this.request(
                "/services",
                {

                    method:
                        "POST",

                    body:
                        payload
                }
            );
        },


        /* =================================================
           UPDATE SERVICE
        ================================================= */

        updateService: async function (
            serviceId,
            serviceData
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const index =
                    data.services.findIndex(
                        function (service) {

                            return (
                                service.id ===
                                serviceId
                            );

                        }
                    );


                if (index === -1) {

                    throw new Error(
                        "Service not found."
                    );
                }


                data.services[index] = {

                    ...data.services[index],

                    ...serviceData,

                    updated_at:
                        nowISO()
                };


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Service updated successfully.",

                    service:
                        data.services[index]
                };
            }


            serviceData =
                serviceData ||
                {};


            const payload = {};


            if (
                serviceData.name !==
                undefined
            ) {

                payload.name =
                    String(
                        serviceData.name
                    ).trim();
            }


            if (
                serviceData.category !==
                undefined
            ) {

                payload.category =
                    serviceData.category;
            }


            if (
                serviceData.description !==
                undefined
            ) {

                payload.description =
                    String(
                        serviceData.description
                    ).trim();
            }


            if (
                serviceData.price !==
                undefined
            ) {

                payload.price =
                    Number(
                        serviceData.price
                    );
            }


            if (
                serviceData.currency !==
                undefined
            ) {

                payload.currency =
                    serviceData.currency;
            }


            if (
                serviceData.pricing_type !==
                undefined ||
                serviceData.pricingType !==
                undefined
            ) {

                payload.pricing_type =
                    serviceData.pricing_type !==
                    undefined
                        ? serviceData.pricing_type
                        : serviceData.pricingType;
            }


            if (
                serviceData.duration !==
                undefined
            ) {

                payload.duration =
                    serviceData.duration;
            }


            if (
                serviceData.is_active !==
                undefined ||
                serviceData.active !==
                undefined
            ) {

                payload.is_active =
                    serviceData.is_active !==
                    undefined
                        ? Boolean(
                            serviceData.is_active
                        )
                        : Boolean(
                            serviceData.active
                        );
            }


            return this.request(
                "/services/" +
                encodeURIComponent(
                    serviceId
                ),
                {

                    method:
                        "PUT",

                    body:
                        payload
                }
            );
        },


        /* =================================================
           DELETE SERVICE
        ================================================= */

        deleteService: async function (
            serviceId
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const originalLength =
                    data.services.length;


                data.services =
                    data.services.filter(
                        function (service) {

                            return (
                                service.id !==
                                serviceId
                            );

                        }
                    );


                if (
                    data.services.length ===
                    originalLength
                ) {

                    throw new Error(
                        "Service not found."
                    );
                }


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Service deleted successfully."
                };
            }


            return this.request(
                "/services/" +
                encodeURIComponent(
                    serviceId
                ),
                {

                    method:
                        "DELETE"
                }
            );
        },


        /* =================================================
           WORK / PORTFOLIO
        ================================================= */

        getWork: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                let data;


                if (username) {

                    data =
                        this.getPublicDevUserData(
                            username
                        );

                } else {

                    data =
                        this.getCurrentUserData();
                }


                return {

                    success:
                        true,

                    work:
                        data &&
                        Array.isArray(
                            data.work
                        )
                            ? data.work
                            : []
                };
            }


            if (username) {

                return this.request(
                    "/profiles/" +
                    encodeURIComponent(
                        username
                    ) +
                    "/work",
                    {

                        method:
                            "GET"
                    }
                );
            }


            return this.request(
                "/work",
                {

                    method:
                        "GET"
                }
            );
        },


        getWorkItem: async function (
            workId
        ) {

            if (
                this.isMockMode()
            ) {

                const data =
                    this.getCurrentUserData();


                const work =
                    data &&
                    Array.isArray(
                        data.work
                    )
                        ? data.work
                        : [];


                const item =
                    work.find(
                        function (entry) {

                            return (
                                entry.id ===
                                workId
                            );

                        }
                    );


                if (!item) {

                    throw new Error(
                        "Work item not found."
                    );
                }


                return {

                    success:
                        true,

                    work:
                        item
                };
            }


            return this.request(
                "/work/" +
                encodeURIComponent(
                    workId
                ),
                {

                    method:
                        "GET"
                }
            );
        },


        createWork: async function (
            workData
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const work = {

                    id:
                        generateId(),

                    user_id:
                        user.id,

                    title:
                        String(
                            workData.title ||
                            ""
                        ).trim(),

                    description:
                        String(
                            workData.description ||
                            ""
                        ).trim(),

                    type:
                        workData.type ||
                        "previous",

                    category:
                        workData.category ||
                        "",

                    price:
                        workData.price !==
                        undefined
                            ? workData.price
                            : "",

                    location:
                        workData.location ||
                        "",

                    image:
                        workData.image ||
                        "",

                    images:
                        Array.isArray(
                            workData.images
                        )
                            ? workData.images
                            : [],

                    video:
                        workData.video ||
                        "",

                    published:
                        workData.published !==
                        false,

                    created_at:
                        nowISO(),

                    updated_at:
                        nowISO()
                };


                if (!work.title) {

                    throw new Error(
                        "Work title is required."
                    );
                }


                data.work.unshift(
                    work
                );


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Work published successfully.",

                    work:
                        work
                };
            }


            return this.request(
                "/work",
                {

                    method:
                        "POST",

                    body:
                        workData
                }
            );
        },


        updateWork: async function (
            workId,
            workData
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const index =
                    data.work.findIndex(
                        function (item) {

                            return (
                                item.id ===
                                workId
                            );

                        }
                    );


                if (index === -1) {

                    throw new Error(
                        "Work item not found."
                    );
                }


                data.work[index] = {

                    ...data.work[index],

                    ...workData,

                    updated_at:
                        nowISO()
                };


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Work updated successfully.",

                    work:
                        data.work[index]
                };
            }


            return this.request(
                "/work/" +
                encodeURIComponent(
                    workId
                ),
                {

                    method:
                        "PUT",

                    body:
                        workData
                }
            );
        },


        deleteWork: async function (
            workId
        ) {

            if (
                this.isMockMode()
            ) {

                const user =
                    this.getCurrentDevUser();


                if (!user) {

                    throw new Error(
                        "You are not logged in."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[user.id];


                if (!data) {

                    throw new Error(
                        "Provider data not found."
                    );
                }


                const originalLength =
                    data.work.length;


                data.work =
                    data.work.filter(
                        function (item) {

                            return (
                                item.id !==
                                workId
                            );

                        }
                    );


                if (
                    data.work.length ===
                    originalLength
                ) {

                    throw new Error(
                        "Work item not found."
                    );
                }


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Work deleted successfully."
                };
            }


            return this.request(
                "/work/" +
                encodeURIComponent(
                    workId
                ),
                {

                    method:
                        "DELETE"
                }
            );
        },


        /* =================================================
           REVIEWS
        ================================================= */

        getReviews: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                let data;


                if (username) {

                    data =
                        this.getPublicDevUserData(
                            username
                        );

                } else {

                    data =
                        this.getCurrentUserData();
                }


                return {

                    success:
                        true,

                    reviews:
                        data &&
                        Array.isArray(
                            data.reviews
                        )
                            ? data.reviews
                            : []
                };
            }


            if (username) {

                return this.request(
                    "/profiles/" +
                    encodeURIComponent(
                        username
                    ) +
                    "/reviews",
                    {

                        method:
                            "GET"
                    }
                );
            }


            return this.request(
                "/reviews",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           ANALYTICS
        ================================================= */

        getAnalytics: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                let data;


                if (username) {

                    data =
                        this.getPublicDevUserData(
                            username
                        );

                } else {

                    data =
                        this.getCurrentUserData();
                }


                return {

                    success:
                        true,

                    analytics:
                        data &&
                        data.analytics
                            ? data.analytics
                            : {
                                profile_views: 0,
                                service_requests: 0,
                                total_contacts: 0
                            }
                };
            }


            if (username) {

                return this.request(
                    "/profiles/" +
                    encodeURIComponent(
                        username
                    ) +
                    "/analytics",
                    {

                        method:
                            "GET"
                    }
                );
            }


            return this.request(
                "/analytics",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           SERVICE REQUESTS
        ================================================= */

        createServiceRequest: async function (
            requestData
        ) {

            if (
                this.isMockMode()
            ) {

                requestData =
                    requestData ||
                    {};


                const providerUsername =
                    normalizeUsername(
                        requestData.provider_username ||
                        requestData.username
                    );


                if (!providerUsername) {

                    throw new Error(
                        "Provider username is required."
                    );
                }


                const provider =
                    this.findDevUserByUsername(
                        providerUsername
                    );


                if (!provider) {

                    throw new Error(
                        "Provider profile was not found."
                    );
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[provider.id];


                if (!data) {

                    throw new Error(
                        "Provider data was not found."
                    );
                }


                const serviceRequest = {

                    id:
                        generateId(),

                    provider_id:
                        provider.id,

                    provider_username:
                        provider.username,

                    customer_name:
                        String(
                            requestData.customer_name ||
                            requestData.name ||
                            ""
                        ).trim(),

                    customer_phone:
                        String(
                            requestData.customer_phone ||
                            requestData.phone ||
                            ""
                        ).trim(),

                    customer_email:
                        normalizeEmail(
                            requestData.customer_email ||
                            requestData.email
                        ),

                    requested_service:
                        String(
                            requestData.requested_service ||
                            requestData.service ||
                            ""
                        ).trim(),

                    message:
                        String(
                            requestData.message ||
                            ""
                        ).trim(),

                    status:
                        "pending",

                    created_at:
                        nowISO(),

                    updated_at:
                        nowISO()
                };


                if (
                    !serviceRequest.customer_name
                ) {

                    throw new Error(
                        "Your name is required."
                    );
                }


                if (
                    !serviceRequest.customer_phone
                ) {

                    throw new Error(
                        "Your phone number is required."
                    );
                }


                data.service_requests =
                    Array.isArray(
                        data.service_requests
                    )
                        ? data.service_requests
                        : [];


                data.service_requests.unshift(
                    serviceRequest
                );


                data.analytics =
                    data.analytics ||
                    {};


                data.analytics.service_requests =
                    Number(
                        data.analytics.service_requests ||
                        0
                    ) + 1;


                allData[provider.id] =
                    data;


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    message:
                        "Service request sent successfully.",

                    request:
                        serviceRequest
                };
            }


            return this.request(
                "/service-requests",
                {

                    method:
                        "POST",

                    body:
                        requestData
                }
            );
        },


        getServiceRequests: async function () {

            if (
                this.isMockMode()
            ) {

                const data =
                    this.getCurrentUserData();


                return {

                    success:
                        true,

                    requests:
                        data &&
                        Array.isArray(
                            data.service_requests
                        )
                            ? data.service_requests
                            : []
                };
            }


            return this.request(
                "/service-requests",
                {

                    method:
                        "GET"
                }
            );
        },


        /* =================================================
           TRACK CONTACT
        ================================================= */

        trackContact: async function (
            username,
            contactType
        ) {

            if (
                this.isMockMode()
            ) {

                const provider =
                    this.findDevUserByUsername(
                        username
                    );


                if (!provider) {

                    return {

                        success:
                            false
                    };
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[provider.id];


                if (!data) {

                    return {

                        success:
                            false
                    };
                }


                data.analytics =
                    data.analytics ||
                    {};


                data.analytics.total_contacts =
                    Number(
                        data.analytics.total_contacts ||
                        0
                    ) + 1;


                if (contactType) {

                    const key =
                        "contacts_" +
                        String(
                            contactType
                        ).toLowerCase();


                    data.analytics[key] =
                        Number(
                            data.analytics[key] ||
                            0
                        ) + 1;
                }


                allData[provider.id] =
                    data;


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true
                };
            }


            return this.request(
                "/profiles/" +
                encodeURIComponent(
                    username
                ) +
                "/contact",
                {

                    method:
                        "POST",

                    body: {

                        contact_type:
                            contactType
                    }
                }
            );
        },


        /* =================================================
           TRACK PROFILE VIEW
        ================================================= */

        trackProfileView: async function (
            username
        ) {

            if (
                this.isMockMode()
            ) {

                const provider =
                    this.findDevUserByUsername(
                        username
                    );


                if (!provider) {

                    return {

                        success:
                            false
                    };
                }


                const allData =
                    this.getDevData();


                const data =
                    allData[provider.id];


                if (!data) {

                    return {

                        success:
                            false
                    };
                }


                data.analytics =
                    data.analytics ||
                    {};


                data.analytics.profile_views =
                    Number(
                        data.analytics.profile_views ||
                        0
                    ) + 1;


                allData[provider.id] =
                    data;


                this.saveDevData(
                    allData
                );


                return {

                    success:
                        true,

                    profile_views:
                        data.analytics.profile_views
                };
            }


            return this.request(
                "/profiles/" +
                encodeURIComponent(
                    username
                ) +
                "/view",
                {

                    method:
                        "POST"
                }
            );
        },


        /* =================================================
           PUBLIC PROFILE URL
        ================================================= */

        getPublicProfileUrl: function (
            username
        ) {

            const config =
                getConfig();


            const cleanUsername =
                normalizeUsername(
                    username
                );


            if (!cleanUsername) {

                return "";
            }


            return (
                config.FRONTEND_URL +
                config.PUBLIC_PROFILE_PATH +
                encodeURIComponent(
                    cleanUsername
                )
            );
        },


        /* =================================================
           DEVELOPMENT RESET
           USE ONLY WHEN TESTING
        ================================================= */

        clearDevelopmentData: function () {

            if (
                !this.isMockMode()
            ) {

                console.warn(
                    "Development data reset is only available in mock mode."
                );


                return false;
            }


            removeStorageItem(
                getConfig()
                    .DEV_USERS_KEY
            );


            removeStorageItem(
                getConfig()
                    .DEV_DATA_KEY
            );


            try {

                sessionStorage.removeItem(
                    getConfig()
                        .DEV_SESSION_KEY
                );


                sessionStorage.removeItem(
                    getConfig()
                        .USER_STORAGE_KEY
                );

            } catch (error) {

                console.error(
                    error
                );
            }


            console.log(
                "SERVICEHUB DEVELOPMENT DATA CLEARED."
            );


            return true;
        }
    };


    /* =====================================================
       GLOBAL EXPORT
    ===================================================== */

    window.ServiceHubAPI =
        ServiceHubAPI;


    console.log(
        "ServiceHub API loaded successfully."
    );


    console.log(
        "ServiceHub API mode:",
        ServiceHubAPI.isMockMode()
            ? "MOCK DEVELOPMENT MODE"
            : "REAL BACKEND MODE"
    );

})();
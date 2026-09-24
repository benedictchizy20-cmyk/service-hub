"use strict";

/* =========================================================
   SERVICEHUB AUTHENTICATION
   =========================================================
   Supports:

   - Register
   - Login
   - Logout
   - Current user
   - Password visibility
   - Frontend development authentication
   ========================================================= */


const ServiceHubAuth = (function () {


    /* =====================================================
       ELEMENT HELPER
    ===================================================== */

    function getElement(id) {

        return document.getElementById(id);
    }


    /* =====================================================
       ALERT
    ===================================================== */

    function showAlert(
        message,
        type = "danger"
    ) {

        const alertBox =
            getElement("authAlert");


        if (!alertBox) {

            console.warn(
                "AUTH ALERT ELEMENT NOT FOUND:",
                message
            );

            return;
        }


        alertBox.className =
            "alert alert-" +
            type;


        alertBox.textContent =
            message;


        alertBox.classList.remove(
            "d-none"
        );
    }


    /* =====================================================
       HIDE ALERT
    ===================================================== */

    function hideAlert() {

        const alertBox =
            getElement("authAlert");


        if (!alertBox) {
            return;
        }


        alertBox.classList.add(
            "d-none"
        );
    }


    /* =====================================================
       LOGIN
    ===================================================== */

    async function login(
        email,
        password
    ) {

        try {

            hideAlert();


            const result =
                await ServiceHubAPI.login({

                    email:
                        email,

                    password:
                        password
                });


            console.log(
                "SERVICEHUB LOGIN SUCCESS:",
                result
            );


            showAlert(
                "Login successful. Redirecting...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "./dashboard.html";

                },
                500
            );


            return result;

        } catch (error) {

            console.error(
                "SERVICEHUB LOGIN ERROR:",
                error
            );


            showAlert(
                error.message ||
                "Login failed.",
                "danger"
            );


            throw error;
        }
    }


    /* =====================================================
       REGISTER
    ===================================================== */

    async function register(
        payload
    ) {

        try {

            hideAlert();


            const result =
                await ServiceHubAPI.register(
                    payload
                );


            console.log(
                "SERVICEHUB REGISTRATION SUCCESS:",
                result
            );


            showAlert(
                "Account created successfully. Redirecting...",
                "success"
            );


            setTimeout(
                function () {

                    window.location.href =
                        "./dashboard.html";

                },
                500
            );


            return result;

        } catch (error) {

            console.error(
                "SERVICEHUB REGISTRATION ERROR:",
                error
            );


            showAlert(
                error.message ||
                "Registration failed.",
                "danger"
            );


            throw error;
        }
    }


    /* =====================================================
       GET CURRENT USER
    ===================================================== */

    async function getCurrentUser() {

        try {

            return await ServiceHubAPI
                .getCurrentUser();

        } catch (error) {

            console.error(
                "SERVICEHUB CURRENT USER ERROR:",
                error
            );

            return null;
        }
    }


    /* =====================================================
       LOGOUT
    ===================================================== */

    async function logout() {

        try {

            await ServiceHubAPI.logout();

        } catch (error) {

            console.error(
                "SERVICEHUB LOGOUT ERROR:",
                error
            );
        }


        window.location.href =
            "./login.html";
    }


    /* =====================================================
       REGISTER FORM
    ===================================================== */

    function setupRegisterForm() {

        const form =
            getElement("registerForm");


        if (!form) {

            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const fullName =
                    getElement(
                        "fullName"
                    )?.value.trim();


                const email =
                    getElement(
                        "email"
                    )?.value.trim();


                const profileType =
                    getElement(
                        "profileType"
                    )?.value.trim();


                const password =
                    getElement(
                        "password"
                    )?.value;


                const confirmPassword =
                    getElement(
                        "confirmPassword"
                    )?.value;


                if (
                    !fullName ||
                    !email ||
                    !password ||
                    !confirmPassword
                ) {

                    showAlert(
                        "Please fill in all required fields.",
                        "danger"
                    );

                    return;
                }


                if (
                    password !==
                    confirmPassword
                ) {

                    showAlert(
                        "Passwords do not match.",
                        "danger"
                    );

                    return;
                }


                if (
                    password.length < 6
                ) {

                    showAlert(
                        "Password must be at least 6 characters.",
                        "danger"
                    );

                    return;
                }


                const button =
                    getElement(
                        "registerButton"
                    );


                if (button) {

                    button.disabled =
                        true;
                }


                try {

                    await register({

                        full_name:
                            fullName,

                        email:
                            email,

                        profile_type:
                            profileType,

                        password:
                            password,

                        confirm_password:
                            confirmPassword
                    });

                } catch (error) {

                    /* Error already shown. */

                } finally {

                    if (button) {

                        button.disabled =
                            false;
                    }
                }

            }
        );
    }


    /* =====================================================
       LOGIN FORM
    ===================================================== */

    function setupLoginForm() {

        const form =
            getElement("loginForm");


        if (!form) {

            return;
        }


        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                const email =
                    getElement(
                        "email"
                    )?.value.trim();


                const password =
                    getElement(
                        "password"
                    )?.value;


                if (
                    !email ||
                    !password
                ) {

                    showAlert(
                        "Please enter your email and password.",
                        "danger"
                    );

                    return;
                }


                const button =
                    getElement(
                        "loginButton"
                    );


                if (button) {

                    button.disabled =
                        true;
                }


                try {

                    await login(
                        email,
                        password
                    );

                } catch (error) {

                    /* Error already shown. */

                } finally {

                    if (button) {

                        button.disabled =
                            false;
                    }
                }

            }
        );
    }


    /* =====================================================
       PASSWORD TOGGLE
    ===================================================== */

    function setupPasswordToggle(
        buttonId,
        inputId
    ) {

        const button =
            getElement(
                buttonId
            );

        const input =
            getElement(
                inputId
            );


        if (
            !button ||
            !input
        ) {

            return;
        }


        button.addEventListener(
            "click",
            function () {

                if (
                    input.type ===
                    "password"
                ) {

                    input.type =
                        "text";

                } else {

                    input.type =
                        "password";
                }


                const icon =
                    button.querySelector(
                       ("i")
                    );


                if (icon) {

                    if (
                        input.type ===
                        "text"
                    ) {

                        icon.classList.remove(
                            "bi-eye"
                        );

                        icon.classList.add(
                            "bi-eye-slash"
                        );

                    } else {

                        icon.classList.remove(
                            "bi-eye-slash"
                        );

                        icon.classList.add(
                            "bi-eye"
                        );
                    }
                }

            }
        );
    }


    /* =====================================================
       SETUP
    ===================================================== */

    function init() {

        setupRegisterForm();

        setupLoginForm();


        setupPasswordToggle(
            "togglePassword",
            "password"
        );


        setupPasswordToggle(
            "toggleConfirmPassword",
            "confirmPassword"
        );


        console.log(
            "ServiceHub authentication initialized."
        );
    }


    /* =====================================================
       PUBLIC METHODS
    ===================================================== */

    return {

        login,

        register,

        logout,

        getCurrentUser,

        showAlert,

        hideAlert,

        init
    };

})();


/* =========================================================
   AUTO INITIALIZE
   ========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        ServiceHubAuth.init();

    }
);
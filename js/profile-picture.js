/* =========================================================
   SERVICEHUB - PROFILE PICTURE
   =========================================================
   PURPOSE:
   - Upload provider profile picture to backend
   - Store image in Supabase Storage
   - Save image URL in profiles.profile_image
   - Load saved image from backend after refresh
   - Sync profile avatar with sidebar/topbar
   - Keep existing profile.js functionality untouched

   BACKEND:
   POST   /api/profile/images
   DELETE /api/profile/images/profile
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       API CONFIGURATION
    ===================================================== */

    /*
     * ServiceHub backend.
     *
     * If your existing config.js already exposes the API URL,
     * replace this with that existing variable instead.
     */

    const API_BASE_URL =
    "https://service-platform-backend-lktg.onrender.com/api";


    /* =====================================================
       DOM ELEMENTS
    ===================================================== */

    let profilePicture;

    let profilePictureInput;

    let changeProfilePictureButton;

    let profilePictureImage;

    let profileInitials;

    let sidebarAvatar;

    let topbarProfileAvatar;


    /* =====================================================
       INITIALIZE
    ===================================================== */

    async function initProfilePicture() {

        profilePicture =
            document.getElementById(
                "profilePicture"
            );

        profilePictureInput =
            document.getElementById(
                "profilePictureInput"
            );

        changeProfilePictureButton =
            document.getElementById(
                "changeProfilePictureButton"
            );

        profilePictureImage =
            document.getElementById(
                "profilePictureImage"
            );

        profileInitials =
            document.getElementById(
                "profileInitials"
            );

        sidebarAvatar =
            document.getElementById(
                "sidebarAvatar"
            );

        topbarProfileAvatar =
            document.getElementById(
                "topbarProfileAvatar"
            );


        /* =================================================
           CHECK REQUIRED ELEMENTS
        ================================================= */

        if (
            !profilePictureInput ||
            !changeProfilePictureButton ||
            !profilePictureImage
        ) {

            console.warn(
                "ServiceHub: Profile picture elements not found."
            );

            return;
        }


        /* =================================================
           OPEN FILE PICKER
        ================================================= */

        changeProfilePictureButton.addEventListener(
            "click",
            function () {

                profilePictureInput.click();

            }
        );


        /* =================================================
           FILE SELECTED
        ================================================= */

        profilePictureInput.addEventListener(
            "change",
            handleProfilePictureSelected
        );


        /* =================================================
           LOAD PROFILE FROM BACKEND
        ================================================= */

        await loadProfilePictureFromBackend();

    }


    /* =====================================================
       HANDLE IMAGE SELECTION
    ===================================================== */

    async function handleProfilePictureSelected(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        /* =================================================
           VALIDATE FILE TYPE
        ================================================= */

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp"
        ];


        if (
            !allowedTypes.includes(
                file.type
            )
        ) {

            showProfilePictureMessage(
                "Only JPG, PNG, and WEBP images are allowed."
            );

            profilePictureInput.value = "";

            return;
        }


        /* =================================================
           VALIDATE FILE SIZE
        ================================================= */

        const maximumSize =
            5 * 1024 * 1024;


        if (
            file.size >
            maximumSize
        ) {

            showProfilePictureMessage(
                "Profile picture must be 5MB or smaller."
            );

            profilePictureInput.value = "";

            return;
        }


        /* =================================================
           IMMEDIATE PREVIEW
        ================================================= */

        const reader =
            new FileReader();


        reader.onload =
            function (readerEvent) {

                const imageData =
                    readerEvent.target.result;


                displayProfilePicture(
                    imageData
                );

            };


        reader.onerror =
            function () {

                showProfilePictureMessage(
                    "Unable to preview the selected image."
                );

            };


        reader.readAsDataURL(file);


        /* =================================================
           UPLOAD TO BACKEND
        ================================================= */

        await uploadProfilePicture(
            file
        );

    }


    /* =====================================================
       UPLOAD PROFILE PICTURE
    ===================================================== */

    async function uploadProfilePicture(file) {

        try {

            showProfilePictureMessage(
                "Uploading profile picture..."
            );


            /* =============================================
               CREATE FORM DATA
            ============================================= */

            const formData =
                new FormData();


            formData.append(
                "image",
                file
            );


            formData.append(
                "image_type",
                "profile"
            );


            /* =============================================
               SEND TO BACKEND
            ============================================= */

            const response =
                await fetch(
                    `${API_BASE_URL}/profile/images`,
                    {

                        method:
                            "POST",

                        credentials:
                            "include",

                        body:
                            formData

                    }
                );


            /* =============================================
               READ RESPONSE
            ============================================= */

            let result = null;


            try {

                result =
                    await response.json();

            } catch (jsonError) {

                console.warn(
                    "ServiceHub: Unable to read upload response.",
                    jsonError
                );

            }


            /* =============================================
               HANDLE ERROR
            ============================================= */

            if (!response.ok) {

                console.error(
                    "PROFILE IMAGE UPLOAD ERROR:",
                    result
                );


                showProfilePictureMessage(

                    result?.message ||
                    "Unable to upload profile picture."

                );


                return;

            }


            /* =============================================
               USE SAVED STORAGE URL
            ============================================= */

            if (
                result &&
                result.image_url
            ) {

                displayProfilePicture(
                    result.image_url
                );

            }


            /* =============================================
               SUCCESS
            ============================================= */

            showProfilePictureMessage(
                "Profile picture updated successfully."
            );


        } catch (error) {

            console.error(
                "PROFILE IMAGE UPLOAD NETWORK ERROR:",
                error
            );


            showProfilePictureMessage(
                "Unable to connect to the ServiceHub server."
            );

        }

    }


    /* =====================================================
       LOAD PROFILE PICTURE FROM BACKEND
    ===================================================== */

    async function loadProfilePictureFromBackend() {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/profile`,
                    {

                        method:
                            "GET",

                        credentials:
                            "include"

                    }
                );


            let result = null;


            try {

                result =
                    await response.json();

            } catch (jsonError) {

                console.warn(
                    "ServiceHub: Unable to read profile response.",
                    jsonError
                );

            }


            /* =============================================
               AUTH / PROFILE ERROR
            ============================================= */

            if (!response.ok) {

                console.warn(
                    "ServiceHub: Unable to load profile picture.",
                    result
                );

                return;

            }


            /* =============================================
               GET PROFILE IMAGE
            ============================================= */

            const imageUrl =
                result?.profile?.profile_image;


            if (!imageUrl) {

                /*
                 * No saved profile image.
                 *
                 * Keep the initials/default avatar.
                 */

                return;

            }


            /* =============================================
               DISPLAY SAVED IMAGE
            ============================================= */

            displayProfilePicture(
                imageUrl
            );


        } catch (error) {

            console.error(
                "LOAD PROFILE PICTURE ERROR:",
                error
            );

        }

    }


    /* =====================================================
       DISPLAY PROFILE PICTURE
    ===================================================== */

    function displayProfilePicture(imageData) {

        if (!imageData) {
            return;
        }


        /* =================================================
           MAIN PROFILE AVATAR
        ================================================= */

        if (profilePictureImage) {

            profilePictureImage.src =
                imageData;

            profilePictureImage.style.display =
                "block";

        }


        /* =================================================
           HIDE INITIALS
        ================================================= */

        if (profileInitials) {

            profileInitials.style.display =
                "none";

        }


        /* =================================================
           SIDEBAR AVATAR
        ================================================= */

        updateAvatarElement(
            sidebarAvatar,
            imageData
        );


        /* =================================================
           TOPBAR AVATAR
        ================================================= */

        updateAvatarElement(
            topbarProfileAvatar,
            imageData
        );

    }


    /* =====================================================
       UPDATE SMALL AVATAR
    ===================================================== */

    function updateAvatarElement(
        element,
        imageData
    ) {

        if (
            !element ||
            !imageData
        ) {

            return;

        }


        /* =================================================
           HIDE EXISTING ICON
        ================================================= */

        const icon =
            element.querySelector("i");


        if (icon) {

            icon.style.display =
                "none";

        }


        /* =================================================
           REMOVE OLD IMAGE
        ================================================= */

        const oldImage =
            element.querySelector(
                ".servicehub-avatar-image"
            );


        if (oldImage) {

            oldImage.remove();

        }


        /* =================================================
           CREATE IMAGE
        ================================================= */

        const image =
            document.createElement(
                "img"
            );


        image.src =
            imageData;


        image.alt =
            "Profile picture";


        image.className =
            "servicehub-avatar-image";


        image.style.width =
            "100%";


        image.style.height =
            "100%";


        image.style.objectFit =
            "cover";


        image.style.borderRadius =
            "50%";


        element.appendChild(
            image
        );

    }


    /* =====================================================
       SHOW MESSAGE
    ===================================================== */

    function showProfilePictureMessage(
        message
    ) {

        console.log(
            "ServiceHub:",
            message
        );


        const toastElement =
            document.getElementById(
                "profileToast"
            );


        const toastMessage =
            document.getElementById(
                "profileToastMessage"
            );


        if (
            toastElement &&
            toastMessage &&
            typeof bootstrap !== "undefined"
        ) {

            toastMessage.textContent =
                message;


            const toast =
                bootstrap.Toast.getOrCreateInstance(
                    toastElement
                );


            toast.show();

            return;

        }


        console.log(
            message
        );

    }


    /* =====================================================
       START AFTER DOM LOAD
    ===================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initProfilePicture
        );

    } else {

        initProfilePicture();

    }

})();
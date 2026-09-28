/* =========================================================
   SERVICEHUB - PROFILE PICTURE
   =========================================================
   PURPOSE:
   - Allow provider to select a profile picture
   - Preview image immediately
   - Keep existing profile page functionality untouched
   - Sync profile avatar with sidebar/topbar
   - Temporarily store image in browser
   - Ready for backend storage later

   IMPORTANT:
   This file works alongside profile.js.
   It does NOT replace profile.js.
========================================================= */

(function () {

    "use strict";


    /* =====================================================
       STORAGE KEY
    ===================================================== */

    const PROFILE_PICTURE_STORAGE_KEY =
        "servicehub_profile_picture";


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

    function initProfilePicture() {

        profilePicture =
            document.getElementById("profilePicture");

        profilePictureInput =
            document.getElementById("profilePictureInput");

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
           LOAD EXISTING PICTURE
        ================================================= */

        loadStoredProfilePicture();

    }


    /* =====================================================
       HANDLE IMAGE SELECTION
    ===================================================== */

    function handleProfilePictureSelected(event) {

        const file =
            event.target.files &&
            event.target.files[0];


        if (!file) {
            return;
        }


        /* =================================================
           VALIDATE FILE TYPE
        ================================================= */

        if (!file.type.startsWith("image/")) {

            showProfilePictureMessage(
                "Please select an image file."
            );

            profilePictureInput.value = "";

            return;
        }


        /* =================================================
           VALIDATE FILE SIZE
           Maximum: 5MB
        ================================================= */

        const maximumSize =
            5 * 1024 * 1024;


        if (file.size > maximumSize) {

            showProfilePictureMessage(
                "Profile picture must be 5MB or smaller."
            );

            profilePictureInput.value = "";

            return;
        }


        /* =================================================
           READ IMAGE
        ================================================= */

        const reader =
            new FileReader();


        reader.onload = function (readerEvent) {

            const imageData =
                readerEvent.target.result;


            /* =============================================
               PREVIEW
            ============================================= */

            displayProfilePicture(
                imageData
            );


            /* =============================================
               TEMPORARY STORAGE
            ============================================= */

            try {

                localStorage.setItem(
                    PROFILE_PICTURE_STORAGE_KEY,
                    imageData
                );

            } catch (error) {

                console.error(
                    "Unable to store profile picture:",
                    error
                );

                showProfilePictureMessage(
                    "Image selected, but could not be saved in the browser."
                );

                return;
            }


            /* =============================================
               SUCCESS MESSAGE
            ============================================= */

            showProfilePictureMessage(
                "Profile picture updated."
            );

        };


        reader.onerror = function () {

            showProfilePictureMessage(
                "Unable to read the selected image."
            );

        };


        reader.readAsDataURL(file);

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

        if (!element || !imageData) {
            return;
        }


        /* Remove existing icon */
        const icon =
            element.querySelector("i");

        if (icon) {
            icon.style.display = "none";
        }


        /* Remove existing profile image */
        const oldImage =
            element.querySelector(
                ".servicehub-avatar-image"
            );

        if (oldImage) {
            oldImage.remove();
        }


        /* Create image */
        const image =
            document.createElement("img");


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
       LOAD STORED PROFILE PICTURE
    ===================================================== */

    function loadStoredProfilePicture() {

        let imageData = null;


        try {

            imageData =
                localStorage.getItem(
                    PROFILE_PICTURE_STORAGE_KEY
                );

        } catch (error) {

            console.warn(
                "Unable to read stored profile picture.",
                error
            );

            return;
        }


        if (!imageData) {
            return;
        }


        displayProfilePicture(
            imageData
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


        /*
         * Use the existing ServiceHub toast
         * if it exists.
         */

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


        /* Fallback */
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
/* =========================================================
   SERVICEHUB
   COVER IMAGE
   REAL SUPABASE BACKEND
   ========================================================= */

"use strict";

console.log("SERVICEHUB COVER IMAGE JS LOADED");

const COVER_API_BASE_URL = "https://service-platform-backend-lktg.onrender.com/api";

const COVER_MAX_FILE_SIZE = 5 * 1024 * 1024;

const COVER_ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp"
];


/* =========================================================
   ELEMENTS
========================================================= */

let profileCoverElement = null;
let coverImageInput = null;
let changeCoverButton = null;


/* =========================================================
   INITIALIZE
========================================================= */

document.addEventListener("DOMContentLoaded", () => {

    initializeCoverImage();

});


function initializeCoverImage() {

    profileCoverElement =
        document.getElementById("profileCover");

    if (!profileCoverElement) {

        console.warn(
            "SERVICEHUB COVER: #profileCover not found."
        );

        return;
    }


    createCoverControls();

    loadCoverImage();

}


/* =========================================================
   CREATE COVER CONTROLS
========================================================= */

function createCoverControls() {

    /*
       We create the button and hidden file input here
       so you do not need to change your existing HTML.
    */

    if (
        document.getElementById(
            "changeCoverImageButton"
        )
    ) {
        changeCoverButton =
            document.getElementById(
                "changeCoverImageButton"
            );

        coverImageInput =
            document.getElementById(
                "coverImageInput"
            );

        return;
    }


    changeCoverButton =
        document.createElement("button");

    changeCoverButton.type = "button";

    changeCoverButton.id =
        "changeCoverImageButton";

    changeCoverButton.className =
        "profile-cover-change-button";

    changeCoverButton.setAttribute(
        "aria-label",
        "Change cover image"
    );

    changeCoverButton.setAttribute(
        "title",
        "Change cover image"
    );

    changeCoverButton.innerHTML = `
        <i class="bi bi-camera-fill"></i>
        <span>Change Cover</span>
    `;


    coverImageInput =
        document.createElement("input");

    coverImageInput.type = "file";

    coverImageInput.id =
        "coverImageInput";

    coverImageInput.accept =
        "image/jpeg,image/png,image/webp";

    coverImageInput.style.display =
        "none";


    profileCoverElement.appendChild(
        changeCoverButton
    );

    profileCoverElement.appendChild(
        coverImageInput
    );


    changeCoverButton.addEventListener(
        "click",
        () => {

            coverImageInput.click();

        }
    );


    coverImageInput.addEventListener(
        "change",
        handleCoverImageSelection
    );


    console.log(
        "SERVICEHUB COVER: Controls created."
    );
}


/* =========================================================
   LOAD CURRENT COVER IMAGE
========================================================= */

async function loadCoverImage() {

    try {

        console.log(
            "SERVICEHUB COVER: Loading profile..."
        );


        const response =
            await fetch(
                `${COVER_API_BASE_URL}/profile`,
                {
                    method: "GET",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to load profile."
            );

        }


        const profile =
            result.profile ||
            result.data?.profile ||
            result.data ||
            result;


        if (
            profile &&
            profile.cover_image
        ) {

            displayCoverImage(
                profile.cover_image
            );

        } else {

            clearCoverImage();

        }


        console.log(
            "SERVICEHUB COVER: Loaded successfully."
        );


    } catch (error) {

        console.error(
            "SERVICEHUB COVER LOAD ERROR:",
            error
        );

    }

}


/* =========================================================
   DISPLAY COVER IMAGE
========================================================= */

function displayCoverImage(imageUrl) {

    if (
        !profileCoverElement ||
        !imageUrl
    ) {
        return;
    }


    profileCoverElement.style.backgroundImage =
        `url("${imageUrl}")`;

    profileCoverElement.classList.add(
        "has-image"
    );


    /*
       Keep the overlay visible above the image.
    */

    const overlay =
        profileCoverElement.querySelector(
            ".profile-cover-overlay"
        );

    if (overlay) {

        overlay.style.zIndex = "1";

    }


    if (changeCoverButton) {

        changeCoverButton.style.zIndex =
            "5";

    }

}


/* =========================================================
   CLEAR COVER IMAGE
========================================================= */

function clearCoverImage() {

    if (!profileCoverElement) {
        return;
    }


    profileCoverElement.style.backgroundImage =
        "";

    profileCoverElement.classList.remove(
        "has-image"
    );

}


/* =========================================================
   FILE SELECTION
========================================================= */

async function handleCoverImageSelection(event) {

    const file =
        event.target.files?.[0];


    if (!file) {
        return;
    }


    /*
       Reset input so the same file can
       be selected again later.
    */

    event.target.value = "";


    /* -----------------------------------------------------
       VALIDATE TYPE
    ----------------------------------------------------- */

    if (
        !COVER_ALLOWED_TYPES.includes(
            file.type
        )
    ) {

        showCoverMessage(
            "Invalid image",
            "Please select a JPG, PNG, or WEBP image."
        );

        return;

    }


    /* -----------------------------------------------------
       VALIDATE SIZE
    ----------------------------------------------------- */

    if (
        file.size >
        COVER_MAX_FILE_SIZE
    ) {

        showCoverMessage(
            "Image too large",
            "Cover image must be 5MB or smaller."
        );

        return;

    }


    /*
       Preview immediately.
    */

    previewCoverImage(file);


    /*
       Upload to backend.
    */

    await uploadCoverImage(file);

}


/* =========================================================
   PREVIEW
========================================================= */

function previewCoverImage(file) {

    if (!profileCoverElement) {
        return;
    }


    const reader =
        new FileReader();


    reader.onload = function(event) {

        const imageUrl =
            event.target.result;


        displayCoverImage(
            imageUrl
        );

    };


    reader.onerror = function() {

        showCoverMessage(
            "Preview failed",
            "Unable to preview this image."
        );

    };


    reader.readAsDataURL(file);

}


/* =========================================================
   UPLOAD COVER IMAGE
========================================================= */

async function uploadCoverImage(file) {

    try {

        setCoverUploadingState(true);


        const formData =
            new FormData();


        formData.append(
            "image",
            file
        );


        formData.append(
            "image_type",
            "cover"
        );


        console.log(
            "SERVICEHUB COVER: Uploading..."
        );


        const response =
            await fetch(
                `${COVER_API_BASE_URL}/profile/images`,
                {
                    method: "POST",

                    credentials: "include",

                    body: formData
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to upload cover image."
            );

        }


        /*
           Backend returns image_url.
        */

        if (result.image_url) {

            displayCoverImage(
                result.image_url
            );

        }


        /*
           Also handle profile object if returned.
        */

        if (
            result.profile &&
            result.profile.cover_image
        ) {

            displayCoverImage(
                result.profile.cover_image
            );

        }


        showCoverMessage(
            "Cover updated",
            "Your cover image was updated successfully."
        );


        console.log(
            "SERVICEHUB COVER: Upload successful."
        );


    } catch (error) {

        console.error(
            "SERVICEHUB COVER UPLOAD ERROR:",
            error
        );


        /*
           Reload the saved image so a failed upload
           does not leave the preview looking like
           the image was permanently saved.
        */

        await loadCoverImage();


        showCoverMessage(
            "Upload failed",
            error.message ||
            "Unable to update your cover image."
        );


    } finally {

        setCoverUploadingState(false);

    }

}


/* =========================================================
   UPLOADING STATE
========================================================= */

function setCoverUploadingState(isUploading) {

    if (!changeCoverButton) {
        return;
    }


    if (isUploading) {

        changeCoverButton.disabled =
            true;

        changeCoverButton.classList.add(
            "uploading"
        );

        changeCoverButton.innerHTML = `
            <span
                class="spinner-border spinner-border-sm"
                aria-hidden="true">
            </span>

            <span>Uploading...</span>
        `;

    } else {

        changeCoverButton.disabled =
            false;

        changeCoverButton.classList.remove(
            "uploading"
        );

        changeCoverButton.innerHTML = `
            <i class="bi bi-camera-fill"></i>
            <span>Change Cover</span>
        `;

    }

}


/* =========================================================
   DELETE COVER IMAGE
========================================================= */

async function deleteCoverImage() {

    try {

        const response =
            await fetch(
                `${COVER_API_BASE_URL}/profile/images/cover`,
                {
                    method: "DELETE",

                    credentials: "include",

                    headers: {
                        "Accept":
                            "application/json"
                    }
                }
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Unable to remove cover image."
            );

        }


        clearCoverImage();


        showCoverMessage(
            "Cover removed",
            "Your cover image has been removed."
        );


    } catch (error) {

        console.error(
            "SERVICEHUB COVER DELETE ERROR:",
            error
        );


        showCoverMessage(
            "Unable to remove",
            error.message ||
            "Unable to remove cover image."
        );

    }

}


/* =========================================================
   MESSAGE / TOAST
========================================================= */

function showCoverMessage(
    title,
    message
) {

    const toastElement =
        document.getElementById(
            "profileToast"
        );

    const titleElement =
        document.getElementById(
            "profileToastTitle"
        );

    const messageElement =
        document.getElementById(
            "profileToastMessage"
        );


    if (
        toastElement &&
        titleElement &&
        messageElement
    ) {

        titleElement.textContent =
            title;

        messageElement.textContent =
            message;


        if (
            typeof bootstrap !==
            "undefined" &&
            bootstrap.Toast
        ) {

            const toast =
                bootstrap.Toast.getOrCreateInstance(
                    toastElement,
                    {
                        delay: 3500
                    }
                );

            toast.show();

            return;

        }

    }


    /*
       Fallback if Bootstrap toast is unavailable.
    */

    alert(
        `${title}\n\n${message}`
    );

}


/* =========================================================
   PUBLIC API
========================================================= */

window.ServiceHubCoverImage = {

    load: loadCoverImage,

    upload: uploadCoverImage,

    delete: deleteCoverImage

};
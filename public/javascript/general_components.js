// <========================Heart button========================>
$('a.like-button').on('click', function(e) {
    // Check if liked class is present
    if ($(this).hasClass('liked')) {
        // Remove the liked class
        $(this).removeClass('liked');
    } else {
        // Add the liked class
        $(this).addClass('liked');
    }
});

// <========================Scroll to top button========================>
//Get the button
let btnScrollToTop = document.getElementById("btn-back-to-top");

// When the user scrolls down 20px from the top of the document, show the button
window.onscroll = function () {
    scrollFunction();
};

function scrollFunction() {
    if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
    ) {
        if (!btnScrollToTop.classList.contains("show")) {
            btnScrollToTop.classList.add("show");
        }
    } else {
        btnScrollToTop.classList.remove("show");
    }
}

// When the user clicks on the button, scroll to the top of the document
btnScrollToTop.addEventListener("click", backToTop);

function backToTop() {
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// <========================Tag input========================>
document.addEventListener("DOMContentLoaded", () => {
    const addTagButton = document.getElementById("add-tag-btn");

    addTagButton.addEventListener("click", addTag);

    tagInput.addEventListener("keypress", (event) => {
        if (event.key === "Enter") {
            addTag();
            event.preventDefault();
        }
    });
});

const tagInput = document.getElementById("tag-input");
const tagContainer = document.getElementById("tag-container");

function createTagElement(tagText) {
    const tag = document.createElement("div");
    tag.classList.add("tag");

    const tagContent = document.createElement("span");
    tagContent.textContent = tagText;
    tag.appendChild(tagContent);

    const removeButton = document.createElement("span");
    removeButton.classList.add("remove-tag");
    removeButton.innerHTML = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-x-lg\" viewBox=\"0 0 16 16\">\n" +
        "  <path d=\"M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z\"/>\n" +
        "</svg>";
    removeButton.addEventListener("click", () => {
        tagContainer.removeChild(tag);
    });

    tag.appendChild(removeButton);

    return tag;
}

function addTag() {
    const tagText = tagInput.value.trim();
    if (tagText) {
        const tagElement = createTagElement(tagText);
        tagContainer.appendChild(tagElement);
        tagInput.value = "";
        tagInput.focus();
    }
}

function getAllTags() {
    const tags = [];
    const tagContainer = document.getElementById("tag-container");
    const tagElements = tagContainer.getElementsByClassName("tag");
    for (let tagElement of tagElements) {
        const tagText = tagElement.querySelector("span").textContent;
        tags.push(tagText);
    }
    return tags;
}

// <========================Sidebar========================>
document.addEventListener("DOMContentLoaded", function () {
    const sidebar = document.getElementById("sidebar");
    const mainContent = document.getElementById("main-content");
    const toggleSidebar = document.getElementById("toggle-sidebar");

    toggleSidebar.addEventListener("click", function () {
        sidebar.classList.toggle("active");
        mainContent.classList.toggle("content-blur");
    });

    mainContent.addEventListener("click", function () {
        if (sidebar.classList.contains("active")) {
            sidebar.classList.remove("active");
            mainContent.classList.remove("content-blur");
        }
    });
});

// <========================Form validation========================>
window.addEventListener('load', () => {
    let isFormDirty = false;

    // Select all forms on the page
    const forms = document.querySelectorAll('form');

    // Add an event listener to each form to detect changes
    forms.forEach((form) => {
        form.addEventListener('input', () => {
            isFormDirty = true;
        });

        // Reset the dirty state if the form is successfully submitted
        form.addEventListener('submit', () => {
            isFormDirty = false;
        });
    });

    // Listen for the beforeunload event
    window.addEventListener('beforeunload', (event) => {
        if (isFormDirty) {
            event.preventDefault();
            event.returnValue = ''; // Required for compatibility with some browsers
        }
    });
});

// <========================Preview Window========================>
function openPreviewWindow({
                               title,
                               abstract,
                               thumbnailURL,
                               content,
                               categories,
                               views = 0,
                               likes = 0,
                               authorName,
                               updateDate,
                               tags
                           }) {
    const previewWindow = window.open("", "previewWindow");
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Hubot+Sans:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
            <style>
                * {
                    font-family: "Hubot Sans", sans-serif;
                    font-optical-sizing: auto;
                    font-variation-settings: "wdth" 100;
                }
            </style>
            <title>Preview</title>
        </head>
        <body>
            <div class="container-xl my-5">
                <article class="mb-5">
                    <!-- Title -->
                    <h1 class="h1 text-center font-weight-bold mb-4">${title}</h1>

                    <!-- Abstract Box -->
                    <div class="p-4 bg-light border rounded shadow-sm mb-4">
                        <p class="mb-0">${abstract}</p>
                    </div>

                    <!-- Main Image -->
                    <div class="text-center mb-4">
                        <img src="${thumbnailURL}" class="img-fluid rounded shadow" alt="Main Image">
                    </div>

                    <!-- Main Content -->
                    <div class="container-fluid mb-4">
                        ${content}
                    </div>

                    <!-- Category -->
                    <div class="container-fluid mb-4">
                        <div class="row mb-2">
                            <div class="col-12">
                                <p>
                                    <i class="fas fa-folder"></i> Thể loại:
                                    <a href="#" class="text-primary text-decoration-none">
                                        ${categories.map((category) => `${category.text}`).join(", ")}                                   
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Metadata -->
                    <div class="container text-muted mb-4">
                        <div class="row">
                            <!-- Left Section -->
                            <div class="col-md-6">
                                <!-- Views -->
                                <div class="row mb-2">
                                    <div class="col-12">
                                        <p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-eye" viewBox="0 0 16 16">
                                                <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                                                <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                                            </svg>
                                            &nbsp;Đã xem: ${views}
                                        </p>
                                    </div>
                                </div>
                                <!-- Likes -->
                                <div class="row mb-2">
                                    <div class="col-12">
                                        <p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-heart-fill" viewBox="0 0 16 16">
                                                <path fill-rule="evenodd" d="M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314"/>
                                            </svg>
                                            &nbsp;Đã thích: ${likes}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <!-- Right Section -->
                            <div class="col-md-6 text-right">
                                <!-- Author -->
                                <div class="row mb-2">
                                    <div class="col-12">
                                        <p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-person-circle" viewBox="0 0 16 16">
                                                <path d="M11 6a3 3 0 1 1-6 0 3 3 0 0 1 6 0"/>
                                                <path fill-rule="evenodd" d="M0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8m8-7a7 7 0 0 0-5.468 11.37C3.242 11.226 4.805 10 8 10s4.757 1.225 5.468 2.37A7 7 0 0 0 8 1"/>
                                            </svg>
                                            &nbsp;Đăng bởi: <strong>${authorName}</strong>
                                        </p>
                                    </div>
                                </div>
                                <!-- Publish Date -->
                                <div class="row mb-2">
                                    <div class="col-12">
                                        <p>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-calendar-check" viewBox="0 0 16 16">
                                                <path d="M10.854 7.146a.5.5 0 0 1 0 .708l-3 3a.5.5 0 0 1-.708 0l-1.5-1.5a.5.5 0 1 1 .708-.708L7.5 9.793l2.646-2.647a.5.5 0 0 1 .708 0"/>
                                                <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5M1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4z"/>
                                            </svg>
                                            &nbsp;Cập nhật lần cuối: ${updateDate}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="container-fluid mb-4">
                        <div class="row">
                            <div class="col-12">
                                <p>
                                    Tags:&nbsp;
                                    ${tags.map((tag) => `${tag}`).join(",&nbsp")}
                                </p>
                            </div>
                        </div>
                    </div>
                </article>
            </div>
        </body>
        </html>
    `);
    previewWindow.document.close();
}

// <========================Generate PDF========================>
function downloadPDF({
                         title,
                         abstract,
                         thumbnailURL,
                         content,
                         categories,
                         tags
                     }) {
    const previewWindow = window.open("", "previewWindow");
    previewWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Hubot+Sans:ital,wght@0,200..900;1,200..900&display=swap" rel="stylesheet">
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@4.6.2/dist/css/bootstrap.min.css" integrity="sha384-xOolHFLEh07PJGoPkLv1IbcEPTNtaed2xpHsD9ESMhqIYd0nLMwNLD69Npy4HI+N" crossorigin="anonymous">
            <style>
                * {
                    font-family: "Hubot Sans", sans-serif;
                    font-optical-sizing: auto;
                    font-variation-settings: "wdth" 100;
                }
            </style>
            <title>Preview</title>
        </head>
        <body>
            <div id="content" class="container my-5">
                <article class="mb-5">
                    <h1 class="h1 text-center font-weight-bold mb-4">${title}</h1>
                    <div class="p-4 bg-light border rounded shadow-sm mb-4">
                        <p class="mb-0">${abstract}</p>
                    </div>
                    <div class="text-center mb-4">
                        <img src="${thumbnailURL}" class="img-fluid rounded shadow" alt="Main Image">
                    </div>
                    <div class="container-fluid mb-4">${content}</div>
                    <div class="container-fluid mb-4">
                        <div class="row mb-2">
                            <div class="col-12">
                                <p><i class="fas fa-folder"></i> Thể loại: ${categories.map((category) => `${category.name}`).join(", ")}</p>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-12">
                                <p>Tags:&nbsp;${tags.map((tag) => `${tag}`).join(",&nbsp")}</p>
                            </div>
                        </div>
                    </div>
                   
                </article>
            </div>
            <button id="download-pdf-btn" style="display:none;">Download PDF</button>
            <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.2/html2pdf.bundle.min.js" integrity="sha512-MpDFIChbcXl2QgipQrt1VcPHMldRILetapBl5MPCA9Y8r7qvlwx1/Mc9hNTzY+kS5kX6PdoDq41ws1HiVNLdZA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
            <script>
                document.getElementById("download-pdf-btn").addEventListener("click", function () {
                    const content = document.getElementById("content");
                    html2pdf().from(content).save("${title}.pdf").then(() => {
                        setTimeout(() => {
                            window.close();
                        }, 5000);
                    }).catch(() => {
                        setTimeout(() => {
                            window.close();
                        }, 5000);
                    });
                });
            </script>
        </body>
        </html>
    `);
    previewWindow.document.close();

    // Trigger the hidden download button after 2 seconds
    previewWindow.onload = () => {
        const downloadBtn = previewWindow.document.getElementById("download-pdf-btn");
        downloadBtn.click();
    };
}
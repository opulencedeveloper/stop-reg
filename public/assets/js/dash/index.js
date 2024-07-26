document.addEventListener("DOMContentLoaded", function () {
    document.querySelector(".dash-copy-btn").addEventListener("click", async function () {
        // Get the text from the main-token element
        console.log("clicked")
        const mainTokenText = document.querySelector(".main-token").textContent;

        try {
            // Copy the text to the clipboard using the Clipboard API
            await navigator.clipboard.writeText(mainTokenText);

            // Show the custom toast notification
            iziToast.success({
                message: "Copied to clipboard!",
                position: "topRight",
                drag: false,
                displayMode: 1,
            });
        } catch (err) {
            iziToast.error({
                message: "Failed to copy",
                position: "topRight",
                drag: false,
                displayMode: 1,
            });
        }
    });
});
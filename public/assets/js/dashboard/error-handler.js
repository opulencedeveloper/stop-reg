/**
 * Premium Error UI Handler
 * Provides global functions to show/hide the premium error modal.
 */

document.addEventListener("DOMContentLoaded", () => {
    const errorBackdrop = document.getElementById("premium-error-backdrop");
    const errorModal = document.querySelector(".premium-error");
    const closeBtn = document.getElementById("error-close-btn");

    if (!errorBackdrop || !errorModal) return;

    // Global function to show error
    window.showPremiumError = (title = "Error", message = "An unexpected error occurred.") => {
        const titleEl = document.getElementById("error-title");
        const messageEl = document.getElementById("error-message");

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        errorBackdrop.style.display = "flex"; // Ensure it's visible layout-wise
        // Slight delay to allow display:flex to apply before opacity transition
        requestAnimationFrame(() => {
            errorBackdrop.classList.add("active");
            errorModal.classList.add("active-animate");
        });
        
        // Disable body scroll
        document.body.style.overflow = "hidden";
    };

    // Global function to hide error
    window.hidePremiumError = () => {
        errorBackdrop.classList.remove("active");
        errorModal.classList.remove("active-animate");

        // Wait for animation to finish before hiding display
        setTimeout(() => {
            errorBackdrop.style.display = "none";
            document.body.style.overflow = "";
        }, 300);
    };

    // Close button event
    if (closeBtn) {
        closeBtn.addEventListener("click", window.hidePremiumError);
    }

    // Close on backdrop click (optional, usually good UX)
    errorBackdrop.addEventListener("click", (e) => {
        if (e.target === errorBackdrop) {
            window.hidePremiumError();
        }
    });
});

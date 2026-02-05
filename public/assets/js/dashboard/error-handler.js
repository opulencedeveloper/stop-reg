/**
 * Premium Error UI Handler
 * Provides global functions to show/hide the premium error modal.
 */

document.addEventListener("DOMContentLoaded", () => {
    const errorBackdrop = document.getElementById("premium-error-backdrop");
    const errorModal = document.querySelector(".premium-error");
    const closeBtn = document.getElementById("error-close-btn");
    const retryBtn = document.getElementById("error-retry-btn");

    if (!errorBackdrop || !errorModal) return;

    // Retry Callback Storage
    let currentRetryCallback = null;

    // Global function to show error
    window.showPremiumError = (title = "Error", message = "An unexpected error occurred.", retryCallback = null) => {
        const titleEl = document.getElementById("error-title");
        const messageEl = document.getElementById("error-message");

        if (titleEl) titleEl.textContent = title;
        if (messageEl) messageEl.textContent = message;

        // Handle Retry Button
        if (retryBtn) {
            if (typeof retryCallback === 'function') {
                retryBtn.style.display = "inline-flex";
                currentRetryCallback = retryCallback;
            } else {
                retryBtn.style.display = "none";
                currentRetryCallback = null;
            }
        }

        // Reset Styles & Animations
        errorBackdrop.style.display = "flex";
        errorBackdrop.classList.remove("fadeOut");
        
        // Simple Backdrop Fade
        errorBackdrop.style.transition = "opacity 0.3s ease";
        errorBackdrop.style.opacity = "0";
        setTimeout(() => errorBackdrop.style.opacity = "1", 10);
        
        errorBackdrop.classList.add("active");

        // Premium Box Animation
        errorModal.classList.remove("fadeOut");
        errorModal.classList.add("animate-soft-scale");
        
        // Disable body scroll
        document.body.style.overflow = "hidden";
    };

    // Global function to hide error
    window.hidePremiumError = () => {
        // Fade out
        errorBackdrop.style.opacity = "0";
        // Remove animation class (optional cleanup)
        // errorModal.classList.remove("animate-soft-scale"); 
        
        // Wait for animation to finish before hiding display
        setTimeout(() => {
            errorBackdrop.style.display = "none";
            errorBackdrop.classList.remove("active");
            errorModal.classList.remove("animate-soft-scale");
            document.body.style.overflow = "";
            currentRetryCallback = null;
        }, 300);
    };

    // Close button event
    if (closeBtn) {
        closeBtn.addEventListener("click", window.hidePremiumError);
    }

    // Retry button event
    if (retryBtn) {
        retryBtn.addEventListener("click", () => {
            if (typeof currentRetryCallback === 'function') {
                currentRetryCallback();
                window.hidePremiumError();
            }
        });
    }

    // Close on backdrop click (optional, usually good UX)
    errorBackdrop.addEventListener("click", (e) => {
        if (e.target === errorBackdrop) {
            window.hidePremiumError();
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
   const form = document.getElementById("adminSignIn-form");
    
    if (!form) {
        console.error("Critical Error: Admin login form not found in DOM.");
        return;
    }

    const submitBtn = form.querySelector(".cr-btn");
    const emailInput = document.getElementById("admin-email");
    const passwordInput = document.getElementById("admin-password");
    const leftHeader = document.querySelector('.auth-left-header');
    const leftTitle = document.querySelector('.auth-left-tle');
    const formContainer = document.querySelector('.auth-form-container');

    // --- ENTRANCE ANIMATIONS ---
    if (leftHeader) setTimeout(() => leftHeader.classList.add('anim-slide-up'), 200);
    if (leftTitle) setTimeout(() => leftTitle.classList.add('anim-slide-up'), 400);
    if (formContainer) setTimeout(() => formContainer.classList.add('anim-slide-up'), 600);

    // --- PRE-INITIALIZATION ---
    // Ensure content is visible as main.js might hide it by default for dashboard pages
    if (typeof window.hideSpinner === 'function') {
        window.hideSpinner();
    }

    // --- PREMIUM ERROR MODAL (Standardized Structure) ---
    const errorBackdrop = document.createElement("div");
    errorBackdrop.id = "premium-error-backdrop";
    errorBackdrop.className = "error-backdrop";
    errorBackdrop.style.display = "none";
    let hideTimeout = null;

    const errorContent = document.createElement("div");
    errorContent.className = "premium-error";
    errorContent.id = "premium-error-modal";
    errorContent.innerHTML = `
        <button class="error-close-btn" id="error-close-btn">&times;</button>
        <div class="error-icon-wrapper">
            <svg viewBox="0 0 24 24" fill="none" class="error-icon-svg" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        </div>
        <div class="error-text-wrapper">
            <h3 class="error-title" id="error-title">Access Denied</h3>
            <p class="error-message-text" id="error-message"></p>
        </div>
        <button class="error-retry-btn" id="error-retry-btn" style="display:none;">Try Again</button>
    `;

    errorBackdrop.appendChild(errorContent);
    document.body.appendChild(errorBackdrop);

    const showError = (message, title = "Access Denied") => {
        // Clear any pending hide timeout to prevent race conditions
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        const errorMsg = errorBackdrop.querySelector(".error-message-text");
        const errorTitle = errorBackdrop.querySelector(".error-title");
        if (errorMsg) errorMsg.textContent = message;
        if (errorTitle) errorTitle.textContent = title;
        
        errorBackdrop.style.display = "flex";
        errorBackdrop.style.opacity = "0";
        
        // Use a clean transition sequence to prevent flickering
        requestAnimationFrame(() => {
            errorBackdrop.style.transition = "opacity 0.3s ease";
            errorBackdrop.style.opacity = "1";
            errorBackdrop.classList.add("active");
            errorContent.classList.remove("fadeOut");
            errorContent.classList.add("active-animate");
        });
    };

    const hideError = (immediate = false) => {
        if (hideTimeout) {
            clearTimeout(hideTimeout);
            hideTimeout = null;
        }

        if (immediate) {
            errorBackdrop.style.display = "none";
            errorBackdrop.classList.remove("active");
            errorContent.classList.remove("active-animate");
            errorContent.classList.remove("fadeOut");
            return;
        }

        // Add exit animation class for premium feel
        errorContent.classList.add("fadeOut");
        errorBackdrop.classList.remove("active");
        errorBackdrop.style.opacity = "0";

        // Sync with CSS animation/transition duration (0.4s to be safe)
        hideTimeout = setTimeout(() => {
            errorBackdrop.style.display = "none";
            errorContent.classList.remove("active-animate");
            errorContent.classList.remove("fadeOut");
            hideTimeout = null;
        }, 400);
    };

    const closeBtn = errorBackdrop.querySelector(".error-close-btn");
    if (closeBtn) closeBtn.onclick = hideError;
    errorBackdrop.onclick = (e) => { if (e.target === errorBackdrop) hideError(); };

    // --- CUSTOM VALIDATION HELPERS ---
    function showInputError(input, message) {
        if (!input) return;
        let parent = input.parentElement;
        if (parent && parent.classList.contains('password-input-wrapper')) {
            parent = parent.parentElement;
        }

        if (!parent) return;

        let error = parent.querySelector(".custom-input-error");
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            parent.appendChild(error);
        }
        
        if (error.textContent !== message || error.style.display === 'none') {
            error.textContent = message;
            input.classList.add("input-error-border");
            error.style.animation = 'none';
            error.offsetHeight; // trigger reflow
            error.style.animation = null;
        }
    }

    function clearInputError(input) {
        if (!input) return;
        let parent = input.parentElement;
        if (parent && parent.classList.contains('password-input-wrapper')) {
            parent = parent.parentElement;
        }
        if (!parent) return;
        const error = parent.querySelector(".custom-input-error");
        if (error) error.remove();
        input.classList.remove("input-error-border");
    }

    function clearAllErrors(f) {
        const inputs = f.querySelectorAll("input");
        inputs.forEach(input => clearInputError(input));
    }

    const validateEmail = (email) => /^[^\s@]+@stopreg\.com$/.test(email);

    // --- REAL-TIME VALIDATION SETUP ---
    function attachActiveValidation(input, validatorFn, errorMsgFn) {
        if (!input) return;
        input.addEventListener("input", () => {
            const val = input.value.trim();
            const isErrorShown = input.classList.contains("input-error-border");
            
            if (validatorFn(val)) {
                clearInputError(input);
            } else if (isErrorShown || val.length > 0) {
                const msg = errorMsgFn(val);
                if (msg) showInputError(input, msg);
            }
        });
    }

    attachActiveValidation(
        emailInput,
        (val) => val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
        (val) => !val ? "Administrative email is required" : "Invalid administrative email format"
    );

    attachActiveValidation(
        passwordInput,
        (val) => val.length > 0,
        (val) => "Security credential is required"
    );

    // --- FORM SUBMISSION ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        
        // Immediately clear existing errors without transition 
        // to prepare for the new authentication cycle
        hideError(true);
        clearAllErrors(form);

        const email = emailInput ? emailInput.value.trim() : "";
        const password = passwordInput ? passwordInput.value.trim() : "";

        let hasError = false;
        let firstInvalidInput = null;

        // Validate Email
        if (!email) {
            showInputError(emailInput, "Admin email address is required");
            hasError = true;
            if (!firstInvalidInput) firstInvalidInput = emailInput;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showInputError(emailInput, "Invalid administrative email format");
            hasError = true;
            if (!firstInvalidInput) firstInvalidInput = emailInput;
        }

        // Validate Password
        if (!password) {
            showInputError(passwordInput, "Security credential is required");
            hasError = true;
            if (!firstInvalidInput) firstInvalidInput = passwordInput;
        }

        // SCROLL TO ERROR
        if (hasError) {
            if (firstInvalidInput) {
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidInput.focus({ preventScroll: true });
            }
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Authenticating...`;
            
            try {
                const response = await fetch("https://api.stopreg.com/api/v1/admin/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem("adminToken", data.data.token);
                    localStorage.setItem("adminRole", "Admin");
                    
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Authenticated',
                            message: "Access granted to Administrative Portal.",
                            position: "topRight"
                        });
                    }

                    setTimeout(() => {
                        window.location.href = "/admin-dashboard/index.html"; 
                    }, 1000);
                } else {
                    const errorTitle = response.status === 401 ? "Authentication Failed" : "Access Denied";
                    showError(data.description || data.message || "Administrative access denied.", errorTitle);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;
                }
            } catch (err) {
                // Industrial Standard Network Error Detection
                const isNetworkError = err.message === 'Failed to fetch' || err.name === 'TypeError';
                const errorMsg = isNetworkError 
                    ? "Network error, please check your connection and try again." 
                    : (err.message || "Cluster connectivity error. Please verify network.");
                
                showError(errorMsg, "Connectivity Issue");
                console.error(err);
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        }
    });

    // Toggle Password Visibility
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.addEventListener("click", () => {
            const targetId = btn.dataset.target;
            const target = document.getElementById(targetId);
            if (target) {
                const type = target.type === "password" ? "text" : "password";
                target.type = type;
                const img = btn.querySelector("img");
                if (img) {
                    img.src = type === "text" ? "/assets/icons/mynaui_eye.svg" : "/assets/icons/iconoir_eye-closed.svg";
                }
            }
        });
    });
});

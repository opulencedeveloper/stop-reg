/**
 * accept-invite.js
 * Handles the logic for the dynamic invitation flow.
 * - Parses query parameters (id, token, email)
 * - Fetches invitation details from the backend
 * - Manages Loading, Error, and Success UI states with premium animations
 * - Handles Form Validation (Custom) and Submission
 */

const API_BASE_URL = 'https://api-stop-reg.onrender.com/api/v1';

document.addEventListener('DOMContentLoaded', async () => {
    // -------------------------------------------------------------------------
    // 1. SELECTORS & STATE
    // -------------------------------------------------------------------------
    const loadingState = document.getElementById('invite-loading');
    const errorState = document.getElementById('invite-error');
    const errorMessage = document.getElementById('error-message');
    const formContainer = document.getElementById('invite-form-container');
    const form = document.getElementById("invite-form");
    const retryBtn = document.getElementById('retry-btn');
    const submitBtn = document.getElementById("submit-btn");

    // Inputs
    const firstNameInput = document.getElementById('firstName');
    const lastNameInput = document.getElementById('lastName');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById("password");
    const confirmPasswordInput = document.getElementById("confirmPassword");

    let currentInviteId = null;
    let currentOtp = null;

    // Password Regex: 1 Uppercase, 1 Lowercase, 1 Number, 8+ chars
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    // -------------------------------------------------------------------------
    // 2. PREMIUM ERROR MODAL SETUP (Dynamic Creation)
    // -------------------------------------------------------------------------
    const errorBackdrop = document.createElement("div");
    errorBackdrop.className = "error-backdrop";
    // errorBackdrop.style.display = "none"; // Handled by CSS/Class toggling usually, but let's be safe
    
    const errorContent = document.createElement("div");
    errorContent.className = "error-content premium-error";

    // Close Button
    const closeBtn = document.createElement("button");
    closeBtn.className = "error-close-btn";
    closeBtn.innerHTML = "&times;";
    
    // Icon
    const iconWrapper = document.createElement("div");
    iconWrapper.className = "error-icon-wrapper";
    iconWrapper.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" class="error-icon-svg" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    // Text Content
    const textWrapper = document.createElement("div");
    textWrapper.className = "error-text-wrapper";
    
    const modalErrorTitle = document.createElement("h3");
    modalErrorTitle.className = "error-title";
    modalErrorTitle.textContent = "Registration Failed";

    const modalErrorMessage = document.createElement("p");
    modalErrorMessage.className = "error-message-text";

    textWrapper.appendChild(modalErrorTitle);
    textWrapper.appendChild(modalErrorMessage);

    // Assemble
    errorContent.appendChild(closeBtn);
    errorContent.appendChild(iconWrapper);
    errorContent.appendChild(textWrapper);
    errorBackdrop.appendChild(errorContent);
    document.body.appendChild(errorBackdrop);

    // Modal Functions
    const showModalError = (msg) => {
        modalErrorMessage.textContent = msg;
        // Reset display to flex to show it
        errorBackdrop.style.display = 'flex';
        // Reflow
        void errorContent.offsetWidth; 
        errorBackdrop.classList.add("active");
        errorContent.classList.add("active-animate");
    };

    const hideModalError = () => {
        if (errorContent.classList.contains("active-animate")) {
            errorContent.classList.remove("active-animate");
            errorBackdrop.classList.remove("active");
            setTimeout(() => {
                errorBackdrop.style.display = 'none';
            }, 300);
        } else {
             errorBackdrop.style.display = 'none';
        }
    };

    closeBtn.onclick = hideModalError;
    errorBackdrop.addEventListener('click', (e) => {
        if (e.target === errorBackdrop) hideModalError();
    });

    // -------------------------------------------------------------------------
    // 3. UI STATE HELPERS
    // -------------------------------------------------------------------------
    const showLoading = () => {
        loadingState.style.display = 'flex';
        errorState.style.display = 'none';
        formContainer.style.display = 'none';
    };

    const showPageError = (message, isNetworkError = false) => {
        loadingState.style.display = 'none';
        errorState.style.display = 'flex';
        formContainer.style.display = 'none';
        errorMessage.textContent = message || 'Something went wrong. Please try again.';

        if (isNetworkError) {
            retryBtn.style.display = 'inline-flex';
        } else {
            retryBtn.style.display = 'none';
        }
    };

    const showForm = () => {
        loadingState.style.display = 'none';
        errorState.style.display = 'none';
        formContainer.style.display = 'block'; 
        formContainer.classList.add('animate-fade-up');
    };

    // -------------------------------------------------------------------------
    // 4. CUSTOM VALIDATION LOGIC
    // -------------------------------------------------------------------------
    const showInputError = (input, message) => {
        const parent = input.parentElement; // .form-group
        let error = parent.querySelector(".custom-input-error");
        
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            parent.appendChild(error);
        }
        
        // Update content/style if changed
        if (error.textContent !== message || error.style.display === 'none') {
            error.textContent = message;
            input.classList.add("input-error-border");
            // Trigger animation restart
            error.style.animation = 'none';
            void error.offsetWidth;
            error.style.animation = null;
        }
    };

    const clearInputError = (input) => {
        const parent = input.parentElement;
        const error = parent.querySelector(".custom-input-error");
        if (error) error.remove();
        input.classList.remove("input-error-border");
    };

    const clearAllErrors = () => {
        const inputs = form.querySelectorAll("input");
        inputs.forEach(input => clearInputError(input));
    };

    // Attach Live Validation
    const attachLiveValidation = () => {
        // Password
        passwordInput.addEventListener("input", () => {
            const val = passwordInput.value.trim();
            const isErrorShown = passwordInput.classList.contains("input-error-border");
            
            if (passwordPattern.test(val)) {
                clearInputError(passwordInput);
            } else if (isErrorShown || val.length > 0) {
                 if (val.length === 0) {
                     showInputError(passwordInput, "Password is required");
                 } else {
                     showInputError(passwordInput, "Must have 1 uppercase, 1 lowercase, 1 number, 8+ chars");
                 }
            }
            
            // Re-validate confirm password if it has value
            if (confirmPasswordInput.value.trim()) {
                const cVal = confirmPasswordInput.value.trim();
                if (cVal !== val) {
                    showInputError(confirmPasswordInput, "Passwords do not match");
                } else {
                    clearInputError(confirmPasswordInput);
                }
            }
        });

        // Confirm Password
        confirmPasswordInput.addEventListener("input", () => {
            const val = confirmPasswordInput.value.trim();
            const pass = passwordInput.value.trim();
            const isErrorShown = confirmPasswordInput.classList.contains("input-error-border");

            if (val && val === pass) {
                clearInputError(confirmPasswordInput);
            } else if (isErrorShown || val.length > 0) {
                if (!val) {
                    showInputError(confirmPasswordInput, "Please confirm your password");
                } else if (val !== pass) {
                    showInputError(confirmPasswordInput, "Passwords do not match");
                }
            }
        });
    };

    // -------------------------------------------------------------------------
    // 5. FETCH & SUBMIT LOGIC
    // -------------------------------------------------------------------------
    const getQueryParams = () => {
        const params = new URLSearchParams(window.location.search);
        return {
            id: params.get('id'),
            token: params.get('token'),
            email: params.get('email')
        };
    };

    const fetchInvitation = async (id, emailParam) => {
        showLoading();
        try {
            await new Promise(resolve => setTimeout(resolve, 800)); // Animation delay

            const response = await fetch(`${API_BASE_URL}/seat/invite-details?id=${id}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            // Parse response safely
            const result = await response.json().catch(() => null);

            if (!response.ok) {
                const msg = result ? (result.description || result.message) : 'Failed to connect to server.';
                const isNet = !result || response.status >= 500;
                throw { message: msg, isNetworkError: isNet };
            }

            if (result && result.data) {
                // Populate Form
                firstNameInput.value = result.data.firstName || '';
                lastNameInput.value = result.data.lastName || '';
                emailInput.value = result.data.email || emailParam || ''; 
                
                showForm();
            } else {
                throw { message: 'Invalid response format from server.', isNetworkError: false };
            }

        } catch (error) {
            console.error('Fetch Invitation Error:', error);
            
            let msg = error.message || 'Something went wrong.';
            const isNet = error.isNetworkError || msg.includes('Failed to fetch') || msg.includes('NetworkError');

            if (isNet) {
                 msg = 'Network connection error. Please check your internet.';
            }
            showPageError(msg, isNet);
        }
    };

    // Handle Submit
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideModalError();
        clearAllErrors();

        const password = passwordInput.value.trim();
        const confirmPassword = confirmPasswordInput.value.trim();

        let hasError = false;
        let firstInvalidInput = null;

        // Custom Validation Check on Submit
        if (!password) {
            showInputError(passwordInput, "Password is required");
            hasError = true;
            if (!firstInvalidInput) firstInvalidInput = passwordInput;
        } else if (!passwordPattern.test(password)) {
            showInputError(passwordInput, "Must have 1 uppercase, 1 lowercase, 1 number, 8+ chars");
             hasError = true;
            if (!firstInvalidInput) firstInvalidInput = passwordInput;
        }

        if (!confirmPassword) {
            showInputError(confirmPasswordInput, "Please confirm your password");
             hasError = true;
            if (!firstInvalidInput) firstInvalidInput = confirmPasswordInput;
        } else if (password !== confirmPassword) {
             showInputError(confirmPasswordInput, "Passwords do not match");
             hasError = true;
            if (!firstInvalidInput) firstInvalidInput = confirmPasswordInput;
        }

        if (hasError) {
            if (firstInvalidInput) {
                firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                firstInvalidInput.focus({ preventScroll: true });
            }
            return;
        }

        // Prepare Payload
        const payload = {
            inviteId: currentInviteId,
            password: password,
            confirmPassword: confirmPassword,
            otp: currentOtp
        };

        // Loading State for Button
        const originalText = submitBtn.innerText;
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Processing...`; // Ensure .stopreg-btn-spinner CSS exists or use loader class from styles

        try {
            const response = await fetch(`${API_BASE_URL}/seat/accept-invitation`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await response.json().catch(() => ({}));

            if (response.ok) {
                // Success: Show iziToast
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        message: "Invitation accepted successfully!",
                        position: "topRight"
                    });
                }
                
                // Maybe redirect or show success state? 
                // Creating a simplified success UI here or redirecting to login/dashboard
                setTimeout(() => {
                   window.location.href = '/sign-in.html';
                }, 1500);

            } else {
                // Error: Show iziToast AND Modal
                const errorMsg = data.description || data.message || "Registration failed!";
                
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        message: errorMsg,
                        position: "topRight"
                    });
                }
                showModalError(errorMsg);
            }
        } catch (err) {
            console.error("Submission Error:", err);
            const msg = "Network error — please try again later.";
             if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        message: msg,
                        position: "topRight"
                    });
                }
            showModalError(msg);
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerText = originalText;
        }
    });

    // -------------------------------------------------------------------------
    // 6. INITIALIZATION
    // -------------------------------------------------------------------------
    const init = () => {
        const { id, token, email } = getQueryParams();
        currentInviteId = id;
        currentOtp = token;

        attachLiveValidation();
        retryBtn.addEventListener('click', () => {
             if (currentInviteId) fetchInvitation(currentInviteId, email);
        });

        if (!id) {
            showPageError('Invalid invitation link. Missing ID.');
            return;
        }

        fetchInvitation(id, email);
    };

    // Toggle Password Visibility Logic
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const input = document.getElementById(targetId);
            const img = this.querySelector('img');
            
            if (input && input.type === 'password') {
                input.type = 'text';
                img.src = '/assets/icons/mynaui_eye.svg';
                img.alt = 'Hide Password';
            } else if (input) {
                input.type = 'password';
                img.src = '/assets/icons/iconoir_eye-closed.svg';
                img.alt = 'Show Password';
            }
        });
    });

    init();
});

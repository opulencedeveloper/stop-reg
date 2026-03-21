document.addEventListener("DOMContentLoaded", () => {
    const steps = [
        document.getElementById("fp-step-1"),
        document.getElementById("fp-step-2"),
        document.getElementById("fp-step-3")
    ];
    let currentStep = 0;

    const backBtn = document.getElementById("fp-back-btn");

    function goToStep(index, direction = 'forward') {
        if (index < 0) {
            window.location.href = '/sign-in.html';
            return;
        }
        if (index >= steps.length) return;

        const currentEle = steps[currentStep];
        currentEle.classList.remove("active");
        if (direction === 'forward') {
            currentEle.classList.add("slide-out-left");
            currentEle.classList.remove("slide-out-right");
        } else {
            currentEle.classList.add("slide-out-right");
            currentEle.classList.remove("slide-out-left");
        }

        const nextEle = steps[index];
        nextEle.classList.remove("slide-out-left", "slide-out-right");
        
        requestAnimationFrame(() => {
            nextEle.classList.add("active");
        });

        currentStep = index;
    }

    if (backBtn) {
        backBtn.addEventListener("click", (e) => {
            if (currentStep > 0) {
                e.preventDefault();
                goToStep(currentStep - 1, 'backward');
            }
        });
    }

    // --- CUSTOM VALIDATION HELPERS (Mirrored from login.js) ---
    function showInputError(input, message) {
        let parent = input.parentElement;
        // Climb up if inside a password wrapper to ensure error is outside
        if (parent.classList.contains('password-input-wrapper')) {
            parent = parent.parentElement;
        }
        // Specific handling for OTP inputs wrapper
        if (parent.classList.contains('otp-inputs')) {
            parent = parent.parentElement;
        }

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
            error.offsetHeight; /* trigger reflow */
            error.style.animation = null; 
        }
    }

    function clearInputError(input) {
        let parent = input.parentElement;
        if (parent.classList.contains('password-input-wrapper')) {
            parent = parent.parentElement;
        }
        if (parent.classList.contains('otp-inputs')) {
            parent = parent.parentElement;
        }
        const error = parent.querySelector(".custom-input-error");
        if (error) error.remove();
        input.classList.remove("input-error-border");
    }

    function clearAllErrors(form) {
        const inputs = form.querySelectorAll("input");
        inputs.forEach(input => clearInputError(input));
    }

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

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

    // --- STEP 1: EMAIL ---
    const form1 = document.getElementById("fp-form-1");
    const emailInput = document.getElementById("fp-email");
    
    attachActiveValidation(
        emailInput, 
        (val) => val && validateEmail(val),
        (val) => !val ? "Email address is required" : "Please enter a valid email address"
    );

    let userEmail = "";
    let userOtp = "";

    if (form1) {
        form1.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAllErrors(form1);

            const email = emailInput.value.trim();
            let hasError = false;

            if (!email) {
                showInputError(emailInput, "Email address is required");
                hasError = true;
            } else if (!validateEmail(email)) {
                showInputError(emailInput, "Please enter a valid email address");
                hasError = true;
            }

            if (hasError) {
                emailInput.focus({ preventScroll: true });
                return;
            }
            
            const btn = form1.querySelector(".submit-btn");
            const originalText = btn.textContent;
            btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><span class="stopreg-btn-spinner" style="width:16px;height:16px;border-top-color:#fff;"></span>Processing...</span>`;
            btn.disabled = true;

            try {
                const response = await fetch(`https://api.stopreg.com/api/v1/auth/forgot-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.description || data.message || "Failed to initiate password reset.");
                }
                
                userEmail = email; // Store for the next steps
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({ title: "Success", message: data.description || "OTP sent!", position: "topRight" });
                }
                goToStep(1, 'forward');

            } catch (error) {
                // If the error message is "Failed to fetch", it's a network error
                const errorMessage = error.message === "Failed to fetch" 
                    ? "Network error,  please check your connection and try again." 
                    : error.message;

                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ title: 'Error', message: errorMessage, position: 'topRight' });
                } else {
                    showInputError(emailInput, errorMessage);
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }

    // --- STEP 2: OTP ---
    const otpInputs = document.querySelectorAll(".fp-otp-input");
    if (otpInputs.length > 0) {
        otpInputs.forEach((input, index) => {
            // Remove error styling on any input change
            input.addEventListener("input", (e) => {
                const parentForm = input.closest('form');
                if (parentForm) clearAllErrors(parentForm);

                if (e.target.value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });

            input.addEventListener("keydown", (e) => {
                if (e.key === "Backspace" && !e.target.value && index > 0) {
                    otpInputs[index - 1].focus();
                    otpInputs[index - 1].value = "";
                }
            });

            input.addEventListener("paste", (e) => {
                e.preventDefault();
                const parentForm = input.closest('form');
                if (parentForm) clearAllErrors(parentForm);

                const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 5);
                if (pastedData) {
                    pastedData.split("").forEach((char, i) => {
                        if (otpInputs[i]) otpInputs[i].value = char;
                    });
                    if (pastedData.length < 5) {
                        otpInputs[pastedData.length].focus();
                    } else {
                        otpInputs[4].focus();
                    }
                }
            });
        });
    }

    const form2 = document.getElementById("fp-form-2");
    if (form2) {
        form2.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAllErrors(form2);
            
            const otpValue = Array.from(otpInputs).map(inp => inp.value).join("");
            if (otpValue.length < 5) {
                showInputError(otpInputs[otpInputs.length - 1], "Please enter the complete 5-digit OTP");
                otpInputs.forEach(inp => {
                    if(!inp.value) inp.classList.add("input-error-border");
                });
                return;
            }

            const btn = form2.querySelector(".submit-btn");
            const originalText = btn.textContent;
            btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><span class="stopreg-btn-spinner" style="width:16px;height:16px;border-top-color:#fff;"></span>Verifying...</span>`;
            btn.disabled = true;

            try {
                const response = await fetch(`https://api.stopreg.com/api/v1/auth/verify-reset-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: userEmail, otp: otpValue })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.description || data.message || "Invalid OTP code.");
                }

                userOtp = otpValue; // Store the verified OTP globally to send in Step 3
                goToStep(2, 'forward');

            } catch (error) {
                const errorMessage = error.message === "Failed to fetch" 
                    ? "Network error,  please check your connection and try again." 
                    : error.message;

                // Attach error to the last input for positioning
                showInputError(otpInputs[otpInputs.length - 1], errorMessage);
                otpInputs.forEach(inp => inp.classList.add("input-error-border"));
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ title: 'Error', message: errorMessage, position: 'topRight' });
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });

        // OTP Resend Logic
        const resendBtn = document.getElementById("fp-resend-btn");
        if (resendBtn) {
            resendBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                if (resendBtn.disabled) return;
                
                const originalText = resendBtn.innerHTML;
                resendBtn.innerHTML = `<span class="stopreg-btn-spinner" style="width:12px;height:12px;border:2px solid rgba(20, 82, 202, 0.1) !important;border-top-color:#1452CA !important;margin-right:8px;"></span>Sending...`;
                resendBtn.disabled = true;
                
                try {
                    const response = await fetch(`https://api.stopreg.com/api/v1/auth/forgot-password`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: userEmail })
                    });
    
                    const data = await response.json();
    
                    if (!response.ok) {
                        throw new Error(data.description || data.message || "Failed to resend OTP.");
                    }
                    
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({ title: "Sent", message: "A new code has been sent to your email.", position: "topRight" });
                    }

                    // Simple 30s cooldown
                    let timeLeft = 30;
                    const timer = setInterval(() => {
                        resendBtn.innerHTML = `Resend in ${timeLeft}s`;
                        timeLeft--;
                        if (timeLeft < 0) {
                            clearInterval(timer);
                            resendBtn.innerHTML = originalText;
                            resendBtn.disabled = false;
                        }
                    }, 1000);

                } catch (error) {
                    resendBtn.innerHTML = originalText;
                    resendBtn.disabled = false;
                    
                    const errorMessage = error.message === "Failed to fetch" 
                        ? "Network error,  please check your connection and try again." 
                        : error.message;

                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({ title: 'Error', message: errorMessage, position: 'topRight' });
                    }
                }
            });
        }
    }

    // --- STEP 3: NEW PASSWORD ---
    const form3 = document.getElementById("fp-form-3");
    const newPassInput = document.getElementById("fp-new-password");
    const confirmPassInput = document.getElementById("fp-confirm-password");

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    attachActiveValidation(
        newPassInput,
        (val) => val.length >= 8 && passwordRegex.test(val),
        (val) => {
            if (!val) return "Password is required.";
            if (val.length < 8) return "Password must be at least 8 characters long.";
            return "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
        }
    );

    attachActiveValidation(
        confirmPassInput,
        (val) => val === newPassInput.value && val.length > 0,
        (val) => !val ? "Please confirm your password" : "Passwords do not match"
    );

    if (form3) {
        form3.addEventListener("submit", async (e) => {
            e.preventDefault();
            clearAllErrors(form3);
            
            let hasError = false;
            let firstInvalidInput = null;
            const pass = newPassInput.value;
            const confirmPass = confirmPassInput.value;

            if (!pass || pass.length < 8 || !passwordRegex.test(pass)) {
                let errorMsg = "Password is required.";
                if (pass && pass.length < 8) errorMsg = "Password must be at least 8 characters long.";
                else if (pass && !passwordRegex.test(pass)) errorMsg = "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
                
                showInputError(newPassInput, errorMsg);
                hasError = true;
                if (!firstInvalidInput) firstInvalidInput = newPassInput;
            }

            if (!confirmPass || pass !== confirmPass) {
                showInputError(confirmPassInput, !confirmPass ? "Please confirm your password" : "Passwords do not match");
                hasError = true;
                if (!firstInvalidInput) firstInvalidInput = confirmPassInput;
            }

            if (hasError) {
                firstInvalidInput.focus({ preventScroll: true });
                return;
            }

            const btn = form3.querySelector(".submit-btn");
            const originalText = btn.textContent;
            btn.innerHTML = `<span style="display:inline-flex;align-items:center;gap:8px;"><span class="stopreg-btn-spinner" style="width:16px;height:16px;border-top-color:#fff;"></span>Processing...</span>`;
            btn.disabled = true;

            try {
                const response = await fetch(`https://api.stopreg.com/api/v1/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        email: userEmail, 
                        otp: userOtp, 
                        password: pass, 
                        confirmPassword: confirmPass 
                    })
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.description || data.message || "Failed to reset password.");
                }

                if (typeof iziToast !== 'undefined') {
                    iziToast.success({ title: "Success", message: "Password reset successfully. Redirecting...", position: "topRight" });
                }
                setTimeout(() => {
                    window.location.href = "/sign-in.html";
                }, 1500);

            } catch (error) {
                const errorMessage = error.message === "Failed to fetch" 
                    ? "Network error,  please check your connection and try again." 
                    : error.message;

                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ title: 'Error', message: errorMessage, position: 'topRight' });
                } else {
                    showInputError(newPassInput, errorMessage);
                }
            } finally {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        });
    }
});

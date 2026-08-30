
document.addEventListener("DOMContentLoaded", () => {
    // --- Invitation Modal Elements ---
    const inviteForm = document.getElementById("add-seats-form");
    const emailInput = document.getElementById("seat-email");
    const fnameInput = document.getElementById("seat-firstname");
    const lnameInput = document.getElementById("seat-lastname");
    const inviteSubmitBtn = inviteForm?.querySelector(".add-seats-submit-btn");

    if (!inviteForm || !inviteSubmitBtn) return;

    // --- Validation Helpers (Mirroring signup.js) ---
    function showInputError(input, message) {
        let parent = input.parentElement;
        let error = parent.querySelector(".custom-input-error");
        
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            // Simple styling inline or assume class exists (usually does in this project)
            error.style.color = "#DC2626";
            error.style.fontSize = "12px";
            error.style.marginTop = "4px";
            parent.appendChild(error);
        }

        if (error.textContent !== message) {
            error.textContent = message;
            input.style.borderColor = "#DC2626"; // Direct style for invalid
        }
    }

    function clearInputError(input) {
        let parent = input.parentElement;
        const error = parent.querySelector(".custom-input-error");
        if (error) error.remove();
        input.style.borderColor = ""; // Reset
    }

    function clearAllErrors() {
        if (!inviteForm) return;
        const inputs = inviteForm.querySelectorAll("input");
        inputs.forEach(input => clearInputError(input));
    }

    // --- Active Validation ---
    function attachActiveValidation(input, validatorFn, errorMsgFn) {
        if (!input) return;
        input.addEventListener("input", () => {
            const val = input.value.trim();
            // Check if error is currently shown by checking border color or existence of error msg
            const isErrorShown = input.style.borderColor === "rgb(220, 38, 38)"; // #DC2626

            if (validatorFn(val)) {
                clearInputError(input);
            } else if (isErrorShown || val.length > 0) {
                const msg = errorMsgFn(val);
                if (msg) showInputError(input, msg);
            }
        });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    attachActiveValidation(
        emailInput,
        (val) => val && emailPattern.test(val),
        (val) => !val ? "Email is required" : "Please enter a valid email address"
    );

    attachActiveValidation(
        fnameInput,
        (val) => val.length > 0,
        () => "First Name is required"
    );

    attachActiveValidation(
        lnameInput,
        (val) => val.length > 0,
        () => "Last Name is required"
    );


    // --- Form Submission ---
    inviteForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const planName = await window.getUserPlan();
        if (planName === "Free") {
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Restricted',
                    message: 'Seat management is a premium feature. Please upgrade your plan.',
                    position: 'topRight'
                });
            }
            return;
        }

        // Check seat limit for paid plans using already-fetched seat count
        const limit = getSeatLimit(planName);
        const usedSeats = window.userSeatCount || 0;

        if (hasReachedSeatLimit(planName, usedSeats)) {
            const msg = getSeatLimitMessage(planName, limit);
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Seat Limit Reached',
                    message: msg,
                    position: 'topRight'
                });
            }
            showModalError(msg);
            return;
        }

        clearAllErrors();

        const email = emailInput.value.trim();
        const firstName = fnameInput.value.trim();
        const lastName = lnameInput.value.trim();

        let hasError = false;

        // Final Validation Check
        if (!email || !emailPattern.test(email)) {
            showInputError(emailInput, !email ? "Email is required" : "Please enter a valid email address");
            hasError = true;
        }
        if (!firstName) {
            showInputError(fnameInput, "First Name is required");
            hasError = true;
        }
        if (!lastName) {
            showInputError(lnameInput, "Last Name is required");
            hasError = true;
        }

        if (hasError) return;

        // Prepare Request
        const payload = { email, firstName, lastName };
        const token = localStorage.getItem("authToken");

        if (!token) {
             if (typeof iziToast !== 'undefined') {
                iziToast.error({ message: "Authentication required. Please login." });
             }
             return;
        }

        // Loading State
        const originalText = inviteSubmitBtn.innerText;
        inviteSubmitBtn.disabled = true;
        // Use the StopReg specific quick spinner class if available or generic
        inviteSubmitBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-top-color: #fff"></span> Sending...`;

        try {
            const response = await fetch("https://api.stopreg.com/api/v1/seat/invite", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        message: "Invitation sent successfully!",
                        position: "topRight"
                    });
                }
                
                // Close Modal Logic (Assuming close button exists from modal js)
                const closeBtn = document.getElementById('close-seats-modal');
                if (closeBtn) closeBtn.click(); // Trigger existing close logic
                
                inviteForm.reset();

                // Refresh Table if it exists (for seats.html)
                if (typeof window.fetchSeatsTable === 'function') {
                    // Re-read current limit
                    const limitSelect = document.getElementById("seats-per-page-select");
                    const limit = limitSelect ? parseInt(limitSelect.value) : 10;
                    window.fetchSeatsTable(1, limit); // Reset to page 1 to see new entry
                } else if (window.location.pathname.includes("/dashboard/index.html")) {
                     // For dashboard index, we might want to reload if we can't update part of it
                     setTimeout(() => window.location.reload(), 1000); 
                }

            } else {
                if (window.handleAuthError && await window.handleAuthError(response)) {
                    return;
                }
                throw new Error(data.description || "Failed to send invitation");
            }

        } catch (error) {
            console.error("Invite Error:", error);
            
            // Show custom error UI (iziToast or Modal)
            // User requested "design an error ui that shows the error response"
            // We can reuse the premium-error-backdrop if applicable or just iziToast + input error
            
             // 1. Show above-form error or iziToast
             if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: "Error",
                    message: error.message,
                    position: "topRight"
                });
             }
             
             if (window.handleAuthError && await window.handleAuthError(error)) {
                return;
             }
             
             // 2. Also map to updated "Error UI" 
             // We can use the existing 'premium-error-backdrop' for a modal alert
             showModalError(error.message);
        } finally {
            inviteSubmitBtn.disabled = false;
            inviteSubmitBtn.innerText = originalText;
        }
    });

    // Reuse existing Error Modal Logic if available
    function showModalError(msg) {
        const errorBackdrop = document.getElementById("premium-error-backdrop");
        const errorMsgEl = document.getElementById("error-message");
        const errorTitleEl = document.getElementById("error-title"); // "Access Denied" default

        if (errorBackdrop && errorMsgEl) {
            if (errorTitleEl) errorTitleEl.textContent = "Invitation Failed";
            errorMsgEl.textContent = msg;
            errorBackdrop.style.display = "flex";
            // Add active classes for animation if needed (from index.js logic)
            errorBackdrop.classList.add("active");
            const content = errorBackdrop.querySelector(".premium-error");
            if (content) content.classList.add("active-animate");
            
            // Ensure close button works
            const close = document.getElementById("error-close-btn");
            if (close) {
                close.onclick = () => {
                    errorBackdrop.style.display = "none";
                    errorBackdrop.classList.remove("active");
                };
            }
            
            // Close on background click
            errorBackdrop.onclick = (e) => {
                if (e.target === errorBackdrop) {
                     errorBackdrop.style.display = "none";
                     errorBackdrop.classList.remove("active");
                }
            };
        }
    }
});

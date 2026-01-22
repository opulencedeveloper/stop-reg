 
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signIn-form");
  const submitBtn = form.querySelector(".cr-btn");
  const overLay = document.getElementById("overlay");
    const description = document.querySelector(".otp-email");

  const otpModal = document.getElementById("otp-modal");
 

  // Premium Error Modal Structure
  const errorBackdrop = document.createElement("div");
  errorBackdrop.className = "error-backdrop";
  errorBackdrop.style.display = "none";

  const errorContent = document.createElement("div");
  errorContent.className = "error-content premium-error";

  // Close Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "error-close-btn";
  closeBtn.innerHTML = "&times;";
  closeBtn.onclick = hideError;

  // Icon Wrapper
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
  
  const errorTitle = document.createElement("h3");
  errorTitle.className = "error-title";
  errorTitle.textContent = "Authentication Failed";

  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message-text";

  textWrapper.appendChild(errorTitle);
  textWrapper.appendChild(errorMessage);

  // Assemble
  errorContent.appendChild(closeBtn);
  errorContent.appendChild(iconWrapper);
  errorContent.appendChild(textWrapper);
  errorBackdrop.appendChild(errorContent);

  // Append to body to ensure it sits on top of everything
  document.body.appendChild(errorBackdrop);

  // Close on backdrop click
  errorBackdrop.addEventListener('click', (e) => {
    if (e.target === errorBackdrop) hideError();
  });

  function showError(message) {
      errorMessage.textContent = message;
      errorBackdrop.style.display = "flex";
      // Trigger animation reflow
      void errorContent.offsetWidth; 
      errorBackdrop.classList.add("active");
      errorContent.classList.add("active-animate");
  }

  function hideError() {
    if (errorContent.classList.contains("active-animate")) {
        errorContent.classList.remove("active-animate");
        errorBackdrop.classList.remove("active"); // For backdrop fade-out if needed
        
        // Wait for CSS transition to complete (0.3s for opacity matches the CSS)
        setTimeout(() => {
            errorBackdrop.style.display = "none";
        }, 300);
    } else {
        errorBackdrop.style.display = "none";
    }
  }

  // --- CUSTOM VALIDATION HELPERS ---
  function showInputError(input, message) {
    const parent = input.parentElement;
    let error = parent.querySelector(".custom-input-error");
    if (!error) {
      error = document.createElement("div");
      error.className = "custom-input-error";
      parent.appendChild(error);
    }
    // Only update text/animate if message changes or it was hidden
    if (error.textContent !== message || error.style.display === 'none') {
        error.textContent = message;
        input.classList.add("input-error-border");
        error.style.animation = 'none';
        error.offsetHeight; /* trigger reflow */
        error.style.animation = null; 
    }
  }

  function clearInputError(input) {
    const parent = input.parentElement;
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

  // --- REAL-TIME VALIDATION SETUP ---
  const emailInput = document.getElementById("signin-email");
  const passwordInput = document.getElementById("signin-password");

  // Helper for active real-time validation
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
      (val) => val && validateEmail(val),
      (val) => !val ? "Email address is required" : "Please enter a valid email address"
  );

  attachActiveValidation(
      passwordInput,
      (val) => val.length > 0,
      (val) => "Password is required"
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError(); // Hide top-level error modal if open
    // Note: We don't blindly clearAllErrors here anymore if we want to preserve state, 
    // but standard submit re-validates everything.
    clearAllErrors(form);

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    let hasError = false;
    let firstInvalidInput = null;

    // Validate Email
    if (!email) {
      showInputError(emailInput, "Email address is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = emailInput;
    } else if (!validateEmail(email)) {
      showInputError(emailInput, "Please enter a valid email address");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = emailInput;
    }

    // Validate Password
    if (!password) {
      showInputError(passwordInput, "Password is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = passwordInput;
    }

    // SCROLL TO ERROR
    if (hasError) {
      if (firstInvalidInput) {
        firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        firstInvalidInput.focus({ preventScroll: true });
      }
      return; // Stop submission
    }

    const payload = { email, password };

    const originalText = submitBtn.innerHTML;
    const originalTextString = "Log In";
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Logging in...`;

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/auth/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      console.log("Response:", data);

      // 🔥 FIX: Handle OTP request BEFORE success/error blocks
      if (data.message === "verify_email") {
        // Redirect to Sign Up page with email for OTP verification
        window.location.href = `/sign-up.html?email=${encodeURIComponent(email)}`;
        return;
      }

      if (response.ok) {
        iziToast.success({
          message: "Account logged in successfully!",
          position: "topRight",
        });

        const token = data?.data?.token;
        const hasValidPlan = data?.data?.hasValidPlan;
        const planId = data?.data?.planId;
        const tokenExpiresAt = data?.data?.tokenExpiresAt;

        localStorage.setItem("authToken", token);

        // Check if user has a valid subscription plan
        if (hasValidPlan && planId && tokenExpiresAt && new Date(tokenExpiresAt) > new Date()) {
          // User has valid plan - go to dashboard
        window.location.href = "/dashboard/index.html";
        } else {
          // User doesn't have valid plan - go to payments page
          window.location.href = "/dashboard/payments.html";
        }

        if (overLay) overLay.style.display = "none";
        form.reset();
      } else {
        showError(data.description || data.message || "Login failed!");
      }
    } catch (err) {
      showError("Network error — please try again later.");
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
      console.error(err);
    } finally {
        submitBtn.disabled = false;
        // Restore only if it was stuck on loading
        if (submitBtn.innerHTML.includes("stopreg-btn-spinner")) {
            submitBtn.textContent = originalTextString;
        }
    }
  });
});
 

  

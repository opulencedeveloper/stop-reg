 
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const submitBtn = form.querySelector(".cr-btn");
  
  // Elements that might not exist on the standalone page
  const overLay = document.getElementById("overlay");
  
  const otpModal = document.getElementById("otp-modal");
  const description = document.querySelector(".otp-email"); // Ensure this class exists in the new HTML

  // --- PREMIUM ERROR UI SETUP (Copied from login.js) ---
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
  errorTitle.textContent = "Registration Failed";

  const errorMessage = document.createElement("p");
  errorMessage.className = "error-message-text";

  textWrapper.appendChild(errorTitle);
  textWrapper.appendChild(errorMessage);

  // Assemble
  errorContent.appendChild(closeBtn);
  errorContent.appendChild(iconWrapper);
  errorContent.appendChild(textWrapper);
  errorBackdrop.appendChild(errorContent);

  // Append to body
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
        errorBackdrop.classList.remove("active");
        
        setTimeout(() => {
            errorBackdrop.style.display = "none";
        }, 300);
    } else {
        errorBackdrop.style.display = "none";
    }
  }

  // --- CUSTOM VALIDATION HELPERS ---
  function showInputError(input, message) {
    let parent = input.parentElement;
    // Climb up if inside a password wrapper to ensure error is outside
    if (parent.classList.contains('password-input-wrapper')) {
        parent = parent.parentElement;
    }

    let error = parent.querySelector(".custom-input-error");
    if (!error) {
      error = document.createElement("div");
      error.className = "custom-input-error";
      parent.appendChild(error);
    }
    
    // Only update if changes
    if (error.textContent !== message || error.style.display === 'none') {
        error.textContent = message;
        input.classList.add("input-error-border");
        error.style.animation = 'none';
        error.offsetHeight; 
        error.style.animation = null;
    }
  }

  function clearInputError(input) {
    let parent = input.parentElement;
    if (parent.classList.contains('password-input-wrapper')) {
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

  // --- REAL-TIME VALIDATION SETUP ---
  const emailInput = document.getElementById("email");
  const fnameInput = document.getElementById("fname");
  const lnameInput = document.getElementById("lname");
  const passwordInput = document.getElementById("signup-password");
  const cPasswordInput = document.getElementById("signup-cpassword");

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

  // Helper for active real-time checks
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
      (val) => val && emailPattern.test(val),
      (val) => !val ? "Email is required" : "Please enter a valid email address"
  );
  
  attachActiveValidation(
      fnameInput, 
      (val) => val.length > 0,
      (val) => "First Name is required"
  );
  
  attachActiveValidation(
      lnameInput, 
      (val) => val.length > 0,
       (val) => "Last Name is required"
  );
  // Password utilizes custom logic already, but let's standardize slightly or leave as is since it handles complexity
  if (passwordInput) {
      passwordInput.addEventListener("input", () => {
          const val = passwordInput.value.trim();
          const isErrorShown = passwordInput.classList.contains("input-error-border");
          
          if (passwordPattern.test(val)) {
              clearInputError(passwordInput);
          } else if (isErrorShown || val.length > 0) {
              if (val.length === 0) {
                  showInputError(passwordInput, "Password is required.");
              } else if (val.length < 8) {
                  showInputError(passwordInput, "Password must be at least 8 characters long.");
              } else {
                  showInputError(passwordInput, "Password must contain at least one uppercase letter, one lowercase letter, and one number.");
              }
          }
      });
  }
  
  if (cPasswordInput) {
      cPasswordInput.addEventListener("input", () => {
          const val = cPasswordInput.value.trim();
          const pass = passwordInput ? passwordInput.value.trim() : "";
          const isErrorShown = cPasswordInput.classList.contains("input-error-border");

          // Valid if: not empty AND matches password
          if (val && val === pass) {
              clearInputError(cPasswordInput);
          } else if (isErrorShown || val.length > 0) {
               // Show specific error
               if (!val) {
                   showInputError(cPasswordInput, "Please confirm your password");
               } else if (val !== pass) {
                   showInputError(cPasswordInput, "Passwords do not match");
               }
          }
      });
  }


  // FORM SUBMIT HANDLER
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();
      clearAllErrors(form); 
  
      localStorage.removeItem("otp_email");
  
      const email = emailInput.value.trim();
      const firstName = fnameInput ? fnameInput.value.trim() : "";
      const lastName = lnameInput ? lnameInput.value.trim() : "";
      const password = passwordInput.value.trim();
      const confirmPassword = cPasswordInput.value.trim();

      let hasError = false;
      let firstInvalidInput = null;

      // Validate Email
      if (!email) {
          showInputError(emailInput, "Email is required");
          hasError = true;
          if (!firstInvalidInput) firstInvalidInput = emailInput;
      } else if (!emailPattern.test(email)) {
          showInputError(emailInput, "Please enter a valid email address");
          hasError = true;
          if (!firstInvalidInput) firstInvalidInput = emailInput;
      }

      // Validate First Name
      if (fnameInput && !firstName) {
          showInputError(fnameInput, "First Name is required");
          hasError = true;
          if (!firstInvalidInput) firstInvalidInput = fnameInput;
      }

      // Validate Last Name
      if (lnameInput && !lastName) {
          showInputError(lnameInput, "Last Name is required");
          hasError = true;
          if (!firstInvalidInput) firstInvalidInput = lnameInput;
      }

      // Validate Password
      if (!password) {
           showInputError(passwordInput, "Password is required.");
           hasError = true;
           if (!firstInvalidInput) firstInvalidInput = passwordInput;
      } else if (password.length < 8) {
           showInputError(passwordInput, "Password must be at least 8 characters long.");
           hasError = true;
           if (!firstInvalidInput) firstInvalidInput = passwordInput;
      } else if (!passwordPattern.test(password)) {
           showInputError(passwordInput, "Password must contain at least one uppercase letter, one lowercase letter, and one number.");
           hasError = true;
           if (!firstInvalidInput) firstInvalidInput = passwordInput;
      }

      // Validate Confirm Password
      if (!confirmPassword) {
           showInputError(cPasswordInput, "Please confirm your password");
           hasError = true;
           if (!firstInvalidInput) firstInvalidInput = cPasswordInput;
      } else if (password !== confirmPassword) {
           showInputError(cPasswordInput, "Passwords do not match");
           hasError = true;
           if (!firstInvalidInput) firstInvalidInput = cPasswordInput;
      }

      // SCROLL TO ERROR
      if (hasError) {
        if (firstInvalidInput) {
          firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
          firstInvalidInput.focus({ preventScroll: true });
        }
        return; // Stop submission
      }
  
      // Payload with new fields
      const payload = { 
          email, 
          password, 
          confirmPassword,
          firstName,
          lastName
      };
  
      const originalText = submitBtn.innerHTML; 
      const originalTextString = "Create an Account";
      submitBtn.disabled = true;
      // Use the Fast Spinner
      submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Creating Account...`;
  
      try {
        const response = await fetch(
          "https://api.stopreg.com/api/v1/auth/register",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
  
        const data = await response.json();
        
        if (response.ok) {
          if (typeof iziToast !== 'undefined') {
            iziToast.success({
              message: "Account created successfully!",
              position: "topRight",
            });
          }
          
          localStorage.setItem("otp_email", email);
          const newEmail = localStorage.getItem("otp_email");
          
          if (description) description.textContent = `${newEmail}`;
  
          if (overLay) overLay.style.display = "none";
  
          // Open OTP modal AFTER saving
          setTimeout(() => {
            form.reset();
            // Trigger OTP modal opening with animation
            if (otpModal) {
                otpModal.style.display = "flex";
                // Trigger reflow
                void otpModal.offsetWidth;
                otpModal.classList.add("active");
                
                // Focus first input if available
                const firstInput = otpModal.querySelector("input");
                if (firstInput) firstInput.focus();
            }
            document.body.classList.add("hidden-overflow");
          }, 300);
        } else {
             showError(data.description || data.message || "Registration failed!");
        }
      } catch (err) {
        showError("Network error,  please try again later.");
        console.error(err);
        submitBtn.innerHTML = originalTextString;
      } finally {
        submitBtn.disabled = false;
        if (submitBtn.innerHTML.includes("stopreg-btn-spinner")) {
             submitBtn.textContent = originalTextString;
        }
      }
    });
  }
});
 

 
  

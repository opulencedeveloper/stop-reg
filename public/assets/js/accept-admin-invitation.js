document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:8080/api/v1/admin";

  // --- ELEMENTS ---
  const getEl = (id) => document.getElementById(id);

  const loadingSection = getEl("loading-section");
  const invalidTokenSection = getEl("invalid-token-section");
  const successSection = getEl("success-section");
  const acceptInvitationForm = getEl("accept-invitation-form");

  const tokenVerificationSection = getEl("token-verification-section");
  const profileSection = getEl("profile-section");
  const verifyTokenBtn = getEl("verify-token-btn");

  const invitationTokenInput = getEl("invitationToken");
  const invitationInfo = getEl("invitation-info");

  const firstNameInput = getEl("firstName");
  const lastNameInput = getEl("lastName");
  const passwordInput = getEl("password");
  const confirmPasswordInput = getEl("confirmPassword");
  const togglePasswordBtn = getEl("toggle-password-btn");
  const submitBtn = getEl("submit-btn");

  const inviteeEmailDisplay = getEl("invitee-email-display");
  const adminRoleDisplay = getEl("admin-role-display");

  const passwordRequirements = getEl("password-requirements");

  // --- STATE ---
  let invitationToken = null;
  let invitationData = null;
  let tokenVerified = false;

  // --- UTILITIES ---

  const showToast = (message, type = "success") => {
    iziToast[type]({
      title: type.charAt(0).toUpperCase() + type.slice(1),
      message: message,
      position: "topRight",
      timeout: 4000,
    });
  };

  const getUrlParam = (param) => {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
  };

  const formatRoleName = (role) => {
    if (role === "super_admin") return "Super Admin";
    if (role === "admin") return "Admin";
    return role;
  };

  const hideAllStates = () => {
    loadingSection.style.display = "none";
    invalidTokenSection.style.display = "none";
    successSection.style.display = "none";
    acceptInvitationForm.style.display = "none";
  };

  // --- INPUT ERROR HANDLING ---

  const showInputError = (input, message) => {
    if (!input) return;

    let parent = input.parentElement;
    // Climb up if inside a password wrapper
    if (parent.classList.contains('password-input-wrapper')) {
      parent = parent.parentElement;
    }

    let errorElement = parent.querySelector(".custom-input-error");
    if (!errorElement) {
      errorElement = document.createElement("div");
      errorElement.className = "custom-input-error";
      parent.appendChild(errorElement);
    }

    // Animate error message with reflow trigger
    if (errorElement.textContent !== message || errorElement.style.display === 'none') {
      errorElement.textContent = message;
      input.classList.add("input-error-border");
      errorElement.style.animation = 'none';
      errorElement.offsetHeight; // trigger reflow
      errorElement.style.animation = null;
    }
  };

  const clearInputError = (input) => {
    if (!input) return;

    let parent = input.parentElement;
    if (parent.classList.contains('password-input-wrapper')) {
      parent = parent.parentElement;
    }

    const errorElement = parent.querySelector(".custom-input-error");
    if (errorElement) {
      errorElement.remove();
    }
    input.classList.remove("input-error-border");
  };

  const clearAllErrors = () => {
    const inputs = [invitationTokenInput, firstNameInput, lastNameInput, passwordInput, confirmPasswordInput];
    inputs.forEach(input => {
      if (input) clearInputError(input);
    });
  };

  // --- PASSWORD VALIDATION ---

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
    };
  };

  const isPasswordValid = (password) => {
    const validation = validatePassword(password);
    return validation.length && validation.uppercase && validation.lowercase && validation.number;
  };

  const updatePasswordRequirements = () => {
    const password = passwordInput.value;
    const validation = validatePassword(password);

    const updateRequirement = (id, isValid) => {
      const el = getEl(id);
      if (isValid) {
        el.classList.add("met");
      } else {
        el.classList.remove("met");
      }
    };

    updateRequirement("req-length", validation.length);
    updateRequirement("req-uppercase", validation.uppercase);
    updateRequirement("req-lowercase", validation.lowercase);
    updateRequirement("req-number", validation.number);

    if (password.length > 0) {
      passwordRequirements.style.display = "flex";
    }
  };

  // --- TOGGLE PASSWORD VISIBILITY ---

  const setupPasswordToggle = () => {
    const toggleButtons = document.querySelectorAll('.toggle-password');

    toggleButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = btn.getAttribute('data-target');
        const input = document.getElementById(targetId);
        const icon = btn.querySelector('img');

        if (input) {
          if (input.type === "password") {
            input.type = "text";
            if (icon) icon.src = "/assets/icons/mynaui_eye.svg"; // Open eye - password visible
          } else {
            input.type = "password";
            if (icon) icon.src = "/assets/icons/iconoir_eye-closed.svg"; // Closed eye - password hidden
          }
        }
      });
    });
  };

  setupPasswordToggle();

  // --- VERIFY INVITATION TOKEN ---

  const showStep = (stepNum) => {
    if (stepNum === 1) {
      // Show Step 1 (Token Verification)
      tokenVerificationSection.classList.remove('slide-out-left');
      tokenVerificationSection.classList.add('slide-in-right');
      tokenVerificationSection.style.display = "block";

      profileSection.classList.add('slide-out-left');
      profileSection.style.display = "none";
    } else if (stepNum === 2) {
      // Show Step 2 (Profile)
      tokenVerificationSection.classList.add('slide-out-left');
      tokenVerificationSection.style.display = "none";

      profileSection.classList.remove('slide-out-left');
      profileSection.classList.add('slide-in-right');
      profileSection.style.display = "block";
    }
  };

  const enableProfileInputs = () => {
    firstNameInput.disabled = false;
    lastNameInput.disabled = false;
    passwordInput.disabled = false;
    confirmPasswordInput.disabled = false;
    submitBtn.disabled = false;
    showStep(2); // Transition to Step 2
  };

  const disableProfileInputs = () => {
    firstNameInput.disabled = true;
    lastNameInput.disabled = true;
    passwordInput.disabled = true;
    confirmPasswordInput.disabled = true;
    submitBtn.disabled = true;
    showStep(1); // Show Step 1 on error
  };

  const verifyInvitation = async (token) => {
    try {
      // Validate token input first - show inline error, not toast
      if (!token || token.trim().length === 0) {
        showInputError(invitationTokenInput, "Invitation code is required");
        invitationTokenInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        invitationTokenInput.focus();
        return false;
      }

      // Clear any existing error
      clearInputError(invitationTokenInput);

      verifyTokenBtn.disabled = true;
      verifyTokenBtn.innerHTML = `<span>Verifying...</span>`;

      const response = await fetch(`${API_BASE_URL}/invitations/verify`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Invalid or expired token");
      }

      const data = await response.json();
      invitationData = data.data;
      invitationToken = token.trim();
      tokenVerified = true;

      // Display invitation info
      inviteeEmailDisplay.textContent = invitationData.email;
      adminRoleDisplay.textContent = formatRoleName(invitationData.role);
      invitationInfo.style.display = "block";

      // Enable profile inputs
      enableProfileInputs();

      // Hide loading section and show form
      loadingSection.style.display = "none";
      acceptInvitationForm.style.display = "block";

      // Scroll to Step 2 (profile section)
      setTimeout(() => {
        profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        firstNameInput.focus();
      }, 300);

      showToast("Invitation verified! Complete your profile below.", "success");
      return true;
    } catch (error) {
      console.error("Verification error:", error);
      tokenVerified = false;
      invitationInfo.style.display = "none";
      disableProfileInputs();

      // Hide loading section and show form with error
      loadingSection.style.display = "none";
      acceptInvitationForm.style.display = "block";

      // Make token editable if auto-verify failed (so user can try again)
      invitationTokenInput.readOnly = false;

      // Show inline error for API errors, not toast
      showInputError(invitationTokenInput, error.message || "Failed to verify invitation");
      invitationTokenInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      invitationTokenInput.focus();

      return false;
    } finally {
      verifyTokenBtn.disabled = false;
      verifyTokenBtn.innerHTML = `<span>Verify Token</span>`;
    }
  };

  const initializeForm = () => {
    // Check if token is in URL (for convenience/backward compatibility)
    const urlToken = getUrlParam("token");
    if (urlToken) {
      // Auto-verification: token is read-only
      hideAllStates();
      loadingSection.style.display = "flex";

      invitationTokenInput.value = urlToken;
      invitationTokenInput.readOnly = true; // Make read-only for auto-verify
      verifyInvitation(urlToken);
    } else {
      // Manual verification: token input is fully editable
      hideAllStates();
      acceptInvitationForm.style.display = "block";
      invitationTokenInput.readOnly = false; // Allow editing
      invitationTokenInput.disabled = false; // Never disabled for manual entry
      showStep(1); // Show Step 1
    }
  };

  // --- REAL-TIME VALIDATION ---

  const attachActiveValidation = (input, validatorFn, errorMsgFn) => {
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
  };

  // Attach real-time validation to token input
  attachActiveValidation(
    invitationTokenInput,
    (val) => val.length > 0,
    (val) => "Invitation code is required"
  );

  // Attach real-time validation to all profile inputs
  attachActiveValidation(
    firstNameInput,
    (val) => val.length > 0,
    (val) => "First name is required"
  );

  attachActiveValidation(
    lastNameInput,
    (val) => val.length > 0,
    (val) => "Last name is required"
  );

  attachActiveValidation(
    passwordInput,
    (val) => isPasswordValid(val),
    (val) => {
      if (!val) return "Password is required";
      if (val.length < 8) return "Password must be at least 8 characters long";
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }
  );

  attachActiveValidation(
    confirmPasswordInput,
    (val) => {
      const pass = passwordInput.value.trim();
      return val && val === pass;
    },
    (val) => {
      if (!val) return "Please confirm your password";
      if (val !== passwordInput.value.trim()) return "Passwords do not match";
      return null;
    }
  );

  // --- FORM VALIDATION ON SUBMIT ---
  // Matches backend validator in /src/admin/validator.ts: validateAcceptAdminInvitation

  const validateInvitationForm = () => {
    clearAllErrors();
    let hasError = false;
    let firstInvalidInput = null;

    const token = invitationTokenInput.value.trim();
    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate Token (backend: required, trimmed, not empty)
    if (!token) {
      showInputError(invitationTokenInput, "Invitation code is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = invitationTokenInput;
    }

    // Validate First Name (backend: required, trimmed, not empty)
    if (!firstName) {
      showInputError(firstNameInput, "First name is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = firstNameInput;
    }

    // Validate Last Name (backend: required, trimmed, not empty)
    if (!lastName) {
      showInputError(lastNameInput, "Last name is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = lastNameInput;
    }

    // Validate Password (backend: required, min 8 chars, regex pattern)
    if (!password) {
      showInputError(passwordInput, "Password is required");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = passwordInput;
    } else if (password.length < 8) {
      showInputError(passwordInput, "Password must be at least 8 characters long");
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = passwordInput;
    } else if (!isPasswordValid(password)) {
      showInputError(
        passwordInput,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      );
      hasError = true;
      if (!firstInvalidInput) firstInvalidInput = passwordInput;
    }

    // Validate Confirm Password
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
      return false;
    }

    return true;
  };

  // --- ACCEPT INVITATION ---

  const acceptInvitation = async (event) => {
    event.preventDefault();

    // Validate form (all fields including token)
    if (!validateInvitationForm()) {
      return;
    }

    // Check token was verified after inline validation
    if (!tokenVerified || !invitationToken) {
      showInputError(invitationTokenInput, "Please verify your invitation code first");
      invitationTokenInput.focus();
      return;
    }

    const firstName = firstNameInput.value.trim();
    const lastName = lastNameInput.value.trim();
    const password = passwordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Validate inputs
    if (!firstName || !lastName) {
      showToast("Please enter your first and last name", "error");
      return;
    }

    if (!isPasswordValid(password)) {
      showToast("Password does not meet requirements", "error");
      return;
    }

    if (password !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }

    try {
      const submitBtn = acceptInvitationForm.querySelector("button[type='submit']");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>Creating Account...</span>`;

      const response = await fetch(`${API_BASE_URL}/invitations/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: invitationToken,
          password,
          confirmPassword,
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Failed to accept invitation");
      }

      const data = await response.json();

      hideAllStates();
      successSection.style.display = "block";

      showToast("Admin account created successfully!", "success");
    } catch (error) {
      console.error("Accept invitation error:", error);
      showToast(error.message || "Failed to create admin account", "error");

      const submitBtn = acceptInvitationForm.querySelector("button[type='submit']");
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<span>Create Admin Account</span>`;
    }
  };

  // --- EVENT LISTENERS ---

  // Verify Token button click
  verifyTokenBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const token = invitationTokenInput.value.trim();
    verifyInvitation(token);
  });

  // Allow Enter key to verify token (convenience)
  invitationTokenInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const token = e.target.value.trim();
      if (token.length > 0) {
        verifyTokenBtn.click();
      }
    }
  });

  passwordInput.addEventListener("input", updatePasswordRequirements);
  acceptInvitationForm.addEventListener("submit", acceptInvitation);

  // --- INIT ---

  initializeForm();
});

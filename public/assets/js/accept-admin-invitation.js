document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://api.stopreg.com/api/v1/admin";

  // --- ELEMENTS ---
  const getEl = (id) => document.getElementById(id);

  const loadingSection = getEl("loading-section");
  const invalidTokenSection = getEl("invalid-token-section");
  const successSection = getEl("success-section");
  const acceptInvitationForm = getEl("accept-invitation-form");

  const invitationTokenInput = getEl("invitationToken");
  const invitationInfo = getEl("invitation-info");

  const firstNameInput = getEl("firstName");
  const lastNameInput = getEl("lastName");
  const passwordInput = getEl("password");
  const confirmPasswordInput = getEl("confirmPassword");
  const togglePasswordBtn = getEl("toggle-password-btn");

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
        el.classList.add("requirement-met");
        el.classList.remove("requirement-unmet");
      } else {
        el.classList.remove("requirement-met");
        el.classList.add("requirement-unmet");
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

  togglePasswordBtn.addEventListener("click", (e) => {
    e.preventDefault();
    const isPassword = passwordInput.type === "password";
    passwordInput.type = isPassword ? "text" : "password";
    togglePasswordBtn.classList.toggle("active", isPassword);
  });

  // --- VERIFY INVITATION TOKEN ---

  const verifyInvitation = async (token) => {
    try {
      if (!token || token.trim().length === 0) {
        throw new Error("Please enter your invitation code");
      }

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

      showToast("Invitation verified! Complete your profile below.", "success");
      return true;
    } catch (error) {
      console.error("Verification error:", error);
      tokenVerified = false;
      invitationInfo.style.display = "none";
      showToast(error.message || "Failed to verify invitation", "error");
      return false;
    }
  };

  const initializeForm = () => {
    // Check if token is in URL (for convenience/backward compatibility)
    const urlToken = getUrlParam("token");
    if (urlToken) {
      invitationTokenInput.value = urlToken;
      verifyInvitation(urlToken);
    } else {
      // Show form and let user enter token
      acceptInvitationForm.style.display = "block";
    }
  };

  // --- ACCEPT INVITATION ---

  const acceptInvitation = async (event) => {
    event.preventDefault();

    // Check token was verified first
    if (!tokenVerified || !invitationToken) {
      showToast("Please verify your invitation code first", "error");
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
          firstName,
          lastName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.description || "Failed to accept invitation");
      }

      const data = await response.json();

      acceptInvitationForm.style.display = "none";
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

  // Token verification on blur (when user finishes entering)
  invitationTokenInput.addEventListener("blur", (e) => {
    const token = e.target.value.trim();
    if (token.length > 0) {
      verifyInvitation(token);
    }
  });

  // Allow Enter key to verify token
  invitationTokenInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const token = e.target.value.trim();
      if (token.length > 0) {
        verifyInvitation(token);
      }
    }
  });

  passwordInput.addEventListener("input", updatePasswordRequirements);
  acceptInvitationForm.addEventListener("submit", acceptInvitation);

  // --- INIT ---

  initializeForm();
});

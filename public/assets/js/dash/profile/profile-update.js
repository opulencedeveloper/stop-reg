document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("form-container");
  const submitBtn = form?.querySelector(".p-save-ch-btn");

  if (!form || !submitBtn) return;

  // Create error modal
  const errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  form.parentElement?.appendChild(errorModal);

  const userFullNameEl = document.querySelector(".profile-name");
  const storedFullName = localStorage.getItem("userName");
  if (userFullNameEl) userFullNameEl.textContent = storedFullName || "No name yet";

  const errorIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
    <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
  </svg>`;

  function showError(message) {
    errorModal.innerHTML = `${errorIcon}<span>${message}</span>`;
    errorModal.style.display = "flex";
  }

  function hideError() {
    errorModal.style.display = "none";
  }

  // Helper: check auth token
  function requireAuth() {
    const token = localStorage.getItem("authToken");
    if (!token) {
      window.location.href = "/sign-in.html";
      return null;
    }
    return token;
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

  // Attach validation to inputs
  const firstNameInputEl = document.getElementById("firstname");
  const lastNameInputEl = document.getElementById("lastname");

  attachActiveValidation(
      firstNameInputEl, 
      (val) => val.length > 0,
      (val) => "First name is required"
  );

  attachActiveValidation(
      lastNameInputEl,
      (val) => val.length > 0,
      (val) => "Last name is required"
  );

  // ------------------------
  // Form submit handler
  // ------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    clearAllErrors(form);

    const token = requireAuth();
    if (!token) return;

    const firstNameInput = firstNameInputEl?.value.trim();
    const lastNameInput = lastNameInputEl?.value.trim();

    let hasError = false;
    let firstInvalidInput = null;

    if (!firstNameInput) {
        showInputError(firstNameInputEl, "First name is required");
        hasError = true;
        if (!firstInvalidInput) firstInvalidInput = firstNameInputEl;
    }

    if (!lastNameInput) {
        showInputError(lastNameInputEl, "Last name is required");
        hasError = true;
        if (!firstInvalidInput) firstInvalidInput = lastNameInputEl;
    }

    if (hasError) {
        if (firstInvalidInput) {
            firstInvalidInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            firstInvalidInput.focus({ preventScroll: true });
        }
        return;
    }

    const fullNameInput = `${firstNameInput} ${lastNameInput}`.trim();
    const payload = { 
        firstName: firstNameInput,
        lastName: lastNameInput
    };
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Processing...`;

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/user/update/fullname",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (data.message === "verify_email") {
        showError("Please verify your email before updating your name.");
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("role");
        window.location.href = "/sign-in.html";
        return;
      }

      if (response.ok) {
        localStorage.setItem("userName", fullNameInput);
        
        // Update UI elements dynamically
        const userFullNameEl = document.querySelector(".profile-name");
        const headerNameEl = document.getElementById("user-name");
        
        if (userFullNameEl) userFullNameEl.textContent = fullNameInput;
        if (headerNameEl) headerNameEl.textContent = fullNameInput;

        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Profile updated successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      } else {
        const errorMessage = data.description || data.message || "Update failed!";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        } else {
          showError(errorMessage);
        }
      }
    } catch (err) {
      console.error(err);
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Network Error',
          message: "Network error — please try again later.",
          position: "topRight",
          timeout: 5000,
          drag: false,
          displayMode: 1,
          zindex: 100000000,
        });
      } else {
        showError("Network error — please try again later.");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  // ------------------------
  // Fetch and display user info
  // ------------------------
  const token = requireAuth();
  if (!token) return;

  try {
    const response = await fetch(
      "http://localhost:8080/api/v1/user/info",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.ok) {
      const user = data?.data || data;

      const tokenEl = document.querySelector(".main-token");
      if (tokenEl) tokenEl.textContent = user.userDetails?.apiToken || "";

      const nameEl = document.getElementById("user-name");
      const emailEl = document.getElementById("user-email");

      if (nameEl) nameEl.textContent = user.name || "Unknown";
      if (emailEl) emailEl.textContent = user.email || "No email";
    } else {
      console.error("Error fetching user info:", data);
      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("role");
        window.location.href = "/sign-in.html";
      } else {
        const errorMessage = data.description || data.message || "Failed to fetch user information.";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      }
    }
  } catch (error) {
    console.error("Network error fetching user info:", error);
    if (typeof iziToast !== 'undefined') {
      iziToast.error({
        title: 'Network Error',
        message: "Network error — please try again later.",
        position: "topRight",
        timeout: 5000,
        drag: false,
        displayMode: 1,
        zindex: 100000000,
      });
    }
  }
});

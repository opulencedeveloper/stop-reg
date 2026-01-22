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
      window.location.href = "/";
      return null;
    }
    return token;
  }

  // ------------------------
  // Form submit handler
  // ------------------------
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();

    const token = requireAuth();
    if (!token) return;

    const fullNameInput = document.getElementById("fullname")?.value.trim();
    if (!fullNameInput) return showError("Full name is required");

    const payload = { fullName: fullNameInput };
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> ${originalText}`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/user/update/fullname",
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

      if (response.ok) {
        localStorage.setItem("userName", fullNameInput);
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

        form.reset();
        window.location.reload();
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
      "https://api-stop-reg.onrender.com/api/v1/user/info",
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
        window.location.href = "/";
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

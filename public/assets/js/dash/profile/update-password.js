document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-container");
  const submitBtn = form.querySelector(".p-save-ch-btn");

  // Hide global spinner
  if (typeof window.hideSpinner === "function") {
    window.hideSpinner();
  }

  // Error modal
  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  form.parentElement.appendChild(errorModal);

  const errorIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
    </svg>
  `;

  function showError(message) {
    errorModal.innerHTML = `${errorIcon}<span>${message}</span>`;
    errorModal.style.display = "flex";
  }

  function hideError() {
    errorModal.style.display = "none";
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
    const token = localStorage.getItem("authToken");


    const currentPassword = document
      .getElementById("signup-password")
      .value.trim();
    const password = document.getElementById("signup-rpassword").value.trim();
    const confirmPassword = document
      .getElementById("signup-cpassword")
      .value.trim();

    if (password !== confirmPassword)
      return showError("Passwords do not match!");

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password) {
      return showError("New password is required.");
    }
    if (password.length < 8) {
      return showError("New password must be at least 8 characters long.");
    }
    if (!passwordPattern.test(password)) {
      return showError("New password must contain at least one uppercase letter, one lowercase letter, and one number.");
    }

    const payload = { currentPassword, confirmPassword, password };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/user/update/password",
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // ✅ send token here
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();
      if (response.ok) {
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Password updated successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.reset();
      } else {
        if (await window.handleAuthError(response)) {
          return;
        }
        const errorMessage = data.description || data.message || "Failed to update password.";
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
          message: "Network error,  please try again later.",
          position: "topRight",
          timeout: 5000,
          drag: false,
          displayMode: 1,
          zindex: 100000000,
        });
      } else {
        showError("Network error,  please try again later.");
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

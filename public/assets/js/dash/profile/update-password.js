document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-container");
  const submitBtn = form.querySelector(".p-save-ch-btn");

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

    if (!token) {
      window.location.href = "/login.html";
      return;
    }

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
    if (!passwordPattern.test(password)) {
      return showError(
        "Password must contain uppercase, lowercase, number and 8+ characters."
      );
    }

    const payload = { currentPassword, confirmPassword, password };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/user/update/password",
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
      console.log("Response:", data);

      // 🔥 FIX: Handle OTP request BEFORE success/error blocks
    

      if (response.ok) {
        iziToast.success({
          message: "Account logged in successfully!",
          position: "topRight",
        });

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        form.reset();
      } else {
        showError(data.description || data.message || "Login failed!");
      }
    } catch (err) {
      showError("Network error — please try again later.");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});

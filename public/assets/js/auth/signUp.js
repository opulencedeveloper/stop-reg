
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signup-form");
  const submitBtn = form.querySelector(".cr-btn");
  const overLay = document.getElementById("overlay");

  const otpModal = document.getElementById("otp-modal");
  
  const description = document.querySelector(".otp-email");

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

  // FORM SUBMIT HANDLER
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideError();
        
    localStorage.removeItem("otp_email");

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirmPassword = document
      .getElementById("signup-cpassword")
      .value.trim();

    // VALIDATION
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email))
      return showError("Please enter a valid email address!");

    if (password !== confirmPassword)
      return showError("Passwords do not match!");

    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(password)) {
      return showError(
        "Password must contain uppercase, lowercase, number and 8+ characters."
      );
    }

    const payload = { email, password, confirmPassword };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span>`;

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
      console.log("Response:", data);
      if (response.ok) {
        iziToast.success({
          message: "Account created successfully!",
          position: "topRight",
        });
        localStorage.setItem("otp_email", email);
        const newEmail = localStorage.getItem("otp_email");
        description.textContent = `${newEmail}`;

        overLay.style.display = "none";

        // Open OTP modal AFTER saving
        setTimeout(() => {
          form.reset();
          otpModal.style.display = "flex";
          document.body.classList.add("hidden-overflow");
        }, 300);
      } else {
        // Show error description from response
        const errorMessage = data.description || data.message || "An error occurred. Please try again.";
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
});

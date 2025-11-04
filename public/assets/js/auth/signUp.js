document.addEventListener("DOMContentLoaded", () => {


  const form = document.getElementById("signup-form");
  const submitBtn = form.querySelector(".cr-btn");
   const overLay = document.getElementById("overlay");
    const signupDialog = document.getElementById("signup-dialog");

 
  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  form.parentElement.appendChild(errorModal);

  // SVG icon for error messages
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
    hideError(); // reset error modal

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("signup-password").value.trim();
    const confirmPassword = document
      .getElementById("signup-cpassword")
      .value.trim();

    // Email validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      showError("Please enter a valid email address!");
      return;
    }

    // Password confirmation check
    if (password !== confirmPassword) {
      showError("Passwords do not match!");
      return;
    }

    // Password strength validation
    const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordPattern.test(password)) {
      showError(
        "Password must contain at least 8 characters, including uppercase, lowercase, and a number."
      );
      return;
    }

    const payload = { email, password, confirmPassword };

    // Add spinner
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Creating...`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/auth/register",
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
          drag: false,
          displayMode: 1,
        });
         overLay.style.display = "none";
        form.reset();
      } else {
        showError(data.description || data.message || "Signup failed!");
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

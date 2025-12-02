 
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signIn-form");
  const submitBtn = form.querySelector(".cr-btn");
  const overLay = document.getElementById("overlay");
    const description = document.querySelector(".otp-email");

  const otpModal = document.getElementById("otp-modal");
  const otpDialog = document.getElementById("otp-dialog");

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

    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value.trim();

    const payload = { email, password };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Login...`;

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/login",
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
        localStorage.removeItem("otp_email");
        localStorage.setItem("otp_email", email);

         const newEmail = localStorage.getItem("otp_email")
             description.textContent = `${newEmail }`;
        const overLay = document.getElementById("overlay");
        const loginDialog = document.getElementById("signin-dialog");
        
     
        overLay.style.display = "none";
        loginDialog.style.display = "none";

        otpModal.style.display = "flex";
        otpDialog.style.display = "flex";
        

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      if (response.ok) {
        iziToast.success({
          message: "Account logged in successfully!",
          position: "topRight",
        });

        const token = data?.data?.token;
        localStorage.setItem("authToken", token);

        window.location.href = "/dashboard/index.html";
        overLay.style.display = "none";
        form.reset();
      } else {
        showError(data.description || data.message || "Login failed!");
      }
    } catch (err) {
      showError("Network error — please try again later.");
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});
 
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("signIn-form");
  const submitBtn = form.querySelector(".cr-btn");
  const overLay = document.getElementById("overlay");
    const description = document.querySelector(".otp-email");

  const otpModal = document.getElementById("otp-modal");
  const otpDialog = document.getElementById("otp-dialog");

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

    const email = document.getElementById("signin-email").value.trim();
    const password = document.getElementById("signin-password").value.trim();

    const payload = { email, password };

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Login...`;

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/login",
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
        localStorage.removeItem("otp_email");
        localStorage.setItem("otp_email", email);

         const newEmail = localStorage.getItem("otp_email")
             description.textContent = `${newEmail }`;
        const overLay = document.getElementById("overlay");
        const loginDialog = document.getElementById("signin-dialog");
        
     
        overLay.style.display = "none";
        loginDialog.style.display = "none";

        otpModal.style.display = "flex";
      
        document.body.classList.add("hidden-overflow");

        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
        return;
      }

      if (response.ok) {
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Account logged in successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }

        const token = data?.data?.token;
        localStorage.setItem("authToken", token);

        window.location.href = "/dashboard/index.html";
        overLay.style.display = "none";
        form.reset();
      } else {
        const errorMessage = data.description || data.message || "Login failed!";
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
  

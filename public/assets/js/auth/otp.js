 
document.addEventListener("DOMContentLoaded", () => {
  const otpModal = document.getElementById("otp-modal");
  const otpDialog = document.getElementById("otp-dialog");
  const otpInputs = document.querySelectorAll(".otp-input");
  const submitOtpBtn = document.getElementById("submit-otp-btn");
  const resendOtpBtn = document.getElementById("resend-otp-btn");
  const otpCloseBtn = document.getElementById("otp-close-btn");
  const formContainer = document.querySelector(".otp-inputs");
  const overLay = document.getElementById("overlay");
  const signinDialog = document.getElementById("signin-dialog");
  const signupDialog = document.getElementById("signup-dialog");
  const description = document.querySelector(".otp-email");

  // Error modal
  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  formContainer.parentElement.appendChild(errorModal);

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

  // RESET OTP MODAL
  function resetOtpModal() {
    otpInputs.forEach((input) => (input.value = ""));
    localStorage.removeItem("otp_email");
    otpModal.style.display = "none";
    otpDialog.style.display = "none";

    document.body.classList.remove("hidden-overflow");
    hideError();
    submitOtpBtn.disabled = false;
    submitOtpBtn.textContent = "Verify OTP";
    console.log("OTP modal closed — OTP cleared & email removed");
  }

  // Close OTP modal
  otpCloseBtn.addEventListener("click", resetOtpModal);

  if (otpCloseBtn) {
    otpCloseBtn.addEventListener("click", () => {
      otpModal.classList.add("fadeOut");

      otpModal.addEventListener(
        "animationend",
        function () {
          otpCloseBtn.classList.remove("fadeOut");
          overLay.style.display = "none";
          signupDialog.style.display = "none";
          signinDialog.style.display = "none";
          otpModal.style.display = "none";
          otpDialog.style.display = "none";
        },
        { once: true }
      );
    });
  }

  // OTP input auto focus
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // Get email from URL or localStorage
  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email");
  const savedEmail = localStorage.getItem("otp_email");
  const email = savedEmail || urlEmail;
  description.textContent = `${email}`;

  const urlOtp = params.get("token")?.replace(/"/g, "");

  // Auto-fill OTP if token exists
  if (urlEmail && params.has("token") && urlOtp) {
    overLay.style.display = "none";
    otpModal.style.display = "flex";

    document.body.classList.add("hidden-overflow");

    otpInputs.forEach((input, index) => {
      input.value = urlOtp[index] || "";
    });

    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    autoVerify(email, urlOtp);
  }

  // AUTO VERIFY OTP
  async function autoVerify(email, otp) {
    hideError();
    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/verify/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        iziToast.success({
          message: "Email verified successfully!",
          position: "topRight",
        });
        overLay.style.display = "flex";
        signupDialog.style.display = "none";
        signinDialog.style.display = "block";
        otpModal.style.display = "none";
        otpDialog.style.display = "none";

        signinDialog.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        showError(data.description || data.message || "Verification failed!");
        console.log("Verification failed:", data, email, otp);
      }
    } catch (err) {
      console.error(err);
      showError("Network error — please try again later.");
    } finally {
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = "Verify OTP";
    }
  }

  // MANUAL SUBMIT OTP
  submitOtpBtn.addEventListener("click", async () => {
    hideError();
    const code = Array.from(otpInputs)
      .map((i) => i.value)
      .join("");
    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    const newEmail = localStorage.getItem("otp_email");
    if (!newEmail) {
      showError("Email not found. Cannot verify OTP.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
      return;
    }

    if (code.length !== 6) {
      showError("Please enter all 6 digits.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
      return;
    }

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/verify/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail, otp: code }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        iziToast.success({
          message: "Email verified successfully!",
          position: "topRight",
        });
        overLay.style.display = "flex";
        signupDialog.style.display = "none";
        signinDialog.style.display = "block";
        otpModal.style.display = "none";
        otpDialog.style.display = "none";

        signinDialog.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        navIcons.classList.remove("open");
        navMenu.classList.remove("active");
        document.body.classList.add("hidden-overflow");
      } else {
        showError(
          data.description || data.message || "Otp verification failed!"
        );
        submitOtpBtn.disabled = false;
        submitOtpBtn.textContent = originalText;
      }
    } catch (err) {
      console.error(err);
      showError("Network error — please try again later.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });

  // RESEND OTP
  resendOtpBtn.addEventListener("click", async () => {
    hideError();
    const newEmail = localStorage.getItem("otp_email");
    if (!newEmail) {
      return showError("Email not found. Cannot resend OTP.");
    }

    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/resend/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        iziToast.success({
          message: "OTP resent successfully!",
          position: "topRight",
        });
      } else {
        showError(data.description || data.message || "OTP resend failed!");
      }
    } catch (err) {
      console.error(err);
      showError("Network error — please try again later.");
    } finally {
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });
});
=======
document.addEventListener("DOMContentLoaded", () => {
  const otpModal = document.getElementById("otp-modal");
  const otpDialog = document.getElementById("otp-dialog");
  const otpInputs = document.querySelectorAll(".otp-input");
  const submitOtpBtn = document.getElementById("submit-otp-btn");
  const resendOtpBtn = document.getElementById("resend-otp-btn");
  const otpCloseBtn = document.getElementById("otp-close-btn");
  const formContainer = document.querySelector(".otp-inputs");
  const overLay = document.getElementById("overlay");
  const signinDialog = document.getElementById("signin-dialog");
  const signupDialog = document.getElementById("signup-dialog");

  // Error modal
  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  formContainer.parentElement.appendChild(errorModal);

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

  // RESET OTP MODAL
  function resetOtpModal() {
    otpInputs.forEach((input) => (input.value = ""));
    localStorage.removeItem("otp_email");
    otpModal.style.display = "none";
    otpDialog.style.display = "none";

    document.body.classList.remove("hidden-overflow");
    hideError();
    submitOtpBtn.disabled = false;
    submitOtpBtn.textContent = "Verify OTP";
    console.log("OTP modal closed — OTP cleared & email removed");
  }

  // Close OTP modal
  otpCloseBtn.addEventListener("click", resetOtpModal);

  if (otpCloseBtn) {
    otpCloseBtn.addEventListener("click", () => {
      otpModal.classList.add("fadeOut");

      otpModal.addEventListener(
        "animationend",
        function () {
          otpCloseBtn.classList.remove("fadeOut");
          overLay.style.display = "none";
          signupDialog.style.display = "none";
          signinDialog.style.display = "none";
          otpModal.style.display = "none";
          otpDialog.style.display = "none";
        },
        { once: true }
      );
    });
  }

  // OTP input auto focus
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && input.value === "" && index > 0) {
        otpInputs[index - 1].focus();
      }
    });
  });

  // Get email from URL or localStorage
  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email");
  const savedEmail = localStorage.getItem("otp_email");
  const email = savedEmail || urlEmail;

  const urlOtp = params.get("token")?.replace(/"/g, "");

  // Auto-fill OTP if token exists
  if (urlEmail && params.has("token") && urlOtp) {
    otpModal.style.display = "flex";
    otpDialog.style.display = "flex";
    document.body.classList.add("hidden-overflow");

    otpInputs.forEach((input, index) => {
      input.value = urlOtp[index] || "";
    });

    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    autoVerify(email, urlOtp);
  }

  // AUTO VERIFY OTP
  async function autoVerify(email, otp) {
    hideError();
    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/verify/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Email verified successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
        overLay.style.display = "flex";
        signupDialog.style.display = "none";
        signinDialog.style.display = "block";
        otpModal.style.display = "none";
        otpDialog.style.display = "none";

        signinDialog.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      } else {
        const errorMessage = data.description || data.message || "Verification failed!";
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
        console.log("Verification failed:", data, email, otp);
      }
    } catch (err) {
      console.error(err);
      showError("Network error — please try again later.");
    } finally {
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = "Verify OTP";
    }
  }

  // MANUAL SUBMIT OTP
  submitOtpBtn.addEventListener("click", async () => {
    hideError();
    const code = Array.from(otpInputs)
      .map((i) => i.value)
      .join("");
    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    const newEmail = localStorage.getItem("otp_email");
    if (!newEmail) {
      showError("Email not found. Cannot verify OTP.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
      return;
    }

    if (code.length !== 6) {
      showError("Please enter all 6 digits.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
      return;
    }

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/verify/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail, otp: code }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "Email verified successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
        overLay.style.display = "flex";
        signupDialog.style.display = "none";
        signinDialog.style.display = "block";
        otpModal.style.display = "none";
        otpDialog.style.display = "none";

        signinDialog.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        navIcons.classList.remove("open");
        navMenu.classList.remove("active");
        document.body.classList.add("hidden-overflow");
      } else {
        const errorMessage = data.description || data.message || "Otp verification failed!";
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
        submitOtpBtn.disabled = false;
        submitOtpBtn.textContent = originalText;
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
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });

  // RESEND OTP
  resendOtpBtn.addEventListener("click", async () => {
    hideError();
    const newEmail = localStorage.getItem("otp_email");
    if (!newEmail) {
      return showError("Email not found. Cannot resend OTP.");
    }

    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const response = await fetch(
        "https://api.stopreg.com/api/v1/auth/resend/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: newEmail }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "OTP resent successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      } else {
        const errorMessage = data.description || data.message || "OTP resend failed!";
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
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });
});
  

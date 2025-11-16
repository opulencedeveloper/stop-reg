document.addEventListener("DOMContentLoaded", () => {
  const otpModal = document.getElementById("otp-modal");
  const otpInputs = document.querySelectorAll(".otp-input");
  const description = document.querySelector(".otp-email");
  const submitOtpBtn = document.getElementById("submit-otp-btn");
  const resendOtpBtn = document.getElementById("resend-otp-btn");
  const otpCloseBtn = document.getElementById("otp-close-btn");
  const form = document.querySelector(".otp-inputs");

  let errorModal = document.createElement("div");
  errorModal.className = "error-modal";
  form.parentElement.appendChild(errorModal);

  otpCloseBtn.addEventListener("click", () => {
    otpModal.classList.add("fadeOut");

    otpModal.addEventListener(
      "animationend",
      function () {
        signinDialog.classList.remove("fadeOut");
        overLay.style.display = "none";
        document.body.classList.remove("hidden-overflow");
      },
      { once: true }
    );
  });

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

  document.getElementById("otp-close-btn").addEventListener("click", () => {
    document.getElementById("otp-dialog").style.display = "none";
    document.getElementById("overlay").classList.remove("active");
  });

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

  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email");

  const savedEmail = localStorage.getItem("otp_email");
  const email = urlEmail || savedEmail;
  let urlOtp = params.get("token");

  if (urlOtp) {
    urlOtp = urlOtp.replace(/"/g, "");
  }

  description.textContent = `${email}`;

  if (urlEmail && params.has("token") && urlOtp) {
    otpModal.style.display = "flex";

    autoFillOtpInputs(urlOtp);

    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    autoVerify(urlEmail, urlOtp);
  }
  function autoFillOtpInputs(otp) {
    otpInputs.forEach((input, index) => {
      input.value = otp[index] || "";
    });
  }

  async function autoVerify(email, otp) {
    hideError();

    try {
      console.log("verify", email, otp);
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/auth/verify/email",
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

        otpModal.style.display = "none";
        localStorage.removeItem("otp_email");
      } else {
        showError(data.description || data.message || "Verification failed!");
        console.log("data description", data, email, otp);
      }
    } catch (err) {
      console.error(err);
      showError("Network error — please try again later.");
    } finally {
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = "Verify OTP";
    }
  }

  // Manual submit OTP
  submitOtpBtn.addEventListener("click", async () => {
    hideError();
    let code = "";
    otpInputs.forEach((i) => (code += i.value));
    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    if (code.length !== 6) {
      showError("Please enter all 6 digits."), (submitOtpBtn.disabled = false);
      submitOtpBtn.textContent = originalText;
      return;
    }

    if (!email) {
      showError("Email not found. Cannot resend OTP.");

      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
      return;
    }

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/auth/verify/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp: code }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        iziToast.success({
          message: "Email verified successfully!",
          position: "topRight",
        });
        document.getElementById("otp-dialog").style.display = "none";
        document.getElementById("overlay").classList.remove("active");
        localStorage.removeItem("otp_email");
      } else {
        showError(data.description || data.message || "Otp verification failed!");
        submitOtpBtn.disabled = false;
        submitOtpBtn.textContent = originalText;
      }
    } catch (err) {
      console.error(err);
      showError(err || "Network error — please try again later.");
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });

  // Resend OTP
  resendOtpBtn.addEventListener("click", async () => {
    if (!email) {
      return showError("Email not found. Cannot resend OTP.");
    }

    const originalText = submitOtpBtn.textContent;
    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const response = await fetch(
        "https://api-stop-reg.onrender.com/api/v1/auth/resend/email",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      const data = await response.json();

      if (response.ok) {
        iziToast.success({
          message: "OTP resent successfully!",
          position: "topRight",
        });
      } else {
        showError(data.description || data.message || "Otp verification failed!");
      }
    } catch (err) {
      console.error(err);
      showError(err || "Network error — please try again later.");
    } finally {
      submitOtpBtn.disabled = false;
      submitOtpBtn.textContent = originalText;
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  // ===================
  //  GLOBAL SELECTORS
  // ===================
  const overLay = document.querySelector(".overlay");
  const otpModal = document.querySelector(".otp-modal");
  const otpInputs = document.querySelectorAll(".otp-input");
  const submitOtpBtn = document.getElementById("submit-otp-btn");
  const resendOtpBtn = document.getElementById("resend-otp-btn");
  const otpContainer = document.querySelector(".otp-container");
  const loginDialog = document.getElementById("signin-dialog");
  const signinDialog = document.getElementById("signin-dialog");
  const signupDialog = document.getElementById("signup-dialog");

  // otpContainer.scrollTo({
  //   top: 0,
  //   behavior: "smooth"
  // });

  // ===================
  //  GET URL PARAMS
  // ===================
  const params = new URLSearchParams(window.location.search);
  const urlEmail = params.get("email");
  const urlOtp = params.get("token");

  // =============================
  //  API BASE URL
  // =============================
  const API = "https://api.stopreg.com/api/v1";

  // =============================
  //  AUTO VERIFY FUNCTION
  // =============================
  async function autoVerify(email, otp) {
    try {
      const res = await fetch(`${API}/auth/verify/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        iziToast.success({
          message: "Email verified successfully!",
          position: "topRight",
        });

        setTimeout(() => {
          // Hide OTP modal
          otpModal.style.display = "none";
          document.body.classList.remove("hidden-overflow");

          // Show login modal
          overLay.style.display = "flex";
          signinDialog.style.display = "block"; // LOGIN MODAL
          signupDialog.style.display = "none"; // HIDE SIGNUP

          // Scroll login into view
          signinDialog.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 800);
      } else {
        if (submitOtpBtn) {
          submitOtpBtn.disabled = false;
          submitOtpBtn.innerHTML = "Verify OTP";
        }

        iziToast.error({
          message: data.description || "Invalid OTP",
          position: "topRight",
        });
      }
    } catch (err) {
      console.error(err);

      iziToast.error({
        message: "Network error. Please try again.",
        position: "topRight",
      });

      if (submitOtpBtn) {
        submitOtpBtn.disabled = false;
        submitOtpBtn.innerHTML = "Verify OTP";
      }
    }
  }

  // ====================================================
  //  IF LINK HAS ?email=&token= → AUTO OPEN OTP MODAL
  // ====================================================
  if (urlEmail && params.has("token") && urlOtp) {
    // Save email for manual verification & resend
    localStorage.setItem("otp_email", urlEmail);

    if (overLay) overLay.style.display = "none";
    if (otpModal) {
      otpModal.style.display = "flex";

      // 👇 FIX: scroll after it becomes visible
      setTimeout(() => {
        otpModal.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }, 50);
    }
    document.body.classList.add("hidden-overflow");

    // Autofill OTP digits
    otpInputs.forEach((input, index) => {
      input.value = urlOtp[index] || "";
    });

    if (submitOtpBtn) {
      submitOtpBtn.disabled = true;
      submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;
    }

    autoVerify(urlEmail, urlOtp);
  }

  // ======================
  //  RESEND OTP FUNCTION
  // ======================
  async function resendOtp() {
    const email = localStorage.getItem("otp_email");

    if (!email) {
      return iziToast.error({
        message: "Email not found. Restart signup.",
        position: "topRight",
      });
    }

    resendOtpBtn.disabled = true;
    resendOtpBtn.innerHTML = "Sending...";

    try {
      const res = await fetch(`${API}/auth/resend/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        iziToast.success({
          message: "OTP sent to your email!",
          position: "topRight",
        });
      } else {
        iziToast.error({
          message: data.description || "Failed to resend OTP",
          position: "topRight",
        });
      }
    } catch (err) {
      iziToast.error({
        message: "Network error. Try again later.",
        position: "topRight",
      });
    }

    resendOtpBtn.disabled = false;
    resendOtpBtn.innerHTML = "Resend OTP";
  }

  if (resendOtpBtn) {
    resendOtpBtn.addEventListener("click", resendOtp);
  }

  // =============================
  //  MANUAL OTP VERIFICATION
  // =============================
  async function verifyOtp() {
    const email = localStorage.getItem("otp_email");

    if (!email) {
      return iziToast.error({
        message: "Email not found. Restart signup.",
        position: "topRight",
      });
    }

    const otp = Array.from(otpInputs)
      .map((i) => i.value)
      .join("");

    if (otp.length !== 6) {
      return iziToast.error({
        message: "Enter all 6 OTP digits",
        position: "topRight",
      });
    }

    submitOtpBtn.disabled = true;
    submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

    try {
      const res = await fetch(`${API}/auth/verify/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();

      if (res.ok) {
        iziToast.success({
          message: "OTP verified!",
          position: "topRight",
        });

        setTimeout(() => {
          // Hide OTP modal
          otpModal.style.display = "none";
          document.body.classList.remove("hidden-overflow");

          // Show login modal
          overLay.style.display = "flex";
          signinDialog.style.display = "block"; // LOGIN MODAL
          signupDialog.style.display = "none"; // HIDE SIGNUP

          // Scroll login into view
          signinDialog.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 800);
      } else {
        iziToast.error({
          message: data.description || "Invalid OTP",
          position: "topRight",
        });

        submitOtpBtn.disabled = false;
        submitOtpBtn.innerHTML = "Verify OTP";
      }
    } catch (err) {
      iziToast.error({
        message: "Server error",
        position: "topRight",
      });

      submitOtpBtn.disabled = false;
      submitOtpBtn.innerHTML = "Verify OTP";
    }
  }

  if (submitOtpBtn) {
    submitOtpBtn.addEventListener("click", verifyOtp);
  }

  // =================================
  //  OTP INPUT AUTO-TAB BEHAVIOR
  // =================================
  otpInputs.forEach((input, index) => {
    input.addEventListener("input", () => {
      if (input.value.length === 1 && index < otpInputs.length - 1) {
        otpInputs[index + 1].focus();
      }
    });

    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !input.value && index > 0) {
        otpInputs[index - 1].focus();
      }
    });

    input.addEventListener("paste", (e) => {
      e.preventDefault();

      const paste = (e.clipboardData || window.clipboardData)
        .getData("text")
        .trim();
      const numbers = paste.replace(/\D/g, ""); // keep only digits

      if (numbers.length === 0) return;

      numbers.split("").forEach((num, i) => {
        if (index + i < otpInputs.length) {
          otpInputs[index + i].value = num;
        }
      });

      // Move focus to last filled input
      const lastIndex = Math.min(
        index + numbers.length - 1,
        otpInputs.length - 1
      );
      otpInputs[lastIndex].focus();
    });
  });


//   const otpModal = document.getElementById("otp-modal");

//   const otpInputs = document.querySelectorAll(".otp-input");
//   const submitOtpBtn = document.getElementById("submit-otp-btn");
//   const resendOtpBtn = document.getElementById("resend-otp-btn");
//   const otpCloseBtn = document.getElementById("otp-close-btn");
//   const formContainer = document.querySelector(".otp-inputs");
//   const overLay = document.getElementById("overlay");
//   const signinDialog = document.getElementById("signin-dialog");
//   const signupDialog = document.getElementById("signup-dialog");
//   const description = document.querySelector(".otp-email");

//   // Error modal
//   let errorModal = document.createElement("div");
//   errorModal.className = "error-modal";
//   formContainer.parentElement.appendChild(errorModal);

//   const errorIcon = `
//     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
//       <path d="M12 0C5.372 0 0 5.373 0 12c0 6.628 5.372 12 12 12s12-5.372 12-12C24 5.373 18.628 0 12 0zm1 17h-2v-2h2v2zm0-4h-2V7h2v6z"/>
//     </svg>
//   `;

//   function showError(message) {
//     errorModal.innerHTML = `${errorIcon}<span>${message}</span>`;
//     errorModal.style.display = "flex";
//   }

//   function hideError() {
//     errorModal.style.display = "none";
//   }

//   // RESET OTP MODAL
//   function resetOtpModal() {
//     otpInputs.forEach((input) => (input.value = ""));
//     localStorage.removeItem("otp_email");
//     otpModal.style.display = "none";

//     document.body.classList.remove("hidden-overflow");
//     hideError();
//     submitOtpBtn.disabled = false;
//     submitOtpBtn.textContent = "Verify OTP";
//     console.log("OTP modal closed — OTP cleared & email removed");
//   }

//   // Close OTP modal
//   otpCloseBtn.addEventListener("click", resetOtpModal);

//   if (otpCloseBtn) {
//     otpCloseBtn.addEventListener("click", () => {
//       otpModal.classList.add("fadeOut");

//       otpModal.addEventListener(
//         "animationend",
//         function () {
//           otpCloseBtn.classList.remove("fadeOut");
//           overLay.style.display = "none";
//           signupDialog.style.display = "none";
//           signinDialog.style.display = "none";
//           otpModal.style.display = "none";

//         },
//         { once: true }
//       );
//     });
//   }

//   // OTP input auto focus
//   otpInputs.forEach((input, index) => {
//     input.addEventListener("input", () => {
//       if (input.value.length === 1 && index < otpInputs.length - 1) {
//         otpInputs[index + 1].focus();
//       }
//     });
//     input.addEventListener("keydown", (e) => {
//       if (e.key === "Backspace" && input.value === "" && index > 0) {
//         otpInputs[index - 1].focus();
//       }
//     });
//   });

//   // Get email from URL or localStorage
//   const params = new URLSearchParams(window.location.search);
//   const urlEmail = params.get("email");
//   const savedEmail = localStorage.getItem("otp_email");
//   const email = savedEmail || urlEmail;
//   description.textContent = `${email}`;

//   const urlOtp = params.get("token")?.replace(/"/g, "");

//   // Auto-fill OTP if token exists
//   if (urlEmail && params.has("token") && urlOtp) {
//     overLay.style.display = "none";
//     otpModal.style.display = "flex";

//     document.body.classList.add("hidden-overflow");

//     otpInputs.forEach((input, index) => {
//       input.value = urlOtp[index] || "";
//     });

//     submitOtpBtn.disabled = true;
//     submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

//     autoVerify(email, urlOtp);
//   }

//   // AUTO VERIFY OTP
//   async function autoVerify(email, otp) {
//     hideError();
//     try {
//       const response = await fetch(
//         "https://api.stopreg.com/api/v1/auth/verify/email",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email, otp }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         iziToast.success({
//           message: "Email verified successfully!",
//           position: "topRight",
//         });
//         overLay.style.display = "flex";
//         signupDialog.style.display = "none";
//         signinDialog.style.display = "block";
//         otpModal.style.display = "none";

//         signinDialog.scrollIntoView({
//           behavior: "smooth",
//           block: "center",
//         });
//       } else {
//         showError(data.description || data.description || "Verification failed!");
//         console.log("Verification failed:", data, email, otp);
//       }
//     } catch (err) {
//       console.error(err);
//       showError("Network error — please try again later.");
//     } finally {
//       submitOtpBtn.disabled = false;
//       submitOtpBtn.textContent = "Verify OTP";
//     }
//   }

//   // MANUAL SUBMIT OTP
//   submitOtpBtn.addEventListener("click", async () => {
//     hideError();
//     const code = Array.from(otpInputs)
//       .map((i) => i.value)
//       .join("");
//     const originalText = submitOtpBtn.textContent;
//     submitOtpBtn.disabled = true;
//     submitOtpBtn.innerHTML = `<span class="btn-spinner"></span>`;

//     const newEmail = localStorage.getItem("otp_email");
//     if (!newEmail) {
//       showError("Email not found. Cannot verify OTP.");
//       submitOtpBtn.disabled = false;
//       submitOtpBtn.textContent = originalText;
//       return;
//     }

//     if (code.length !== 6) {
//       showError("Please enter all 6 digits.");
//       submitOtpBtn.disabled = false;
//       submitOtpBtn.textContent = originalText;
//       return;
//     }

//     try {
//       const response = await fetch(
//         "https://api.stopreg.com/api/v1/auth/verify/email",
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ email: newEmail, otp: code }),
//         }
//       );

//       const data = await response.json();

//       if (response.ok) {
//         iziToast.success({
//           message: "Email verified successfully!",
//           position: "topRight",
//         });
//         overLay.style.display = "flex";
//         signupDialog.style.display = "none";
//         signinDialog.style.display = "block";
//         otpModal.style.display = "none";

//         signinDialog.scrollIntoView({
//           behavior: "smooth",
//           block: "center",
//         });
//         classList.remove("open");
//         navMenu.classList.remove("active");
//         documennavIconst.body.classList.add("hidden-overflow");
//       } else {
//         showError(
//           data.description || data.message || "Otp verification failed!"
//         );
//         submitOtpBtn.disabled = false;
//         submitOtpBtn.textContent = originalText;
//       }
//     } catch (err) {
//       console.error(err);
//       showError("Network error — please try again later.");
//       submitOtpBtn.disabled = false;
//       submitOtpBtn.textContent = originalText;
//     }
//   });

//   // RESEND OTP
  resendOtpBtn.addEventListener("click", async () => {
    hideError();
    const newEmail = localStorage.getItem("otp_email");

    console.log("e", newEmail)
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


document.addEventListener("DOMContentLoaded", () => {
  // ===================
  //  CONSTANTS & CONFIG
  // ===================
  const API_BASE = "https://api-stop-reg.onrender.com/api/v1/auth";
  const SELECTORS = {
    otpModal: "#otp-modal",
    otpInputs: ".otp-input",
    submitBtn: "#submit-otp-btn",
    resendBtn: "#resend-otp-btn",
    closeBtn: "#otp-close-btn",
    emailDisplay: ".otp-email",
    overlay: "#overlay", // Main auth overlay if needed
  };

  // ===================
  //  STATE MANAGEMENT
  // ===================
  const elements = {
    modal: document.querySelector(SELECTORS.otpModal),
    inputs: document.querySelectorAll(SELECTORS.otpInputs),
    submitBtn: document.querySelector(SELECTORS.submitBtn),
    resendBtn: document.querySelector(SELECTORS.resendBtn),
    closeBtn: document.querySelector(SELECTORS.closeBtn),
    emailDisplay: document.querySelector(SELECTORS.emailDisplay),
    overlay: document.querySelector(SELECTORS.overlay),
  };

  // Helper: Safe UI Updates
  const ui = {
    setLoading: (isLoading, text = "Verify OTP") => {
      if (!elements.submitBtn) return;
      elements.submitBtn.disabled = isLoading;
      elements.submitBtn.innerHTML = isLoading 
        ? `<span class="stopreg-btn-spinner"></span> Verifying...` 
        : text;
    },
    setResendLoading: (isLoading) => {
      if (!elements.resendBtn) return;
      elements.resendBtn.style.pointerEvents = isLoading ? "none" : "auto";
      elements.resendBtn.style.opacity = isLoading ? "0.6" : "1";
      elements.resendBtn.textContent = isLoading ? "Sending..." : "Resend";
    },
    showError: (msg) => {
      if (typeof iziToast !== "undefined") {
        iziToast.error({ message: msg, position: "topRight" });
      } else {
        alert(msg); // Fallback
      }
    },
    showSuccess: (msg) => {
      if (typeof iziToast !== "undefined") {
        iziToast.success({ message: msg, position: "topRight" });
      }
    },
    openModal: (email) => {
      if (elements.modal) {
        elements.modal.style.display = "flex";
        // Trigger reflow
        void elements.modal.offsetWidth;
        elements.modal.classList.add("active");
        
        // Ensure focus trap or immediate focus
        setTimeout(() => elements.inputs[0]?.focus(), 100);
      }
      if (elements.emailDisplay) elements.emailDisplay.textContent = email;
      document.body.classList.add("hidden-overflow");
    },
    closeModal: () => {
        if (elements.modal) {
            elements.modal.classList.remove("active");
            setTimeout(() => {
                elements.modal.style.display = "none";
            }, 250); // Match fast exit transition
        }
        document.body.classList.remove("hidden-overflow");
    }
  };

  // ===================
  //  CORE LOGIC
  // ===================

  // ===================
  //  STATE CONTROL
  // ===================
  const views = {
    manual: document.getElementById("otp-view-manual"),
    verifying: document.getElementById("otp-view-verifying"),
    success: document.getElementById("otp-view-success"),
    failure: document.getElementById("otp-view-failure")
  };

  const stateElements = {
    successTimer: document.getElementById("redirect-timer"),
    proceedBtn: document.getElementById("proceed-login-btn"),
    retryBtn: document.getElementById("retry-verify-btn"),
    resendVerifyBtn: document.getElementById("resend-verify-btn"),
    errorMsg: document.getElementById("otp-error-msg")
  };

  let redirectInterval;

  function switchView(viewName) {
    Object.values(views).forEach(el => {
        if(el) {
            el.classList.remove("active");
            el.classList.add("hidden");
        }
    });

    if (views[viewName]) {
      views[viewName].classList.remove("hidden");
      views[viewName].classList.add("active");
    }
  }

  // ===================
  //  CORE LOGIC
  // ===================

  // 1. URL Parameter Handling (Secure & Auto-Verify)
  async function handleUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const urlEmail = params.get("email");
    const urlToken = params.get("token");

    if (urlEmail && urlToken) {
      console.log("🚀 Auto-verifying from URL...");
      
      // Security: Clear params immediately
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);

      // Defer API call until Entrance Overlay is gone
      const isOverlayActive = document.documentElement.classList.contains('overlay-active');
      
      const startVerification = () => {
          // Open UI in VERIFYING state
          ui.openModal(urlEmail);
          switchView("verifying");
          verifyOtp(urlEmail, urlToken, true);
      };

      if (isOverlayActive) {
          console.log("⏳ Waiting for Entrance Overlay...");
          window.addEventListener("entrance-complete", () => {
              console.log("✅ Overlay complete. Starting verification flow...");
              startVerification();
          }, { once: true });
      } else {
          // No overlay (or already finished), run immediately
          startVerification();
      }
    } else if (urlEmail) {
        // Case: Redirected from login (Verify Email) or Sign Up
        console.log("🚀 Manual verification prompt from URL...");
        
        // Save email context
        localStorage.setItem("otp_email", urlEmail);

        // Defer UI unti Overlay done
        const isOverlayActive = document.documentElement.classList.contains('overlay-active');
        
        const openManual = () => {
             ui.openModal(urlEmail);
             switchView("manual");
        };

        if (isOverlayActive) {
             window.addEventListener("entrance-complete", openManual, { once: true });
        } else {
             openManual();
        }
        
    } else {
        // Default to manual view if opened normally (and triggered by user action later)
        switchView("manual");
    }
  }

  async function verifyOtp(email, otp, isAuto = false) {
    if (!isAuto) ui.setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/verify/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (response.ok) {
        // SUCCESS STATE
        if (isAuto) {
            switchView("success");
            startRedirectCountdown();
        } else {
            ui.showSuccess("Email verified successfully!");
            setTimeout(() => {
                ui.closeModal();
                window.location.href = "/sign-in.html"; 
            }, 1000);
        }
      } else {
        throw new Error(data.description || data.message || "Invalid OTP");
      }
    } catch (error) {
      console.error("Verification failed:", error);
      
      if (isAuto) {
          // FAILURE STATE
          if (stateElements.errorMsg) stateElements.errorMsg.textContent = error.message;
          switchView("failure");
      } else {
          ui.showError(error.message);
      }
    } finally {
      if (!isAuto) ui.setLoading(false);
    }
  }

  function startRedirectCountdown() {
      let seconds = 5;
      if (stateElements.successTimer) stateElements.successTimer.textContent = seconds;

      clearInterval(redirectInterval);
      redirectInterval = setInterval(() => {
          seconds--;
          if (stateElements.successTimer) stateElements.successTimer.textContent = seconds;
          if (seconds <= 0) {
              clearInterval(redirectInterval);
              window.location.href = "/sign-in.html";
          }
      }, 1000);
  }

  async function resendOtp() {
    const email = localStorage.getItem("otp_email");
    if (!email) return ui.showError("No email found. Please sign up again.");

    // Handle button state safely
    const btns = [
        { el: elements.resendBtn, original: "Resend" },
        { el: stateElements.resendVerifyBtn, original: "Resend OTP" }
    ];
    
    btns.forEach(b => { 
        if(b.el) {
            b.el.textContent = "Sending..."; 
            b.el.style.opacity = "0.7";
            b.el.style.pointerEvents = "none";
        } 
    });

    try {
      const response = await fetch(`${API_BASE}/resend/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      
      if (response.ok) {
        ui.showSuccess("New code sent!");
        switchView("manual");
      } else {
        const data = await response.json();
        throw new Error(data.description || "Failed to resend");
      }
    } catch (error) {
       ui.showError(error.message);
    } finally {
       btns.forEach(b => { 
           if(b.el) {
               b.el.textContent = b.original; 
               b.el.style.opacity = "1";
               b.el.style.pointerEvents = "auto";
            } 
       });
    }
  }

  // ===================
  //  EVENT LISTENERS
  // ===================

  // Submit Button
  if (elements.submitBtn) {
    elements.submitBtn.addEventListener("click", () => {
      const email = localStorage.getItem("otp_email");
      const otp = Array.from(elements.inputs).map(i => i.value).join("");
      
      if (!email) return ui.showError("Session expired. Please sign up again.");
      if (otp.length < 6) return ui.showError("Please enter the full 6-digit code.");

      verifyOtp(email, otp, false);
    });
  }

  // Resend Buttons (Both Manual and Failure View)
  if (elements.resendBtn) elements.resendBtn.addEventListener("click", resendOtp);
  if (stateElements.resendVerifyBtn) stateElements.resendVerifyBtn.addEventListener("click", resendOtp);

  // Close Button
  if (elements.closeBtn) elements.closeBtn.addEventListener("click", ui.closeModal);
  
  // Proceed Button
  if (stateElements.proceedBtn) {
      stateElements.proceedBtn.addEventListener("click", () => {
          clearInterval(redirectInterval);
          window.location.href = "/sign-in.html";
      });
  }

  // Retry Button
  if (stateElements.retryBtn) {
      stateElements.retryBtn.addEventListener("click", () => {
           // Retry with stored email and whatever token we had? 
           // Ideally we'd need the token again, but we cleared params. 
           // Actually, if param verification failed, we can't really "retry" the same invalid token.
           // BUT if it was a network error, we could using the inputs? 
           // Since we don't store the token if it fails (security), retry usually implies "try again" 
           // effectively forcing them to manual or resend. 
           // Use case: Network glitch. 
           // Strategy: We can't retry the token if we wiped active memory. 
           // Better UX: Switch to Manual View so they can check their email again.
           switchView("manual");
      });
  }

  // Input UX (Focus, Paste, Backspace)
  elements.inputs.forEach((input, index) => {
    // Number only restriction
    input.addEventListener("input", (e) => {
      e.target.value = e.target.value.replace(/[^0-9]/g, '');
      
      if (e.target.value.length === 1 && index < elements.inputs.length - 1) {
        elements.inputs[index + 1].focus();
      }
    });

    // Backspace navigation
    input.addEventListener("keydown", (e) => {
      if (e.key === "Backspace" && !e.target.value && index > 0) {
        elements.inputs[index - 1].focus();
      }
    });

    // Global Paste Support
    input.addEventListener("paste", (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData("text").replace(/[^0-9]/g, '');
      const chars = text.split("");
      
      elements.inputs.forEach((inp, i) => {
        if (chars[i]) {
            inp.value = chars[i];
            // Trigger input event for any other listeners
            inp.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });

      // Focus last filled
      const lastIdx = Math.min(chars.length - 1, elements.inputs.length - 1);
      if (elements.inputs[lastIdx]) elements.inputs[lastIdx].focus();
      
      // Auto-submit if full length?
      if (text.length === 6) elements.submitBtn.click();
    });
  });

  // Init
  handleUrlParams();
});

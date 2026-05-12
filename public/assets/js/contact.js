document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form") || document.querySelector(".form-wrapper form");
  const submitBtn = document.getElementById("cnt-btn");
  
  if (!form || !submitBtn) return;

  const nameInput = document.getElementById("name");
  const emailInput = document.getElementById("email");
  const messageInput = document.getElementById("message");
  const turnstileWidget = document.getElementById("turnstile-widget");

  const API_URL = "https://api.stopreg.com/api/v1/contact/us";

  // -------------------------------------------------------------------------
  // 1. Turnstile Setup (Industrial Pattern)
  // -------------------------------------------------------------------------

  let turnstileToken = null;
  let turnstileWidgetId = null;

  function initTurnstile() {
    if (!window.turnstile || !turnstileWidget) return;

    const siteKey = turnstileWidget.getAttribute("data-sitekey") || "0x4AAAAAACEca11RLVJeokxF";

    // Render Widget
    turnstileWidgetId = window.turnstile.render(turnstileWidget, {
      sitekey: siteKey,
      callback: function(token) {
        turnstileToken = token;
      },
      'error-callback': function() {
        turnstileToken = null;
      },
      'expired-callback': function() {
        turnstileToken = null;
      }
    });
  }

  // Wait for Turnstile load
  if (window.turnstile) {
    initTurnstile();
  } else {
    window.addEventListener('load', () => setTimeout(initTurnstile, 100));
  }

  // -------------------------------------------------------------------------
  // 2. Helper Functions (UX & Feedback)
  // -------------------------------------------------------------------------

  function showNotification(message, type = "info") {
    if (window.iziToast) {
       const config = { message, position: "topRight", timeout: 5000 };
       if (type === "success") return window.iziToast.success({ ...config, title: "Success" });
       if (type === "error") return window.iziToast.error({ ...config, title: "Error" });
       return window.iziToast.info(config);
    }
    alert(message);
  }

  function validateForm() {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || name.length < 2) {
      showNotification("Please enter a valid name.", "error");
      nameInput.focus();
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showNotification("Please enter a valid email address.", "error");
      emailInput.focus();
      return false;
    }

    if (!message || message.length < 10) {
      showNotification("Please enter a message (min 10 characters).", "error");
      messageInput.focus();
      return false;
    }

    if (!turnstileToken) {
      showNotification("Please complete the captcha verification.", "error");
      return false;
    }

    return true;
  }

  // -------------------------------------------------------------------------
  // 3. Submission Logic
  // -------------------------------------------------------------------------

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    // UI Loading State
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.style.cursor = "not-allowed";
    submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Sending...`;

    try {
      const payload = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim(),
        turnstileToken: turnstileToken
      };

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.description || data.message || "Failed to send message.");
      }

      showNotification("Message sent successfully!", "success");
      form.reset();

      // Reset Turnstile on success
      turnstileToken = null;
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }

    } catch (err) {
      console.error("Submission Error:", err);
      
      const msg = err.message === "Failed to fetch" 
        ? "Network error. Please check your connection."
        : (err.message || "An unexpected error occurred.");
        
      showNotification(msg, "error");

      // Reset Turnstile on error so user can try again
      turnstileToken = null;
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.style.cursor = "pointer";
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM Content Loaded - Contact form script starting");
  
  // Wait a bit to ensure all elements are ready
  setTimeout(() => {
    const form = document.getElementById("contact-form") || document.querySelector(".form-wrapper form");
    const submitBtn = document.getElementById("cnt-btn");
    // Scope inputs to the contact form so we don't accidentally grab
    // the auth modal inputs that share the same IDs.
    const nameInput =
      (form && form.querySelector('input[name="name"]')) ||
      document.querySelector('#contact-form input[name="name"]') ||
      document.getElementById("name");
    const emailInput =
      (form && form.querySelector('input[name="email"]')) ||
      document.querySelector('#contact-form input[name="email"]') ||
      document.getElementById("email");
    const messageInput =
      (form && form.querySelector('textarea[name="message"]')) ||
      document.querySelector('#contact-form textarea[name="message"]') ||
      document.getElementById("message");

    console.log("Elements found:", { 
      form: !!form, 
      submitBtn: !!submitBtn, 
      nameInput: !!nameInput, 
      emailInput: !!emailInput, 
      messageInput: !!messageInput 
    });

    if (!form || !submitBtn || !nameInput || !emailInput || !messageInput) {
      console.error("Contact form elements not found:", { form, submitBtn, nameInput, emailInput, messageInput });
      return;
    }

    console.log("Contact form initialized successfully");

    const API_URL = "https://api-stop-reg.onrender.com/api/v1/contact/us";

    // Store Turnstile token and widget ID
    let turnstileToken = null;
    let turnstileWidgetId = null;

    // Show notification using iziToast or fallback
    function showNotification(message, type = "success") {
      if (typeof iziToast !== "undefined") {
        iziToast[type]({
          title: type === "success" ? "Success" : "Error",
          message: message,
          position: "topRight",
          timeout: 5000,
        });
      } else {
        alert(message);
      }
    }

    // Validate form fields
    function validateForm() {
      const name = (nameInput && typeof nameInput.value === "string" ? nameInput.value : "").trim();
      const email = (emailInput && typeof emailInput.value === "string" ? emailInput.value : "").trim();
      const message = (messageInput && typeof messageInput.value === "string" ? messageInput.value : "").trim();

      if (!name) {
        showNotification("Please enter your name.", "error");
        if (nameInput && typeof nameInput.focus === "function") {
          nameInput.focus();
        }
        return false;
      }

      if (name.length < 2) {
        showNotification("Name must be at least 2 characters long.", "error");
        nameInput.focus();
        return false;
      }

      if (!email) {
        showNotification("Please enter your email address.", "error");
        if (emailInput && typeof emailInput.focus === "function") {
          emailInput.focus();
        }
        return false;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        showNotification("Please enter a valid email address.", "error");
        emailInput.focus();
        return false;
      }

      if (!message) {
        showNotification("Please enter your message.", "error");
        if (messageInput && typeof messageInput.focus === "function") {
          messageInput.focus();
        }
        return false;
      }

      if (message.length < 10) {
        showNotification("Message must be at least 10 characters long.", "error");
        messageInput.focus();
        return false;
      }

      // Check if Turnstile widget exists and is configured
      const turnstileWidget = document.getElementById("turnstile-widget");
      const siteKey = turnstileWidget?.getAttribute("data-sitekey");
      const isTurnstileConfigured = siteKey && siteKey !== "YOUR_TURNSTILE_SITE_KEY";

      if (isTurnstileConfigured && !turnstileToken) {
        showNotification("Please complete the captcha verification.", "error");
        return false;
      }

      return true;
    }

    // Initialize Turnstile widget
    function initTurnstile() {
      const widgetElement = document.getElementById("turnstile-widget");
      if (!widgetElement || !window.turnstile) return;

      const siteKey = widgetElement.getAttribute("data-sitekey");
      if (!siteKey || siteKey === "YOUR_TURNSTILE_SITE_KEY") {
        console.warn(
          "Turnstile site key not configured. Please set YOUR_TURNSTILE_SITE_KEY in contact.html"
        );
        return;
      }

      turnstileWidgetId = window.turnstile.render(widgetElement, {
        sitekey: siteKey,
        callback: function (token) {
          turnstileToken = token;
        },
        "error-callback": function () {
          turnstileToken = null;
        },
        "expired-callback": function () {
          turnstileToken = null;
        },
      });
    }

    // Wait for Turnstile script to load
    if (window.turnstile) {
      initTurnstile();
    } else {
      window.addEventListener("load", () => {
        setTimeout(initTurnstile, 100);
      });
    }

    // Handle form submission function
    async function handleSubmit(e) {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
      console.log("Submit handler called!");
      
      if (!validateForm()) {
        console.log("Form validation failed");
        return;
      }
      
      console.log("Form validation passed, proceeding with submission");

      const formData = {
        name: nameInput.value.trim(),
        email: emailInput.value.trim(),
        message: messageInput.value.trim(),
      };

      // Only include turnstileToken if it exists
      if (turnstileToken) {
        formData.turnstileToken = turnstileToken;
      }

      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="btn-spinner"></span> Sending...`;

      try {
        console.log("Sending request to:", API_URL);
        console.log("Form data:", formData);
        
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        });

        console.log("Response received:", response.status, response.statusText);

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          const errorMsg =
            data.description || "Failed to send message. Please try again.";
          showNotification(errorMsg, "error");
          return;
        }

        // Success
        showNotification(
          "Thank you! Your message has been sent successfully. We'll get back to you soon.",
          "success"
        );

        // Reset form
        form.reset();
        turnstileToken = null;
        if (window.turnstile && turnstileWidgetId !== null) {
          window.turnstile.reset(turnstileWidgetId);
        }
      } catch (err) {
        console.error("Contact form error:", err);
        showNotification(
          "Network error. Please check your connection and try again.",
          "error"
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    }

    // Handle form submission (button is now type="submit")
    form.addEventListener("submit", function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("Form submit event triggered");
      handleSubmit(e);
    });
    console.log("Form submit listener attached");
  }, 100); // Small delay to ensure DOM is ready
});

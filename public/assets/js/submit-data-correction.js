/**
 * This script handles the Data Correction Form submission,
 * including client-side validation, Cloudflare Turnstile integration,
 * and API interactions tailored to the user's high-fidelity standard.
 */

document.addEventListener("DOMContentLoaded", () => {
  const correctionForm = document.getElementById("data-correction-form");
  const domainInput = document.getElementById("domain");
  const emailInput = document.getElementById("email");
  const commentInput = document.getElementById("comment");
  const submitBtn = document.getElementById("submit-btn");

  const turnstileWidgetElement = document.getElementById("turnstile-widget");
  const turnstileErrorElement = document.getElementById("turnstile-error");

  let turnstileWidgetId = null;

  // Initialize Turnstile Explicitly
  const renderTurnstile = () => {
    if (!window.turnstile || !turnstileWidgetElement) return;
    
    turnstileWidgetId = window.turnstile.render(turnstileWidgetElement, {
      sitekey: "0x4AAAAAACEca11RLVJeokxF",
      callback: function (token) {
        clearInputError(turnstileWidgetElement);
      },
      "error-callback": function () {
        // Silently set token to null; Cloudflare handles visual errors inside its own iframe
        // This matches the behavior in index.html and prevents duplicate visual errors.
      },
    });
  };

  // Wait for Turnstile load
  if (window.turnstile) {
    renderTurnstile();
  } else {
    window.addEventListener('load', () => setTimeout(renderTurnstile, 100));
  }

  // Highlight Input Errors (Animated login.js style)
  function showInputError(inputEl, message) {
    let parent = inputEl.parentElement;

    let error = parent.querySelector(".custom-input-error");
    if (!error) {
      error = document.createElement("div");
      error.className = "custom-input-error";
      parent.appendChild(error);
    }
    
    if (error.textContent !== message || error.style.display === 'none') {
        error.textContent = message;
        
        if (inputEl.classList && inputEl.id !== 'turnstile-widget') {
            inputEl.classList.add("input-error-border");
        }
        
        // CSS Animation reflow trigger
        error.style.display = 'block';
        error.style.animation = 'none';
        error.offsetHeight; 
        error.style.animation = null; 
    }
  }

  // Clear Input Errors
  function clearInputError(inputEl) {
    let parent = inputEl.parentElement;
    const error = parent.querySelector(".custom-input-error");
    if (error) {
      error.remove();
    }
    if (inputEl.classList) {
      inputEl.classList.remove("input-error-border");
    }
  }

  // Real-time Validation Setup
  [domainInput, emailInput, commentInput].forEach((input) => {
    input.addEventListener("input", function () {
      clearInputError(this);
    });
  });

  // Main Submit Handler
  correctionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Clear previous general error
    const prevGeneralError = document.getElementById("general-error");
    if (prevGeneralError) prevGeneralError.remove();

    let hasError = false;

    // Validate Domain
    const domainVal = domainInput.value.trim();
    if (!domainVal || domainVal.length < 3) {
      showInputError(domainInput, "Please enter a valid domain.");
      hasError = true;
    }

    // Validate Email
    const emailVal = emailInput.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailVal || !emailRegex.test(emailVal)) {
      showInputError(emailInput, "Please provide a valid email address.");
      hasError = true;
    }

    // Validate Comment
    const commentVal = commentInput.value.trim();
    if (!commentVal || commentVal.length < 10) {
      showInputError(commentInput, "Comment must be at least 10 characters long so we have context.");
      hasError = true;
    }

    // Validate Turnstile
    let turnstileToken = "";
    if (turnstileWidgetId !== null && window.turnstile) {
      turnstileToken = window.turnstile.getResponse(turnstileWidgetId);
    }

    if (!turnstileToken) {
      showInputError(turnstileWidgetElement, "Please verify you are human.");
      hasError = true;
    }

    if (hasError) return;

    // Proceed to Submit
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Submitting...`;
    submitBtn.disabled = true;

    try {
      const response = await fetch(`http://localhost:8080/api/v1/data-correction`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          domain: domainVal,
          email: emailVal,
          comment: commentVal,
          turnstileToken: turnstileToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.description || "Submission failed");
      }

      // High-performance 60fps fade transition to Swap Form -> Success UI
      const formContainer = document.querySelector(".submit-correction-form-container");
      
      // Hardware accelerated fade out
      formContainer.style.transition = 'opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';
      formContainer.style.opacity = '0';
      formContainer.style.transform = 'translateY(10px) scale(0.98)';

      setTimeout(() => {
        formContainer.innerHTML = `
          <div style="text-align: center; padding: 40px 20px;">
            <div style="margin-bottom: 24px;">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto; display: block;">
                  <circle cx="32" cy="32" r="32" fill="#ECFDF3"/>
                  <path d="M22 33L29 40L42 24" stroke="#027A48" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h2 style="color: #101828; margin-bottom: 12px; font-family: 'Inter_18pt-Bold', sans-serif; font-size: 24px;">Correction Submitted</h2>
            <p style="color: #475467; line-height: 1.6; font-family: 'Inter_28pt-Regular', sans-serif; font-size: 16px;">Thank you for helping us maintain data accuracy. Our team will review the domain <strong>${domainVal}</strong> shortly.</p>
            <button onclick="window.location.reload()" class="submit-btn" style="margin-top: 32px; width: 100%;">Submit Another</button>
          </div>
        `;
        
        // Prepare for entry
        formContainer.style.transform = 'translateY(-10px) scale(0.98)';
        
        // Force browser layout repaint
        void formContainer.offsetWidth;

        // Hardware accelerated fade in
        formContainer.style.opacity = '1';
        formContainer.style.transform = 'translateY(0) scale(1)';
      }, 300);

    } catch (error) {
      console.error("Data Correction Error:", error);
      
      // We reset Turnstile so the user can easily try again
      if (turnstileWidgetId !== null && window.turnstile) {
        window.turnstile.reset(turnstileWidgetId);
      }

      // Display overall error at the top
      const generalError = document.createElement("div");
      generalError.id = "general-error";
      generalError.style.color = "#ff3333";
      generalError.style.marginBottom = "20px";
      generalError.style.padding = "10px";
      generalError.style.backgroundColor = "#ffe6e6";
      generalError.style.borderRadius = "4px";
      generalError.textContent = error.message.includes("fetch") 
        ? "Network error. Please check your connection."
        : error.message;

      correctionForm.insertBefore(generalError, correctionForm.firstChild);

      // Reset button state
      submitBtn.innerHTML = originalBtnText;
      submitBtn.disabled = false;
    }
  });

});

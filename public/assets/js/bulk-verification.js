// Script used on verify-email.html to check if an email is disposable

document.addEventListener("DOMContentLoaded", () => {
  // Form and elements on verify-email.html
  const form = document.querySelector(".verifyEmail-hero form");
  if (!form) return;

  const emailInput = form.querySelector("#email");
  const submitBtn = form.querySelector(".bulk-verify-domain-btn");

  // Create a result element if not present
  let resultEl = document.getElementById("verify-email-result");
  if (!resultEl) {
    resultEl = document.createElement("p");
    resultEl.id = "verify-email-result";
    resultEl.className = "verify-email-result";
    resultEl.style.marginTop = "12px";
    resultEl.style.fontSize = "0.95rem";
    resultEl.style.fontWeight = "500";
    form.parentNode.appendChild(resultEl);
  }

  const API_URL = "https://api.stopreg.com/api/v1/check/public";

  function showResult(message, type = "info") {
    // If iziToast is available, use it for nicer UI
    if (window.iziToast) {
      const config = {
        message,
        position: "topRight",
      };

      if (type === "success") return window.iziToast.success(config);
      if (type === "error") return window.iziToast.error(config);
      return window.iziToast.info(config);
    }

    // Fallback: simple text below the form
    resultEl.textContent = message;
    resultEl.style.color =
      type === "success" ? "#16a34a" : type === "error" ? "#dc2626" : "#0f172a";
  }

  // Store Turnstile token and widget ID
  let turnstileToken = null;
  let turnstileWidgetId = null;
  
  // Initialize Turnstile widget
  function initTurnstile() {
    const widgetElement = document.getElementById('turnstile-widget');
    if (!widgetElement || !window.turnstile) return;

    const siteKey = widgetElement.getAttribute('data-sitekey');
    // Only treat as misconfigured if the site key is missing.
    // Your production key (e.g. 0x4AAAAAACEca11RLVJeokxF) should be allowed.
    if (!siteKey) {
      console.warn('Turnstile site key not configured. Please set SITE KEY in verify-email.html');
      return;
    }

    turnstileWidgetId = window.turnstile.render(widgetElement, {
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

  // Wait for Turnstile script to load
  if (window.turnstile) {
    initTurnstile();
  } else {
    window.addEventListener('load', () => {
      // Wait a bit for Turnstile script to initialize
      setTimeout(initTurnstile, 100);
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    console.log(" email",  email)
    if (!email) {
      showResult("Please enter an email address.", "error");
      return;
    }

    // Check if Turnstile token is available
    if (!turnstileToken) {
      showResult("Please complete the captcha verification.", "error");
      return;
    }

    // Clear previous results
    const resultContainer = document.getElementById("verify-email-result-container");
    if (resultContainer) {
      resultContainer.style.display = "none";
      resultContainer.innerHTML = "";
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<span class="btn-spinner"></span> Checking...`;

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email,
          turnstileToken 
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const msg =
          data?.description ||
          data?.message ||
          "Unable to verify email at the moment.";
        showResult(msg, "error");
        return;
      }

      const responseData = data?.data;
      const disposableEmail = responseData?.disposableEmail;
      
      // Handle null or undefined data
      if (responseData === null || responseData === undefined || disposableEmail === undefined) {
        showResult("No verification data available for this email.", "error");
        
        const resultContainer = document.getElementById("verify-email-result-container");
        if (resultContainer) {
          resultContainer.style.display = "flex";
          resultContainer.innerHTML = `
            <h4 class="disposal-result-title" style="color: var(--tertiary-color);">
              No Data Available
            </h4>
            <div class="disposal-result-inner-cont result-false">
              <div class="disposal-result">
                <div class="disposable-result-cont">
                  <h3 class="disposal-result-head">Verification Result</h3>
                  <p class="disposal-result-para">
                    Unable to retrieve verification data for this email address. The API response did not contain any data.
                  </p>
                </div>
                <p class="disposal-result-bolean">N/A</p>
              </div>
            </div>
          `;
        }
        return;
      }

      // Determine if email is disposable:
      // - If disposableEmail is an object { domain, provider, mx_record, public_email_provider } → email IS disposable
      // - If disposableEmail is false → email is NOT disposable
      const isDisposable = disposableEmail !== false && disposableEmail !== null && typeof disposableEmail === 'object';
      
      // Extract data from disposableEmail object if it exists
      // When disposableEmail is false, we don't have additional data (mx_record, public_email_provider, etc.)
      const emailData = isDisposable ? disposableEmail : {};
      const hasMxRecord = emailData.mx_record !== null && emailData.mx_record !== undefined && emailData.mx_record !== '';
      const isPublicProvider = !!emailData.public_email_provider;
      const hasEmailData = isDisposable && Object.keys(emailData).length > 0;

      // Display toast notification
      if (isDisposable) {
        showResult(
          "This email address is disposable and may not be accepted.",
          "error"
        );
      } else {
        showResult("This email address is not disposable.", "success");
      }

      // Display detailed results in UI
      const resultContainer = document.getElementById("verify-email-result-container");
      if (resultContainer) {
        resultContainer.style.display = "flex";
        
        // Main heading based on disposable status - matching the design exactly
        const mainHeading = `The email provided <b>${email}</b> ${
          isDisposable ? "is" : "is not"
        } a verified disposable email`;
        
        // Determine YES/NO status for each field
        const mxRecordStatus = hasMxRecord ? "YES" : "NO";
        // For Disposable:
        // When email IS disposable (disposableEmail is object): disposableStatus = "YES" (GREEN)
        // When email is NOT disposable (disposableEmail === false): disposableStatus = "NO" (RED)
        const disposableStatus = isDisposable ? "YES" : "NO";
        const publicProviderStatus = isPublicProvider ? "YES" : "NO";

        // Apply dynamic classes - green for YES (default), red for NO (result-false)
        const mxRecordClass = mxRecordStatus === "YES" 
          ? "disposal-result-inner-cont" 
          : "disposal-result-inner-cont result-false";
        
        // Container color logic:
        // - If object found (email IS disposable) → GREEN container
        // - If false (email is NOT disposable) → RED container
        const disposableClass = isDisposable 
          ? "disposal-result-inner-cont" 
          : "disposal-result-inner-cont result-false";
        
        const publicProviderClass = publicProviderStatus === "YES" 
          ? "disposal-result-inner-cont" 
          : "disposal-result-inner-cont result-false";

        let resultHTML = `
          <h4 class="disposal-result-title">
            ${mainHeading}
          </h4>

          ${hasEmailData ? `
          <div class="${mxRecordClass}">
            <div class="disposal-result">
              <div class="disposable-result-cont">
                <h3 class="disposal-result-head">Max Record</h3>
                <p class="disposal-result-para">
                  ${mxRecordStatus === "YES" 
                    ? "This domain has MX record. This means that it has a mail server and is able to receive emails"
                    : "This domain does not have MX record"}
                </p>
              </div>
              <p class="disposal-result-bolean">${mxRecordStatus}</p>
            </div>
          </div>
          ` : ''}

          <div class="${disposableClass}">
            <div class="disposal-result">
              <div class="disposable-result-cont">
                <h3 class="disposal-result-head">Disposable</h3>
                <p class="disposal-result-para">
                  ${disposableStatus === "YES" 
                    ? "This domain appears to be from a disposable email provider"
                    : "This domain does not appear to be from a disposable email provider"}
                </p>
              </div>
              <p class="disposal-result-bolean">${disposableStatus}</p>
            </div>
          </div>

          ${hasEmailData ? `
          <div class="${publicProviderClass}">
            <div class="disposal-result">
              <div class="disposable-result-cont">
                <h3 class="disposal-result-head">Public email provider</h3>
                <p class="disposal-result-para">
                  ${publicProviderStatus === "YES" 
                    ? "This domain is from a public email provider. This means that anyone can generate emails from this domain for free"
                    : "This domain is not from a public email provider"}
                </p>
              </div>
              <p class="disposal-result-bolean">${publicProviderStatus}</p>
            </div>
          </div>
          ` : ''}
        `;

        resultContainer.innerHTML = resultHTML;
      }

      // Reset Turnstile token after successful check
      turnstileToken = null;
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } catch (err) {
      console.error(err);
      showResult("Network error while checking email. Please try again.", "error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});



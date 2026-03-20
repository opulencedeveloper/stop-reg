// Script used on index.html (Live API Demo) and verify-email.html to check if an email/domain is disposable

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------------------------------------------------
  // 1. Identify which page/form we are on
  // -------------------------------------------------------------------------
  
  // Landing Page Elements (index.html)
  const landingForm = document.querySelector(".hero-sect-two");
  
  // Verify Email Page Elements (verify-email.html / check-disposable-email.html)
  const verifyPageForm = document.querySelector(".verifyEmail-hero form");
  
  // If neither form exists, exit
  if (!landingForm && !verifyPageForm) return;

  // Set active context variables based on which form is found
  let form, input, submitBtn, resultContainer, turnstileContainerSelector;
  let isLandingPage = false;
  let isCheckPage = false;

  if (landingForm) {
    isLandingPage = true;
    form = landingForm;
    input = form.querySelector(".api-live-demo-input");
    submitBtn = form.querySelector(".api-live-demo-btn");
    resultContainer = form.querySelector(".api-live-demo-result-cont");
    turnstileContainerSelector = ".api-live-demo-cloudflaire-cont";
  } else {
    isCheckPage = window.location.pathname.includes('check-disposable-email.html');
    form = verifyPageForm;
    input = form.querySelector("#email");
    submitBtn = form.querySelector(".bulk-verify-domain-btn");
    resultContainer = isCheckPage 
        ? document.getElementById("verify-email-result-section")
        : document.getElementById("verify-email-result-container");
    turnstileContainerSelector = "#captcha-container"; // or look for #turnstile-widget directly
  }

  const API_URL = "http://localhost:8080/api/v1/check/public";

  // -------------------------------------------------------------------------
  // 2. Helper Functions (Domain Extraction & Validation)
  // -------------------------------------------------------------------------

  function extractDomain(inputVal) {
    let cleaned = inputVal.trim();
    cleaned = cleaned.replace(/^https?:\/\//i, '');
    cleaned = cleaned.replace(/^ftp:\/\//i, '');
    cleaned = cleaned.replace(/^www\./i, '');
    cleaned = cleaned.split('/')[0];
    cleaned = cleaned.split(':')[0];
    cleaned = cleaned.split('?')[0];
    cleaned = cleaned.split('#')[0];
    return cleaned.trim();
  }

  function isValidEmailOrDomain(inputVal) {
    const trimmed = inputVal.trim();
    if (!trimmed) return false;
    // Simple regex for basic validation
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    
    if (emailPattern.test(trimmed)) return true;
    
    const extracted = extractDomain(trimmed);
    if (extracted && extracted.length > 0 && domainPattern.test(extracted)) return true;
    
    return false;
  }

  function showToast(message, type = "info") {
    if (window.iziToast) {
       const config = { message, position: "topRight" };
       if (type === "success") return window.iziToast.success(config);
       if (type === "error") return window.iziToast.error(config);
       return window.iziToast.info(config);
    }
    // Fallback if no toast library
    alert(message);
  }

  function syntaxHighlight(json) {
    if (typeof json != 'string') {
      json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
      let cls = 'json-number';
      if (/^"/.test(match)) {
        if (/:$/.test(match)) {
          cls = 'json-key';
        } else {
          cls = 'json-string';
        }
      } else if (/true|false/.test(match)) {
        cls = 'json-boolean';
      } else if (/null/.test(match)) {
        cls = 'json-null';
      }
      return '<span class="' + cls + '">' + match + '</span>';
    });
  }

  // -------------------------------------------------------------------------
  // 3. Turnstile Setup
  // -------------------------------------------------------------------------

  let turnstileToken = null;
  let turnstileWidgetId = null;

  function initTurnstile() {
    if (!window.turnstile) return;

    let widgetTarget = null;
    let siteKey = "0x4AAAAAACEca11RLVJeokxF"; // Default/Hardcoded site key

    if (isLandingPage) {
        // Render directly into the container
        widgetTarget = document.querySelector(turnstileContainerSelector);
    } else {
        // For verify-email.html, it expects #turnstile-widget
        widgetTarget = document.getElementById("turnstile-widget");
        // It might have data-sitekey attribute
        if (widgetTarget && widgetTarget.hasAttribute("data-sitekey")) {
            siteKey = widgetTarget.getAttribute("data-sitekey");
        }
    }

    if (!widgetTarget) return;

    // Render Widget
    turnstileWidgetId = window.turnstile.render(widgetTarget, {
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
  // 4. Form Submission Logic
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // 4. Input Validation Helpers (Ported from login.js)
  // -------------------------------------------------------------------------

  function showInputError(inputEl, message) {
    const parent = inputEl.parentElement; // .api-live-demo-row
    let error;

    if (isLandingPage) {
        error = form.querySelector(".custom-input-error");
        // If not found, create it
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            // Insert after the row
            parent.after(error);
        }
    } else {
        error = parent.querySelector(".custom-input-error");
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            parent.appendChild(error);
        }
    }

    // Always update text and ensure visuals
    if (error.textContent !== message) {
        error.textContent = message;
        // Trigger animation reset
        error.style.animation = 'none';
        error.offsetHeight; /* trigger reflow */
        error.style.animation = null;
    }
    
    inputEl.classList.add("input-error-border");
  }

  function clearInputError(inputEl) {
    inputEl.classList.remove("input-error-border");
    
    let error;
    if (isLandingPage) {
        error = form.querySelector(".custom-input-error");
    } else {
        const parent = inputEl.parentElement;
        error = parent.querySelector(".custom-input-error");
    }
    
    if (error) {
        error.remove();
    }
  }

  // Real-time validation attachment
  function attachActiveValidation(inputEl) {
      if (!inputEl) return;
      
      inputEl.addEventListener("input", () => {
          const val = inputEl.value.trim();
          const isErrorShown = inputEl.classList.contains("input-error-border");
          
          if (!val) {
             // If empty, clear error (match login.js behavior where empty typically clears unless submitted)
             // But wait, login.js says: else if (isErrorShown || val.length > 0)
             // If I clear blindly on empty, and I just submitted empty form, typing nothing... well input event needs change.
             // If I clear here, and user submitted empty form, it clears immediately? No, input event only fires on user input.
             if (isErrorShown) {
                 // Option: show "Required" or clear. Login logic:
                 // (val) => val.length > 0 (for password).
                 // if empty, validatorFn is false.
                 // else if (isErrorShown). msg = "Password is required".
                 // So login.js SHOWS "Required" if empty and error was shown.
                 showInputError(inputEl, "Please enter an email address or domain.");
             }
          } else if (isValidEmailOrDomain(val)) {
              clearInputError(inputEl);
          } else if (isErrorShown) {
              // Still invalid, update message
              showInputError(inputEl, "Please enter a valid email address or domain.");
          }
      });
      
      // Removed blur listener to match login.js implementation strictly
  }

  // Attach listeners
  if (input) attachActiveValidation(input);


  // -------------------------------------------------------------------------
  // 5. Form Submission Logic
  // -------------------------------------------------------------------------

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let inputValue = input.value.trim();
    
    // REMOVED: clearInputError(input); <-- This was causing the blink/disappear effect

    if (!inputValue) {
      showInputError(input, "Please enter an email address or domain.");
      return;
    }

    if (!isValidEmailOrDomain(inputValue)) {
      showInputError(input, "Please enter a valid email address or domain.");
      return;
    }
    
    // Now that we know it's valid, we clear any existing error
    clearInputError(input);

    if (!turnstileToken) {
      showToast("Please complete the captcha verification.", "error");
      return;
    }

    // Prepare payload
    // If input doesn't have '@', assume it's a domain/URL
    if (!inputValue.includes('@')) {
        inputValue = extractDomain(inputValue);
    }
    
    // UI Loading State
    // UI Loading State
    const originalBtnContent = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.style.cursor = "not-allowed";
    submitBtn.style.opacity = "0.7";
    
    // Use flex centering for spinner
    if (isLandingPage) {
        submitBtn.innerHTML = `<span class="stopreg-btn-spinner" style="margin: 0;"></span>`;
    } else {
        submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Checking...`;
    }
    
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          emailDomain: inputValue, 
          turnstileToken 
        }),
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Handle specific network or API errors
        const errorMsg = data?.description || data?.message || "Verification failed. Please try again.";
        throw new Error(errorMsg);
      }

      const responseData = data?.data;
      
      const isDisposable = responseData?.classification?.is_disposable === true;
      
      renderResults(inputValue, isDisposable, responseData, data);
      showToast("Check successful", "success");

      // Reset Turnstile on success
      turnstileToken = null;
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }

    } catch (err) {
      console.error("API Error:", err);
      // Enhanced error message for network issues
      const msg = err.message === "Failed to fetch" 
        ? "Network error. Please check your connection."
        : (err.message || "An unexpected error occurred.");
        
      showToast(msg, "error");

      // CRITICAL: Reset Turnstile on error so the user can try again without a page refresh
      turnstileToken = null;
      if (window.turnstile && turnstileWidgetId !== null) {
        window.turnstile.reset(turnstileWidgetId);
      }
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnContent;
      submitBtn.style.cursor = "pointer";
      submitBtn.style.opacity = "1";
    }
  });

  // -------------------------------------------------------------------------
  // 5. Result Rendering (Dashboard Style)
  // -------------------------------------------------------------------------
  
  function renderResults(inputVal, isDisposable, details, fullResponse = null) {
    if (!resultContainer) return;

    if (isLandingPage) {
        const terminalBody = resultContainer.querySelector(".terminal-body");
        if (!terminalBody) return;

        terminalBody.classList.remove("placeholder-mode");
        
        // Use fullResponse if provided, otherwise reconstruct the approved format
        const responseToShow = fullResponse || {
            message: "success",
            description: "Check successful",
            data: {
                disposableEmail: isDisposable
            }
        };

        terminalBody.innerHTML = `<pre style="margin: 0;">${syntaxHighlight(responseToShow)}</pre>`;
        return;
    }

    if (isCheckPage) {
        const resultTitle = document.getElementById("verify-email-result-title");
        const listContainer = resultContainer.querySelector(".disposal-results-list");

        const typeLabel = inputVal.includes('@') ? "email" : "domain";
        const headerVerificationText = isDisposable 
            ? `is a verified disposable ${typeLabel}` 
            : `is NOT a verified disposable ${typeLabel}`;

        if (resultTitle) {
            resultTitle.innerHTML = `The ${typeLabel} provided <b>${inputVal}</b> ${headerVerificationText}`;
        }

        if (listContainer) {
            const hasMx = details?.mail_server?.mx_found === true;
            const isPublic = details?.classification?.is_public === true;
            const isRelay = details?.classification?.is_relay === true;
            const isRole = details?.classification?.is_role_based === true;
            const isAlias = details?.classification?.is_alias === true;
            const isUnresolved = details?.classification?.is_unresolved === true;

            listContainer.innerHTML = `
                <!-- Mx Record (True/False) -->
                <div class="result-card ${hasMx ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${hasMx ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Mx Record</h3>
                        <p class="result-desc">
                            ${hasMx 
                                ? "This domain has MX record. This means that it has a mail server and is able to receive emails" 
                                : "This domain does not have an MX record. It may not be able to receive emails."}
                        </p>
                    </div>
                </div>

                <!-- Disposable (True/False) -->
                <div class="result-card ${isDisposable ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${isDisposable ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Disposable</h3>
                        <p class="result-desc">
                            ${isDisposable 
                                ? "This domain appears to be from a disposable email provider"
                                : "This domain does not appear to be from a disposable email provider"}
                        </p>
                    </div>
                </div>

                <!-- Public Email (True/False) -->
                <div class="result-card ${isPublic ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${isPublic ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Public email provider</h3>
                        <p class="result-desc">
                            ${isPublic
                                ? "This domain is from a public email provider. This means that anyone can generate emails from this domain for free"
                                : "This domain is not from a public email provider"}
                        </p>
                    </div>
                </div>

                <!-- Relay Domain (True/False) -->
                <div class="result-card ${isRelay ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${isRelay ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Relay domain</h3>
                        <p class="result-desc">
                            ${isRelay
                                ? "This domain is identified as a relay domain service"
                                : "This domain does not appear to be a relay domain"}
                        </p>
                    </div>
                </div>

                <!-- Role-based (True/False) -->
                <div class="result-card ${isRole ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${isRole ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Role-based</h3>
                        <p class="result-desc">
                            ${isRole
                                ? "This email is identified as a role-based or generic address (e.g. admin@, support@)"
                                : "This email does not appear to be a role-based address"}
                        </p>
                    </div>
                </div>

                <!-- Alias (True/False) -->
                <div class="result-card ${isAlias ? 'status-true' : 'status-false'}">
                    <p class="result-boolean">${isAlias ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Alias Detection</h3>
                        <p class="result-desc">
                            ${isAlias
                                ? "This email is an alias address (contains + or . characters that may be stripped)"
                                : "This email is not an alias address"}
                        </p>
                    </div>
                </div>

                <!-- Unresolved (True/False) -->
                <div class="result-card ${isUnresolved ? 'status-true' : 'status-false'}" style="border-bottom: none;">
                    <p class="result-boolean">${isUnresolved ? 'True' : 'False'}</p>
                    <div class="result-content">
                        <h3 class="result-head">Unresolved</h3>
                        <p class="result-desc">
                            ${isUnresolved
                                ? "This domain could not be resolved or found in our global database. It may be a dead or inactive domain"
                                : "This domain was resolved successfully via DNS or Database"}
                        </p>
                    </div>
                </div>
            `;
        }

        resultContainer.style.display = 'block';
        return;
    }

    // Logic for individual checks (verify-email.html style)
    // MX Record
    const hasMx = details?.mail_server?.mx_found === true;
    const mxStatus = hasMx ? "YES" : "NO";
    const mxClass = hasMx ? "status-true" : "status-false"; 
    
    // Disposable
    const disposableStatus = isDisposable ? "True" : "False";
    const disposableClass = isDisposable ? "status-true" : "status-false"; 
    const disposableDesc = isDisposable 
        ? "This domain appears to be from a disposable email provider"
        : "This domain does not appear to be from a disposable email provider";

    // Public Provider
    const isPublic = !!details?.classification?.is_public;
    const publicStatus = isPublic ? "True" : "False";
    const publicClass = isPublic ? "status-true" : "status-false";
    const publicDesc = isPublic
        ? "This domain is from a public email provider."
        : "This domain is not from a public email provider";

    // Determine type label (Email or Domain)
    const typeLabel = inputVal.includes('@') ? "email" : "domain";
    const headerVerificationText = isDisposable 
        ? `is a verified disposable ${typeLabel}` 
        : `is NOT a verified disposable ${typeLabel}`;

    const html = `
      <h4 class="disposal-result-main-title" style="margin-top: 24px; margin-bottom: 16px; font-size: 16px; font-weight: 500; color: #101828;">
        The input provided <b>${inputVal}</b> ${headerVerificationText}
      </h4>

      <div class="disposal-results-list" style="display: flex; flex-direction: column; gap: 12px;">
        
        <!-- Disposable Card -->
        <div class="result-card ${disposableClass}" style="padding: 16px; border-radius: 8px; border: 1px solid; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; ${isDisposable ? 'background: #FEF3F2; border-color: #FECDCA;' : 'background: #ECFDF3; border-color: #ABEFC6;'}">
          <div class="result-content" style="flex: 1;">
            <h3 class="result-head" style="font-size: 14px; font-weight: 600; color: #344054; margin-bottom: 4px;">Disposable</h3>
            <p class="result-desc" style="font-size: 14px; color: #667085; line-height: 20px; margin: 0;">
              ${disposableDesc}
            </p>
          </div>
          <p class="result-boolean" style="font-size: 14px; font-weight: 600; ${isDisposable ? 'color: #B42318;' : 'color: #027A48;'} margin: 0;">${disposableStatus}</p>
        </div>

        ${Object.keys(details).length > 0 ? `
            <!-- MX Record Card -->
            <div class="result-card ${mxClass}" style="padding: 16px; border-radius: 8px; border: 1px solid; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; ${hasMx ? 'background: #ECFDF3; border-color: #ABEFC6;' : 'background: #FEF3F2; border-color: #FECDCA;'}">
            <div class="result-content" style="flex: 1;">
                <h3 class="result-head" style="font-size: 14px; font-weight: 600; color: #344054; margin-bottom: 4px;">MX Record</h3>
                <p class="result-desc" style="font-size: 14px; color: #667085; line-height: 20px; margin: 0;">
                ${hasMx ? "This domain has a valid MX record." : "This domain does not have a valid MX record."}
                </p>
            </div>
            <p class="result-boolean" style="font-size: 14px; font-weight: 600; ${hasMx ? 'color: #027A48;' : 'color: #B42318;'} margin: 0;">${mxStatus}</p>
            </div>

            <!-- Public Provider Card -->
            <div class="result-card ${publicClass}" style="padding: 16px; border-radius: 8px; border: 1px solid; display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; background: #fff; border-color: #EAECF0;">
            <div class="result-content" style="flex: 1;">
                <h3 class="result-head" style="font-size: 14px; font-weight: 600; color: #344054; margin-bottom: 4px;">Public Provider</h3>
                <p class="result-desc" style="font-size: 14px; color: #667085; line-height: 20px; margin: 0;">
                ${publicDesc}
                </p>
            </div>
            <p class="result-boolean" style="font-size: 14px; font-weight: 600; color: #344054; margin: 0;">${publicStatus}</p>
            </div>
        ` : ''}

      </div>
    `;
    
    resultContainer.innerHTML = html;
    resultContainer.style.display = 'block';
  }


});


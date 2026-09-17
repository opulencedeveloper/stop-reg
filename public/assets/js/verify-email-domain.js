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
    isCheckPage = window.location.pathname.includes('check-disposable-email');
    form = verifyPageForm;
    input = form.querySelector("#email");
    submitBtn = form.querySelector(".bulk-verify-domain-btn");
    resultContainer = isCheckPage
        ? document.getElementById("verify-email-result-section")
        : document.getElementById("verify-email-result-container");
    turnstileContainerSelector = "#captcha-container"; // or look for #turnstile-widget directly
  }

  const API_URL = "https://api.stopreg.com/api/v1/check/public";

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
    // More permissive domain pattern (allows trailing dots, subdomains, etc.)
    const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}\.?$/;
    
    if (emailPattern.test(trimmed)) return true;
    
    // Check if it's a domain with a leading @ (common user mistake)
    let domainCandidate = trimmed;
    if (domainCandidate.startsWith('@')) {
        domainCandidate = domainCandidate.substring(1);
    }
    
    const extracted = extractDomain(domainCandidate);
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
    const parent = inputEl.parentElement; // .email-container
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
        error = parent.querySelector(".disp-err");
    }

    // Always update text and ensure visuals
    if (error && error.textContent !== message) {
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
        if (error) {
            error.remove();
        }
    } else {
        const parent = inputEl.parentElement;
        error = parent.querySelector(".disp-err");
        if (error) {
            error.textContent = "";
        }
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
        // Strip leading @ if user accidentally included it for a domain
        if (inputValue.startsWith('@')) {
            inputValue = inputValue.substring(1);
        }
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
      const payload = {
        emailDomain: inputValue,
        turnstileToken
      };

      if (isCheckPage) {
        payload.includeRecentDomains = true;
      }

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
    if (!resultContainer) {
      return;
    }

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
        const resultTimestamp = resultContainer.querySelector(".disposal-result-main-stitl");
        const listContainer = resultContainer.querySelector(".disposal-results-list");
        const recentDomainsContainer = resultContainer.querySelector(".disposal-results-list-sect-two-list");
        const recentDomainsTitle = resultContainer.querySelector(".disposal-results-list-sect-two-con-tle");

        const typeLabel = inputVal.includes('@') ? "email" : "domain";
        const domain = inputVal.includes('@') ? inputVal.split('@')[1] : inputVal;
        const provider = details?.domain?.email_provider || "Unknown Provider";
        const now = new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZone: 'UTC'
        }) + ' UTC';

        if (resultTitle) {
            if (isDisposable) {
                resultTitle.innerHTML = `Result: <span><a href="http://${domain}" target="_blank">${domain}</a></span> is classified as a disposable email domain associated with <span>${provider}.</span>`;
            } else {
                resultTitle.innerHTML = `Result: <span><a href="http://${domain}" target="_blank">${domain}</a></span> is not classified as a disposable email domain.`;
            }
        }

        if (resultTimestamp) {
            resultTimestamp.innerHTML = `Checked on ${now}`;
        }

        if (recentDomainsTitle) {
            recentDomainsTitle.innerHTML = `RECENT DOMAINS FROM <span>${provider}</span>`;
        }

        if (listContainer) {
            const hasMx = details?.mail_server?.mx_found === true;
            const isPublic = details?.classification?.is_public === true;
            const isRelay = details?.classification?.is_relay === true;
            const isRole = details?.classification?.is_role_based === true;
            const isAlias = details?.classification?.is_alias === true;
            const isPrivate = details?.classification?.is_private === true;

            listContainer.innerHTML = `
                <!--MX Record -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">MX Record</p>
                        <div class="disposal-result-card ${hasMx ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${hasMx ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${hasMx
                        ? "This domain has an MX record. This means that it has a mail server and is able to receive emails."
                        : "This domain does not have an MX record. It may not be able to receive emails."}</p>
                </div>

                <!--Disposable -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Disposable</p>
                        <div class="disposal-result-card ${isDisposable ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isDisposable ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isDisposable
                        ? "This domain appears to be from a disposable email provider"
                        : "This domain does not appear to be from a disposable email provider"}</p>
                </div>

                <!--Public Email Provider -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Public Email Provider</p>
                        <div class="disposal-result-card ${isPublic ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isPublic ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isPublic
                        ? "This domain is from a public email provider. Anyone can create an email address on this domain for free."
                        : "This domain is not from a public email provider"}</p>
                </div>

                <!--Email Alias: Forwarding -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Email Alias: Forwarding</p>
                        <div class="disposal-result-card ${isRelay ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isRelay ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isRelay
                        ? "This domain is identified as a relay domain service"
                        : "This domain does not appear to be a relay domain"}</p>
                </div>

                <!-- Role-based -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Role-based</p>
                        <div class="disposal-result-card ${isRole ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isRole ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isRole
                        ? "This email is identified as a role-based or generic address (e.g. admin@, support@)"
                        : "This email does not appear to be a role-based address"}</p>
                </div>

                <!-- Email Alias: Native -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Email Alias: Native</p>
                        <div class="disposal-result-card ${isAlias ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isAlias ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isAlias
                        ? "This email is an alias address (contains + or . characters that may be stripped)"
                        : "This email is not an alias address"}</p>
                </div>

                <!-- Private Domain -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Private Domain</p>
                        <div class="disposal-result-card ${isPrivate ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${isPrivate ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${isPrivate
                        ? "This domain could not be resolved or found in our global database. It may be a dead or inactive domain."
                        : "This domain was resolved successfully via DNS or Database"}</p>
                </div>

                <!-- ISP -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">ISP</p>
                        <div class="disposal-result-card ${details?.classification?.is_isp ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${details?.classification?.is_isp ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${details?.classification?.is_isp
                        ? "This domain is from an Internet Service Provider"
                        : "This domain is not from an Internet Service Provider"}</p>
                </div>

                <!-- Edu Domain -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Edu Domain</p>
                        <div class="disposal-result-card ${details?.classification?.is_edu ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${details?.classification?.is_edu ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${details?.classification?.is_edu
                        ? "This domain is an educational institution domain"
                        : "This domain is not an educational institution domain"}</p>
                </div>

                <!-- Free subdomain provider -->
                <div class="result-card">
                    <div class="result-card-hd">
                        <p class="result-card-tle">Free subdomain provider</p>
                        <div class="disposal-result-card ${details?.classification?.is_free_subdomain ? 'disposal-result-card-true' : 'disposal-result-card-false'}">
                            ${details?.classification?.is_free_subdomain ? 'True' : 'False'}
                        </div>
                    </div>
                    <p class="disposal-result-card-desc">${details?.classification?.is_free_subdomain
                        ? "This domain is a free subdomain provider"
                        : "This domain is not a free subdomain provider"}</p>
                </div>
            `;
        }

        // Only show recent domains if domain is disposable
        const recentDomainsSection = recentDomainsContainer?.closest('.disposal-results-list-sect-two-cont');

        if (isDisposable && recentDomainsContainer && details?.recent_domains) {
            if (details.recent_domains.length > 0) {
                recentDomainsContainer.innerHTML = details.recent_domains
                    .map(domain => `<p class="disposal-results-list-sect-two-list-item">${domain}</p>`)
                    .join('');
            } else {
                recentDomainsContainer.innerHTML = '<p class="disposal-results-list-sect-two-list-item">No recent domains found</p>';
            }
            if (recentDomainsSection) recentDomainsSection.style.display = 'block';
        } else if (recentDomainsSection) {
            recentDomainsSection.style.display = 'none';
        }

        // Apply color class based on classification
        const publicResultsCard = resultContainer.querySelector('.public-results-card');
        console.log('[Check Page] Classification data:', details?.classification);
        console.log('[Check Page] Mail server data:', details?.mail_server);

        if (publicResultsCard) {
            publicResultsCard.classList.remove('public-results-card-red', 'public-results-card-yellow', 'public-results-card-green');

            const classification = details?.classification || {};
            const isDisp = classification.is_disposable === true;
            const noMx = details?.mail_server?.mx_found === false;
            const isAlias = classification.is_alias === true;

            const isRelay = classification.is_relay === true;
            const isFreeSubdomain = classification.is_free_subdomain === true;
            const isRoleBased = classification.is_role_based === true;

            const isPublic = classification.is_public === true;
            const isIsp = classification.is_isp === true;
            const isEdu = classification.is_edu === true;
            const isPrivate = classification.is_private === true;

            console.log('[Check Page] Red triggers:', { isDisp, noMx, isAlias });
            console.log('[Check Page] Yellow triggers:', { isRelay, isFreeSubdomain, isRoleBased });
            console.log('[Check Page] Green triggers:', { isPublic, isIsp, isEdu, isPrivate });

            if (isDisp || noMx || isAlias) {
                console.log('[Check Page] Applying RED color');
                publicResultsCard.classList.add('public-results-card-red');
            } else if (isRelay || isFreeSubdomain || isRoleBased) {
                console.log('[Check Page] Applying YELLOW color');
                publicResultsCard.classList.add('public-results-card-yellow');
            } else if (isPublic || isIsp || isEdu || isPrivate) {
                console.log('[Check Page] Applying GREEN color');
                publicResultsCard.classList.add('public-results-card-green');
            } else {
                console.log('[Check Page] No color class matched');
            }
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

  // -------------------------------------------------------------------------
  // 6. Hero Demo Card — 3-D Mouse-Tilt
  //    Sets CSS custom properties --demo-tilt-x / --demo-tilt-y which are
  //    composed directly inside the heroCardFloat keyframes so the ambient
  //    levitation and the tilt never conflict.
  // -------------------------------------------------------------------------
  if (isLandingPage) {
    const demoCard = document.getElementById('live-demo');
    if (demoCard) {
      const MAX_TILT = 7; // degrees
      let rafId = null;

      const setTilt = (rx, ry) => {
        demoCard.style.setProperty('--demo-tilt-x', rx + 'deg');
        demoCard.style.setProperty('--demo-tilt-y', ry + 'deg');
      };

      const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

      demoCard.addEventListener('mouseenter', () => {
        // Fast response while the pointer is inside
        demoCard.style.setProperty(
          'transition',
          '--demo-tilt-x 0.08s ease-out, --demo-tilt-y 0.08s ease-out'
        );
      });

      demoCard.addEventListener('mousemove', (e) => {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          const r  = demoCard.getBoundingClientRect();
          const rx = clamp(((e.clientY - r.top)  / r.height - 0.5) *  MAX_TILT * 2, -MAX_TILT, MAX_TILT);
          const ry = clamp(((e.clientX - r.left) / r.width  - 0.5) * -MAX_TILT * 2, -MAX_TILT, MAX_TILT);
          setTilt(rx, ry);
        });
      });

      demoCard.addEventListener('mouseleave', () => {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        // Spring back with a soft ease
        demoCard.style.setProperty(
          'transition',
          '--demo-tilt-x 0.7s cubic-bezier(0.23, 1, 0.32, 1), --demo-tilt-y 0.7s cubic-bezier(0.23, 1, 0.32, 1)'
        );
        setTilt(0, 0);
        setTimeout(() => demoCard.style.removeProperty('transition'), 700);
      });
    }
  }

});


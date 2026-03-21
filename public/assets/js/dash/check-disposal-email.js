document.addEventListener("DOMContentLoaded", () => {
    // Hide global spinner when page is logically ready
    window.addEventListener('load', () => {
        const spinner = document.getElementById('spinner-body');
        const content = document.getElementById("content");
        if (spinner) {
            spinner.style.display = 'none';
        }
        if (content) {
            content.style.display = 'block';
        }
        document.body.classList.remove('hidden-overflow');
    });

    const form = document.getElementById("verify-form");
    if (!form) return;
    
    const submitBtn = form.querySelector(".bulk-check-email-btn");
    const resultTitle = document.querySelector(".disposal-result-main-title");
    const resultsList = document.querySelector(".disposal-results-list");
    
    // New Containers
    const resultsContainer = document.getElementById("results-container");
    const emptyStateContainer = document.getElementById("results-empty-state");

    // Function to extract domain from URL
    function extractDomain(input) {
        let cleaned = input.trim();
        cleaned = cleaned.replace(/^https?:\/\//i, '');
        cleaned = cleaned.replace(/^ftp:\/\//i, '');
        cleaned = cleaned.replace(/^www\./i, '');
        cleaned = cleaned.split('/')[0];
        cleaned = cleaned.split(':')[0];
        cleaned = cleaned.split('?')[0];
        cleaned = cleaned.split('#')[0];
        return cleaned.trim();
    }

    // Validation function for email, domain, or URL
    function isValidEmailOrDomain(input) {
        const trimmed = input.trim();
        if (!trimmed) return false;
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const domainPattern = /^([a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
        if (emailPattern.test(trimmed)) return true;
        
        // Check if it's a URL or Domain
        const extracted = extractDomain(trimmed);
        if (extracted && extracted.length > 0 && domainPattern.test(extracted)) return true;
        
        return false;
    }

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("authToken");

        if (!token) {
            window.clearUserSession();
            window.location.href = "/sign-in.html";
            return;
        }

        const emailInput = document.getElementById("disposal-email");
        let input = emailInput.value.trim();
        
        if (!isValidEmailOrDomain(input)) {
             if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Error',
                    message: "Please enter a valid email address or domain",
                    position: "topRight",
                    timeout: 5000,
                });
            }
            return;
        }

        // If it looks like a URL/Domain but not an email, extract just the domain part if needed,
        // OR just pass what the user typed if the backend handles both.
        // Assuming backend endpoint `email-domain/check-disposable-email-domain` expects `emailDomain` field.
        // If the user entered a full URL, we should probably extract the domain.
        if (!input.includes('@')) {
            input = extractDomain(input);
        }

        const payload = { emailDomain: input };

        // Update button state with fast loading spinner
        const originalText = submitBtn.innerHTML; // Verify
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Verifying...`;

        try {
            // Using relative path as per plan
            const response = await fetch(
        "https://api.stopreg.com/api/v1/email-domains/check-disposable-email-domain",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify(payload),
                }
            );

            const data = await response.json();
            // console.log("Verification Response:", data);

            if (response.ok) {
                const results = data?.data;
                const isDisposable = results?.classification?.is_disposable === true;

                // Show results, hide empty state
                if (resultsContainer) resultsContainer.style.display = "block";
                if (emptyStateContainer) emptyStateContainer.style.display = "none";

                // Update the main title
                if (resultTitle) {
                   const isEmail = input.includes('@');
                   const typeLabel = isEmail ? "email" : "domain";
                   // backend returns isDisposable for the domain/email
                   const statusText = isDisposable 
                        ? `is a verified disposable ${typeLabel}` 
                        : `is NOT a verified disposable ${typeLabel}`;
                   
                   resultTitle.innerHTML = `The input provided <b>${input}</b> ${statusText}`;
                }

                // Update individual result cards
                if (resultsList) {
                    const hasMx = results?.mail_server?.mx_found === true;
                    const isPublic = results?.classification?.is_public === true;
                    const isRelay = results?.classification?.is_relay === true;
                    const isRole = results?.classification?.is_role_based === true;
                    const isAlias = results?.classification?.is_alias === true;
                    const isUnresolved = results?.classification?.is_unresolved === true;

                    resultsList.innerHTML = `
                        <!-- MX Record (True/False) -->
                        <div class="result-card ${hasMx ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">MX Record</h3>
                                <p class="result-desc">
                                    ${hasMx 
                                        ? "This domain has a valid MX record. It is able to receive emails" 
                                        : "This domain does not have a valid MX record."}
                                </p>
                            </div>
                            <p class="result-boolean">${hasMx ? 'True' : 'False'}</p>
                        </div>

                        <!-- Disposable (True/False) -->
                        <div class="result-card ${isDisposable ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Disposable</h3>
                                <p class="result-desc">
                                    ${isDisposable 
                                        ? "This domain appears to be from a disposable email provider"
                                        : "This domain does not appear to be from a disposable email provider"}
                                </p>
                            </div>
                            <p class="result-boolean">${isDisposable ? 'True' : 'False'}</p>
                        </div>

                        <!-- Public Email (True/False) -->
                        <div class="result-card ${isPublic ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Public email provider</h3>
                                <p class="result-desc">
                                    ${isPublic
                                        ? "This domain is from a public email provider. Anyone can generate emails for free"
                                        : "This domain is not from a public email provider"}
                                </p>
                            </div>
                            <p class="result-boolean">${isPublic ? 'True' : 'False'}</p>
                        </div>

                        <!-- Relay Domain (True/False) -->
                        <div class="result-card ${isRelay ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Relay domain</h3>
                                <p class="result-desc">
                                    ${isRelay
                                        ? "This domain is identified as a relay domain service"
                                        : "This domain does not appear to be a relay domain"}
                                </p>
                            </div>
                            <p class="result-boolean">${isRelay ? 'True' : 'False'}</p>
                        </div>

                        <!-- Role-based (True/False) -->
                        <div class="result-card ${isRole ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Role-based</h3>
                                <p class="result-desc">
                                    ${isRole
                                        ? "This email is identified as a role-based or generic address (e.g. admin@, support@)"
                                        : "This email does not appear to be a role-based address"}
                                </p>
                            </div>
                            <p class="result-boolean">${isRole ? 'True' : 'False'}</p>
                        </div>

                        <!-- Alias Detection (True/False) -->
                        <div class="result-card ${isAlias ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Alias Detection</h3>
                                <p class="result-desc">
                                    ${isAlias
                                        ? "This email is an alias address (contains + or . characters that may be stripped)"
                                        : "This email is not an alias address"}
                                </p>
                            </div>
                            <p class="result-boolean">${isAlias ? 'True' : 'False'}</p>
                        </div>

                        <!-- Unresolved (True/False) -->
                        <div class="result-card ${isUnresolved ? 'status-true' : 'status-false'}">
                            <div class="result-content">
                                <h3 class="result-head">Unresolved</h3>
                                <p class="result-desc">
                                    ${isUnresolved
                                        ? "This domain could not be resolved or found in our global database."
                                        : "This domain was resolved successfully via DNS or Database"}
                                </p>
                            </div>
                            <p class="result-boolean">${isUnresolved ? 'True' : 'False'}</p>
                        </div>
                    `;
                }

                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        title: 'Success',
                        message: 'Check successful',
                        position: "topRight",
                        timeout: 3000
                    });
                }

            } else {
                if (window.handleAuthError && await window.handleAuthError(response)) {
                    return;
                }
                const errorMessage = data.description || data.message || "Verification failed!";
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        title: 'Error',
                        message: errorMessage,
                        position: "topRight",
                        timeout: 5000,
                    });
                }
            }
        } catch (err) {
            console.error("Network error:", err);
            if (window.handleAuthError && await window.handleAuthError(err)) {
                return;
            }
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Network Error',
                    message: "Could not connect to the server. Please check your connection.",
                    position: "topRight",
                    timeout: 5000,
                });
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    });

    // Auto-fill email if passed in URL query params (optional enhancement)
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    if (emailParam) {
        const emailInput = document.getElementById("disposal-email");
        if (emailInput) {
            emailInput.value = emailParam;
            // Optionally auto-submit? No, let user confirm.
        }
    }
});
  

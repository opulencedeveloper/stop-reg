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
        "https://api-stop-reg.onrender.com/api/v1/email-domains/check-disposable-email-domain",
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
                const isDisposable = data?.data?.isDisposable;

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
                    const cards = resultsList.querySelectorAll(".result-card");
                    

                    // Update single Disposable Card
                    const disposableCard = cards[0];
                    if (disposableCard) {
                        disposableCard.classList.remove("status-true", "status-false");
                        disposableCard.classList.add(isDisposable ? "status-true" : "status-false");
                        
                        const desc = disposableCard.querySelector(".result-desc");
                        const bool = disposableCard.querySelector(".result-boolean");
                        
                        if (desc) {
                            desc.textContent = isDisposable 
                                ? "This domain appears to be from a disposable email provider"
                                : "This domain does not appear to be from a disposable email provider";
                        }
                        if (bool) {
                            bool.textContent = isDisposable ? "True" : "False";
                        }
                    }
                    
                    // Note: Other cards (MX Record, Public Email, Relay Domain) are not updated 
                    // as the API response provided is strictly `{ isDisposable: boolean }`.
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
                if (response.status === 401) {
                    localStorage.removeItem("authToken");
                    localStorage.removeItem("role");
                    window.location.href = "/sign-in.html";
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
  

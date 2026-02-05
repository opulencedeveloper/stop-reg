document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("authToken");
  
    if (!token) {
        window.location.href = "/sign-in.html";
        return;
    }
  
    // Global spinner removed to prevent page load blocking
    // if (typeof window.showSpinner === "function") {
    //   window.showSpinner();
    // }

    // Capture elements once
    const bannerTextEl = document.querySelector(".banner-text");
    const planInfoEl = document.querySelector(".plan-status-info");
    const expiryDateEl = document.querySelector(".current-plan-date.plan-status-expiry");
    
    let originalBannerHTML = "";
    let originalPlanInfoHTML = "";
    let originalExpiryHTML = "";

    if (bannerTextEl) originalBannerHTML = bannerTextEl.innerHTML;
    if (planInfoEl) originalPlanInfoHTML = planInfoEl.innerHTML;
    if (expiryDateEl) originalExpiryHTML = expiryDateEl.innerHTML;

    const spinnerHTML = `
        <span style="display: inline-flex; align-items: center; gap: 8px;">
            <span class="stopreg-btn-spinner" style="border: 2px solid rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-right-color: #1452CA !important; width: 18px; height: 18px;"></span>
            <span style="font-size: 14px; color: #737373;">Loading plan...</span>
        </span>
    `;

    const spinnerDateHTML = `
        <span style="display: inline-flex; align-items: center; gap: 6px;">
            <span class="stopreg-btn-spinner" style="border: 2px solid rgba(115, 115, 115, 0.2) !important; border-top-color: #737373 !important; border-right-color: #737373 !important; width: 14px; height: 14px;"></span>
            <span style="font-size: 12px; color: #737373;">Loading...</span>
        </span>
    `;

    // Define fetch function
    const fetchPlanDetails = async (e) => {
        if (e && e.preventDefault) {
            e.preventDefault();
        }

        // Show Spinners
        if (bannerTextEl) bannerTextEl.innerHTML = spinnerHTML;
        if (planInfoEl) planInfoEl.innerHTML = spinnerHTML;
        if (expiryDateEl) expiryDateEl.innerHTML = spinnerDateHTML;

        try {
            const response = await fetch("http://localhost:8080/api/v1/user/info", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const data = await response.json();
    
            // Restore originals before populating (clears spinners/error buttons)
            if (bannerTextEl) bannerTextEl.innerHTML = originalBannerHTML;
            if (planInfoEl) planInfoEl.innerHTML = originalPlanInfoHTML;
            if (expiryDateEl) expiryDateEl.innerHTML = originalExpiryHTML;

            if (response.ok) {
                const user = data?.data || data;
                const userDetails = user.userDetails;
        
                if (userDetails) {
                    // Update Expiration
                    const expiresDateEls = document.querySelectorAll(".current-plan-date");
                    if (userDetails.tokenExpiresAt) {
                        const expiresDate = new Date(userDetails.tokenExpiresAt);
                        const formattedDate = expiresDate.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        });
                        expiresDateEls.forEach(el => el.textContent = `Expires: ${formattedDate}`);
                    }
        
                    // Update Plan Name
                    const planNameEls = document.querySelectorAll(".Current-plan-plan");
                    if (userDetails.planId?.name) {
                        planNameEls.forEach(el => el.textContent = `${userDetails.planId.name}`);
                    }
        
                    // Update Requests Left
                    const apiRequestLeftEls = document.querySelectorAll(".api-request-left");
                    if (userDetails.planId) {
                        const apiRequestLeft = userDetails.apiRequestLeft ?? 0;
                        const durationInDays = userDetails.planId.durationInDays ?? 30;
                        apiRequestLeftEls.forEach(el => {
                            el.textContent = `${apiRequestLeft} API requests in ${durationInDays} days`;
                        });
                    }
                }
            } else {
                if (response.status === 401) {
                    localStorage.removeItem("authToken");
                    window.location.href = "/sign-in.html";
                }
                throw new Error("Failed to load user info");
            }
        } catch (error) {
            console.error("Network error fetching plan details:", error);
            
            const retryBtn = `<button class="plan-retry-btn" type="button" style="background:none; border:none; color:#1452CA; text-decoration:underline; cursor:pointer; font-family:inherit; font-size:14px; padding:0;">Retry</button>`;
            const errorMsg = `<span style="color: #666; font-size: 14px;">Failed to load. ${retryBtn}</span>`;

            // Inject Error UI with Retry
            if (bannerTextEl) {
                bannerTextEl.innerHTML = errorMsg;
                bannerTextEl.querySelector('.plan-retry-btn')?.addEventListener('click', fetchPlanDetails);
            }
            
            if (planInfoEl) {
                planInfoEl.innerHTML = `
                    <div style="display:flex; flex-direction:column; gap:4px;">
                        <span style="color:#666; font-size:14px;">Failed to load plan info.</span>
                        ${retryBtn}
                    </div>
                `;
                planInfoEl.querySelector('.plan-retry-btn')?.addEventListener('click', fetchPlanDetails);
            }

            if (expiryDateEl) {
                expiryDateEl.innerHTML = `<span style="font-size:12px;">Error. ${retryBtn}</span>`;
                expiryDateEl.querySelector('.plan-retry-btn')?.addEventListener('click', fetchPlanDetails);
            }

            // Also show Premium Error Modal for better visibility (consistent with table)
            if (window.showPremiumError) {
                let errorTitle = 'Data Load Error';
                let errorMessage = 'Failed to load user info.';
                
                if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                    errorTitle = 'Network Error';
                    errorMessage = 'Please check your internet connection and try again.';
                } else if (error.message) {
                    errorMessage = error.message;
                }

                window.showPremiumError(errorTitle, errorMessage, fetchPlanDetails);
            }
        }
    };

    // Initial Fetch
    fetchPlanDetails();

    // Expose for external access (e.g., global retry)
    window.fetchPlanDetails = fetchPlanDetails;
});

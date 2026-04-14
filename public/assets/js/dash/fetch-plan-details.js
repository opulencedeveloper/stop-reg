document.addEventListener("DOMContentLoaded", async () => {
      const token = localStorage.getItem("authToken");
  
    // Global spinner removed to prevent page load blocking
    // if (typeof window.showSpinner === "function") {
    //   window.showSpinner();
    // }

    // Capture elements once
    const bannerTextEl = document.querySelector(".banner-text");
    const planInfoEl = document.querySelector(".plan-status-info");
    const expiryDateEl = document.querySelector(".current-plan-date.plan-status-expiry");
    const pricingContainer = document.querySelector(".pricing-container");
    const sectionContainer = document.querySelector(".dash-section-container");
    
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

    const gridSpinnerHTML = `
        <div class="pricing-loader-container" style="display: flex; justify-content: center; align-items: center; min-height: 400px; width: 100%;">
            <span class="stopreg-btn-spinner" style="border-color: rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-width: 3px; width: 40px; height: 40px;"></span>
        </div>
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
        
        // Handle Pricing Grid Loading State
        if (pricingContainer) {
            pricingContainer.style.display = "none";
            // Remove existing loader/error if any
            sectionContainer?.querySelectorAll(".pricing-loader-container, .pricing-error-container").forEach(el => el.remove());
            // Add grid spinner
            const loader = document.createElement("div");
            loader.innerHTML = gridSpinnerHTML;
            pricingContainer.parentNode.insertBefore(loader.firstElementChild, pricingContainer);
        }

        try {
            const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
            });
    
            const data = await response.json();
    
            // Remove Loaders
            sectionContainer?.querySelectorAll(".pricing-loader-container").forEach(el => el.remove());

            // Restore originals before populating (clears spinners/error buttons)
            if (bannerTextEl) bannerTextEl.innerHTML = originalBannerHTML;
            if (planInfoEl) planInfoEl.innerHTML = originalPlanInfoHTML;
            if (expiryDateEl) expiryDateEl.innerHTML = originalExpiryHTML;

            if (response.ok) {
                const user = data?.data || data;
                const userDetails = user.userDetails;
        
                if (userDetails) {
                    // Reveal Pricing Container
                    if (pricingContainer) pricingContainer.style.display = "";

                    // 1. Update Expiration
                    if (userDetails.tokenExpiresAt) {
                        const expiresDate = new Date(userDetails.tokenExpiresAt);
                        const formattedDate = expiresDate.toLocaleDateString("en-US", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                        });

                        document.querySelectorAll(".current-plan-date").forEach(el => {
                            // Clear innerHTML to remove any spinners (from chart.js)
                            el.innerHTML = "";
                            el.textContent = `Expires: ${formattedDate}`;
                        });
                    }
        
                    // 2. Update Plan Name
                    if (userDetails.planId?.name) {
                        const planName = userDetails.planId.name;
                        document.querySelectorAll(".Current-plan-plan").forEach(el => {
                            el.innerHTML = "";
                            el.textContent = `Plan name: ${planName}`;
                        });
                        
                        // --- UI Hiding Logic for Payments Page ---
                        
                        // A. Hide the pricing card that matches the user's current plan
                        document.querySelectorAll(".pricing-card").forEach(card => {
                            const titleEl = card.querySelector(".pricing-title");
                            if (titleEl && titleEl.textContent.trim().toLowerCase() === planName.toLowerCase()) {
                                card.style.display = "none";
                            }
                        });

                        // B. Hide the upgrade subtitle if the user is on a paid plan
                        const isPaidPlan = planName.toLowerCase() !== "free";
                        if (isPaidPlan && bannerTextEl) {
                            bannerTextEl.style.display = "none";
                        }

                        // C. Toggle Bulk Verification specific upgrade message
                        const bulkUpgradeMsg = document.getElementById("bulk-upgrade-msg");
                        if (bulkUpgradeMsg) {
                            bulkUpgradeMsg.style.display = isPaidPlan ? "none" : "block";
                        }
                        
                        // Broadcast the plan type globally so other scripts can adapt UI
                        window.currentUserPlan = planName;
                        const planEvent = new CustomEvent("planLoaded", { detail: planName });
                        document.dispatchEvent(planEvent);
                    }
        
                    // 3. Update Requests Left
                    if (userDetails.planId) {
                        const free = userDetails.extraApiLimitLeft ?? 0;
                        const paid = userDetails.apiRequestLeft ?? 0;
                        const isPaid = userDetails.planId.name.toLowerCase() !== "free";
                        const totalRemaining = isPaid ? paid : free;
                        const planLimit = userDetails.planId.apiLimit ?? 0;
                        const durationInDays = userDetails.planId.durationInDays ?? 30;
                        
                        const usageText = `
                    <span class="plan-limit-line">Plan limit: ${planLimit.toLocaleString()} tokens</span>
                    <span class="plan-remaining-line">Remaining tokens: ${totalRemaining.toLocaleString()} API requests for ${durationInDays} days</span>
                `;

                document.querySelectorAll(".api-request-left, .dash-api-hd-subtl").forEach(el => {
                   el.innerHTML = usageText;
                });
                    }
                }
            } else {
                if (await window.handleAuthError(response)) {
                    return null;
                }
                throw new Error("Failed to load user info");
            }
        } catch (error) {
            console.error("Network error, fetching plan details:", error);
            
            // Remove loaders
            sectionContainer?.querySelectorAll(".pricing-loader-container").forEach(el => el.remove());
            
            // Show Error UI for Pricing Grid
            if (pricingContainer && sectionContainer) {
                pricingContainer.style.display = "none";
                const errorUI = document.createElement("div");
                errorUI.className = "pricing-error-container";
                errorUI.style.cssText = "display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 400px; width: 100%; text-align: center; gap: 16px; background: #fff; border-radius: 12px; margin-top: 40px;";
                
                let errorMessage = "Failed to load pricing information.";
                if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
                    errorMessage = "Network error. Please check your connection.";
                }

                errorUI.innerHTML = `
                    <div style="background: #FFF0F0; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 8V12" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            <path d="M12 16H12.01" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <div style="font-family: 'Inter_28pt-SemiBold'; font-size: 18px; color: #252525;">Data Load Error</div>
                    <div style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #737373; max-width: 280px;">${errorMessage}</div>
                    <button id="pricing-retry-btn" style="background-color: #1452CA; color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer;">Try Again</button>
                `;
                pricingContainer.parentNode.insertBefore(errorUI, pricingContainer);
                
                const retryBtn = document.getElementById("pricing-retry-btn");
                if (retryBtn) {
                    retryBtn.onclick = () => window.location.reload();
                }
            }

            const retryBtnHTML = `<button class="plan-retry-btn" type="button" style="background:none; border:none; color:#1452CA; text-decoration:underline; cursor:pointer; font-family:inherit; font-size:14px; padding:0;">Retry</button>`;
            const errorMsg = `<span style="color: #666; font-size: 14px;">Failed to load. ${retryBtnHTML}</span>`;

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

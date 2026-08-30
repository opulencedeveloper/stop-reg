document.addEventListener("DOMContentLoaded", async () => {

  // Increment spinner counter to track this data fetch
  // Hide global spinner immediately on page load
  if (typeof window.hideSpinner === "function") {
    window.hideSpinner();
  }

  // Wrap logic in a reusable function for retry support
    const fetchUserDetails = async () => {
    const token = localStorage.getItem("authToken");

    // Target elements
    const profileWrapper = document.querySelector(".profile-wrapper");
    let originalProfileWrapperHTML = "";
    
    // Store original HTML to restore it later if needed (though we mostly replace/populate)
    // Actually, for "loading", we might just want to replace the content temporarily.
    // However, since we populate existing fields, we should probably hide the children 
    // and append a spinner, then remove spinner and show children on success.
    // Or easier: replace innerHTML with spinner, then on success, restore the HTML structure (if we had it) 
    // OR: just hide the specific container contents and show a spinner sibling.
    
    // Better approach given the DOM structure:
    // The profile wrapper contains the avatar/name div AND the form.
    // We can clear it and show spinner, then rebuild/unhide.
    // But since the form is static HTML, we don't want to lose the event listeners on the form (if any were attached elsewhere).
    // `profile-update.js` attaches listeners to elements found by ID. If we destroy and recreate them, listeners break.
    // So we should HIDE the children and SHOW the spinner.

    if (profileWrapper) {
      // Add a spinner container if not present
      let spinnerContainer = profileWrapper.querySelector(".profile-loader-container");
      if (!spinnerContainer) {
          spinnerContainer = document.createElement("div");
          spinnerContainer.className = "profile-loader-container";
          spinnerContainer.style.cssText = "display: flex; justify-content: center; align-items: center; min-height: 200px; width: 100%;";
          spinnerContainer.innerHTML = `<span class="stopreg-btn-spinner" style="border-color: rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-width: 2px; width: 24px; height: 24px;"></span>`;
          profileWrapper.appendChild(spinnerContainer);
      }

      // Hide other children
      Array.from(profileWrapper.children).forEach(child => {
          if (child !== spinnerContainer) child.style.display = "none";
      });
      
      // Show spinner
      spinnerContainer.style.display = "flex";
    }

    try {
      const response = await fetch("http://localhost:8080/api/v1/user/info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
    
      if (response.ok) {
        const user = data?.data || data;
        
        // Restore UI (Hide spinner, show content)
        if (profileWrapper) {
            const spinnerContainer = profileWrapper.querySelector(".profile-loader-container");
            const errorContainer = profileWrapper.querySelector(".profile-error-container");
            
            if (spinnerContainer) spinnerContainer.style.display = "none";
            if (errorContainer) errorContainer.style.display = "none";
            
            Array.from(profileWrapper.children).forEach(child => {
                if (child !== spinnerContainer && child !== errorContainer && !child.classList.contains("profile-loader-container") && !child.classList.contains("profile-error-container")) {
                    child.style.display = ""; // Restore default display
                }
            });
        }

        const apiToken = user.userDetails.apiToken;
  
        const tokenElement = document.querySelector(".main-token");
        if (tokenElement && apiToken) {
          tokenElement.textContent = apiToken;
        }
        
        // Update New Dashboard UI Elements
        const apiTokenTextEl = document.getElementById("api-token-text");
        const emailEndpointEl = document.getElementById("email-endpoint-text");
        const domainEndpointEl = document.getElementById("domain-endpoint-text");
  
        if (apiToken && apiTokenTextEl) {
            // Remove manual truncation, let CSS handle it
            apiTokenTextEl.textContent = apiToken;
            apiTokenTextEl.dataset.fullText = apiToken; // Store full token for copy
        }
  
        // Set Endpoints (Static for now, but ready for dynamic if needed)
        // We also set data-full-text to simplify the copy logic consistency
        if (emailEndpointEl) {
            const emailEndpoint = "http://localhost:8080/api/v1/verify/email"; 
            emailEndpointEl.textContent = emailEndpoint;
            emailEndpointEl.dataset.fullText = emailEndpoint;
        }
  
        if (domainEndpointEl) {
            const domainEndpoint = "http://localhost:8080/api/v1/verify/domain";
            domainEndpointEl.textContent = domainEndpoint;
            domainEndpointEl.dataset.fullText = domainEndpoint;
        }
  
        // Update the legacy API link with the token section
        if (apiToken) {
          const linkContainer = document.querySelector(".link-container");
          if (linkContainer) {
            const newLink = ` http://localhost:8080/api/v1/check/${apiToken}?email=test@test.com`;
            linkContainer.href = newLink;
            
            const linkTitle = linkContainer.querySelector(".token-link-title");
            if (linkTitle) {
              linkTitle.textContent = newLink;
            }
          }
        }
  
        const userNameEl = document.getElementById("user-name");
        const userEmailEl = document.getElementById("user-email");
  
        if (userNameEl) {
          userNameEl.textContent =
            user.userDetails?.fullName || user.name || "Unknown";
        }
        if (userEmailEl) {
          userEmailEl.textContent =
            user.userDetails?.email || user.email || "No email";
        }
  
        // Populate Profile Page Fields
        const profileNameEl = document.querySelector(".profile-name");
        const firstNameInput = document.getElementById("firstname");
        const lastNameInput = document.getElementById("lastname");
        const emailInput = document.getElementById("email");
        
        const firstName = user.userDetails?.firstName || "";
        const lastName = user.userDetails?.lastName || "";
        const fullDisplayName = `${firstName} ${lastName}`.trim() || user.userDetails?.fullName || user.name || "Unknown";
        const userEmail = user.userDetails?.email || user.email || "";
  
        if (profileNameEl) {
            profileNameEl.textContent = fullDisplayName;
        }
        if (firstNameInput) {
            firstNameInput.value = firstName;
        }
        if (lastNameInput) {
            lastNameInput.value = lastName;
        }
        if (emailInput) {
            emailInput.value = userEmail;
        }
  
      } else {
        console.error("Error fetching user:", data);
  
        // Delegate to global security gate for 401/403 handling
        if (window.handleAuthError && await window.handleAuthError(response)) {
          return;
        } else {
            // Non-auth error, allow catch block to handle UI
            throw new Error(data.description || data.message || "Failed to fetch user information.");
        }
      }
    } catch (error) {
      console.error("Network or API error:", error);
      
      // Hide spinner
      if (profileWrapper) {
          const spinnerContainer = profileWrapper.querySelector(".profile-loader-container");
          if (spinnerContainer) spinnerContainer.style.display = "none";
          
          // Show Inline Error UI
          let errorContainer = profileWrapper.querySelector(".profile-error-container");
          if (!errorContainer) {
              errorContainer = document.createElement("div");
              errorContainer.className = "profile-error-container";
              errorContainer.style.cssText = "display: flex; flex-direction: column; justify-content: center; align-items: center; height: 350px; width: 100%; text-align: center; gap: 16px; background: #fff; border-radius: 12px;";
              profileWrapper.appendChild(errorContainer);
          }
          
          let errorMessage = "Failed to load user info.";
           if (error.message === 'Failed to fetch' || error.message.includes('NetworkError')) {
              errorMessage = "Network error. Please check your connection.";
          } else if (error.message) {
              errorMessage = error.message;
          }

          errorContainer.innerHTML = `
             <div style="background: #FFF0F0; border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; margin-bottom: 8px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 8V12" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M12 16H12.01" stroke="#FF4D4D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
             </div>
             <div style="font-family: 'Inter_28pt-SemiBold'; font-size: 18px; color: #252525;">Data Load Error</div>
             <div style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #737373; max-width: 280px; margin-bottom: 8px;">${errorMessage}</div>
             <button id="profile-retry-btn" style="background-color: var(--secondary-color); color: #fff; border: none; padding: 12px 32px; border-radius: 8px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer; transition: opacity 0.2s;">Try Again</button>
          `;
          
          // Ensure it's visible
          errorContainer.style.display = "flex";

          // Add click listener
          const retryBtn = document.getElementById("profile-retry-btn");
          if (retryBtn) {
              retryBtn.onclick = () => {
                  // cleanup error container before retrying
                   errorContainer.style.display = "none";
                   
                   // Show spinner explicitly again to ensure smooth transition
                    const spinnerContainer = profileWrapper.querySelector(".profile-loader-container");
                    if (spinnerContainer) spinnerContainer.style.display = "flex";

                   fetchUserDetails();
              };
              
              // Add hover effect
              retryBtn.onmouseover = () => retryBtn.style.opacity = "0.9";
              retryBtn.onmouseout = () => retryBtn.style.opacity = "1";
          }
      }

      // Also keep the toast for visibility if needed, but the inline is primary now
      if (typeof iziToast !== 'undefined') {
        iziToast.error({
            title: 'Error',
            message: error.message || "An error occurred.",
            position: "topRight"
        });
      }
    }
  };

  // Trigger fetch
  fetchUserDetails();
});

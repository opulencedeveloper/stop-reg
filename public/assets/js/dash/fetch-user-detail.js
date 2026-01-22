document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");

  if (!token) {
    window.location.href = "/";
    return;
  }

  // Increment spinner counter to track this data fetch
  if (typeof window.showSpinner === "function") {
    window.showSpinner();
  }

  try {
    const response = await fetch("https://api-stop-reg.onrender.com/api/v1/user/info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ send token here
      },
    });

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const user = data?.data || data;
      console.log("User Data:", user);

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
          const emailEndpoint = "https://api.stopreg.com/v1/email/check"; 
          emailEndpointEl.textContent = emailEndpoint;
          emailEndpointEl.dataset.fullText = emailEndpoint;
      }

      if (domainEndpointEl) {
          const domainEndpoint = "https://api.stopreg.com/v1/domain/check";
          domainEndpointEl.textContent = domainEndpoint;
          domainEndpointEl.dataset.fullText = domainEndpoint;
      }

      // Update the legacy API link with the token section
      if (apiToken) {
        const linkContainer = document.querySelector(".link-container");
        if (linkContainer) {
          const newLink = ` https://api-stop-reg.onrender.com/api/v1/check/${apiToken}?email=test@test.com`;
          linkContainer.href = newLink;
          
          const linkTitle = linkContainer.querySelector(".token-link-title");
          if (linkTitle) {
            linkTitle.textContent = newLink;
          }
        }
      }

      console.log("token element", tokenElement);

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

      // Update plan information
      const userDetails = user.userDetails;
      if (userDetails) {
        // Update all expiration date elements
        const expiresDateEls = document.querySelectorAll(".Current-plan-date");
        if (userDetails.tokenExpiresAt) {
          const expiresDate = new Date(userDetails.tokenExpiresAt);
          const formattedDate = expiresDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          expiresDateEls.forEach(el => {
            el.textContent = `Expires: ${formattedDate}`;
          });
        }

        // Update all plan name elements
        const planNameEls = document.querySelectorAll(".Current-plan-plan");
        if (userDetails.planId?.name) {
          planNameEls.forEach(el => {
             el.textContent = `${userDetails.planId.name} Account`;
          });
        }

        // Update all API requests left elements
        const apiRequestLeftEls = document.querySelectorAll(".api-request-left, .dash-api-hd-subtl");
        if (userDetails.planId) {
          const apiRequestLeft = userDetails.apiRequestLeft ?? 0;
          const durationInDays = userDetails.planId.durationInDays ?? 30;
          apiRequestLeftEls.forEach(el => {
            el.textContent = `${apiRequestLeft} API requests in ${durationInDays} days`;
          });
        }

        // Update payments page plan text
        const paymentsPlanTextEl = document.querySelector(
          ".payments-hd-sect-two"
        );
        const paymentsDescriptionEl = document.querySelector(
          ".payments-hd-sect-one-stle"
        );
        if (userDetails.planId?.name) {
          const planName = userDetails.planId.name;
          const isFreePlan = planName.toLowerCase() === "free";

          if (paymentsPlanTextEl) {
            paymentsPlanTextEl.textContent = `Currently on ${planName.toLowerCase()} plan`;
          }

          // Update description text based on plan type
          if (paymentsDescriptionEl) {
            if (isFreePlan) {
              paymentsDescriptionEl.textContent =
                "Upgrade now to get started with a paid plan.";
            } else {
              paymentsDescriptionEl.textContent =
                "Manage your subscription or upgrade to a higher plan.";
            }
          }
        }
      }
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      } else {
        const errorMessage = data.description || data.message || "Failed to fetch user information.";
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: errorMessage,
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      }
    }
  } catch (error) {
    console.error("Network error:", error);
    if (typeof iziToast !== 'undefined') {
      iziToast.error({
        title: 'Network Error',
        message: "Network error — please try again later.",
        position: "topRight",
        timeout: 5000,
        drag: false,
        displayMode: 1,
        zindex: 100000000,
      });
    }
  } finally {
    // Hide spinner after data is loaded
    if (typeof window.hideSpinner === "function") {
      window.hideSpinner();
    }
  }
});

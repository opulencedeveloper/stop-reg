 
document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");

  const tokenElement = document.querySelector(".main-token");

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
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

      if (tokenElement) {
        tokenElement.textContent = user.userDetails.apiToken || "No token";
        console.log(tokenElement.textContent);
      }

      document.getElementById("user-name").textContent = user.name || "Unknown";
      document.getElementById("user-email").textContent =
        user.email || "No email";
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }
});

 
  
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
    const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
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

      // Update the API link with the token
      if (apiToken) {
        const linkContainer = document.querySelector(".link-container");
        if (linkContainer) {
          const newLink = ` https://api.stopreg.com/api/v1/check/${apiToken}?email=test@test.com`;
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
        // Update expiration date
        const expiresDateEl = document.querySelector(".Current-plan-date");
        if (expiresDateEl && userDetails.tokenExpiresAt) {
          const expiresDate = new Date(userDetails.tokenExpiresAt);
          const formattedDate = expiresDate.toLocaleDateString("en-US", {
            day: "numeric",
            month: "long",
            year: "numeric",
          });
          expiresDateEl.textContent = `Expires: ${formattedDate}`;
        }

        // Update plan name
        const planNameEl = document.querySelector(".Current-plan-plan");
        if (planNameEl && userDetails.planId?.name) {
          planNameEl.textContent = `${userDetails.planId.name} Account`;
        }

        // Update API requests left
        const apiRequestLeftEl = document.querySelector(".api-request-left");
        if (apiRequestLeftEl && userDetails.planId) {
          const apiRequestLeft = userDetails.apiRequestLeft ?? 0;
          const durationInDays = userDetails.planId.durationInDays ?? 30;
          apiRequestLeftEl.textContent = `${apiRequestLeft} API requests in ${durationInDays} days`;
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

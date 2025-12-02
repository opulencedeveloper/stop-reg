 

=======
  
const regenerateBtn = document.querySelector(".ratoken-btn");

regenerateBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("authToken");

  const originalText = regenerateBtn.textContent;
  regenerateBtn.disabled = true;
  regenerateBtn.innerHTML = `<span class="btn-spinner"></span> Requesting...`;

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(
      "https://api.stopreg.com/api/v1/user/regenerate/token",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const user = data?.data || data;
      console.log("New token:", user);

      const tokenElement = document.querySelector(".main-token");
      if (tokenElement && user.userDetails?.apiToken) {
        tokenElement.textContent = user.userDetails.apiToken;
      }

      document.getElementById("user-name").textContent = user.name || "Unknown";
      document.getElementById("user-email").textContent =
        user.email || "No email";

      console.log("✅ Token regenerated successfully!");
    } else {
      console.error("Error regenerating token:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  } finally {
    regenerateBtn.disabled = false;
    regenerateBtn.textContent = originalText;
  }
});

regenerateBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("authToken");

  const originalText = regenerateBtn.textContent;
  regenerateBtn.disabled = true;
  regenerateBtn.innerHTML = `<span class="btn-spinner"></span> Requesting...`;

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch(
      "https://api.stopreg.com/api/v1/user/regenerate/token",
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const newApiToken = data?.data?.apiToken;
      console.log("New token:", newApiToken);

      if (newApiToken) {
        // Update the token display
        const tokenElement = document.querySelector(".main-token");
        if (tokenElement) {
          tokenElement.textContent = newApiToken;
        }

        // Update the link href and text
        const linkContainer = document.querySelector(".link-container");
        if (linkContainer) {
          const newLink = ` https://api.stopreg.com/api/v1/check/${newApiToken}?email=test@test.com`;
          linkContainer.href = newLink;
          
          // Update the link text if it exists
          const linkTitle = linkContainer.querySelector(".token-link-title");
          if (linkTitle) {
            linkTitle.textContent = newLink;
          }
        }

        // Show success toast
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            title: 'Success',
            message: "API token regenerated successfully!",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      } else {
        // Show error if no token in response
        if (typeof iziToast !== 'undefined') {
          iziToast.error({
            title: 'Error',
            message: "Failed to regenerate token. Please try again.",
            position: "topRight",
            timeout: 5000,
            drag: false,
            displayMode: 1,
            zindex: 100000000,
          });
        }
      }
    } else {
      console.error("Error regenerating token:", data);
      
      const errorMessage = data.description || data.message || "Failed to regenerate token.";
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

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error);
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
    regenerateBtn.disabled = false;
    regenerateBtn.textContent = originalText;
  }
});
 

=======
  

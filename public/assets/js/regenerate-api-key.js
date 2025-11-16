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
          const newLink = `https://api.stopreg.com/api/v1/check/${newApiToken}?email=test@test.com`;
          linkContainer.href = newLink;
          
          // Update the link text if it exists
          const linkTitle = linkContainer.querySelector(".token-link-title");
          if (linkTitle) {
            linkTitle.textContent = newLink;
          }
        }

        console.log("✅ Token regenerated successfully!");
      }
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

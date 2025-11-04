const regenerateBtn = document.querySelector(".ratoken-btn");

regenerateBtn.addEventListener("click", async () => {
  const token = localStorage.getItem("authToken");

  const originalText = regenerateBtn.textContent;
  regenerateBtn.disabled = true;
  regenerateBtn.innerHTML = `<span class="btn-spinner"></span> Requesting...`;

  if (!token) {
    window.location.href = "/login.html";
    return;
  }

  try {
    const response = await fetch(
      "https://api-stop-reg.onrender.com/api/v1/user/regenerate/token",
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
        window.location.href = "/login.html";
      }
    }
  } catch (error) {
    console.error("❌ Network error:", error);
  } finally {
    regenerateBtn.disabled = false;
    regenerateBtn.textContent = originalText;
  }
});

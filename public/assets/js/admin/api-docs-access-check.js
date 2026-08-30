/**
 * Verify that only admins can access the API Documentation page
 * Shows loading state while verifying, displays error with retry on failure
 */
document.addEventListener("DOMContentLoaded", async () => {
  const API_BASE_URL = "http://localhost:8080/api/v1/admin";
  const TOKEN_KEY = "adminToken";

  const showLoadingState = () => {
    const loadingState = document.getElementById("api-access-loading");
    const errorState = document.getElementById("api-access-error");
    const mainContent = document.querySelector(".admin-content");

    if (loadingState) loadingState.style.display = "flex";
    if (errorState) errorState.style.display = "none";
    if (mainContent) mainContent.style.display = "none";
  };

  const showErrorState = (message) => {
    const loadingState = document.getElementById("api-access-loading");
    const errorState = document.getElementById("api-access-error");
    const mainContent = document.querySelector(".admin-content");
    const errorMessage = document.getElementById("api-access-error-message");

    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "flex";
    if (mainContent) mainContent.style.display = "none";
    if (errorMessage) errorMessage.textContent = message;
  };

  const showMainContent = () => {
    const loadingState = document.getElementById("api-access-loading");
    const errorState = document.getElementById("api-access-error");
    const mainContent = document.querySelector(".admin-content");

    if (loadingState) loadingState.style.display = "none";
    if (errorState) errorState.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
  };

  const verifyAdminAccess = async () => {
    try {
      showLoadingState();

      const token = localStorage.getItem(TOKEN_KEY);

      // 1. Check if token exists
      if (!token) {
        console.warn("No admin token found. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/admin-login/index.html";
        }, 2000);
        return;
      }

      // 2. Verify admin status by fetching profile
      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // 3. Handle response
      if (!response.ok) {
        if (response.status === 401) {
          console.error("Unauthorized. Redirecting to login...");
          localStorage.removeItem(TOKEN_KEY);
          setTimeout(() => {
            window.location.href = "/admin-login/index.html";
          }, 2000);
        } else {
          showErrorState(
            "Failed to verify admin access. Please check your connection and try again."
          );
        }
        return;
      }

      const data = await response.json();
      const admin = data.data;

      // 4. Verify admin exists and has valid role
      if (!admin || !admin.role) {
        console.error("Invalid admin profile.");
        showErrorState(
          "Invalid admin profile. Please log in again."
        );
        return;
      }

      // 5. Check if super admin - show insufficient permissions if not
      if (admin.role !== "super_admin") {
        console.warn("Access denied: API Documentation requires super admin role");
        const loadingState = document.getElementById("api-access-loading");
        const errorState = document.getElementById("api-access-error");
        const insufficientView = document.getElementById("insufficient-permissions-view");
        const mainContent = document.querySelector(".admin-content");

        if (loadingState) loadingState.style.display = "none";
        if (errorState) errorState.style.display = "none";
        if (mainContent) mainContent.style.display = "none";
        if (insufficientView) insufficientView.style.display = "block";
        return;
      }

      // 6. Access granted - super admin is verified
      console.log(`Access granted: ${admin.email} (Super Admin)`);
      showMainContent();

    } catch (error) {
      console.error("Error verifying admin access:", error.message);
      showErrorState(
        "An error occurred while verifying access. Please try again."
      );
    }
  };

  // Initial verification
  verifyAdminAccess();

  // Setup retry button
  const retryBtn = document.getElementById("api-access-retry-btn");
  if (retryBtn) {
    retryBtn.addEventListener("click", verifyAdminAccess);
  }
});

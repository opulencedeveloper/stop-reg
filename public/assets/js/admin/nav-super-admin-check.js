/**
 * Show/hide Admin Management link based on Super Admin status
 */
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "https://api.stopreg.com/api/v1/admin";
  const TOKEN_KEY = "adminToken";

  const checkSuperAdminStatusAndUpdateNav = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        // Not logged in, hide admin management link
        hideAdminManagementLink();
        return;
      }

      const response = await fetch(`${API_BASE_URL}/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        hideAdminManagementLink();
        return;
      }

      const data = await response.json();
      const admin = data.data;

      if (admin.isSuperAdmin) {
        // Super Admin - show the link
        showAdminManagementLink();
      } else {
        // Regular Admin - hide the link
        hideAdminManagementLink();
      }
    } catch (error) {
      console.error("[NavSuperAdminCheck] Error checking admin status:", error);
      hideAdminManagementLink();
    }
  };

  const showAdminManagementLink = () => {
    // Show desktop navigation link
    const desktopLink = document.querySelector(
      'a[href="/admin-dashboard/admin-management.html"]'
    );
    if (desktopLink) {
      desktopLink.style.display = "flex";
    }

    // Show mobile navigation link
    const mobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/admin-management.html"]'
    );
    if (mobileLink) {
      mobileLink.style.display = "flex";
    }
  };

  const hideAdminManagementLink = () => {
    // Hide desktop navigation link
    const desktopLink = document.querySelector(
      'a[href="/admin-dashboard/admin-management.html"]'
    );
    if (desktopLink) {
      desktopLink.style.display = "none";
    }

    // Hide mobile navigation link
    const mobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/admin-management.html"]'
    );
    if (mobileLink) {
      mobileLink.style.display = "none";
    }
  };

  // Check and update nav on page load
  checkSuperAdminStatusAndUpdateNav();
});

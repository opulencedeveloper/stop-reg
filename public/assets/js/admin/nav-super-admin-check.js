/**
 * Show/hide Admin Management link based on Super Admin status
 */
document.addEventListener("DOMContentLoaded", () => {
  const API_BASE_URL = "http://localhost:8080/api/v1/admin";
  const TOKEN_KEY = "adminToken";

  const checkSuperAdminStatusAndUpdateNav = async () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);

      if (!token) {
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

      if (admin.role === "super_admin") {
        showAdminManagementLink();
      } else {
        hideAdminManagementLink();
      }
    } catch (error) {
      hideAdminManagementLink();
    }
  };

  const showAdminManagementLink = () => {
    // Show ALL desktop navigation links for admin-management
    const allDesktopLinks = document.querySelectorAll(
      'a[href="/admin-dashboard/admin-management.html"]'
    );
    allDesktopLinks.forEach((link) => {
      link.removeAttribute('style');
      link.style.display = "flex";
    });

    // Show mobile navigation link for admin-management
    const mobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/admin-management.html"]'
    );
    if (mobileLink) {
      mobileLink.removeAttribute('style');
      mobileLink.style.display = "flex";
    }

    // Show custom-plans links for super admins
    const customPlansDesktopLinks = document.querySelectorAll(
      'a[href="/admin-dashboard/custom-plans.html"]'
    );
    customPlansDesktopLinks.forEach((link) => {
      link.removeAttribute('style');
      link.style.display = "flex";
    });

    const customPlansMobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/custom-plans.html"]'
    );
    if (customPlansMobileLink) {
      customPlansMobileLink.removeAttribute('style');
      customPlansMobileLink.style.display = "flex";
    }

    // Show Assign Plan button for Super Admins
    const assignPlanBtn = document.getElementById("assign-plan-btn");
    if (assignPlanBtn) {
      assignPlanBtn.style.display = "block";
    }
  };

  const hideAdminManagementLink = () => {
    // Hide desktop navigation links for admin-management
    const desktopLinks = document.querySelectorAll(
      'a[href="/admin-dashboard/admin-management.html"]'
    );
    desktopLinks.forEach((link) => {
      link.style.display = "none";
    });

    // Hide mobile navigation link for admin-management
    const mobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/admin-management.html"]'
    );
    if (mobileLink) {
      mobileLink.style.display = "none";
    }

    // Hide custom-plans links for non-super admins
    const customPlansDesktopLinks = document.querySelectorAll(
      'a[href="/admin-dashboard/custom-plans.html"]'
    );
    customPlansDesktopLinks.forEach((link) => {
      link.style.display = "none";
    });

    const customPlansMobileLink = document.querySelector(
      '.admin-mobile-nav a[href="/admin-dashboard/custom-plans.html"]'
    );
    if (customPlansMobileLink) {
      customPlansMobileLink.style.display = "none";
    }
  };

  // Check and update nav on page load
  checkSuperAdminStatusAndUpdateNav();
});

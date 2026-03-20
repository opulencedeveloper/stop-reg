document.addEventListener("DOMContentLoaded", function () {

  // Role-Based Access Control (RBAC) - Hide Restricted Links for "Seat" Users
  const userRole = localStorage.getItem("role");
  if (userRole === "Seat") {
    const restrictedPaths = [
      "/dashboard/profile",
      "/dashboard/payments.html"
    ];

    // Hide links in Desktop/Mobile Nav & Quick Links
    restrictedPaths.forEach(path => {
      // Select all anchor tags containing the restricted path
      const links = document.querySelectorAll(`a[href*="${path}"]`);
      links.forEach(link => {
        if (link) {
          link.style.display = "none";
        }
      });
    });

    // Also explicitly hide the "Upgrade" button in header/dashboard if it exists (extra safety)
    const upgradeBtns = document.querySelectorAll('.dash-cur-plan, .btn-light-blue, .payments-hd-sect-one, #dash-plan-upgrade-btn');
    upgradeBtns.forEach(btn => {
      if (btn) btn.style.display = "none";
    });
  }
});

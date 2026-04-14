document.addEventListener("DOMContentLoaded", function () {

  // Role-Based Access Control (RBAC) - Hide Restricted Links for "Seat" Users
  const userRole = localStorage.getItem("role");
  
  if (userRole && userRole.toLowerCase() === "seat") {
    const restrictedPaths = [
      "/dashboard/payments.html",
      "payments.html"
    ];

    const hideRestrictedElements = () => {

      restrictedPaths.forEach(path => {
        // Select all anchor tags containing the restricted paths
        const links = document.querySelectorAll(`a[href*="${path}"]`);
        links.forEach(link => {
          if (link && link.style.display !== "none") {
            link.style.display = "none";
          }
        });
      });

      // Explicitly hide elements with specific classes/IDs that SEAT users shouldn't see
      const extraSelectors = [
          '.dash-cur-plan', 
          '.btn-light-blue', 
          '.payments-hd-sect-one', 
          '#dash-plan-upgrade-btn',
          '.quick-link-card[href*="payments.html"]'
      ];
      
      extraSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if (el && el.style.display !== "none") el.style.display = "none";
        });
      });
    };

    // Run immediately
    hideRestrictedElements();

    // Also run on a small interval or MutationObserver to handle dynamically loaded content
    const observer = new MutationObserver(() => {
        hideRestrictedElements();
    });
    
    observer.observe(document.body, { childList: true, subtree: true });

    // Optional: Redirect if they are on a restricted page directly
    const currentPath = window.location.pathname;
    const isRestrictedPath = restrictedPaths.some(path => currentPath.includes(path));
    if (isRestrictedPath) {
        window.location.href = "/dashboard/index.html";
    }
  }
});

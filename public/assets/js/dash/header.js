(function () {
  const userRole = localStorage.getItem("role");

  // Check if character role is 'seat' (case-insensitive)
  if (userRole && userRole.toLowerCase() === "seat") {
    
    // 1. IMPROVED: Immediate CSS injection to prevent UI flickering.
    // This runs before DOMContentLoaded so the browser knows to hide these elements as soon as they appear.
    const style = document.createElement('style');
    style.innerHTML = `
      #dash-plan-upgrade-btn,
      #dash-plan-divider,
      #dash-seats-header,
      #dash-seats-container,
      .dash-cur-plan,
      .payments-hd-sect-one,
      .quick-link-card[href*="payments.html"],
      a[href*="/dashboard/payments.html"],
      a[href*="payments.html"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);

    // 2. Functional logic for redirects and dynamic hiding
    document.addEventListener("DOMContentLoaded", function () {
      const restrictedPaths = [
        "/dashboard/payments.html",
        "payments.html"
      ];

      const hideRestrictedElements = () => {
        // Double-enforce for any links containing restricted paths
        restrictedPaths.forEach(path => {
          const links = document.querySelectorAll(`a[href*="${path}"]`);
          links.forEach(link => {
            if (link.style.display !== "none") {
                link.setAttribute('style', (link.getAttribute('style') || '') + '; display: none !important;');
            }
          });
        });

        // Specific element hiding for Seats section and Upgrade button
        const extraSelectors = [
          '#dash-plan-upgrade-btn',
          '#dash-plan-divider',
          '#dash-seats-header',
          '#dash-seats-container',
          '.quick-link-card[href*="payments.html"]'
        ];

        extraSelectors.forEach(selector => {
          document.querySelectorAll(selector).forEach(el => {
              if (el.style.display !== "none") {
                el.setAttribute('style', (el.getAttribute('style') || '') + '; display: none !important;');
              }
          });
        });
      };

      // Run on load
      hideRestrictedElements();

      // Monitor for dynamically added elements (like chart legends or seats being rendered)
      const observer = new MutationObserver(() => {
        hideRestrictedElements();
      });
      observer.observe(document.body, { childList: true, subtree: true });

      // Handle direct navigation attempts to restricted pages
      const currentPath = window.location.pathname;
      const isRestrictedPath = restrictedPaths.some(path => currentPath.includes(path));
      if (isRestrictedPath) {
        window.location.href = "/dashboard/index.html";
      }
    });
  }
})();

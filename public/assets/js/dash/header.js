document.addEventListener("DOMContentLoaded", function () {
  const logOutoverLay = document.getElementById("logout-overlay");
  const logOutButton = document.getElementById("logout-button");
  const mobileLogOutButton = document.getElementById("mobile-logout-button");
  const closeLogOutDialogBtn = document.getElementById("n-log-out");
  const logoutContainer = document.getElementById("logout-container");

  logOutButton.addEventListener("click", function () {
    logOutoverLay.style.display = "flex";
    document.body.classList.add("hidden-overflow");
  });

  mobileLogOutButton.addEventListener("click", function () {
    logOutoverLay.style.display = "flex";
    document.body.classList.add("hidden-overflow");
    navIcons.classList.remove("open");
    navMenu.classList.remove("active");
    document.body.classList.remove("hidden-overflow");
  });

  closeLogOutDialogBtn.addEventListener("click", function () {
    logoutContainer.classList.add("fadeOut");

    logoutContainer.addEventListener(
      "animationend",
      function () {
        logoutContainer.classList.remove("fadeOut");
        logOutoverLay.style.display = "none";
        document.body.classList.remove("hidden-overflow");
      },
      { once: true }
    );
  });

  var navIcons = document.querySelector(".nav-icon2");
  var navCloseBtn = document.querySelector(".nav-close-btn");
  const navMenu = document.querySelector(".nav-menu");

  navIcons.addEventListener("click", function () {
    this.classList.add("open");
    navMenu.classList.add("active");
    document.body.classList.add("hidden-overflow");
  });

  navCloseBtn.addEventListener("click", function () {
    navIcons.classList.remove("open");
    navMenu.classList.remove("active");
    document.body.classList.remove("hidden-overflow");
  });

  // Manual Logout Handler
  const confirmLogoutBtn = document.querySelector('.y-log-out');
  if (confirmLogoutBtn) {
    confirmLogoutBtn.addEventListener('click', function (e) {
      e.preventDefault(); 
      window.clearUserSession();
      window.location.href = "/sign-in.html";
    });
  }

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

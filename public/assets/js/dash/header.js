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

  // });
});

// const hamburger = document.querySelector(".hamburger");

// hamburger.addEventListener("click", () => {
//     console.log("clicked")
//     hamburger.classList.toggle("active");
//     // navMenu.classList.toggle("active");
//   });

window.onload = function () {
  const accordionButtons = document.querySelectorAll(".accordion-button");
  const monthlyBtn = document.querySelector(".land-pricing-sect-mth");
  const yearlyBtn = document.querySelector(".land-pricing-sect-yr");
  const selector = document.querySelector(".land-pricing-sect-selctor");
  const monthlyContent = document.querySelector(".land-cont-mnth");
  const yearlyContent = document.querySelector(".land-cont-yr");
  const landPricingSectMthBtn = document.querySelector(
    ".land-pricing-sect-mth"
  );
  const landPricingSectYrBtn = document.querySelector(".land-pricing-sect-yr");
  var navIcons = document.querySelector('.nav-icon2');
  const navMenu = document.querySelector(".nav-menu");

  if (accordionButtons) {
    accordionButtons.forEach((button) => {
      button.addEventListener("click", function () {
        const content = this.nextElementSibling;

        if (content.style.maxHeight) {
          content.style.maxHeight = null;

          this.classList.remove("active");
        } else {
          content.style.maxHeight = content.scrollHeight + "px";

          this.classList.add("active");
        }

        accordionButtons.forEach((otherButton) => {
          if (otherButton !== this) {
            const otherContent = otherButton.nextElementSibling;

            otherContent.style.maxHeight = null;

            otherButton.classList.remove("active");
          }
        });
      });
    });
  }

  if (monthlyBtn) {
    monthlyBtn.addEventListener("click", function () {
      selector.style.transform = "translateX(10%)";
      monthlyContent.classList.add("active");
      yearlyContent.classList.remove("active");
      landPricingSectMthBtn.classList.add("active-btn");
      landPricingSectYrBtn.classList.remove("active-btn");
    });
  }

  if (yearlyBtn) {
    yearlyBtn.addEventListener("click", function () {
      selector.style.transform = "translateX(100%)";
      yearlyContent.classList.add("active");
      monthlyContent.classList.remove("active");
      landPricingSectYrBtn.classList.add("active-btn");
      landPricingSectMthBtn.classList.remove("active-btn");
    });
  }

  function startProgress(progressBarId, progressLabelId, limit) {
    let progress = 0;
    const progressBar = document.getElementById(progressBarId);
    const progressLabel = document.getElementById(progressLabelId);

    if (progressBar && progressBar) {
      const interval = setInterval(() => {
        if (progress >= limit) {
          clearInterval(interval);
        } else {
          progress += 1;
          progressLabel.innerHTML = progress + "%";
          progressBar.style.width = progress + "%";
        }
      }, 20);
    }
  }

  startProgress("prog-1", "prog-1-label", 100);
  startProgress("prog-2", "prog-2-label", 98);
  startProgress("prog-3", "prog-3-label", 92);

  const docsScrollButton = document.querySelectorAll(".docsScrollButton");
  if (docsScrollButton) {
    docsScrollButton.forEach((button) => {
      button.addEventListener("click", function () {
        // Remove active class from all buttons
        document.querySelectorAll(".docsScrollButton").forEach((btn) => {
          btn.classList.remove("active-docume-list-item");
        });
  
        // Add active class to the clicked button
        this.classList.add("active-docume-list-item");
  
        // Get the target element and offset
        const targetId = this.getAttribute("policy-data-target");
        const targetElement = document.getElementById(targetId);
        const offset = 140; // offset in px
  
        if (targetElement) {
          // Calculate the position to scroll with offset
          const elementRect = targetElement.getBoundingClientRect();
          const elementTop = elementRect.top + window.pageYOffset;
          const offsetPosition = elementTop - offset;
  
          // Scroll to the adjusted position
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        } else {
          console.warn(`Element with ID ${targetId} not found`);
        }
      });
    });
  }
  

  // if (docsScrollButton) {
  //   docsScrollButton.forEach((button) => {
  //     button.addEventListener("click", function () {
  //       // Remove active class from all buttons
  //       document.querySelectorAll(".docsScrollButton").forEach((btn) => {
  //         btn.classList.remove("active-docume-list-item");
  //       });

  //       // Add active class to the clicked button
  //       this.classList.add("active-docume-list-item");

  //       // Scroll the target item into view
  //       const targetId = this.getAttribute("policy-data-target");
  //       const targetElement = document.getElementById(targetId);
  //       const offset = 40; // offset in px
  //       const bodyRect = document.body.getBoundingClientRect().top;
  //       const elementRect = targetElement.getBoundingClientRect().top;
  //       const elementPosition = elementRect - bodyRect;
  //       const offsetPosition = elementPosition - offset;

  //       if (targetElement) {
  //         targetElement.scrollIntoView({
  //           behavior: "smooth",
  //           block: "start",
  //         });
  //       } else {
  //         console.warn(`Element with ID ${targetId} not found`);
  //       }
  //     });
  //   });
  // }

  const sectionScroller = document.querySelectorAll(".section-scroller");


  if (sectionScroller) {
    sectionScroller.forEach((button) => {
      button.addEventListener("click", function () {
       
        const targetId = this.getAttribute("content-data-target");
        const targetElement = document.getElementById(targetId);
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        overLay.style.display = "none";

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        } else {
          console.warn(`Element with ID ${targetId} not found`);
        }
      });
    });
  }

  const nav = document.querySelector(".docume-content-nav");

  if (nav) {
    window.addEventListener("scroll", function () {
      // Get the distance from the top of the viewport to the top of the nav element
      const navTop = nav.getBoundingClientRect().top;
      
      // Add or remove the class based on the scroll position
      if (navTop <= 100) {
        nav.classList.add("row");
      } else {
        nav.classList.remove("row");
      }
    });
  }
  

  const overLay = document.getElementById("overlay");
  const signUpOverLayBtns = document.querySelectorAll(".signup-overlay-btn");
  const signInOverLayBtns = document.querySelectorAll(".signin-overlay-btn");
  const signupDialog = document.getElementById("signup-dialog");
  const signinDialog = document.getElementById("signin-dialog");

  if (signUpOverLayBtns) {
    signUpOverLayBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        overLay.style.display = "flex";
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        signupDialog.style.display = "block";
        signupDialog.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
      });
        signinDialog.style.display = "none";
        document.body.classList.add("hidden-overflow");
      });
    });
  }

  if (signInOverLayBtns) {
    signInOverLayBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        overLay.style.display = "flex";
        signinDialog.style.display = "block";
        signinDialog.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
      });
        navIcons.classList.remove("open");
        navMenu.classList.remove("active")
        signupDialog.style.display = "none";
        document.body.classList.add("hidden-overflow");
      });
    });
  }

  const signUpClose = document.getElementById("signup-close-btn");
  if (signUpClose) {
    signUpClose.addEventListener("click", () => {
      signupDialog.classList.add("fadeOut");

      signupDialog.addEventListener(
        "animationend",
        function () {
          signupDialog.classList.remove("fadeOut");
          overLay.style.display = "none";
          document.body.classList.remove("hidden-overflow");
        },
        { once: true }
      );
    });
  }

  const signinCloseBtn = document.getElementById("signin-close-btn");
  if (signinCloseBtn) {
    signinCloseBtn.addEventListener("click", () => {
      signinDialog.classList.add("fadeOut");

      signinDialog.addEventListener(
        "animationend",
        function () {
          signinDialog.classList.remove("fadeOut");
          overLay.style.display = "none";
          document.body.classList.remove("hidden-overflow");
        },
        { once: true }
      );
    });
  }

  const toggleSignInPassword = document.getElementById("signin-password-btn");
  const signInPassword = document.getElementById("signin-password");

  if (toggleSignInPassword) {
    toggleSignInPassword.addEventListener("click", function (e) {
      const passwordType =
      signInPassword.getAttribute("type") === "password" ? "text" : "password";
  
      signInPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignInPassword.setAttribute("src", passwordIconSrc);
    });
  }


  const toggleSignUpPassword = document.getElementById("signup-password-btn");
  const signUpPassword = document.getElementById("signup-password");

  if (toggleSignUpPassword) {
    toggleSignUpPassword.addEventListener("click", function (e) {
      const passwordType =
       signUpPassword.getAttribute("type") === "password" ? "text" : "password";
  
     signUpPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignUpPassword.setAttribute("src", passwordIconSrc);
    });
  }

  const toggleSignUpCPassword = document.getElementById("signup-cpassword-btn");
  const cPassword = document.getElementById("signup-cpassword");

  if (toggleSignUpCPassword) {
    toggleSignUpCPassword.addEventListener("click", function (e) {
      const passwordType =
      cPassword.getAttribute("type") === "password" ? "text" : "password";
  
      cPassword.setAttribute("type", passwordType);
  
      const passwordIconSrc =
        passwordType === "password"
          ? "/assets/icons/obsured.svg"
          : "/assets/icons/obsure.svg";
  
      toggleSignUpCPassword.setAttribute("src", passwordIconSrc);
    });
  }
};

// document.getElementById("navigate-button").addEventListener("click", function() {
//   window.location.href = "page2.html#section2";
// });

// if(closeOverLayBtnLogout) {
//   closeOverLayBtnLogout.addEventListener("click", () => {
//     overlayDialogLogout.classList.add("fadeOut");

//     overlayDialogLogout.addEventListener(
//       "animationend",
//       function () {
//         overlayDialogLogout.classList.remove("fadeOut");
//         overlayLogout.style.display = "none";
//       },
//       { once: true }
//     );
//   });
// }

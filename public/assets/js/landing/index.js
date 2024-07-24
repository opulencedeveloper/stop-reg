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

  if(accordionButtons) {
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


if(monthlyBtn) {
  monthlyBtn.addEventListener("click", function () {
    selector.style.transform = "translateX(10%)";
    monthlyContent.classList.add("active");
    yearlyContent.classList.remove("active");
    landPricingSectMthBtn.classList.add("active-btn");
    landPricingSectYrBtn.classList.remove("active-btn");
  });
}

if(yearlyBtn) {
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

    if(progressBar && progressBar) {

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

  startProgress("prog-1", "prog-1-label", 96);
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
  
          // Scroll the target item into view
          const targetId = this.getAttribute("policy-data-target");
          const targetElement = document.getElementById(targetId);
          
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
  

    window.addEventListener('scroll', function() {
      const nav = document.querySelector('.docume-content-nav');
      const navTop = nav.offsetTop;
      if (window.scrollY > navTop) {
          nav.classList.add('row');
      } else {
          nav.classList.remove('row');
      }
  });
  
  const signUpOverLay = document.getElementById("signup-overlay");
  const signUpOverLayBtn = document.getElementById("signup-overlay-btn");
  if(signUpOverLayBtn) {
    signUpOverLayBtn.addEventListener("click", () => {
      signUpOverLay.style.display = "flex";
      document.body.classList.add('hidden-overflow');
    });
    
  }

};

document.addEventListener("DOMContentLoaded", function () {
    const reportDomainOverlay = document.getElementById("report-domain-overlay");
    const reportDomainBtn = document.getElementById("report-domain-btn");
   // const mobilereportDomainBtn = document.getElementById("mobile-logout-button");
    const closeReportDialogBtn = document.getElementById("close-report-container-btn");
    const reportContainer = document.getElementById("report-container");
  
    // Only add event listeners if elements exist
    if (reportDomainBtn && reportDomainOverlay) {
      reportDomainBtn.addEventListener("click", function () {
        reportDomainOverlay.style.display = "flex";
        document.body.classList.add("hidden-overflow");
      });
    }
  
    // mobilereportDomainBtn.addEventListener("click", function () {
    //   reportDomainOverlay.style.display = "flex";
    //   document.body.classList.add("hidden-overflow");
    //   navIcons.classList.remove("open");
    //   navMenu.classList.remove("active");
    //   document.body.classList.remove("hidden-overflow");
    // });
  
    if (closeReportDialogBtn && reportContainer && reportDomainOverlay) {
      closeReportDialogBtn.addEventListener("click", function () {
        reportContainer.classList.add("fadeOut");
  
        reportContainer.addEventListener(
          "animationend",
          function () {
            reportContainer.classList.remove("fadeOut");
            reportDomainOverlay.style.display = "none";
            document.body.classList.remove("hidden-overflow");
          },
          { once: true }
        );
      });
    }
});

function goBack() {
  window.history.back();
}
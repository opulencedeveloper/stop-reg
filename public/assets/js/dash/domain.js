document.addEventListener("DOMContentLoaded", function () {
   const  fetchUserDetial = async () => {
   const token = localStorage.getItem("authToken");

  const tokenElement = document.querySelector(".main-token");

  if (!token) {
    window.location.href = "/";
    return;
  }

  try {
    const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // ✅ send token here
      },
    });

    const data = await response.json();
    console.log("User Info Response:", data);

    if (response.ok) {
      const user = data?.data || data;
      console.log("User Data:", user);

      if (tokenElement) {
        tokenElement.textContent = user.userDetails.apiToken || "No token";
        console.log(tokenElement.textContent);
      }

      // document.getElementById("user-name").textContent = user.name || "Unknown";
      // document.getElementById("user-email").textContent =
      //   user.email || "No email";
    } else {
      console.error("Error fetching user:", data);

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        window.location.href = "/";
      }
    }
  } catch (error) {
    console.error("Network error:", error);
  }

  }
  
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
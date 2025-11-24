// Spinner utility functions for dashboard pages
window.spinnerCount = 0; // Track number of active data fetches

window.showSpinner = function() {
  window.spinnerCount++;
  const spinner = document.getElementById("spinner-body");
  const content = document.getElementById("content");
  if (spinner) {
    spinner.style.display = "flex";
  }
  if (content) {
    content.style.display = "none";
  }
  document.body.classList.add('hidden-overflow');
};

window.hideSpinner = function() {
  window.spinnerCount = Math.max(0, window.spinnerCount - 1);
  // Only hide spinner if no other fetches are in progress
  if (window.spinnerCount === 0) {
    setTimeout(() => {
      // Small delay to ensure all scripts have finished
      if (window.spinnerCount === 0) {
        const spinner = document.getElementById("spinner-body");
        const content = document.getElementById("content");
        if (spinner) {
          spinner.style.display = "none";
        }
        if (content) {
          content.style.display = "block";
        }
        document.body.classList.remove('hidden-overflow');
      }
    }, 100);
  }
};

// Initial page load spinner
const content = document.getElementById("content");
const spinner = document.getElementById("spinner-body");

if (content) {
  content.style.display = "none";
}
if (spinner) {
  document.body.classList.add('hidden-overflow');
}

window.addEventListener("load", function () {
    // For landing pages, hide spinner immediately
    // For dashboard pages, keep it visible until data loads
    const isDashboardPage = window.location.pathname.includes('/dashboard/') || 
                           window.location.pathname.includes('api-check.html');
    
    if (!isDashboardPage) {
      if (spinner) {
        spinner.style.display = "none";
      }
      document.body.classList.remove('hidden-overflow');
      if (content) {
        content.style.display = "block";
      }
    } else {
      // Dashboard pages will hide spinner via hideSpinner() after data loads
      // Keep spinner visible for now - increment counter so it stays visible
      window.spinnerCount = 1;
    }


    const observerOptions = {
      root: null,
      rootMargin: "0px",
      threshold: 0.2,
    };
  
    const observerCallback = (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible-ani");
          observer.unobserve(entry.target);
        }
      });
    };
  
    const observer = new IntersectionObserver(observerCallback, observerOptions);
  
    const boxes = document.querySelectorAll(".box");
    boxes.forEach((box) => {
      observer.observe(box);
    });
  });


  
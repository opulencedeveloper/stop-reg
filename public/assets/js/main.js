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
          
          // Handle anchor scrolling after reveal
          if (window.location.hash) {
            const id = window.location.hash.substring(1);
            const target = document.getElementById(id);
            if (target) {
              // Small timeout to ensure layout is done
            if (target) {
              // Small timeout to ensure layout is done
              setTimeout(() => {
                const headerOffset = 100; // Adjust based on header height (~80px) + gap
                const elementPosition = target.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.scrollY - headerOffset;
  
                window.scrollTo({
                  top: offsetPosition,
                  behavior: "smooth"
                });
                
                // Optional: Highlight it briefly
                target.classList.add('highlight-pulse');
              }, 100);
            }
            }
          }
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
    // verify-email.html is a special case - it doesn't need initial data fetch
    const isDashboardPage = window.location.pathname.includes('/dashboard/');
    const isApiCheckPage = window.location.pathname.includes('api-check');
    
    if (!isDashboardPage && !isApiCheckPage) {
      // Landing pages - hide spinner immediately
      if (spinner) {
        spinner.style.display = "none";
      }
      document.body.classList.remove('hidden-overflow');
      if (content) {
        content.style.display = "block";
      }
    } else if (isApiCheckPage) {
      // verify-email.html - hide spinner immediately since it doesn't need data fetch
      if (spinner) {
        spinner.style.display = "none";
      }
      document.body.classList.remove('hidden-overflow');
      if (content) {
        content.style.display = "block";
      }
    } else {
      // Dashboard pages will hide spinner via hideSpinner() after data loads
      // No longer setting initial count here; scripts should call showSpinner/hideSpinner
    }


    function initScrollAnimations(scope = "all") {
        const observerOptions = {
          root: null,
          rootMargin: "0px",
          threshold: 0.1,
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
      
        let selector = ".box";
        if (scope === "header") {
            // Immediate: Only the main navigation header
            selector = ".main-head-wrapper.box";
        } else if (scope === "body") {
            // Delayed: Everything ELSE (Hero sections, etc.)
            // We use :not() to exclude the main header if we can, or just query all and filter
            selector = ".box:not(.main-head-wrapper)";
        }

        const boxes = document.querySelectorAll(selector);
        boxes.forEach((box) => {
          observer.observe(box);
        });
    }

    // Unified Gating: Animate everything only AFTER overlay lifts
    if (document.querySelector('.entrance-overlay')) {
        window.addEventListener('entrance-complete', () => {
            initScrollAnimations("all");
        });
    } else {
        // Fallback: If no overlay, animate everything immediately
        initScrollAnimations("all");
    }
  });


  
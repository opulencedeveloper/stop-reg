// Session & Authentication Helper
window.clearUserSession = function() {
  localStorage.removeItem("authToken");
  localStorage.removeItem("role");
  localStorage.removeItem("planName");
  // Add any other session-related items here in the future
};

// Global plan cache to prevent redundant fetches on the same page load
let userPlanPromise = null;

window.getUserPlan = async function() {
  const token = localStorage.getItem("authToken");
  if (!token) return null;

  // Return existing promise if one is already in flight or completed
  if (userPlanPromise) return userPlanPromise;

  userPlanPromise = (async () => {
    try {
      const response = await fetch("https://api.stopreg.com/api/v1/user/info", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        const planName = data?.data?.userDetails?.planId?.name;
        if (planName) {
           localStorage.setItem("planName", planName); // Sync for compatibility
           return planName;
        }
      }
      
      // Fallback to localStorage if API fails but we have a cached value
      return localStorage.getItem("planName");
    } catch (error) {
      console.error("Error fetching user plan:", error);
      return localStorage.getItem("planName");
    }
  })();

  return userPlanPromise;
};

window.handleAuthError = async function(error, source = "API") {
  // Only log if it's an actual error (not a successful Response or 200/201 status)
  const isSuccess = (error instanceof Response && error.ok) || (typeof error === 'number' && (error === 200 || error === 201));
  if (!isSuccess) {
    console.error(`${source} Error:`, error);
  }
  
  // Determine status code
  let status = typeof error === 'number' ? error : (error && error.status);
  
  // If no direct status, try to extract from message (legacy support)
  if (!status && error && error.message) {
    if (error.message.includes("401")) status = 401;
    if (error.message.includes("403")) status = 403;
  }

  // 401 Unauthorized or Expired
  if (status === 401) {
    window.clearUserSession();
    window.location.href = "/sign-in.html";
    return true;
  }
  
  // 403 Forbidden (Only eject if explicitly suspended)
  if (status === 403) {
    // If it's a Response object, we can inspect the body surgically
    if (error instanceof Response) {
      try {
        const data = await error.clone().json();
        if (data && (data.message === "user_suspended" || (data.description && data.description.toLowerCase().includes("suspended")))) {
          const message = data.description || "Your account has been suspended. Please contact support.";
          
          // Show toast before redirecting
          if (typeof iziToast !== 'undefined') {
            iziToast.error({
              title: 'Account Suspended',
              message: message,
              position: 'topRight',
              timeout: 3000,
              onClosing: function() {
                window.clearUserSession();
                window.location.href = "/sign-in.html?error=suspended";
              }
            });
            // Fallback redirect in case onClosing doesn't fire or takes too long
            setTimeout(() => {
              window.clearUserSession();
              window.location.href = "/sign-in.html?error=suspended";
            }, 3500);
          } else {
            // No toast library, just eject
            window.clearUserSession();
            window.location.href = "/sign-in.html?error=suspended";
          }
          return true;
        }
      } catch (e) {
        console.warn("Failed to parse 403 response body for suspension check:", e);
      }
    }
    
    // For other 403s (RBAC/Access Denied), we return false to let the component handle it
    return false;
  }
  
  return false;
};

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
            selector = ".main-head-wrapper.box";
        } else if (scope === "body") {
            selector = ".box:not(.main-head-wrapper)";
        }

        const boxes = document.querySelectorAll(selector);
        boxes.forEach((box) => {
          observer.observe(box);
        });
    }

    function initFooterAnimations() {
      const footerSection = document.querySelector(".land-foot");
      if (footerSection) {
        const footerBrand = footerSection.querySelector(".foot-col-brand");
        const footerCols = footerSection.querySelectorAll(".foot-links-group .foot-col");
        const footerBottom = footerSection.querySelector(".land-foot-wrapp-sct-two");

        const footerObserver = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              if (footerBrand) footerBrand.classList.add("footer-animate-in");
              footerCols.forEach((col, index) => {
                setTimeout(() => {
                  col.classList.add("footer-animate-in");
                }, 150 + (index * 150));
              });
              if (footerBottom) {
                setTimeout(() => {
                  footerBottom.classList.add("footer-animate-in");
                }, 600);
              }
              footerObserver.unobserve(entry.target);
            }
          });
        }, { threshold: 0.1 });

        footerObserver.observe(footerSection);
        
        // Safety: If footer is already in view or observer fails to fire
        setTimeout(() => {
           if (footerBrand && !footerBrand.classList.contains('footer-animate-in')) {
              footerBrand.classList.add("footer-animate-in");
              footerCols.forEach(col => col.classList.add("footer-animate-in"));
              if (footerBottom) footerBottom.classList.add("footer-animate-in");
           }
        }, 2000);
      }
    }

    // Unified Gating: Animate everything only AFTER overlay lifts
    if (document.querySelector('.entrance-overlay')) {
        window.addEventListener('entrance-complete', () => {
            initScrollAnimations("all");
            initFooterAnimations();
            checkForSuspensionError();
        });
    } else {
        // Fallback: If no overlay, animate everything immediately
        initScrollAnimations("all");
        initFooterAnimations();
        checkForSuspensionError();
    }

    function checkForSuspensionError() {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('error') === 'suspended' && typeof iziToast !== 'undefined') {
        iziToast.error({
          title: "Account Suspended",
          message: "Your account has been suspended. Please contact support for more information.",
          position: "topRight",
          timeout: 10000,
          close: true,
          drag: false
        });
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  });

document.addEventListener("DOMContentLoaded", function () {
    // Generic Copy Functionality for all .copy-btn elements
    document.body.addEventListener("click", async function (e) {
        // specific check for the new copy buttons or elements inside them (like the image)
        const copyBtn = e.target.closest(".copy-btn");
        
        // Also handle the legacy .dash-copy-btn if it exists and is clicked
        const legacyCopyBtn = e.target.closest(".dash-copy-btn");

        if (copyBtn) {
            handleCopy(copyBtn);
        } else if (legacyCopyBtn) {
            handleCopy(legacyCopyBtn); // Reuse same logic if structure allows, or keep separate if needed
        }
    });

    async function handleCopy(btn) {
        try {
            let textToCopy = "";
            let container = btn.closest(".copy-input-field") || btn.closest(".token-con");
            
            // Try to find the text element
            // New UI: sibling .truncated-text with data-full-text
            // Legacy UI: sibling .main-token (text content)
            
            if (container) {
                const textEl = container.querySelector(".truncated-text") || container.querySelector(".main-token");
                if (textEl) {
                    textToCopy = textEl.dataset.fullText || textEl.textContent.trim();
                }
            }

            if (!textToCopy) {
                console.warn("No text found to copy");
                return;
            }

            await navigator.clipboard.writeText(textToCopy);

            // Visual Feedback
            const originalHTML = btn.innerHTML;
            
            // For new buttons, we might want to just change text or icon
            // The design has an icon + "Copy". We can change it to "Copied!"
            
            // Simplified feedback:
            btn.classList.add("copied");
            const textSpan = btn.innerText.includes("Copy") ? "Copied!" : "Copied!";
            
            // Preserve icon if possible, or just swap innerHTML
            if (btn.querySelector("img")) {
                 // Keep icon check mark maybe? For now just text change is safest
                 btn.innerHTML = `<img src="/assets/icons/copy.svg" alt="Copied" /> Copied!`;
            } else {
                btn.textContent = "Copied!";
            }
            
            if (typeof iziToast !== 'undefined') {
                iziToast.success({
                    message: "Copied to clipboard!",
                    position: "topRight",
                    drag: false,
                    displayMode: 1,
                    timeout: 2000
                });
            }

            // Revert after 2 seconds
            setTimeout(() => {
                btn.classList.remove("copied");
                btn.innerHTML = originalHTML;
            }, 2000);

        } catch (err) {
            console.error("Copy failed:", err);
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    message: "Failed to copy",
                    position: "topRight"
                });
            }
        }
    }
});

// Dynamic Public Auth Navigation & Global Dashboard Guard
document.addEventListener("DOMContentLoaded", function () {
  const TOKEN_KEY = "authToken";
  const token = localStorage.getItem(TOKEN_KEY);
  const isDashboardPage = window.location.pathname.includes('/dashboard/');

  // 1. Global Dashboard Guard: Strictly enforce user sessions
  if (isDashboardPage && !token) {
    console.warn("No authentication session found. Redirecting to login...");
    window.location.href = "/sign-in.html";
    return;
  }

  // 2. Global Logout Functionality (Injection & Delegation)
  const injectLogoutOverlay = () => {
    let overlay = document.getElementById('logout-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'logout-overlay';
      overlay.className = 'overlay';
      overlay.innerHTML = `
        <div id="logout-container" class="logout-container overlay-animate">
          <div class="logout-icon">
            <img src="/assets/icons/logout.svg" alt="Logout" />
          </div>
          <p class="logout-tle">Log Out?</p>
          <p class="logout-subtle">Are you sure you want to proceed?</p>
          <div class="logout-actions">
            <button id="logout-confirm-btn" class="y-log-out">Log Out</button>
            <button id="logout-cancel-btn" class="n-log-out">Cancel</button>
          </div>
        </div>
      `;
      document.body.appendChild(overlay);
    }

    // Bind overlay actions
    // Support both standardized IDs and legacy dashboard IDs/classes
    const confirmBtn = document.getElementById('logout-confirm-btn') || overlay.querySelector('.y-log-out');
    const cancelBtn = document.getElementById('logout-cancel-btn') || document.getElementById('n-log-out');

    const closeOverlay = () => {
      const modalContainer = overlay.querySelector('.logout-container');
      if (modalContainer) {
        modalContainer.classList.add('fadeOut');
        // Wait for animation (0.3s) before hiding
        setTimeout(() => {
          overlay.style.display = 'none';
          modalContainer.classList.remove('fadeOut');
          document.body.classList.remove("hidden-overflow");
        }, 300);
      } else {
        overlay.style.display = 'none';
        document.body.classList.remove("hidden-overflow");
      }
    };

    if (confirmBtn) {
      confirmBtn.onclick = (e) => {
        e.preventDefault();
        window.clearUserSession();
        // Optional: transition out before redirecting for premium feel
        const modalContainer = overlay.querySelector('.logout-container');
        if (modalContainer) {
          modalContainer.classList.add('fadeOut');
          setTimeout(() => {
            window.location.href = "/sign-in.html";
          }, 300);
        } else {
          window.location.href = "/sign-in.html";
        }
      };
    }
    
    if (cancelBtn) {
      cancelBtn.onclick = (e) => {
        if (e) e.preventDefault();
        closeOverlay();
      };
    }
  };

  // 3. Standardized Mobile Navigation Toggle
  const setupMobileMenu = () => {
    const navIcon = document.querySelector(".nav-icon2");
    const navMenu = document.querySelector(".nav-menu");
    const closeBtn = document.querySelector(".nav-close-btn");

    if (navIcon && navMenu) {
      navIcon.addEventListener("click", () => {
        navIcon.classList.toggle("open");
        navMenu.classList.toggle("active");
      });
    }

    if (closeBtn && navIcon && navMenu) {
      closeBtn.addEventListener("click", () => {
        navIcon.classList.remove("open");
        navMenu.classList.remove("active");
      });
    }
    
    // Auto-close menu on overlay clicks if needed (optional based on UX)
  };

  if (isDashboardPage) {
    injectLogoutOverlay();
    setupMobileMenu();
  }

  // Event delegation for logout buttons (handles header, mobile nav, and dynamic links)
  document.addEventListener('click', (e) => {
    // Check for both legacy IDs/classes and the new standardized class
    const logoutBtn = e.target.closest('#logout-button') || 
                      e.target.closest('#mobile-logout-button') || 
                      e.target.closest('.nav-logout-btn') ||
                      e.target.closest('.dash-logout') ||
                      e.target.closest('.dash-mobile-logout-btn');

    if (logoutBtn) {
      const overlay = document.getElementById('logout-overlay');
      if (overlay) {
        overlay.style.display = 'flex';
        document.body.classList.add("hidden-overflow");
        
        // Ensure any mobile menus are closed
        const navMenu = document.querySelector(".nav-menu");
        const navIcons = document.querySelector(".nav-icon2");
        if (navMenu) navMenu.classList.remove("active");
        if (navIcons) navIcons.classList.remove("open");
      }
    }
  });

  // 3. Public Auth Navigation (Update login buttons to "Dashboard" if logged in)
  if (token && !isDashboardPage) {
    const authWrappers = document.querySelectorAll('.auth-wrapper');
    authWrappers.forEach(wrapper => {
      wrapper.innerHTML = `
        <a href="/dashboard/index.html" class="auth-btn-link" style="background-color: var(--color-two); color: var(--color-one); border: none;">
          Dashboard
        </a>
      `;
    });

    const mobileNavBtns = document.querySelectorAll('.mobile-nav-btns');
    mobileNavBtns.forEach(wrapper => {
      wrapper.innerHTML = `
        <a href="/dashboard/index.html" style="text-decoration:none; flex:1; background-color: var(--color-two); color: var(--color-one); border: none;" class="mobile-nav-btn-link">
          Dashboard
        </a>
      `;
    });
  }
});
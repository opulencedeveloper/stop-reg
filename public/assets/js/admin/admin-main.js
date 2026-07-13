document.addEventListener('DOMContentLoaded', () => {
    const TOKEN_KEY = "adminToken";
    const adminToken = localStorage.getItem(TOKEN_KEY);

    // 1. Auth Guard: Strictly enforce administrative sessions
    if (!adminToken) {
        console.warn("No administrative session found. Redirecting...");
        window.location.href = "/admin-login/index.html";
        return;
    }

    // 2. Mobile Menu Toggle Logic
    const mobiMenuBtn = document.getElementById('mobi-menu-btn');
    const mobiCloseBtn = document.getElementById('mobi-close-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    if (mobiMenuBtn && mobileNavOverlay) {
        mobiMenuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = mobileNavOverlay.classList.contains('open');
            if (isOpen) {
                mobileNavOverlay.classList.remove('open');
                mobiMenuBtn.classList.remove('open');
                document.body.style.overflow = '';
            } else {
                mobileNavOverlay.classList.add('open');
                mobiMenuBtn.classList.add('open');
                document.body.style.overflow = 'hidden';
            }
        });
    }

    if (mobiCloseBtn && mobileNavOverlay && mobiMenuBtn) {
        mobiCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileNavOverlay.classList.remove('open');
            mobiMenuBtn.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // Close mobile nav when clicking outside (on overlay background)
    if (mobileNavOverlay) {
        mobileNavOverlay.addEventListener('click', (e) => {
            // Only close if clicking on the overlay itself, not on nav content
            if (e.target === mobileNavOverlay) {
                mobileNavOverlay.classList.remove('open');
                if (mobiMenuBtn) {
                    mobiMenuBtn.classList.remove('open');
                }
                document.body.style.overflow = '';
            }
        });
    }

    // 3. Global Logout Functionality
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

        // Bind overlay actions (Ensures functionality even if HTML already had the elements)
        const confirmBtn = document.getElementById('logout-confirm-btn');
        const cancelBtn = document.getElementById('logout-cancel-btn');

        if (confirmBtn) {
            confirmBtn.onclick = () => {
                localStorage.removeItem(TOKEN_KEY);
                window.location.href = "/admin-login/index.html";
            };
        }
        
        if (cancelBtn) {
            cancelBtn.onclick = () => {
                overlay.classList.remove('active');
            };
        }
    };

    injectLogoutOverlay();

    // Use event delegation for logout buttons (handles future dynamic buttons too)
    document.addEventListener('click', (e) => {
        if (e.target.closest('.nav-logout-btn')) {
            const overlay = document.getElementById('logout-overlay');
            if (overlay) {
                overlay.classList.add('active');
                // Close mobile menu if open
                if (mobileNavOverlay) {
                    mobileNavOverlay.classList.remove('open');
                    if (mobiMenuBtn) mobiMenuBtn.classList.remove('open');
                    document.body.style.overflow = '';
                }
            }
        }
    });
});

/**
 * Global Administrative Authentication Error Handler
 * Standardizes session termination and redirection across all admin panels.
 */
window.handleAdminAuthError = (error) => {
    const status = error.status || (error.response && error.response.status);
    
    // 401 (Unauthorized/Expired) or 403 (Forbidden)
    if (status === 401) {
        console.error("Administrative session expired or invalid. Clearing session...");
        localStorage.removeItem("adminToken");
        
        // Use a slight delay to ensure the user sees any pending error toast if applicable
        setTimeout(() => {
            window.location.href = "/admin-login/index.html";
        }, 100);
        return true;
    }
    return false;
};

// Scroll listener for sticky header styling
window.addEventListener('scroll', () => {
    const adminHeader = document.querySelector('.admin-header');
    if (adminHeader) {
        if (window.scrollY > 10) {
            adminHeader.classList.add('scrolled');
        } else {
            adminHeader.classList.remove('scrolled');
        }
    }
});

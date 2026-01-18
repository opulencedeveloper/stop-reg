/* Global Entrance Overlay System */
(function() {
    // Configuration
    const MIN_DISPLAY_FIRST_VISIT = 2500; // ms for branding
    const ASSET_TIMEOUT = 7000; // Max blocking time
    const THEMES = ['cosmic', 'cyber', 'clean'];

    // State
    const hasVisited = sessionStorage.getItem('stopreg_has_visited');
    const minTime = hasVisited ? 0 : MIN_DISPLAY_FIRST_VISIT;
    let timerDone = false;
    let assetsLoaded = false;
    let overlayElement = null;

    // Helper: Select Random Theme
    function selectTheme() {
        const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
        return theme;
    }

    // 1. Inject Overlay
    function injectOverlay() {
        if (document.querySelector('.entrance-overlay')) return;

        const theme = selectTheme();
        
        const overlay = document.createElement('div');
        overlay.className = 'entrance-overlay';
        overlay.setAttribute('data-theme', theme);
        
        // Inner Content
        overlay.innerHTML = `
            <div class="entrance-content">
                <img src="/assets/logo/stopreg-logo.svg" class="entrance-logo" alt="StopReg">
                <div class="stopreg-spinner stopreg-spinner-overlay"></div>
                <div class="entrance-tagline">Block Disposable Email Addresses in Real-Time</div>
            </div>
        `;
        
        if (document.body) {
             document.body.prepend(overlay);
             document.documentElement.classList.add('overlay-active');
        }
        
        overlayElement = overlay;
    }

    // 2. Dismiss Logic
    function attemptDismiss() {
        // Must satisfy both conditions
        if (timerDone && assetsLoaded) {
            
            // Mark as visited logic
            sessionStorage.setItem('stopreg_has_visited', 'true');

            if (overlayElement) {
                // Random Exit Animation
                const exitAnimations = ['exit-zoom-in', 'exit-zoom-out', 'exit-slide-up', 'exit-slide-down'];
                const randomExit = exitAnimations[Math.floor(Math.random() * exitAnimations.length)];
                
                overlayElement.classList.add('entrance-hidden', randomExit);
                
                // Cleanup DOM & Dispatch Event after animation
                setTimeout(() => {
                    if (overlayElement && overlayElement.parentNode) {
                        try {
                            overlayElement.parentNode.removeChild(overlayElement);
                        } catch(e) {}
                    }
                    document.documentElement.classList.remove('overlay-active');
                    
                    // Dispatch event for other scripts ONLY after visual exit
                    window.dispatchEvent(new Event('entrance-complete'));
                }, 1000);
            } else {
                // Fallback if no overlay element (shouldn't happen here usually)
                window.dispatchEvent(new Event('entrance-complete'));
            }
        }
    }

    // 3. Initialization
    function init() {
        // Fast Path: If visited and fully loaded, skip overlay entirely
        if (hasVisited && document.readyState === 'complete') {
            return;
        }

        // Otherwise inject
        injectOverlay();
        if (!overlayElement && !document.body) {
            window.addEventListener('DOMContentLoaded', injectOverlay);
        }

        // Timer Logic
        setTimeout(() => {
            timerDone = true;
            attemptDismiss();
        }, minTime);

        // Asset Logic
        if (document.readyState === 'complete') {
            assetsLoaded = true;
            attemptDismiss();
        } else {
            window.addEventListener('load', () => {
                assetsLoaded = true;
                attemptDismiss();
            });
            // Safety Timeout
            setTimeout(() => {
                assetsLoaded = true;
                attemptDismiss();
            }, ASSET_TIMEOUT);
        }
    }

    // Run
    init();
})();

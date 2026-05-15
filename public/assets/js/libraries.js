/**
 * StopReg Official Libraries & SDKs Page Logic
 */

document.addEventListener("DOMContentLoaded", () => {
    // 1. Initialization Logic (Wait for Entrance Overlay)
    function initLibrariesPage() {
        // Global animation system handles .box elements. 
        // We just need to ensure they are observed if scope-based.
        if (window.initScrollAnimations) {
            window.initScrollAnimations("body");
        }
    }

    // Handle the global entrance overlay event
    if (document.documentElement.classList.contains('overlay-active')) {
        window.addEventListener('entrance-complete', initLibrariesPage);
    } else {
        // Fallback for direct loads
        initLibrariesPage();
    }

    // 2. Install Command Copy Logic
    document.querySelectorAll('.copy-btn-mini').forEach(btn => {
        btn.addEventListener('click', function() {
            const command = this.getAttribute('data-command');
            navigator.clipboard.writeText(command).then(() => {
                // Success feedback
                const originalIcon = this.innerHTML;
                this.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M16.6667 5L7.5 14.1667L3.33334 10" stroke="#4BB543" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                `;
                
                setTimeout(() => {
                    this.innerHTML = originalIcon;
                }, 2000);
            });
        });
    });
});

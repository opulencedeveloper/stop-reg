document.addEventListener('DOMContentLoaded', () => {
    // 1. Mobile Menu Toggle Logic
    const mobiMenuBtn = document.getElementById('mobi-menu-btn');
    const mobiCloseBtn = document.getElementById('mobi-close-btn');
    const mobileNavOverlay = document.getElementById('mobile-nav-overlay');

    if (mobiMenuBtn && mobileNavOverlay) {
        mobiMenuBtn.addEventListener('click', () => {
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
        mobiCloseBtn.addEventListener('click', () => {
            mobileNavOverlay.classList.remove('open');
            mobiMenuBtn.classList.remove('open');
            document.body.style.overflow = '';
        });
    }

    // Close on overlay click outside content
    if (mobileNavOverlay && mobiMenuBtn) {
        mobileNavOverlay.addEventListener('click', (e) => {
            if (e.target === mobileNavOverlay) {
                mobileNavOverlay.classList.remove('open');
                mobiMenuBtn.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }

    // 2. Tabs Logic
    const tabBtns = document.querySelectorAll('.tab-btn');
    // We only have one table body right now. In a real scenario, we'd swap rows or fetch data.
    // For this UI mockup, just toggling active state.
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remove active from all
            tabBtns.forEach(b => b.classList.remove('active'));
            // Add active to clicked
            btn.classList.add('active');
            
            // Logic to fetch/display different data goes here
            // const target = btn.getAttribute('data-target');
            // updateTableData(target);
        });
    });
});

// Add scroll listener for sticky header styling
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

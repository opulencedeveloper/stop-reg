document.addEventListener('DOMContentLoaded', () => {
    const blockOverlay = document.getElementById('block-domain-modal-overlay');
    const openBlockBtn = document.getElementById('open-block-modal');
    const closeBlockBtn = document.getElementById('close-block-modal');

    const reportOverlay = document.getElementById('report-domain-modal-overlay');
    const openReportBtn = document.getElementById('open-report-modal');
    const closeReportBtn = document.getElementById('close-report-modal');
    const bottomCloseReportBtn = document.getElementById('report-bottom-close');

    const allowOverlay = document.getElementById('allow-domain-modal-overlay');
    const openAllowBtn = document.getElementById('open-allow-modal');
    const closeAllowBtn = document.getElementById('close-allow-modal');
    const bottomCloseAllowBtn = document.getElementById('allow-bottom-close');

    function openModal(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        overlay.classList.add('is-active');
        overlay.classList.remove('is-exiting');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = overlay.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    function closeModal(overlayId) {
        const overlay = document.getElementById(overlayId);
        if (!overlay) return;
        overlay.classList.add('is-exiting');
        overlay.classList.remove('is-active');
        
        setTimeout(() => {
            if (overlay.classList.contains('is-exiting')) {
                overlay.classList.remove('is-exiting');
            }
        }, 300);
    }

    // Block Modal Listeners
    if (openBlockBtn) {
        openBlockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('block-domain-modal-overlay');
        });
    }

    if (closeBlockBtn) {
        closeBlockBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('block-domain-modal-overlay');
        });
    }

    if (blockOverlay) {
        blockOverlay.addEventListener('click', (e) => {
            if (e.target === blockOverlay) {
                closeModal('block-domain-modal-overlay');
            }
        });
    }

    // Report Modal Listeners
    if (openReportBtn) {
        openReportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('report-domain-modal-overlay');
        });
    }

    if (closeReportBtn) {
        closeReportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('report-domain-modal-overlay');
        });
    }

    if (bottomCloseReportBtn) {
        bottomCloseReportBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('report-domain-modal-overlay');
        });
    }

    if (reportOverlay) {
        reportOverlay.addEventListener('click', (e) => {
            if (e.target === reportOverlay) {
                closeModal('report-domain-modal-overlay');
            }
        });
    }

    // Allow Modal Listeners
    if (openAllowBtn) {
        openAllowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal('allow-domain-modal-overlay');
        });
    }

    if (closeAllowBtn) {
        closeAllowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('allow-domain-modal-overlay');
        });
    }

    if (bottomCloseAllowBtn) {
        bottomCloseAllowBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal('allow-domain-modal-overlay');
        });
    }

    if (allowOverlay) {
        allowOverlay.addEventListener('click', (e) => {
            if (e.target === allowOverlay) {
                closeModal('allow-domain-modal-overlay');
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (blockOverlay && blockOverlay.classList.contains('is-active')) {
                closeModal('block-domain-modal-overlay');
            }
            if (reportOverlay && reportOverlay.classList.contains('is-active')) {
                closeModal('report-domain-modal-overlay');
            }
            if (allowOverlay && allowOverlay.classList.contains('is-active')) {
                closeModal('allow-domain-modal-overlay');
            }
        }
    });

    const form = document.getElementById('block-domain-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // TODO: Implement block logic
            closeModal();
        });
    }
});

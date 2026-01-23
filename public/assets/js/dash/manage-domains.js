document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('block-domain-modal-overlay');
    const openBtn = document.getElementById('open-block-modal');
    const closeBtn = document.getElementById('close-block-modal');

    function openModal() {
        if (!overlay) return;
        overlay.classList.add('is-active');
        overlay.classList.remove('is-exiting');
        
        // Focus first input
        setTimeout(() => {
            const firstInput = overlay.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }

    function closeModal() {
        if (!overlay) return;
        overlay.classList.add('is-exiting');
        overlay.classList.remove('is-active');
        
        setTimeout(() => {
            if (overlay.classList.contains('is-exiting')) {
                overlay.classList.remove('is-exiting');
            }
        }, 300);
    }

    if (openBtn) {
        openBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.preventDefault();
            closeModal();
        });
    }

    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && overlay.classList.contains('is-active')) {
            closeModal();
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

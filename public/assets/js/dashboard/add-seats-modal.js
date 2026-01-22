/**
 * Add Seats Modal Handler
 * Handles the interaction of the static "Add Seats" modal.
 */

document.addEventListener('DOMContentLoaded', () => {
    const triggerBtn = document.getElementById('add-seats-trigger');
    const overlay = document.getElementById('add-seats-modal-overlay');
    const closeBtn = document.getElementById('close-seats-modal');
    const firstInput = document.getElementById('seat-email');

    if (!triggerBtn || !overlay || !closeBtn) return;

    // --- Action Functions ---

    const openModal = () => {
        // Prevent background scroll
        document.head.insertAdjacentHTML('beforeend', '<style id="modal-lock">body{overflow:hidden !important;}</style>');

        // Make visible (entry animation handled by CSS)
        overlay.classList.add('is-active');
        overlay.classList.remove('is-exiting');

        // Accessibility Focus
        setTimeout(() => {
            if (firstInput) firstInput.focus();
        }, 100);

        // Bind escape key
        document.addEventListener('keydown', handleEsc);
    };

    const closeModal = () => {
        // Add exit state (exit animation handled by CSS on .is-exiting)
        overlay.classList.add('is-exiting');
        overlay.classList.remove('is-active');

        // Wait for animation to finish then fully hide
        const onAnimationEnd = () => {
            overlay.classList.remove('is-exiting');
            document.getElementById('modal-lock')?.remove(); // Restore scroll
            document.removeEventListener('keydown', handleEsc);
        };
        
        // Strict fallback timer for clean up
        setTimeout(onAnimationEnd, 350); 
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    };

    // --- Event Listeners ---

    triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        openModal();
    });

    closeBtn.addEventListener('click', closeModal);

    // Click outside to close
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });

    // Form Submit Placeholder
    const form = document.getElementById('add-seats-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            // Simulate processing
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerText;
            submitBtn.innerText = 'Sending...';
            
            setTimeout(() => {
                submitBtn.innerText = 'Sent!';
                setTimeout(closeModal, 500);
                setTimeout(() => {
                    submitBtn.innerText = originalText;
                    form.reset();
                }, 1000);
            }, 1000);
        });
    }
});

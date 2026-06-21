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

    const openModal = async () => {
        console.log("[AddSeatsModal] openModal called");
        const planName = await window.getUserPlan();
        console.log("[AddSeatsModal] planName:", planName);
        console.log("[AddSeatsModal] userPlanDetailsCache:", window.userPlanDetailsCache);

        if (planName === "Free") {
            console.log("[AddSeatsModal] Free plan detected, blocking");
            if (typeof iziToast !== 'undefined') {
                iziToast.info({
                    title: 'Premium Feature',
                    message: 'Seat management is available on paid plans. Update your plan to invite team members.',
                    position: 'topRight'
                });
            } else {
                alert("Seat management is a premium feature. Please upgrade your plan.");
            }
            return;
        }

        // Check seat limit (fetched from server, no hardcoded values)
        const seatLimit = window.userPlanDetailsCache?.seatLimit;
        const usedSeats = window.userSeatCount || 0;

        console.log("[AddSeatsModal] Seat limit check:");
        console.log("  - seatLimit:", seatLimit);
        console.log("  - usedSeats:", usedSeats);
        console.log("  - seatLimit type:", typeof seatLimit);
        console.log("  - seatLimit !== null:", seatLimit !== null);
        console.log("  - seatLimit !== undefined:", seatLimit !== undefined);
        console.log("  - usedSeats >= seatLimit:", usedSeats >= seatLimit);

        // Only enforce if limit is defined (null = unlimited)
        if (seatLimit !== null && seatLimit !== undefined && usedSeats >= seatLimit) {
            console.log("[AddSeatsModal] LIMIT REACHED - showing toast");
            const msg = `You have reached the seat limit (${seatLimit} seat${seatLimit > 1 ? 's' : ''}). Please upgrade to invite more team members.`;
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    title: 'Seat Limit Reached',
                    message: msg,
                    position: 'topRight'
                });
            } else {
                alert(msg);
            }
            return;
        }

        console.log("[AddSeatsModal] Limit NOT reached - opening modal");

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

    // Form Submit Placeholder REMOVED - Logic handled in invite-seat.js
});

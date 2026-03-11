window.PortalManager = (function() {
    let activePortal = null;
    let activeTrigger = null;
    let originalParent = null;
    let originalNextSibling = null;
    let portaledElement = null; // Track the element currently in document.body
    let restoreTimeout = null; // Track the DOM restoration timer
    let closeDelayTimer = null; // Hover delay timer
    let scrollHandler = null;
    let resizeHandler = null;

    function open(trigger, content) {
        // 1. Force close any existing portal (including pending restores)
        closeImmediate();

        if (closeDelayTimer) {
            clearTimeout(closeDelayTimer);
            closeDelayTimer = null;
        }
        
        // If re-opening the same one that is currently portaled (closing phase)
        if (activePortal === content) {
             // Already open or closing, just show it
             activePortal.classList.add('active');
             updatePosition();
             return;
        }

        closeImmediate(); 

        activeTrigger = trigger;
        activePortal = content;
        originalParent = content.parentNode;
        originalNextSibling = content.nextSibling;
        portaledElement = content; // Track for restoration

        activePortal.style.position = 'fixed';
        activePortal.style.margin = '0';
        activePortal.style.visibility = 'hidden'; 
        activePortal.style.setProperty('display', 'flex', 'important');
        activePortal.style.opacity = '0';
        activePortal.style.zIndex = '9999';

        document.body.appendChild(activePortal);

        // Forced layout sync to ensure dimensions are ready
        updatePosition();

        requestAnimationFrame(() => {
            if (!activePortal) return;
            activePortal.style.visibility = 'visible';
            activePortal.style.opacity = '1';
            activePortal.classList.add('active'); 
        });

        document.addEventListener('mousedown', handleOutsideClick);
        scrollHandler = throttle(updatePosition, 10);
        resizeHandler = throttle(updatePosition, 10);
        window.addEventListener('scroll', scrollHandler, true);
        window.addEventListener('resize', resizeHandler);
    }

    function updatePosition() {
        // Use portaledElement if updatePosition is called during close/restore phase if needed?
        // But usually updatePosition only matters when activePortal is set.
        if (!activePortal || !activeTrigger) return;

        const triggerRect = activeTrigger.getBoundingClientRect();
        const portalRect = activePortal.getBoundingClientRect();
        const gap = 4; 

        let top = triggerRect.bottom + gap;
        let left = triggerRect.right - portalRect.width;

        if (top + portalRect.height > window.innerHeight) {
            top = triggerRect.top - portalRect.height - gap;
            activePortal.style.transformOrigin = 'bottom right';
        } else {
            activePortal.style.transformOrigin = 'top right';
        }

        if (left < 4) left = 4;
        if (left + portalRect.width > window.innerWidth - 4) {
            left = window.innerWidth - portalRect.width - 4;
        }

        activePortal.style.top = `${top}px`;
        activePortal.style.left = `${left}px`;
    }

    function close(delay = 0) {
        if (!activePortal) return;

        if (closeDelayTimer) {
            clearTimeout(closeDelayTimer);
            closeDelayTimer = null;
        }

        if (delay > 0) {
            closeDelayTimer = setTimeout(() => {
                close(0);
            }, delay);
            return;
        }

        // 1. Trigger Fade Out (CSS)
        activePortal.classList.remove('active');
        activePortal.style.opacity = '';      // Allow CSS transition
        activePortal.style.visibility = '';   // Allow CSS transition
        
        // 2. After transition duration (300ms), restore to original position
        if (restoreTimeout) clearTimeout(restoreTimeout);
        restoreTimeout = setTimeout(() => {
            closeImmediate();
        }, 200);
    }

    function cancelClose() {
        if (closeDelayTimer) {
            clearTimeout(closeDelayTimer);
            closeDelayTimer = null;
        }
        // If we were in the middle of a fade-out (close(0) called), cancel restoration
        if (restoreTimeout) {
            clearTimeout(restoreTimeout);
            restoreTimeout = null;
            
            // Re-activate the current portal since we are "rescuing" it
            if (activePortal) {
                activePortal.classList.add('active');
                activePortal.style.opacity = '1';
                activePortal.style.visibility = 'visible';
            }
        }
    }

    function closeImmediate() {
        if (restoreTimeout) {
            clearTimeout(restoreTimeout);
            restoreTimeout = null;
        }

        if (portaledElement && originalParent) {
            // Restore original styles
            portaledElement.style.position = '';
            portaledElement.style.top = '';
            portaledElement.style.left = '';
            portaledElement.style.margin = '';
            portaledElement.style.removeProperty('display');
            portaledElement.style.opacity = '';
            portaledElement.style.visibility = '';
            portaledElement.style.zIndex = '';
            portaledElement.style.transformOrigin = '';
            
            // Move back to original position
            if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
                originalParent.insertBefore(portaledElement, originalNextSibling);
            } else if (originalParent) {
                originalParent.appendChild(portaledElement);
            }
        }

        portaledElement = null;
        cleanup();
    }

    function cleanup() {
        document.removeEventListener('mousedown', handleOutsideClick);
        window.removeEventListener('scroll', scrollHandler, true);
        window.removeEventListener('resize', resizeHandler);

        activePortal = null;
        activeTrigger = null;
        originalParent = null;
        originalNextSibling = null;
        scrollHandler = null;
        resizeHandler = null;
    }

    function handleOutsideClick(e) {
        if (activePortal && !activePortal.contains(e.target) && !activeTrigger.contains(e.target)) {
            close();
        }
    }

    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    return {
        open: open,
        close: close,
        cancelClose: cancelClose,
        updatePosition: updatePosition,
        getActiveTrigger: () => activeTrigger
    };
})();

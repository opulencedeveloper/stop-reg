/**
 * Image Fallback Handler
 * Handles broken images by either hiding them or replacing them with fallback HTML.
 * Uses data attributes to determine the fallback behavior:
 * - data-hide-on-error: If present, the image will be hidden on error.
 * - data-fallback-html: If present, the image's parent element's innerHTML will be replaced with this value.
 */

document.addEventListener("DOMContentLoaded", () => {
    // We use a bubbling error listener to catch image load errors efficiently
    document.addEventListener("error", (event) => {
        const target = event.target;
        
        if (target.tagName.toLowerCase() === 'img') {
            // Check for hide-on-error behavior
            if (target.hasAttribute('data-hide-on-error')) {
                target.style.display = 'none';
            }
            
            // Check for fallback-html behavior
            const fallbackHtml = target.getAttribute('data-fallback-html');
            if (fallbackHtml) {
                const parent = target.parentElement;
                if (parent) {
                    parent.innerHTML = fallbackHtml;
                }
            }
        }
    }, true); // Use capture phase because 'error' events do not bubble
});

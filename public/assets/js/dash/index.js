document.addEventListener("DOMContentLoaded", function () {
    // Generic Copy Functionality for all .copy-btn elements
    document.body.addEventListener("click", async function (e) {
        // specific check for the new copy buttons or elements inside them (like the image)
        const copyBtn = e.target.closest(".copy-btn");
        
        // Also handle the legacy .dash-copy-btn if it exists and is clicked
        const legacyCopyBtn = e.target.closest(".dash-copy-btn");

        if (copyBtn) {
            handleCopy(copyBtn);
        } else if (legacyCopyBtn) {
            handleCopy(legacyCopyBtn); // Reuse same logic if structure allows, or keep separate if needed
        }
    });

    async function handleCopy(btn) {
        try {
            let textToCopy = "";
            let container = btn.closest(".copy-input-field") || btn.closest(".token-con");
            
            // Try to find the text element
            // New UI: sibling .truncated-text with data-full-text
            // Legacy UI: sibling .main-token (text content)
            
            if (container) {
                const textEl = container.querySelector(".truncated-text") || container.querySelector(".main-token");
                if (textEl) {
                    textToCopy = textEl.dataset.fullText || textEl.textContent.trim();
                }
            }

            if (!textToCopy) {
                console.warn("No text found to copy");
                return;
            }

            await navigator.clipboard.writeText(textToCopy);

            // Visual Feedback
            const originalHTML = btn.innerHTML;
            
            // For new buttons, we might want to just change text or icon
            // The design has an icon + "Copy". We can change it to "Copied!"
            
            // Simplified feedback:
            btn.classList.add("copied");
            const textSpan = btn.innerText.includes("Copy") ? "Copied!" : "Copied!";
            
            // Preserve icon if possible, or just swap innerHTML
            if (btn.querySelector("img")) {
                 // Keep icon check mark maybe? For now just text change is safest
                 btn.innerHTML = `<img src="/assets/icons/copy.svg" alt="Copied" /> Copied!`;
            } else {
                btn.textContent = "Copied!";
            }
            
            if (typeof iziToast !== 'undefined') {
                iziToast.success({
                    message: "Copied to clipboard!",
                    position: "topRight",
                    drag: false,
                    displayMode: 1,
                    timeout: 2000
                });
            }

            // Revert after 2 seconds
            setTimeout(() => {
                btn.classList.remove("copied");
                btn.innerHTML = originalHTML;
            }, 2000);

        } catch (err) {
            console.error("Copy failed:", err);
            if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    message: "Failed to copy",
                    position: "topRight"
                });
            }
        }
    }
});
/* Code Snippet Utilities - Professional Industrial Standard */
document.addEventListener('DOMContentLoaded', () => {
    /**
     * Handles the copy-to-clipboard functionality for code snippets
     */
    const handleCopy = (button) => {
        const container = button.closest('.code-snippet-container');
        if (!container) return;

        const codeElement = container.querySelector('code');
        if (!codeElement) return;

        const textToCopy = codeElement.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalImg = button.querySelector('img');
            const originalSpan = button.querySelector('span');
            
            if (!originalImg || !originalSpan) return;

            const originalSrc = originalImg.src;
            const originalText = originalSpan.textContent;

            // Updated visual state for success feedback
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M16.6667 5L7.5 14.1667L3.33334 10" stroke="#6a9955" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <span>Copied</span>
            `;

            // Revert to original state after timeout
            setTimeout(() => {
                button.innerHTML = `<img src="${originalSrc}" alt="Copy" /><span>${originalText}</span>`;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    };

    // Global event listener for copy buttons
    document.addEventListener('click', (e) => {
        const button = e.target.closest('.code-copy-btn');
        if (button) {
            handleCopy(button);
        }
    });
});

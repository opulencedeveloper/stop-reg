document.addEventListener('DOMContentLoaded', function() {
  const domainName = document.querySelector('[data-domain]')?.getAttribute('data-domain');
  if (domainName) {
    document.documentElement.setAttribute('data-domain', domainName);
  }
});

function copyJsonToClipboard(evt) {
  const codeBlock = document.getElementById('jsonCodeBlock');
  if (!codeBlock) return;

  // Extract text content without HTML tags
  const jsonText = codeBlock.innerText;

  // Copy to clipboard
  navigator.clipboard.writeText(jsonText).then(() => {
    // Show visual feedback
    const button = evt.target.closest('.api-response-btn-copy');
    if (button) {
      const originalHTML = button.innerHTML;
      button.innerHTML = '<span style="font-size: 12px; font-weight: 500; color: white;">Copied</span>';
      setTimeout(() => {
        button.innerHTML = originalHTML;
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy:', err);
  });
}

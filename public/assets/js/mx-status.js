

/* public/assets/js/mx-status.js */

// This script runs after the DOM is loaded and updates each MX badge.
// It calls the public StopReg DNS endpoint directly and logs detailed info.

document.addEventListener('DOMContentLoaded', () => {

  const badges = document.querySelectorAll('.mx-status[data-mx-domain]');

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  const API_BASE = isDev ? "http://localhost:8080/api/v1" : "https://api.stopreg.com/api/v1";

  const fetchMx = async (rawDomain) => {
    const domain = rawDomain.trim();
    try {

      const resp = await fetch(`${API_BASE}/seo/dns/domain/${encodeURIComponent(domain)}`);

      if (!resp.ok) {

        return 'none';
      }
      const data = await resp.json();
      const mxArray = Array.isArray(data?.data?.mxRecords) ? data.data.mxRecords : [];
      const hasMx = mxArray.length > 0;

      return hasMx ? 'found' : 'none';
    } catch (e) {
      console.error(`[mx-status] Exception while fetching MX for ${domain}:`, e);
      return 'error';
    }
  };

  badges.forEach(async (badge) => {
    const domain = badge.dataset.mxDomain;
    const result = await fetchMx(domain);
    if (result === 'found') {
      badge.textContent = 'Found';
      badge.classList.replace('gray', 'green');
    } else if (result === 'none') {
      badge.textContent = 'Not found';
      badge.classList.replace('green', 'gray');
    } else {
      badge.textContent = 'Error';
      badge.classList.replace('gray', 'red');
    }
  });
});

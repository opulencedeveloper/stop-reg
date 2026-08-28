document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let isLoading = false;
    let currentDomain = '';

    // Element Capture
    const ipTableBody = document.querySelector('.ip-table tbody');
    const ipRecordsGrid = document.querySelector('.ip-records-grid');

    // Extract domain from data attribute or page context
    const domainElement = document.querySelector('[data-domain]');
    if (domainElement) {
        currentDomain = domainElement.getAttribute('data-domain');
    } else {
        // Fallback: extract from H1 or page title
        const h1 = document.querySelector('h1');
        if (h1 && h1.textContent) {
            currentDomain = h1.textContent.trim().split(' ')[0].toLowerCase();
        }
    }

    // Initial Load
    if (currentDomain) {
        fetchIpAddresses(currentDomain);
    }

    // Tab Click Handlers - Lazy Load on Tab Click
    const ipTabs = document.querySelectorAll('.ip-tab');
    ipTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            ipTabs.forEach(t => t.classList.remove('ip-tab-active'));
            // Add active class to clicked tab
            tab.classList.add('ip-tab-active');

            // Trigger fetch if not already loaded
            if (!tab.dataset.loaded && currentDomain) {
                fetchIpAddresses(currentDomain);
                tab.dataset.loaded = 'true';
            }
        });
    });

    // Mark first tab as loaded on initial call
    if (ipTabs[0]) {
        ipTabs[0].dataset.loaded = 'true';
    }

    // Expose for external access
    window.fetchIpAddresses = fetchIpAddresses;

    async function fetchIpAddresses(domain) {
        if (isLoading || !domain) return;
        isLoading = true;

        renderLoadingState();

        try {
            // Construct API URL
            const url = `https://api.stopreg.com/api/v1/seo/ip-addresses?domain=${encodeURIComponent(domain.toLowerCase())}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json();
                // Expected structure: { success: true, data: { ipAddresses: [{ ip, type, provider, country }] } }

                const ipData = result?.data || {};
                const ipAddresses = ipData.ipAddresses || [];

                renderIpTable(ipAddresses);
                renderIpCards(ipAddresses);

            } else {
                console.error('IP API Error:', await response.text());
                renderErrorState(() => fetchIpAddresses(domain));
            }

        } catch (error) {
            console.error('Network Error fetching IP addresses:', error);
            renderErrorState(() => fetchIpAddresses(domain));
        } finally {
            isLoading = false;
        }
    }

    function renderLoadingState() {
        // Show spinner in table
        if (ipTableBody) {
            ipTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="height: 200px; text-align: center; vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 12px;">
                            <div class="stopreg-btn-spinner" style="border: 3px solid rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-right-color: #1452CA !important; width: 32px; height: 32px;"></div>
                            <span style="font-size: 14px; color: #737373; font-family: 'Inter_28pt-Regular';">Loading IP addresses...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Show loading state in cards
        if (ipRecordsGrid) {
            ipRecordsGrid.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 300px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <div class="stopreg-btn-spinner" style="border: 3px solid rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-right-color: #1452CA !important; width: 40px; height: 40px;"></div>
                        <span style="font-size: 14px; color: #737373; font-family: 'Inter_28pt-Regular';">Loading IP addresses...</span>
                    </div>
                </div>
            `;
        }
    }

    function renderErrorState(retryFn) {
        // Error in table
        if (ipTableBody) {
            ipTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="height: 200px; padding: 20px;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; text-align: center;">
                            <div style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-family: 'Inter_28pt-SemiBold'; font-size: 16px; color: #111827; margin-bottom: 4px;">Failed to load IP addresses</h3>
                                <p style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #6B7280;">Could not fetch IP data at this time.</p>
                            </div>
                            <button class="ip-retry-btn" style="background-color: #1452CA; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            const retryBtn = ipTableBody.querySelector('.ip-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryFn);
            }
        }

        // Error in cards
        if (ipRecordsGrid) {
            ipRecordsGrid.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 300px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;">
                        <div style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 style="font-family: 'Inter_28pt-SemiBold'; font-size: 16px; color: #111827;">Failed to load IP addresses</h3>
                            <p style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #6B7280;">Could not fetch IP data at this time.</p>
                        </div>
                        <button class="ip-retry-btn-grid" style="background-color: #1452CA; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                    </div>
                </div>
            `;

            const retryBtn = ipRecordsGrid.querySelector('.ip-retry-btn-grid');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryFn);
            }
        }
    }

    function renderIpTable(ipAddresses) {
        if (!ipTableBody) return;

        if (!ipAddresses || ipAddresses.length === 0) {
            ipTableBody.innerHTML = `
                <tr>
                    <td colspan="3" style="height: 150px; text-align: center; color: #6B7280; font-family: 'Inter_28pt-Regular'; font-size: 14px;">
                        No IP addresses resolved for this domain
                    </td>
                </tr>
            `;
            return;
        }

        ipTableBody.innerHTML = ipAddresses.map(record => `
            <tr>
                <td><code>${escapeHtml(record.ip)}</code></td>
                <td><span style="background: #E5E7EB; color: #374151; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-family: 'Inter_28pt-Regular';">${escapeHtml(record.type)}</span></td>
                <td>${record.provider ? escapeHtml(record.provider) : '<span style="color: #9CA3AF; font-style: italic;">Unknown</span>'}</td>
            </tr>
        `).join('');
    }

    function renderIpCards(ipAddresses) {
        if (!ipRecordsGrid) return;

        if (!ipAddresses || ipAddresses.length === 0) {
            ipRecordsGrid.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #6B7280;">
                    <p style="font-family: 'Inter_28pt-Regular'; font-size: 14px;">No IP addresses resolved for this domain</p>
                </div>
            `;
            return;
        }

        ipRecordsGrid.innerHTML = ipAddresses.map(ip => `
            <div class="ip-record-card">
                <h4 class="ip-record-title">${escapeHtml(ip.type)} ADDRESS</h4>
                <div class="ip-record-content">
                    <p class="ip-record-value" style="font-family: 'Inter_28pt-Regular'; word-break: break-all;">${escapeHtml(ip.ip)}</p>
                    <div class="ip-record-status">
                        <span class="ip-label">Provider</span>
                        <span class="ip-status-value">${ip.provider ? escapeHtml(ip.provider) : 'Unknown'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});

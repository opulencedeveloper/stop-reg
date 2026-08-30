document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let isLoading = false;
    let currentDomain = '';

    // Element Capture
    const dnsTableBody = document.querySelector('.dns-table tbody');
    const dnsRecordsGrid = document.querySelector('.dns-records-grid');
    const dnsNote = document.querySelector('.dns-note');

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
        fetchDnsRecords(currentDomain);
    }

    // Tab Click Handlers - Lazy Load on Tab Click
    const dnsTabs = document.querySelectorAll('.dns-tab');
    dnsTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            // Remove active class from all tabs
            dnsTabs.forEach(t => t.classList.remove('dns-tab-active'));
            // Add active class to clicked tab
            tab.classList.add('dns-tab-active');

            // Trigger fetch if not already loaded
            if (!tab.dataset.loaded && currentDomain) {
                fetchDnsRecords(currentDomain);
                tab.dataset.loaded = 'true';
            }
        });
    });

    // Mark first tab as loaded on initial call
    if (dnsTabs[0]) {
        dnsTabs[0].dataset.loaded = 'true';
    }

    // Expose for external access
    window.fetchDnsRecords = fetchDnsRecords;

    async function fetchDnsRecords(domain) {
        if (isLoading || !domain) return;
        isLoading = true;

        renderLoadingState();

        try {
            // Construct API URL
            const url = `http://localhost:8080/api/v1/seo/dns-records?domain=${encodeURIComponent(domain.toLowerCase())}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                const result = await response.json();
                // Expected structure: { data: { mxRecords, spfRecords, dmarcRecords, dkimRecords, nsRecords, soaRecords, dnssecValid } }

                const dnsData = result?.data || {};
                const mxRecords = dnsData.mxRecords || [];
                const spfRecords = dnsData.spfRecords || [];
                const dmarcRecords = dnsData.dmarcRecords || [];
                const dkimRecords = dnsData.dkimRecords || [];
                const nsRecords = dnsData.nsRecords || [];
                const soaRecords = dnsData.soaRecords || [];
                const dnssecValid = dnsData.dnssecValid || false;

                renderDnsTable(mxRecords);
                renderDnsCards(spfRecords, dmarcRecords, dkimRecords, dnssecValid);

            } else {
                console.error('DNS API Error:', await response.text());
                renderErrorState(() => fetchDnsRecords(domain));
            }

        } catch (error) {
            console.error('Network Error fetching DNS records:', error);
            renderErrorState(() => fetchDnsRecords(domain));
        } finally {
            isLoading = false;
        }
    }

    function renderLoadingState() {
        // Show spinner in table
        if (dnsTableBody) {
            dnsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="height: 200px; text-align: center; vertical-align: middle;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%; gap: 12px;">
                            <div class="stopreg-btn-spinner" style="border: 3px solid rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-right-color: #1452CA !important; width: 32px; height: 32px;"></div>
                            <span style="font-size: 14px; color: #737373; font-family: 'Inter_28pt-Regular';">Loading DNS records...</span>
                        </div>
                    </td>
                </tr>
            `;
        }

        // Show loading state in cards
        if (dnsRecordsGrid) {
            dnsRecordsGrid.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 300px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px;">
                        <div class="stopreg-btn-spinner" style="border: 3px solid rgba(20, 82, 202, 0.2) !important; border-top-color: #1452CA !important; border-right-color: #1452CA !important; width: 40px; height: 40px;"></div>
                        <span style="font-size: 14px; color: #737373; font-family: 'Inter_28pt-Regular';">Loading DNS records...</span>
                    </div>
                </div>
            `;
        }
    }

    function renderErrorState(retryFn) {
        // Error in table
        if (dnsTableBody) {
            dnsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="height: 200px; padding: 20px;">
                        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px; text-align: center;">
                            <div style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 style="font-family: 'Inter_28pt-SemiBold'; font-size: 16px; color: #111827; margin-bottom: 4px;">Failed to load DNS records</h3>
                                <p style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #6B7280;">Could not fetch DNS data at this time.</p>
                            </div>
                            <button class="dns-retry-btn" style="background-color: #1452CA; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Try Again
                            </button>
                        </div>
                    </td>
                </tr>
            `;

            const retryBtn = dnsTableBody.querySelector('.dns-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryFn);
            }
        }

        // Error in cards
        if (dnsRecordsGrid) {
            dnsRecordsGrid.innerHTML = `
                <div style="display: flex; justify-content: center; align-items: center; width: 100%; min-height: 300px;">
                    <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center;">
                        <div style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 style="font-family: 'Inter_28pt-SemiBold'; font-size: 16px; color: #111827;">Failed to load DNS records</h3>
                            <p style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #6B7280;">Could not fetch DNS data at this time.</p>
                        </div>
                        <button class="dns-retry-btn-grid" style="background-color: #1452CA; color: white; border: none; padding: 10px 24px; border-radius: 6px; font-family: 'Inter_18pt-Bold'; font-size: 14px; cursor: pointer; display: flex; align-items: center; gap: 8px; margin-top: 8px;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                    </div>
                </div>
            `;

            const retryBtn = dnsRecordsGrid.querySelector('.dns-retry-btn-grid');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryFn);
            }
        }
    }

    function renderDnsTable(mxRecords) {
        if (!dnsTableBody) return;

        if (!mxRecords || mxRecords.length === 0) {
            dnsTableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="height: 150px; text-align: center; color: #6B7280; font-family: 'Inter_28pt-Regular'; font-size: 14px;">
                        No MX records found
                    </td>
                </tr>
            `;
            return;
        }

        dnsTableBody.innerHTML = mxRecords.map(record => `
            <tr>
                <td>${record.priority || '-'}</td>
                <td>${record.host || record.domain || '-'}</td>
                <td>${record.exchange || record.mailServer || '-'}</td>
                <td>${record.ttl || '300'}</td>
            </tr>
        `).join('');
    }

    function renderDnsCards(spfRecords, dmarcRecords, dkimRecords, dnssecValid) {
        if (!dnsRecordsGrid) return;

        const spfRecord = spfRecords && spfRecords.length > 0 ? spfRecords[0] : null;
        const dmarcRecord = dmarcRecords && dmarcRecords.length > 0 ? dmarcRecords[0] : null;
        const dkimRecord = dkimRecords && dkimRecords.length > 0 ? dkimRecords[0] : null;

        const getSpfStatus = (record) => {
            if (!record) return { status: 'Not Found', class: 'dns-status-not-found' };
            if (record.includes('-all')) return { status: 'Valid', class: 'dns-status-valid' };
            if (record.includes('~all')) return { status: 'Soft Fail', class: 'dns-status-warning' };
            return { status: 'Valid', class: 'dns-status-valid' };
        };

        const getDmarcPolicy = (record) => {
            if (!record) return 'Not Found';
            if (record.includes('p=reject')) return 'Reject';
            if (record.includes('p=quarantine')) return 'Quarantine';
            if (record.includes('p=none')) return 'None';
            return 'None';
        };

        const spfStatus = getSpfStatus(spfRecord);
        const dmarcPolicy = getDmarcPolicy(dmarcRecord);
        const hasDkim = dkimRecord ? 'Published' : 'Not Published';
        const dnssecStatus = dnssecValid ? 'Implemented' : 'Not Implemented';

        dnsRecordsGrid.innerHTML = `
            <div class="dns-record-card">
                <h4 class="dns-record-title">SPF RECORD</h4>
                <div class="dns-record-content">
                    <p class="dns-record-value">${spfRecord || 'No SPF record found'}</p>
                    <div class="dns-record-status">
                        <span class="dns-label">Status</span>
                        <span class="${spfStatus.class}">${spfStatus.status}</span>
                    </div>
                    <a href="#" class="dns-record-link" onclick="return false;">
                        View full SPF record
                        <img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-link-icon" />
                        <img src="/assets/icons/chevron-right.svg" alt="Arrow" class="dns-link-icon-mobile" />
                    </a>
                </div>
            </div>

            <div class="dns-record-card">
                <h4 class="dns-record-title">DMARC RECORD</h4>
                <div class="dns-record-content">
                    <p class="dns-record-value">${dmarcRecord || 'No DMARC record found'}</p>
                    <div class="dns-record-status">
                        <span class="dns-label">Policy</span>
                        <span class="dns-status-${dmarcPolicy.toLowerCase()}">${dmarcPolicy}</span>
                    </div>
                    <a href="#" class="dns-record-link" onclick="return false;">
                        View full DMARC record
                        <img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-link-icon" />
                        <img src="/assets/icons/chevron-right.svg" alt="Arrow" class="dns-link-icon-mobile" />
                    </a>
                </div>
            </div>

            <div class="dns-record-card">
                <h4 class="dns-record-title">DKIM STATUS</h4>
                <div class="dns-record-content">
                    <p class="dns-record-value">DKIM is ${hasDkim === 'Published' ? 'published' : 'not published'} for this domain.</p>
                    <div class="dns-record-status">
                        <span class="dns-label">Status</span>
                        <span class="dns-status-${hasDkim === 'Published' ? 'valid' : 'none'}">${hasDkim}</span>
                    </div>
                    <a href="#" class="dns-record-link" onclick="return false;">
                        View full DKIM record
                        <img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-link-icon" />
                        <img src="/assets/icons/chevron-right.svg" alt="Arrow" class="dns-link-icon-mobile" />
                    </a>
                </div>
            </div>

            <div class="dns-record-card">
                <h4 class="dns-record-title">DNSSEC</h4>
                <div class="dns-record-content">
                    <p class="dns-record-value">DNSSEC is ${dnssecStatus === 'Implemented' ? 'implemented' : 'not implemented'}.</p>
                    <div class="dns-record-status">
                        <span class="dns-label">Status</span>
                        <span class="dns-status-${dnssecStatus === 'Implemented' ? 'valid' : 'not-found'}">${dnssecStatus}</span>
                    </div>
                    <a href="#" class="dns-record-link" onclick="return false;">
                        View full DNSSEC record
                        <img src="/assets/icons/angle-right-blue.svg" alt="Arrow" class="dns-link-icon" />
                        <img src="/assets/icons/chevron-right.svg" alt="Arrow" class="dns-link-icon-mobile" />
                    </a>
                </div>
            </div>
        `;
    }
});

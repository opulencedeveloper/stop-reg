document.addEventListener('DOMContentLoaded', () => {
    let isLoading = false;
    let currentDomain = '';

    // Element capture
    const mxTableBody = document.getElementById('mx-records-tbody');
    const dnsRecordsGrid = document.querySelector('.dns-records-grid');

    // Extract domain from URL path
    // URL format: /domain/lhba5510.com
    const pathParts = window.location.pathname.split('/').filter(part => part.length > 0);
    if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1];
        // Check if it looks like a domain (contains a dot)
        if (lastPart.includes('.')) {
            currentDomain = decodeURIComponent(lastPart).toLowerCase();
        }
    }

    if (currentDomain) {
        fetchDnsRecords(currentDomain);
    }

    window.fetchDnsRecords = fetchDnsRecords;

    async function fetchDnsRecords(domain) {
        if (isLoading || !domain) return;
        isLoading = true;

        try {
            const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const apiUrl = isDev
                ? `http://localhost:8080/api/v1/seo/dns-records?domain=${encodeURIComponent(domain.toLowerCase())}`
                : `https://api.stopreg.com/api/v1/seo/dns-records?domain=${encodeURIComponent(domain.toLowerCase())}`;

            const response = await fetch(apiUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const result = await response.json();
                const dnsData = result?.data || {};
                // renderMxTable(dnsData.mxRecords || [], domain);
                renderDnsCards(dnsData);
            } else {
                renderErrorState(() => fetchDnsRecords(domain));
            }
        } catch (error) {
            console.error('Network error fetching DNS records:', error);
            renderErrorState(() => fetchDnsRecords(domain));
        } finally {
            isLoading = false;
        }
    }

    // function renderMxTable(mxRecords, domain) {
    //     if (!mxTableBody) return;
    //
    //     if (!mxRecords || mxRecords.length === 0) {
    //         mxTableBody.innerHTML = `
    //             <tr>
    //                 <td colspan="4" style="text-align:center; padding:25px; color:var(--muted)">
    //                     No MX records found for ${domain}.
    //                 </td>
    //             </tr>
    //         `;
    //         return;
    //     }
    //
    //     mxTableBody.innerHTML = mxRecords.map(mx => `
    //         <tr>
    //             <td>${mx.priority || '10'}</td>
    //             <td>${mx.host || mx.exchange || 'N/A'}</td>
    //             <td>${mx.exchange || mx.host || 'N/A'}</td>
    //             <td>${mx.ttl || '300'}</td>
    //         </tr>
    //     `).join('');
    // }

    function renderDnsCards(dnsData) {
        const spfRecords = dnsData.spfRecords || [];
        const dmarcRecords = dnsData.dmarcRecords || [];
        const dkimRecords = dnsData.dkimRecords || [];
        const aRecords = dnsData.aRecords || [];
        const aaaaRecords = dnsData.aaaaRecords || [];
        const nsRecords = dnsData.nsRecords || [];
        const soaRecords = dnsData.soaRecords || [];
        const txtRecords = dnsData.txtRecords || [];
        const dnssecValid = dnsData.dnssecValid || false;

        // Helper function to get SPF status
        const getSpfStatus = (record) => {
            if (!record) return { status: 'Not Found', class: 'dns-status-not-found' };
            if (record.includes('-all')) return { status: 'Valid', class: 'dns-status-valid' };
            if (record.includes('~all')) return { status: 'Soft Fail', class: 'dns-status-warning' };
            return { status: 'Valid', class: 'dns-status-valid' };
        };

        // Helper function to get DMARC policy
        const getDmarcPolicy = (record) => {
            if (!record) return 'Not Found';
            if (record.includes('p=reject')) return 'Reject';
            if (record.includes('p=quarantine')) return 'Quarantine';
            if (record.includes('p=none')) return 'None';
            return 'None';
        };

        if (!dnsRecordsGrid) return;

        // Update each DNS record card with actual content
        const updateCard = (type, renderContent) => {
            const card = dnsRecordsGrid.querySelector(`[data-record-type="${type}"]`);
            if (!card) return;

            const valueElem = card.querySelector('.dns-record-value');
            const statusElem = card.querySelector('.dns-record-status span:last-child');

            if (valueElem) {
                valueElem.innerHTML = renderContent().value;
            }
            if (statusElem) {
                statusElem.innerHTML = renderContent().status;
                statusElem.className = renderContent().statusClass;
            }
        };

        // SPF Record
        updateCard('spf', () => {
            const record = spfRecords[0];
            const status = getSpfStatus(record);
            return {
                value: record ? `<pre style="color:#666;font-size:13px;margin:0">${record}</pre>` : '<p style="color:#999;margin:0">No SPF record found</p>',
                status: status.status,
                statusClass: status.class
            };
        });

        // DMARC Record
        updateCard('dmarc', () => {
            const record = dmarcRecords[0];
            const policy = getDmarcPolicy(record);
            let statusClass = 'dns-status-not-found';
            if (policy === 'Reject') statusClass = 'dns-status-valid';
            else if (policy === 'Quarantine') statusClass = 'dns-status-neutral';
            else if (policy !== 'Not Found') statusClass = 'dns-status-neutral';

            return {
                value: record ? `<pre style="color:#666;font-size:13px;margin:0">${record}</pre>` : '<p style="color:#999;margin:0">No DMARC record found</p>',
                status: policy,
                statusClass: statusClass
            };
        });

        // DKIM Record
        updateCard('dkim', () => {
            const hasRecord = dkimRecords.length > 0;
            const status = hasRecord ? 'Found' : 'Not Found';
            const cls = hasRecord ? 'dns-status-valid' : 'dns-status-not-found';
            return {
                value: hasRecord ? `<pre style="color:#666;font-size:13px;margin:0">${dkimRecords.join('\n')}</pre>` : '<p style="color:#999;margin:0">No DKIM records found</p>',
                status: status,
                statusClass: cls
            };
        });

        // A/AAAA Records
        updateCard('a', () => {
            const allIps = [...aRecords, ...aaaaRecords];
            const total = allIps.length;
            return {
                value: total > 0 ? `<pre style="color:#666;font-size:13px;margin:0">${allIps.join('\n')}</pre>` : '<p style="color:#999;margin:0">No A or AAAA records found</p>',
                status: `${total} IP Address${total !== 1 ? 'es' : ''}`,
                statusClass: total > 0 ? 'dns-status-valid' : 'dns-status-not-found'
            };
        });

        // NS Records
        updateCard('ns', () => {
            const total = nsRecords.length;
            return {
                value: total > 0 ? `<pre style="color:#666;font-size:13px;margin:0">${nsRecords.join('\n')}</pre>` : '<p style="color:#999;margin:0">No NS records found</p>',
                status: `${total} Nameserver${total !== 1 ? 's' : ''}`,
                statusClass: total > 0 ? 'dns-status-valid' : 'dns-status-not-found'
            };
        });

        // SOA Record
        updateCard('soa', () => {
            const record = soaRecords[0];
            const status = record ? 'Found' : 'Not Found';
            const cls = record ? 'dns-status-valid' : 'dns-status-not-found';
            const content = record ?
                `<pre style="color:#666;font-size:13px;margin:0">Primary NS: ${record.nsname || 'N/A'}\nHostmaster: ${record.hostmaster || 'N/A'}\nSerial: ${record.serial || 'N/A'}\nRefresh: ${record.refresh || 'N/A'}\nRetry: ${record.retry || 'N/A'}\nExpire: ${record.expire || 'N/A'}\nMin TTL: ${record.minttl || record.minimum || 'N/A'}</pre>` :
                '<p style="color:#999;margin:0">No SOA record found</p>';
            return {
                value: content,
                status: status,
                statusClass: cls
            };
        });

        // TXT Records
        updateCard('txt', () => {
            const total = txtRecords.length;
            const content = total > 0 ?
                `<pre style="color:#666;font-size:13px;margin:0">${txtRecords.map(r => Array.isArray(r) ? r.join(' ') : r).join('\n\n')}</pre>` :
                '<p style="color:#999;margin:0">No TXT records found</p>';
            return {
                value: content,
                status: `${total} Record${total !== 1 ? 's' : ''}`,
                statusClass: total > 0 ? 'dns-status-valid' : 'dns-status-not-found'
            };
        });

        // DNSSEC Record
        updateCard('dnssec', () => {
            const status = dnssecValid ? 'Enabled' : 'Not Enabled';
            const cls = dnssecValid ? 'dns-status-valid' : 'dns-status-not-found';
            const content = dnssecValid ?
                '<p style="color:#666;margin:0">DNSSEC is cryptographically signed and valid for this domain.</p>' :
                '<p style="color:#999;margin:0">DNSSEC is not configured or signed for this domain.</p>';
            return {
                value: content,
                status: status,
                statusClass: cls
            };
        });

        // Initialize tabs to show MX records by default
        if (typeof setDnsTab === 'function') {
            const mxTab = dnsRecordsGrid?.parentElement?.querySelector('.dns-tabs span:first-child');
            setDnsTab('mx', mxTab);
        }
    }

    function renderErrorState(retryFn) {
        if (mxTableBody) {
            mxTableBody.innerHTML = `
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

            const retryBtn = mxTableBody.querySelector('.dns-retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', retryFn);
            }
        }
    }
});

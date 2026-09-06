
document.addEventListener('DOMContentLoaded', () => {

    const tableBody = document.getElementById('api-stats-table-body');
    const prevBtn = document.querySelector('.prev');
    const nextBtn = document.querySelector('.next');
    const pageNumbersContainer = document.querySelector('.table-pagination .pagination-controls'); // Parent of page numbers
    const itemsPerPageSelect = document.querySelector('.pagination-select');

    // Reveal page immediately (table has its own spinner)
    if (window.hideSpinner) {
        window.hideSpinner();
    }

    let currentPage = 1;
    let limit = 10;
    let totalPages = 1;
    let currentSearchFilter = '';
    let allRequests = [];

    // --- Search Handler ---
    const searchInput = document.getElementById('api-stats-search-input');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearchFilter = searchInput.value.trim().toLowerCase();
                currentPage = 1;
                fetchApiStats(1);
            }, 500);
        });
    }

    // --- Helper: Status Badge HTML ---
    function getStatusBadge(status) {
        if (!status) return '<span class="status-badge">Unknown</span>';
        const s = status.toLowerCase();

        if (s === 'allow') {
            return `
                <div class="status-badge status-allowed">
                    <img src="/assets/icons/approve-outline.svg" alt="Allowed" />
                    <span>Allowed</span>
                </div>`;
        } else if (s === 'warn') {
            return `
                <div class="status-badge status-warn">
                    <img src="/assets/icons/warning-outline.svg" alt="Warn" />
                    <span>Warn</span>
                </div>`;
        } else if (s === 'blocked' || s === 'auto_blocked') {
            return `
                <div class="status-badge status-blocked">
                    <img src="/assets/icons/block-outline.svg" alt="Block" />
                    <span>Block</span>
                </div>`;
        }
        return `<span class="status-badge">${status}</span>`;
    }

    // --- Helper: Action Button HTML ---
    // --- Helper: Action Button HTML ---
    function getActionBtn(status, domain, reqId, comment) {
        const s = (status || '').toLowerCase();
        const safeComment = comment ? comment.replace(/"/g, '&quot;') : "";
        const btnAttrs = `data-id="${reqId}" data-comment="${safeComment}"`;
        
        // Return Dropdown Markup
        return `
            <div class="action-dropdown">
                <button class="action-menu-trigger" aria-label="Actions">
                    <img src="/assets/icons/more-vert.svg" alt="More" />
                </button>
                <div class="action-dropdown-menu">
                    <!-- Add to Allowlist -->
                    <button class="dropdown-item action-btn btn-add-allow" ${btnAttrs}>
                        <img src="/assets/icons/add-duotone.svg" alt="Add" />
                        <span>Add to Allowlist</span>
                    </button>
                    <!-- Add to Blocklist -->
                    <button class="dropdown-item action-btn btn-add-block" ${btnAttrs}>
                        <img src="/assets/icons/add-duotone.svg" alt="Block" />
                        <span>Add to blocklist</span>
                    </button>
                    <!-- Report -->
                    <button class="dropdown-item action-btn btn-report" ${btnAttrs}>
                        <img src="/assets/icons/flag-linear.svg" alt="Report" />
                        <span>Report</span>
                    </button>
                </div>
            </div>
        `;
    }
    
    // --- Helper: Unresolved Icon (Green for both Yes and No) ---
    function getUnresolvedIcon(val) {
        const isTrue = val > 0;
        const text = isTrue ? "Yes" : "No";
        const className = isTrue ? 'status-unresolved-yes' : 'status-unresolved-no';
        return `<div class="status-badge ${className}"><span>${text}</span></div>`;
    }

    // --- Helper: Map Classification Enum to Display Value ---
    function mapClassificationToDisplay(classification) {
        if (!classification) return '-';

        const classificationMap = {
            'disposable_address': 'disposable',
            'undeliverable_domain': 'private',
            'email_alias_native': 'alias:native',
            'email_alias_forwarding': 'alias:forwarding',
            'role_account': 'role',
            'free_subdomain_provider': 'free subdomain',
            'email_edu': 'edu',
            'email_isp': 'isp',
            'email_routing': 'relay',
            'private_domain': 'private',
            'public_mailbox_provider': 'public',
            'allowlisted_domain': 'allowlisted',
            'blocklisted_domain': 'blocklisted'
        };

        return classificationMap[classification] || '-';
    }

    // --- Helper: Classification Display ---
    function getClassificationDisplay(classification) {
        const displayValue = mapClassificationToDisplay(classification);
        if (displayValue === '-') return '<span style="color: #667085; font-size: 14px;">-</span>';
        return `<span style="color: #404040; font-size: 14px;">${displayValue}</span>`;
    }

    // --- Helper: Yes/No Badge ---
    function getYesNoBadge(value) {
        const text = value ? 'Yes' : 'No';
        const className = value ? 'status-yes' : 'status-no';
        return `<div class="status-badge ${className}"><span>${text}</span></div>`;
    }

    // --- Fetch Data ---
    async function fetchApiStats(page = 1) {
        // Show Spinner
        tableBody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <div class="stopreg-spinner" style="border-top-color: #1452CA; border-right-color: #1452CA; margin: 0 auto;"></div>
                </td>
            </tr>
        `;

        const token = localStorage.getItem('authToken');
        try {
            let url = `https://api.stopreg.com/api/v1/user/info/requests?page=${page}&limit=${limit}&last30Days=true&requestType=single`;
            if (currentSearchFilter) {
                url += `&search=${encodeURIComponent(currentSearchFilter)}`;
            }
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (await window.handleAuthError(response)) {
                return;
            }

            if (response.ok && data.data) {
                // Response structure: { data: { docs: [...], meta: { ... } } }
                const requests = data.data.docs || [];
                const pagination = data.data.meta || {};

                allRequests = requests;
                renderTable(requests);
                setupPagination(pagination);
            } else {
                throw new Error(data.message || 'Failed to fetch statistics');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; color: var(--error-color);">
                        Failed to load data. <button onclick="window.fetchRequests()" style="text-decoration: underline; background: none; border: none; cursor: pointer; color: inherit;">Retry</button>
                    </td>
                </tr>
            `;
            
            // Invoke Premium Error Modal
            if (window.showPremiumError) {
                let errorTitle = 'Data Load Error';
                let errorMessage = error.message;

                if (errorMessage === 'Failed to fetch' || errorMessage.includes('NetworkError')) {
                    errorTitle = 'Network Error';
                    errorMessage = 'Please check your internet connection and try aagain.';
                }

                window.showPremiumError(errorTitle, errorMessage, () => fetchApiStats(page));
            }
        }
    }

    // --- Render Table ---
    function renderTable(requests) {
        tableBody.innerHTML = '';

        if (requests.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">No requests found.</td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            const row = document.createElement('tr');

            const domainName = req.domain || 'N/A';
            const reqId = req._id;
            const comment = req.comment;

            // Classification display (mapped from enum)
            const classificationHtml = getClassificationDisplay(req.classification);

            // MX Found (hasMxRecords) and Role Acc (isRoleDomain) badges
            const mxFoundHtml = getYesNoBadge(req.hasMxRecords);
            const roleAccHtml = getYesNoBadge(req.isRoleDomain);

            row.innerHTML = `
                <td>${domainName}</td>
                <td class="table-center">${req.provider || '-'}</td>
                <td class="table-center">${classificationHtml}</td>
                <td class="table-center">${mxFoundHtml}</td>
                <td class="table-center">${roleAccHtml}</td>
                <td class="table-center">${req.requestCount || 1}</td>
                <td class="table-center">${getStatusBadge(req.status)}</td>
                <td class="table-center">
                    ${getActionBtn(req.status, domainName, reqId, comment)}
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // --- Pagination Setup ---
    function setupPagination(pagination) {
        if (!pagination) return;
        
        currentPage = pagination.page;
        totalPages = pagination.totalPages;

        // Update Buttons
        prevBtn.disabled = currentPage <= 1;
        nextBtn.disabled = currentPage >= totalPages;

        // Render Page Numbers
        // (Simplified logic: just show current, or simple 1, 2... N)
        // For robust pagination, we need more logic.
        // Reusing basic "prev/next/current" update for now.
        
        // Clear existing page numbers (keeping prev/next buttons if they are outside container, 
        // but here they are siblings in .pagination-controls)
        
        // Actually, easiest way is to target the .page-number elements if they exist, or rebuild.
        // Let's rebuild the middle part.
        
        const controls = document.querySelector('.pagination-controls');
        controls.innerHTML = ''; // Start clean
        
        // Prev Button
        const prev = document.createElement('button');
        prev.className = 'page-nav-btn prev';
        prev.disabled = currentPage <= 1;
        prev.innerHTML = '<img src="/assets/icons/angle-right.svg" alt="Previous" class="rotate-180" />';
        prev.onclick = () => { if(currentPage > 1) changePage(currentPage - 1); };
        controls.appendChild(prev);

        // Page Numbers (Simple range: max 5 visible)
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + 4);
        
        if (endPage - startPage < 4) {
            startPage = Math.max(1, endPage - 4);
        }

        for (let i = startPage; i <= endPage; i++) {
            const btn = document.createElement('button');
            btn.className = `page-number ${i === currentPage ? 'active' : ''}`;
            btn.textContent = i;
            btn.onclick = () => changePage(i);
            controls.appendChild(btn);
        }

        // Next Button
        const next = document.createElement('button');
        next.className = 'page-nav-btn next';
        next.disabled = currentPage >= totalPages;
        next.innerHTML = '<img src="/assets/icons/angle-right.svg" alt="Next" />';
        next.onclick = () => { if(currentPage < totalPages) changePage(currentPage + 1); };
        controls.appendChild(next);
    }

    function changePage(newPage) {
        if (newPage < 1 || newPage > totalPages) return;
        fetchApiStats(newPage);
    }

    // Items Per Page Change
    if (itemsPerPageSelect) {
        itemsPerPageSelect.addEventListener('change', (e) => {
            limit = parseInt(e.target.value);
            fetchApiStats(1); // Reset to page 1
        });
    }

    // Initialize
    fetchApiStats();
    
    // Expose for external use (e.g. index-modals.js)
    window.fetchRequests = () => fetchApiStats(currentPage);
});

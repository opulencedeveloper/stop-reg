
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
        window.location.href = '/sign-in.html';
        return;
    }

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

    // --- Helper: Status Badge HTML ---
    function getStatusBadge(status) {
        if (!status) return '<span class="status-badge">Unknown</span>';
        const s = status.toLowerCase();
        
        if (s === 'allowed' || s === 'allow') {
            return `
                <div class="status-badge status-allowed">
                    <img src="/assets/icons/approve-outline.svg" alt="Allow" />
                    <span>Allowed</span>
                </div>`;
        } else if (s === 'blocked' || s === 'block') {
            return `
                <div class="status-badge status-blocked">
                    <img src="/assets/icons/block-outline.svg" alt="Blocked" />
                    <span>Blocked</span>
                </div>`;
        } else if (s === 'reported' || s === 'report') {
            return `
                <div class="status-badge status-reported">
                    <img src="/assets/icons/flag-linear.svg" alt="Reported" />
                    <span>Reported</span>
                </div>`;
        }
        return `<span class="status-badge">${status}</span>`;
    }

    // --- Helper: Action Button HTML ---
    function getActionBtn(status, domain, reqId, comment) {
        const s = (status || '').toLowerCase();
        const safeComment = comment ? comment.replace(/"/g, '&quot;') : "";
        const btnAttrs = `data-id="${reqId}" data-comment="${safeComment}"`;
        
        let actionBtn = "";

        // Logic matched from chart.js
        if (s === "blocked") {
             actionBtn = `<button class="action-btn btn-add-allow" style="color: #1452CA;" ${btnAttrs}><div class="action-icon-wrapper"><img src="/assets/icons/add-duotone.svg" alt="Add" /></div>Add to allowlist</button>`;
        } else if (s === "allow" || s === "allowed") {
             actionBtn = `<button class="action-btn btn-add-block" style="color: #1452CA;" ${btnAttrs}><div class="action-icon-wrapper"><img src="/assets/icons/add-duotone.svg" alt="Block" /></div>Add to block list</button>`;
        } else if (s === "reported") {
             actionBtn = `<button class="action-btn btn-add-block" style="color: #1452CA;" ${btnAttrs}><div class="action-icon-wrapper"><img src="/assets/icons/add-duotone.svg" alt="Block" /></div>Add to block list</button>`;
        } else {
             // Default / Unresolved / Other
             actionBtn = `<button class="action-btn btn-report" style="color: #1452CA;" ${btnAttrs}><div class="action-icon-wrapper"><img src="/assets/icons/flag-linear-blue.svg" alt="Report" /></div>Report</button>`;
        }
        return actionBtn;
    }
    
    // --- Helper: Boolean Check Icon ---
    function getBoolIcon(value) {
        // user wants "Disposable", "Relay", "Free Provider" columns
        // index.html implementation usually uses a checkmark or 'Yes'/'No' text?
        // Let's assume text or simple check based on design. 
        // If not specified, text is safest.
        return value ? 'Yes' : 'No';
    }


    // --- Fetch Data ---
    async function fetchApiStats(page = 1) {
        // Show Spinner
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <div class="stopreg-spinner" style="border-top-color: #1452CA; border-right-color: #1452CA; margin: 0 auto;"></div>
                </td>
            </tr>
        `;

        try {
            const response = await fetch(`http://localhost:8080/api/v1/user/info/requests?page=${page}&limit=${limit}&last30Days=true`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.data) {
                // Response structure: { data: { docs: [...], meta: { ... } } }
                const requests = data.data.docs || [];
                const pagination = data.data.meta || {};
                
                renderTable(requests);
                setupPagination(pagination);
            } else {
                throw new Error(data.message || 'Failed to fetch statistics');
            }

        } catch (error) {
            console.error('Fetch error:', error);
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; color: var(--error-color);">
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
                    errorMessage = 'Please check your internet connection and try again.';
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
                    <td colspan="7" style="text-align: center; padding: 20px;">No requests found.</td>
                </tr>
            `;
            return;
        }

        requests.forEach(req => {
            // Format: Domain, Status, Disposable, Relay, Free Provider, Request Count, Action
            const row = document.createElement('tr');
            
            // Domain (req.domainId.domainName or req.domainName?)
            // Based on user sample: "domain": "samplemail.com"
            const domainName = req.domain || 'N/A';
            const reqId = req._id;
            const comment = req.comment;
            
            row.innerHTML = `
                <td>${domainName}</td>
                <td class="table-center">${getStatusBadge(req.status)}</td>
                <td class="table-center">${getBoolIcon(req.isDiposableDomain)}</td>
                <td class="table-center">${getBoolIcon(req.isRelayDomain)}</td>
                <td class="table-center">${getBoolIcon(req.isFreeEmailProvider)}</td>
                <td class="table-center">${req.requestCount || 1}</td>
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

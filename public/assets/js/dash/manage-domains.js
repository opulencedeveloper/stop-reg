document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Spinner Handling
    const spinner = document.getElementById('spinner-body');
    const content = document.getElementById('content');
    
    window.addEventListener('load', () => {
        if (spinner) spinner.style.display = 'none';
        if (content) content.style.display = 'block';
        document.body.classList.remove('hidden-overflow');
    });

    // 2. State
    const state = {
        blocked: { page: 1, limit: 10 },
        allowed: { page: 1, limit: 10 },
        reported: { page: 1, limit: 10 }
    };
    
    // 3. Elements Mapping
    const configs = {
        blocked: {
            tbody: document.querySelector('.manage-domains-section:nth-of-type(1) .req-table tbody'),
            pagination: document.querySelector('.manage-domains-section:nth-of-type(1) .pagination-container'),
            emptyTitle: "No domains have been blocked yet",
            emptyDesc: "Block a domain to view results here."
        },
        allowed: {
            tbody: document.querySelector('.manage-domains-section:nth-of-type(2) .req-table tbody'),
            pagination: document.querySelector('.manage-domains-section:nth-of-type(2) .pagination-container'),
            emptyTitle: "No domains have been allowed yet",
            emptyDesc: "Allow a domain to view results here."
        },
        reported: {
            tbody: document.querySelector('.manage-domains-section:nth-of-type(3) .req-table tbody'),
            pagination: document.querySelector('.manage-domains-section:nth-of-type(3) .pagination-container'),
            emptyTitle: "No domains have been reported yet",
            emptyDesc: "Report a domain to view results here."
        }
    };

    // 4. Initialization
    Object.keys(configs).forEach(status => {
        fetchDomains(status, state[status].page, state[status].limit);
    });

    // 5. Fetch Function
    async function fetchDomains(status, page, limitValue) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const config = configs[status];
        if (!config || !config.tbody) return;

        // Set Loading State
        config.tbody.innerHTML = `
            <tr>
                <td colspan="5" style="height: 200px; text-align: center; vertical-align: middle;">
                     <div class="chart-loading-state">
                        <div class="chart-spinner" style="animation: spin 0.3s linear infinite;"></div>
                        <span class="chart-loading-text">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        try {
            const params = new URLSearchParams({
                status: status, // blocked, allowed, reported
                page: page,
                limit: limitValue
            });

            const url = `https://api.stopreg.com/api/v1/manage/domain/fetch?${params.toString()}`;
            console.log(`Fetching ${status} domains:`, url);

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                console.log(`Response for ${status}:`, result);
                const docs = result?.data?.data || [];
                const total = result?.data?.total || 0;
                
                // Update State for this status
                state[status].page = page;
                state[status].limit = limitValue;

                // Render Table
                renderTableByStatus(status, docs);

                // Update Pagination
                if (config.pagination) {
                    config.pagination.style.display = total > 0 ? 'flex' : 'none';
                    if (total > 0) {
                        const totalPages = Math.ceil(total / limitValue);
                        renderGlobalPagination(config.pagination, status, { page, totalPages, total });
                    }
                }

            } else {
                console.error(`Failed to fetch ${status} domains`);
                renderErrorByStatus(status, () => fetchDomains(status, page, limitValue));
            }

        } catch (error) {
            console.error(`Network error, for ${status}:`, error);
            renderErrorByStatus(status, () => fetchDomains(status, page, limitValue));
        }
    }

    // Expose globally for modals to refresh specific tables
    window.fetchDomains = (status, page = 1, limit = 10) => {
        // Fix for 'allow' vs 'allowed' inconsistency if any
        let normalizedStatus = status.toLowerCase();
        if (normalizedStatus === 'allow') normalizedStatus = 'allowed';
        
        if (state[normalizedStatus]) {
            fetchDomains(normalizedStatus, page, limit);
        }
    };

    // 6. Render Functions
    function renderTableByStatus(status, items) {
        const config = configs[status];
        if (!config.tbody) return;

        if (items.length === 0) {
            renderEmptyRow(config.tbody, config.emptyTitle, config.emptyDesc);
            return;
        }

        config.tbody.innerHTML = items.map(item => {
            const domainId = item._id || "";
            const domainName = item.domain || "";
            const domainComment = item.comment || "";
            const currentStatus = item.status || "-";
            const btnAttrs = `data-id="${domainId}" data-domain="${domainName.replace(/"/g, '&quot;')}" data-comment="${domainComment.replace(/"/g, '&quot;')}" data-status="${currentStatus}"`;

            if (status === 'blocked') {
                const isAuto = currentStatus === 'auto_blocked';
                return `
                    <tr>
                        <td>${domainName || "Unknown"}</td>
                        <td>
                            <div class="status-badge badge-blocked">
                                <img src="/assets/icons/block-outline.svg" alt="" />
                                ${isAuto ? 'Auto Blocked' : 'Blocked'}
                            </div>
                        </td>
                        <td class="comment-td">${domainComment || "-"}</td>
                        <td class="table-right">
                            <div class="domain-actions">
                                <button class="action-icon-btn edit-action-btn" title="Edit" ${btnAttrs}>
                                    <img src="/assets/icons/edit-outline.svg" alt="Edit" class="icon-edit" />
                                </button>
                                <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${domainId}">
                                    <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else if (status === 'allowed') {
                 return `
                    <tr>
                        <td>${domainName || "Unknown"}</td>
                        <td>
                            <div class="status-badge badge-allow">
                                <img src="/assets/icons/approve-outline.svg" alt="" />
                                Allow
                            </div>
                        </td>
                        <td class="comment-td">${domainComment || "-"}</td>
                        <td class="table-right">
                             <div class="domain-actions">
                                <button class="action-icon-btn edit-action-btn" title="Edit" ${btnAttrs}>
                                    <img src="/assets/icons/edit-outline.svg" alt="Edit" class="icon-edit" />
                                </button>
                                <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${domainId}">
                                    <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            } else { // reported
                 return `
                    <tr>
                        <td>${domainName || "Unknown"}</td>
                        <td>${item.ourStatus || "-"}</td>
                        <td>
                            <div class="status-badge badge-reported">
                                <img src="/assets/icons/flag-linear.svg" alt="" />
                                Reported
                            </div>
                        </td>
                        <td class="comment-td">${domainComment || "-"}</td>
                        <td class="table-right">
                             <div class="domain-actions">
                                <button class="action-icon-btn edit-action-btn" title="Edit" ${btnAttrs}>
                                    <img src="/assets/icons/edit-outline.svg" alt="Edit" class="icon-edit" />
                                </button>
                                <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${domainId}">
                                    <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }).join('');
    }

    function renderEmptyRow(tbody, title, desc) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content">
                        <h3 class="empty-state-title">${title}</h3>
                        <p class="empty-state-desc">${desc}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderErrorByStatus(status, retryFn) {
        const tbody = configs[status]?.tbody;
        if (!tbody) return;
        
        tbody.innerHTML = `
             <tr>
                <td colspan="5" style="height: 200px; padding: 0;">
                    <div class="fetch-error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;">
                        <h3 class="error-title" style="font-size: 16px;">Failed to load data</h3>
                        <button class="retry-btn">Try Again</button>
                    </div>
                </td>
            </tr>
        `;
        const btn = tbody.querySelector('.retry-btn');
        if (btn) btn.onclick = retryFn;
    }

    // 7. Pagination Logic (Status Aware)
    function renderGlobalPagination(container, status, meta) {
        const { page, totalPages } = meta;
        const currentLimit = state[status].limit;
        
        container.innerHTML = `
            <div class="table-pagination">
                <div class="pagination-select-container">
                    <select class="pagination-select">
                        <option value="10" ${currentLimit === 10 ? 'selected' : ''}>10 per page</option>
                    </select>
                    <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="#344054" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>

                <div class="pagination-controls">
                </div>
            </div>
        `;

        const controls = container.querySelector('.pagination-controls');
        const select = container.querySelector('.pagination-select');

        if (select) {
            select.addEventListener('change', (e) => {
                const newLimit = parseInt(e.target.value);
                state[status].limit = newLimit;
                fetchDomains(status, 1, newLimit);
            });
        }
        
        let buttonsHtml = '';
        buttonsHtml += `
            <button class="page-nav-btn prev" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
                <img src="/assets/icons/angle-right.svg" alt="Previous" class="rotate-180" />
            </button>
        `;

        const delta = 1;
        const range = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i);
            }
        }

        range.forEach(i => {
            if (l) {
                if (i - l === 2) {
                    buttonsHtml += `<button class="page-number" data-page="${l + 1}">${l + 1}</button>`;
                } else if (i - l !== 1) {
                    buttonsHtml += `<span class="page-dots">...</span>`;
                }
            }
            buttonsHtml += `<button class="page-number ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
            l = i;
        });

        buttonsHtml += `
            <button class="page-nav-btn next" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
                <img src="/assets/icons/angle-right.svg" alt="Next" />
            </button>
        `;

        controls.innerHTML = buttonsHtml;

        controls.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const newPage = parseInt(btn.dataset.page);
                fetchDomains(status, newPage, currentLimit);
            });
        });
    }

    // 8. Delete Functionality
    const deleteModal = document.getElementById('delete-request-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let itemToDeleteId = null;
    let btnTriggeringDelete = null;

    function openDeleteModal(id, btn) {
        itemToDeleteId = id;
        btnTriggeringDelete = btn;
        if (deleteModal) deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.style.display = 'none';
        itemToDeleteId = null;
        btnTriggeringDelete = null;
    }

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
             if (e.target === deleteModal) closeDeleteModal();
        });
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-action-btn');
        if (btn) {
            const id = btn.dataset.id;
            if (id) openDeleteModal(id, btn);
        }
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!itemToDeleteId) return;

            const originalContent = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner" style="width: 14px; height: 14px;"></span> Deleting...`;

            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`https://api.stopreg.com/api/v1/manage/domain/delete?domainId=${itemToDeleteId}`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({ message: "Deleted successfully", position: "topRight" });
                    }
                    
                    // Local UI removal instead of refetching
                    if (btnTriggeringDelete) {
                        const row = btnTriggeringDelete.closest('tr');
                        const tbody = row?.parentElement;
                        if (row) row.remove();

                        // If table becomes empty, show empty state and hide pagination
                        if (tbody && tbody.querySelectorAll('tr').length === 0) {
                            const status = Object.keys(configs).find(key => configs[key].tbody === tbody);
                            if (status) {
                                renderEmptyRow(tbody, configs[status].emptyTitle, configs[status].emptyDesc);
                                if (configs[status].pagination) {
                                    configs[status].pagination.style.display = 'none';
                                }
                            }
                        }
                    }
                    
                    closeDeleteModal();
                } else {
                    const data = await response.json();
                    throw new Error(data.message || "Failed to delete");
                }
            } catch (err) {
                console.error(err);
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ message: err.message || "Failed to delete", position: "topRight" });
                }
            } finally {
                confirmDeleteBtn.innerHTML = originalContent;
                confirmDeleteBtn.disabled = false;
            }
        });
    }
});

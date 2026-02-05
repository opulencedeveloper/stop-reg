document.addEventListener('DOMContentLoaded', () => {
    // 1. Initial Spinner Handling
    const spinner = document.getElementById('spinner-body');
    const content = document.getElementById('content');
    
    // Hide spinner once JS loads (or rely on data fetch to complete)
    // For Better UX, we keep spinner until first fetch done or timeout
    // But since we have specific table spinners, we can hide global one quickly
    window.addEventListener('load', () => {
        if (spinner) spinner.style.display = 'none';
        if (content) content.style.display = 'block';
        document.body.classList.remove('hidden-overflow');
    });

    // 2. State
    let currentPage = 1;
    let limit = 10;
    
    // 3. Elements
    // Blocked
    const blockedTableBody = document.querySelector('.manage-domains-section:nth-of-type(1) .req-table tbody');
    const blockedPagination = document.querySelector('.manage-domains-section:nth-of-type(1) .pagination-container');
    
    // Allow
    const allowTableBody = document.querySelector('.manage-domains-section:nth-of-type(2) .req-table tbody');
    const allowPagination = document.querySelector('.manage-domains-section:nth-of-type(2) .pagination-container');
    
    // Reported
    const reportedTableBody = document.querySelector('.manage-domains-section:nth-of-type(3) .req-table tbody');
    // Note: Reported section in HTML might not have pagination container based on design, 
    // but we should support it if present or use the shared state.
    // Looking at the view_file, the reported section DOES NOT have a pagination-container in the snippet provided.
    // If it's missing, we just won't render pagination for it, but the data will still change based on global page.
    const reportedPagination = document.querySelector('.manage-domains-section:nth-of-type(3) .pagination-container');

    // 4. Initialization
    fetchDomains(currentPage, limit);

    // 5. Fetch Function
    async function fetchDomains(page, pageSize) {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = '/';
            return;
        }

        // Set Loading State for all tables
        const loadingHtml = `
            <tr>
                <td colspan="5" style="height: 200px; text-align: center; vertical-align: middle;">
                     <div class="chart-loading-state">
                        <div class="chart-spinner" style="animation: spin 0.3s linear infinite;"></div>
                        <span class="chart-loading-text">Loading...</span>
                    </div>
                </td>
            </tr>
        `;
        
        if (blockedTableBody) blockedTableBody.innerHTML = loadingHtml;
        if (allowTableBody) allowTableBody.innerHTML = loadingHtml;
        if (reportedTableBody) reportedTableBody.innerHTML = loadingHtml;

        try {
            const url = `http://localhost:8080/api/v1/user/info/requests?page=${page}&limit=${pageSize}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                const docs = result?.data?.docs || [];
                const meta = result?.data?.meta || { page: 1, totalPages: 1 };

                currentPage = meta.page;

                // Process Data
                const blockedItems = [];
                const allowItems = [];
                const reportedItems = [];

                docs.forEach(doc => {
                    const status = (doc.status || "").toLowerCase();
                    const ourStatus = (doc.ourStatus || "").toLowerCase(); // For reported table
                    const yourStatus = status;

                    // Classify
                    // "Blocked List": Items that USER has blocked
                    if (status === 'blocked') {
                        blockedItems.push(doc);
                    }
                    
                    // "Allow List": Items that USER has allowed
                    if (status === 'allow') {
                        allowItems.push(doc);
                    }

                    // "Reported List": Items that USER has reported
                    if (status === 'reported') {
                        reportedItems.push(doc);
                    }
                });

                // Render Tables
                renderBlockedTable(blockedItems);
                renderAllowTable(allowItems);
                renderReportedTable(reportedItems);

                // Update All Pagination Controls
                // Update All Pagination Controls
                // Hide pagination if table is empty (User Requirement)
                if (blockedPagination) {
                    blockedPagination.style.display = blockedItems.length > 0 ? 'flex' : 'none';
                    if (blockedItems.length > 0) renderGlobalPagination(blockedPagination, meta);
                }
                
                if (allowPagination) {
                    allowPagination.style.display = allowItems.length > 0 ? 'flex' : 'none';
                    if (allowItems.length > 0) renderGlobalPagination(allowPagination, meta);
                }
                
                if (reportedPagination) {
                    reportedPagination.style.display = reportedItems.length > 0 ? 'flex' : 'none';
                    if (reportedItems.length > 0) renderGlobalPagination(reportedPagination, meta);
                }

            } else {
                console.error("Failed to fetch domains");
                renderAllErrors(() => fetchDomains(page, pageSize));
            }

        } catch (error) {
            console.error("Network error:", error);
            renderAllErrors(() => fetchDomains(page, pageSize));
        }
    }

    // 6. Render Functions
    function renderBlockedTable(items) {
        if (!blockedTableBody) return;
        if (items.length === 0) {
            renderEmptyRow(blockedTableBody, "No domains have been blocked yet", "Block a domain to view results here.");
            return;
        }

        blockedTableBody.innerHTML = items.map(item => `
            <tr>
                <td>${item.domain || "Unknown"}</td>
                <td>
                    <div class="status-badge badge-blocked">
                        <img src="/assets/icons/block-outline.svg" alt="" />
                        Blocked
                    </div>
                </td>
                <td class="comment-td">${item.comment || "-"}</td>
                <td class="table-right">
                    <div class="domain-actions">
                         <button class="action-icon-btn" title="Edit" onclick="openEditModal('${item._id}')" style="display:none;"> <!-- Edit not requested yet -->
                            <img src="/assets/icons/edit-outline.svg" alt="Edit" class="icon-edit" />
                        </button>
                        <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${item._id}">
                            <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderAllowTable(items) {
        if (!allowTableBody) return;
        if (items.length === 0) {
            renderEmptyRow(allowTableBody, "No domains have been allowed yet", "Allow a domain to view results here.");
            return;
        }

        allowTableBody.innerHTML = items.map(item => `
            <tr>
                <td>${item.domain || "Unknown"}</td>
                <td>
                    <div class="status-badge badge-allow">
                        <img src="/assets/icons/approve-outline.svg" alt="" />
                        Allow
                    </div>
                </td>
                <td class="comment-td">${item.comment || "-"}</td>
                <td class="table-right">
                     <div class="domain-actions">
                        <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${item._id}">
                            <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    function renderReportedTable(items) {
        if (!reportedTableBody) return;
        if (items.length === 0) {
            renderEmptyRow(reportedTableBody, "No domains have been reported yet", "Report a domain to view results here.");
            return;
        }

        reportedTableBody.innerHTML = items.map(item => `
            <tr>
                <td>${item.domain || "Unknown"}</td>
                <td>${item.ourStatus || "-"}</td>
                <td>
                    <div class="status-badge badge-reported">
                        <img src="/assets/icons/flag-linear.svg" alt="" />
                        Reported
                    </div>
                </td>
                <td class="comment-td">${item.comment || "-"}</td>
                <td class="table-right">
                     <div class="domain-actions">
                        <button class="action-icon-btn delete-action-btn" title="Delete" data-id="${item._id}">
                            <img src="/assets/icons/delete.svg" alt="Delete" class="icon-delete" />
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
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

    function renderAllErrors(retryFn) {
        const errorHtml = `
             <tr>
                <td colspan="5" style="height: 200px; padding: 0;">
                    <div class="fetch-error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;">
                        <h3 class="error-title" style="font-size: 16px;">Failed to load data</h3>
                        <button class="retry-btn">Try Again</button>
                    </div>
                </td>
            </tr>
        `;
        
        [blockedTableBody, allowTableBody, reportedTableBody].forEach(tbody => {
            if (tbody) {
                tbody.innerHTML = errorHtml;
                const btn = tbody.querySelector('.retry-btn');
                if (btn) btn.onclick = retryFn;
            }
        });
    }

    // 7. Pagination Logic (Shared)
    function renderGlobalPagination(container, meta) {
        const { page, totalPages } = meta;
        
        // We completely replace the container innerHTML to match api-count structure
        container.innerHTML = `
            <div class="table-pagination">
                <div class="pagination-select-container">
                    <select class="pagination-select">
                        <option value="10" ${limit === 10 ? 'selected' : ''}>10 per page</option>
                        <option value="20" ${limit === 20 ? 'selected' : ''}>20 per page</option>
                        <option value="50" ${limit === 50 ? 'selected' : ''}>50 per page</option>
                    </select>
                    <svg class="select-arrow" width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 1L5 5L9 1" stroke="#344054" stroke-width="1.33" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                </div>

                <div class="pagination-controls">
                    <!-- Controls injected below -->
                </div>
            </div>
        `;

        const controls = container.querySelector('.pagination-controls');
        const select = container.querySelector('.pagination-select');

        // Bind Select
        if (select) {
            select.addEventListener('change', (e) => {
                const newLimit = parseInt(e.target.value);
                if (newLimit && newLimit !== limit) {
                    limit = newLimit;
                    currentPage = 1; // Reset to page 1
                    fetchDomains(currentPage, limit);
                }
            });
        }
        
        let buttonsHtml = '';
        
        // Prev Button
        buttonsHtml += `
            <button class="page-nav-btn prev" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
                <img src="/assets/icons/angle-right.svg" alt="Previous" class="rotate-180" />
            </button>
        `;

        // Simplified Pagination Dots Logic
        const delta = 1;
        const range = [];
        const rangeWithDots = [];
        let l;

        for (let i = 1; i <= totalPages; i++) {
            if (i === 1 || i === totalPages || (i >= page - delta && i <= page + delta)) {
                range.push(i);
            }
        }

        range.forEach(i => {
            if (l) {
                if (i - l === 2) {
                    rangeWithDots.push(l + 1);
                } else if (i - l !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            l = i;
        });

        rangeWithDots.forEach(p => {
             if (p === '...') {
                buttonsHtml += `<span class="page-dots">...</span>`;
            } else {
                buttonsHtml += `<button class="page-number ${p === page ? 'active' : ''}" data-page="${p}">${p}</button>`;
            }
        });

        // Next Button
        buttonsHtml += `
            <button class="page-nav-btn next" ${page >= totalPages ? 'disabled' : ''} data-page="${page + 1}">
                <img src="/assets/icons/angle-right.svg" alt="Next" />
            </button>
        `;

        controls.innerHTML = buttonsHtml;

        // Add Listeners
        controls.querySelectorAll('button:not([disabled])').forEach(btn => {
            btn.addEventListener('click', () => {
                const newPage = parseInt(btn.dataset.page);
                if (newPage && newPage !== currentPage) {
                    fetchDomains(newPage, limit);
                }
            });
        });
    }

    // 8. Delete Functionality (Custom Modal)
    const deleteModal = document.getElementById('delete-request-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let itemToDeleteId = null;

    function openDeleteModal(id) {
        itemToDeleteId = id;
        if (deleteModal) deleteModal.style.display = 'flex';
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.style.display = 'none';
        itemToDeleteId = null;
    }

    // Bind Close Events
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
             if (e.target === deleteModal) closeDeleteModal();
        });
    }

    // Global Listener for Delete Buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-action-btn');
        if (btn) {
            const id = btn.dataset.id;
            if (id) openDeleteModal(id);
        }
    });

    // Confirm Delete Action
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!itemToDeleteId) return;

            const originalContent = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner" style="width: 14px; height: 14px;"></span> Deleting...`;

            try {
                const token = localStorage.getItem("authToken");
                const response = await fetch(`http://localhost:8080/api/v1/request/delete?id=${itemToDeleteId}`, {
                    method: 'DELETE',
                    headers: { "Authorization": `Bearer ${token}` }
                });

                if (response.ok) {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({ message: "Deleted successfully", position: "topRight" });
                    }
                    closeDeleteModal();
                    // Refresh current page
                    fetchDomains(currentPage, limit);
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

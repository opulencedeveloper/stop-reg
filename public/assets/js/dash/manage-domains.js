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
            colspan: 4,
            emptyTitle: "No domains have been blocked yet",
            emptyDesc: "Block a domain to view results here."
        },
        allowed: {
            tbody: document.querySelector('.manage-domains-section:nth-of-type(2) .req-table tbody'),
            pagination: document.querySelector('.manage-domains-section:nth-of-type(2) .pagination-container'),
            colspan: 4,
            emptyTitle: "No domains have been allowed yet",
            emptyDesc: "Allow a domain to view results here."
        },
        reported: {
            tbody: document.querySelector('.manage-domains-section:nth-of-type(3) .req-table tbody'),
            pagination: document.querySelector('.manage-domains-section:nth-of-type(3) .pagination-container'),
            colspan: 5,
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

        // Set Loading State immediately so spinner shows during plan check too
        config.tbody.innerHTML = `
            <tr>
                <td colspan="${config.colspan}">
                    <div class="chart-loading-state">
                        <div class="chart-spinner"></div>
                        <span class="chart-loading-text">Loading...</span>
                    </div>
                </td>
            </tr>
        `;

        // Plan Check for Blocked and Allow lists
        if (status === 'blocked' || status === 'allowed') {
            try {
                const planName = await window.getUserPlan();
                if (planName && planName.trim().toLowerCase() === "free") {
                    renderPremiumRestriction(config.tbody, status === 'blocked' ? 'Block list' : 'Allow list');
                    if (config.pagination) config.pagination.style.display = 'none';
                    return;
                }
            } catch (err) {
                console.warn("Plan check failed for fetch", err);
            }
        }

        try {
            const params = new URLSearchParams({
                status: status, // blocked, allowed, reported
                page: page,
                limit: limitValue
            });

            const url = `https://api.stopreg.com/api/v1/manage/domain/fetch?${params.toString()}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
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
    function getStatusBadgeHtml(status) {
        if (!status || status === '-') return '-';
        
        const lowerStatus = status.toLowerCase();
        let badgeClass = '';
        let icon = '';
        let label = '';

        if (lowerStatus === 'blocked' || lowerStatus === 'auto_blocked') {
            badgeClass = 'badge-blocked';
            icon = 'block-outline.svg';
            label = lowerStatus === 'auto_blocked' ? 'Auto Blocked' : 'Blocked';
        } else if (lowerStatus === 'allowed') {
            badgeClass = 'badge-allow';
            icon = 'approve-outline.svg';
            label = 'Allow';
        } else if (lowerStatus === 'notified') {
            badgeClass = 'badge-notified';
            icon = 'caution.svg';
            label = 'Notified';
        } else if (lowerStatus === 'reported') {
            badgeClass = 'badge-reported';
            icon = 'flag-linear.svg';
            label = 'Reported';
        } else {
            return status;
        }

        return `
            <div class="status-badge ${badgeClass}">
                <img src="/assets/icons/${icon}" alt="" />
                ${label}
            </div>
        `;
    }

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
                            ${getStatusBadgeHtml(currentStatus)}
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
                const isNotified = currentStatus === 'notified';
                 return `
                    <tr>
                        <td>${domainName || "Unknown"}</td>
                        <td>
                            ${getStatusBadgeHtml(currentStatus)}
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
                        <td>${getStatusBadgeHtml(item.ourStatus)}</td>
                        <td>
                            ${getStatusBadgeHtml('reported')}
                        </td>
                        <td class="comment-td">${domainComment || "-"}</td>
                        <td class="table-right">
                             <div class="domain-actions">
                                <button class="action-icon-btn edit-action-btn" title="Edit" ${btnAttrs}>
                                    <img src="/assets/icons/edit-outline.svg" alt="Edit" class="icon-edit" />
                                </button>
                                <button class="action-icon-btn delete-action-btn" title="Delete" ${btnAttrs}>
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

    function renderPremiumRestriction(tbody, featureName) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty-state-cell">
                    <div class="empty-state-content premium-restriction">
                        <img src="/assets/icons/lock-blue.svg" alt="Premium" />
                        <p class="empty-state-title">Premium Feature</p>
                        <p class="empty-state-subtitle">${featureName} is available on paid plans. <br>Please upgrade to <strong>Launch</strong> or higher to manage your domain lists.</p>
                        <a href="/dashboard/payments.html" class="btn btn-primary btn-upgrade">Upgrade Now</a>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderErrorByStatus(status, retryFn) {
        const config = configs[status];
        if (!config?.tbody) return;

        config.tbody.innerHTML = `
            <tr>
                <td colspan="${config.colspan}">
                    <div class="fetch-error-state">
                        <div class="error-icon-wrapper">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h3 class="error-title">Failed to load data</h3>
                        <p class="error-desc">Something went wrong. Please try again.</p>
                        <button class="retry-btn">Try Again</button>
                    </div>
                </td>
            </tr>
        `;
        const btn = config.tbody.querySelector('.retry-btn');
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

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-action-btn');
        if (btn) {
            // Plan Check for Delete (Reporting is FREE to manage)
            const status = btn.dataset.status || "";
            if (status.toLowerCase() !== 'reported') {
                try {
                    const planName = await window.getUserPlan();
                    if (planName && planName.trim().toLowerCase() === "free") {
                        if (typeof window.showUpgradeToast === 'function') {
                            window.showUpgradeToast();
                        } else if (typeof iziToast !== 'undefined') {
                            iziToast.info({
                                title: 'Upgrade Required',
                                message: 'Domain management features are available on Paid plans.',
                                position: 'topRight'
                            });
                        }
                        return;
                    }
                } catch (err) {
                    console.warn("Plan check failed for delete", err);
                }
            }

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

    // CSV Import Handler
    const csvImportOverlay = document.getElementById('csv-import-modal-overlay');
    const csvFileInput = document.getElementById('csv-file-input');
    const csvBackBtn = document.getElementById('csv-back-btn');
    const csvImportBtn = document.getElementById('csv-import-btn');
    const csvDoneBtn = document.getElementById('csv-done-btn');
    const closeCSVModal = document.getElementById('close-csv-import-modal');

    console.log('CSV Import elements loaded:');
    console.log('- csvImportOverlay:', csvImportOverlay);
    console.log('- csvFileInput:', csvFileInput);
    console.log('- csvBackBtn:', csvBackBtn);
    console.log('- csvImportBtn:', csvImportBtn);
    console.log('- csvDoneBtn:', csvDoneBtn);
    console.log('- closeCSVModal:', closeCSVModal);

    let csvData = [];
    let currentStatus = '';

    // Open modal from import buttons
    document.querySelectorAll('.md-import-csv').forEach(btn => {
        btn.addEventListener('click', () => {
            currentStatus = btn.dataset.status;
            csvImportOverlay.classList.add('is-active');
            resetCSVImportModal();
        });
    });

    // Close modal
    if (closeCSVModal) {
        closeCSVModal.addEventListener('click', () => {
            csvImportOverlay.classList.add('is-exiting');
            setTimeout(() => {
                csvImportOverlay.classList.remove('is-active', 'is-exiting');
            }, 300);
        });
    }

    // File input change (for click selection)
    if (csvFileInput) {
        csvFileInput.addEventListener('change', async () => {
            console.log('File input changed');
            if (csvFileInput.files.length > 0) {
                try {
                    const file = csvFileInput.files[0];
                    console.log('Processing selected file:', file.name);
                    const text = await file.text();
                    const rows = text.trim().split('\n').map(row => row.trim()).filter(row => row);

                    csvData = rows.map(row => row.split(',')[0].trim()).filter(domain => domain);
                    console.log('CSV Data parsed:', csvData);

                    showCSVPreview();
                    console.log('Preview shown after click selection');
                } catch (err) {
                    console.error('Error processing selected file:', err);
                }
            }
        });
    }

    // Drag and drop functionality
    const csvFileLabel = document.querySelector('.csv-file-label');
    if (csvFileLabel) {
        console.log('CSV File Label found:', csvFileLabel);

        // Click to select file
        csvFileLabel.addEventListener('click', () => {
            console.log('Label clicked, triggering file input');
            csvFileInput.click();
        });

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            csvFileLabel.addEventListener(eventName, preventDefaults, false);
            document.body.addEventListener(eventName, preventDefaults, false);
        });

        function preventDefaults(e) {
            e.preventDefault();
            e.stopPropagation();
        }

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            csvFileLabel.addEventListener(eventName, () => {
                console.log('Drag over detected');
                csvFileLabel.classList.add('csv-file-label-active');
            }, false);
        });

        // Remove highlight when item leaves
        ['dragleave', 'drop'].forEach(eventName => {
            csvFileLabel.addEventListener(eventName, () => {
                console.log('Drag leave/drop detected');
                csvFileLabel.classList.remove('csv-file-label-active');
            }, false);
        });

        // Handle dropped files
        csvFileLabel.addEventListener('drop', async (e) => {
            console.log('Drop event triggered');
            const dt = e.dataTransfer;
            const files = dt.files;
            console.log('Files received:', files);

            if (files.length > 0) {
                console.log('Processing file:', files[0].name);

                // Create a DataTransfer to set files
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(files[0]);
                csvFileInput.files = dataTransfer.files;

                console.log('File set to input, csvFileInput.files:', csvFileInput.files);

                // Auto-preview after drop
                try {
                    const file = files[0];
                    const text = await file.text();
                    const rows = text.trim().split('\n').map(row => row.trim()).filter(row => row);

                    csvData = rows.map(row => row.split(',')[0].trim()).filter(domain => domain);
                    console.log('CSV Data parsed:', csvData);

                    showCSVPreview();
                    console.log('Preview auto-shown after drop');
                } catch (err) {
                    console.error('Error auto-previewing:', err);
                }
            }
        }, false);
    } else {
        console.error('CSV File Label not found!');
    }

    // Back button
    if (csvBackBtn) {
        csvBackBtn.addEventListener('click', () => {
            document.getElementById('csv-import-step-2').style.display = 'none';
            document.getElementById('csv-import-step-1').style.display = 'block';
        });
    }

    // Import button
    if (csvImportBtn) {
        csvImportBtn.addEventListener('click', async () => {
            csvImportBtn.disabled = true;
            csvImportBtn.innerHTML = '<span class="stopreg-btn-spinner" style="width: 14px; height: 14px;"></span> Importing...';

            try {
                const token = localStorage.getItem('authToken');
                const response = await fetch('https://api.stopreg.com/api/v1/manage/domain/import-csv', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        domains: csvData,
                        status: currentStatus
                    })
                });

                const result = await response.json();

                if (response.ok) {
                    showCSVResults(result.data);
                    fetchDomains(currentStatus, state[currentStatus].page, state[currentStatus].limit);
                } else {
                    throw new Error(result.description || 'Import failed');
                }
            } catch (err) {
                console.error(err);
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ message: err.message || 'Failed to import', position: 'topRight' });
                }
                document.getElementById('csv-import-step-2').style.display = 'none';
                document.getElementById('csv-import-step-1').style.display = 'block';
            } finally {
                csvImportBtn.disabled = false;
                csvImportBtn.innerHTML = 'Import';
            }
        });
    }

    // Done button
    if (csvDoneBtn) {
        csvDoneBtn.addEventListener('click', () => {
            csvImportOverlay.classList.add('is-exiting');
            setTimeout(() => {
                csvImportOverlay.classList.remove('is-active', 'is-exiting');
            }, 300);
        });
    }

    function resetCSVImportModal() {
        csvData = [];
        csvFileInput.value = '';
        document.getElementById('csv-import-step-1').style.display = 'block';
        document.getElementById('csv-import-step-2').style.display = 'none';
        document.getElementById('csv-import-step-3').style.display = 'none';
    }

    function showCSVPreview() {
        const tbody = document.getElementById('csv-preview-tbody');
        tbody.innerHTML = '';

        const previewData = csvData.slice(0, 10);
        previewData.forEach(domain => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${domain}</td>`;
            tbody.appendChild(row);
        });

        document.getElementById('csv-import-step-1').style.display = 'none';
        document.getElementById('csv-import-step-2').style.display = 'block';
    }

    function showCSVResults(results) {
        document.getElementById('csv-result-added').textContent = results.added;
        document.getElementById('csv-result-duplicates').textContent = results.duplicates;
        document.getElementById('csv-result-failed').textContent = results.failed;

        document.getElementById('csv-import-step-2').style.display = 'none';
        document.getElementById('csv-import-step-3').style.display = 'block';

        if (typeof iziToast !== 'undefined') {
            iziToast.success({
                message: `Successfully imported ${results.added} domains`,
                position: 'topRight'
            });
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const spinner = document.getElementById('spinner-body');
    const content = document.getElementById('content');
        if (spinner) {
            spinner.style.display = 'none';
        }
        if (content) {
            content.style.display = 'block';
        }
        document.body.classList.remove('hidden-overflow');

    // State
    let currentPage = 1;
    let limit = 10; // Default matches HTML select
    let totalPages = 1;
    let isLoading = false;

    // Elements
    const tableBody = document.querySelector('.req-table tbody');
    const paginationContainer = document.querySelector('.table-pagination');
    const limitSelect = document.querySelector('.pagination-select');
    
    // Initial Load
    fetchApiRequests(currentPage, limit);
    fetchUserInfo();

    // Event Listeners
    if (limitSelect) {
        limitSelect.addEventListener('change', (e) => {
            // "10 per page" -> parse 10
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
                limit = val;
                currentPage = 1; // Reset to first page
                fetchApiRequests(currentPage, limit);
            }
        });
    }

    // --- User Info Fetching (Migrated from fetch-user-detail.js) ---
    async function fetchUserInfo() {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Elements
        const card = document.querySelector(".plan-status-card");
        const planNameEl = document.querySelector(".plan-highlight");
        const planUsageEl = document.querySelector(".plan-usage-text");
        const expiryEl = document.querySelector(".plan-status-expiry");

        // Loading State (Granular)
        // Using chart-spinner from index.css. 
        // Inline-block and vertical-align to align with text.
        // Size reduced to 20px to fit in text lines.
        // Loading State (Granular)
        // Using chart-spinner from index.css. 
        // Inline-block and vertical-align to align with text.
        // Size reduced to 20px to fit in text lines.
        // Explicitly faster animation (0.3s) to make it look very fast.
        const loadingSpinner = `<div class="chart-spinner" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; animation: spin 0.3s linear infinite;"></div>`;
        
        if (planNameEl) planNameEl.innerHTML = loadingSpinner;
        if (planUsageEl) planUsageEl.innerHTML = loadingSpinner;
        if (expiryEl) expiryEl.innerHTML = `Expires: ${loadingSpinner}`;

        try {
            const response = await fetch("http://localhost:8080/api/v1/user/info", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const container = data?.data || data;
                const user = container.userDetails;

                if (!user) throw new Error("No user details found");

                // 1. Update Plan Name
                if (planNameEl && user.planId?.name) {
                    const name = user.planId.name; 
                    planNameEl.textContent = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase() + " plan";
                }

                // 2. Update Usage
                if (planUsageEl && user.planId) {
                   const limit = user.apiRequestLeft ?? 0;
                   planUsageEl.textContent = `${limit.toLocaleString()} API requests left`;
                }

                // 3. Update Expiry
                if (expiryEl && user.tokenExpiresAt) {
                    const date = new Date(user.tokenExpiresAt);
                    const formattedDetails = date.toLocaleDateString("en-US", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                    });
                    expiryEl.textContent = `Expires: ${formattedDetails}`;
                }
            } else {
                throw new Error("Failed to fetch user info");
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
            // Render Error State in the Card
            if (card) {
                renderCardError(card, fetchUserInfo);
            }
        }
    }

    function renderCardError(container, retryFn) {
        // Using classes from index.css (assumed present since api-count.html links index.css)
        container.innerHTML = `
            <div class="fetch-error-state" style="padding: 20px; height: 100%; justify-content: center; flex-direction: row; gap: 12px;">
                <div class="error-icon-wrapper" style="width: 32px; height: 32px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div style="flex: 1; text-align: left;">
                     <h3 class="error-title" style="font-size: 14px; margin-bottom: 2px;">Load Failed</h3>
                     <p class="error-desc" style="font-size: 12px; margin: 0;">Plan info unavailable.</p>
                </div>
                <button class="retry-btn" style="padding: 6px 12px; font-size: 12px; height: auto;">
                    Retry
                </button>
            </div>
        `;
        const btn = container.querySelector('.retry-btn');
        if (btn) btn.addEventListener('click', () => {
             // Restore Skeleton
             container.innerHTML = `
                <div class="plan-status-card-inner">
                    <div class="plan-status-icon">
                        <img src="/assets/icons/bi_stars.svg" alt="" />
                    </div>
                    <div class="plan-status-info">
                        <p class="plan-name-text">Currently on <span class="plan-highlight"></span></p>
                        <p class="plan-usage-text"></p>
                    </div>
                </div>
                <div class="plan-status-expiry"></div>
             `;
             retryFn();
        });
    }


    // --- Core Functions ---

    async function fetchApiRequests(page, pageSize) {
        if (isLoading) return;
        isLoading = true;
        
        renderLoadingState();
        
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                console.warn("No auth token found");
                return;
            }

            // Construct Query
            // Note: Endpoint /api/v1/user/info/requests is verified from user prompt
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
                // Expected Structure: { status, message, data: { docs: [], meta: {...} } }
                
                const docs = result?.data?.docs || [];
                const meta = result?.data?.meta || { page: 1, totalPages: 1, totalDocs: 0 };
                
                currentPage = meta.page;
                totalPages = meta.totalPages;
                
                renderTable(docs);
                renderPagination(meta);
                
            } else {
                console.error("API Error:", await response.text());
                renderErrorState(() => fetchApiRequests(page, pageSize));
            }

        } catch (error) {
            console.error("Network Error:", error);
            renderErrorState(() => fetchApiRequests(page, pageSize));
        } finally {
            isLoading = false;
        }
    }

    function renderLoadingState() {
        if (!tableBody) return;
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="height: 300px; text-align: center; vertical-align: middle;">
                     <div class="chart-loading-state">
                        <div class="chart-spinner" style="animation: spin 0.3s linear infinite;"></div>
                        <span class="chart-loading-text">Loading requests...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderErrorState(retryFn) {
        if (!tableBody) return;
        tableBody.innerHTML = `
            <tr>
                <td colspan="4" style="height: 300px; padding: 0;">
                    <div class="fetch-error-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 16px;">
                        <div class="error-icon-wrapper" style="width: 48px; height: 48px; background: #FEF2F2; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div style="text-align: center;">
                            <h3 class="error-title" style="font-family: 'Inter_28pt-SemiBold'; font-size: 16px; color: #111827; margin-bottom: 4px;">Failed to load requests</h3>
                            <p class="error-desc" style="font-family: 'Inter_28pt-Regular'; font-size: 14px; color: #6B7280;">We couldn't fetch the latest data.</p>
                        </div>
                        <button class="retry-btn" style="display: flex; align-items: center; gap: 8px; padding: 8px 16px; background: #fff; border: 1px solid #D1D5DB; border-radius: 6px; font-family: 'Inter_28pt-Medium'; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s;">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Try Again
                        </button>
                    </div>
                </td>
            </tr>
        `;
        
        const btn = tableBody.querySelector('.retry-btn');
        if (btn) btn.addEventListener('click', retryFn);
    }

    function renderTable(docs) {
        if (!tableBody) return;
        
        if (docs.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" style="height: 200px; text-align: center; color: #6B7280; font-family: 'Inter_28pt-Regular';">
                        No requests found.
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = docs.map(doc => {
            // Format Date
            const date = new Date(doc.createdAt).toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(',', '');
            
            return `
                <tr>
                    <td>
                        <div class="api-cell">
                            <span>${doc.domain || 'Unknown'}</span>
                            <button class="copy-icon-btn copy-api-btn" data-text="${doc.domain || ''}">
                                <img src="/assets/icons/copy.svg" alt="Copy" style="pointer-events: none;" />
                            </button>
                        </div>
                    </td>
                    <td>${date}</td>
                    <td>${doc.requestCount || 0}</td>
                    <td class="table-right">
                        <button class="action-icon-btn delete-red" title="Delete" data-id="${doc._id}">
                            <img src="/assets/icons/delete.svg" alt="Delete" />
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Modal Elements
    const deleteModal = document.getElementById('delete-request-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
    let requestToDeleteId = null;

    // Functions to Open/Close Modal
    function openDeleteModal(id) {
        if (!deleteModal) return;
        requestToDeleteId = id;
        deleteModal.style.display = 'flex';
        // Simple animation class if supported, or rely on flex
        const box = deleteModal.querySelector('.otp-box');
        if (box) {
             box.style.animation = 'slideDown 0.3s ease';
        }
    }

    function closeDeleteModal() {
        if (!deleteModal) return;
        deleteModal.style.display = 'none';
        requestToDeleteId = null;
    }

    // Event Delegation for Table Actions
    if (tableBody) {
        tableBody.addEventListener('click', async (e) => {
            // Handle Copy
            const copyBtn = e.target.closest('.copy-api-btn');
            if (copyBtn) {
                // ... Existing Copy Logic ...
                const text = copyBtn.dataset.text;
                if (!text) return;
                try {
                    await navigator.clipboard.writeText(text);
                    const originalContent = copyBtn.innerHTML;
                    copyBtn.style.width = 'auto'; 
                    copyBtn.style.minWidth = '24px';
                    copyBtn.innerHTML = `<span style="font-family: 'Inter_28pt-Regular'; font-size: 12px; color: #16A34A;">Copied</span>`;
                    setTimeout(() => { copyBtn.innerHTML = originalContent; }, 2000);
                } catch (err) { console.error('Failed to copy', err); }
                return;
            }

            // Handle Delete Click
            const deleteBtn = e.target.closest('.delete-red');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                if (id) {
                    openDeleteModal(id);
                }
            }
        });
    }

    // Modal Listeners
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', closeDeleteModal);
    }

    if (deleteModal) {
        deleteModal.addEventListener('click', (e) => {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!requestToDeleteId) return;

            const originalContent = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner" style="width: 16px; height: 16px; border-width: 2px;"></span> Deleting...`;

            try {
                const token = localStorage.getItem("authToken"); // Ensure token is available scope-wise or fetch again
                const response = await fetch(`http://localhost:8080/api/v1/request/delete?id=${requestToDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                       "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            message: "Request deleted successfully",
                            position: "topRight"
                        });
                    }
                    closeDeleteModal();
                    // Refresh Table
                    fetchApiRequests(currentPage, limit);
                } else {
                    throw new Error(data.message || "Failed to delete");
                }
            } catch (error) {
                console.error("Delete failed:", error);
                
                let msg = error.message || "Failed to delete request";
                if (msg === 'Failed to fetch' || msg.toLowerCase().includes('network')) {
                    msg = "Network Error: Please check your connection.";
                }

                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        message: msg,
                        position: "topRight"
                    });
                }
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = originalContent;
            }
        });
    }

    function renderPagination(meta) {
        if (!paginationContainer) return;
        
        const { page, totalPages, totalDocs } = meta;
        const paginationControls = paginationContainer.querySelector('.pagination-controls');
        
        if (!paginationControls) return;

        // Generate Buttons Logic
        let buttonsHtml = '';
        
        // Previous Button
        buttonsHtml += `
            <button class="page-nav-btn prev" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">
                <img src="/assets/icons/angle-right.svg" alt="Previous" class="rotate-180" />
            </button>
        `;

        // Page Numbers
        // Simple logic: Show all if <= 7, otherwise use dots
        // For simplicity: [1] ... [current-1] [current] [current+1] ... [last]
        // Implementing full logic per standard practices:
        
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

        paginationControls.innerHTML = buttonsHtml;

        // Re-attach listeners involved with new DOM
        const pageBtns = paginationControls.querySelectorAll('button:not([disabled])');
        pageBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const newPage = parseInt(btn.dataset.page);
                if (newPage && newPage !== currentPage) {
                    fetchApiRequests(newPage, limit);
                }
            });
        });
    }

});

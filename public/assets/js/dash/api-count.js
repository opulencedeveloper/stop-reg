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

    async function fetchUserInfo() {
        try {
            const token = localStorage.getItem("authToken");
            if (!token) return;

            // Select Elements
            const planHighlightEl = document.querySelector(".plan-highlight");
            const planUsageEl = document.querySelector(".plan-usage-text");
            const planExpiryEl = document.querySelector(".plan-status-expiry");

            const response = await fetch("https://api-stop-reg.onrender.com/api/v1/user/info", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                const user = data?.data || data;
                const userDetails = user.userDetails;

                if (userDetails) {
                    // 1. Update Plan Name
                    if (planHighlightEl && userDetails.planId?.name) {
                        planHighlightEl.textContent = `${userDetails.planId.name} plan`;
                    }

                    // 2. Update Usage
                    if (planUsageEl) {
                        const apiRequestLeft = userDetails.apiRequestLeft ?? 0;
                        planUsageEl.textContent = `${apiRequestLeft} API requests left`;
                    }

                    // 3. Update Expiry
                    if (planExpiryEl && userDetails.tokenExpiresAt) {
                        const expiresDate = new Date(userDetails.tokenExpiresAt);
                        const formattedDate = expiresDate.toLocaleDateString('en-GB', { 
                            day: 'numeric', month: 'long', year: 'numeric' 
                        });
                        planExpiryEl.textContent = `Expires: ${formattedDate}`;
                    }
                }
            } else {
                console.error("Failed to fetch user info for plan details");
            }
        } catch (error) {
            console.error("Error fetching user info:", error);
        }
    }

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

    // Expose fetchApiRequests globally
    window.fetchApiRequests = fetchApiRequests;

    async function fetchApiRequests(page = 1, pageSize = 10) {
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
            const url = `https://api-stop-reg.onrender.com/api/v1/api-token/fetch?page=${page}&limit=${pageSize}`;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            if (response.ok) {
                const result = await response.json();
                // Structure: { message, description, data: { data: [], total: N, limit: N } }
                
                const docs = result?.data?.data || [];
                const total = result?.data?.total || 0;
                
                // Calculate total pages manually since API returns total count
                totalPages = Math.ceil(total / pageSize);
                if (totalPages < 1) totalPages = 1;
                
                currentPage = page;
                
                renderTable(docs);
                renderPagination({ page: currentPage, totalPages: totalPages });
                
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
                <td colspan="5" style="height: 300px; text-align: center; vertical-align: middle;">
                     <div class="chart-loading-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 100%; height: 100%;">
                        <div class="chart-spinner" style="animation: spin 0.3s linear infinite;"></div>
                        <span class="chart-loading-text">Loading tokens...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderErrorState(retryFn) {
        if (!tableBody) return;
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="height: 300px; padding: 0;">
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
                        <button class="retry-btn retry-btn-style">
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
                    <td colspan="5" style="height: 200px; text-align: center; color: #6B7280; font-family: 'Inter_28pt-Regular';">
                        No API tokens found.
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
            
            // Format Last Used
            const lastUsed = doc.lastUsed ? new Date(doc.lastUsed).toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(',', '') : 'Never';

            return `
                <tr>
                    <td>
                        <div class="api-cell">
                            <span>${doc.token ? (doc.token.length > 20 ? doc.token.substring(0, 20) + '...' : doc.token) : 'Unknown'}</span>
                            <button class="copy-icon-btn copy-api-btn" data-text="${doc.token || ''}">
                                <img src="/assets/icons/copy.svg" alt="Copy" style="pointer-events: none;" />
                            </button>
                        </div>
                    </td>
                    <td>${date}</td>
                    <td>${lastUsed}</td>
                    <td>${doc.count || 0}</td>
                    <td class="table-right">
                         <!-- Assuming delete endpoint logic remains similar or needs update separately. 
                              Keeping ID for potential delete action -->
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
    let rowToDelete = null;

    // Functions to Open/Close Modal
    function openDeleteModal(id, rowElement) {
        if (!deleteModal) return;
        requestToDeleteId = id;
        rowToDelete = rowElement; // Store the row
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
        rowToDelete = null;
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
                const row = deleteBtn.closest('tr');
                if (id) {
                    openDeleteModal(id, row);
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
                const token = localStorage.getItem("authToken"); 
                const response = await fetch(`https://api-stop-reg.onrender.com/api/v1/api-token/delete?id=${requestToDeleteId}`, {
                    method: 'DELETE',
                    headers: {
                       "Authorization": `Bearer ${token}`
                    }
                });

                const data = await response.json();

                if (response.ok) {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            message: "Token deleted successfully",
                            position: "topRight"
                        });
                    }
                    // Remove row locally
                    if (rowToDelete) {
                        rowToDelete.remove();
                        // Check if table is empty
                        const rows = tableBody.querySelectorAll('tr');
                        if (rows.length === 0) {
                            renderTable([]);
                        }
                    }
                    closeDeleteModal();
                } else {
                    throw new Error(data.message || "Failed to delete");
                }
            } catch (error) {
                console.error("Delete failed:", error);
                
                let msg = error.message || "Failed to delete token";
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

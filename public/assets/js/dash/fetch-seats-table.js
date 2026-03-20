
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("seats-table-body");
    const paginationControls = document.getElementById("seats-pagination-controls");
    const limitSelect = document.getElementById("seats-per-page-select");
    
    let currentPage = 1;
    let limit = 10;
    let totalItems = 0;

    // Plan Check: Disable seats management for Free users
    const planName = localStorage.getItem("planName");
    const isFreePlan = planName === "Free";
    const addSeatBtn = document.getElementById("add-seats-trigger");

    if (isFreePlan) {
        if (addSeatBtn) {
            addSeatBtn.disabled = true;
            addSeatBtn.classList.add("btn-disabled");
            addSeatBtn.title = "Seat management is a premium feature";
        }
        
        if (tableBody) {
             tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-cell">
                        <div class="empty-state-content premium-restriction">
                            <img src="/assets/icons/lock-blue.svg" alt="Premium" />
                            <p class="empty-state-title">Premium Feature</p>
                            <p class="empty-state-subtitle">Seat management is available on paid plans. <br>Please upgrade to <strong>Launch</strong> or higher to invite team members.</p>
                            <a href="/dashboard/payments.html" class="btn btn-primary btn-upgrade">Upgrade Now</a>
                        </div>
                    </td>
                </tr>
            `;
        }
        forceHideSpinner();
        return; // Stop execution for Free plan
    }

    // Initial Fetch
    fetchSeatsTable(currentPage, limit);

    // Force hide global page spinner on window load
    // This ensures we don't wait for background fetches (like user details) to show the page
    function forceHideSpinner() {
        if (typeof window.hideSpinner === 'function') {
            window.hideSpinner();
        }
    }

    if (document.readyState === 'complete') {
        forceHideSpinner();
    } else {
        window.addEventListener('load', forceHideSpinner);
    }

    // Event Listeners
    if (limitSelect) {
        limitSelect.addEventListener("change", (e) => {
            limit = parseInt(e.target.value);
            currentPage = 1; // Reset to page 1 on limit change
            fetchSeatsTable(currentPage, limit);
        });
    }

    // Expose for external use (e.g. invite-seat.js)
    window.fetchSeatsTable = fetchSeatsTable;

    async function fetchSeatsTable(page, limit) {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Show Loading Spinner
        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 40px;">
                        <div class="stopreg-spinner" style="width: 32px; height: 32px; border-width: 3px; margin: 0 auto;"></div>
                    </td>
                </tr>
            `;
        }

        try {
            const response = await fetch(`http://localhost:8080/api/v1/seat/fetch?limit=${limit}&page=${page}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.data && Array.isArray(data.data.data)) {
                totalItems = data.data.total;
                renderTableRows(data.data.data);
                renderPagination(data.data.page, data.data.total, data.data.limit);
            } else {
                throw new Error(data.message || "Failed to fetch seats");
            }
        } catch (error) {
            console.error("Error fetching seats table:", error);
            renderErrorState();
        }
    }

    function renderTableRows(users) {
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="empty-state-cell">
                        <div class="empty-state-content">
                            <p class="empty-state-title">No Seat yet</p>
                            <p class="empty-state-subtitle">Add your first seat to view results here</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        const html = users.map(user => {
            const createdDate = new Date(user.createdAt).toLocaleString();
            
            // Logic for Resend Icon: Show ONLY if acceptedInviation is false
            const resendBtnHtml = !user.acceptedInviation ? `
                <button class="action-icon-btn resend-btn" title="Resend Invitation" data-id="${user._id}" data-email="${user.email}">
                    <img src="/assets/icons/email-resend-outline.svg" alt="Resend" />
                </button>
            ` : '';

            return `
                <tr>
                    <td>${user.email}</td>
                    <td>${user.firstName}</td>
                    <td>${user.lastName}</td>
                    <td>${createdDate}</td>
                    <td>
                        <span class="status-text ${user.acceptedInviation ? 'status-active' : 'status-pending'}">
                            ${user.acceptedInviation ? 'Registered' : 'Pending'}
                        </span>
                    </td>
                    <td class="table-center">
                        <div class="seat-actions">
                            ${resendBtnHtml}
                            <button class="action-icon-btn delete delete-seat-btn" title="Delete Seat" data-id="${user._id}">
                                <img src="/assets/icons/delete.svg" alt="Delete" />
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join("");

        tableBody.innerHTML = html;

        // Attach listeners for actions (just console log for now or placeholder)
        document.querySelectorAll(".delete-seat-btn").forEach(btn => {
            btn.addEventListener("click", (e) => {
                // To be implemented: Delete confirmation
                console.log("Delete clicked for ID:", btn.dataset.id);
            });
        });
    }

    function renderPagination(currentPage, total, limit) {
        if (!paginationControls) return;

        const totalPages = Math.ceil(total / limit);
        
        let html = `
            <button class="page-nav-btn prev" ${currentPage === 1 ? 'disabled' : ''}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M7 13L1 7L7 1" stroke="#344054" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        `;

        // Simple Pagination Logic: Show current, prev, next, first, last simplified
        // For standard "1 ... 4 5 6 ... 10" logic, we use a helper.
        // Let's implement a simplified generic version:
        
        const maxVisible = 5;
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage < maxVisible - 1) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        if (startPage > 1) {
             html += `<button class="page-number" data-page="1">1</button>`;
             if (startPage > 2) html += `<span class="page-dots">...</span>`;
        }

        for (let i = startPage; i <= endPage; i++) {
            html += `<button class="page-number ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) html += `<span class="page-dots">...</span>`;
            html += `<button class="page-number" data-page="${totalPages}">${totalPages}</button>`;
        }

        html += `
            <button class="page-nav-btn next" ${currentPage === totalPages ? 'disabled' : ''}>
                <svg width="8" height="14" viewBox="0 0 8 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M1 13L7 7L1 1" stroke="#344054" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
            </button>
        `;

        paginationControls.innerHTML = html;

        // Attach Event Listeners
        paginationControls.querySelectorAll("button").forEach(btn => {
            btn.addEventListener("click", () => {
                if (btn.classList.contains("prev") && currentPage > 1) {
                    currentPage--;
                } else if (btn.classList.contains("next") && currentPage < totalPages) {
                    currentPage++;
                } else if (btn.dataset.page) {
                    currentPage = parseInt(btn.dataset.page);
                }
                
                if (!btn.disabled && !btn.classList.contains("active")) {
                    fetchSeatsTable(currentPage, limit);
                }
            });
        });
    }

    function renderErrorState() {
        if (!tableBody) return;
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: 40px;">
                    <p style="color: #dc3545; font-size: 14px; margin-bottom: 12px;">Failed to load seat users</p>
                    <button id="retry-seats-table-btn" style="background-color: #fff; border: 1px solid #d0d5dd; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500;">
                        Retry
                    </button>
                </td>
            </tr>
        `;

        const retryBtn = document.getElementById("retry-seats-table-btn");
        if (retryBtn) {
            retryBtn.addEventListener("click", () => fetchSeatsTable(currentPage, limit));
        }
    }
});

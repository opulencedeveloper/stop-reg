/**
 * Admin Domains Page JavaScript
 * Handles paginated domain management with high-fidelity error handling and session protection.
 */

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "http://localhost:8080/api/v1/admin";


    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    
    // Static containers that aren't replaced
    const domainsContainer = getEl("admin-domains-error-target");
    const paginationContainer = getEl("admin-pagination");
    const tabButtons = document.querySelectorAll(".tab-btn");

    let currentTab = "reported"; // Default tab
    let currentPage = 1;
    let currentLimit = 10;

    // Preserve original HTML for restoration after error
    const originalHTML = domainsContainer ? domainsContainer.innerHTML : "";

    // --- API UTILITIES ---
    async function apiFetch(endpoint, options = {}) {
        const url = `${BASE_URL}${endpoint}`;
        const defaultOptions = {
            headers: {
                "Authorization": `Bearer ${adminToken}`,
                "Content-Type": "application/json"
            }
        };

        try {
            const response = await fetch(url, { ...defaultOptions, ...options });

            if (window.handleAdminAuthError(response)) {
                return null;
            }

            return await response.json();
        } catch (error) {
            console.error("API Fetch Error:", error);
            // Standardized Network Error detection
            if (error.message.includes("Failed to fetch") || error instanceof TypeError) {
                throw new Error("Network error, please check your connection and try again.");
            }
            throw error;
        }
    }

    // --- UI HELPERS ---
    const showLoading = () => {
        // Re-select dynamic loader
        const domainsLoading = getEl("admin-domains-loading");
        if (domainsLoading) domainsLoading.style.display = "flex";
        
        // Hide all tab contents dynamically
        document.querySelectorAll(".tab-content").forEach(content => {
            content.style.display = "none";
            content.classList.remove("active");
        });
        
        if (paginationContainer) paginationContainer.style.display = "none";
    };

    const hideLoading = () => {
        const domainsLoading = getEl("admin-domains-loading");
        if (domainsLoading) domainsLoading.style.display = "none";
    };

    const renderSectionError = (message, retryFn) => {
        hideLoading();
        if (!domainsContainer) return;

        domainsContainer.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load domains</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                </button>
            </div>
        `;

        const btn = domainsContainer.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            domainsContainer.innerHTML = originalHTML; // Restore structure
            retryFn();
        };
    };

    // --- DATA LOADING & RENDERING ---
    async function loadDomains(status = "reported", page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/domains?status=${status}&page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "Error") {
                throw new Error(result?.description || "Failed to fetch domains.");
            }

            hideLoading();
            renderDomainsTable(status, result.data.domains);
            renderPagination(result.data.pagination);
            
            // Re-show active tab content dynamically
            const activeTabContent = getEl(`${status}-content`);
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadDomains(status, page));
        }
    }

    function renderDomainsTable(status, domains) {
        const tbody = getEl(`${status}-tbody`);
        if (!tbody) return;

        if (domains.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #737373;">No ${status} domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = domains.map(d => {
            if (status === "reported") {
                return `
                    <tr>
                        <td>${d.email}</td>
                        <td>${d.domain}</td>
                        <td><div class="comment-text">${d.comment || "-"}</div></td>
                        <td class="status-cell">${getStatusBadge(d.ourStatus)}</td>
                        <td class="status-cell">${getStatusBadge(d.status)}</td>
                        <td>
                            <button class="action-btn-circle" onclick="handleDomainAction('${d.id}', 'process')">
                                <img src="/assets/icons/gg_unblock.svg" alt="Process" />
                            </button>
                        </td>
                    </tr>
                `;
            } else if (status === "blocked") {
                return `
                    <tr>
                        <td>${d.email}</td>
                        <td>${d.domain}</td>
                        <td><div class="comment-text">${d.comment || "-"}</div></td>
                        <td class="status-cell">${getStatusBadge(d.status)}</td>
                        <td>
                            <button class="action-btn-circle" onclick="handleDomainAction('${d.id}', 'unblock')">
                                <img src="/assets/icons/stop.svg" alt="Unblock" />
                            </button>
                        </td>
                    </tr>
                `;
            } else { // allowlist (allowed)
                return `
                    <tr>
                        <td>${d.email}</td>
                        <td>${d.domain}</td>
                        <td class="status-cell">${getStatusBadge(d.status)}</td>
                    </tr>
                `;
            }
        }).join("");
    }

    function getStatusBadge(status) {
        switch (status?.toLowerCase()) {
            case "blocked":
                return `<div class="status-badge blocked"><img src="/assets/icons/block-outline.svg" alt="" /><span>Blocked</span></div>`;
            case "reported":
                return `<div class="status-badge reported"><img src="/assets/icons/flag-linear.svg" alt="" /><span>Reported</span></div>`;
            case "allowed":
            case "allow":
                return `<div class="status-badge allowed"><img src="/assets/icons/approve-outline.svg" alt="" /><span>Allow</span></div>`;
            default:
                return `<div class="status-badge" style="background: #F5F5F5; color: #595959;"><span>${status || "-"}</span></div>`;
        }
    }

    function renderPagination(pagination) {
        if (!paginationContainer) return;

        const { page, pages, total } = pagination;
        if (pages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        let html = `
            <button class="pagination-btn prev-btn" ${page <= 1 ? "disabled" : ""}>
                <img src="/assets/icons/angle-right.svg" alt="Prev" style="transform: rotate(180deg);" />
            </button>
        `;

        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                html += `<button class="pagination-btn ${i === page ? "active" : ""}" data-page="${i}">${i}</button>`;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span class="pagination-ellipsis">...</span>`;
            }
        }

        html += `
            <button class="pagination-btn next-btn" ${page >= pages ? "disabled" : ""}>
                <img src="/assets/icons/angle-right.svg" alt="Next" />
            </button>
        `;

        paginationContainer.innerHTML = html;

        // Bind events
        paginationContainer.querySelectorAll(".pagination-btn").forEach(btn => {
            btn.onclick = () => {
                let targetPage = page;
                if (btn.classList.contains("prev-btn")) targetPage--;
                else if (btn.classList.contains("next-btn")) targetPage++;
                else targetPage = parseInt(btn.getAttribute("data-page"));

                if (targetPage !== page) {
                    currentPage = targetPage;
                    loadDomains(currentTab, currentPage);
                }
            };
        });
    }

    // --- TAB SWITCHING ---
    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const targetTab = btn.getAttribute("data-tab");
            if (targetTab === currentTab) return;

            // UI Update
            tabButtons.forEach(t => t.classList.remove("active"));
            
            // Note: Hiding is handled inside loadDomains/showLoading dynamically
            btn.classList.add("active");
            currentTab = targetTab;
            currentPage = 1;

            loadDomains(currentTab, currentPage);
        };
    });

    // --- INITIAL LOAD ---
    loadDomains(currentTab, currentPage);
});

// Global action handler (can be expanded later)
window.handleDomainAction = function(id, action) {
    console.log(`Action: ${action} for ID: ${id}`);

};

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "http://localhost:8080/api/v1/admin";

    // --- DOM ELEMENTS (Dynamic Selection) ---
    const getEl = (id) => document.getElementById(id);
    const errorBackdrop = getEl("premium-error-backdrop");
    const errorMsgText = getEl("error-message");
    const errorRetryBtn = getEl("error-retry-btn");
    const errorCloseBtn = getEl("error-close-btn");

    let currentTab = "all"; // "all" or "subscribed"
    let currentPage = 1;
    let chartInstance = null;
    let selectedUserId = null;
    let currentUserData = null;
    let subUsersSortBy = "newest";

    // --- UI HELPERS ---
    const spinnerSmall = `<div class="stopreg-btn-spinner" style="border-width: 2px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important; width: 20px; height: 20px;"></div>`;
    const spinnerLarge = `<div class="stopreg-btn-spinner" style="border-width: 3px !important; border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important; width: 40px; height: 40px;"></div>`;

    const renderSectionLoading = (containerId, type = "default") => {
        const container = getEl(containerId);
        if (!container) return;

        if (type === "stats") {
            const loadingEl = getEl("admin-stats-loading");
            if (loadingEl) loadingEl.style.display = "flex";
            const cards = container.querySelectorAll(".admin-stat-card");
            cards.forEach(card => card.style.display = "none");
        } else if (type === "chart") {
            const loadingState = container.querySelector(".chart-loading-state");
            const canvas = container.querySelector("canvas");
            if (loadingState) loadingState.style.display = "flex";
            if (canvas) canvas.style.display = "none";
        } else if (type === "table") {
            const loadingEl = getEl("admin-table-loading");
            if (loadingEl) loadingEl.style.display = "flex";
            const table = container.querySelector(".admin-table");
            const pagination = getEl("admin-pagination");
            if (table) table.style.display = "none";
            if (pagination) pagination.style.display = "none";
        }
    };

    const renderSectionError = (containerId, retryFn, message = "Failed to load data") => {
        const container = getEl(containerId);
        if (!container) return;

        // Explicitly hide any common loader IDs just in case they are siblings
        const sL = getEl("admin-stats-loading");
        const tL = getEl("admin-table-loading");
        if (sL && containerId === "admin-stats-container") sL.style.display = "none";
        if (tL && containerId === "admin-table-error-target") tL.style.display = "none";

        container.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Error</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                </button>
            </div>
        `;

        const btn = container.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            retryFn();
        };
    };

    const originalSections = {
        stats: getEl("admin-stats-container")?.innerHTML,
        chart: getEl("admin-chart-error-target")?.innerHTML,
        table: getEl("admin-table-error-target")?.innerHTML
    };

    const restoreSection = (containerId, type) => {
        const container = getEl(containerId);
        if (container && originalSections[type]) {
            container.innerHTML = originalSections[type];
        }
    };

    // --- API CORE ---
    const apiFetch = async (endpoint, options = {}) => {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                ...options,
                headers: {
                    "Authorization": `Bearer ${adminToken}`,
                    "Content-Type": "application/json",
                    ...(options.headers || {})
                }
            });
            const result = await response.json();
            if (!response.ok) {
                const error = new Error(result.description || result.message || "API request failed");
                error.status = response.status;
                throw error;
            }
            
            // Attach the backend description invisibly so UI components can use it for Toasts
            if (result.data !== null && typeof result.data === 'object') {
                result.data._backendMessage = result.description || "Success";
            }
            
            return result.data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            if (error.message === "Failed to fetch" || error.name === "TypeError") {
                error.message = "Network error, please check your connection and try again.";
            }
            throw error;
        }
    };

    const handleGlobalError = (err) => {
        if (!window.handleAdminAuthError(err)) {
            console.error("Global Admin Error:", err);
        }
    };

    // --- DATA FETCHING ---

    const loadStats = async () => {
        if (getEl("admin-stats-container")?.querySelector(".fetch-error-state")) {
            restoreSection("admin-stats-container", "stats");
        }
        renderSectionLoading("admin-stats-container", "stats");
        try {
            const stats = await apiFetch("/stats");
            const loadingEl = getEl("admin-stats-loading");
            if (loadingEl) loadingEl.style.display = "none";
            const cards = getEl("admin-stats-container")?.querySelectorAll(".admin-stat-card");
            cards?.forEach(card => card.style.display = "flex");

            const totalEl = getEl("stat-total-users");
            const freeEl = getEl("stat-free-users");
            const paidEl = getEl("stat-paid-users");
            
            if (totalEl) totalEl.textContent = stats.totalUsers.toLocaleString();
            if (freeEl) freeEl.textContent = stats.freeUsers.toLocaleString();
            if (paidEl) paidEl.textContent = stats.paidUsers.toLocaleString();
        } catch (err) {
            if (err.status === 401 || err.status === 403) return handleGlobalError(err);
            renderSectionError("admin-stats-container", loadStats, err.message || "Failed to load stats");
        }
    };

    const loadAnalytics = async () => {
        const target = getEl("admin-chart-error-target");
        if (target?.querySelector(".fetch-error-state")) {
            restoreSection("admin-chart-error-target", "chart");
            initDropdowns(); 
        }
        renderSectionLoading("admin-chart-error-target", "chart");
        try {
            const data = await apiFetch("/analytics");
            const loadingState = target.querySelector(".chart-loading-state");
            const canvas = target.querySelector("canvas");
            if (loadingState) loadingState.style.display = "none";
            if (canvas) canvas.style.display = "block";
            renderChart(data);
        } catch (err) {
            if (err.status === 401 || err.status === 403) return handleGlobalError(err);
            renderSectionError("admin-chart-error-target", loadAnalytics, err.message || "Failed to load analytics");
        }
    };

    const loadUsers = async (page = 1, isSilent = false) => {
        const target = getEl("admin-table-error-target");
        if (target?.querySelector(".fetch-error-state")) {
            restoreSection("admin-table-error-target", "table");
        }
        if (!isSilent) renderSectionLoading("admin-table-error-target", "table");
        try {
            const isSubscribed = currentTab === "subscribed";
            const data = await apiFetch(`/users?page=${page}&limit=10&isSubscribed=${isSubscribed}`);
            
            if (!isSilent) {
                const loadingEl = getEl("admin-table-loading");
                if (loadingEl) loadingEl.style.display = "none";
                const table = target?.querySelector(".admin-table");
                const pagination = getEl("admin-pagination");
                if (table) table.style.display = "table";
                if (pagination) pagination.style.display = "flex";
            }

            if (!target?.querySelector("#users-tbody")) {
                restoreSection("admin-table-error-target", "table");
            }
            renderUsersTable(data.users);
            renderPagination(data.pagination);
        } catch (err) {
            if (err.status === 401 || err.status === 403) return handleGlobalError(err);
            renderSectionError("admin-table-error-target", () => loadUsers(page), err.message || "Failed to load users");
        }
    };

    // --- UI RENDERING ---

    const renderUsersTable = (users) => {
        const tbody = getEl("users-tbody");
        if (!tbody) return;
        tbody.innerHTML = users.length > 0 
            ? users.map(user => `
                <tr data-id="${user.id}" class="clickable-row">
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td><span class="badge ${user.plan === 'Free' ? 'badge-free' : 'badge-paid'}">${user.plan}</span></td>
                    <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                    <td class="action-cell">
                        <div class="action-btn-container">
                            <button class="action-btn" data-id="${user.id}">
                                <img src="/assets/icons/more-vert.svg" alt="More" />
                            </button>
                            <div class="action-dropdown" id="dropdown-${user.id}">
                                ${user.isSuspended 
                                    ? `<button type="button" class="dropdown-item-action activate-btn" data-id="${user.id}" data-action="activate">
                                        <img src="/assets/icons/check-circle.svg" alt="" style="filter: brightness(0) saturate(100%) invert(48%) sepia(93%) saturate(366%) hue-rotate(63deg) brightness(94%) contrast(89%);" />
                                        <span>Activate user</span>
                                       </button>`
                                    : `<button type="button" class="dropdown-item-action suspend-btn" data-id="${user.id}" data-action="suspend">
                                        <img src="/assets/icons/admin/shut-down.svg" alt="" style="filter: brightness(0) saturate(100%) invert(26%) sepia(87%) saturate(2377%) hue-rotate(349deg) brightness(97%) contrast(92%);" />
                                        <span>Suspend user</span>
                                       </button>`
                                }
                            </div>
                        </div>
                    </td>
                </tr>
            `).join("")
            : `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #8C8C8C;">No users found.</td></tr>`;
    };

    const renderPagination = (meta) => {
        const container = getEl("admin-pagination");
        if (!container) return;
        const { page, pages } = meta;
        let html = "";
        
        if (pages > 1) {
            html += `<button class="p-btn" ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">&laquo;</button>`;
            for (let i = 1; i <= pages; i++) {
                if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                    html += `<button class="p-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
                } else if (i === page - 2 || i === page + 2) {
                    html += `<span class="p-dots">...</span>`;
                }
            }
            html += `<button class="p-btn" ${page >= pages ? 'disabled' : ''} data-page="${page + 1}">&raquo;</button>`;
        }
        container.innerHTML = html;
        
        container.querySelectorAll(".p-btn").forEach(btn => {
            btn.onclick = () => {
                const newPage = parseInt(btn.dataset.page);
                if (newPage && newPage !== currentPage) {
                    currentPage = newPage;
                    loadUsers(currentPage);
                }
            };
        });
    };

    // --- CHART PLUGINS ---
    const customSelectorPlugin = {
        id: "customSelector",
        afterDraw: (chart) => {
            const activePoints = chart.tooltip._active || [];
            if (!activePoints.length) return;
            
            const ctx = chart.ctx;
            const x = activePoints[0].element.x;
            const minY = Math.min(...activePoints.map(p => p.element.y));
            const bottomY = chart.scales.y.bottom;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, minY);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#1452CA"; // Primary blue
            ctx.globalAlpha = 0.3;
            ctx.setLineDash([5, 5]);
            ctx.stroke();
            ctx.restore();
            
            // Draw Pill Handle
            ctx.save();
            const pillW = 20;
            const pillH = 8;
            ctx.fillStyle = "#1452CA";
            const pX = x - pillW / 2;
            const pY = minY - pillH / 2;
            ctx.beginPath();
            ctx.roundRect(pX, pY, pillW, pillH, 4);
            ctx.fill();
            ctx.restore();
        }
    };

    const renderChart = (data) => {
        const canvas = getEl('adminLineChart');
        const ctx = canvas?.getContext('2d');
        const tooltipEl = getEl("chart-tooltip");
        if (!ctx) return;

        if (chartInstance) chartInstance.destroy();

        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month.substring(0, 3)),
                datasets: [
                    {
                        label: 'Registered Users',
                        data: data.map(d => d.total),
                        borderColor: '#1452CA',
                        backgroundColor: 'rgba(20, 82, 202, 0.03)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: 'Free Users',
                        data: data.map(d => d.free),
                        borderColor: '#8A2BE2',
                        backgroundColor: 'rgba(138, 43, 226, 0.01)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: 'Paid Users',
                        data: data.map(d => d.paid),
                        borderColor: '#049286',
                        backgroundColor: 'rgba(4, 146, 134, 0.01)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: false,
                        external: function (context) {
                            const { chart, tooltip } = context;
                            if (!tooltipEl) return;

                            if (tooltip.opacity === 0) {
                                tooltipEl.style.opacity = 0;
                                return;
                            }

                            if (tooltip.body) {
                                const dataPoints = tooltip.dataPoints || [];
                                const title = tooltip.title || [];
                                if (dataPoints.length > 0) {
                                    // Match portal: strong = value, span = month
                                    tooltipEl.querySelector("strong").textContent = dataPoints[0].raw.toLocaleString();
                                    tooltipEl.querySelector("span").textContent = title[0] + " " + (data.find(d => d.month.startsWith(title[0]))?.year || "");
                                }
                            }

                            tooltipEl.style.opacity = 1;
                            tooltipEl.style.left = tooltip.caretX + "px";
                            tooltipEl.style.top = (tooltip.caretY - 10) + "px";
                            tooltipEl.style.transform = "translate(-50%, -100%)";
                        }
                    }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#F2F4F7', drawBorder: false }, 
                        ticks: { color: '#98A2B3', font: { size: 12 } } 
                    },
                    x: { 
                        grid: { display: false }, 
                        ticks: { color: '#98A2B3', font: { size: 12 } } 
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            },
            plugins: [customSelectorPlugin]
        });
    };

    // --- USER DETAIL VIEW LOGIC ---
    const loadUserDetails = async (id) => {
        selectedUserId = id;
        const detailSpinner = getEl("user-detail-spinner");
        const detailContent = getEl("user-detail-content");
        const dashboardContainer = getEl("dashboard-container");
        const userDetailView = getEl("user-detail-view");

        // Toggle Views
        if (dashboardContainer) dashboardContainer.style.display = "none";
        if (userDetailView) userDetailView.style.display = "block";
        window.scrollTo({ top: 0, behavior: "smooth" });
        
        // Reset loader
        if (detailSpinner) detailSpinner.style.display = "flex";
        if (detailContent) detailContent.style.display = "none";
        
        // Reset banners
        const suspensionBanner = getEl("suspension-banner");
        const activeBanner = getEl("active-banner");
        if (suspensionBanner) suspensionBanner.style.display = "none";
        if (activeBanner) activeBanner.style.display = "none";

        try {
            const data = await apiFetch(`/users/${id}`);
            currentUserData = data;
            populateUserDetails(data);
            if (detailSpinner) detailSpinner.style.display = "none";
            if (detailContent) detailContent.style.display = "block";
        } catch (error) {
            if (typeof iziToast !== 'undefined') {
                iziToast.error({ title: "Error", message: "Failed to load user details", position: "topRight" });
            }
            backToUsers();
        }
    };

    const populateUserDetails = (data) => {
        const setTxt = (id, val) => { const el = getEl(id); if (el) el.textContent = val; };
        
        setTxt("detail-user-name", data.name);
        setTxt("detail-user-email", data.email);
        setTxt("detail-api-created", data.stats?.apiCreated || "0");
        setTxt("detail-api-requests", data.stats?.apiRequestCount || "0");
        setTxt("detail-joined-date", new Date(data.joinedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ".");

        const suspensionBanner = getEl("suspension-banner");
        const activeBanner = getEl("active-banner");
        if (data.isSuspended) {
            if (suspensionBanner) suspensionBanner.style.display = "flex";
            if (activeBanner) activeBanner.style.display = "none";
        } else {
            if (suspensionBanner) suspensionBanner.style.display = "none";
            if (activeBanner) activeBanner.style.display = "flex";
        }

        renderSubUsers();
    };

    const renderSubUsers = () => {
        const subUsersTbody = getEl("sub-users-tbody");
        if (!subUsersTbody) return;
        
        if (!currentUserData || !currentUserData.subUsers) return;
        
        const countText = getEl("detail-sub-users-count");
        if (countText) countText.textContent = currentUserData.subUsers.length;

        let sortedSubUsers = [...currentUserData.subUsers];
        switch (subUsersSortBy) {
            case "oldest": sortedSubUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)); break;
            case "name-asc": sortedSubUsers.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "name-desc": sortedSubUsers.sort((a, b) => b.name.localeCompare(a.name)); break;
            case "newest":
            default: sortedSubUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); break;
        }

        subUsersTbody.innerHTML = sortedSubUsers.length > 0 
            ? sortedSubUsers.map(sub => `
                <tr>
                    <td>${sub.name}</td>
                    <td>${sub.email}</td>
                    <td>Registered</td>
                    <td></td> <!-- Dashboard read-only mode, no remove sub-user action needed directly here -->
                </tr>
            `).join("")
            : `<tr><td colspan="4" style="text-align: center; padding: 20px;">No sub-users found.</td></tr>`;
    };

    const backToUsers = () => {
        const dashboardContainer = getEl("dashboard-container");
        const userDetailView = getEl("user-detail-view");
        
        if (userDetailView) userDetailView.style.display = "none";
        if (dashboardContainer) dashboardContainer.style.display = "block";
        selectedUserId = null;
    };

    // --- EVENTS ---

    document.addEventListener("click", (e) => {
        // Handle Back button
        const backBtn = e.target.closest("#back-to-users");
        if (backBtn) {
            backToUsers();
            return;
        }
    });

    const toggleSuspension = async (userId, action, actionItem, mainActionBtn) => {
        // Find and close the dropdown first
        const dropdown = mainActionBtn.nextElementSibling;
        if (dropdown) dropdown.classList.remove("show");

        // Swap the main action button icon for a spinner
        const originalHTML = mainActionBtn.innerHTML;
        mainActionBtn.disabled = true;
        mainActionBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-width: 2px !important; border-top-color: currentColor !important; width: 16px; height: 16px;"></span>`;

        try {
            const result = await apiFetch(`/users/${userId}/suspend`, { method: "PATCH" });
            if (typeof iziToast !== 'undefined') {
                iziToast.success({ 
                    title: "Success", 
                    message: result._backendMessage || "User status updated successfully", 
                    position: "topRight" 
                });
            }
            loadUsers(currentPage, true);
        } catch (error) {
            if (typeof iziToast !== 'undefined') {
                iziToast.error({ title: "Error", message: error.message, position: "topRight" });
            }
            mainActionBtn.disabled = false;
            mainActionBtn.innerHTML = originalHTML;
        }
    };

    const initDropdowns = () => {
        const dropdown = getEl("analytics-month-dropdown");
        if (!dropdown) return;

        const trigger = dropdown.querySelector(".dropdown-trigger");
        const items = dropdown.querySelectorAll(".dropdown-item");
        const selectedValue = dropdown.querySelector(".selected-value");

        trigger.onclick = (e) => {
            e.stopPropagation();
            dropdown.classList.toggle("active");
        };

        items.forEach(item => {
            item.onclick = (e) => {
                e.stopPropagation();
                items.forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                selectedValue.textContent = item.textContent;
                dropdown.classList.remove("active");
                loadAnalytics();
            };
        });

        document.addEventListener("click", () => dropdown.classList.remove("active"));
    };

    document.addEventListener("click", (e) => {
        const tabBtn = e.target.closest(".tab-btn");
        const actionBtn = e.target.closest(".action-btn");
        const dropdownItemAction = e.target.closest(".dropdown-item-action");

        // Process Dropdown Items (Suspend/Activate)
        if (dropdownItemAction) {
            e.stopPropagation();
            const mainActionBtn = dropdownItemAction.closest(".action-cell").querySelector(".action-btn");
            toggleSuspension(dropdownItemAction.dataset.id, dropdownItemAction.dataset.action, dropdownItemAction, mainActionBtn);
            return;
        }

        // Process Action Dropdown Toggle
        if (actionBtn) {
            e.stopPropagation();
            const dropdown = actionBtn.nextElementSibling;
            // Close other open action dropdowns across the table
            document.querySelectorAll(".action-dropdown.show").forEach(d => {
                if (d !== dropdown) d.classList.remove("show");
            });
            if (dropdown) dropdown.classList.toggle("show");
            return;
        }

        // Close all action dropdowns when clicking anywhere else
        if (!e.target.closest(".action-btn-container")) {
            document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
        }

        // Process Tab Switches
        if (tabBtn && !e.target.closest('.user-detail-view')) {
            document.querySelectorAll(".admin-table-tabs .tab-btn").forEach(b => b.classList.remove("active"));
            tabBtn.classList.add("active");
            currentTab = tabBtn.dataset.target;
            currentPage = 1;
            loadUsers(1);
            return;
        }
        
        // Process row clicks
        const row = e.target.closest(".clickable-row");
        if (row && !e.target.closest('.action-btn-container')) {
            loadUserDetails(row.dataset.id);
        }
    });

    // --- INITIALIZATION ---
    loadStats();
    loadAnalytics();
    loadUsers(1);
    initDropdowns();
});

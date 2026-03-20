document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "http://localhost:8080/api/v1/admin";


    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    
    // UI Components (Global modals/spinners that don't get replaced)
    const spinnerBody = getEl("spinner-body");
    const errorBackdrop = getEl("premium-error-backdrop");
    const errorMsgText = getEl("error-message");
    const errorRetryBtn = getEl("error-retry-btn");
    const errorCloseBtn = getEl("error-close-btn");

    // Navigation (Outside replaceable content)
    const mobiMenuBtn = getEl("mobi-menu-btn");
    const mobileOverlay = getEl("mobile-nav-overlay");
    const mobiCloseBtn = getEl("mobi-close-btn");
    const logoutBtn = getEl("logout-btn");
    const mobileLogoutBtn = getEl("mobile-logout-btn");
    const logoutOverlay = getEl("logout-overlay");
    const btnConfirmLogout = getEl("logout-confirm-btn");
    const btnCancelLogout = getEl("logout-cancel-btn");

    let chartInstance = null;

    // --- CHART PLUGINS ---
    const customSelectorPlugin = {
        id: "customSelector",
        afterDraw: (chart) => {
            const activePoints = chart.tooltip._active || [];
            if (!activePoints.length) return;
            
            const ctx = chart.ctx;
            const activePoint = activePoints[0];
            const x = activePoint.element.x;
            const y = activePoint.element.y;
            const bottomY = chart.scales.y.bottom;
            
            // Get color from the hovered dataset
            const color = chart.data.datasets[activePoint.datasetIndex].borderColor;
            
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, bottomY);
            ctx.lineWidth = 1; // Thinner line as in image
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.4;
            ctx.stroke();
            ctx.restore();
            
            ctx.save();
            const pillW = 20;
            const pillH = 8;
            ctx.fillStyle = color;
            const pX = x - pillW / 2;
            const pY = y - pillH / 2;
            ctx.beginPath();
            ctx.roundRect(pX, pY, pillW, pillH, 4);
            ctx.fill();
            ctx.restore();
        }
    };


    // --- HELPERS ---
    const showLoading = () => { if (spinnerBody) spinnerBody.style.display = "flex"; };
    const hideLoading = () => { if (spinnerBody) spinnerBody.style.display = "none"; };
    
    const showError = (msg) => {
        if (errorBackdrop && errorMsgText) {
            errorMsgText.textContent = msg || "Failed to load report data.";
            errorBackdrop.classList.add("active");
        }
        hideLoading();
    };

    const hideError = () => { if (errorBackdrop) errorBackdrop.classList.remove("active"); };

    const renderSectionError = (containerId, retryFn, message = "Failed to load data") => {
        const container = getEl(containerId);
        if (!container) return;

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
        stats: getEl("report-stats-container")?.innerHTML,
        chart: getEl("admin-chart-container")?.innerHTML
    };

    const restoreSection = (containerId, type) => {
        const container = getEl(containerId);
        if (container && originalSections[type]) {
            container.innerHTML = originalSections[type];
        }
    };

    const renderReportLoading = () => {
        const container = getEl("report-stats-container");
        const loadingEl = getEl("stats-loading-state");
        if (!container || !loadingEl) return;

        // Hide cards, show loader. Assuming cards have .report-stat-card class
        const cards = container.querySelectorAll(".report-stat-card");
        cards.forEach(card => card.style.display = "none");
        loadingEl.style.display = "flex";
    };

    const renderTrend = (trendObj, trendValue) => {
        const container = trendObj.container;
        const valEl = trendObj.value;
        if (!valEl || !container) return;
        
        const trend = trendValue || 0;
        const isPositive = trend >= 0;
        const icon = isPositive ? "/assets/icons/arrow-up-green.svg" : "/assets/icons/arrow-down-red.svg";
        
        valEl.innerHTML = `<img src="${icon}"> ${isPositive ? '+' : ''}${trend}%`;
        valEl.className = isPositive ? "trend-up" : "trend-up trend-down";
        valEl.style.color = isPositive ? "#008000" : "#DC2626";
    };

    const apiFetch = async (endpoint) => {
        try {
            const response = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    "Authorization": `Bearer ${adminToken}`,
                    "Content-Type": "application/json"
                }
            });

            if (window.handleAdminAuthError(response)) {
                return null;
            }

            const result = await response.json();
            if (!response.ok) throw new Error(result.description || "API Error");
            return result.data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            // Detect network errors specifically
            if (error.message === "Failed to fetch" || error.name === "TypeError") {
                error.message = "Network error,  please check your connection and try again.";
            }
            throw error;
        }
    };

    // --- DATA FETCHING ---
    const loadReportStats = async () => {
        const container = getEl("report-stats-container");
        if (container && container.querySelector(".fetch-error-state")) {
            restoreSection("report-stats-container", "stats");
        }
        
        renderReportLoading();
        
        try {
            const data = await apiFetch("/report-stats");
            if (!data) return;

            // Hide loader, show cards
            const loadingEl = getEl("stats-loading-state");
            if (loadingEl) loadingEl.style.display = "none";
            const cards = container.querySelectorAll(".report-stat-card");
            cards.forEach(card => card.style.display = "flex");

            // Re-select elements after potential restore
            const totalEl = getEl("report-total-requests");
            const successEl = getEl("report-success-requests");
            const blockedEl = getEl("report-blocked-requests");
            const dailyTotalEl = getEl("report-24h-total-requests");
            const dailySuccessEl = getEl("report-24h-success-requests");
            const dailyBlockedEl = getEl("report-24h-blocked-requests");

            if (totalEl) totalEl.textContent = data.total.value.toLocaleString();
            if (successEl) successEl.textContent = data.success.value.toLocaleString();
            if (blockedEl) blockedEl.textContent = data.blocked.value.toLocaleString();
            if (dailyTotalEl) dailyTotalEl.textContent = data.dailyTotal.value.toLocaleString();
            if (dailySuccessEl) dailySuccessEl.textContent = data.dailySuccess.value.toLocaleString();
            if (dailyBlockedEl) dailyBlockedEl.textContent = data.dailyBlocked.value.toLocaleString();

            // Trends
            renderTrend({ container: getEl("report-trend-container-1"), value: getEl("report-trend-value-1") }, data.total.trend);
            renderTrend({ container: getEl("report-trend-container-2"), value: getEl("report-trend-value-2") }, data.success.trend);
            renderTrend({ container: getEl("report-trend-container-3"), value: getEl("report-trend-value-3") }, data.blocked.trend);
            renderTrend({ container: getEl("report-trend-container-4"), value: getEl("report-trend-value-4") }, data.dailyTotal.trend);
            renderTrend({ container: getEl("report-trend-container-5"), value: getEl("report-trend-value-5") }, data.dailySuccess.trend);
            renderTrend({ container: getEl("report-trend-container-6"), value: getEl("report-trend-value-6") }, data.dailyBlocked.trend);
        } catch (error) {
            console.error("Report stats error:", error);
            renderSectionError("report-stats-container", loadReportStats, error.message || "Failed to load report statistics.");
        }
    };

    const loadUsageStats = async () => {
        const container = getEl("admin-chart-container");
        if (container && container.querySelector(".fetch-error-state")) {
            restoreSection("admin-chart-container", "chart");
        }

        // Re-select after potential restore
        const canvasEl = getEl("usageStatsChart");
        const loadingEl = getEl("usage-chart-loading");

        if (loadingEl) loadingEl.style.display = "flex";
        if (canvasEl) canvasEl.style.opacity = "0";

        try {
            const usageData = await apiFetch("/usage-stats");
            if (!usageData) return;

            initUsageChart(usageData);
        } catch (error) {
            console.error("Usage stats error:", error);
            renderSectionError("admin-chart-container", loadUsageStats, error.message || "Failed to load usage statistics.");
        } finally {
            const canvasFinal = getEl("usageStatsChart");
            const loadingFinal = getEl("usage-chart-loading");
            if (loadingFinal) loadingFinal.style.display = "none";
            if (canvasFinal) canvasFinal.style.opacity = "1";
        }
    };

    const initUsageChart = (data) => {
        const chartCanvas = getEl("usageStatsChart");
        if (!chartCanvas) return;
        
        if (chartInstance) chartInstance.destroy();

        chartCanvas.style.display = "block";
        const ctx = chartCanvas.getContext('2d');
        
        chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month.substring(0, 3)),
                datasets: [
                    {
                        label: 'Public Provider',
                        data: data.map(d => d.public),
                        borderColor: '#1452CA',
                        backgroundColor: 'rgba(20, 82, 202, 0.03)',
                        borderWidth: 3,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: 'Disposable Domains',
                        data: data.map(d => d.disposable),
                        borderColor: '#CC0000',
                        backgroundColor: 'rgba(204, 0, 0, 0.01)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: 'Email forwarding/alias',
                        data: data.map(d => d.alias),
                        borderColor: '#737373',
                        backgroundColor: 'rgba(115, 115, 115, 0.01)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: false,
                        pointRadius: 0,
                        pointHoverRadius: 0
                    },
                    {
                        label: 'Unresolved',
                        data: data.map(d => d.unresolved),
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
                            const chartTooltipEl = getEl("chart-tooltip");
                            if (!chartTooltipEl) return;

                            if (tooltip.opacity === 0) {
                                chartTooltipEl.style.opacity = 0;
                                return;
                            }

                             if (tooltip.body) {
                                const dataPoints = tooltip.dataPoints || [];
                                const title = tooltip.title || [];
                                if (dataPoints.length > 0) {
                                    // Match portal: strong = value, span = month
                                    chartTooltipEl.querySelector("strong").textContent = dataPoints[0].raw.toLocaleString();
                                    const fullMonth = data.find(d => d.month.startsWith(title[0]))?.month || title[0];
                                    chartTooltipEl.querySelector("span").textContent = fullMonth;
                                }
                            }

                            chartTooltipEl.style.opacity = 1;
                            chartTooltipEl.style.left = tooltip.caretX + "px";
                            chartTooltipEl.style.top = (tooltip.caretY - 30) + "px"; // Increased offset to sit above pill
                            chartTooltipEl.style.transform = "translate(-50%, -100%)";
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#F2F4F7', drawBorder: false },
                        ticks: { color: '#98A2B3', font: { family: 'Inter_28pt-Regular', size: 12 } }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#98A2B3', font: { family: 'Inter_28pt-Regular', size: 12 } }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: false
                }
            },
            plugins: [customSelectorPlugin]
        });
    };


    if (mobiMenuBtn && mobileOverlay) {
        mobiMenuBtn.onclick = () => mobileOverlay.classList.add("open");
    }
    if (mobiCloseBtn && mobileOverlay) {
        mobiCloseBtn.onclick = () => mobileOverlay.classList.remove("open");
    }

    if (errorRetryBtn) {
        errorRetryBtn.onclick = () => {
            hideError();
            initializeApp();
        };
    }
    
    if (errorCloseBtn) {
        errorCloseBtn.onclick = () => {
            window.location.href = "/admin-dashboard/index.html";
        };
    }

    // --- INDUSTRIAL STANDARD TOOLTIP LOGIC ---
    // Handle click-to-toggle for mobile/touch and outside click to close
    document.addEventListener("click", (e) => {
        const tooltip = e.target.closest(".tooltip");
        const allTooltips = document.querySelectorAll(".tooltip.active");

        // If clicking outside any active tooltip, close all
        if (!tooltip) {
            allTooltips.forEach(t => t.classList.remove("active"));
            return;
        }

        // If clicking a tooltip, toggle it and close others
        const isCurrentlyActive = tooltip.classList.contains("active");
        
        // Close others first for a clean experience
        allTooltips.forEach(t => {
            if (t !== tooltip) t.classList.remove("active");
        });

        // Toggle the clicked one
        if (isCurrentlyActive) {
            tooltip.classList.remove("active");
        } else {
            tooltip.classList.add("active");
        }
    });

    // --- INITIALIZATION ---
    const initializeApp = async () => {
        showLoading();
        await Promise.all([
            loadReportStats(),
            loadUsageStats()
        ]);
        hideLoading();
    };

    initializeApp();

});

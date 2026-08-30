
document.addEventListener("DOMContentLoaded", async () => {
    const role = localStorage.getItem("role");
    const planName = await window.getUserPlan();
    const upgradeBtn = document.getElementById("dash-plan-upgrade-btn");
    const divider = document.getElementById("dash-plan-divider");
    const seatsHeader = document.getElementById("dash-seats-header");
    const seatsContainer = document.getElementById("dash-seats-container");
    const seatsList = document.getElementById("dash-seats-list");
    const seatsTitle = document.getElementById("dash-seats-title");

    // 1. RBAC & Plan Check
    const isFreePlan = planName === "Free";
    // Get plan details from cache (populated by getUserPlan in main.js, no extra API call)
    const planDetails = window.userPlanDetailsCache;
    const seatLimit = planDetails?.seatLimit || null; // null = unlimited
    
    if (role === "Seat") {
        if (upgradeBtn) upgradeBtn.style.display = "none";
        if (divider) divider.style.display = "none";
        if (seatsHeader) seatsHeader.style.display = "none";
        if (seatsContainer) seatsContainer.style.display = "none";
        return;
    }

    if (isFreePlan) {
        // Show rationale instead of hiding completely
        if (seatsTitle) {
            seatsTitle.innerHTML = `<span style="color: #667085; font-size: 13px;">Premium Feature</span>`;
        }
        if (seatsList) {
            seatsList.innerHTML = `
                <div class="premium-notice-box" style="padding: 12px; background: #F9FAFB; border-radius: 8px; border: 1px dashed #EAECF0; text-align: center;">
                    <p style="font-size: 13px; color: #475467; margin: 0;">Seat management is available on <strong style="color: #1452CA;">Launch</strong> or higher plans.</p>
                </div>
            `;
        }
        const addSeatsTrigger = document.getElementById("add-seats-trigger");
        if (addSeatsTrigger) {
            addSeatsTrigger.style.opacity = "0.5";
            addSeatsTrigger.style.cursor = "not-allowed";
        }
        return; 
    }

    // 2. Fetch Logic for Owners
    fetchSeatUsers();

    async function fetchSeatUsers() {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        // Loading State
        if (seatsList) {
            seatsList.innerHTML = `
                <div style="display: flex; justify-content: center; padding: 20px;">
                    <div class="stopreg-spinner" style="width: 24px; height: 24px; border-width: 2px;"></div>
                </div>
            `;
        }

        try {
            // Fetch all seats to get accurate total, then show only top 3
            const response = await fetch("https://api.stopreg.com/api/v1/seat/fetch?limit=9&page=1", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok && data.data && Array.isArray(data.data.data)) {
                window.userSeatCount = data.data.total;
                renderSeats(data.data.data.slice(0, 3), data.data.total);
            } else {
                throw new Error(data.message || "Failed to fetch seats");
            }

        } catch (error) {
            console.error("Error fetching seats:", error);
            renderError();
        }
    }

    function renderSeats(users, totalCount) {
        if (!seatsList) return;

        // Check if limit reached (prevents unnecessary "Add more" clicks)
        const isLimitReached = seatLimit !== null && seatLimit !== undefined && totalCount >= seatLimit;

        // Update total count with limit info
        if (seatsTitle) {
            const limitText = seatLimit ? ` (${totalCount}/${seatLimit})` : "";
            seatsTitle.textContent = `You have invited ${totalCount} users${limitText}`;
        }

        // Disable "Add more" button if limit reached
        const addSeatsTrigger = document.getElementById("add-seats-trigger");
        if (addSeatsTrigger) {
            if (isLimitReached) {
                addSeatsTrigger.style.opacity = "0.5";
                addSeatsTrigger.style.cursor = "not-allowed";
            }
        }

        if (users.length === 0) {
            seatsList.innerHTML = `<div class="empty-state" style="text-align:center; padding: 10px; color: #667085; font-size: 14px;">No seat users invited yet.</div>`;
            return;
        }

        // Generate HTML
        const html = users.map(user => `
            <div class="seat-item">
                <span class="seat-email" title="${user.email}">${user.email}</span>
                <span class="seat-status ${user.acceptedInviation ? '' : 'pending'}">
                    ${user.acceptedInviation ? 'Registered' : 'Pending'}
                </span>
            </div>
        `).join("");

        seatsList.innerHTML = html;
    }

    function renderError() {
        if (!seatsList) return;
        seatsList.innerHTML = `
            <div style="text-align: center; padding: 15px;">
                <p style="color: #dc3545; font-size: 14px; margin-bottom: 8px;">Failed to load seats</p>
                <button id="retry-seats-btn" style="background: none; border: 1px solid #d0d5dd; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 12px;">
                    Retry
                </button>
            </div>
        `;
        
        const retryBtn = document.getElementById("retry-seats-btn");
        if (retryBtn) {
            retryBtn.addEventListener("click", fetchSeatUsers);
        }
    }
});

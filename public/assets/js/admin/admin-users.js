document.addEventListener("DOMContentLoaded", () => {
    const API_BASE_URL = "https://api.stopreg.com/api/v1/admin";
    const TOKEN_KEY = "adminToken";

    // --- ELEMENT SELECTORS ---
    const getEl = (id) => document.getElementById(id);
    
    // View Containers
    const usersTableWrapper = getEl("users-table-wrapper");
    const userDetailView = getEl("user-detail-view");
    const mainHeader = document.querySelector(".users-header");
    const errorTarget = getEl("admin-users-error-target");
    
    // Controls
    const searchInput = getEl("user-search-input");
    const sortBtn = getEl("sort-dropdown-btn");
    const sortMenu = getEl("sort-dropdown-menu");
    const subUsersSortBtn = getEl("sub-users-sort-btn");
    const subUsersSortMenu = getEl("sub-users-sort-menu");
    const paginationContainer = getEl("users-pagination");
    const totalCountText = getEl("users-total-count");

    // Detail View Elements
    const backBtn = getEl("back-to-users");
    const suspensionBanner = getEl("suspension-banner");
    const activeBanner = getEl("active-banner");
    const activateBtn = getEl("activate-user-btn");
    const suspendBtn = getEl("suspend-user-btn");
    
    const detailName = getEl("detail-user-name");
    const detailEmail = getEl("detail-user-email");
    const detailApiCreated = getEl("detail-api-created");
    const detailApiRequests = getEl("detail-api-requests");
    const detailApiRequestsLeft = getEl("detail-api-requests-left");
    const detailJoinedDate = getEl("detail-joined-date");
    const subUsersTbody = getEl("sub-users-tbody");
    const subUsersCountText = getEl("detail-sub-users-count");

    // Modal Elements
    const removeModal = getEl("remove-user-modal-overlay");
    const removeConfirmBtn = getEl("confirm-remove-btn");
    const removeCancelBtn = getEl("cancel-remove-btn");
    const removeCloseBtn = getEl("close-remove-modal");
    const removeTargetName = getEl("remove-target-name");

    // --- STATE ---
    let currentPage = 1;
    let searchQuery = "";
    let sortBy = "newest";
    let selectedUserId = null;
    let currentUserData = null;
    let subUsersSortBy = "newest";
    let userToDelete = null;
    let userToDeleteType = "account"; // "account" or "seat"
    const originalHTML = errorTarget ? errorTarget.innerHTML : "";

    // --- UTILITIES ---

    const showLoading = (isSilent = false) => {
        const spinner = getEl("users-page-spinner");
        if (spinner) {
            spinner.style.display = "flex";
            spinner.style.padding = isSilent ? "60px 0" : "100px 0";
        }
        // Table and pagination always hide to avoid stale data
        if (usersTableWrapper) usersTableWrapper.style.display = "none";
        if (paginationContainer) paginationContainer.style.display = "none";
        
        // Contextual header management: hide ONLY on initial/hard load
        if (!isSilent && mainHeader) {
            mainHeader.style.display = "none";
        }
    };

    const hideLoading = () => {
        const spinner = getEl("users-page-spinner");
        if (spinner) spinner.style.display = "none";
        
        // Restore all structural components
        if (usersTableWrapper) usersTableWrapper.style.display = "block";
        if (paginationContainer) paginationContainer.style.display = "flex";
        if (mainHeader) mainHeader.style.display = "flex";
    };

    const apiFetch = async (endpoint, options = {}) => {
        const token = localStorage.getItem(TOKEN_KEY);
        const defaultOptions = {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaultOptions, ...options });
            const result = await response.json();
            
            if (window.handleAdminAuthError(response)) {
                return null;
            }

            if (!response.ok) {
                throw new Error(result.description || result.message || "Request failed");
            }
            return result.data;
        } catch (error) {
            console.error(`API Error [${endpoint}]:`, error);
            throw error;
        }
    };

    const renderError = (message, retryFn) => {
        hideLoading();
        // Overwrite hideLoading's show action if we want it hidden during error
        if (mainHeader) mainHeader.style.display = "none";
        
        if (!errorTarget) return;

        errorTarget.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load users</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                </button>
            </div>
        `;

        const btn = errorTarget.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            errorTarget.innerHTML = originalHTML;
            // No need to show mainHeader here, showLoading will handle it or succesful hideLoading will.
            retryFn();
        };
    };

    // --- DATA FETCHING ---

    const loadUsers = async (isSilent = false) => {
        showLoading(isSilent);
        try {
            const data = await apiFetch(`/users?page=${currentPage}&search=${searchQuery}&sortBy=${sortBy}`);
            renderUsersTable(data.users);
            renderPagination(data.pagination);
            if (totalCountText && data.pagination) totalCountText.textContent = `You have a total of ${(data.pagination.total || 0).toLocaleString()} registered users`;
            hideLoading();
        } catch (error) {
            renderError(error.message, loadUsers);
        }
    };

    const loadUserDetails = async (id) => {
        selectedUserId = id;
        const detailSpinner = getEl("user-detail-spinner");
        const detailContent = getEl("user-detail-content");

        // Show detail view, hide list
        usersTableWrapper.style.display = "none";
        paginationContainer.style.display = "none";
        if (mainHeader) mainHeader.style.display = "none";
        userDetailView.style.display = "block";
        
        // Reset loader and sort
        if (detailSpinner) detailSpinner.style.display = "flex";
        if (detailContent) detailContent.style.display = "none";
        subUsersSortBy = "newest";
        if (subUsersSortBtn) subUsersSortBtn.querySelector("span").textContent = "Newest First";
        if (subUsersSortMenu) {
            subUsersSortMenu.querySelectorAll(".sort-item").forEach(i => i.classList.remove("active"));
            const newestBtn = subUsersSortMenu.querySelector('[data-sort="newest"]');
            if (newestBtn) newestBtn.classList.add("active");
        }
        
        // Reset banners
        suspensionBanner.style.display = "none";
        activeBanner.style.display = "none";

        try {
            const data = await apiFetch(`/users/${id}`);
            currentUserData = data;
            populateUserDetails(data);
            if (detailSpinner) detailSpinner.style.display = "none";
            if (detailContent) detailContent.style.display = "block";
        } catch (error) {
            iziToast.error({ title: "Error", message: "Failed to load user details", position: "topRight" });
            backToUsers();
        }
    };

    const toggleSuspension = async () => {
        if (!selectedUserId) return;
        
        const isCurrentSuspended = currentUserData && currentUserData.isSuspended;
        const targetBtn = isCurrentSuspended ? activateBtn : suspendBtn;
        
        if (!targetBtn) return;
        
        const originalHTML = targetBtn.innerHTML;
        targetBtn.disabled = true;
        targetBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-top-color: currentColor;"></span> ${isCurrentSuspended ? 'Activating...' : 'Suspending...'}`;

        try {
            const result = await apiFetch(`/users/${selectedUserId}/suspend`, { method: "PATCH" });
            iziToast.success({ 
                title: "Success", 
                message: result.isSuspended ? "User suspended" : "User activated", 
                position: "topRight" 
            });
            // Refresh details
            await loadUserDetails(selectedUserId);
        } catch (error) {
            iziToast.error({ title: "Error", message: error.message, position: "topRight" });
        } finally {
            if (targetBtn) {
                targetBtn.disabled = false;
                targetBtn.innerHTML = originalHTML;
            }
        }
    };

    const handleConfirmDeletion = async () => {
        if (!userToDelete) return;
        
        const originalText = removeConfirmBtn.innerHTML;
        removeConfirmBtn.disabled = true;
        removeConfirmBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

        const endpoint = userToDeleteType === "seat" 
            ? `/seats/${userToDelete.id}` 
            : `/users/${userToDelete.id}`;

        try {
            await apiFetch(endpoint, { method: "DELETE" });
            iziToast.success({ 
                title: "Success", 
                message: `${userToDelete.name} has been removed.`, 
                position: "topRight",
                transitionIn: "fadeInDown"
            });
            
            closeRemoveModal();
            
            if (userToDeleteType === "seat") {
                // Refresh details to update sub-user list
                if (selectedUserId) await loadUserDetails(selectedUserId);
            } else if (userDetailView.style.display === "block") {
                backToUsers();
            } else {
                loadUsers();
            }
        } catch (error) {
            iziToast.error({ 
                title: "Error", 
                message: error.message || "Failed to remove user", 
                position: "topRight" 
            });
        } finally {
            removeConfirmBtn.disabled = false;
            removeConfirmBtn.innerHTML = originalText;
        }
    };

    // --- RENDERING ---

    const renderUsersTable = (users) => {
        const tbody = getEl("users-tbody");
        if (!tbody) return;

        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #8C8C8C;">No users found matching your criteria.</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(user => `
            <tr data-id="${user.id}" class="clickable-row">
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td><span class="badge ${user.plan === 'Free' ? 'badge-free' : 'badge-paid'}">${user.plan || 'Free'}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString()}</td>
                <td class="action-cell">
                    <div class="action-btn-container">
                        <button class="action-btn" data-id="${user.id}">
                            <img src="/assets/icons/more-vert.svg" alt="More" />
                        </button>
                        <div class="action-dropdown">
                            <button type="button" class="dropdown-item-remove" data-id="${user.id}" data-name="${user.name}" data-type="account">
                                <img src="/assets/icons/delete.svg" alt="" />
                                <span>Remove this user</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");
    };

    const renderPagination = (meta) => {
        if (!paginationContainer) return;
        const { page, pages } = meta;
        if (pages <= 1) {
            paginationContainer.innerHTML = "";
            return;
        }

        let html = `<button class="p-btn" ${page === 1 ? 'disabled' : ''} data-page="${page - 1}">&laquo;</button>`;
        for (let i = 1; i <= pages; i++) {
            if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
                html += `<button class="p-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
            } else if (i === page - 2 || i === page + 2) {
                html += `<span class="p-dots">...</span>`;
            }
        }
        html += `<button class="p-btn" ${page === pages ? 'disabled' : ''} data-page="${page + 1}">&raquo;</button>`;
        paginationContainer.innerHTML = html;
    };

    const populateUserDetails = (data) => {
        detailName.textContent = data.name;
        detailEmail.textContent = data.email;
        detailApiCreated.textContent = data.stats.apiCreated;
        detailApiRequests.textContent = data.stats.apiRequestCount;
        detailApiRequestsLeft.textContent = data.apiRequestLeft || 0;
        detailJoinedDate.textContent = new Date(data.joinedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) + ".";

        const planBadge = getEl("detail-plan-badge");
        if (planBadge) planBadge.textContent = data.plan || "—";

        // Banners
        if (data.isSuspended) {
            suspensionBanner.style.display = "flex";
            activeBanner.style.display = "none";
        } else {
            suspensionBanner.style.display = "none";
            activeBanner.style.display = "flex";
        }

        renderSubUsers();
    };

    const renderSubUsers = () => {
        if (!currentUserData || !currentUserData.subUsers) return;
        
        if (subUsersCountText) {
            subUsersCountText.textContent = currentUserData.subUsers.length;
        }

        let sortedSubUsers = [...currentUserData.subUsers];
        switch (subUsersSortBy) {
            case "oldest":
                sortedSubUsers.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case "name-asc":
                sortedSubUsers.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case "name-desc":
                sortedSubUsers.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case "newest":
            default:
                sortedSubUsers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
        }

        subUsersTbody.innerHTML = sortedSubUsers.length > 0 
            ? sortedSubUsers.map(sub => `
                <tr>
                    <td>${sub.name}</td>
                    <td>${sub.email}</td>
                    <td>Registered</td>
                    <td class="action-cell">
                         <div class="action-btn-container">
                            <button class="action-btn"><img src="/assets/icons/more-vert.svg" alt="More" /></button>
                            <div class="action-dropdown">
                                <button type="button" class="dropdown-item-remove" data-id="${sub.id}" data-name="${sub.name}" data-type="seat">
                                    <img src="/assets/icons/delete.svg" alt="" />
                                    <span>Remove this seat</span>
                                </button>
                            </div>
                        </div>
                    </td>
                </tr>
            `).join("")
            : `<tr><td colspan="4" style="text-align: center; padding: 20px;">No sub-users found.</td></tr>`;
    };

    // --- NAVIGATION ---

    const backToUsers = () => {
        userDetailView.style.display = "none";
        usersTableWrapper.style.display = "block";
        paginationContainer.style.display = "flex";
        if (mainHeader) mainHeader.style.display = "flex";
        selectedUserId = null;
        loadUsers();
    };

    // --- MODALS ---

    const openRemoveModal = (id, name, type = "account") => {
        userToDelete = { id, name };
        userToDeleteType = type;
        
        removeTargetName.textContent = name;
        const titleEl = removeModal.querySelector(".remove-modal-content h3");
        const descEl = removeModal.querySelector(".remove-modal-content p");
        
        if (type === "seat") {
            if (titleEl) titleEl.textContent = "Remove Seat?";
            if (descEl) descEl.innerHTML = `Are you sure you want to remove <strong>${name}</strong> from this user's team? This will revoke their dashboard access.`;
        } else {
            if (titleEl) titleEl.textContent = "Remove Account?";
            if (descEl) descEl.innerHTML = `Are you sure you want to remove <strong>${name}</strong>? This action will permanently delete their account and all associated data.`;
        }
        
        removeModal.classList.add("is-active");
    };

    const closeRemoveModal = () => {
        removeModal.classList.remove("is-active");
        userToDelete = null;
    };

    // --- EVENT LISTENERS ---

    // Table Actions
    document.addEventListener("click", (e) => {
        const row = e.target.closest(".clickable-row");
        const actionBtn = e.target.closest(".action-btn");
        const dropdownBtn = e.target.closest(".dropdown-item-remove");
        
        if (dropdownBtn) {
            e.stopPropagation();
            openRemoveModal(
                dropdownBtn.dataset.id, 
                dropdownBtn.dataset.name, 
                dropdownBtn.dataset.type || "account"
            );
            return;
        }

        if (actionBtn) {
            e.stopPropagation();
            const dropdown = actionBtn.nextElementSibling;
            // Close other open dropdowns
            document.querySelectorAll(".action-dropdown.show").forEach(d => {
                if (d !== dropdown) d.classList.remove("show");
            });
            dropdown.classList.toggle("show");
            return;
        }

        if (row) {
            loadUserDetails(row.dataset.id);
        }

        // Close dropdowns when clicking outside
        if (!e.target.closest(".action-btn-container")) {
            document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
        }
    });

    // Pagination
    paginationContainer.onclick = (e) => {
        const btn = e.target.closest(".p-btn");
        if (btn && !btn.disabled) {
            const targetPage = parseInt(btn.dataset.page);
            if (targetPage !== currentPage) {
                currentPage = targetPage;
                loadUsers(true);
            }
        }
    };

    // Search (Debounced)
    let searchTimeout;
    searchInput.oninput = (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            searchQuery = e.target.value.trim();
            currentPage = 1;
            loadUsers(true);
        }, 500);
    };

    // Sort Dropdown
    sortBtn.onclick = (e) => {
        e.stopPropagation();
        sortMenu.classList.toggle("active");
    };

    sortMenu.onclick = (e) => {
        const item = e.target.closest(".sort-item");
        if (item) {
            sortMenu.querySelectorAll(".sort-item").forEach(i => i.classList.remove("active"));
            item.classList.add("active");
            sortBy = item.dataset.sort;
            sortBtn.querySelector("span").textContent = item.textContent;
            currentPage = 1;
            loadUsers(true);
            sortMenu.classList.remove("active");
        }
    };

    document.addEventListener("click", () => sortMenu.classList.remove("active"));

    // Sub-Users Sort
    if (subUsersSortBtn) {
        subUsersSortBtn.onclick = (e) => {
            e.stopPropagation();
            subUsersSortMenu.classList.toggle("active");
        };
    }

    if (subUsersSortMenu) {
        subUsersSortMenu.onclick = (e) => {
            e.stopPropagation();
            const item = e.target.closest(".sort-item");
            if (item) {
                subUsersSortMenu.querySelectorAll(".sort-item").forEach(i => i.classList.remove("active"));
                item.classList.add("active");
                subUsersSortBy = item.dataset.sort;
                subUsersSortBtn.querySelector("span").textContent = item.textContent;
                renderSubUsers();
                subUsersSortMenu.classList.remove("active");
            }
        };
    }

    document.addEventListener("click", () => {
        if (subUsersSortMenu) subUsersSortMenu.classList.remove("active");
    });

    // Navigation
    backBtn.onclick = backToUsers;
    
    // Suspension
    activateBtn.onclick = toggleSuspension;
    suspendBtn.onclick = toggleSuspension;

    // Remove User Modal
    removeConfirmBtn.onclick = handleConfirmDeletion;
    removeCancelBtn.onclick = closeRemoveModal;
    removeCloseBtn.onclick = closeRemoveModal;
    removeModal.onclick = (e) => { if (e.target === removeModal) closeRemoveModal(); };

    // -------------------------------------------------------------------------
    // Assign Plan Feature
    // -------------------------------------------------------------------------
    const assignPlanModal    = getEl("assign-plan-modal-overlay");
    const assignPlanSelect   = getEl("assign-plan-select");
    const assignPlanMeta     = getEl("assign-plan-meta");
    const assignPlanTargetName = getEl("assign-plan-target-name");
    const assignPlanConfirmBtn = getEl("confirm-assign-plan-btn");
    const assignPlanCancelBtn  = getEl("cancel-assign-plan-btn");
    const assignPlanCloseBtn   = getEl("close-assign-plan-modal");
    const assignPlanBtn        = getEl("assign-plan-btn");

    // Cache plans after first load; plans rarely change during an admin session.
    let cachedPlans = null;

    const loadPlans = async () => {
        if (cachedPlans) return cachedPlans;
        try {
            cachedPlans = await apiFetch("/plans");
            return cachedPlans;
        } catch {
            cachedPlans = null;
            return null;
        }
    };

    const openAssignPlanModal = async () => {
        if (!selectedUserId || !currentUserData) return;

        assignPlanTargetName.textContent = currentUserData.name || "this user";
        assignPlanSelect.innerHTML = '<option value="" disabled selected>Loading plans…</option>';
        assignPlanMeta.textContent = "";
        assignPlanModal.classList.add("is-active");

        const plans = await loadPlans();
        if (!plans || plans.length === 0) {
            assignPlanSelect.innerHTML = '<option value="" disabled selected>Failed to load plans</option>';
            return;
        }

        assignPlanSelect.innerHTML = plans.map(p =>
            `<option value="${p._id}" data-duration="${p.durationInDays}" data-limit="${p.apiLimit ?? 0}" data-price="${p.monthlyPrice}">
                ${p.name} — ${p.durationInDays}d / ${p.apiLimit ?? 'Unlimited'} API calls
            </option>`
        ).join("");

        // Pre-select current plan if it matches
        const currentPlan = currentUserData.plan;
        const match = plans.find(p => p.name === currentPlan);
        if (match) assignPlanSelect.value = match._id;

        updateAssignPlanMeta();
    };

    const updateAssignPlanMeta = () => {
        const selected = assignPlanSelect.options[assignPlanSelect.selectedIndex];
        if (!selected || !selected.value) { assignPlanMeta.textContent = ""; return; }
        const duration = selected.dataset.duration;
        const limit    = selected.dataset.limit;
        const price    = selected.dataset.price;
        const expiry   = new Date();
        expiry.setDate(expiry.getDate() + parseInt(duration, 10));
        assignPlanMeta.textContent =
            `Expires: ${expiry.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` +
            ` · API calls: ${parseInt(limit, 10) === 0 ? 'Unlimited' : Number(limit).toLocaleString()}` +
            ` · $${price}/mo`;
    };

    const closeAssignPlanModal = () => {
        assignPlanModal.classList.remove("is-active");
        assignPlanMeta.textContent = "";
    };

    const handleAssignPlan = async () => {
        const planId = assignPlanSelect.value;
        if (!planId || !selectedUserId) return;

        const originalHTML = assignPlanConfirmBtn.innerHTML;
        assignPlanConfirmBtn.disabled = true;
        assignPlanConfirmBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Assigning…`;

        try {
            await apiFetch(`/users/${selectedUserId}/subscription`, {
                method: "PATCH",
                body: JSON.stringify({ planId }),
            });

            iziToast.success({ title: "Plan Assigned", message: "Subscription updated successfully.", position: "topRight" });
            closeAssignPlanModal();
            cachedPlans = null; // invalidate so plan meta stays fresh on next open
            await loadUserDetails(selectedUserId);
        } catch (err) {
            iziToast.error({ title: "Error", message: err?.message || "Failed to assign plan.", position: "topRight" });
        } finally {
            assignPlanConfirmBtn.disabled = false;
            assignPlanConfirmBtn.innerHTML = originalHTML;
        }
    };

    if (assignPlanBtn)         assignPlanBtn.onclick         = openAssignPlanModal;
    if (assignPlanConfirmBtn)  assignPlanConfirmBtn.onclick  = handleAssignPlan;
    if (assignPlanCancelBtn)   assignPlanCancelBtn.onclick   = closeAssignPlanModal;
    if (assignPlanCloseBtn)    assignPlanCloseBtn.onclick    = closeAssignPlanModal;
    if (assignPlanSelect)      assignPlanSelect.onchange     = updateAssignPlanMeta;
    if (assignPlanModal)       assignPlanModal.onclick       = (e) => { if (e.target === assignPlanModal) closeAssignPlanModal(); };

    // Initial Load
    loadUsers();
});

/**
 * Admin Domain Management JavaScript
 * Handles paginated management of Usernames, Relay, Disposable, and Public providers.
 */

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "https://api.stopreg.com/api/v1/admin";


    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    const mgmtContainer = getEl("admin-mgmt-error-target");
    const mgmtLoading = getEl("admin-mgmt-loading");
    const paginationContainer = getEl("admin-pagination");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const searchInput = getEl("domain-search-input");
    const perPageSelect = getEl("per-page-select");
    const addMoreBtn = getEl("admin-add-more-btn");
    const addModal = getEl("add-more-modal");
    const closeModalBtn = getEl("close-modal-btn");
    const addDomainForm = getEl("add-domain-form");

    let currentType = "username"; // Reverted to lowercase to match backend enum
    let currentPage = 1;
    let currentLimit = parseInt(perPageSelect?.value) || 10;
    let currentSearch = "";
    
    let domainData = [];
    let currentEditingId = null;
    let currentDeletingId = null;

    const removeModal = getEl("remove-domain-modal");
    const closeRemoveModalBtn = getEl("close-remove-modal");
    const cancelRemoveBtn = getEl("cancel-remove-btn");
    const confirmRemoveBtn = getEl("confirm-remove-btn");

    // Preserve original HTML for restoration after error
    const originalHTML = mgmtContainer ? mgmtContainer.innerHTML : "";

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
            if (error.message.includes("Failed to fetch") || error instanceof TypeError) {
                throw new Error("Network error, please check your connection and try again.");
            }
            throw error;
        }
    }

    // --- UI HELPERS ---
    const showLoading = () => {
        const loader = getEl("admin-mgmt-loading");
        if (loader) loader.style.display = "flex";
        
        document.querySelectorAll(".tab-content").forEach(c => {
            c.style.display = "none";
            c.classList.remove("active");
        });
        
        if (paginationContainer) paginationContainer.style.display = "none";
    };

    const hideLoading = () => {
        const loader = getEl("admin-mgmt-loading");
        if (loader) loader.style.display = "none";
    };

    const renderSectionError = (message, retryFn) => {
        hideLoading();
        if (!mgmtContainer) return;

        mgmtContainer.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load data</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                </button>
            </div>
        `;

        const btn = mgmtContainer.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            mgmtContainer.innerHTML = originalHTML;
            retryFn();
        };
    };

    const formatDomainAge = (dateString) => {
        if (!dateString || dateString === "null") return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const finalDays = days < 0 ? 0 : days;
        if (finalDays === 0) return "Today";
        return `${finalDays} day${finalDays === 1 ? '' : 's'}`;
    };

    const formatDataSource = (source) => {
        if (!source || source === "null") return "N/A";
        return source
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    // --- DATA LOADING & RENDERING ---
    async function loadData(type = "username", page = 1, limit = 10, search = "") {
        showLoading();
        try {
            const url = `/domain-management?type=${type}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            const result = await apiFetch(url);
            
            if (!result || result.message === "error" || result.message === "Error") {
                throw new Error(result?.description || "Failed to fetch management data.");
            }

            hideLoading();
            renderTable(type, result.data.domains);
            renderPaginationUI(result.data.pagination);
            
            const activeTabContent = getEl(`${type}-content`);
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadData(type, page, limit, search));
        }
    }

    function renderTable(type, domains) {
        domainData = domains || [];
        const tbody = getEl(`${type}-tbody`);
        if (!tbody) {
            console.warn(`Tbody for ${type} not found.`);
            return;
        }

        if (!domains || domains.length === 0) {
            const colspan = type === "username" ? 3 : (type === "providers" ? 5 : 6);
            tbody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; padding: 40px; color: #737373;">No ${type} records found.</td></tr>`;
            return;
        }

        tbody.innerHTML = domains.map(d => {
            if (type === "username") {
                return `
                    <tr>
                        <td class="username-col">${d.value}</td>
                        <td>${formatDomainAge(d.domain_age)}</td>
                        <td class="action-cell">
                            <div class="action-btn-container">
                                <button class="action-btn" data-id="${d.id}">
                                    <img src="/assets/icons/more-vert.svg" alt="More" />
                                </button>
                                <div class="action-dropdown" id="dropdown-${d.id}">
                                    <button class="dropdown-item edit-btn" data-id="${d.id}">
                                        <img src="/assets/icons/edit-outline.svg" alt="" /> Edit
                                    </button>
                                    <button class="dropdown-item delete-btn text-danger" data-id="${d.id}">
                                        <img src="/assets/icons/delete.svg" alt="" /> Delete
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            } else if (type === "providers") {
                return `
                    <tr>
                        <td>${d.provider || "Unknown"}</td>
                        <td>${formatDomainAge(d.createdAt)}</td>
                        <td>${formatDataSource(d.data_source)}</td>
                        <td>${d.totalDEA || 0}</td>
                        <td class="action-cell">
                            <div class="action-btn-container">
                                <button class="action-btn" data-id="${d.id}">
                                    <img src="/assets/icons/more-vert.svg" alt="More" />
                                </button>
                                <div class="action-dropdown" id="dropdown-${d.id}">
                                    <button class="dropdown-item delete-btn text-danger" data-id="${d.id}">
                                        <img src="/assets/icons/delete.svg" alt="" /> Delete
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            } else {
                return `
                    <tr>
                        <td>${d.provider || "Unknown"}</td>
                        <td>${d.value}</td>
                        <td>${formatDomainAge(d.domain_age)}</td>
                        <td>${formatDomainAge(d.createdAt)}</td>
                        <td>${formatDataSource(d.data_source)}</td>
                        <td class="action-cell">
                            <div class="action-btn-container">
                                <button class="action-btn" data-id="${d.id}">
                                    <img src="/assets/icons/more-vert.svg" alt="More" />
                                </button>
                                <div class="action-dropdown" id="dropdown-${d.id}">
                                    <button class="dropdown-item edit-btn" data-id="${d.id}">
                                        <img src="/assets/icons/edit-outline.svg" alt="" /> Edit
                                    </button>
                                    <button class="dropdown-item delete-btn text-danger" data-id="${d.id}">
                                        <img src="/assets/icons/delete.svg" alt="" /> Delete
                                    </button>
                                </div>
                            </div>
                        </td>
                    </tr>
                `;
            }
        }).join("");
    }

    function renderPaginationUI(pagination) {
        if (!paginationContainer) return;

        const { page, pages } = pagination;
        const controls = paginationContainer.querySelector(".pagination-controls");
        if (!controls) return;

        if (pages <= 1) {
            controls.innerHTML = "";
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

        controls.innerHTML = html;

        controls.querySelectorAll(".pagination-btn").forEach(btn => {
            btn.onclick = () => {
                let targetPage = page;
                if (btn.classList.contains("prev-btn")) targetPage--;
                else if (btn.classList.contains("next-btn")) targetPage++;
                else targetPage = parseInt(btn.getAttribute("data-page"));

                if (targetPage !== page) {
                    currentPage = targetPage;
                    loadData(currentType, currentPage, currentLimit, currentSearch);
                }
            };
        });
    }

    // --- EVENT LISTENERS ---
    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute("data-tab");
            if (type === currentType) return;

            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            currentType = type;
            currentPage = 1;
            loadData(currentType, currentPage, currentLimit, currentSearch);
        };
    });

    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = searchInput.value.trim();
                currentPage = 1;
                loadData(currentType, currentPage, currentLimit, currentSearch);
            }, 500);
        };
    }

    if (perPageSelect) {
        perPageSelect.onchange = () => {
            currentLimit = parseInt(perPageSelect.value);
            currentPage = 1;
            loadData(currentType, currentPage, currentLimit, currentSearch);
        };
    }

    // Event Delegation for Table Actions
    if (mgmtContainer) {
        mgmtContainer.addEventListener('click', (e) => {
            // Dropdown Toggle
            const toggleBtn = e.target.closest('.action-btn');
            if (toggleBtn) {
                e.stopPropagation();
                const id = toggleBtn.getAttribute('data-id');
                document.querySelectorAll('.action-dropdown').forEach(d => {
                    if (d.id !== `dropdown-${id}`) d.classList.remove('active');
                });
                const dropdown = getEl(`dropdown-${id}`);
                if (dropdown) dropdown.classList.toggle('active');
                return;
            }

            // Edit Action
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const item = domainData.find(d => d.id === id);
                if (!item) return;

                currentEditingId = id;
                const modalTitle = getEl("domain-modal-title");
                if (modalTitle) modalTitle.textContent = "Edit Domain";

                getEl("domain-record-id").value = id;
                getEl("domain-type").value = currentType;
                
                if (currentType === "username") {
                    getEl("email-provider").value = "System"; // Abstracted for user
                    getEl("domain-name").value = item.value;
                } else {
                    getEl("email-provider").value = item.provider || "";
                    getEl("domain-name").value = item.value || "";
                }

                addModal.classList.add("active");
                return;
            }

            // Delete Action
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                currentDeletingId = deleteBtn.getAttribute('data-id');
                if (removeModal) removeModal.classList.add("active");
                return;
            }
        });
    }

    // Close Dropdowns Global Listener
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown').forEach(d => d.classList.remove('active'));
    });

    // Modal
    if (addMoreBtn) {
        addMoreBtn.onclick = () => {
            currentEditingId = null;
            const modalTitle = getEl("domain-modal-title");
            if (modalTitle) modalTitle.textContent = "Add More";
            addDomainForm.reset();
            getEl("domain-record-id").value = "";
            getEl("domain-type").value = currentType;
            if (currentType === "username") getEl("email-provider").value = "System";
            addModal.classList.add("active");
        };
    }

    if (closeModalBtn) {
        closeModalBtn.onclick = () => addModal.classList.remove("active");
    }

    const hideRemoveModal = () => {
        if (removeModal) removeModal.classList.remove("active");
        currentDeletingId = null;
    };
    if (closeRemoveModalBtn) closeRemoveModalBtn.onclick = hideRemoveModal;
    if (cancelRemoveBtn) cancelRemoveBtn.onclick = hideRemoveModal;

    window.onclick = (e) => {
        if (e.target === addModal) addModal.classList.remove("active");
        if (e.target === removeModal) hideRemoveModal();
    };

    if (confirmRemoveBtn) {
        confirmRemoveBtn.onclick = async () => {
            if (!currentDeletingId) return;
            const originalText = confirmRemoveBtn.innerHTML;
            confirmRemoveBtn.disabled = true;
            confirmRemoveBtn.innerHTML = `<div class="stopreg-btn-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>`;

            try {
                const result = await apiFetch(`/domain-management/${currentDeletingId}`, { method: "DELETE" });
                if (result?.message === "success" || result?.message === "Success") {
                    hideRemoveModal();
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Deleted',
                            message: result.description || "Record removed successfully.",
                            position: 'topRight'
                        });
                    }
                    // Silent refresh
                    loadData(currentType, currentPage, currentLimit, currentSearch);
                } else {
                    const desc = result?.description || "Failed to delete record.";
                    if (typeof iziToast !== 'undefined') iziToast.error({ title: 'Error', message: desc, position: 'topRight' });
                    else alert(desc);
                }
            } catch (error) {
                if (typeof iziToast !== 'undefined') iziToast.error({ title: 'Network Error', message: error.message, position: 'topRight' });
                else alert(error.message);
            } finally {
                confirmRemoveBtn.disabled = false;
                confirmRemoveBtn.innerHTML = originalText;
            }
        };
    }

    if (addDomainForm) {
        addDomainForm.onsubmit = async (e) => {
            e.preventDefault();
            const submitBtn = addDomainForm.querySelector(".domain-submit-btn");
            const originalBtnText = submitBtn.innerHTML;
            
            const provider = getEl("email-provider")?.value.trim();
            const value = getEl("domain-name")?.value.trim();
            const typeValue = getEl("domain-type")?.value || currentType;

            submitBtn.disabled = true;
            submitBtn.innerHTML = `<div class="stopreg-btn-spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>`;

            try {
                let url = "/domain-management";
                let method = "POST";
                let body = { type: typeValue, provider, value };

                if (currentEditingId) {
                    url = `/domain-management/${currentEditingId}`;
                    method = "PATCH";
                }

                const result = await apiFetch(url, {
                    method: method,
                    body: JSON.stringify(body)
                });

                if (result?.message === "success" || result?.message === "Success") {
                    addModal.classList.remove("active");
                    addDomainForm.reset();
                    currentEditingId = null;
                    
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: result.description || `Domain management record saved successfully.`,
                            position: 'topRight'
                        });
                    }
                    
                    loadData(currentType, currentPage, currentLimit, currentSearch);
                } else {
                    const desc = result?.description || "Failed to save domain management record.";
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({
                            title: 'Error',
                            message: desc,
                            position: 'topRight'
                        });
                    } else {
                        alert(desc);
                    }
                }
            } catch (error) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        title: 'Network Error',
                        message: error.message,
                        position: 'topRight'
                    });
                } else {
                    alert(error.message);
                }
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            }
        };
    }

    // --- INITIAL LOAD ---
    loadData(currentType, currentPage, currentLimit, currentSearch);
});



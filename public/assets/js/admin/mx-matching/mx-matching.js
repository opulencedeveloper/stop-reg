/**
 * Admin MX Matching JavaScript
 * Handles paginated management of Disposable and Relay MX matching patterns.
 */

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "https://api.stopreg.com/api/v1/admin";

    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    const mxContainer = getEl("admin-mx-error-target");
    const mxLoading = getEl("admin-mx-loading");
    const paginationContainer = getEl("mx-pagination");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const searchInput = getEl("mx-search-input");
    const perPageSelect = getEl("per-page-select");
    const addMoreBtn = getEl("admin-add-more-btn");
    const addModal = getEl("add-more-modal");
    const closeModalBtn = getEl("close-modal-btn");
    const addMxForm = getEl("add-mx-form");
    const modalTitle = getEl("modal-title");
    const submitMxBtn = getEl("submit-mx-btn");

    // Deletion Modal Elements
    const removeModal = getEl("remove-mx-modal");
    const confirmRemoveBtn = getEl("confirm-remove-btn");
    const cancelRemoveBtn = getEl("cancel-remove-btn");
    const closeRemoveBtn = getEl("close-remove-modal");

    let currentType = "disposable"; // Default type
    let currentPage = 1;
    let currentLimit = parseInt(perPageSelect?.value) || 10;
    let currentSearch = "";
    let currentEditingId = null;
    let currentDeletingId = null;

    // Cache to store records for quick lookup during edit
    let loadedRecords = [];

    // Preserve original HTML for restoration after error (Tab content container)
    const originalHTML = mxContainer ? mxContainer.innerHTML : "";

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
        if (mxLoading) mxLoading.style.display = "flex";
        
        document.querySelectorAll(".tab-content").forEach(c => {
            c.style.display = "none";
            c.classList.remove("active");
        });
        
        if (paginationContainer) paginationContainer.style.display = "none";
    };

    const hideLoading = () => {
        if (mxLoading) mxLoading.style.display = "none";
    };

    const renderSectionError = (message, retryFn) => {
        hideLoading();
        if (!mxContainer) return;

        mxContainer.innerHTML = `
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

        const btn = mxContainer.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            mxContainer.innerHTML = originalHTML;
            retryFn();
        };
    };

    // --- DATA LOADING & RENDERING ---
    async function loadData(type = "disposable", page = 1, limit = 10, search = "") {
        showLoading();
        try {
            const url = `/mx-matching?type=${type}&page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`;
            const result = await apiFetch(url);
            
            if (!result || result.message === "error" || result.message === "Error") {
                throw new Error(result?.description || "Failed to fetch MX matching data.");
            }

            hideLoading();
            loadedRecords = result.data.records; // Cache for editing
            renderTable(type, loadedRecords);
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

    function renderTable(type, records) {
        const tbody = getEl(`${type}-tbody`);
        if (!tbody) return;

        if (records.length === 0) {
            const displayType = type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #737373;">No ${displayType} MX patterns found.</td></tr>`;
            return;
        }

        tbody.innerHTML = records.map(r => `
            <tr>
                <td>${r.provider || "N/A"}</td>
                <td>
                  <span title="${Array.isArray(r.mx_record) ? r.mx_record.join(', ') : r.mx_record}">
                    ${Array.isArray(r.mx_record) ? r.mx_record.join(', ') : r.mx_record}
                  </span>
                </td>
                <td style="text-transform: capitalize;">${r.service_type ? r.service_type.replace(/_/g, " ") : "N/A"}</td>
                <td style="text-transform: capitalize;">${r.grade || "N/A"}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="action-btn" data-id="${r.id}">
                            <img src="/assets/icons/more-vert.svg" alt="More" />
                        </button>
                        <div class="action-dropdown" id="dropdown-${r.id}">
                            <button class="dropdown-item-edit" data-id="${r.id}">
                                <img src="/assets/icons/edit-outline.svg" alt="" />
                                <span>Edit Record</span>
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item-remove" data-id="${r.id}">
                                <img src="/assets/icons/delete.svg" alt="" />
                                <span>Remove Record</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");
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

    // --- ACTION HANDLERS ---
    const handleEdit = (id) => {
        const record = loadedRecords.find(r => r.id === id);
        if (!record) return;

        currentEditingId = id;
        if (modalTitle) modalTitle.textContent = "Edit Record";
        if (submitMxBtn) submitMxBtn.textContent = "Update Record";

        // Prepopulate form
        getEl("email-provider").value = record.provider;
        getEl("domain-name").value = Array.isArray(record.mx_record) ? record.mx_record.join(", ") : record.mx_record;
        getEl("mx-grade").value = record.grade;

        const serviceSelect = getEl("service-type");
        if (serviceSelect) {
            serviceSelect.value = record.service_type || "disposable";
        }

        const classificationSelect = getEl("mx-classification");
        if (classificationSelect) {
            classificationSelect.value = record.classification || "unresolved";
        }

        addModal.classList.add("active");
    };

    const handleDelete = (id) => {
        currentDeletingId = id;
        removeModal.classList.add("is-active");
    };

    const closeDeleteModal = () => {
        removeModal.classList.add("is-exiting");
        setTimeout(() => {
            removeModal.classList.remove("is-active", "is-exiting");
            currentDeletingId = null;
        }, 300);
    };


    const hideAllDropdowns = () => {
        document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
    };

    // --- EVENT LISTENERS ---
    
    // Centralized Event Delegation for Actions
    document.addEventListener("click", (e) => {
        const actionBtn = e.target.closest(".action-btn");
        const editBtn = e.target.closest(".dropdown-item-edit");
        const removeBtn = e.target.closest(".dropdown-item-remove");

        // Click to toggle on mobile (and desktop fallback)
        if (actionBtn) {
            e.stopPropagation();
            const dropdown = actionBtn.nextElementSibling;
            const isShown = dropdown.classList.contains("show");
            hideAllDropdowns();
            if (!isShown) dropdown.classList.add("show");
            return;
        }

        if (editBtn) {
            e.stopPropagation();
            hideAllDropdowns();
            handleEdit(editBtn.dataset.id);
            return;
        }

        if (removeBtn) {
            e.stopPropagation();
            hideAllDropdowns();
            handleDelete(removeBtn.dataset.id);
            return;
        }

        // Close dropdowns when clicking outside
        if (!e.target.closest(".action-btn-container")) {
            hideAllDropdowns();
        }
    });

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

    // Modal listeners
    if (addMoreBtn) {
        addMoreBtn.onclick = () => {
            currentEditingId = null;
            addMxForm.reset();
            if (modalTitle) modalTitle.textContent = "Add More";
            if (submitMxBtn) submitMxBtn.textContent = "Continue";
            addModal.classList.add("active");
        };
    }

    if (closeModalBtn) {
        closeModalBtn.onclick = () => addModal.classList.remove("active");
    }

    // Deletion Modal listeners
    if (closeRemoveBtn) closeRemoveBtn.onclick = closeDeleteModal;
    if (cancelRemoveBtn) cancelRemoveBtn.onclick = closeDeleteModal;

    if (confirmRemoveBtn) {
        confirmRemoveBtn.onclick = async () => {
            if (!currentDeletingId) return;

            const originalHTML = confirmRemoveBtn.innerHTML;
            confirmRemoveBtn.disabled = true;
            confirmRemoveBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

            try {
                const result = await apiFetch(`/mx-matching/${currentDeletingId}`, {
                    method: "DELETE"
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'MX pattern deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeDeleteModal();
                    loadData(currentType, currentPage, currentLimit, currentSearch);
                } else {
                    throw new Error(result?.description || "Failed to delete record.");
                }
            } catch (error) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        title: 'Error',
                        message: error.message,
                        position: 'topRight'
                    });
                }
            } finally {
                confirmRemoveBtn.disabled = false;
                confirmRemoveBtn.innerHTML = originalHTML;
            }
        };
    }

    if (addMxForm) {

        addMxForm.onsubmit = async (e) => {
            e.preventDefault();
            const originalBtnHTML = submitMxBtn.innerHTML;
            
            const provider = getEl("email-provider")?.value;
            const mx_record = getEl("domain-name")?.value;
            const service_type = getEl("service-type")?.value || "disposable";
            const grade = getEl("mx-grade")?.value || "standard";
            const classification = getEl("mx-classification")?.value || "unresolved";

            submitMxBtn.disabled = true;
            submitMxBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> ${currentEditingId ? 'Updating...' : 'Adding...'}`;

            try {
                const method = currentEditingId ? "PATCH" : "POST";
                const endpoint = currentEditingId ? `/mx-matching/${currentEditingId}` : "/mx-matching";

                const result = await apiFetch(endpoint, {
                    method: method,
                    body: JSON.stringify({
                        provider,
                        mx_record,
                        service_type,
                        grade,
                        classification
                    })
                });

                if (result?.message === "success" || result?.message === "Success") {
                    addModal.classList.remove("active");
                    addMxForm.reset();
                    
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: `MX record ${currentEditingId ? 'updated' : 'added'} successfully.`,
                            position: 'topRight'
                        });
                    }
                    
                    loadData(currentType, currentEditingId ? currentPage : 1, currentLimit, currentSearch);
                } else {
                    const desc = result?.description || `Failed to ${currentEditingId ? 'update' : 'add'} record.`;
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({
                            title: 'Error',
                            message: desc,
                            position: 'topRight'
                        });
                    }
                }
            } catch (error) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        title: 'Network Error',
                        message: error.message,
                        position: 'topRight'
                    });
                }
            } finally {
                submitMxBtn.disabled = false;
                submitMxBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // Modal background clicks
    window.addEventListener("click", (e) => {
        if (e.target === addModal) addModal.classList.remove("active");
        if (e.target === removeModal) closeDeleteModal();
    });

    // --- INITIAL LOAD ---
    loadData(currentType, currentPage, currentLimit, currentSearch);
});

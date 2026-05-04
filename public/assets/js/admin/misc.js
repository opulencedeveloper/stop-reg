/**
 * Admin Misc Management JavaScript
 * Handles paginated management of TLD RDAP mappings, Subdomain Providers, and RDAP IPs.
 */

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const MISC_BASE_URL = "https://api.stopreg.com/api/v1/admin/misc";
    const RDAP_IP_BASE_URL = "https://api.stopreg.com/api/v1/admin/rdap-ip";

    // --- ENUMS ---
    const MiscTab = Object.freeze({
        SUBDOMAIN: "subdomain",
        RDAP: "rdap",
        RDAP_IP: "rdap-ip"
    });

    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    const miscContainer = getEl("admin-misc-error-target");
    const miscLoading = getEl("admin-misc-loading");
    const paginationContainer = getEl("misc-pagination");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const perPageSelect = getEl("per-page-select");
    
    // RDAP Mapping Elements
    const addRdapBtn = getEl("add-rdap-btn");
    const rdapModal = getEl("rdap-modal");
    const closeRdapModal = getEl("close-rdap-modal");
    const rdapForm = getEl("rdap-form");
    const rdapModalTitle = getEl("rdap-modal-title");
    const submitRdapBtn = getEl("submit-rdap-btn");

    // Subdomain Elements
    const addSubdomainBtn = getEl("add-subdomain-btn");
    const subdomainModal = getEl("subdomain-modal");
    const closeSubdomainModal = getEl("close-subdomain-modal");
    const subdomainForm = getEl("subdomain-form");
    const subdomainModalTitle = getEl("subdomain-modal-title");
    const submitSubdomainBtn = getEl("submit-subdomain-btn");

    // RDAP IP Elements
    const addRdapIpBtn = getEl("add-rdap-ip-btn");
    const rdapIpModal = getEl("rdap-ip-modal");
    const closeRdapIpModal = getEl("close-rdap-ip-modal");
    const rdapIpForm = getEl("rdap-ip-form");
    const rdapIpModalTitle = getEl("rdap-ip-modal-title");
    const submitRdapIpBtn = getEl("submit-rdap-ip-btn");

    // Delete Modal Elements
    const deleteModal = getEl("delete-modal");
    const confirmDeleteBtn = getEl("confirm-delete-btn");
    const cancelDeleteBtn = getEl("cancel-delete-btn");
    const closeDeleteModal = getEl("close-delete-modal");
    const deleteModalText = getEl("delete-modal-text");

    let currentTab = MiscTab.SUBDOMAIN; // Default tab
    let currentPage = 1;
    let currentLimit = parseInt(perPageSelect?.value) || 10;
    let currentEditingId = null;
    let currentDeletingId = null;
    let deleteType = null; // One of MiscTab values

    // Cache to store records
    let loadedRecords = [];

    // Preserve original HTML for restoration after error
    const originalHTML = miscContainer ? miscContainer.innerHTML : "";

    // --- API UTILITIES ---
    async function apiFetch(baseUrl, endpoint, options = {}) {
        const url = `${baseUrl}${endpoint}`;
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
            throw new Error("Network error, please check your connection and try again.");
        }
    }

    // --- UI HELPERS ---
    const showLoading = () => {
        if (miscLoading) miscLoading.style.display = "flex";
        document.querySelectorAll(".tab-content").forEach(c => c.style.display = "none");
        if (paginationContainer) paginationContainer.style.display = "none";
    };

    const hideLoading = () => {
        if (miscLoading) miscLoading.style.display = "none";
        const activeTabContent = getEl(`${currentTab}-content`);
        if (activeTabContent) activeTabContent.style.display = "block";
        if (paginationContainer) paginationContainer.style.display = "flex";
    };

    const renderSectionError = (message, retryFn) => {
        if (miscLoading) miscLoading.style.display = "none";
        if (!miscContainer) return;

        miscContainer.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load data</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s;">
                    Try Again
                </button>
            </div>
        `;

        const btn = miscContainer.querySelector(".retry-btn");
        if (btn) btn.onclick = () => {
            miscContainer.innerHTML = originalHTML;
            retryFn();
        };
    };

    // --- DATA LOADING & RENDERING ---
    async function loadData(page = 1, limit = 10) {
        showLoading();
        let baseUrl, endpoint;

        switch (currentTab) {
            case MiscTab.SUBDOMAIN:
                baseUrl = MISC_BASE_URL;
                endpoint = "/subdomain-providers";
                break;
            case MiscTab.RDAP:
                baseUrl = MISC_BASE_URL;
                endpoint = "/tld-rdap";
                break;
            case MiscTab.RDAP_IP:
                baseUrl = RDAP_IP_BASE_URL;
                endpoint = "/";
                break;
        }

        try {
            const result = await apiFetch(baseUrl, `${endpoint}?page=${page}&limit=${limit}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch data.");

            loadedRecords = result.data.records;
            
            if (currentTab === MiscTab.SUBDOMAIN) renderSubdomainTable();
            else if (currentTab === MiscTab.RDAP) renderRdapTable();
            else if (currentTab === MiscTab.RDAP_IP) renderRdapIpTable();
            
            renderPaginationUI(result.data.pagination);
            hideLoading();
        } catch (error) {
            renderSectionError(error.message, () => loadData(page, limit));
        }
    }

    function renderRdapTable() {
        const tbody = getEl("rdap-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #737373;">No RDAP mappings found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td>${r.domain_suffix}</td>
                <td style="font-family: monospace; font-size: 12px; color: #6B7280;">${r.rdap_url}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openRdapModal(btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.RDAP);
        });
    }

    function renderSubdomainTable() {
        const tbody = getEl("subdomain-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 40px; color: #737373;">No subdomain providers found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td>${r.domain}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openSubdomainModal(btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.SUBDOMAIN);
        });
    }

    function renderRdapIpTable() {
        const tbody = getEl("rdap-ip-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #737373;">No RDAP IPs found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td>${r.host}</td>
                <td>${r.port}</td>
                <td>${r.note || '-'}</td>
                <td>
                    <span class="status-badge ${r.isActive ? 'active' : 'inactive'}">
                        ${r.isActive ? 'Active' : 'Inactive'}
                    </span>
                </td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openRdapIpModal(btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.RDAP_IP);
        });
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
                    loadData(currentPage, currentLimit);
                }
            };
        });
    }

    // --- MODAL HANDLERS ---
    const openRdapModal = (id = null) => {
        currentEditingId = id;
        rdapForm.reset();
        getEl("rdap-id").value = id || "";
        
        if (id) {
            const record = loadedRecords.find(r => (r.id || r._id) === id);
            if (record) {
                getEl("rdap-suffix").value = record.domain_suffix;
                getEl("rdap-url").value = record.rdap_url;
            }
            rdapModalTitle.textContent = "Edit RDAP Mapping";
            submitRdapBtn.textContent = "Update Mapping";
        } else {
            rdapModalTitle.textContent = "Add RDAP Mapping";
            submitRdapBtn.textContent = "Save Mapping";
        }
        
        rdapModal.classList.add("active");
    };

    const openSubdomainModal = (id = null) => {
        currentEditingId = id;
        subdomainForm.reset();
        getEl("subdomain-id").value = id || "";
        
        if (id) {
            const record = loadedRecords.find(r => (r.id || r._id) === id);
            if (record) {
                getEl("subdomain-domain").value = record.domain;
            }
            subdomainModalTitle.textContent = "Edit Subdomain Provider";
            submitSubdomainBtn.textContent = "Update Provider";
        } else {
            subdomainModalTitle.textContent = "Add Subdomain Provider";
            submitSubdomainBtn.textContent = "Save Provider";
        }
        subdomainModal.classList.add("active");
    };

    const openRdapIpModal = (id = null) => {
        currentEditingId = id;
        rdapIpForm.reset();
        getEl("rdap-ip-id").value = id || "";
        
        if (id) {
            const record = loadedRecords.find(r => (r.id || r._id) === id);
            if (record) {
                getEl("rdap-ip-address").value = record.host;
                getEl("rdap-ip-port").value = record.port;
                getEl("rdap-ip-username").value = record.username || "";
                getEl("rdap-ip-password").value = record.password || "";
                getEl("rdap-ip-note").value = record.note || "";
                getEl("rdap-ip-active").checked = record.isActive;
            }
            rdapIpModalTitle.textContent = "Edit RDAP IP";
            submitRdapIpBtn.textContent = "Update IP";
        } else {
            rdapIpModalTitle.textContent = "Add RDAP IP";
            submitRdapIpBtn.textContent = "Save IP";
            getEl("rdap-ip-active").checked = true;
        }
        rdapIpModal.classList.add("active");
    };

    const openDeleteModal = (id, type) => {
        currentDeletingId = id;
        deleteType = type;
        
        let text = "Are you sure you want to remove this item?";
        let btnText = "Remove Item";

        if (type === MiscTab.RDAP) {
            text = "Are you sure you want to remove this TLD RDAP mapping? This may affect domain age detection for these suffixes.";
            btnText = "Remove Mapping";
        } else if (type === MiscTab.SUBDOMAIN) {
            text = "Are you sure you want to remove this Subdomain Provider? It will no longer be skipped in root domain extraction.";
            btnText = "Remove Provider";
        } else if (type === MiscTab.RDAP_IP) {
            text = "Are you sure you want to remove this RDAP IP address? It will no longer be used for RDAP request rotation.";
            btnText = "Remove IP";
        }

        if (deleteModalText) deleteModalText.textContent = text;
        if (confirmDeleteBtn) confirmDeleteBtn.textContent = btnText;
        deleteModal.classList.add("active");
    };

    const closeModals = () => {
        rdapModal.classList.remove("active");
        subdomainModal.classList.remove("active");
        rdapIpModal.classList.remove("active");
        deleteModal.classList.remove("active");
        currentEditingId = null;
        currentDeletingId = null;
        deleteType = null;
    };

    // --- FORM SUBMISSIONS ---
    rdapForm.onsubmit = async (e) => {
        e.preventDefault();
        const suffix = getEl("rdap-suffix").value.trim();
        const url = getEl("rdap-url").value.trim();
        
        const originalBtnHTML = submitRdapBtn.innerHTML;
        submitRdapBtn.disabled = true;
        submitRdapBtn.innerHTML = `Saving...`;

        try {
            const method = currentEditingId ? "PATCH" : "POST";
            const endpoint = currentEditingId ? `/tld-rdap/${currentEditingId}` : "/tld-rdap";
            
            const result = await apiFetch(MISC_BASE_URL, endpoint, {
                method,
                body: JSON.stringify({ domain_suffix: suffix, rdap_url: url })
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Success', message: `RDAP mapping ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit);
            } else {
                throw new Error(result?.description || "Failed to save RDAP mapping.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        } finally {
            submitRdapBtn.disabled = false;
            submitRdapBtn.innerHTML = originalBtnHTML;
        }
    };

    subdomainForm.onsubmit = async (e) => {
        e.preventDefault();
        const domain = getEl("subdomain-domain").value.trim();
        
        submitSubdomainBtn.disabled = true;
        submitSubdomainBtn.innerHTML = `Saving...`;

        try {
            const method = currentEditingId ? "PATCH" : "POST";
            const endpoint = currentEditingId ? `/subdomain-providers/${currentEditingId}` : "/subdomain-providers";

            const result = await apiFetch(MISC_BASE_URL, endpoint, {
                method,
                body: JSON.stringify({ domain })
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Success', message: `Subdomain provider ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit);
            } else {
                throw new Error(result?.description || "Failed to save provider.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        } finally {
            submitSubdomainBtn.disabled = false;
            submitSubdomainBtn.innerHTML = currentEditingId ? "Update Provider" : "Save Provider";
        }
    };

    rdapIpForm.onsubmit = async (e) => {
        e.preventDefault();
        const host = getEl("rdap-ip-address").value.trim();
        const port = parseInt(getEl("rdap-ip-port").value);
        const username = getEl("rdap-ip-username").value.trim();
        const password = getEl("rdap-ip-password").value.trim();
        const note = getEl("rdap-ip-note").value.trim();
        const isActive = getEl("rdap-ip-active").checked;
        
        submitRdapIpBtn.disabled = true;
        submitRdapIpBtn.innerHTML = `Saving...`;

        try {
            const method = currentEditingId ? "PATCH" : "POST";
            const endpoint = currentEditingId ? `/${currentEditingId}` : "/";

            const result = await apiFetch(RDAP_IP_BASE_URL, endpoint, {
                method,
                body: JSON.stringify({ host, port, username, password, note, isActive })
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Success', message: `RDAP IP ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit);
            } else {
                throw new Error(result?.description || "Failed to save RDAP IP.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        } finally {
            submitRdapIpBtn.disabled = false;
            submitRdapIpBtn.innerHTML = currentEditingId ? "Update IP" : "Save IP";
        }
    };

    confirmDeleteBtn.onclick = async () => {
        if (!currentDeletingId || !deleteType) return;
        
        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = "Removing...";

        try {
            let baseUrl, endpoint;
            if (deleteType === MiscTab.RDAP) {
                baseUrl = MISC_BASE_URL;
                endpoint = `/tld-rdap/${currentDeletingId}`;
            } else if (deleteType === MiscTab.SUBDOMAIN) {
                baseUrl = MISC_BASE_URL;
                endpoint = `/subdomain-providers/${currentDeletingId}`;
            } else if (deleteType === MiscTab.RDAP_IP) {
                baseUrl = RDAP_IP_BASE_URL;
                endpoint = `/${currentDeletingId}`;
            }

            const result = await apiFetch(baseUrl, endpoint, { method: "DELETE" });
            if (result?.message === "success") {
                iziToast.success({ title: 'Removed', message: 'Item deleted successfully.', position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit);
            } else {
                throw new Error(result?.description || "Failed to delete item.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        } finally {
            confirmDeleteBtn.disabled = false;
            confirmDeleteBtn.innerHTML = "Remove Item";
        }
    };

    // --- EVENT LISTENERS ---
    tabButtons.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            if (tab === currentTab) return;

            tabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            currentTab = tab;
            currentPage = 1;
            
            // Update URL hash for persistence
            window.location.hash = tab;

            loadData(currentPage, currentLimit);
        };
    });

    if (perPageSelect) {
        perPageSelect.onchange = () => {
            currentLimit = parseInt(perPageSelect.value);
            currentPage = 1;
            loadData(currentPage, currentLimit);
        };
    }

    if (addRdapBtn) addRdapBtn.onclick = () => openRdapModal();
    if (addSubdomainBtn) addSubdomainBtn.onclick = () => openSubdomainModal();
    if (addRdapIpBtn) addRdapIpBtn.onclick = () => openRdapIpModal();

    if (closeRdapModal) closeRdapModal.onclick = closeModals;
    if (closeSubdomainModal) closeSubdomainModal.onclick = closeModals;
    if (closeRdapIpModal) closeRdapIpModal.onclick = closeModals;
    if (closeDeleteModal) closeDeleteModal.onclick = closeModals;
    if (cancelDeleteBtn) cancelDeleteBtn.onclick = closeModals;

    // --- INITIAL LOAD ---
    // Handle hash-based tab persistence
    const initialHash = window.location.hash.replace("#", "");
    if (Object.values(MiscTab).includes(initialHash)) {
        currentTab = initialHash;
        tabButtons.forEach(b => {
            if (b.dataset.tab === initialHash) b.classList.add("active");
            else b.classList.remove("active");
        });
    }

    loadData(currentPage, currentLimit); 

    // --- PASSWORD TOGGLE LOGIC ---
    document.querySelectorAll(".toggle-password").forEach(btn => {
        btn.onclick = () => {
            const targetId = btn.getAttribute("data-target");
            const targetInput = getEl(targetId);
            const icon = btn.querySelector("img");

            if (targetInput && icon) {
                if (targetInput.type === "password") {
                    targetInput.type = "text";
                    icon.src = "/assets/icons/mynaui_eye.svg";
                } else {
                    targetInput.type = "password";
                    icon.src = "/assets/icons/iconoir_eye-closed.svg";
                }
            }
        };
    });
});

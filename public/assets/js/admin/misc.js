/**
 * Admin Misc Management JavaScript
 * Handles paginated management of TLD RDAP mappings, Subdomain Providers, and RDAP IPs.
 */

document.addEventListener("DOMContentLoaded", () => {
    const adminToken = localStorage.getItem("adminToken");
    const BASE_ADMIN_URL = "https://api.stopreg.com/api/v1/admin";

    // --- ENUMS ---
    const MiscTab = Object.freeze({
        SUBDOMAIN: "subdomain",
        SUPER_SUBDOMAIN: "super-subdomain",
        IGNORE_DOMAIN: "ignore-domain",
        RDAP: "rdap",
        RDAP_IP: "rdap-ip",
        REPORTED: "reported",
        RISKY_DOMAINS: "risky-domains"
    });

    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);
    const miscContainer = getEl("admin-misc-error-target");
    const miscLoading = getEl("admin-misc-loading");
    const paginationContainer = getEl("misc-pagination");
    const tabButtons = document.querySelectorAll(".tab-btn");
    const perPageSelect = getEl("per-page-select");
    const searchInput = getEl("misc-search-input");
    
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

    // Domain Modal Elements (Shared for Super Subdomains & Ignore Domains)
    const addSuperSubdomainBtn = getEl("add-super-subdomain-btn");
    const addIgnoreDomainBtn = getEl("add-ignore-domain-btn");
    const domainModal = getEl("domain-modal");
    const closeDomainModal = getEl("close-domain-modal");
    const domainForm = getEl("domain-form");
    const domainModalTitle = getEl("domain-modal-title");
    const submitDomainBtn = getEl("submit-domain-btn");
    const domainTypeInput = getEl("domain-type");
    const domainIdInput = getEl("domain-id");
    const domainInput = getEl("domain-input");

    // Delete Modal Elements
    const deleteModal = getEl("delete-modal");
    const confirmDeleteBtn = getEl("confirm-delete-btn");
    const cancelDeleteBtn = getEl("cancel-delete-btn");
    const closeDeleteModal = getEl("close-delete-modal");
    const deleteModalText = getEl("delete-modal-text");

    let currentTab = MiscTab.SUBDOMAIN; // Default tab
    let currentPage = 1;
    let currentLimit = parseInt(perPageSelect?.value) || 10;
    let currentSearch = "";
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
    async function loadData(page = 1, limit = 10, search = "") {
        showLoading();
        let baseUrl, endpoint;

        switch (currentTab) {
            case MiscTab.SUBDOMAIN:
                endpoint = "/misc/subdomain-providers";
                break;
            case MiscTab.SUPER_SUBDOMAIN:
                endpoint = "/misc/super-subdomains";
                break;
            case MiscTab.IGNORE_DOMAIN:
                endpoint = "/misc/ignore-domains";
                break;
            case MiscTab.RDAP:
                endpoint = "/misc/tld-rdap";
                break;
            case MiscTab.RDAP_IP:
                endpoint = "/rdap-ip/";
                break;
            case MiscTab.REPORTED:
                endpoint = "/submitted-domains";
                break;
            case MiscTab.RISKY_DOMAINS:
                endpoint = "/risky-domains";
                break;
        }

        try {
            const separator = endpoint.includes("?") ? "&" : "?";
            const result = await apiFetch(BASE_ADMIN_URL, `${endpoint}${separator}page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch data.");

            const data = result.data;
            loadedRecords = data.records || data.domains || data.data || [];

            if (currentTab === MiscTab.SUBDOMAIN) renderSubdomainTable();
            else if (currentTab === MiscTab.SUPER_SUBDOMAIN) renderSuperSubdomainTable();
            else if (currentTab === MiscTab.IGNORE_DOMAIN) renderIgnoreDomainTable();
            else if (currentTab === MiscTab.RDAP) renderRdapTable();
            else if (currentTab === MiscTab.RDAP_IP) renderRdapIpTable();
            else if (currentTab === MiscTab.REPORTED) renderReportedTable();
            else if (currentTab === MiscTab.RISKY_DOMAINS) renderRiskyDomainsTable();
            
            // Handle both pagination formats (old and new)
            let paginationData;
            if (result.data.pagination) {
                paginationData = {
                    page: result.data.pagination.page || 1,
                    pages: result.data.pagination.totalPages || result.data.pagination.pages || 1,
                    total: result.data.pagination.total || 0
                };
            } else {
                paginationData = {
                    page: result.data.page || 1,
                    pages: result.data.totalPages || result.data.pages || 1,
                    total: result.data.total || 0
                };
            }
            renderPaginationUI(paginationData);
            hideLoading();
        } catch (error) {
            renderSectionError(error.message, () => loadData(page, limit, search));
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
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #737373;">No subdomain providers found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => {
            const domainAge = r.domain_age ? new Date(r.domain_age).toLocaleDateString() : "-";
            return `
            <tr>
                <td>${r.provider || "-"}</td>
                <td>${r.domain || "-"}</td>
                <td>
                    <span class="status-badge ${r.premium ? 'active' : 'inactive'}">
                        ${r.premium ? 'Premium' : 'Free'}
                    </span>
                </td>
                <td>${domainAge}</td>
                <td>${r.approval_mode || "-"}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `;
        }).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openSubdomainModal(btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.SUBDOMAIN);
        });
    }

    function renderSuperSubdomainTable() {
        const tbody = getEl("super-subdomain-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 40px; color: #737373;">No super subdomains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td>${r.domain || "-"}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openDomainModal(MiscTab.SUPER_SUBDOMAIN, btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.SUPER_SUBDOMAIN);
        });
    }

    function renderIgnoreDomainTable() {
        const tbody = getEl("ignore-domain-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; padding: 40px; color: #737373;">No ignore domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td>${r.domain || "-"}</td>
                <td class="text-right">
                    <div class="action-btn-container">
                        <button class="edit-btn" data-id="${r.id || r._id}">Edit</button>
                        <button class="delete-btn" data-id="${r.id || r._id}">Delete</button>
                    </div>
                </td>
            </tr>
        `).join("");

        tbody.querySelectorAll(".edit-btn").forEach(btn => {
            btn.onclick = () => openDomainModal(MiscTab.IGNORE_DOMAIN, btn.dataset.id);
        });
        tbody.querySelectorAll(".delete-btn").forEach(btn => {
            btn.onclick = () => openDeleteModal(btn.dataset.id, MiscTab.IGNORE_DOMAIN);
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

    function renderReportedTable() {
        const tbody = getEl("reported-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #737373;">No submitted domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td style="font-family: monospace; font-weight: 500;">${r.domain}</td>
                <td>
                    <span class="status-badge active" style="background: #F0F9FF; color: #0369A1; font-weight: 600;">
                        ${r.counter} submissions
                    </span>
                </td>
                <td style="color: #6B7280; font-size: 13px; text-align: right;">
                    ${new Date(r.lastSubmittedAt).toLocaleDateString()}
                </td>
            </tr>
        `).join("");
    }

    function renderRiskyDomainsTable() {
        const tbody = getEl("risky-domains-tbody");
        if (!tbody) return;

        if (loadedRecords.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 40px; color: #737373;">No risky domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = loadedRecords.map(r => `
            <tr>
                <td style="font-family: monospace; font-weight: 500;">${r.domain_name}</td>
                <td>${r.provider || '-'}</td>
                <td class="text-center">
                    <span class="status-badge ${r.disposable ? 'active' : ''}" style="${r.disposable ? 'background: #FEE2E2; color: #DC2626;' : 'background: #F3F4F6; color: #6B7280;'} font-weight: 600;">
                        ${r.disposable ? 'Yes' : 'No'}
                    </span>
                </td>
                <td class="text-center">
                    <span class="status-badge ${r.relay ? 'active' : ''}" style="${r.relay ? 'background: #FEF08A; color: #B45309;' : 'background: #F3F4F6; color: #6B7280;'} font-weight: 600;">
                        ${r.relay ? 'Yes' : 'No'}
                    </span>
                </td>
                <td style="color: #6B7280; font-size: 13px;">${r.domain_age || '-'}</td>
                <td style="color: #6B7280; font-size: 13px; text-align: right;">
                    ${new Date(r.date_added).toLocaleDateString()}
                </td>
            </tr>
        `).join("");
    }

    async function handleBlockReportedDomain(id) {
        if (!confirm("Are you sure you want to block this reported domain? This will add it to the global blacklist.")) return;
        
        try {
            const result = await apiFetch("https://api.stopreg.com/api/v1/admin", `/domains/${id}/block`, {
                method: "PATCH"
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Blocked', message: 'Domain has been blacklisted.', position: 'topRight' });
                loadData(currentPage, currentLimit, currentSearch);
            } else {
                throw new Error(result?.description || "Failed to block domain.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        }
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
                    loadData(currentPage, currentLimit, currentSearch);
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
                getEl("subdomain-provider").value = record.provider || "";
                getEl("subdomain-domain").value = record.domain || "";
                getEl("subdomain-premium").checked = record.premium || false;
                getEl("subdomain-approval").value = record.approval_mode || "null";
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

    const openDomainModal = (type, id = null) => {
        currentEditingId = id;
        domainForm.reset();
        domainTypeInput.value = type;
        domainIdInput.value = id || "";

        const typeLabel = type === MiscTab.SUPER_SUBDOMAIN ? "Super Subdomain" : "Ignore Domain";

        if (id) {
            const record = loadedRecords.find(r => (r.id || r._id) === id);
            if (record) {
                domainInput.value = record.domain || "";
            }
            domainModalTitle.textContent = `Edit ${typeLabel}`;
            submitDomainBtn.textContent = `Update ${typeLabel}`;
        } else {
            domainModalTitle.textContent = `Add ${typeLabel}`;
            submitDomainBtn.textContent = `Save ${typeLabel}`;
        }
        domainModal.classList.add("active");
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
        } else if (type === MiscTab.REPORTED) {
            text = "Are you sure you want to remove this domain report? This will delete the submission from history.";
            btnText = "Delete Report";
        }

        if (deleteModalText) deleteModalText.textContent = text;
        if (confirmDeleteBtn) confirmDeleteBtn.textContent = btnText;
        deleteModal.classList.add("active");
    };

    const closeModals = () => {
        rdapModal.classList.remove("active");
        subdomainModal.classList.remove("active");
        domainModal.classList.remove("active");
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
            const endpoint = currentEditingId ? `/misc/tld-rdap/${currentEditingId}` : "/misc/tld-rdap";
            
            const result = await apiFetch(BASE_ADMIN_URL, endpoint, {
                method,
                body: JSON.stringify({ domain_suffix: suffix, rdap_url: url })
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Success', message: `RDAP mapping ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit, currentSearch);
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
        const domain_provider = getEl("subdomain-provider").value.trim();
        const domain = getEl("subdomain-domain").value.trim();
        const premium_status = getEl("subdomain-premium").checked;
        const approval_mode = getEl("subdomain-approval").value;

        if (!domain_provider || !domain || !approval_mode) {
            iziToast.error({ title: 'Error', message: "Provider, Domain, and Approval Mode are required.", position: 'topRight' });
            return;
        }

        submitSubdomainBtn.disabled = true;
        submitSubdomainBtn.innerHTML = `Saving...`;

        try {
            const method = currentEditingId ? "PATCH" : "POST";
            const endpoint = currentEditingId ? `/misc/subdomain-providers/${currentEditingId}` : "/misc/subdomain-providers";

            const result = await apiFetch(BASE_ADMIN_URL, endpoint, {
                method,
                body: JSON.stringify({ domain_provider, domain, premium_status, approval_mode })
            });

            if (result?.message === "success" || result?.message === "Success") {
                iziToast.success({ title: 'Success', message: `Subdomain provider ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit, currentSearch);
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
            const endpoint = currentEditingId ? `/rdap-ip/${currentDeletingId || currentEditingId}` : "/rdap-ip/";

            const result = await apiFetch(BASE_ADMIN_URL, endpoint, {
                method,
                body: JSON.stringify({ host, port, username, password, note, isActive })
            });

            if (result?.message === "success") {
                iziToast.success({ title: 'Success', message: `RDAP IP ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit, currentSearch);
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

    domainForm.onsubmit = async (e) => {
        e.preventDefault();
        const type = domainTypeInput.value;
        const domain = domainInput.value.trim();

        if (!domain) {
            iziToast.error({ title: 'Error', message: "Domain is required.", position: 'topRight' });
            return;
        }

        submitDomainBtn.disabled = true;
        submitDomainBtn.innerHTML = `Saving...`;

        try {
            const method = currentEditingId ? "PATCH" : "POST";
            const endpoint = currentEditingId ? `/misc/${type}/${currentEditingId}` : `/misc/${type}`;

            const result = await apiFetch(BASE_ADMIN_URL, endpoint, {
                method,
                body: JSON.stringify({ domain })
            });

            if (result?.message === "success" || result?.message === "Success") {
                const typeLabel = type === MiscTab.SUPER_SUBDOMAIN ? "Super Subdomain" : "Ignore Domain";
                iziToast.success({ title: 'Success', message: `${typeLabel} ${currentEditingId ? 'updated' : 'added'}.`, position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit, currentSearch);
            } else {
                throw new Error(result?.description || "Failed to save domain.");
            }
        } catch (error) {
            iziToast.error({ title: 'Error', message: error.message, position: 'topRight' });
        } finally {
            submitDomainBtn.disabled = false;
            const typeLabel = type === MiscTab.SUPER_SUBDOMAIN ? "Super Subdomain" : "Ignore Domain";
            submitDomainBtn.innerHTML = currentEditingId ? `Update ${typeLabel}` : `Save ${typeLabel}`;
        }
    };

    confirmDeleteBtn.onclick = async () => {
        if (!currentDeletingId || !deleteType) return;

        confirmDeleteBtn.disabled = true;
        confirmDeleteBtn.innerHTML = "Removing...";

        try {
            let endpoint;
            if (deleteType === MiscTab.RDAP) {
                endpoint = `/misc/tld-rdap/${currentDeletingId}`;
            } else if (deleteType === MiscTab.SUBDOMAIN) {
                endpoint = `/misc/subdomain-providers/${currentDeletingId}`;
            } else if (deleteType === MiscTab.SUPER_SUBDOMAIN) {
                endpoint = `/misc/super-subdomains/${currentDeletingId}`;
            } else if (deleteType === MiscTab.IGNORE_DOMAIN) {
                endpoint = `/misc/ignore-domains/${currentDeletingId}`;
            } else if (deleteType === MiscTab.RDAP_IP) {
                endpoint = `/rdap-ip/${currentDeletingId}`;
            } else if (deleteType === MiscTab.REPORTED) {
                endpoint = `/submitted-domains/${currentDeletingId}`;
            }

            const result = await apiFetch(BASE_ADMIN_URL, endpoint, { method: "DELETE" });
            if (result?.message === "success") {
                iziToast.success({ title: 'Removed', message: 'Item deleted successfully.', position: 'topRight' });
                closeModals();
                loadData(currentPage, currentLimit, currentSearch);
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
            currentSearch = "";
            if (searchInput) searchInput.value = "";
            
            // Update URL hash for persistence
            window.location.hash = tab;

            loadData(currentPage, currentLimit, currentSearch);
        };
    });

    if (searchInput) {
        let debounceTimer;
        searchInput.oninput = () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentSearch = searchInput.value.trim();
                currentPage = 1;
                loadData(currentPage, currentLimit, currentSearch);
            }, 500);
        };
    }

    if (perPageSelect) {
        perPageSelect.onchange = () => {
            currentLimit = parseInt(perPageSelect.value);
            currentPage = 1;
            loadData(currentPage, currentLimit, currentSearch);
        };
    }

    if (addRdapBtn) addRdapBtn.onclick = () => openRdapModal();
    if (addSubdomainBtn) addSubdomainBtn.onclick = () => openSubdomainModal();
    if (addSuperSubdomainBtn) addSuperSubdomainBtn.onclick = () => openDomainModal(MiscTab.SUPER_SUBDOMAIN);
    if (addIgnoreDomainBtn) addIgnoreDomainBtn.onclick = () => openDomainModal(MiscTab.IGNORE_DOMAIN);
    if (addRdapIpBtn) addRdapIpBtn.onclick = () => openRdapIpModal();

    if (closeRdapModal) closeRdapModal.onclick = closeModals;
    if (closeSubdomainModal) closeSubdomainModal.onclick = closeModals;
    if (closeDomainModal) closeDomainModal.onclick = closeModals;
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

    loadData(currentPage, currentLimit, currentSearch); 

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

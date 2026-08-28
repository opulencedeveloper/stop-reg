const ProviderFeaturesEnum = {
  registrationRequired: { yes: "Yes", no: "No", optional: "Optional" },
  publicInbox: { yes: "Yes", no: "No" },
  emailRetention: { less_than_1_hour: "Less than 1 Hour", "24_hours": "24 Hours", "3_days": "3 Days", "7_days": "7 Days", "30_days": "30 Days", permanent: "Permanent", unknown: "Unknown" },
  paidPlans: { yes: "Yes", no: "No", freemium: "Freemium" },
  domainRotation: { yes: "Yes", no: "No", automatic: "Automatic", manual: "Manual", unknown: "Unknown" },
  apiAvailable: { yes: "Yes", no: "No" },
  mobileApp: { yes: "Yes", no: "No" },
  publishProviderSitemap: { yes: "Yes", no: "No" },
  publishDomainSitemap: { yes: "Yes", no: "No" },
};

function getEnumLabel(field, value) {
  if (!value || value === false || value === "false") return "-";
  return ProviderFeaturesEnum[field]?.[value] || value;
}

function getEnumOptions(field) {
  const enumObj = ProviderFeaturesEnum[field] || {};
  return Object.entries(enumObj).map(([value, label]) => ({ value, label }));
}

document.addEventListener("DOMContentLoaded", () => {
    console.log('[Programmatic SEO Script Started]');
    const adminToken = localStorage.getItem("adminToken");
    const BASE_URL = "https://api.stopreg.com/api/v1/admin";

    // --- DOM ELEMENTS ---
    const getEl = (id) => document.getElementById(id);

    const disposablesContainer = getEl("admin-disposables-error-target");
    const paginationContainer = getEl("admin-pagination");

    const addMetaProviderBtn = getEl("add-meta-provider-btn");
    const metaProviderModal = getEl("meta-provider-modal");
    const closeMetaProviderModal = getEl("close-meta-provider-modal");
    const metaProviderForm = getEl("meta-provider-form");
    const metaProviderModalTitle = getEl("meta-provider-modal-title");
    const submitMetaProviderBtn = getEl("submit-meta-provider-btn");
    const metaProviderDeleteModal = getEl("meta-provider-delete-modal");
    const closeMetaProviderDeleteModalBtn = getEl("close-meta-provider-delete-modal");
    const cancelMetaProviderDeleteBtn = getEl("cancel-meta-provider-delete-btn");
    const confirmMetaProviderDeleteBtn = getEl("confirm-meta-provider-delete-btn");

    const addMetaDomainBtn = getEl("add-meta-domain-btn");
    const metaDomainsModal = getEl("meta-domains-modal");
    const closeMetaDomainsModal = getEl("close-meta-domains-modal");
    const metaDomainsForm = getEl("meta-domains-form");
    const metaDomainsModalTitle = getEl("meta-domains-modal-title");
    const submitMetaDomainsBtn = getEl("submit-meta-domains-btn");
    const metaDomainsDeleteModal = getEl("meta-domains-delete-modal");
    const closeMetaDomainsDeleteModalBtn = getEl("close-meta-domains-delete-modal");
    const cancelMetaDomainsDeleteBtn = getEl("cancel-meta-domains-delete-btn");
    const confirmMetaDomainsDeleteBtn = getEl("confirm-meta-domains-delete-btn");

    const addProviderDescriptionBtn = getEl("add-provider-description-btn");
    const providerDescriptionsModal = getEl("provider-descriptions-modal");
    const closeProviderDescriptionsModal = getEl("close-provider-descriptions-modal");
    const providerDescriptionsForm = getEl("provider-descriptions-form");
    const providerDescriptionsModalTitle = getEl("provider-descriptions-modal-title");
    const submitProviderDescriptionsBtn = getEl("submit-provider-descriptions-btn");
    const providerDescriptionsDeleteModal = getEl("provider-descriptions-delete-modal");
    const closeProviderDescriptionsDeleteModalBtn = getEl("close-provider-descriptions-delete-modal");
    const cancelProviderDescriptionsDeleteBtn = getEl("cancel-provider-descriptions-delete-btn");
    const confirmProviderDescriptionsDeleteBtn = getEl("confirm-provider-descriptions-delete-btn");

    const addDomainDescriptionBtn = getEl("add-domain-description-btn");
    const domainDescriptionsModal = getEl("domain-descriptions-modal");
    const closeDomainDescriptionsModal = getEl("close-domain-descriptions-modal");
    const domainDescriptionsForm = getEl("domain-descriptions-form");
    const domainDescriptionsModalTitle = getEl("domain-descriptions-modal-title");
    const submitDomainDescriptionsBtn = getEl("submit-domain-descriptions-btn");
    const domainDescriptionsDeleteModal = getEl("domain-descriptions-delete-modal");
    const closeDomainDescriptionsDeleteModalBtn = getEl("close-domain-descriptions-delete-modal");
    const cancelDomainDescriptionsDeleteBtn = getEl("cancel-domain-descriptions-delete-btn");
    const confirmDomainDescriptionsDeleteBtn = getEl("confirm-domain-descriptions-delete-btn");

    const seoTabButtons = document.querySelectorAll(".seo-tab-btn");

    const providerFeaturesModal = getEl("provider-features-modal");
    const closeProviderFeaturesModal = getEl("close-provider-features-modal");
    const providerFeaturesForm = getEl("provider-features-form");
    const submitProviderFeaturesBtn = getEl("submit-provider-features-btn");
    const providerFeaturesDeleteModal = getEl("provider-features-delete-modal");
    const closeProviderFeaturesDeleteModalBtn = getEl("close-provider-features-delete-modal");
    const cancelProviderFeaturesDeleteBtn = getEl("cancel-provider-features-delete-btn");
    const confirmProviderFeaturesDeleteBtn = getEl("confirm-provider-features-delete-btn");

    const providerSitemapsModal = getEl("provider-sitemaps-modal");
    const closeProviderSitemapsModal = getEl("close-provider-sitemaps-modal");
    const providerSitemapsForm = getEl("provider-sitemaps-form");
    const submitProviderSitemapsBtn = getEl("submit-provider-sitemaps-btn");
    const providerSitemapsDeleteModal = getEl("provider-sitemaps-delete-modal");
    const closeProviderSitemapsDeleteModalBtn = getEl("close-provider-sitemaps-delete-modal");
    const cancelProviderSitemapsDeleteBtn = getEl("cancel-provider-sitemaps-delete-btn");
    const confirmProviderSitemapsDeleteBtn = getEl("confirm-provider-sitemaps-delete-btn");

    let currentPage = 1;
    let currentLimit = 10;
    let currentTab = "disposables";
    let currentEditingId = null;
    let currentDeletingId = null;
    let loadedMetaProviders = [];
    let loadedMetaDomains = [];
    let loadedProviderDescriptions = [];
    let loadedDomainDescriptions = [];
    let loadedProviderFeatures = [];
    let loadedProviderSitemaps = [];

    const domainSitemapsModal = getEl("domain-sitemaps-modal");
    const closeDomainSitemapsModal = getEl("close-domain-sitemaps-modal");
    const domainSitemapsForm = getEl("domain-sitemaps-form");
    const submitDomainSitemapsBtn = getEl("submit-domain-sitemaps-btn");
    const domainSitemapsDeleteModal = getEl("domain-sitemaps-delete-modal");
    const closeDomainSitemapsDeleteModalBtn = getEl("close-domain-sitemaps-delete-modal");
    const cancelDomainSitemapsDeleteBtn = getEl("cancel-domain-sitemaps-delete-btn");
    const confirmDomainSitemapsDeleteBtn = getEl("confirm-domain-sitemaps-delete-btn");

    let loadedDomainSitemaps = [];

    // Preserve original HTML for restoration after error
    const originalHTML = disposablesContainer ? disposablesContainer.innerHTML : "";

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
            const method = options.method || 'GET';

            if (window.handleAdminAuthError(response)) {
                console.warn(`[API] ${method} ${endpoint} - Auth error (${response.status})`);
                return null;
            }

            let responseData = {};
            try {
                responseData = await response.json();
            } catch (parseError) {
                console.warn(`[API Parse Warning] ${method} ${endpoint}: Could not parse response as JSON`, parseError.message);
                responseData = {};
            }

            if (!response.ok) {
                console.error(`[API Error] ${method} ${endpoint}`, {
                    status: response.statusText,
                    statusCode: response.status,
                    description: responseData.description || responseData.message || 'Unknown error',
                    fullResponse: responseData
                });
            }

            return responseData;
        } catch (error) {
            console.error(`[API Fetch Error] ${options.method || 'GET'} ${endpoint}:`, {
                message: error.message,
                stack: error.stack,
                error: error
            });
            if (error.message.includes("Failed to fetch")) {
                throw new Error("Network error, please check your connection and try again.");
            }
            throw error;
        }
    }

    // --- UI HELPERS ---
    const showLoading = () => {
        const disposablesLoading = getEl("admin-disposables-loading");
        if (disposablesLoading) disposablesLoading.style.display = "flex";

        document.querySelectorAll(".tab-content").forEach(content => {
            content.style.display = "none";
            content.classList.remove("active");
        });

        if (paginationContainer) paginationContainer.style.display = "none";
    };

    const hideLoading = () => {
        const disposablesLoading = getEl("admin-disposables-loading");
        if (disposablesLoading) disposablesLoading.style.display = "none";
    };

    const renderSectionError = (message, retryFn) => {
        hideLoading();
        if (!disposablesContainer) return;

        disposablesContainer.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load disposable domains</h3>
                <p style="font-family: 'Inter_28pt-Regular', sans-serif; font-size: 14px; color: #6B7280; margin-bottom: 24px; max-width: 320px; margin-left: auto; margin-right: auto;">${message}</p>
                <button class="retry-btn" style="display: inline-flex; align-items: center; gap: 8px; padding: 10px 24px; background-color: #FFFFFF; border: 1px solid #D1D5DB; border-radius: 8px; font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 14px; color: #374151; cursor: pointer; transition: all 0.2s; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Try Again
                </button>
            </div>
        `;

        const btn = disposablesContainer.querySelector(".retry-btn");
        if (btn) btn.onclick = (e) => {
            e.preventDefault();
            disposablesContainer.innerHTML = originalHTML;
            loadDisposables(currentPage);
        };
    };

    // --- DATA LOADING & RENDERING ---
    async function loadDisposables(page = 1, isSilent = false) {
        if (!isSilent) showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/disposables?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") {
                throw new Error(result?.description || "Failed to fetch disposable domains.");
            }

            if (!isSilent) hideLoading();
            renderDisposablesTable(result.data.data);
            renderPagination(result.data.pagination);

            const activeTabContent = getEl("disposables-content");
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadDisposables(page));
        }
    }

    function renderDisposablesTable(disposables) {
        const tbody = getEl("disposables-tbody");
        if (!tbody) return;

        if (disposables.length === 0) {
            tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; padding: 40px; color: #737373;">No disposable domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = disposables.map(d => {
            const date = new Date(d.submissionDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            return `
                <tr>
                    <td>${d.provider || '-'}</td>
                    <td>${d.domain || '-'}</td>
                    <td>${date}</td>
                </tr>
            `;
        }).join("");
    }

    function renderPagination(pagination) {
        if (!paginationContainer) return;

        const { page, pages } = pagination;
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

        paginationContainer.querySelectorAll(".pagination-btn").forEach(btn => {
            btn.onclick = () => {
                let targetPage = page;
                if (btn.classList.contains("prev-btn")) targetPage--;
                else if (btn.classList.contains("next-btn")) targetPage++;
                else targetPage = parseInt(btn.getAttribute("data-page"));

                if (targetPage !== page) {
                    currentPage = targetPage;
                    if (currentTab === "disposables") {
                        loadDisposables(currentPage);
                    } else if (currentTab === "meta-provider") {
                        loadMetaProviders(currentPage);
                    } else if (currentTab === "meta-domains") {
                        loadMetaDomains(currentPage);
                    } else if (currentTab === "provider-descriptions") {
                        loadProviderDescriptions(currentPage);
                    } else if (currentTab === "domain-descriptions") {
                        loadDomainDescriptions(currentPage);
                    } else if (currentTab === "provider-features") {
                        loadProviderFeatures(currentPage);
                    } else if (currentTab === "provider-sitemaps") {
                        loadProviderSitemaps(currentPage);
                    } else if (currentTab === "domain-sitemaps") {
                        loadDomainSitemaps(currentPage);
                    }
                }
            };
        });
    }

    // --- META PROVIDER FUNCTIONS ---
    async function loadMetaProviders(page = 1) {
        console.log('[loadMetaProviders called] page:', page);
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/meta-providers?page=${page}&limit=${currentLimit}`);
            console.log('[Meta Providers Full API Response]', JSON.stringify(result, null, 2));
            console.log('[result.data]', result?.data);
            console.log('[result.data.data]', result?.data?.data);

            if (!result || result.message === "error") {
                throw new Error(result?.description || "Failed to fetch meta providers.");
            }

            hideLoading();
            loadedMetaProviders = result.data?.data || result.data || [];
            console.log('[Meta Providers Final Loaded Data]', loadedMetaProviders);
            renderMetaProvidersTable(loadedMetaProviders);
            renderPagination(result.data.pagination);

            const activeTabContent = getEl("meta-provider-content");
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadMetaProviders(page));
        }
    }

    function renderMetaProvidersTable(providers) {
        const tbody = getEl("meta-provider-tbody");
        if (!tbody) return;

        if (providers.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #737373;">No meta providers found.</td></tr>`;
            return;
        }

        console.log('[Rendering Meta Providers]', providers);
        if (providers.length > 0) {
            console.log('[First Provider Object]', providers[0]);
        }

        tbody.innerHTML = providers.map(p => `
            <tr>
                <td>${p.provider || '-'}</td>
                <td>${p.metaPageTitle || '-'}</td>
                <td>${p.metaPageDescription || '-'}</td>
                <td class="text-left">
                    <div class="action-btn-container">
                        <button class="action-btn" data-provider="${p.provider}">
                            <img src="/assets/icons/more-vert.svg" alt="More" />
                        </button>
                        <div class="action-dropdown" id="dropdown-${p.provider}">
                            <button class="dropdown-item-edit" data-provider="${p.provider}">
                                <img src="/assets/icons/edit-outline.svg" alt="" />
                                <span>Edit Record</span>
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item-remove" data-provider="${p.provider}">
                                <img src="/assets/icons/delete.svg" alt="" />
                                <span>Remove Record</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");

        attachMetaProviderEventListeners();
    }

    function attachMetaProviderEventListeners() {
        document.querySelectorAll("#meta-provider-content .dropdown-item-edit").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                handleMetaProviderEdit(provider);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#meta-provider-content .dropdown-item-remove").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                handleMetaProviderDelete(provider);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#meta-provider-content .action-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const provider = btn.dataset.provider;
                const dropdown = document.getElementById(`dropdown-${provider}`);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
                if (dropdown) dropdown.classList.add("show");
            };
        });
    }

    function handleMetaProviderEdit(provider) {
        const record = loadedMetaProviders.find(r => r.provider === provider);
        if (!record) return;

        currentEditingId = provider;
        if (metaProviderModalTitle) metaProviderModalTitle.textContent = "Edit Meta Provider";
        if (submitMetaProviderBtn) submitMetaProviderBtn.textContent = "Update Record";

        const nameField = getEl("meta-provider-name");
        if (nameField) nameField.setAttribute("readonly", "");
        nameField.value = record.provider || "";
        getEl("meta-page-title").value = record.metaPageTitle || "";
        getEl("meta-page-description").value = record.metaPageDescription || "";
        getEl("meta-provider-id").value = provider;

        updateCharCounts();
        if (metaProviderModal) metaProviderModal.classList.add("active");
    }

    function handleMetaProviderDelete(provider) {
        currentDeletingId = provider;
        if (metaProviderDeleteModal) metaProviderDeleteModal.classList.add("is-active");
    }

    function closeDeleteModal() {
        // Close whichever delete modal is currently active
        const modals = [
            metaProviderDeleteModal,
            metaDomainsDeleteModal,
            providerDescriptionsDeleteModal,
            domainDescriptionsDeleteModal,
            providerFeaturesDeleteModal,
            providerSitemapsDeleteModal,
            domainSitemapsDeleteModal
        ];

        modals.forEach(modal => {
            if (modal && modal.classList.contains("is-active")) {
                modal.classList.add("is-exiting");
                setTimeout(() => {
                    modal.classList.remove("is-active", "is-exiting");
                    currentDeletingId = null;
                }, 300);
            }
        });
    }

    function updateCharCounts() {
        const titleInput = getEl("meta-page-title");
        const descInput = getEl("meta-page-description");
        if (titleInput) getEl("title-char-count").textContent = titleInput.value.length;
        if (descInput) getEl("desc-char-count").textContent = descInput.value.length;
    }

    // --- META DOMAINS FUNCTIONS ---
    async function loadMetaDomains(page = 1) {
        console.log('[loadMetaDomains called] page:', page);
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/meta-domains?page=${page}&limit=${currentLimit}`);
            console.log('[Meta Domains API Response]', result);
            if (result?.data) {
                console.log('[Meta Domains First Item]', result.data.data?.[0]);
            }
            if (!result || result.message === "error") {
                throw new Error(result?.description || "Failed to fetch meta domains.");
            }

            hideLoading();
            loadedMetaDomains = result.data.data || [];
            console.log('[Meta Domains Loaded]', loadedMetaDomains);
            renderMetaDomainsTable(loadedMetaDomains);
            renderPagination(result.data.pagination);

            const activeTabContent = getEl("meta-domains-content");
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadMetaDomains(page));
        }
    }

    function renderMetaDomainsTable(domains) {
        const tbody = getEl("meta-domains-tbody");
        if (!tbody) return;

        if (domains.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #737373;">No meta domains found.</td></tr>`;
            return;
        }

        tbody.innerHTML = domains.map(d => `
            <tr>
                <td>${d.domain || '-'}</td>
                <td>${d.metaDomainPageTitle || '-'}</td>
                <td>${d.metaDomainPageDescription || '-'}</td>
                <td class="text-left">
                    <div class="action-btn-container">
                        <button class="action-btn" data-domain="${d.domain}">
                            <img src="/assets/icons/more-vert.svg" alt="More" />
                        </button>
                        <div class="action-dropdown" id="domains-dropdown-${d.domain}">
                            <button class="dropdown-item-edit" data-domain="${d.domain}">
                                <img src="/assets/icons/edit-outline.svg" alt="" />
                                <span>Edit Record</span>
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item-remove" data-domain="${d.domain}">
                                <img src="/assets/icons/delete.svg" alt="" />
                                <span>Remove Record</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");

        attachMetaDomainsEventListeners();
    }

    function attachMetaDomainsEventListeners() {
        document.querySelectorAll("#meta-domains-content .dropdown-item-edit").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const domain = btn.dataset.domain;
                handleMetaDomainsEdit(domain);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#meta-domains-content .dropdown-item-remove").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const domain = btn.dataset.domain;
                handleMetaDomainsDelete(domain);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#meta-domains-content .action-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const domain = btn.dataset.domain;
                const dropdown = document.getElementById(`domains-dropdown-${domain}`);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
                if (dropdown) dropdown.classList.add("show");
            };
        });
    }

    function handleMetaDomainsEdit(domain) {
        const record = loadedMetaDomains.find(r => r.domain === domain);
        if (!record) return;

        currentEditingId = domain;
        if (metaDomainsModalTitle) metaDomainsModalTitle.textContent = "Edit Meta Domain";
        if (submitMetaDomainsBtn) submitMetaDomainsBtn.textContent = "Update Record";

        getEl("meta-domains-name").value = record.domain || "";
        getEl("meta-domains-page-title").value = record.metaPageTitle || "";
        getEl("meta-domains-page-description").value = record.metaPageDescription || "";
        getEl("meta-domains-id").value = domain;

        updateMetaDomainsCharCounts();
        if (metaDomainsModal) metaDomainsModal.classList.add("active");
    }

    function handleMetaDomainsDelete(domain) {
        currentDeletingId = domain;
        if (metaDomainsDeleteModal) metaDomainsDeleteModal.classList.add("is-active");
    }

    function closeMetaDomainsDeleteModal() {
        if (metaDomainsDeleteModal) {
            metaDomainsDeleteModal.classList.add("is-exiting");
            setTimeout(() => {
                metaDomainsDeleteModal.classList.remove("is-active", "is-exiting");
                currentDeletingId = null;
            }, 300);
        }
    }

    function updateMetaDomainsCharCounts() {
        const titleInput = getEl("meta-domains-page-title");
        const descInput = getEl("meta-domains-page-description");
        if (titleInput) getEl("domains-title-char-count").textContent = titleInput.value.length;
        if (descInput) getEl("domains-desc-char-count").textContent = descInput.value.length;
    }

    // --- PROVIDER DESCRIPTIONS FUNCTIONS ---
    async function loadProviderDescriptions(page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/provider-descriptions?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") {
                throw new Error(result?.description || "Failed to fetch provider descriptions.");
            }

            hideLoading();
            loadedProviderDescriptions = result.data.data || [];
            renderProviderDescriptionsTable(loadedProviderDescriptions);
            renderPagination(result.data.pagination);

            const activeTabContent = getEl("provider-descriptions-content");
            if (activeTabContent) {
                activeTabContent.style.display = "block";
                activeTabContent.classList.add("active");
            }
            if (paginationContainer) paginationContainer.style.display = "flex";

        } catch (error) {
            renderSectionError(error.message, () => loadProviderDescriptions(page));
        }
    }

    function renderProviderDescriptionsTable(descriptions) {
        const tbody = getEl("provider-descriptions-tbody");
        if (!tbody) return;

        if (descriptions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 40px; color: #737373;">No provider descriptions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = descriptions.map(d => `
            <tr>
                <td>${d.provider || '-'}</td>
                <td>${d.providerDescription ? d.providerDescription.substring(0, 50) + (d.providerDescription.length > 50 ? '...' : '') : '-'}</td>
                <td>${d.aboutProvider ? d.aboutProvider.substring(0, 50) + (d.aboutProvider.length > 50 ? '...' : '') : '-'}</td>
                <td class="text-left">
                    <div class="action-btn-container">
                        <button class="action-btn" data-provider="${d.provider}">
                            <img src="/assets/icons/more-vert.svg" alt="More" />
                        </button>
                        <div class="action-dropdown" id="desc-dropdown-${d.provider}">
                            <button class="dropdown-item-edit" data-provider="${d.provider}">
                                <img src="/assets/icons/edit-outline.svg" alt="" />
                                <span>Edit Record</span>
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item-remove" data-provider="${d.provider}">
                                <img src="/assets/icons/delete.svg" alt="" />
                                <span>Remove Record</span>
                            </button>
                        </div>
                    </div>
                </td>
            </tr>
        `).join("");

        attachProviderDescriptionsEventListeners();
    }

    function attachProviderDescriptionsEventListeners() {
        document.querySelectorAll("#provider-descriptions-content .dropdown-item-edit").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                handleProviderDescriptionsEdit(provider);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#provider-descriptions-content .dropdown-item-remove").forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                const provider = btn.dataset.provider;
                handleProviderDescriptionsDelete(provider);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
            };
        });

        document.querySelectorAll("#provider-descriptions-content .action-btn").forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const provider = btn.dataset.provider;
                const dropdown = document.getElementById(`desc-dropdown-${provider}`);
                document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));
                if (dropdown) dropdown.classList.add("show");
            };
        });
    }

    function handleProviderDescriptionsEdit(provider) {
        const record = loadedProviderDescriptions.find(r => r.provider === provider);
        if (!record) return;

        currentEditingId = provider;
        if (providerDescriptionsModalTitle) providerDescriptionsModalTitle.textContent = "Edit Provider Description";
        if (submitProviderDescriptionsBtn) submitProviderDescriptionsBtn.textContent = "Update Record";

        const nameField = getEl("provider-descriptions-name");
        if (nameField) nameField.setAttribute("readonly", "");
        nameField.value = record.provider || "";
        getEl("provider-descriptions-description").value = record.providerDescription || "";
        getEl("provider-descriptions-about").value = record.aboutProvider || "";
        getEl("provider-descriptions-id").value = provider;

        if (providerDescriptionsModal) providerDescriptionsModal.classList.add("active");
    }

    function handleProviderDescriptionsDelete(provider) {
        currentDeletingId = provider;
        if (providerDescriptionsDeleteModal) providerDescriptionsDeleteModal.classList.add("is-active");
    }

    function closeProviderDescriptionsDeleteModal() {
        if (providerDescriptionsDeleteModal) {
            providerDescriptionsDeleteModal.classList.add("is-exiting");
            setTimeout(() => {
                providerDescriptionsDeleteModal.classList.remove("is-active", "is-exiting");
                currentDeletingId = null;
            }, 300);
        }
    }

    // --- DISPOSABLE DOMAIN DESCRIPTIONS FUNCTIONS ---
    function populateSelectOptions(selectId, fieldName) {
        const select = getEl(selectId);
        if (!select) return;
        const options = getEnumOptions(fieldName);
        select.innerHTML = `<option value="">Select an option</option>`;
        options.forEach(({value, label}) => {
            const option = document.createElement("option");
            option.value = value;
            option.textContent = label;
            select.appendChild(option);
        });
    }

    function initializeProviderFeaturesForm() {
        populateSelectOptions("provider-features-registration-required", "registrationRequired");
        populateSelectOptions("provider-features-public-inbox", "publicInbox");
        populateSelectOptions("provider-features-email-retention", "emailRetention");
        populateSelectOptions("provider-features-paid-plans", "paidPlans");
        populateSelectOptions("provider-features-domain-rotation", "domainRotation");
        populateSelectOptions("provider-features-api-available", "apiAvailable");
        populateSelectOptions("provider-features-mobile-app", "mobileApp");
        populateSelectOptions("provider-features-provider-sitemap", "publishProviderSitemap");
        populateSelectOptions("provider-features-domain-sitemap", "publishDomainSitemap");
    }

    async function loadProviderFeatures(page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/provider-features?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch records.");
            hideLoading();
            loadedProviderFeatures = result.data.data || [];
            renderProviderFeaturesTable(loadedProviderFeatures);
            renderPagination(result.data.pagination);
            const activeTabContent = getEl("provider-features-content");
            if (activeTabContent) { activeTabContent.style.display = "block"; activeTabContent.classList.add("active"); }
            if (paginationContainer) paginationContainer.style.display = "flex";
        } catch (error) { renderSectionError(error.message, () => loadProviderFeatures(page)); }
    }

    function renderProviderFeaturesTable(features) {
        const tbody = getEl("provider-features-tbody");
        if (!tbody) return;

        if (features.length === 0) {
            tbody.innerHTML = `<tr><td colspan="11" style="text-align: center; padding: 40px; color: #737373;">No provider features found.</td></tr>`;
            return;
        }

        tbody.innerHTML = features.map(f => `<tr><td>${f.provider || '-'}</td><td>${getEnumLabel("registrationRequired", f.registrationRequired)}</td><td>${getEnumLabel("publicInbox", f.publicInbox)}</td><td>${getEnumLabel("emailRetention", f.emailRetention)}</td><td>${getEnumLabel("paidPlans", f.paidPlans)}</td><td>${getEnumLabel("domainRotation", f.domainRotation)}</td><td>${getEnumLabel("apiAvailable", f.apiAvailable)}</td><td>${getEnumLabel("mobileApp", f.mobileApp)}</td><td>${getEnumLabel("publishProviderSitemap", f.publishProviderSitemap)}</td><td>${getEnumLabel("publishDomainSitemap", f.publishDomainSitemap)}</td><td class="text-left"><div class="action-btn-container"><button class="action-btn" data-provider="${f.provider}"><img src="/assets/icons/more-vert.svg" alt="More" /></button><div class="action-dropdown" id="pf-dropdown-${f.provider}"><button class="dropdown-item-edit" data-provider="${f.provider}"><img src="/assets/icons/edit-outline.svg" alt="" /><span>Edit</span></button><div class="dropdown-divider"></div><button class="dropdown-item-remove" data-provider="${f.provider}"><img src="/assets/icons/delete.svg" alt="" /><span>Remove</span></button></div></div></td></tr>`).join("");
        document.querySelectorAll("#provider-features-content .dropdown-item-edit").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleProviderFeaturesEdit(btn.dataset.provider); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#provider-features-content .dropdown-item-remove").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleProviderFeaturesDelete(btn.dataset.provider); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#provider-features-content .action-btn").forEach(btn => {btn.onclick = (e) => {e.stopPropagation(); const provider = btn.dataset.provider; const dropdown = document.getElementById(`pf-dropdown-${provider}`); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show")); if (dropdown) dropdown.classList.add("show");};});
    }

    function handleProviderFeaturesEdit(provider) {
        const record = loadedProviderFeatures.find(r => r.provider === provider);
        if (!record) return;
        currentEditingId = provider;
        const providerInput = getEl("provider-features-provider");
        providerInput.value = record.provider || "";
        providerInput.setAttribute("readonly", "");

        getEl("provider-features-registration-required").value = record.registrationRequired || "";
        getEl("provider-features-public-inbox").value = record.publicInbox || "";
        getEl("provider-features-email-retention").value = record.emailRetention || "";
        getEl("provider-features-paid-plans").value = record.paidPlans || "";
        getEl("provider-features-domain-rotation").value = record.domainRotation || "";
        getEl("provider-features-api-available").value = record.apiAvailable || "";
        getEl("provider-features-mobile-app").value = record.mobileApp || "";
        getEl("provider-features-publish-provider-sitemap").value = record.publishProviderSitemap || "";
        getEl("provider-features-publish-domain-sitemap").value = record.publishDomainSitemap || "";
        getEl("provider-features-id").value = provider;

        if (providerFeaturesModal) providerFeaturesModal.classList.add("active");
    }

    function handleProviderFeaturesDelete(provider) {
        currentDeletingId = provider;
        if (providerFeaturesDeleteModal) providerFeaturesDeleteModal.classList.add("is-active");
    }

    function closeProviderFeaturesDeleteModal() {
        if (providerFeaturesDeleteModal) {
            providerFeaturesDeleteModal.classList.add("is-exiting");
            setTimeout(() => {providerFeaturesDeleteModal.classList.remove("is-active", "is-exiting"); currentDeletingId = null;}, 300);
        }
    }

    async function loadProviderSitemaps(page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/provider-sitemaps?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch records.");
            hideLoading();
            loadedProviderSitemaps = result.data.data || [];
            renderProviderSitemapsTable(loadedProviderSitemaps);
            renderPagination(result.data.pagination);
            const activeTabContent = getEl("provider-sitemaps-content");
            if (activeTabContent) { activeTabContent.style.display = "block"; activeTabContent.classList.add("active"); }
            if (paginationContainer) paginationContainer.style.display = "flex";
        } catch (error) { renderSectionError(error.message, () => loadProviderSitemaps(page)); }
    }

    function renderProviderSitemapsTable(sitemaps) {
        const tbody = getEl("provider-sitemaps-tbody");
        if (!tbody) return;

        if (sitemaps.length === 0) {
            tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 40px; color: #737373;">No provider site maps found.</td></tr>`;
            return;
        }

        tbody.innerHTML = sitemaps.map(s => `<tr><td>${s.providerName || '-'}</td><td>${s.metaProviderPageTitle ? s.metaProviderPageTitle.substring(0, 30) + (s.metaProviderPageTitle.length > 30 ? '...' : '') : '-'}</td><td>${s.metaProviderPageDescription ? s.metaProviderPageDescription.substring(0, 30) + (s.metaProviderPageDescription.length > 30 ? '...' : '') : '-'}</td><td>${s.providerDescription ? s.providerDescription.substring(0, 30) + (s.providerDescription.length > 30 ? '...' : '') : '-'}</td><td>${s.aboutProvider ? s.aboutProvider.substring(0, 30) + (s.aboutProvider.length > 30 ? '...' : '') : '-'}</td><td><a href="${s.publishedUrl}" target="_blank" style="color: #1570EF; text-decoration: none;">View</a></td><td class="text-left"><div class="action-btn-container"><button class="action-btn" data-provider="${s.providerName}"><img src="/assets/icons/more-vert.svg" alt="More" /></button><div class="action-dropdown" id="psm-dropdown-${s.providerName}"><button class="dropdown-item-edit" data-provider="${s.providerName}"><img src="/assets/icons/edit-outline.svg" alt="" /><span>Edit</span></button><div class="dropdown-divider"></div><button class="dropdown-item-remove" data-provider="${s.providerName}"><img src="/assets/icons/delete.svg" alt="" /><span>Remove</span></button></div></div></td></tr>`).join("");
        document.querySelectorAll("#provider-sitemaps-content .dropdown-item-edit").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleProviderSitemapsEdit(btn.dataset.provider); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#provider-sitemaps-content .dropdown-item-remove").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleProviderSitemapsDelete(btn.dataset.provider); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#provider-sitemaps-content .action-btn").forEach(btn => {btn.onclick = (e) => {e.stopPropagation(); const provider = btn.dataset.provider; const dropdown = document.getElementById(`psm-dropdown-${provider}`); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show")); if (dropdown) dropdown.classList.add("show");};});
    }

    function handleProviderSitemapsEdit(provider) {
        const record = loadedProviderSitemaps.find(r => r.providerName === provider);
        if (!record) return;
        currentEditingId = provider;
        const providerInput = getEl("provider-sitemaps-provider");
        providerInput.value = record.providerName || "";
        providerInput.setAttribute("readonly", "");
        getEl("provider-sitemaps-meta-title").value = record.metaProviderPageTitle || "";
        getEl("provider-sitemaps-meta-description").value = record.metaProviderPageDescription || "";
        getEl("provider-sitemaps-description").value = record.providerDescription || "";
        getEl("provider-sitemaps-about").value = record.aboutProvider || "";
        getEl("provider-sitemaps-url").value = record.publishedUrl || "";
        getEl("provider-sitemaps-id").value = provider;
        updateCharCountsForSitemaps();
        if (providerSitemapsModal) providerSitemapsModal.classList.add("active");
    }

    function handleProviderSitemapsDelete(provider) {
        currentDeletingId = provider;
        if (providerSitemapsDeleteModal) providerSitemapsDeleteModal.classList.add("is-active");
    }

    function closeProviderSitemapsDeleteModal() {
        if (providerSitemapsDeleteModal) {
            providerSitemapsDeleteModal.classList.add("is-exiting");
            setTimeout(() => {providerSitemapsDeleteModal.classList.remove("is-active", "is-exiting"); currentDeletingId = null;}, 300);
        }
    }

    function updateCharCountsForSitemaps() {
        const titleInput = getEl("provider-sitemaps-meta-title");
        const descInput = getEl("provider-sitemaps-meta-description");
        if (titleInput) getEl("provider-sitemaps-meta-title-count").textContent = titleInput.value.length;
        if (descInput) getEl("provider-sitemaps-meta-description-count").textContent = descInput.value.length;
    }

    async function loadDomainSitemaps(page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/domain-sitemaps?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch records.");
            hideLoading();
            loadedDomainSitemaps = result.data.data || [];
            renderDomainSitemapsTable(loadedDomainSitemaps);
            renderPagination(result.data.pagination);
            const activeTabContent = getEl("domain-sitemaps-content");
            if (activeTabContent) { activeTabContent.style.display = "block"; activeTabContent.classList.add("active"); }
            if (paginationContainer) paginationContainer.style.display = "flex";
        } catch (error) { renderSectionError(error.message, () => loadDomainSitemaps(page)); }
    }

    function renderDomainSitemapsTable(sitemaps) {
        const tbody = getEl("domain-sitemaps-tbody");
        if (!tbody) return;
        if (sitemaps.length === 0) { tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 40px; color: #737373;">No records found.</td></tr>`; return; }
        tbody.innerHTML = sitemaps.map(s => {
            const key = `${s.providerName}/${s.domainName}`;
            return `<tr><td>${s.providerName || '-'}</td><td>${s.domainName || '-'}</td><td>${s.metaDomainPageTitle ? s.metaDomainPageTitle.substring(0, 25) + (s.metaDomainPageTitle.length > 25 ? '...' : '') : '-'}</td><td>${s.metaDomainPageDescription ? s.metaDomainPageDescription.substring(0, 25) + (s.metaDomainPageDescription.length > 25 ? '...' : '') : '-'}</td><td>${s.deaOverview ? s.deaOverview.substring(0, 25) + (s.deaOverview.length > 25 ? '...' : '') : '-'}</td><td>${s.aboutDea ? s.aboutDea.substring(0, 25) + (s.aboutDea.length > 25 ? '...' : '') : '-'}</td><td>${s.howDeaDiscovered ? s.howDeaDiscovered.substring(0, 25) + (s.howDeaDiscovered.length > 25 ? '...' : '') : '-'}</td><td><a href="${s.publishedUrl}" target="_blank" style="color: #1570EF; text-decoration: none;">View</a></td><td class="text-left"><div class="action-btn-container"><button class="action-btn" data-key="${key}"><img src="/assets/icons/more-vert.svg" alt="More" /></button><div class="action-dropdown" id="dsm-dropdown-${key.replace(/\//g, '-')}"><button class="dropdown-item-edit" data-key="${key}"><img src="/assets/icons/edit-outline.svg" alt="" /><span>Edit</span></button><div class="dropdown-divider"></div><button class="dropdown-item-remove" data-key="${key}"><img src="/assets/icons/delete.svg" alt="" /><span>Remove</span></button></div></div></td></tr>`;
        }).join("");
        document.querySelectorAll("#domain-sitemaps-content .dropdown-item-edit").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleDomainSitemapsEdit(btn.dataset.key); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#domain-sitemaps-content .dropdown-item-remove").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleDomainSitemapsDelete(btn.dataset.key); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#domain-sitemaps-content .action-btn").forEach(btn => {btn.onclick = (e) => {e.stopPropagation(); const key = btn.dataset.key; const dropdownId = `dsm-dropdown-${key.replace(/\//g, '-')}`; const dropdown = document.getElementById(dropdownId); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show")); if (dropdown) dropdown.classList.add("show");};});
    }

    function handleDomainSitemapsEdit(key) {
        const record = loadedDomainSitemaps.find(r => `${r.providerName}/${r.domainName}` === key);
        if (!record) return;
        currentEditingId = key;
        getEl("domain-sitemaps-provider").value = record.providerName || "";
        getEl("domain-sitemaps-domain").value = record.domainName || "";
        getEl("domain-sitemaps-meta-title").value = record.metaDomainPageTitle || "";
        getEl("domain-sitemaps-meta-description").value = record.metaDomainPageDescription || "";
        getEl("domain-sitemaps-overview").value = record.deaOverview || "";
        getEl("domain-sitemaps-about").value = record.aboutDea || "";
        getEl("domain-sitemaps-discovered").value = record.howDeaDiscovered || "";
        getEl("domain-sitemaps-url").value = record.publishedUrl || "";
        getEl("domain-sitemaps-id").value = key;
        getEl("domain-sitemaps-provider-hidden").value = record.providerName;
        updateCharCountsForDomainSitemaps();
        if (domainSitemapsModal) domainSitemapsModal.classList.add("active");
    }

    function handleDomainSitemapsDelete(key) {
        currentDeletingId = key;
        if (domainSitemapsDeleteModal) domainSitemapsDeleteModal.classList.add("is-active");
    }

    function closeDomainSitemapsDeleteModal() {
        if (domainSitemapsDeleteModal) {
            domainSitemapsDeleteModal.classList.add("is-exiting");
            setTimeout(() => {domainSitemapsDeleteModal.classList.remove("is-active", "is-exiting"); currentDeletingId = null;}, 300);
        }
    }

    function updateCharCountsForDomainSitemaps() {
        const titleInput = getEl("domain-sitemaps-meta-title");
        const descInput = getEl("domain-sitemaps-meta-description");
        if (titleInput) getEl("domain-sitemaps-meta-title-count").textContent = titleInput.value.length;
        if (descInput) getEl("domain-sitemaps-meta-description-count").textContent = descInput.value.length;
    }

    // --- DOMAIN DESCRIPTIONS FUNCTIONS ---
    async function loadDomainDescriptions(page = 1) {
        showLoading();
        try {
            const result = await apiFetch(`/programmatic-seo/disposable-domain-descriptions?page=${page}&limit=${currentLimit}`);
            if (!result || result.message === "error") throw new Error(result?.description || "Failed to fetch records.");
            hideLoading();
            loadedDomainDescriptions = result.data.data || [];
            renderDomainDescriptionsTable(loadedDomainDescriptions);
            renderPagination(result.data.pagination);
            const activeTabContent = getEl("domain-descriptions-content");
            if (activeTabContent) { activeTabContent.style.display = "block"; activeTabContent.classList.add("active"); }
            if (paginationContainer) paginationContainer.style.display = "flex";
        } catch (error) { renderSectionError(error.message, () => loadDomainDescriptions(page)); }
    }

    function renderDomainDescriptionsTable(descriptions) {
        const tbody = getEl("domain-descriptions-tbody");
        if (!tbody) return;

        if (descriptions.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px; color: #737373;">No domain descriptions found.</td></tr>`;
            return;
        }

        tbody.innerHTML = descriptions.map(d => `<tr><td style="white-space: nowrap;">${d.domain || '-'}</td><td>${d.deaOverview ? d.deaOverview.substring(0, 40) + (d.deaOverview.length > 40 ? '...' : '') : '-'}</td><td>${d.aboutDea ? d.aboutDea.substring(0, 40) + (d.aboutDea.length > 40 ? '...' : '') : '-'}</td><td>${d.howDeaDiscovered ? d.howDeaDiscovered.substring(0, 40) + (d.howDeaDiscovered.length > 40 ? '...' : '') : '-'}</td><td class="text-left"><div class="action-btn-container"><button class="action-btn" data-domain="${d.domain}"><img src="/assets/icons/more-vert.svg" alt="More" /></button><div class="action-dropdown" id="dd-dropdown-${d.domain}"><button class="dropdown-item-edit" data-domain="${d.domain}"><img src="/assets/icons/edit-outline.svg" alt="" /><span>Edit</span></button><div class="dropdown-divider"></div><button class="dropdown-item-remove" data-domain="${d.domain}"><img src="/assets/icons/delete.svg" alt="" /><span>Remove</span></button></div></div></td></tr>`).join("");
        document.querySelectorAll("#domain-descriptions-content .dropdown-item-edit").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleDomainDescriptionsEdit(btn.dataset.domain); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#domain-descriptions-content .dropdown-item-remove").forEach(btn => {btn.onclick = (e) => {e.preventDefault(); handleDomainDescriptionsDelete(btn.dataset.domain); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show"));};});
        document.querySelectorAll("#domain-descriptions-content .action-btn").forEach(btn => {btn.onclick = (e) => {e.stopPropagation(); const domain = btn.dataset.domain; const dropdown = document.getElementById(`dd-dropdown-${domain}`); document.querySelectorAll(".action-dropdown.show").forEach(d => d.classList.remove("show")); if (dropdown) dropdown.classList.add("show");};});
    }

    function handleDomainDescriptionsEdit(domain) {
        const record = loadedDomainDescriptions.find(r => r.domain === domain);
        if (!record) return;
        currentEditingId = domain;
        if (domainDescriptionsModalTitle) domainDescriptionsModalTitle.textContent = "Edit Domain Description";
        if (submitDomainDescriptionsBtn) submitDomainDescriptionsBtn.textContent = "Update Record";
        getEl("domain-descriptions-domain").value = record.domain || "";
        getEl("domain-descriptions-domain").readOnly = true;
        getEl("domain-descriptions-overview").value = record.deaOverview || "";
        getEl("domain-descriptions-about").value = record.aboutDea || "";
        getEl("domain-descriptions-discovered").value = record.howDeaDiscovered || "";
        getEl("domain-descriptions-id").value = domain;
        if (domainDescriptionsModal) domainDescriptionsModal.classList.add("active");
    }

    function handleDomainDescriptionsDelete(domain) {
        currentDeletingId = domain;
        if (domainDescriptionsDeleteModal) domainDescriptionsDeleteModal.classList.add("is-active");
    }

    function closeDomainDescriptionsDeleteModal() {
        if (domainDescriptionsDeleteModal) {
            domainDescriptionsDeleteModal.classList.add("is-exiting");
            setTimeout(() => {domainDescriptionsDeleteModal.classList.remove("is-active", "is-exiting"); currentDeletingId = null;}, 300);
        }
    }

    // --- TAB SWITCHING ---
    seoTabButtons.forEach(btn => {
        btn.onclick = () => {
            const tab = btn.dataset.tab;
            console.log('[Tab Clicked]', tab);
            if (tab === currentTab) return;
            seoTabButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            document.querySelectorAll(".tab-content").forEach(c => {c.style.display = "none"; c.classList.remove("active");});
            currentTab = tab;
            currentPage = 1;
            if (tab === "disposables") loadDisposables(currentPage);
            else if (tab === "meta-provider") {
                console.log('[Loading Meta Providers]');
                loadMetaProviders(currentPage);
            }
            else if (tab === "meta-domains") loadMetaDomains(currentPage);
            else if (tab === "provider-descriptions") loadProviderDescriptions(currentPage);
            else if (tab === "domain-descriptions") loadDomainDescriptions(currentPage);
            else if (tab === "provider-features") {
                initializeProviderFeaturesForm();
                loadProviderFeatures(currentPage);
            }
            else if (tab === "provider-sitemaps") {
                loadProviderSitemaps(currentPage);
            }
            else if (tab === "domain-sitemaps") {
                loadDomainSitemaps(currentPage);
            }
        };
    });

    // --- META PROVIDER MODAL LISTENERS ---
    if (addMetaProviderBtn) {
        addMetaProviderBtn.onclick = () => {
            currentEditingId = null;
            metaProviderForm.reset();
            if (metaProviderModalTitle) metaProviderModalTitle.textContent = "Add Meta Provider";
            if (submitMetaProviderBtn) submitMetaProviderBtn.textContent = "Continue";
            const nameField = getEl("meta-provider-name");
            if (nameField) nameField.removeAttribute("readonly");
            updateCharCounts();
            if (metaProviderModal) metaProviderModal.classList.add("active");
        };
    }

    if (closeMetaProviderModal) {
        closeMetaProviderModal.onclick = () => {
            if (metaProviderModal) metaProviderModal.classList.remove("active");
        };
    }

    if (closeMetaProviderDeleteModalBtn) {
        closeMetaProviderDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelMetaProviderDeleteBtn) {
        cancelMetaProviderDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeMetaDomainsDeleteModalBtn) {
        closeMetaDomainsDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelMetaDomainsDeleteBtn) {
        cancelMetaDomainsDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeProviderDescriptionsDeleteModalBtn) {
        closeProviderDescriptionsDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelProviderDescriptionsDeleteBtn) {
        cancelProviderDescriptionsDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeDomainDescriptionsDeleteModalBtn) {
        closeDomainDescriptionsDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelDomainDescriptionsDeleteBtn) {
        cancelDomainDescriptionsDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeProviderFeaturesModal) {
        closeProviderFeaturesModal.onclick = () => {
            if (providerFeaturesModal) providerFeaturesModal.classList.remove("active");
            providerFeaturesForm.reset();
            currentEditingId = null;
        };
    }

    if (closeProviderFeaturesDeleteModalBtn) {
        closeProviderFeaturesDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelProviderFeaturesDeleteBtn) {
        cancelProviderFeaturesDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeProviderSitemapsDeleteModalBtn) {
        closeProviderSitemapsDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelProviderSitemapsDeleteBtn) {
        cancelProviderSitemapsDeleteBtn.onclick = closeDeleteModal;
    }

    if (closeDomainSitemapsDeleteModalBtn) {
        closeDomainSitemapsDeleteModalBtn.onclick = closeDeleteModal;
    }

    if (cancelDomainSitemapsDeleteBtn) {
        cancelDomainSitemapsDeleteBtn.onclick = closeDeleteModal;
    }

    // Character count listeners
    const titleInput = getEl("meta-page-title");
    const descInput = getEl("meta-page-description");

    if (titleInput) {
        titleInput.oninput = updateCharCounts;
    }

    if (descInput) {
        descInput.oninput = updateCharCounts;
    }

    // Delete confirmation
    if (confirmMetaProviderDeleteBtn) {
        confirmMetaProviderDeleteBtn.onclick = async () => {
            if (!currentDeletingId) return;

            const originalHTML = confirmMetaProviderDeleteBtn.innerHTML;
            confirmMetaProviderDeleteBtn.disabled = true;
            confirmMetaProviderDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

            try {
                const result = await apiFetch(`/programmatic-seo/meta-providers/${currentDeletingId}`, {
                    method: "DELETE"
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Meta provider record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeDeleteModal();
                    loadMetaProviders(currentPage);
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
                confirmMetaProviderDeleteBtn.disabled = false;
                confirmMetaProviderDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Form submission
    if (metaProviderForm) {
        metaProviderForm.onsubmit = async (e) => {
            e.preventDefault();

            const provider = getEl("meta-provider-name").value;
            const metaPageTitle = getEl("meta-page-title").value;
            const metaPageDescription = getEl("meta-page-description").value;

            const originalBtnHTML = submitMetaProviderBtn.innerHTML;
            submitMetaProviderBtn.disabled = true;
            submitMetaProviderBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> ${currentEditingId ? 'Updating...' : 'Adding...'}`;

            try {
                const method = currentEditingId ? "PUT" : "POST";
                const endpoint = currentEditingId ? `/programmatic-seo/meta-providers/${currentEditingId}` : "/programmatic-seo/meta-providers";

                const result = await apiFetch(endpoint, {
                    method: method,
                    body: JSON.stringify({
                        provider,
                        metaPageTitle,
                        metaPageDescription
                    })
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (metaProviderModal) metaProviderModal.classList.remove("active");
                    metaProviderForm.reset();

                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: `Meta provider record ${currentEditingId ? 'updated' : 'added'} successfully.`,
                            position: 'topRight'
                        });
                    }

                    loadMetaProviders(currentPage);
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
                submitMetaProviderBtn.disabled = false;
                submitMetaProviderBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // --- META DOMAINS MODAL LISTENERS ---
    if (addMetaDomainBtn) {
        addMetaDomainBtn.onclick = () => {
            currentEditingId = null;
            metaDomainsForm.reset();
            if (metaDomainsModalTitle) metaDomainsModalTitle.textContent = "Add Meta Domain";
            if (submitMetaDomainsBtn) submitMetaDomainsBtn.textContent = "Continue";
            updateMetaDomainsCharCounts();
            if (metaDomainsModal) metaDomainsModal.classList.add("active");
        };
    }

    if (closeMetaDomainsModal) {
        closeMetaDomainsModal.onclick = () => {
            if (metaDomainsModal) metaDomainsModal.classList.remove("active");
        };
    }

    if (closeMetaDomainsDeleteModal) {
        closeMetaDomainsDeleteModal.onclick = closeMetaDomainsDeleteModal;
    }

    if (cancelMetaDomainsDeleteBtn) {
        cancelMetaDomainsDeleteBtn.onclick = closeMetaDomainsDeleteModal;
    }

    // Character count listeners for meta domains
    const metaDomainsTitle = getEl("meta-domains-page-title");
    const metaDomainsDesc = getEl("meta-domains-page-description");

    if (metaDomainsTitle) {
        metaDomainsTitle.oninput = updateMetaDomainsCharCounts;
    }

    if (metaDomainsDesc) {
        metaDomainsDesc.oninput = updateMetaDomainsCharCounts;
    }

    // Delete confirmation for meta domains
    if (confirmMetaDomainsDeleteBtn) {
        confirmMetaDomainsDeleteBtn.onclick = async () => {
            if (!currentDeletingId) return;

            const originalHTML = confirmMetaDomainsDeleteBtn.innerHTML;
            confirmMetaDomainsDeleteBtn.disabled = true;
            confirmMetaDomainsDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

            try {
                const result = await apiFetch(`/programmatic-seo/meta-domains/${currentDeletingId}`, {
                    method: "DELETE"
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Meta domain record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeMetaDomainsDeleteModal();
                    loadMetaDomains(currentPage);
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
                confirmMetaDomainsDeleteBtn.disabled = false;
                confirmMetaDomainsDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Form submission for meta domains
    if (metaDomainsForm) {
        metaDomainsForm.onsubmit = async (e) => {
            e.preventDefault();

            const domain = getEl("meta-domains-name").value;
            const metaDomainPageTitle = getEl("meta-domains-page-title").value;
            const metaDomainPageDescription = getEl("meta-domains-page-description").value;

            const originalBtnHTML = submitMetaDomainsBtn.innerHTML;
            submitMetaDomainsBtn.disabled = true;
            submitMetaDomainsBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> ${currentEditingId ? 'Updating...' : 'Adding...'}`;

            try {
                const method = currentEditingId ? "PUT" : "POST";
                const endpoint = currentEditingId ? `/programmatic-seo/meta-domains/${currentEditingId}` : "/programmatic-seo/meta-domains";

                const result = await apiFetch(endpoint, {
                    method: method,
                    body: JSON.stringify({
                        domain,
                        metaDomainPageTitle,
                        metaDomainPageDescription
                    })
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (metaDomainsModal) metaDomainsModal.classList.remove("active");
                    metaDomainsForm.reset();

                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: `Meta domain record ${currentEditingId ? 'updated' : 'added'} successfully.`,
                            position: 'topRight'
                        });
                    }

                    loadMetaDomains(currentPage);
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
                submitMetaDomainsBtn.disabled = false;
                submitMetaDomainsBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // --- PROVIDER DESCRIPTIONS MODAL LISTENERS ---
    if (addProviderDescriptionBtn) {
        addProviderDescriptionBtn.onclick = () => {
            currentEditingId = null;
            providerDescriptionsForm.reset();
            if (providerDescriptionsModalTitle) providerDescriptionsModalTitle.textContent = "Add Provider Description";
            if (submitProviderDescriptionsBtn) submitProviderDescriptionsBtn.textContent = "Continue";
            const nameField = getEl("provider-descriptions-name");
            if (nameField) nameField.removeAttribute("readonly");
            if (providerDescriptionsModal) providerDescriptionsModal.classList.add("active");
        };
    }

    if (closeProviderDescriptionsModal) {
        closeProviderDescriptionsModal.onclick = () => {
            if (providerDescriptionsModal) providerDescriptionsModal.classList.remove("active");
        };
    }

    if (closeProviderDescriptionsDeleteModal) {
        closeProviderDescriptionsDeleteModal.onclick = closeProviderDescriptionsDeleteModal;
    }

    if (cancelProviderDescriptionsDeleteBtn) {
        cancelProviderDescriptionsDeleteBtn.onclick = closeProviderDescriptionsDeleteModal;
    }

    // Delete confirmation for provider descriptions
    if (confirmProviderDescriptionsDeleteBtn) {
        confirmProviderDescriptionsDeleteBtn.onclick = async () => {
            if (!currentDeletingId) return;

            const originalHTML = confirmProviderDescriptionsDeleteBtn.innerHTML;
            confirmProviderDescriptionsDeleteBtn.disabled = true;
            confirmProviderDescriptionsDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

            try {
                const result = await apiFetch(`/programmatic-seo/provider-descriptions/${currentDeletingId}`, {
                    method: "DELETE"
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Provider description record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeProviderDescriptionsDeleteModal();
                    loadProviderDescriptions(currentPage);
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
                confirmProviderDescriptionsDeleteBtn.disabled = false;
                confirmProviderDescriptionsDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Form submission for provider descriptions
    if (providerDescriptionsForm) {
        providerDescriptionsForm.onsubmit = async (e) => {
            e.preventDefault();

            const provider = getEl("provider-descriptions-name").value;
            const providerDescription = getEl("provider-descriptions-description").value;
            const aboutProvider = getEl("provider-descriptions-about").value;

            const originalBtnHTML = submitProviderDescriptionsBtn.innerHTML;
            submitProviderDescriptionsBtn.disabled = true;
            submitProviderDescriptionsBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> ${currentEditingId ? 'Updating...' : 'Adding...'}`;

            try {
                const method = currentEditingId ? "PUT" : "POST";
                const endpoint = currentEditingId ? `/programmatic-seo/provider-descriptions/${currentEditingId}` : "/programmatic-seo/provider-descriptions";

                const result = await apiFetch(endpoint, {
                    method: method,
                    body: JSON.stringify({
                        provider,
                        providerDescription,
                        aboutProvider
                    })
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (providerDescriptionsModal) providerDescriptionsModal.classList.remove("active");
                    providerDescriptionsForm.reset();

                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: `Provider description record ${currentEditingId ? 'updated' : 'added'} successfully.`,
                            position: 'topRight'
                        });
                    }

                    loadProviderDescriptions(currentPage);
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
                submitProviderDescriptionsBtn.disabled = false;
                submitProviderDescriptionsBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // --- DOMAIN DESCRIPTIONS MODAL LISTENERS ---
    if (addDomainDescriptionBtn) {
        addDomainDescriptionBtn.onclick = () => {
            currentEditingId = null;
            domainDescriptionsForm.reset();
            if (domainDescriptionsModalTitle) domainDescriptionsModalTitle.textContent = "Add Domain Description";
            if (submitDomainDescriptionsBtn) submitDomainDescriptionsBtn.textContent = "Continue";
            getEl("domain-descriptions-domain").readOnly = false;
            if (domainDescriptionsModal) domainDescriptionsModal.classList.add("active");
        };
    }

    if (closeDomainDescriptionsModal) {
        closeDomainDescriptionsModal.onclick = () => {
            if (domainDescriptionsModal) domainDescriptionsModal.classList.remove("active");
        };
    }

    if (closeDomainDescriptionsDeleteModal) {
        closeDomainDescriptionsDeleteModal.onclick = closeDomainDescriptionsDeleteModal;
    }

    if (cancelDomainDescriptionsDeleteBtn) {
        cancelDomainDescriptionsDeleteBtn.onclick = closeDomainDescriptionsDeleteModal;
    }

    // --- PROVIDER FEATURES MODAL LISTENERS ---
    // --- PROVIDER SITE MAPS MODAL LISTENERS ---
    if (closeProviderSitemapsModal) {
        closeProviderSitemapsModal.onclick = () => {
            if (providerSitemapsModal) providerSitemapsModal.classList.remove("active");
        };
    }

    if (closeProviderSitemapsDeleteModal) {
        closeProviderSitemapsDeleteModal.onclick = closeProviderSitemapsDeleteModal;
    }

    if (cancelProviderSitemapsDeleteBtn) {
        cancelProviderSitemapsDeleteBtn.onclick = closeProviderSitemapsDeleteModal;
    }

    const metaTitleSitemaps = getEl("provider-sitemaps-meta-title");
    if (metaTitleSitemaps) metaTitleSitemaps.oninput = updateCharCountsForSitemaps;
    const metaDescSitemaps = getEl("provider-sitemaps-meta-description");
    if (metaDescSitemaps) metaDescSitemaps.oninput = updateCharCountsForSitemaps;

    // Provider Features delete modal handlers
    if (confirmProviderFeaturesDeleteBtn) {
        confirmProviderFeaturesDeleteBtn.onclick = async () => {
            if (!currentDeletingId) return;

            const originalHTML = confirmProviderFeaturesDeleteBtn.innerHTML;
            confirmProviderFeaturesDeleteBtn.disabled = true;
            confirmProviderFeaturesDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;

            try {
                const result = await apiFetch(`/programmatic-seo/provider-features/${currentDeletingId}`, {
                    method: "DELETE"
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Provider features record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeProviderFeaturesDeleteModal();
                    loadProviderFeatures(currentPage);
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
                confirmProviderFeaturesDeleteBtn.disabled = false;
                confirmProviderFeaturesDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    if (cancelProviderFeaturesDeleteBtn) {
        cancelProviderFeaturesDeleteBtn.onclick = closeProviderFeaturesDeleteModal;
    }

    // --- DOMAIN SITE MAPS MODAL LISTENERS ---
    if (closeDomainSitemapsModal) {
        closeDomainSitemapsModal.onclick = () => {
            if (domainSitemapsModal) domainSitemapsModal.classList.remove("active");
        };
    }

    if (closeDomainSitemapsDeleteModal) {
        closeDomainSitemapsDeleteModal.onclick = closeDomainSitemapsDeleteModal;
    }

    if (cancelDomainSitemapsDeleteBtn) {
        cancelDomainSitemapsDeleteBtn.onclick = closeDomainSitemapsDeleteModal;
    }

    const metaTitleDomainSitemaps = getEl("domain-sitemaps-meta-title");
    if (metaTitleDomainSitemaps) metaTitleDomainSitemaps.oninput = updateCharCountsForDomainSitemaps;
    const metaDescDomainSitemaps = getEl("domain-sitemaps-meta-description");
    if (metaDescDomainSitemaps) metaDescDomainSitemaps.oninput = updateCharCountsForDomainSitemaps;

    // Form submission for domain descriptions
    if (domainDescriptionsForm) {
        domainDescriptionsForm.onsubmit = async (e) => {
            e.preventDefault();
            const domain = getEl("domain-descriptions-domain").value;
            const deaOverview = getEl("domain-descriptions-overview").value;
            const aboutDea = getEl("domain-descriptions-about").value;
            const howDeaDiscovered = getEl("domain-descriptions-discovered").value;
            const originalBtnHTML = submitDomainDescriptionsBtn.innerHTML;
            submitDomainDescriptionsBtn.disabled = true;
            submitDomainDescriptionsBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> ${currentEditingId ? 'Updating...' : 'Adding...'}`;
            try {
                const method = currentEditingId ? "PUT" : "POST";
                const endpoint = currentEditingId ? `/programmatic-seo/disposable-domain-descriptions/${currentEditingId}` : "/programmatic-seo/disposable-domain-descriptions";
                const body = {domain, deaOverview, aboutDea, howDeaDiscovered};
                const result = await apiFetch(endpoint, {
                    method: method,
                    body: JSON.stringify(body)
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (domainDescriptionsModal) domainDescriptionsModal.classList.remove("active");
                    domainDescriptionsForm.reset();
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: `Record ${currentEditingId ? 'updated' : 'added'} successfully.`,
                            position: 'topRight'
                        });
                    }
                    loadDomainDescriptions(currentPage);
                } else {
                    const desc = result?.description || `Failed to ${currentEditingId ? 'update' : 'add'} record.`;
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({title: 'Error', message: desc, position: 'topRight'});
                    }
                }
            } catch (error) {
                console.error('[Form Submission Error]:', {
                    message: error.message,
                    stack: error.stack,
                    error: error
                });
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({title: 'Network Error', message: error.message, position: 'topRight'});
                }
            } finally {
                submitDomainDescriptionsBtn.disabled = false;
                submitDomainDescriptionsBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // Delete confirmation for domain descriptions
    if (confirmDomainDescriptionsDeleteBtn) {
        confirmDomainDescriptionsDeleteBtn.onclick = async () => {
            const originalHTML = confirmDomainDescriptionsDeleteBtn.innerHTML;
            confirmDomainDescriptionsDeleteBtn.disabled = true;
            confirmDomainDescriptionsDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;
            try {
                const result = await apiFetch(`/programmatic-seo/disposable-domain-descriptions/${currentDeletingId}`, {
                    method: "DELETE"
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeDomainDescriptionsDeleteModal();
                    loadDomainDescriptions(currentPage);
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
                confirmDomainDescriptionsDeleteBtn.disabled = false;
                confirmDomainDescriptionsDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Form submission for domain site maps
    if (domainSitemapsForm) {
        domainSitemapsForm.onsubmit = async (e) => {
            e.preventDefault();
            const [providerName, domainName] = currentEditingId.split('/');
            const metaDomainPageTitle = getEl("domain-sitemaps-meta-title").value;
            const metaDomainPageDescription = getEl("domain-sitemaps-meta-description").value;
            const deaOverview = getEl("domain-sitemaps-overview").value;
            const aboutDea = getEl("domain-sitemaps-about").value;
            const howDeaDiscovered = getEl("domain-sitemaps-discovered").value;
            const publishedUrl = getEl("domain-sitemaps-url").value;
            const originalBtnHTML = submitDomainSitemapsBtn.innerHTML;
            submitDomainSitemapsBtn.disabled = true;
            submitDomainSitemapsBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Updating...`;
            try {
                const result = await apiFetch(`/programmatic-seo/domain-sitemaps/${providerName}/${domainName}`, {
                    method: "PUT",
                    body: JSON.stringify({metaDomainPageTitle, metaDomainPageDescription, deaOverview, aboutDea, howDeaDiscovered, publishedUrl})
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (domainSitemapsModal) domainSitemapsModal.classList.remove("active");
                    domainSitemapsForm.reset();
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: 'Record updated successfully.',
                            position: 'topRight'
                        });
                    }
                    loadDomainSitemaps(currentPage);
                } else {
                    const desc = result?.description || "Failed to update record.";
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({title: 'Error', message: desc, position: 'topRight'});
                    }
                }
            } catch (error) {
                console.error('[Form Submission Error]:', {
                    message: error.message,
                    stack: error.stack,
                    error: error
                });
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({title: 'Network Error', message: error.message, position: 'topRight'});
                }
            } finally {
                submitDomainSitemapsBtn.disabled = false;
                submitDomainSitemapsBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // Delete confirmation for domain site maps
    if (confirmDomainSitemapsDeleteBtn) {
        confirmDomainSitemapsDeleteBtn.onclick = async () => {
            const [providerName, domainName] = currentDeletingId.split('/');
            const originalHTML = confirmDomainSitemapsDeleteBtn.innerHTML;
            confirmDomainSitemapsDeleteBtn.disabled = true;
            confirmDomainSitemapsDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;
            try {
                const result = await apiFetch(`/programmatic-seo/domain-sitemaps/${providerName}/${domainName}`, {
                    method: "DELETE"
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeDomainSitemapsDeleteModal();
                    loadDomainSitemaps(currentPage);
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
                confirmDomainSitemapsDeleteBtn.disabled = false;
                confirmDomainSitemapsDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Form submission for provider site maps
    if (providerSitemapsForm) {
        providerSitemapsForm.onsubmit = async (e) => {
            e.preventDefault();
            const metaProviderPageTitle = getEl("provider-sitemaps-meta-title").value;
            const metaProviderPageDescription = getEl("provider-sitemaps-meta-description").value;
            const providerDescription = getEl("provider-sitemaps-description").value;
            const aboutProvider = getEl("provider-sitemaps-about").value;
            const publishedUrl = getEl("provider-sitemaps-url").value;
            const originalBtnHTML = submitProviderSitemapsBtn.innerHTML;
            submitProviderSitemapsBtn.disabled = true;
            submitProviderSitemapsBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Updating...`;
            try {
                const result = await apiFetch(`/programmatic-seo/provider-sitemaps/${currentEditingId}`, {
                    method: "PUT",
                    body: JSON.stringify({metaProviderPageTitle, metaProviderPageDescription, providerDescription, aboutProvider, publishedUrl})
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (providerSitemapsModal) providerSitemapsModal.classList.remove("active");
                    providerSitemapsForm.reset();
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: 'Record updated successfully.',
                            position: 'topRight'
                        });
                    }
                    loadProviderSitemaps(currentPage);
                } else {
                    const desc = result?.description || "Failed to update record.";
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({title: 'Error', message: desc, position: 'topRight'});
                    }
                }
            } catch (error) {
                console.error('[Form Submission Error]:', {
                    message: error.message,
                    stack: error.stack,
                    error: error
                });
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({title: 'Network Error', message: error.message, position: 'topRight'});
                }
            } finally {
                submitProviderSitemapsBtn.disabled = false;
                submitProviderSitemapsBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // Provider features form submission
    if (providerFeaturesForm) {
        // Populate dropdown options on form initialization
        const populateProviderFeaturesSelects = () => {
            const fields = [
                { id: "provider-features-registration-required", key: "registrationRequired" },
                { id: "provider-features-public-inbox", key: "publicInbox" },
                { id: "provider-features-email-retention", key: "emailRetention" },
                { id: "provider-features-paid-plans", key: "paidPlans" },
                { id: "provider-features-domain-rotation", key: "domainRotation" },
                { id: "provider-features-api-available", key: "apiAvailable" },
                { id: "provider-features-mobile-app", key: "mobileApp" },
                { id: "provider-features-publish-provider-sitemap", key: "publishProviderSitemap" },
                { id: "provider-features-publish-domain-sitemap", key: "publishDomainSitemap" }
            ];

            fields.forEach(field => {
                const select = getEl(field.id);
                if (!select) return;
                const options = getEnumOptions(field.key);
                select.innerHTML = options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("");
            });
        };

        populateProviderFeaturesSelects();

        providerFeaturesForm.onsubmit = async (e) => {
            e.preventDefault();
            const registrationRequired = getEl("provider-features-registration-required").value;
            const publicInbox = getEl("provider-features-public-inbox").value;
            const emailRetention = getEl("provider-features-email-retention").value;
            const paidPlans = getEl("provider-features-paid-plans").value;
            const domainRotation = getEl("provider-features-domain-rotation").value;
            const apiAvailable = getEl("provider-features-api-available").value;
            const mobileApp = getEl("provider-features-mobile-app").value;
            const publishProviderSitemap = getEl("provider-features-publish-provider-sitemap").value;
            const publishDomainSitemap = getEl("provider-features-publish-domain-sitemap").value;

            const originalBtnHTML = submitProviderFeaturesBtn.innerHTML;
            submitProviderFeaturesBtn.disabled = true;
            submitProviderFeaturesBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Updating...`;

            try {
                const result = await apiFetch(`/programmatic-seo/provider-features/${currentEditingId}`, {
                    method: "PUT",
                    body: JSON.stringify({
                        registrationRequired,
                        publicInbox,
                        emailRetention,
                        paidPlans,
                        domainRotation,
                        apiAvailable,
                        mobileApp,
                        publishProviderSitemap,
                        publishDomainSitemap
                    })
                });

                if (result?.message === "success" || result?.message === "Success") {
                    if (providerFeaturesModal) providerFeaturesModal.classList.remove("active");
                    providerFeaturesForm.reset();
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Success',
                            message: 'Provider features updated successfully.',
                            position: 'topRight'
                        });
                    }
                    loadProviderFeatures(currentPage);
                } else {
                    const desc = result?.description || "Failed to update record.";
                    if (typeof iziToast !== 'undefined') {
                        iziToast.error({title: 'Error', message: desc, position: 'topRight'});
                    }
                }
            } catch (error) {
                console.error('[Form Submission Error]:', {
                    message: error.message,
                    stack: error.stack,
                    error: error
                });
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({title: 'Network Error', message: error.message, position: 'topRight'});
                }
            } finally {
                submitProviderFeaturesBtn.disabled = false;
                submitProviderFeaturesBtn.innerHTML = originalBtnHTML;
            }
        };
    }

    // Delete confirmation for provider site maps
    if (confirmProviderSitemapsDeleteBtn) {
        confirmProviderSitemapsDeleteBtn.onclick = async () => {
            const originalHTML = confirmProviderSitemapsDeleteBtn.innerHTML;
            confirmProviderSitemapsDeleteBtn.disabled = true;
            confirmProviderSitemapsDeleteBtn.innerHTML = `<span class="stopreg-btn-spinner"></span> Removing...`;
            try {
                const result = await apiFetch(`/programmatic-seo/provider-sitemaps/${currentDeletingId}`, {
                    method: "DELETE"
                });
                if (result?.message === "success" || result?.message === "Success") {
                    if (typeof iziToast !== 'undefined') {
                        iziToast.success({
                            title: 'Removed',
                            message: 'Record deleted successfully.',
                            position: 'topRight'
                        });
                    }
                    closeProviderSitemapsDeleteModal();
                    loadProviderSitemaps(currentPage);
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
                confirmProviderSitemapsDeleteBtn.disabled = false;
                confirmProviderSitemapsDeleteBtn.innerHTML = originalHTML;
            }
        };
    }

    // Modal background clicks
    window.addEventListener("click", (e) => {
        if (e.target === metaProviderModal) {
            if (metaProviderModal) metaProviderModal.classList.remove("active");
        }
        if (e.target === metaProviderDeleteModal) {
            closeDeleteModal();
        }
        if (e.target === metaDomainsModal) {
            if (metaDomainsModal) metaDomainsModal.classList.remove("active");
        }
        if (e.target === metaDomainsDeleteModal) {
            closeMetaDomainsDeleteModal();
        }
        if (e.target === providerDescriptionsModal) {
            if (providerDescriptionsModal) providerDescriptionsModal.classList.remove("active");
        }
        if (e.target === providerDescriptionsDeleteModal) {
            closeProviderDescriptionsDeleteModal();
        }
        if (e.target === domainDescriptionsModal) {
            if (domainDescriptionsModal) domainDescriptionsModal.classList.remove("active");
        }
        if (e.target === domainDescriptionsDeleteModal) {
            closeDomainDescriptionsDeleteModal();
        }
        if (e.target === providerSitemapsModal) {
            if (providerSitemapsModal) providerSitemapsModal.classList.remove("active");
        }
        if (e.target === providerSitemapsDeleteModal) {
            closeProviderSitemapsDeleteModal();
        }
        if (e.target === domainSitemapsModal) {
            if (domainSitemapsModal) domainSitemapsModal.classList.remove("active");
        }
        if (e.target === domainSitemapsDeleteModal) {
            closeDomainSitemapsDeleteModal();
        }
    });

    // --- INITIAL LOAD ---
    loadDisposables(currentPage);
});

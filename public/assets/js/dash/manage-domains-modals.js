document.addEventListener('DOMContentLoaded', () => {
    // Modal Overlays
    const blockOverlay = document.getElementById('block-domain-modal-overlay');
    const reportOverlay = document.getElementById('report-domain-modal-overlay');
    const allowOverlay = document.getElementById('allow-domain-modal-overlay');

    // Forms
    const blockForm = document.getElementById('block-domain-form');
    const reportForm = document.getElementById('report-domain-form');
    const allowForm = document.getElementById('allow-domain-form');

    // Buttons that open modals
    const openBlockBtn = document.getElementById('open-block-modal');
    const openAllowBtn = document.getElementById('open-allow-modal');
    const openReportBtn = document.getElementById('open-report-modal');

    let currentEditId = null;

    let isFreePlan = false;
    try {
        const planName = localStorage.getItem("planName");
        if (planName && planName.trim().toLowerCase() === "free") {
            isFreePlan = true;
            document.body.classList.add('free-tier-user');
        
            const style = document.createElement('style');
            style.innerHTML = `
                body.free-tier-user .btn-block,
                body.free-tier-user .btn-allow {
                    opacity: 0.4 !important;
                    cursor: not-allowed !important;
                }
                body.free-tier-user .btn-block img,
                body.free-tier-user .btn-allow img {
                    filter: grayscale(1) brightness(0.7);
                }
            `;
            document.head.appendChild(style);
        }
    } catch (e) {
        console.warn("Could not parse planName", e);
    }

    if (isFreePlan) {
        if (openBlockBtn) openBlockBtn.style.opacity = "0.6";
        if (openAllowBtn) openAllowBtn.style.opacity = "0.6";
    }

    function showUpgradeToast() {
        if (typeof iziToast !== 'undefined') {
            iziToast.info({
                title: 'Upgrade Required',
                message: 'Custom blocklists and allowlists are available on Paid plans. You can still Report domains.',
                position: 'topRight',
                timeout: 5000
            });
        }
    }

    // --- Core Modal Functions ---
    function openModal(overlay, isEdit = false, data = null) {
        if (!overlay) return;
        
        overlay.classList.add('is-active');
        overlay.classList.remove('is-exiting');

        const titleEl = overlay.querySelector('.add-seats-title');
        const submitBtn = overlay.querySelector('button[type="submit"]');
        const domainInput = overlay.querySelector('input[type="text"]'); 
        const commentInput = overlay.querySelector('textarea');

        if (!isEdit) {
            // Reset for NEW entries
            if (titleEl) {
                 if (overlay === blockOverlay) titleEl.textContent = 'Block a Domain';
                 if (overlay === allowOverlay) titleEl.textContent = 'Allow a Domain';
                 if (overlay === reportOverlay) titleEl.textContent = 'Report a Domain';
            }
            if (submitBtn) {
                 if (overlay === blockOverlay) submitBtn.textContent = 'Block';
                 if (overlay === allowOverlay) submitBtn.textContent = 'Continue';
                 if (overlay === reportOverlay) submitBtn.textContent = 'Report';
            }
            if (domainInput) {
                domainInput.value = '';
                domainInput.removeAttribute('readonly');
                domainInput.style.backgroundColor = '';
                setTimeout(() => domainInput.focus(), 100);
            }
            if (commentInput) commentInput.value = '';
        } else {
             // Setup for Edit
             if (titleEl) {
                if (overlay === blockOverlay) titleEl.textContent = 'Update Blocked Domain';
                if (overlay === allowOverlay) titleEl.textContent = 'Update Allowed Domain';
                if (overlay === reportOverlay) titleEl.textContent = 'Update Reported Domain';
             }
             if (submitBtn) submitBtn.textContent = 'Update';
             
             if (data) {
                 if (domainInput) domainInput.value = data.domain || '';
                 if (commentInput) commentInput.value = data.comment || '';
             }
             if (domainInput) setTimeout(() => domainInput.focus(), 100);
        }
    }

    function closeModal(overlay) {
        if (!overlay) return;
        overlay.classList.add('is-exiting');
        overlay.classList.remove('is-active');
        
        setTimeout(() => {
             const form = overlay.querySelector('form');
             if(form) form.reset();
             overlay.classList.remove('is-exiting');
             currentEditId = null;
        }, 300);
    }

    // --- Trigger Listeners ---
    openBlockBtn?.addEventListener('click', (e) => {
        if (isFreePlan) {
            e.preventDefault();
            return showUpgradeToast();
        }
        openModal(blockOverlay);
    });
    
    openAllowBtn?.addEventListener('click', (e) => {
        if (isFreePlan) {
            e.preventDefault();
            return showUpgradeToast();
        }
        openModal(allowOverlay);
    });

    openReportBtn?.addEventListener('click', () => openModal(reportOverlay));

    const ManageDomainStatus = {
        BLOCKED: 'blocked',
        ALLOWED: 'allowed',
        ALLOW: 'allow',
        REPORTED: 'reported'
    };

    // Event Delegation for Edit Buttons
    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.edit-action-btn');
        if (btn) {
            const { id, domain, status, comment } = btn.dataset;
            currentEditId = id;
            
            // Determine which modal to show
            let targetOverlay = null;
            let normalizedStatus = status.toLowerCase();
            if (normalizedStatus === ManageDomainStatus.BLOCKED) targetOverlay = blockOverlay;
            else if (normalizedStatus === ManageDomainStatus.ALLOWED || normalizedStatus === ManageDomainStatus.ALLOW) targetOverlay = allowOverlay;
            else if (normalizedStatus === ManageDomainStatus.REPORTED) targetOverlay = reportOverlay;
            else targetOverlay = blockOverlay; // Fallback

            if (isFreePlan && (targetOverlay === blockOverlay || targetOverlay === allowOverlay)) {
                e.preventDefault();
                return showUpgradeToast();
            }

            openModal(targetOverlay, true, { domain, comment });
        }
    });

    // --- Close Listeners ---
    document.getElementById('close-block-modal')?.addEventListener('click', () => closeModal(blockOverlay));
    document.getElementById('close-report-modal')?.addEventListener('click', () => closeModal(reportOverlay));
    document.getElementById('report-bottom-close')?.addEventListener('click', () => closeModal(reportOverlay));
    document.getElementById('close-allow-modal')?.addEventListener('click', () => closeModal(allowOverlay));
    document.getElementById('allow-bottom-close')?.addEventListener('click', () => closeModal(allowOverlay));

    // --- Overlay Click ---
    [blockOverlay, reportOverlay, allowOverlay].forEach(overlay => {
        if(overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay);
            });
        }
    });

    // --- Escape Key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [blockOverlay, reportOverlay, allowOverlay].forEach(closeModal);
        }
    });

    // --- API & Submit Handler ---
    const handleDomainFormSubmit = async (e, modalOverlay, form, type) => {
        e.preventDefault();
        const isUpdate = currentEditId !== null;
        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        const token = localStorage.getItem("authToken");
        
        if (!token) {
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "You are not logged in.", position: "topRight" });
            return;
        }

        const domainInput = form.querySelector('input[type="text"]');
        const commentInput = form.querySelector('textarea');

        const domain = domainInput?.value.trim();
        const comment = commentInput?.value.trim() || "";

        if (!domain) {
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "Domain name is required", position: "topRight" });
            return;
        }

        const payload = {
            domain: domain,
            comment: comment,
            status: type
        };
        
        // UI Loading
        btn.disabled = true;
        btn.innerHTML = `<span class="stopreg-btn-spinner" style="width:16px; height:16px; border-width:2px; vertical-align: middle;"></span> Processing...`;
        
        try {
            const baseUrl = "https://api.stopreg.com/api/v1/manage/domain";
            const url = isUpdate ? `${baseUrl}/update?domainId=${currentEditId}` : `${baseUrl}/add`;
            const method = isUpdate ? "PATCH" : "POST";

            const response = await fetch(url, {
                method: method,
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (window.handleAuthError && await window.handleAuthError(response)) {
                return;
            }

            if (response.ok) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({ message: data.description || `Domain ${isUpdate ? 'updated' : type} successfully!`, position: "topRight" });
                }
                closeModal(modalOverlay);
                
                // Refresh manage-domains tables
                if (typeof window.fetchDomains === 'function') {
                    if (isUpdate) {
                         ['blocked', 'allowed', 'reported'].forEach(s => window.fetchDomains(s, 1, 10));
                    } else {
                        window.fetchDomains(type, 1, 10);
                    }
                } else {
                    setTimeout(() => window.location.reload(), 1000);
                }
                
            } else {
                 if (typeof iziToast !== 'undefined') {
                    iziToast.error({ message: data.description || data.message || `Failed to ${isUpdate ? 'update' : type} domain`, position: "topRight" });
                }
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            if (window.handleAuthError && await window.handleAuthError(err)) {
                return;
            }
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "Network error, occurred", position: "topRight" });
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };

    // Attach Submit Listeners
    blockForm?.addEventListener('submit', (e) => handleDomainFormSubmit(e, blockOverlay, blockForm, 'blocked'));
    allowForm?.addEventListener('submit', (e) => handleDomainFormSubmit(e, allowOverlay, allowForm, 'allowed'));
    reportForm?.addEventListener('submit', (e) => handleDomainFormSubmit(e, reportOverlay, reportForm, 'reported'));
});

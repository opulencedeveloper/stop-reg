document.addEventListener('DOMContentLoaded', async () => {
    // Modal Overlays
    const blockOverlay = document.getElementById('block-domain-modal-overlay');
    const reportOverlay = document.getElementById('report-domain-modal-overlay');
    const allowOverlay = document.getElementById('allow-domain-modal-overlay');
    const settingsOverlay = document.getElementById('settings-modal-overlay');

    // Forms
    const blockForm = document.getElementById('block-domain-form');
    const reportForm = document.getElementById('report-domain-form');
    const allowForm = document.getElementById('allow-domain-form');
    const settingsForm = document.getElementById('settings-form');

    // Buttons that open modals
    const openBlockBtn = document.getElementById('open-block-modal');
    const openAllowBtn = document.getElementById('open-allow-modal');
    const openReportBtn = document.getElementById('open-report-modal');
    const openSettingsBtn = document.getElementById('open-settings-modal');

    let currentEditId = null;

    let isFreePlan = false;
    try {
        const planName = await window.getUserPlan();
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
                    opacity: 0.8;
                }
            `;
            document.head.appendChild(style);
        }
    } catch (e) {
        console.warn("Could not parse planName", e);
    }

    if (isFreePlan) {
        [openBlockBtn, openAllowBtn, openSettingsBtn].forEach(btn => {
            if (btn) btn.style.opacity = "0.6";
        });
    }

    function showUpgradeToast() {
        if (typeof iziToast !== 'undefined') {
            iziToast.info({
                title: 'Upgrade Required',
                message: 'Domain management features (Blocking, Allowing, Reporting, and Settings) are available on Paid plans.',
                position: 'topRight',
                timeout: 5000
            });
        }
    }
    window.showUpgradeToast = showUpgradeToast;

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

    openReportBtn?.addEventListener('click', (e) => {
        // Reporting is free for everyone
        openModal(reportOverlay);
    });

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

            if (isFreePlan && normalizedStatus !== ManageDomainStatus.REPORTED) {
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
    document.getElementById('close-settings-modal')?.addEventListener('click', () => closeModal(settingsOverlay));

    // --- Overlay Click ---
    [blockOverlay, reportOverlay, allowOverlay, settingsOverlay].forEach(overlay => {
        if(overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal(overlay);
            });
        }
    });

    // --- Escape Key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            [blockOverlay, reportOverlay, allowOverlay, settingsOverlay].forEach(closeModal);
        }
    });

    // --- API & Submit Handler ---
    const handleDomainFormSubmit = async (e, modalOverlay, form, type) => {
        e.preventDefault();
        const isUpdate = currentEditId !== null;
        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        const token = localStorage.getItem("authToken");
        
        // Plan Check for Submit (Reporting is FREE)
        if (type !== 'reported') {
            try {
                const planName = await window.getUserPlan();
                if (planName && planName.trim().toLowerCase() === "free") {
                    if (typeof showUpgradeToast === 'function') showUpgradeToast();
                    btn.disabled = false;
                    btn.innerHTML = originalText;
                    return;
                }
            } catch (err) {
                console.warn("Plan check failed on submit", err);
            }
        }

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

    // --- Settings Modal Logic ---
    const radioOptions = settingsOverlay?.querySelectorAll('.radio-option');
    const detectionActionInput = document.getElementById('detection-action');
    const headerThreshold = document.getElementById('ruleThreshold');
    const headerWindow = document.getElementById('windowDays');
    const actionDesc = document.getElementById('ruleActionDesc');

    async function fetchAbuseSettings() {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        try {
            const response = await fetch("https://api.stopreg.com/api/v1/manage/domain/settings", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const { data } = await response.json();
            
            if (data) {
                // Populate threshold
                const thresholdValue = data.ruleThreshold;
                const thresholdWrapper = document.querySelector('[data-custom-select="rule-threshold"]');
                if (thresholdWrapper) {
                    const hiddenInput = thresholdWrapper.querySelector('input[type="hidden"]');
                    const triggerSpan = thresholdWrapper.querySelector('.current-value');
                    const options = thresholdWrapper.querySelectorAll('.custom-option');
                    
                    if (hiddenInput) hiddenInput.value = thresholdValue || 5;
                    if (triggerSpan) triggerSpan.textContent = thresholdValue || 'Select threshold';
                    
                    options.forEach(opt => {
                        const isSelected = thresholdValue && opt.dataset.value == thresholdValue;
                        opt.classList.toggle('is-selected', !!isSelected);
                    });
                }

                // Populate window
                const windowDays = data.windowDays;
                const windowValue = windowDays ? (windowDays === 1 ? '1 day' : `${windowDays} days`) : '';
                const windowWrapper = document.querySelector('[data-custom-select="registrations-window"]');
                
                if (windowWrapper) {
                    const hiddenInput = windowWrapper.querySelector('input[type="hidden"]');
                    const triggerSpan = windowWrapper.querySelector('.current-value');
                    const options = windowWrapper.querySelectorAll('.custom-option');
                    
                    if (hiddenInput) hiddenInput.value = windowValue || '3 days';
                    if (triggerSpan) triggerSpan.textContent = windowValue || 'Select window';
                    
                    options.forEach(opt => {
                        const isSelected = windowValue && opt.dataset.value == windowValue;
                        opt.classList.toggle('is-selected', !!isSelected);
                    });
                }

                // Populate action
                const action = data.action;
                if (detectionActionInput) detectionActionInput.value = action || 'notify';
                
                radioOptions.forEach(opt => {
                    const isActive = action && opt.dataset.value === action;
                    opt.classList.toggle('active', !!isActive);
                    opt.querySelector('.radio-on-icon').style.display = isActive ? 'block' : 'none';
                    opt.querySelector('.radio-off-icon').style.display = isActive ? 'none' : 'block';
                });

                // Populate unblock
                // const unblockSelect = document.getElementById('unblock-after');
                // if (unblockSelect) unblockSelect.value = data.unblockAfterDays !== undefined ? data.unblockAfterDays : 3;

                // --- Update Summary Header ---
                if (headerThreshold) headerThreshold.textContent = data.ruleThreshold || 'Nil';
                if (headerWindow) headerWindow.textContent = data.windowDays ? (data.windowDays === 1 ? '1' : data.windowDays) : 'Nil';
                
                if (actionDesc) {
                    if (!data.action) {
                        actionDesc.textContent = 'Nil';
                    } else {
                        actionDesc.textContent = data.action === 'block' 
                            ? 'Block Domain when threshold is reached' 
                            : 'Notify Only when threshold is reached';
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching settings:", err);
        }
    }

    // Initialize settings on load
    fetchAbuseSettings();

    radioOptions?.forEach(option => {
        option.addEventListener('click', () => {
            radioOptions.forEach(opt => {
                opt.classList.remove('active');
                opt.querySelector('.radio-on-icon').style.display = 'none';
                opt.querySelector('.radio-off-icon').style.display = 'block';
            });
            
            option.classList.add('active');
            option.querySelector('.radio-on-icon').style.display = 'block';
            option.querySelector('.radio-off-icon').style.display = 'none';
            
            if (detectionActionInput) {
                detectionActionInput.value = option.dataset.value;
            }
        });
    });

    openSettingsBtn?.addEventListener('click', (e) => {
        if (isFreePlan) {
            e.preventDefault();
            return showUpgradeToast();
        }
        fetchAbuseSettings();
        openModal(settingsOverlay);
    });

    settingsForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = settingsForm.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        const token = localStorage.getItem("authToken");

        // Plan Check for Settings Submit
        try {
            const planName = await window.getUserPlan();
            if (planName && planName.trim().toLowerCase() === "free") {
                if (typeof showUpgradeToast === 'function') showUpgradeToast();
                return;
            }
        } catch (err) {
            console.warn("Plan check failed on settings submit", err);
        }

        if (!token) {
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "You are not logged in.", position: "topRight" });
            return;
        }

        const ruleThreshold = parseInt(document.getElementById('rule-threshold')?.value);
        const windowDays = parseInt(document.getElementById('registrations-window')?.value);
        // const unblockAfterDays = parseInt(document.getElementById('unblock-after')?.value);
        const action = detectionActionInput?.value;

        btn.disabled = true;
        btn.innerHTML = `<span class="stopreg-btn-spinner" style="width:16px; height:16px; border-width:2px; vertical-align: middle;"></span> Saving...`;
        
        try {
            const response = await fetch("https://api.stopreg.com/api/v1/manage/domain/settings", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    ruleThreshold,
                    windowDays,
                    action,
                    // unblockAfterDays
                })
            });

            if (response.ok) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({ message: "Settings saved successfully!", position: "topRight" });
                }

                // Update summary header immediately without refresh
                if (headerThreshold) headerThreshold.textContent = ruleThreshold;
                if (headerWindow) headerWindow.textContent = windowDays;
                
                /*
                if (headerUnblockPolicy) {
                    if (unblockAfterDays === 0) {
                        headerUnblockPolicy.textContent = "Permanently barred";
                    } else if (unblockAfterDays === 1) {
                        headerUnblockPolicy.textContent = "Unblock domain after 24 hours";
                    } else {
                        headerUnblockPolicy.textContent = `Unblock domain after ${unblockAfterDays} days`;
                    }
                }
                */

                if (actionDesc) {
                    actionDesc.textContent = action === 'block'
                        ? 'Block Domain when threshold is reached'
                        : 'Notify Only when threshold is reached';
                }

                closeModal(settingsOverlay);
            } else {
                throw new Error("Failed to save settings");
            }
        } catch (err) {
            console.error(err);
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "Failed to save settings", position: "topRight" });
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    });

    // --- Custom Select Component Logic ---
    function initCustomSelects() {
        const wrappers = document.querySelectorAll('.settings-select-wrapper[data-custom-select]');
        
        wrappers.forEach(wrapper => {
            const trigger = wrapper.querySelector('.custom-select-trigger');
            const container = wrapper.querySelector('.custom-options-container');
            const options = wrapper.querySelectorAll('.custom-option');
            const hiddenInput = wrapper.querySelector('input[type="hidden"]');
            const triggerText = wrapper.querySelector('.current-value');

            // Toggle dropdown
            trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other open dropdowns
                document.querySelectorAll('.custom-select-trigger.is-open').forEach(openTrigger => {
                    if (openTrigger !== trigger) {
                        openTrigger.classList.remove('is-open');
                        openTrigger.nextElementSibling.classList.remove('is-open');
                    }
                });

                trigger.classList.toggle('is-open');
                container.classList.toggle('is-open');
            });

            // Handle option selection
            options.forEach(option => {
                option.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const value = option.dataset.value;
                    const text = option.textContent;

                    // Update UI
                    triggerText.textContent = text;
                    hiddenInput.value = value;
                    
                    options.forEach(opt => opt.classList.remove('is-selected'));
                    option.classList.add('is-selected');

                    // Close dropdown
                    trigger.classList.remove('is-open');
                    container.classList.remove('is-open');
                });
            });
        });

        // Close dropdowns when clicking outside
        document.addEventListener('click', () => {
            document.querySelectorAll('.custom-select-trigger.is-open').forEach(trigger => {
                trigger.classList.remove('is-open');
                trigger.nextElementSibling.classList.remove('is-open');
            });
        });
    }

    // Initialize custom selects
    initCustomSelects();
});

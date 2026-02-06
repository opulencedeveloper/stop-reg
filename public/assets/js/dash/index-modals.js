document.addEventListener('DOMContentLoaded', () => {
    // Modal Overlays
    const blockOverlay = document.getElementById('block-domain-modal-overlay');
    const reportOverlay = document.getElementById('report-domain-modal-overlay');
    const allowOverlay = document.getElementById('allow-domain-modal-overlay');

    // Forms
    const blockForm = document.getElementById('block-domain-form');
    const reportForm = document.getElementById('report-domain-form');
    const allowForm = document.getElementById('allow-domain-form');

    // Store current working ID and Status
    let currentRequestId = null;
    let currentTargetStatus = null; // 'blocked', 'reported', 'allow'

    // --- Core Modal Functions ---
    function openModal(overlay, domainName = null, comment = null, requestId = null, targetStatus = null) {
        if (!overlay) return;
        
        currentRequestId = requestId;
        currentTargetStatus = targetStatus;

        overlay.classList.add('is-active');
        overlay.classList.remove('is-exiting');

        // Handle Domain Input
        const domainInput = overlay.querySelector('input[type="text"]'); 
        
        if (domainInput) {
            if (domainName) {
                domainInput.value = domainName;
                domainInput.setAttribute('readonly', true);
                domainInput.style.backgroundColor = '#f5f5f5'; 
            } else {
                domainInput.value = '';
                domainInput.removeAttribute('readonly');
                domainInput.style.backgroundColor = '';
            }
        }

        // Handle Comment Input
        const commentInput = overlay.querySelector('textarea');
        if (commentInput) {
            commentInput.value = comment || '';
            // Focus logic
             if (domainName) {
                setTimeout(() => {
                    commentInput.focus();
                }, 100);
            } else if (domainInput) {
                 setTimeout(() => {
                    domainInput.focus();
                }, 100);
            }
        }
    }

    function closeModal(overlay) {
        if (!overlay) return;
        overlay.classList.add('is-exiting');
        overlay.classList.remove('is-active');
        
        // Reset inputs and state
        setTimeout(() => {
             const form = overlay.querySelector('form');
             if(form) form.reset();
             
             // Remove readonly from input
             const domainInput = overlay.querySelector('input[type="text"]');
             if(domainInput) {
                 domainInput.removeAttribute('readonly');
                 domainInput.style.backgroundColor = '';
             }

             // Reset state
             if (!document.querySelector('.is-active')) {
                 currentRequestId = null;
                 currentTargetStatus = null;
             }

            if (overlay.classList.contains('is-exiting')) {
                overlay.classList.remove('is-exiting');
            }
        }, 300);
    }

    function closeAllModals() {
        closeModal(blockOverlay);
        closeModal(reportOverlay);
        closeModal(allowOverlay);
    }

    // --- Event Delegation for Direct Submission (No Modals) ---
    const tableContainer = document.querySelector('.req-table-container');
    const token = localStorage.getItem("authToken");

    async function submitStatusUpdate(requestId, status, btn) {
        if (!token) {
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "You are not logged in.", position: "topRight" });
            return;
        }

        const originalContent = btn.innerHTML;
        const width = btn.offsetWidth;
        btn.style.width = `${width}px`; // Maintain width
        btn.disabled = true;
        btn.innerHTML = `<span class="stopreg-btn-spinner" style="width:16px; height:16px; border-width:2px; vertical-align: middle; border-color: rgba(0,0,0,0.1) !important; border-top-color: #1452CA !important; display: block; margin: 0 auto !important;"></span>`;

        try {
            const url = `http://localhost:8080/api/v1/request/status/update?id=${requestId}`;
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ status: status, comment: "" })
            });

            const data = await response.json();

            if (response.ok) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({ message: "Status updated successfully!", position: "topRight" });
                }
                // Refresh table data
                if (typeof window.fetchRequests === 'function') {
                    window.fetchRequests(); 
                } else if (typeof fetchRequests === 'function') {
                    fetchRequests();
                }
            } else {
                if (typeof iziToast !== 'undefined') {
                    iziToast.error({ message: data.message || "Failed to update status", position: "topRight" });
                }
                btn.innerHTML = originalContent;
                btn.disabled = false;
            }
        } catch (err) {
            console.error(err);
            if (typeof iziToast !== 'undefined') iziToast.error({ message: "Network error occurred", position: "topRight" });
            btn.innerHTML = originalContent;
            btn.disabled = false;
        }
    }

    if (tableContainer) {
        tableContainer.addEventListener('click', (e) => {
            const btn = e.target.closest('.action-btn');
            if (!btn) return;

            e.preventDefault();

            const requestId = btn.dataset.id;
            if (!requestId) return;

            // Detect target status based on button class
            let targetStatus = '';
            if (btn.classList.contains('btn-add-allow')) {
                targetStatus = 'allow';
            } else if (btn.classList.contains('btn-report')) {
                targetStatus = 'reported';
            } else if (btn.classList.contains('btn-add-block')) {
                targetStatus = 'blocked';
            }

            if (targetStatus) {
                submitStatusUpdate(requestId, targetStatus, btn);
            }
        });
    }

    // --- Close Button Listeners (Kept for other potential triggers) ---
    document.getElementById('close-block-modal')?.addEventListener('click', () => closeModal(blockOverlay));
    document.getElementById('close-report-modal')?.addEventListener('click', () => closeModal(reportOverlay));
    document.getElementById('report-bottom-close')?.addEventListener('click', () => closeModal(reportOverlay));
    document.getElementById('close-allow-modal')?.addEventListener('click', () => closeModal(allowOverlay));
    document.getElementById('allow-bottom-close')?.addEventListener('click', () => closeModal(allowOverlay));


    // --- Overlay Click ---
    [blockOverlay, reportOverlay, allowOverlay].forEach(overlay => {
        if(overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    closeModal(overlay);
                }
            });
        }
    });


    // --- Escape Key ---
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
    
    // --- VALIDATION HELPERS ---
    function showInputError(input, message) {
        let parent = input.parentElement;
        let error = parent.querySelector(".custom-input-error");
        if (!error) {
            error = document.createElement("div");
            error.className = "custom-input-error";
            error.style.color = "#FF0000";
            error.style.fontSize = "12px";
            error.style.marginTop = "4px";
            error.style.fontFamily = "Inter_18pt-Regular";
            parent.appendChild(error);
        }
        
        if (error.textContent !== message || error.style.display === 'none') {
            error.textContent = message;
            input.classList.add("input-error-border");
            error.style.animation = 'none';
            error.offsetHeight; 
            error.style.animation = null;
        }
    }

    function clearInputError(input) {
        let parent = input.parentElement;
        const error = parent.querySelector(".custom-input-error");
        if (error) error.remove();
        input.classList.remove("input-error-border");
    }

    function clearAllErrors(form) {
        const inputs = form.querySelectorAll("input, textarea");
        inputs.forEach(input => clearInputError(input));
    }

    // --- API & Submit Handler ---
    const handleFormSubmit = async (e, modalOverlay, form) => {
        const btn = form.querySelector("button[type='submit']");
        const originalText = btn.innerHTML;
        const token = localStorage.getItem("authToken");
        
        if (!token) {
             if (typeof iziToast !== 'undefined') {
                iziToast.error({ message: "You are not logged in.", position: "topRight" });
            }
            return;
        }

        if (!currentRequestId) {
             console.error("No Request ID found for update");
             if (typeof iziToast !== 'undefined') {
                iziToast.error({ message: "System Error: Missing Request ID", position: "topRight" });
            }
            return;
        }

        // Gather Data
        const comment = form.querySelector("textarea")?.value.trim() || "";
        
        const payload = {
            status: currentTargetStatus,
            comment: comment
        };
        
        // UI Loading
        btn.disabled = true;
        btn.innerHTML = `<span class="stopreg-btn-spinner" style="width:16px; height:16px; border-width:2px; vertical-align: middle;"></span> Processing...`;
        
        try {
            const url = `http://localhost:8080/api/v1/request/status/update?id=${currentRequestId}`;
            
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            
            if (response.ok) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        message: "Status updated successfully!",
                        position: "topRight"
                    });
                }
                closeModal(modalOverlay);
                
                // Optional: Refresh table data
                if (typeof window.fetchRequests === 'function') {
                    window.fetchRequests(); // Assuming chart.js exposes this or we reload
                } else {
                     // Fallback: reload page after short delay
                     setTimeout(() => window.location.reload(), 1000);
                }
                
            } else {
                 if (typeof iziToast !== 'undefined') {
                    iziToast.error({
                        message: data.message || "Failed to update status",
                        position: "topRight"
                    });
                }
            }
            
        } catch (err) {
            console.error(err);
             if (typeof iziToast !== 'undefined') {
                iziToast.error({
                    message: "Network error occurred",
                    position: "topRight"
                });
            }
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalText;
        }
    };


    // --- Attach Validation Logic to Forms ---
    
    // 1. Block Domain Form Validation
    if(blockForm) {
        const domainInput = blockForm.querySelector("#block-domain-name");
        blockForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllErrors(blockForm);
            
            if(!domainInput.value.trim()) {
                showInputError(domainInput, "Domain name is required");
                return;
            }
            handleFormSubmit(e, blockOverlay, blockForm);
        });
    }

    // 2. Report Domain Form Validation
    if(reportForm) {
        const domainInput = reportForm.querySelector("#report-domain-name");
        reportForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllErrors(reportForm);
            
            if(!domainInput.value.trim()) {
                showInputError(domainInput, "Domain name is required");
                return;
            }
            handleFormSubmit(e, reportOverlay, reportForm);
        });
    }

    // 3. Allow Domain Form Validation
    if(allowForm) {
        const domainInput = allowForm.querySelector("#allow-domain-name");
        allowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            clearAllErrors(allowForm);
            
            if(!domainInput.value.trim()) {
                showInputError(domainInput, "Domain name is required");
                return;
            }
            handleFormSubmit(e, allowOverlay, allowForm);
        });
    }

});

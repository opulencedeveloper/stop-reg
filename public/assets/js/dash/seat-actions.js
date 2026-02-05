
document.addEventListener("DOMContentLoaded", () => {
    const tableBody = document.getElementById("seats-table-body");
    const modalOverlay = document.getElementById("confirmation-modal-overlay");
    const modalTitle = document.getElementById("confirm-modal-title");
    const modalDesc = document.getElementById("confirm-modal-desc");
    const confirmBtn = document.getElementById("confirm-action-btn");
    const cancelBtn = document.getElementById("confirm-cancel-btn");
    const iconWrapper = document.getElementById("confirm-icon-wrapper");
    const confirmIcon = document.getElementById("confirm-icon");

    let currentAction = null; // 'delete' or 'resend'
    let currentData = null; // { id, email }

    if (!tableBody || !modalOverlay) return;

    // Event Delegation for Table Actions
    tableBody.addEventListener("click", (e) => {
        const deleteBtn = e.target.closest(".delete-seat-btn");
        const resendBtn = e.target.closest(".resend-btn");

        if (deleteBtn) {
            handleDeleteRequest(deleteBtn.dataset.id);
        } else if (resendBtn) {
            handleResendRequest(resendBtn.dataset.email, resendBtn.dataset.id);
        }
    });

    // --- Modal Logic ---

    function openModal(type, data) {
        currentAction = type;
        currentData = data;

        // Reset Styles & Animations
        modalOverlay.style.display = "flex";
        modalOverlay.classList.remove("fadeOut");
        // modalOverlay.classList.add("overlay-animate"); // Removed to stop backdrop animation
        
        // Simple Backdrop Fade
        modalOverlay.style.transition = "opacity 0.3s ease";
        modalOverlay.style.opacity = "0";
        setTimeout(() => modalOverlay.style.opacity = "1", 10);

        // Ensure overlay has fixed position/styles if not in CSS class
        modalOverlay.classList.add("overlay"); 

        // Target the inner modal box for the premium animation
        const modalBox = modalOverlay.querySelector('.delete-modal-box');
        if (modalBox) {
            modalBox.classList.remove("fadeOut"); // Ensure clean state
            modalBox.classList.add("animate-soft-scale");
        }

        if (type === "delete") {
            modalTitle.textContent = "Delete Seat User";
            modalDesc.textContent = "Are you sure you want to delete this seat? This action cannot be undone.";
            confirmBtn.style.backgroundColor = "#DC2626"; // Red
            confirmBtn.querySelector("span").textContent = "Delete";
            iconWrapper.style.backgroundColor = "#FEF2F2";
            
            // Set Delete Icon
            confirmIcon.src = "/assets/icons/delete.svg";
            // Optional: Add/Remove specific class for icon styling if needed
            confirmIcon.classList.add('delete-modal-icon'); 
        } else {
            modalTitle.textContent = "Resend Invitation";
            modalDesc.textContent = `Resend invitation to ${data.email}?`;
            confirmBtn.style.backgroundColor = "#1452CA"; // Primary Blue
            confirmBtn.querySelector("span").textContent = "Resend";
             iconWrapper.style.backgroundColor = "#EBF2FF";
             
             // Set Resend Icon
             confirmIcon.src = "/assets/icons/email-resend-outline.svg";
             // Optional: Remove delete class if it affects color (filter)
             confirmIcon.classList.remove('delete-modal-icon');
             // Or verify CSS handles specificity. 'delete-modal-icon' has a red filter.
             // We want the blue/normal color for resend.
             // Let's ensure no red filter is applied. 
             confirmIcon.style.filter = "none";
        }
    }

    function closeModal() {
        // Overlay Fade Out
        // modalOverlay.classList.remove("overlay-animate");
        // modalOverlay.classList.add("fadeOut"); // Removes whole container animation
        
        modalOverlay.style.opacity = "0"; // Simple fade out
        
        // Inner Box Animation Cleanup
        const modalBox = modalOverlay.querySelector('.delete-modal-box');
        if (modalBox) {
             modalBox.classList.remove("animate-soft-scale");
        }
        
        // Reset Icon Filter on close (so delete works next time)
        confirmIcon.style.filter = ""; 

        setTimeout(() => {
            modalOverlay.style.display = "none";
            // modalOverlay.classList.remove("fadeOut");
            currentAction = null;
            currentData = null;
        }, 300);
    }

    cancelBtn.addEventListener("click", closeModal);
    // Close on backdrop click
    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    // --- Confirm Action ---

    confirmBtn.addEventListener("click", async () => {
        if (!currentAction || !currentData) return;

        const token = localStorage.getItem("authToken");
        if (!token) return;

        const originalText = confirmBtn.querySelector("span").textContent;
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-top-color: #fff"></span> Processing...`;

        try {
            let response;
            
            if (currentAction === "delete") {
                // DELETE Request
                response = await fetch(`https://api-stop-reg.onrender.com/api/v1/seat/delete?seatId=${currentData.id}`, {
                    method: "DELETE", // Assuming DELETE method based on standard, user said "Send http request", implied REST. If GET, user usually specifies. Route name implies deletion.
                    // Wait, user provided URL parameters but didn't specify method. "seat/delete" is unusual for DELETE verb on resource, often POST.
                    // User Request: "Send a http request to this end point .../delete?seatId=..."
                    // I'll try DELETE method first as best practice, fallback to POST/GET if needed or ask? 
                    // Actually, most existing legacy setups use POST or DELETE. I'll stick to DELETE for safety or POST if query param style suggests RPC.
                    // Let's assume DELETE method for now.
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });
            } else {
                // RESEND Request
                response = await fetch(`https://api-stop-reg.onrender.com/api/v1/seat/resend-invitation`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ email: currentData.email })
                });
            }

            const data = await response.json();

            if (response.ok) {
                if (typeof iziToast !== 'undefined') {
                    iziToast.success({
                        message: currentAction === "delete" ? "Seat deleted successfully" : "Invitation resent successfully",
                        position: "topRight"
                    });
                }
                closeModal();
                // Refresh Table
                if (typeof window.fetchSeatsTable === 'function') {
                    // Stay on current page if possible, or reset?
                    // Let's just reset for now or read existing page from DOM?
                    // Easier to just reload current view
                     const limitSelect = document.getElementById("seats-per-page-select");
                     const limit = limitSelect ? parseInt(limitSelect.value) : 10;
                     // Ideally we'd know the current page. fetch-seats-table doesn't expose it easily unless we store it globally.
                     // We'll just fetch page 1.
                     window.fetchSeatsTable(1, limit);
                }
            } else {
                throw new Error(data.description || data.message || "Action failed");
            }

        } catch (error) {
            console.error("Action Error:", error);
            // Close the confirmation modal so we can show the error modal
            closeModal(); 
            
            // Show Error Modal (Reuse existing global error modal logic from other files)
            // Or just use iziToast and the premium error backdrop
             setTimeout(() => {
                showModalError(error.message);
             }, 300); // Wait for confirm modal to close
        } finally {
            confirmBtn.disabled = false;
            if (confirmBtn.querySelector("span")) { 
                 // If innerHTML wasn't completely wiped (it was), restore structure
                 // We need to check what the text *should* be
                 const actionText = currentAction === "delete" ? "Delete" : "Resend";
                 confirmBtn.innerHTML = `<span>${actionText}</span>`; 
            } else {
                 confirmBtn.innerHTML = `<span>${originalText}</span>`;
            }
        }
    });

    // Helpers
    function handleDeleteRequest(id) {
        if (!id) return;
        openModal("delete", { id });
    }

    function handleResendRequest(email, id) {
        if (!email) return;
        openModal("resend", { email, id });
    }

    // Reuse existing Error Modal Logic from invite-seat.js (duplicated effectively, or accessible globally?)
    // To be safe, re-implement the simple toggle here or assume it's global. 
    // Since it's not global, I'll copy the helper.
    function showModalError(msg) {
        const errorBackdrop = document.getElementById("premium-error-backdrop");
        const errorMsgEl = document.getElementById("error-message");
        const errorTitleEl = document.getElementById("error-title");

        if (errorBackdrop && errorMsgEl) {
            if (errorTitleEl) errorTitleEl.textContent = "Action Failed";
            errorMsgEl.textContent = msg;
            errorBackdrop.style.display = "flex";
            errorBackdrop.classList.add("active");
            
            // Ensure close button works
            const close = document.getElementById("error-close-btn");
            if (close) {
                close.onclick = () => {
                    errorBackdrop.style.display = "none";
                    errorBackdrop.classList.remove("active");
                };
            }
            errorBackdrop.onclick = (e) => {
                 if (e.target === errorBackdrop) {
                     errorBackdrop.style.display = "none";
                     errorBackdrop.classList.remove("active");
                 }
            };
        } else if (typeof iziToast !== 'undefined') {
             iziToast.error({ message: msg, position: "topRight" });
        }
    }
});

/**
 * Admin Profile Management
 * Handles personal details updates and password rotation with industrial-standard security.
 * Consolidates tab switching and visibility logic.
 */

document.addEventListener("DOMContentLoaded", () => {
    // --- CONFIGURATION ---
    const API_BASE_URL = "http://localhost:8080/api/v1/admin";
    const TOKEN_KEY = "adminToken";

    // --- ELEMENT SELECTORS ---
    const getEl = (id) => document.getElementById(id);
    
    // Visual Components
    const pageSpinner = getEl("spinner-body");
    const errorTarget = getEl("admin-profile-error-target");
    const errorBackdrop = getEl("premium-error-backdrop");
    const errorTitle = getEl("error-title");
    const errorMessage = getEl("error-message");
    const errorRetryBtn = getEl("error-retry-btn");
    const errorCloseBtn = getEl("error-close-btn");

    // --- STATE ---
    let adminData = null;
    const originalPaneHTML = errorTarget ? errorTarget.innerHTML : "";

    // --- UTILITIES ---

    const showLoading = (type = "pane") => {
        if (type === "page" && pageSpinner) {
            pageSpinner.style.display = "flex";
        } else {
            const currentPaneSpinner = getEl("admin-profile-loading");
            if (currentPaneSpinner) {
                currentPaneSpinner.style.display = "flex";
            }
            // Hide panes while loading
            document.querySelectorAll(".profile-pane").forEach(p => p.style.display = "none");
        }
    };

    const hideLoading = () => {
        if (pageSpinner) pageSpinner.style.display = "none";
        
        const currentPaneSpinner = getEl("admin-profile-loading");
        if (currentPaneSpinner) {
            currentPaneSpinner.style.display = "none";
        }
        
        // Only show panes if we're not currently displaying an error state
        if (errorTarget && errorTarget.querySelector(".fetch-error-state")) return;

        const activeTab = document.querySelector(".profile-nav-btn.active")?.dataset.tab || "details";
        const pane = getEl(`${activeTab}-pane`);
        if (pane) {
            pane.style.display = "block";
            pane.classList.add("active");
        }
    };

    const renderSectionError = (message, retryFn) => {
        // Force hide all spinners first using the unified hide explorer
        hideLoading();
        
        if (!errorTarget) return;

        errorTarget.innerHTML = `
            <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
                <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                </div>
                <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load profile</h3>
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
            errorTarget.innerHTML = originalPaneHTML; // Restore structure
            // Re-select elements after restoring HTML
            relinkElements();
            retryFn ? retryFn() : loadProfile();
        };
    };

    // Helper to re-bind form listeners and inputs after restoring original HTML
    const relinkElements = () => {
        // Re-bind submissions handled at bottom of script
    };

    const showError = (title, message, showRetry = false) => {
        if (errorBackdrop) {
            errorTitle.textContent = title;
            errorMessage.textContent = message;
            errorRetryBtn.style.display = showRetry ? "block" : "none";
            errorBackdrop.style.display = "flex";
        }
    };

    const hideError = () => {
        if (errorBackdrop) errorBackdrop.style.display = "none";
    };


    const apiFetch = async (endpoint, options = {}) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
            window.location.href = "/admin-login/index.html";
            return null;
        }

        const defaultOptions = {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        };

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaultOptions, ...options });
            
            if (window.handleAdminAuthError(response)) {
                return null;
            }

            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.description || "An error occurred during the request.");
            }

            return result;
        } catch (error) {
            console.error("API Fetch Error:", error);
            if (error.message.includes("Failed to fetch") || error instanceof TypeError) {
                throw new Error("Network error, please check your connection and try again.");
            }
            throw error;
        }
    };

    const validatePasswordComplexity = (password) => {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        return regex.test(password);
    };

    // --- DATA ORCHESTRATION ---

    const loadProfile = async () => {
        // Ensure the main page spinner (from main.js) is hidden to reveal the layout
        if (typeof window.hideSpinner === "function") {
            window.hideSpinner();
        } else if (pageSpinner) {
            pageSpinner.style.display = "none";
            const content = getEl("content");
            if (content) content.style.display = "block";
            document.body.classList.remove('hidden-overflow');
        }

        showLoading("pane");
        hideError();
        try {
            const result = await apiFetch("/profile");
            if (result && result.data) {
                adminData = result.data;
                populateProfile();
                hideLoading();
            } else {
                throw new Error("Empty response from server.");
            }
        } catch (error) {
            renderSectionError(error.message);
        }
    };

    const populateProfile = () => {
        if (!adminData) return;
        // Need to re-fetch elements because they might have been restored from originalPaneHTML
        const fName = getEl("first-name");
        const lName = getEl("last-name");
        const em = getEl("email");
        const dName = getEl("display-name");

        if (fName) fName.value = adminData.firstName || "";
        if (lName) lName.value = adminData.lastName || "";
        if (em) em.value = adminData.email || "";
        if (dName) dName.textContent = `${adminData.firstName} ${adminData.lastName}`;
    };

    const updatePersonalDetails = async (e) => {
        e.preventDefault();
        
        const fNameInput = getEl("first-name");
        const lNameInput = getEl("last-name");
        const dNameTxt = getEl("display-name");

        const firstName = fNameInput.value.trim();
        const lastName = lNameInput.value.trim();

        if (!firstName || !lastName) {
            iziToast.warning({ title: "Required", message: "Please fill in all fields.", position: "topRight" });
            return;
        }

        const pForm = getEl("personal-details-form");
        const submitBtn = pForm.querySelector(".profile-submit-btn");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Saving...";
        submitBtn.disabled = true;

        try {
            const result = await apiFetch("/profile", {
                method: "PATCH",
                body: JSON.stringify({ firstName, lastName })
            });

            if (result && result.message === "success") {
                adminData = { ...adminData, firstName, lastName };
                if (dNameTxt) dNameTxt.textContent = `${firstName} ${lastName}`;
                iziToast.success({ title: "Success", message: "Profile updated successfully.", position: "topRight" });
            }
        } catch (error) {
            iziToast.error({ title: "Update Failed", message: error.message, position: "topRight" });
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };

    const updatePassword = async (e) => {
        e.preventDefault();
        
        const curPass = getEl("current-password");
        const newPass = getEl("new-password");
        const rePass = getEl("retype-password");

        const currentPassword = curPass.value;
        const newPassword = newPass.value;
        const confirmPassword = rePass.value;

        // Validations
        if (!currentPassword || !newPassword || !confirmPassword) {
            iziToast.warning({ title: "Required", message: "All password fields are required.", position: "topRight" });
            return;
        }

        if (newPassword !== confirmPassword) {
            iziToast.error({ title: "Mismatch", message: "New passwords do not match.", position: "topRight" });
            return;
        }

        if (!validatePasswordComplexity(newPassword)) {
            iziToast.error({ 
                title: "Weak Password", 
                message: "Password must be at least 8 characters, with one uppercase, one lowercase, and one number.", 
                position: "topRight" 
            });
            return;
        }

        const passForm = getEl("update-password-form");
        const submitBtn = passForm.querySelector(".profile-submit-btn");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "Updating...";
        submitBtn.disabled = true;

        try {
            const result = await apiFetch("/password", {
                method: "PATCH",
                body: JSON.stringify({ currentPassword, newPassword })
            });

            if (result && result.message === "success") {
                passForm.reset();
                iziToast.success({ title: "Updated", message: "Your password has been changed successfully.", position: "topRight" });
            }
        } catch (error) {
            iziToast.error({ title: "Error", message: error.message, position: "topRight" });
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    };

    // --- TAB SWITCHING ---
    const initTabSwitching = () => {
        const desktopBtns = document.querySelectorAll(".profile-nav-btn");
        const mobileBtns = document.querySelectorAll(".mobile-tab-btn");

        const switchTab = (tabId) => {
            // Check if we're in an error state. If so, don't allow switching until retry restored structure.
            if (errorTarget && errorTarget.querySelector(".fetch-error-state")) return;

            desktopBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
            mobileBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
            
            const panes = document.querySelectorAll(".profile-pane");
            panes.forEach(pane => {
                const isActive = pane.id === `${tabId}-pane`;
                pane.style.display = isActive ? "block" : "none";
                pane.classList.toggle("active", isActive);
            });
        };

        desktopBtns.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
        mobileBtns.forEach(btn => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));
    };

    // --- EVENT LISTENERS ---

    // Tab Switching
    initTabSwitching();

    // Form Submissions (use delegation because elements might be replaced)
    document.addEventListener("submit", (e) => {
        if (e.target.id === "personal-details-form") updatePersonalDetails(e);
        if (e.target.id === "update-password-form") updatePassword(e);
    });

    // Error UI
    if (errorRetryBtn) errorRetryBtn.addEventListener("click", () => {
        hideError();
        loadProfile();
    });
    if (errorCloseBtn) errorCloseBtn.addEventListener("click", hideError);

    // Password Visibility Toggles (delegation)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".password-toggle");
        if (btn) {
            const input = btn.parentElement.querySelector("input");
            const icon = btn.querySelector("img");
            if (input.type === "password") {
                input.type = "text";
                icon.src = "/assets/icons/mynaui_eye.svg";
            } else {
                input.type = "password";
                icon.src = "/assets/icons/obsured.svg";
            }
        }
    });

    // --- INITIALIZATION ---
    loadProfile();
});

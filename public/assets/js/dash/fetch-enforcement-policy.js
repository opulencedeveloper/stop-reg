document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("authToken");
  console.log("[Enforcement Policy] Auth Token:", token ? `${token.substring(0, 20)}...` : "NO TOKEN");
  if (!token) return;

  // DOM Elements
  const requestsSection = document.querySelector(".dash-requests-setion");

  // Force hide global page spinner on window load
  function forceHideSpinner() {
    if (typeof window.hideSpinner === 'function') {
      window.hideSpinner();
    }
  }

  if (document.readyState === 'complete') {
    forceHideSpinner();
  } else {
    window.addEventListener('load', forceHideSpinner);
  }

  // Classification mapping - maps display text to backend classification key
  const classificationMap = {
    "Disposable address": "disposable_address",
    "Undeliverable domain": "undeliverable_domain",
    "Email Alias: Native": "email_alias_native",
    "Email Alias: Forwarding": "email_alias_forwarding",
    "Role account": "role_account",
    "Free Subdomain Provider": "free_subdomain_provider",
    "Email Routing": "email_routing",
    "Private Domain": "private_domain",
    "Edu Domain": "email_edu",
    "ISP Domain": "email_isp",
    "Public mailbox provider": "public_mailbox_provider"
  };

  let currentPolicy = null;
  let saveBtn = null;
  let resetBtn = null;
  let classificationBtns = null;
  let originalSectionHTML = null;

  // --- Initialization ---

  // Save original HTML before showing loading state
  if (requestsSection) {
    originalSectionHTML = requestsSection.innerHTML;
  }

  showLoadingState();
  loadPolicy();

  async function loadPolicy() {
    try {
      console.log("[Enforcement Policy] Fetching policy from API...");
      const response = await fetch("https://api.stopreg.com/api/v1/enforcement-policy", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("[Enforcement Policy] API Response Status:", response.status);
      console.log("[Enforcement Policy] API Response Data:", data);

      if (response.ok && data.data) {
        currentPolicy = data.data.policy;
        console.log("[Enforcement Policy] Current Policy Loaded:", currentPolicy);
        hideLoadingState();
        renderPolicy();
        attachEventListeners();
      } else {
        throw new Error(data.description || data.message || "Failed to load policy");
      }
    } catch (error) {
      console.error("[Enforcement Policy] Error loading policy:", error);
      if (window.handleAuthError && await window.handleAuthError(error)) {
        return;
      }
      showErrorState(error.message || "Failed to load enforcement policy");
    }
  }

  function renderPolicy() {
    if (!currentPolicy) {
      console.log("[Enforcement Policy] Cannot render - no currentPolicy");
      return;
    }

    console.log("[Enforcement Policy] Starting renderPolicy()");

    // Render classification actions
    console.log("[Enforcement Policy] Rendering", currentPolicy.policies.length, "classification policies");
    currentPolicy.policies.forEach((policy, pIdx) => {
      const classification = policy.classification;
      const action = policy.action;
      console.log(`[Enforcement Policy] Policy ${pIdx}: ${classification} = ${action}`);

      const tile = findTileByClassification(classification);
      if (!tile) {
        console.log(`[Enforcement Policy] WARNING: Tile not found for ${classification}`);
        return;
      }

      const btns = tile.querySelectorAll(".action-btn");
      console.log(`[Enforcement Policy] Found ${btns.length} buttons for ${classification}`);

      btns.forEach((btn, bIdx) => {
        const btnText = btn.textContent.trim().toLowerCase();

        // Remove all risk classes
        btn.classList.remove("high-risk", "medium-risk", "trusted");

        // Add selected class based on action (not classification)
        if (btnText === action) {
          if (action === "allow") {
            btn.classList.add("trusted");
            console.log(`[Enforcement Policy] ${classification} btn ${bIdx}: added "trusted"`);
          } else if (action === "warn") {
            btn.classList.add("medium-risk");
            console.log(`[Enforcement Policy] ${classification} btn ${bIdx}: added "medium-risk"`);
          } else if (action === "block") {
            btn.classList.add("high-risk");
            console.log(`[Enforcement Policy] ${classification} btn ${bIdx}: added "high-risk"`);
          }
        }
      });
    });
    console.log("[Enforcement Policy] renderPolicy() complete");
  }

  function attachEventListeners() {
    // Re-query DOM elements after policy load to ensure they're available
    classificationBtns = document.querySelectorAll(
      ".risk-type-tile .action-btn"
    );
    saveBtn = document.querySelector(".enforce-policy-footer-btn.primary");
    resetBtn = document.querySelector(".enforce-policy-footer-btn.secondary");

    classificationBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const tile = e.target.closest(".risk-type-tile");
        const titleElement = tile.querySelector(
          ".risk-type-tile-sect-one-row-tle"
        );
        const classification = mapClassification(titleElement.textContent.trim());
        const action = e.target.textContent.trim().toLowerCase();

        selectClassificationAction(classification, action);
      });
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", savePolicy);
    }
    if (resetBtn) {
      resetBtn.addEventListener("click", resetPolicy);
    }

    // Reset Modal Listeners
    const resetCancelBtn = document.getElementById("reset-cancel-btn");
    const resetConfirmBtn = document.getElementById("reset-confirm-btn");

    if (resetCancelBtn) {
      resetCancelBtn.addEventListener("click", closeResetModal);
    }
    if (resetConfirmBtn) {
      resetConfirmBtn.addEventListener("click", confirmResetPolicy);
    }
  }

  // --- Action Handlers ---

  function selectClassificationAction(classification, action) {
    const tile = findTileByClassification(classification);
    if (!tile) return;

    const btns = tile.querySelectorAll(".action-btn");
    btns.forEach(btn => {
      const btnText = btn.textContent.trim().toLowerCase();
      btn.classList.remove("high-risk", "medium-risk", "trusted");

      if (btnText === action) {
        if (action === "allow") {
          btn.classList.add("trusted");
        } else if (action === "warn") {
          btn.classList.add("medium-risk");
        } else if (action === "block") {
          btn.classList.add("high-risk");
        }
      }
    });

    if (currentPolicy) {
      const policyItem = currentPolicy.policies.find(
        p => p.classification === classification
      );
      if (policyItem) {
        policyItem.action = action;
      }
    }
  }

  async function savePolicy() {
    if (!currentPolicy) return;

    saveBtn.disabled = true;
    const originalHTML = saveBtn.innerHTML;
    saveBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-top-color: #fff"></span> Saving...`;

    try {
      const payload = {
        policies: currentPolicy.policies
      };

      console.log("[Enforcement Policy] Submitting Payload:", payload);
      const response = await fetch("https://api.stopreg.com/api/v1/enforcement-policy", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log("[Enforcement Policy] Save Response Status:", response.status);
      console.log("[Enforcement Policy] Save Response Data:", data);

      if (response.ok) {
        console.log("[Enforcement Policy] Policy saved successfully");
        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            message: "Enforcement policy saved successfully",
            position: "topRight"
          });
        }
        currentPolicy = data.data.policy;
        renderPolicy();
      } else {
        throw new Error(data.description || data.message || "Failed to save policy");
      }
    } catch (error) {
      console.error("[Enforcement Policy] Error saving policy:", error);
      if (window.handleAuthError && await window.handleAuthError(error)) {
        return;
      }
      showErrorToast(error.message || "Failed to save enforcement policy");
    } finally {
      saveBtn.disabled = false;
      saveBtn.innerHTML = originalHTML;
    }
  }

  function showResetModal() {
    const modal = document.getElementById("reset-policy-modal-overlay");
    if (!modal) return;

    modal.classList.remove("is-exiting");
    modal.classList.add("is-active");
  }

  function closeResetModal() {
    const modal = document.getElementById("reset-policy-modal-overlay");
    if (!modal) return;

    modal.classList.remove("is-active");
    modal.classList.add("is-exiting");

    setTimeout(() => {
      modal.classList.remove("is-exiting");
    }, 300);
  }

  async function confirmResetPolicy() {
    const resetConfirmBtn = document.getElementById("reset-confirm-btn");
    const resetCancelBtn = document.getElementById("reset-cancel-btn");
    const originalHTML = resetConfirmBtn.innerHTML;

    // Show loading state in modal
    resetConfirmBtn.disabled = true;
    resetCancelBtn.disabled = true;
    resetConfirmBtn.innerHTML = `<span class="stopreg-btn-spinner" style="border-top-color: #FCD34D;"></span> Resetting...`;

    try {
      console.log("[Enforcement Policy] Resetting policy to defaults...");
      const response = await fetch("https://api.stopreg.com/api/v1/enforcement-policy/reset", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("[Enforcement Policy] Reset Response Status:", response.status);
      console.log("[Enforcement Policy] Reset Response Data:", data);

      if (response.ok) {
        console.log("[Enforcement Policy] Policy reset successfully");
        closeResetModal();

        if (typeof iziToast !== 'undefined') {
          iziToast.success({
            message: "Enforcement policy reset to defaults",
            position: "topRight"
          });
        }
        currentPolicy = data.data.policy;
        renderPolicy();
      } else {
        throw new Error(data.description || data.message || "Failed to reset policy");
      }
    } catch (error) {
      console.error("[Enforcement Policy] Error resetting policy:", error);
      if (window.handleAuthError && await window.handleAuthError(error)) {
        return;
      }
      showErrorToast(error.message || "Failed to reset enforcement policy");
    } finally {
      resetConfirmBtn.disabled = false;
      resetCancelBtn.disabled = false;
      resetConfirmBtn.innerHTML = originalHTML;
    }
  }

  async function resetPolicy() {
    showResetModal();
  }

  // --- Helpers ---

  function mapClassification(displayText) {
    return classificationMap[displayText] || displayText;
  }

  function findTileByClassification(classification) {
    for (const [displayText, classKey] of Object.entries(classificationMap)) {
      if (classKey === classification) {
        const tiles = document.querySelectorAll(".risk-type-tile");
        for (const tile of tiles) {
          const titleElement = tile.querySelector(".risk-type-tile-sect-one-row-tle");
          if (titleElement && titleElement.textContent.trim() === displayText) {
            return tile;
          }
        }
      }
    }
    return null;
  }

  function isHighRiskClassification(classification) {
    return [
      "disposable_address",
      "undeliverable_domain",
      "email_alias_native"
    ].includes(classification);
  }

  function isMediumRiskClassification(classification) {
    return [
      "email_alias_forwarding",
      "role_account",
      "free_subdomain_provider",
      "email_routing"
    ].includes(classification);
  }

  function showErrorToast(message) {
    if (typeof iziToast !== 'undefined') {
      iziToast.error({
        message: message,
        position: "topRight"
      });
    }
  }

  function showLoadingState() {
    if (!requestsSection) return;
    requestsSection.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: center; padding: 40px; min-height: 300px;">
        <div class="stopreg-spinner" style="width: 32px; height: 32px; border-width: 3px;"></div>
      </div>
    `;
  }

  function hideLoadingState() {
    // Restore original HTML after loading
    if (requestsSection && originalSectionHTML) {
      requestsSection.innerHTML = originalSectionHTML;
    }
  }

  function showErrorState(errorMessage) {
    if (!requestsSection) return;
    requestsSection.innerHTML = `
      <div style="text-align: center; padding: 40px;">
        <p style="color: #dc3545; font-size: 16px; margin-bottom: 16px; font-weight: 500;">
          Failed to load enforcement policy
        </p>
        <p style="color: #667085; font-size: 14px; margin-bottom: 20px;">
          ${errorMessage}
        </p>
        <button id="retry-policy-btn" style="background: #1452CA; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 500;">
          Retry
        </button>
      </div>
    `;

    const retryBtn = document.getElementById("retry-policy-btn");
    if (retryBtn) {
      retryBtn.addEventListener("click", () => {
        showLoadingState();
        loadPolicy();
      });
    }
  }
});

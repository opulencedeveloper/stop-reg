/**
 * Admin Cron Job Configuration JavaScript
 * Handles fetching, updating, and managing cron job configuration
 */

document.addEventListener("DOMContentLoaded", () => {
  const adminToken = localStorage.getItem("adminToken");
  const BASE_ADMIN_URL = "http://localhost:8080/api/v1/admin";

  // --- DOM ELEMENTS ---
  const getEl = (id) => document.getElementById(id);
  const cronConfigForm = getEl("cronConfigForm");
  const runIntervalSelect = getEl("runInterval");
  const publishProvidersToggle = getEl("publishProviders");
  const providersConfig = getEl("providersConfig");
  const initProvidersInput = getEl("initProvidersPerDay");
  const finalProvidersInput = getEl("finalProvidersPerDay");
  const publishDomainsToggle = getEl("publishDomains");
  const domainsConfig = getEl("domainsConfig");
  const initDomainsInput = getEl("initDomainsPerDay");
  const finalDomainsInput = getEl("finalDomainsPerDay");
  const isActiveToggle = getEl("isActive");
  const saveBtn = getEl("saveBtn");
  const resetBtn = getEl("resetBtn");

  // Status elements
  const lastRunTime = getEl("lastRunTime");
  const lastRunStatus = getEl("lastRunStatus");
  const nextRunTime = getEl("nextRunTime");
  const jobActive = getEl("jobActive");

  let currentConfig = null;
  let isSaving = false;
  const errorTarget = getEl("cron-config-error-target");
  const spinner = getEl("cron-config-spinner");
  const contentWrapper = getEl("cron-config-content");
  const originalHTML = errorTarget ? errorTarget.innerHTML : "";

  // --- API UTILITIES ---
  async function apiFetch(endpoint, options = {}) {
    const url = `${BASE_ADMIN_URL}${endpoint}`;
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

      const data = await response.json();

      if (!response.ok) {
        console.error(`[API Error] ${endpoint}:`, data);
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[API Fetch Error] ${endpoint}:`, error);
      return null;
    }
  }

  // --- LOADING & ERROR STATES ---
  function showLoading() {
    if (spinner) spinner.style.display = "flex";
    if (contentWrapper) contentWrapper.style.display = "none";
  }

  function hideLoading() {
    if (spinner) spinner.style.display = "none";
    if (contentWrapper) contentWrapper.style.display = "block";
  }

  function showError(message, retryFn) {
    hideLoading();
    if (!errorTarget) return;

    errorTarget.innerHTML = `
      <div class="fetch-error-state" style="padding: 60px 20px; text-align: center; background: white; border-radius: 12px; border: 1px solid #EDEDED;">
        <div class="error-icon-wrapper" style="margin: 0 auto 24px; background: #FEF2F2; width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #DC2626;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 8V12M12 16H12.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h3 style="font-family: 'Inter_28pt-SemiBold', sans-serif; font-size: 18px; margin-bottom: 8px; color: #111827;">Failed to load configuration</h3>
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
      errorTarget.innerHTML = originalHTML;
      retryFn();
    };
  }

  // --- INITIALIZATION ---
  async function initPage() {
    await loadConfig();
    setupEventListeners();
  }

  // --- LOAD CONFIGURATION ---
  async function loadConfig() {
    showLoading();
    try {
      const result = await apiFetch("/programmatic-seo/cron-job-config");

      if (!result || !result.data) {
        showError("Unable to fetch configuration. Please try again.", loadConfig);
        return;
      }

      currentConfig = result.data;
      populateForm(currentConfig);
      updateStatusDisplay(currentConfig);
      hideLoading();
    } catch (error) {
      showError("An error occurred while loading configuration. Please try again.", loadConfig);
    }
  }

  // --- POPULATE FORM ---
  function populateForm(config) {
    runIntervalSelect.value = config.runInterval || "24_hours";
    publishProvidersToggle.value = config.publishProviders ? "yes" : "no";
    initProvidersInput.value = config.initProvidersPerDay || 5;
    finalProvidersInput.value = config.finalProvidersPerDay || 10;
    publishDomainsToggle.value = config.publishDomains ? "yes" : "no";
    initDomainsInput.value = config.initDomainsPerDay || 50;
    finalDomainsInput.value = config.finalDomainsPerDay || 100;
    isActiveToggle.checked = config.isActive !== false;

    updateConfigVisibility();
  }

  // --- UPDATE STATUS DISPLAY ---
  function updateStatusDisplay(config) {
    lastRunTime.textContent = config.lastRun
      ? new Date(config.lastRun).toLocaleString()
      : "Never";

    lastRunStatus.textContent = config.lastRunStatus || "—";
    lastRunStatus.className = `status-value ${config.lastRunStatus || ""}`;

    nextRunTime.textContent = config.nextRun
      ? new Date(config.nextRun).toLocaleString()
      : "—";

    jobActive.textContent = config.isActive ? "Yes" : "No";
    jobActive.className = `status-value ${config.isActive ? "success" : ""}`;
  }

  // --- UPDATE CONFIG VISIBILITY ---
  function updateConfigVisibility() {
    const providerDisplay = publishProvidersToggle.value === "yes" ? "block" : "none";
    const domainDisplay = publishDomainsToggle.value === "yes" ? "block" : "none";

    providersConfig.style.display = providerDisplay;
    domainsConfig.style.display = domainDisplay;
  }

  // --- SETUP EVENT LISTENERS ---
  function setupEventListeners() {
    publishProvidersToggle.addEventListener("change", updateConfigVisibility);
    publishDomainsToggle.addEventListener("change", updateConfigVisibility);

    cronConfigForm.addEventListener("submit", handleFormSubmit);
    resetBtn.addEventListener("click", handleReset);
  }

  // --- HANDLE FORM SUBMIT ---
  async function handleFormSubmit(e) {
    e.preventDefault();

    if (isSaving) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    isSaving = true;
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<span class="btn-spinner"></span> Saving...';

    try {
      const payload = {
        runInterval: runIntervalSelect.value,
        publishProviders: publishProvidersToggle.value === "yes",
        initProvidersPerDay: parseInt(initProvidersInput.value),
        finalProvidersPerDay: parseInt(finalProvidersInput.value),
        publishDomains: publishDomainsToggle.value === "yes",
        initDomainsPerDay: parseInt(initDomainsInput.value),
        finalDomainsPerDay: parseInt(finalDomainsInput.value),
        isActive: isActiveToggle.checked
      };

      const result = await apiFetch("/programmatic-seo/cron-job-config", {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      if (result && result.data) {
        currentConfig = result.data;
        updateStatusDisplay(currentConfig);
        showSuccess("Configuration saved successfully");
      } else {
        showError("Failed to save configuration. Please try again.");
      }
    } catch (error) {
      console.error("[Form Submission Error]:", error);
      showError("An error occurred while saving. Please try again.");
    } finally {
      isSaving = false;
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<span>Save Configuration</span>';
    }
  }

  // --- VALIDATE FORM ---
  function validateForm() {
    const initProviders = parseInt(initProvidersInput.value);
    const finalProviders = parseInt(finalProvidersInput.value);
    const initDomains = parseInt(initDomainsInput.value);
    const finalDomains = parseInt(finalDomainsInput.value);

    if (publishProvidersToggle.value === "yes" && finalProviders < initProviders) {
      showErrorToast("Final Number of Published Providers Per Day must be >= Init");
      return false;
    }

    if (publishDomainsToggle.value === "yes" && finalDomains < initDomains) {
      showErrorToast("Final Number of Published Domains Per Day must be >= Init");
      return false;
    }

    return true;
  }

  // --- HANDLE RESET ---
  function handleReset() {
    if (currentConfig) {
      populateForm(currentConfig);
      showInfo("Form reset to last saved configuration");
    }
  }

  // --- TOAST NOTIFICATIONS ---
  function showSuccess(message) {
    if (typeof iziToast !== "undefined") {
      iziToast.success({
        title: "Success",
        message: message,
        position: "topRight",
        timeout: 3000
      });
    }
  }

  function showErrorToast(message) {
    if (typeof iziToast !== "undefined") {
      iziToast.error({
        title: "Error",
        message: message,
        position: "topRight",
        timeout: 3000
      });
    }
  }

  function showInfo(message) {
    if (typeof iziToast !== "undefined") {
      iziToast.info({
        title: "Info",
        message: message,
        position: "topRight",
        timeout: 3000
      });
    }
  }

  // Initialize page
  initPage();
});

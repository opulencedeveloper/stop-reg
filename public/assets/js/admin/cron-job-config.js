/**
 * Admin Cron Job Configuration JavaScript
 * Handles fetching, updating, and managing cron job configuration
 */

document.addEventListener("DOMContentLoaded", () => {
  const adminToken = localStorage.getItem("adminToken");
  const BASE_ADMIN_URL = "https://api.stopreg.com/api/v1/admin";

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
        console.error(`[API Error] ${endpoint}:`, {
          status: response.status,
          description: data.description,
          response: data
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error(`[API Fetch Error] ${endpoint}:`, {
        message: error.message,
        stack: error.stack,
        error: error
      });
      return null;
    }
  }

  // --- INITIALIZATION ---
  async function initPage() {
    await loadConfig();
    setupEventListeners();
  }

  // --- LOAD CONFIGURATION ---
  async function loadConfig() {
    const result = await apiFetch("/programmatic-seo/cron-job-config");

    if (!result || !result.data) {
      showError("Failed to load configuration");
      return;
    }

    currentConfig = result.data;
    populateForm(currentConfig);
    updateStatusDisplay(currentConfig);
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
    providersConfig.style.display = publishProvidersToggle.value === "yes" ? "block" : "none";
    domainsConfig.style.display = publishDomainsToggle.value === "yes" ? "block" : "none";
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
        showError("Failed to save configuration");
      }
    } catch (error) {
      console.error("[Form Submission Error]:", error);
      showError("An error occurred while saving");
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
      showError("Final Number of Published Providers Per Day must be >= Init");
      return false;
    }

    if (publishDomainsToggle.value === "yes" && finalDomains < initDomains) {
      showError("Final Number of Published Domains Per Day must be >= Init");
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

  function showError(message) {
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

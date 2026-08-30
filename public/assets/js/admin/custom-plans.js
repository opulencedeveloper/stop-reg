document.addEventListener('DOMContentLoaded', async () => {
  const API_BASE_URL = 'https://api.stopreg.com/api/v1/admin';
  const TOKEN_KEY = 'adminToken';

  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    window.location.href = '/admin-login/index.html';
    return;
  }

  let currentPage = 1;
  const limit = 10;
  let searchDebounceTimer = null;

  const selectors = {
    createBtn: '#create-plan-btn',
    modalOverlay: '#plan-modal-overlay',
    closeBtn: '#close-plan-modal',
    cancelBtn: '#plan-modal-cancel',
    form: '#plan-form',
    tableBody: '#custom-plans-tbody',
    pagination: '#custom-plans-pagination',
    loading: '#custom-plans-loading',
    container: '#custom-plans-container',
    emptyState: '#custom-plans-empty',
    customerSearchInput: '#customer-search-input',
    customerSearchResults: '#customer-search-results',
    customerSearchLoading: '.customer-search-loading',
    selectedCustomerId: '#selected-customer-id',
  };

  const defaultOptions = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const apiFetch = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...defaultOptions, ...options });
    const result = await response.json();

    if (window.handleAdminAuthError && window.handleAdminAuthError(response)) {
      return null;
    }

    if (!response.ok) {
      throw new Error(result.description || result.message || 'Request failed');
    }

    return result.data;
  };

  // Modal management
  function openModal() {
    const overlay = document.querySelector(selectors.modalOverlay);
    overlay.style.display = 'flex';
    overlay.style.pointerEvents = 'auto';
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';

    setTimeout(() => {
      overlay.style.opacity = '1';
      overlay.style.visibility = 'visible';
    }, 10);

    document.getElementById('plan-modal-title').textContent = 'Create Custom Plan';
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    const overlay = document.querySelector(selectors.modalOverlay);
    overlay.style.opacity = '0';
    overlay.style.visibility = 'hidden';
    overlay.style.pointerEvents = 'none';

    setTimeout(() => {
      overlay.style.display = 'none';
      overlay.classList.remove('is-active');
      document.querySelector(selectors.form).reset();
      clearCustomerSearch();
      document.body.style.overflow = '';

      // Reset modal to create mode
      const modalTitle = document.querySelector('.modal-overlay h2');
      if (modalTitle) modalTitle.textContent = 'Create Custom Plan';

      const submitBtn = document.querySelector(selectors.form).querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.textContent = 'Create Plan';
        delete submitBtn.dataset.planId;
      }

      // Re-enable customer search
      document.getElementById('customer-search-input').disabled = false;
    }, 300);
  }

  document.querySelector(selectors.createBtn).addEventListener('click', () => openModal());
  document.querySelector(selectors.closeBtn).addEventListener('click', closeModal);
  document.querySelector(selectors.cancelBtn).addEventListener('click', closeModal);

  const emptyCreateBtn = document.getElementById('empty-create-btn');
  if (emptyCreateBtn) {
    emptyCreateBtn.addEventListener('click', () => openModal());
  }

  // Handle Unlimited Checkboxes
  const apiLimitUnlimited = document.getElementById('api-limit-unlimited');
  const apiLimitInput = document.getElementById('api-limit');
  const apiKeyLimitUnlimited = document.getElementById('api-key-limit-unlimited');
  const apiKeyLimitInput = document.getElementById('api-key-limit');
  const requestsPerSecondUnlimited = document.getElementById('requests-per-second-unlimited');
  const requestsPerSecondInput = document.getElementById('requests-per-second');

  if (apiLimitUnlimited && apiLimitInput) {
    apiLimitUnlimited.addEventListener('change', (e) => {
      if (e.target.checked) {
        apiLimitInput.disabled = true;
        apiLimitInput.value = '';
        apiLimitInput.removeAttribute('required');
      } else {
        apiLimitInput.disabled = false;
        apiLimitInput.setAttribute('required', 'required');
      }
    });
  }

  if (apiKeyLimitUnlimited && apiKeyLimitInput) {
    apiKeyLimitUnlimited.addEventListener('change', (e) => {
      if (e.target.checked) {
        apiKeyLimitInput.disabled = true;
        apiKeyLimitInput.value = '';
        apiKeyLimitInput.removeAttribute('required');
      } else {
        apiKeyLimitInput.disabled = false;
        apiKeyLimitInput.setAttribute('required', 'required');
      }
    });
  }

  if (requestsPerSecondUnlimited && requestsPerSecondInput) {
    requestsPerSecondUnlimited.addEventListener('change', (e) => {
      if (e.target.checked) {
        requestsPerSecondInput.disabled = true;
        requestsPerSecondInput.value = '';
        requestsPerSecondInput.removeAttribute('required');
      } else {
        requestsPerSecondInput.disabled = false;
        requestsPerSecondInput.setAttribute('required', 'required');
      }
    });
  }

  // Load and render plans
  async function loadPlans() {
    try {
      document.querySelector(selectors.loading).style.display = 'flex';
      document.querySelector(selectors.container).style.display = 'none';

      const offset = (currentPage - 1) * limit;
      const data = await apiFetch(`/custom-plans?limit=${limit}&offset=${offset}`);
      const { plans, pagination } = data;

      renderPlans(plans);
      renderPagination(pagination);

      document.querySelector(selectors.loading).style.display = 'none';
      document.querySelector(selectors.container).style.display = 'block';
    } catch (error) {
      console.error(error);
      if (typeof iziToast !== 'undefined') {
        iziToast.error({ message: error.message, position: 'topRight' });
      }
    }
  }

  function renderPlans(plans) {
    const tbody = document.querySelector(selectors.tableBody);
    if (plans.length === 0) {
      tbody.innerHTML = '';
      document.querySelector(selectors.emptyState).style.display = 'block';
      document.querySelector(selectors.container).style.display = 'none';
      return;
    }

    document.querySelector(selectors.emptyState).style.display = 'none';
    document.querySelector(selectors.container).style.display = 'block';

    tbody.innerHTML = plans.map(plan => {
      const createdDate = new Date(plan.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      return `
        <tr>
          <td>
            <div class="customer-name" style="font-family: 'Inter_28pt-Regular', monospace; font-size: 13px; color: #404040;">${plan.name}</div>
          </td>
          <td>
            <div class="customer-name">${plan.customerId?.email || 'N/A'}</div>
          </td>
          <td><span class="price-badge">$${plan.monthlyPrice.toFixed(2)}</span></td>
          <td><span class="limit-value">${plan.apiLimit === null ? 'Unlimited' : plan.apiLimit.toLocaleString()}</span></td>
          <td><span class="limit-value">${plan.apiKeyLimit === null ? 'Unlimited' : plan.apiKeyLimit}</span></td>
          <td><span class="limit-value">${plan.seatLimit === null ? 'Unlimited' : plan.seatLimit}</span></td>
          <td><span class="limit-value">${plan.requestsPerSecond === null ? 'Unlimited' : plan.requestsPerSecond}</span></td>
          <td><span class="limit-value">${plan.duration} (${plan.durationInDays}d)</span></td>
          <td>${plan.createdByAdmin?.email || 'System'}</td>
          <td>${createdDate}</td>
          <td>
            <div class="action-buttons">
              <button class="btn-action-icon edit-plan-btn" data-id="${plan._id}" title="Edit this plan">
                <img src="/assets/icons/edit-outline.svg" alt="Edit" width="20" height="20" />
              </button>
              <button class="btn-action-icon delete-plan-btn" data-id="${plan._id}" data-plan-name="${plan.name}" title="Delete this plan">
                <img src="/assets/icons/delete.svg" alt="Delete" width="20" height="20" />
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Edit Plan Button Listeners
    document.querySelectorAll('.edit-plan-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const planId = e.currentTarget.dataset.id;

        // Find the plan data from the current plans array
        const plan = plans.find(p => p._id === planId);
        if (!plan) {
          if (typeof iziToast !== 'undefined') {
            iziToast.error({ message: 'Plan not found', position: 'topRight' });
          }
          return;
        }

        // Populate form with existing plan data
        document.getElementById('selected-customer-id').value = plan.customerId?._id || '';
        document.getElementById('customer-search-input').value = plan.customerId?.email || '';
        document.getElementById('monthly-price').value = plan.monthlyPrice;
        document.getElementById('duration-select').value = plan.duration;
        document.getElementById('api-limit').value = plan.apiLimit === null ? '' : plan.apiLimit;
        document.getElementById('api-limit-unlimited').checked = plan.apiLimit === null;
        document.getElementById('seat-limit').value = plan.seatLimit;
        document.getElementById('api-key-limit').value = plan.apiKeyLimit === null ? '' : plan.apiKeyLimit;
        document.getElementById('api-key-limit-unlimited').checked = plan.apiKeyLimit === null;
        document.getElementById('requests-per-second').value = plan.requestsPerSecond === null ? '' : plan.requestsPerSecond;
        document.getElementById('requests-per-second-unlimited').checked = plan.requestsPerSecond === null;
        document.getElementById('duration-in-days').value = plan.durationInDays;

        // Trigger change event to update input states (disabled, required attributes)
        document.getElementById('api-limit-unlimited').dispatchEvent(new Event('change'));
        document.getElementById('api-key-limit-unlimited').dispatchEvent(new Event('change'));
        document.getElementById('requests-per-second-unlimited').dispatchEvent(new Event('change'));

        // Update modal title and button
        const modalTitle = document.querySelector('.modal-overlay h2');
        if (modalTitle) modalTitle.textContent = 'Edit Custom Plan';

        const submitBtn = document.querySelector('.modal-overlay button[type="submit"]');
        if (submitBtn) {
          submitBtn.dataset.planId = planId;
          submitBtn.textContent = 'Update Plan';
        }

        // Disable customer search (can't change customer in edit mode)
        document.getElementById('customer-search-input').disabled = true;

        // Open modal using inline styles (same as closeModal does in reverse)
        const overlay = document.querySelector(selectors.modalOverlay);
        overlay.style.opacity = '1';
        overlay.style.visibility = 'visible';
        overlay.style.pointerEvents = 'auto';
        overlay.style.display = 'flex';  // flex for proper centering (horizontal + vertical)
        document.body.style.overflow = 'hidden';
      });
    });

    document.querySelectorAll('.delete-plan-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const planId = e.currentTarget.dataset.id;
        const planName = e.currentTarget.dataset.planName || 'this plan';

        // Show delete confirmation modal
        const modalOverlay = document.getElementById('delete-plan-modal-overlay');
        const planNameEl = document.getElementById('delete-plan-name');
        planNameEl.textContent = planName;

        // Add active class for animation
        modalOverlay.classList.add('is-active');

        // Handle confirm button
        const confirmBtn = document.getElementById('confirm-delete-plan-btn');
        const cancelBtn = document.getElementById('cancel-delete-plan-btn');
        const closeBtn = document.getElementById('close-delete-plan-modal');

        const handleConfirm = async () => {
          // Show loading state on button
          const originalBtnText = confirmBtn.textContent;
          confirmBtn.disabled = true;
          confirmBtn.textContent = 'Deleting...';
          confirmBtn.style.opacity = '0.7';

          try {
            // Delete the plan and get response
            await deletePlan(planId);
          } catch (error) {
            // Error is handled in deletePlan, just close the modal
          } finally {
            // Reset button state
            confirmBtn.disabled = false;
            confirmBtn.textContent = originalBtnText;
            confirmBtn.style.opacity = '1';

            // Remove active class and add exiting class for exit animation
            modalOverlay.classList.remove('is-active');
            modalOverlay.classList.add('is-exiting');

            // Wait for animation to complete before removing
            await new Promise(resolve => setTimeout(resolve, 300));
            modalOverlay.classList.remove('is-exiting');

            // Remove listeners
            confirmBtn.removeEventListener('click', handleConfirm);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
          }
        };

        const handleCancel = () => {
          // Remove active class and add exiting class for exit animation
          modalOverlay.classList.remove('is-active');
          modalOverlay.classList.add('is-exiting');

          // Wait for animation to complete before removing
          setTimeout(() => {
            modalOverlay.classList.remove('is-exiting');
          }, 300);

          // Remove listeners
          confirmBtn.removeEventListener('click', handleConfirm);
          cancelBtn.removeEventListener('click', handleCancel);
          closeBtn.removeEventListener('click', handleCancel);
        };

        confirmBtn.addEventListener('click', handleConfirm);
        cancelBtn.addEventListener('click', handleCancel);
        closeBtn.addEventListener('click', handleCancel);
      });
    });
  }

  function renderPagination(pagination) {
    const container = document.querySelector(selectors.pagination);
    const { pages, page } = pagination;

    if (pages <= 1) {
      container.innerHTML = '';
      return;
    }

    let html = '';

    if (page > 1) {
      html += `<button class="pagination-btn" data-page="${page - 1}" title="Previous page">← Previous</button>`;
    }

    const startPage = Math.max(1, page - 2);
    const endPage = Math.min(pages, page + 2);

    if (startPage > 1) {
      html += `<button class="pagination-btn" data-page="1">1</button>`;
      if (startPage > 2) {
        html += `<span style="padding: 0 8px; color: #737373;">...</span>`;
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    if (endPage < pages) {
      if (endPage < pages - 1) {
        html += `<span style="padding: 0 8px; color: #737373;">...</span>`;
      }
      html += `<button class="pagination-btn" data-page="${pages}">${pages}</button>`;
    }

    if (page < pages) {
      html += `<button class="pagination-btn" data-page="${page + 1}" title="Next page">Next →</button>`;
    }

    container.innerHTML = html;

    document.querySelectorAll('[data-page]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        currentPage = parseInt(e.target.dataset.page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        loadPlans();
      });
    });
  }

  // Form submission (Create or Edit)
  document.querySelector(selectors.form).addEventListener('submit', async (e) => {
    e.preventDefault();

    const customerId = document.querySelector(selectors.selectedCustomerId).value;
    if (!customerId) {
      if (typeof iziToast !== 'undefined') {
        iziToast.error({ message: 'Please select a customer', position: 'topRight' });
      }
      return;
    }

    const submitBtn = document.querySelector(selectors.form).querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.textContent;
    const planId = submitBtn.dataset.planId; // Set if editing
    const isEditing = !!planId;

    const formData = {
      customerId,
      monthlyPrice: parseFloat(document.getElementById('monthly-price').value),
      apiLimit: document.getElementById('api-limit-unlimited').checked ? null : parseInt(document.getElementById('api-limit').value),
      seatLimit: parseInt(document.getElementById('seat-limit').value),
      apiKeyLimit: document.getElementById('api-key-limit-unlimited').checked ? null : parseInt(document.getElementById('api-key-limit').value),
      requestsPerSecond: document.getElementById('requests-per-second-unlimited').checked ? null : parseInt(document.getElementById('requests-per-second').value),
      durationInDays: parseInt(document.getElementById('duration-in-days').value),
      duration: document.getElementById('duration-select').value,
    };

    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.textContent = isEditing ? 'Updating Plan...' : 'Creating Plan...';
      submitBtn.style.opacity = '0.7';

      const url = isEditing ? `/custom-plans/${planId}` : '/custom-plans';
      const method = isEditing ? 'PUT' : 'POST';

      // For updates, exclude customerId (can't change customer assignment)
      const dataToSend = isEditing ? {
        monthlyPrice: formData.monthlyPrice,
        apiLimit: formData.apiLimit,
        seatLimit: formData.seatLimit,
        apiKeyLimit: formData.apiKeyLimit,
        requestsPerSecond: formData.requestsPerSecond,
        durationInDays: formData.durationInDays,
        duration: formData.duration,
      } : formData;

      const response = await apiFetch(url, {
        method,
        body: JSON.stringify(dataToSend)
      });

      if (typeof iziToast !== 'undefined') {
        const message = response.description || (isEditing ? 'Plan updated successfully!' : 'Plan created successfully!');
        iziToast.success({ message, position: 'topRight' });
      }

      closeModal();
      loadPlans();
    } catch (error) {
      console.error(error);
      if (typeof iziToast !== 'undefined') {
        iziToast.error({ message: error.message, position: 'topRight' });
      }
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.textContent = originalBtnText;
      submitBtn.style.opacity = '1';
      // Clear planId for next use
      delete submitBtn.dataset.planId;
    }
  });

  // Delete plan
  async function deletePlan(planId) {
    try {
      const response = await apiFetch(`/custom-plans/${planId}`, {
        method: 'DELETE'
      });

      if (typeof iziToast !== 'undefined') {
        const message = response?.description || 'Plan deleted successfully!';
        iziToast.success({ message, position: 'topRight' });
      }

      loadPlans();
    } catch (error) {
      console.error(error);
      if (typeof iziToast !== 'undefined') {
        const message = error?.message || 'Failed to delete plan';
        iziToast.error({ message, position: 'topRight' });
      }
      throw error; // Re-throw so caller knows delete failed
    }
  }

  // Customer search functionality
  const searchInput = document.querySelector(selectors.customerSearchInput);
  const searchResults = document.querySelector(selectors.customerSearchResults);
  const selectedCustomerIdField = document.querySelector(selectors.selectedCustomerId);

  function setSearchLoading(isLoading) {
    const loadingEl = document.querySelector(selectors.customerSearchLoading);
    if (isLoading) {
      loadingEl.style.display = 'flex';
    } else {
      loadingEl.style.display = 'none';
    }
  }

  function showSearchResults(results) {
    if (results.length === 0) {
      searchResults.innerHTML = '<div class="customer-search-empty">No customers found</div>';
      searchResults.style.display = 'block';
      return;
    }

    searchResults.innerHTML = results.map(customer => `
      <div class="customer-search-result-item" data-id="${customer.id}">
        <div>
          <div class="customer-result-name">${customer.name}</div>
          <div class="customer-result-email">${customer.email}</div>
        </div>
        <div class="customer-result-plan-badge">${customer.plan}</div>
      </div>
    `).join('');

    searchResults.style.display = 'block';

    document.querySelectorAll('.customer-search-result-item').forEach(item => {
      item.addEventListener('click', () => {
        const customerId = item.dataset.id;
        const customerEmail = item.querySelector('.customer-result-email').textContent;

        selectedCustomerIdField.value = customerId;
        searchInput.value = customerEmail;
        clearSearchResults();
      });
    });
  }

  function clearSearchResults() {
    searchResults.innerHTML = '';
    searchResults.style.display = 'none';
  }

  function clearCustomerSearch() {
    searchInput.value = '';
    selectedCustomerIdField.value = '';
    clearSearchResults();
  }

  // Debounced search
  function debounce(func, delay) {
    return function (...args) {
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(() => func(...args), delay);
    };
  }

  const debouncedSearch = debounce(async (query) => {
    if (!query || query.length < 2) {
      clearSearchResults();
      return;
    }

    try {
      setSearchLoading(true);
      const data = await apiFetch(`/users/search?q=${encodeURIComponent(query)}&limit=20`);
      const customers = data.users || [];

      setSearchLoading(false);
      showSearchResults(customers);
    } catch (error) {
      console.error('Search error:', error);
      setSearchLoading(false);

      if (typeof iziToast !== 'undefined') {
        iziToast.error({
          title: 'Search Error',
          message: error.message || 'Failed to search customers',
          position: 'topRight',
          timeout: 3000
        });
      }
    }
  }, 500);

  searchInput.addEventListener('input', (e) => {
    debouncedSearch(e.target.value);
  });

  searchInput.addEventListener('focus', (e) => {
    if (e.target.value && e.target.value.length >= 2) {
      searchResults.style.display = 'block';
    }
  });

  // Close results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.customer-search-wrapper')) {
      clearSearchResults();
    }
  });

  // Initialize
  await loadPlans();
});

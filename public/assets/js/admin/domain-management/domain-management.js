/**
 * Domain Management Page JavaScript
 * Handles tab switching, search focus, and basic interactivity.
 */

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initSearchFocus();
  initPagination();
  initActionButtons();
});

/**
 * Initializes the tab switching logic.
 */
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  if (!tabButtons.length || !tabContents.length) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.dataset.tab;

      // Update button active state
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Update content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${targetTab}-content`) {
          content.classList.add('active');
        }
      });

      console.log(`Switched to tab: ${targetTab}`);
    });
  });
}

/**
 * Handles the Cmd + 1 (or Ctrl + 1) shortcut to focus the search input.
 */
function initSearchFocus() {
  const searchInput = document.getElementById('domain-search-input');
  if (!searchInput) return;

  window.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === '1') {
      e.preventDefault();
      searchInput.focus();
    }
  });

  // Optional: Add focus/blur styles to the wrapper
  searchInput.addEventListener('focus', () => {
    searchInput.parentElement.style.borderColor = 'var(--blue-500, #1452CA)';
    searchInput.parentElement.style.boxShadow = '0 0 0 2px rgba(20, 82, 202, 0.1)';
  });

  searchInput.addEventListener('blur', () => {
    searchInput.parentElement.style.borderColor = '';
    searchInput.parentElement.style.boxShadow = '';
  });
}

/**
 * Basic pagination interactivity.
 */
function initPagination() {
  const paginationBtns = document.querySelectorAll('.pagination-btn:not(:disabled)');
  
  paginationBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('active')) return;
      
      const pageNum = btn.innerText;
      if (!isNaN(pageNum)) {
        console.log(`Navigating to page ${pageNum}`);
        // Here you would typically trigger an API call or filter the table
        
        // Visual indicator change for demo
        paginationBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }
    });
  });
}

/**
 * Handles action button clicks.
 */
function initActionButtons() {
  const actionBtns = document.querySelectorAll('.action-btn');
  
  // Action button menu listener (placeholder for dropdown)
  actionBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('Action menu clicked');
    });
  });

  initAddMoreModal();
}

/**
 * Initializes the "Add More" modal logic.
 */
function initAddMoreModal() {
  const modal = document.getElementById('add-more-modal');
  const addBtn = document.querySelector('.add-more-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const form = document.getElementById('add-domain-form');

  if (!modal || !addBtn || !closeBtn || !form) return;

  const openModal = () => {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // Prevent scroll
    // GPU acceleration hint
    modal.style.willChange = 'opacity, visibility';
    modal.querySelector('.domain-modal-container').style.willChange = 'transform, opacity';
  };

  const closeModal = () => {
    modal.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clear will-change after animation
    setTimeout(() => {
      modal.style.willChange = '';
      modal.querySelector('.domain-modal-container').style.willChange = '';
    }, 500);
  };

  addBtn.addEventListener('click', openModal);
  closeBtn.addEventListener('click', closeModal);

  // Close on outside click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  // Handle form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const provider = document.getElementById('email-provider').value;
    const domain = document.getElementById('domain-name').value;

    console.log('Submitting new domain:', { provider, domain });

    // Simulate success
    const submitBtn = form.querySelector('.domain-submit-btn');
    const originalText = submitBtn.innerText;
    
    submitBtn.innerText = 'Adding...';
    submitBtn.disabled = true;

    setTimeout(() => {
      alert(`Successfully added ${domain} for ${provider}`);
      form.reset();
      submitBtn.innerText = originalText;
      submitBtn.disabled = false;
      closeModal();
    }, 1000);
  });
}

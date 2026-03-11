/**
 * MX Matching Admin Page JavaScript
 * Handles tab switching, search keyboard shortcuts, and table interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initSearchShortcut();
    initActionButtons();
    initModal();
});

/**
 * Initializes modal open/close logic
 */
function initModal() {
    const addMoreBtn = document.querySelector('.add-more-btn');
    const modal = document.getElementById('add-more-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const form = document.getElementById('add-mx-form');

    if (!addMoreBtn || !modal || !closeBtn) return;

    // Open modal
    addMoreBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scroll
        
        // Focus first input
        setTimeout(() => {
            const firstInput = form.querySelector('input[type="text"]');
            if (firstInput) firstInput.focus();
        }, 400); // Wait for entrance animation
    });

    // Close modal function
    const closeModal = () => {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    };

    closeBtn.addEventListener('click', closeModal);

    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });

    // Form submission handling
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Industrial feedback on button
            const submitBtn = form.querySelector('.mx-submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processing...';
            submitBtn.disabled = true;

            // Simulate industrial processing
            setTimeout(() => {
                console.log('Form submitted successfully');
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                closeModal();
                
                // Reset form
                form.reset();
                updateRadioIcons(form); // Reset icons to default
            }, 1000);
        });
    }

    // Radio button icon switching logic
    const radioBoxes = modal.querySelectorAll('.mx-radio-box');
    radioBoxes.forEach(box => {
        box.addEventListener('click', () => {
            updateRadioIcons(form);
        });
    });
}

/**
 * Updates radio button icons based on selection
 */
function updateRadioIcons(form) {
    const radioBoxes = form.querySelectorAll('.mx-radio-box');
    radioBoxes.forEach(box => {
        const input = box.querySelector('input');
        const icon = box.querySelector('.radio-icon');
        if (input.checked) {
            icon.src = '/assets/icons/radio-on.svg';
        } else {
            icon.src = '/assets/icons/radio-off.svg';
        }
    });
}

/**
 * Initializes tab switching logic
 */
function initTabs() {
    const tabs = document.querySelectorAll('.mx-tabs .tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabName = tab.getAttribute('data-tab');
            const targetId = `${tabName}-content`;
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
            console.log(`MX Matching switched to: ${tabName}`);
        });
    });
}

/**
 * Initializes keyboard shortcuts for search
 */
function initSearchShortcut() {
    const searchInput = document.getElementById('mx-search-input');
    
    if (!searchInput) return;

    document.addEventListener('keydown', (e) => {
        // Cmd/Ctrl + 1 to focus search
        if ((e.metaKey || e.ctrlKey) && e.key === '1') {
            e.preventDefault();
            searchInput.focus();
        }
    });

    searchInput.addEventListener('focus', () => {
        console.log('Search focused via shortcut');
    });
}

/**
 * Initializes table action buttons
 */
function initActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn');
    
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (!row) return;
            
            const provider = row.cells[0].textContent;
            console.log(`MX Action clicked for: ${provider}`);
            
            // Industrial feedback
            btn.style.opacity = '0.5';
            setTimeout(() => {
                btn.style.opacity = '1';
            }, 100);
        });
    });
}

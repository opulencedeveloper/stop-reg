/**
 * Admin Domains Page JavaScript
 * Handles tab switching and table interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initActionButtons();
});

/**
 * Initializes tab switching logic
 */
function initTabs() {
    const tabs = document.querySelectorAll('.domains-tabs .tab-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetId = `${tab.getAttribute('data-tab')}-content`;
            
            // Remove active class from all tabs and contents
            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and its content
            tab.classList.add('active');
            const targetContent = document.getElementById(targetId);
            if (targetContent) {
                targetContent.classList.add('active');
            }
            
        });
    });
}

/**
 * Initializes table action buttons
 */
function initActionButtons() {
    const actionButtons = document.querySelectorAll('.action-btn-circle');
    
    actionButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const email = row.cells[0].textContent;
       
            // Add industrial feedback effect
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = 'scale(1)';
            }, 100);
        });
    });
}

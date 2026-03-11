/**
 * Admin Users Page Logic
 * Handles sorting dropdown and keyboard shortcuts.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSortDropdown();
    initSearchShortcut();
});

/**
 * Initializes the custom sort dropdown toggle
 */
function initSortDropdown() {
    const sortBtn = document.getElementById('sort-dropdown-btn');
    const sortMenu = document.getElementById('sort-dropdown-menu');

    if (!sortBtn || !sortMenu) return;

    sortBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        sortMenu.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!sortBtn.contains(e.target) && !sortMenu.contains(e.target)) {
            sortMenu.classList.remove('active');
        }
    });

    // Handle sort item selection
    const sortItems = sortMenu.querySelectorAll('.sort-item');
    sortItems.forEach(item => {
        item.addEventListener('click', () => {
            sortItems.forEach(si => si.classList.remove('active'));
            item.classList.add('active');
            sortMenu.classList.remove('active');
            
            // Re-render logic would go here
            console.log('Sorting by:', item.textContent.trim());
        });
    });
}

/**
 * Initializes keyboard shortcut for search focus (⌘ K or Ctrl K)
 */
function initSearchShortcut() {
    const searchInput = document.getElementById('user-search-input');
    if (!searchInput) return;

    window.addEventListener('keydown', (e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            searchInput.focus();
        }
    });
}

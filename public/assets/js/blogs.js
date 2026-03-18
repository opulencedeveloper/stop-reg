/* Blog Page Scripts - Premium Industrial Standard */
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('blogSearchInput');
    const searchBtn = document.getElementById('blogSearchBtn');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const noResultsContainer = document.getElementById('noResultsContainer');
    const blogCards = document.querySelectorAll('.blog-card');
    const blogGrid = document.querySelector('.blog-grid');

    if (!searchInput || !blogCards.length) return;

    /**
     * Performs the blog search and filters the grid
     */
    const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        blogCards.forEach(card => {
            const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
            const description = card.querySelector('p')?.textContent.toLowerCase() || '';
            
            if (title.includes(query) || description.includes(query)) {
                card.style.display = 'flex';
                visibleCount++;
            } else {
                card.style.display = 'none';
            }
        });

        // Toggle 'No Results' state with premium UI
        if (visibleCount === 0) {
            if (blogGrid) blogGrid.style.display = 'none';
            if (noResultsContainer) noResultsContainer.style.display = 'flex';
        } else {
            if (blogGrid) blogGrid.style.display = 'grid';
            if (noResultsContainer) noResultsContainer.style.display = 'none';
        }
    };

    // Explicit triggers for accessibility and user expectation
    if (searchBtn) {
        searchBtn.addEventListener('click', performSearch);
    }

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performSearch();
        }
    });

    // Clear search functionality
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }
});

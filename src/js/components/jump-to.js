/**
 * Generate Jump to Links from h2 and h3 headings
 * Automatically creates navigation links in the jump-to sidebar
 */

(function() {
    'use strict';

    function generateJumpToLinks() {
        const jumpToContainer = document.getElementById('jumpToLinks');
        if (!jumpToContainer) return;

        // Find main content area (adjust selector as needed)
        const mainContent = document.querySelector('.col-12.col-lg-6.col-xl-8');
        if (!mainContent) return;

        // Find all h2 and h3 elements
        const headings = mainContent.querySelectorAll('h2, h3');
        
        if (headings.length === 0) {
            jumpToContainer.innerHTML = '';
            return;
        }

        // Clear existing links
        jumpToContainer.innerHTML = '';

        // Generate links for each heading
        headings.forEach(function(heading) {
            // Generate ID if it doesn't exist
            let id = heading.id;
            if (!id) {
                // Create ID from heading text
                id = heading.textContent
                    .toLowerCase()
                    .trim()
                    .replace(/[^\w\s-]/g, '') // Remove special characters
                    .replace(/\s+/g, '-') // Replace spaces with hyphens
                    .replace(/-+/g, '-'); // Replace multiple hyphens with single
                heading.id = id;
            }

            // Create list item and link
            const listItem = document.createElement('li');
            listItem.className = 'list-item';
            
            const link = document.createElement('a');
            link.className = 'list-link';
            link.href = '#' + id;
            link.textContent = heading.textContent.trim();
            
            // Add smooth scroll behavior
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.getElementById(id);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });

            listItem.appendChild(link);
            jumpToContainer.appendChild(listItem);
        });
    }

    // Initialize on page load
    document.addEventListener('DOMContentLoaded', function() {
        generateJumpToLinks();
    });
})();


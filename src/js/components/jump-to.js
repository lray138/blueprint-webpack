/**
 * Generate Jump to Links from h2 and h3 headings
 * Automatically creates navigation links in the jump-to sidebar
 */

(function() {
    'use strict';

    function generateJumpToLinks() {
        const jumpToContainer = document.getElementById('jump-to');
        if (!jumpToContainer) return;

        // Find main content area (adjust selector as needed)
        // const mainContent = document.querySelector('.col-12.col-lg-6.col-xl-8');
        const mainContent = document.getElementById('doc-content');
        if (!mainContent) return;

        // Find all h2 and h3 elements
        const headings = mainContent.querySelectorAll(`
            :scope > section > div > h2, :scope section > div > h3, 
            :scope > h2, :scope > h3, 
            :scope > div > h2, :scope > div > h3`
        );
        // const headingsAll = mainContent.querySelectorAll(':scope > h2, :scope > h3');
        // const headingsFirstDiv = mainContent.querySelectorAll(':scope > div > h2, :scope > div > h3');
        
        // const headings = Array.from(
        //     new Set([...headingsScoped, ...headingsAll, ...headingsFirstDiv])
        // );

        const jumpToColumn = jumpToContainer.closest('.jump-to-col');
        const jumpToHeading = jumpToContainer.closest('div')?.querySelector('h6');

        if (headings.length === 0) {
            jumpToContainer.innerHTML = '';
            jumpToContainer.hidden = true;
            if (jumpToHeading) {
                jumpToHeading.hidden = true;
            }
            if (jumpToColumn) {
                jumpToColumn.hidden = true;
            }
            return;
        }

        jumpToContainer.hidden = false;
        if (jumpToHeading) {
            jumpToHeading.hidden = false;
        }
        if (jumpToColumn) {
            jumpToColumn.hidden = false;
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

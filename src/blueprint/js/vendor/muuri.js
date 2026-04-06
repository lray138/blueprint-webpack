import Muuri from 'muuri';

const grids = document.querySelectorAll('[data-muuri-grid]');

grids.forEach(function (root) {
  const dragEnabled =
    root.dataset.muuriDrag === 'true' || root.hasAttribute('data-muuri-drag');

  const grid = new Muuri(root, {
    items: '.muuri-item',
    layout: {
      fillGaps: true,
      horizontal: false,
    },
    dragEnabled: dragEnabled,
  });

  root.querySelectorAll('img').forEach(function (img) {
    if (img.complete) {
      return;
    }
    img.addEventListener('load', function () {
      grid.refreshItems().layout();
    });
  });
});

// Make available globally
window.Muuri = Muuri;

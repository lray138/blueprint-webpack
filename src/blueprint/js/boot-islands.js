/**
 * Islands: lazy-load JS only when matching markup exists (webpack code-split chunks).
 *
 * - [data-muuri-grid] → chunk `island-gallery` → theme-gallery.js (Muuri + BigPicture)
 * - [data-flickity] → chunk `island-flickity` → theme-flickity.js
 * - #jump-to or .jump-to-col → chunk `island-docs` → theme-docs.js (jump-to + accordion-docs)
 *
 * When you add an island, document it here and add a matching import() below.
 */
export function bootIslands() {
  const loaders = [];

  if (document.querySelector('[data-muuri-grid]')) {
    loaders.push(
      import(/* webpackChunkName: "island-gallery" */ './theme-gallery.js')
    );
  }

  if (document.querySelector('[data-flickity]')) {
    loaders.push(
      import(/* webpackChunkName: "island-flickity" */ './theme-flickity.js')
    );
  }

  if (document.querySelector('#jump-to') || document.querySelector('.jump-to-col')) {
    loaders.push(
      import(/* webpackChunkName: "island-docs" */ './theme-docs.js')
    );
  }

  return Promise.all(loaders);
}

export function bootIslandsWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      void bootIslands();
    });
  } else {
    void bootIslands();
  }
}

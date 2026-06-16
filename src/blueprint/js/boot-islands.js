/**
 * Lazy-load interactive chunks only when matching markup exists on the page.
 *
 * - [data-muuri-grid] -> chunk `island-gallery` -> theme-gallery.js (Muuri + BigPicture)
 * - [data-flickity] -> chunk `island-flickity` -> theme-flickity.js
 * - #jump-to or .jump-to-col -> chunk `island-docs` -> theme-docs.js (jump-to + accordion-docs)
 *
 * HTMX and Turnstile are third-party scripts — see document template `include_htmx_js` /
 * `include_turnstile_js` (content-detected in `pageDocumentVendorScripts`).
 *
 * CMS may also set `window.__CARBON_ISLAND_BOOT` (string[]) from component manifest `island.boot`.
 */

const BOOT_LOADERS = {
  gallery: () => import(/* webpackChunkName: "island-gallery" */ './theme-gallery.js'),
  flickity: () => import(/* webpackChunkName: "island-flickity" */ './theme-flickity.js'),
  docs: () => import(/* webpackChunkName: "island-docs" */ './theme-docs.js'),
}

function bootsRequested() {
  /** @type {Set<string>} */
  const boots = new Set()
  const fromWindow = globalThis.__CARBON_ISLAND_BOOT
  if (Array.isArray(fromWindow)) {
    for (const entry of fromWindow) {
      const id = String(entry ?? '').trim()
      if (id) boots.add(id)
    }
  }
  if (document.querySelector('[data-muuri-grid]')) boots.add('gallery')
  if (document.querySelector('[data-flickity]')) boots.add('flickity')
  if (document.querySelector('#jump-to') || document.querySelector('.jump-to-col')) boots.add('docs')
  return boots
}

export function bootIslands() {
  const loaders = []
  for (const boot of bootsRequested()) {
    const load = BOOT_LOADERS[boot]
    if (load) loaders.push(load())
  }
  return Promise.all(loaders)
}

export function bootIslandsWhenReady() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      void bootIslands()
    })
  } else {
    void bootIslands()
  }
}

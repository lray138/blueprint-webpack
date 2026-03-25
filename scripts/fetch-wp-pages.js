#!/usr/bin/env node
/**
 * Prefetch Blueprint page JSON from WordPress into webpack/.cache/blueprint-wp/
 * (same paths getPage uses). Edit SLUGS below — no webpack involved.
 *
 * Usage:
 *   WP_URL=https://yoursite.test npm run sync:wp
 *
 * Force refetch (ignore disk cache for this run):
 *   BLUEPRINT_WP_FORCE_REFRESH=1 WP_URL=... npm run sync:wp
 */

const { getPage } = require('../src/utils/getPage');

/** WordPress page slugs for blueprint/v1/page/{slug} — add or remove as needed */
const SLUGS = ['home'];

async function main() {
  const baseUrl = process.env.WP_URL || process.env.WORDPRESS_URL;
  if (!baseUrl) {
    console.error('fetch-wp-pages: set WP_URL or WORDPRESS_URL to your WordPress site origin (no trailing slash).');
    process.exit(1);
  }

  let failed = false;
  for (const slug of SLUGS) {
    try {
      const page = await getPage(slug, {
        baseUrl,
        cache: true,
        forceRefresh: process.env.BLUEPRINT_WP_FORCE_REFRESH === '1',
      });
      const n = Array.isArray(page.sections) ? page.sections.length : 0;
      console.log(`OK  ${slug} — "${page.title}" (${n} sections)`);
    } catch (e) {
      failed = true;
      console.error(`FAIL ${slug} — ${e.message}`);
    }
  }

  if (failed) {
    process.exit(1);
  }
}

main();

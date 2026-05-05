'use strict';

/**
 * Copy webpack dist into the WordPress site package (one deploy tree):
 *   wp-content/site/js/    ← theme.js, island chunks, etc.
 *   wp-content/site/css/   ← theme.css (url(../fonts/…) → site/fonts)
 *   wp-content/site/fonts/ ← bootstrap-icons .woff2 / .woff
 *
 * SITE_ROOT=/path/to/wp-content/site node scripts/copy-site-build.js
 */

const fs = require('fs');
const path = require('path');

const webpackDir = path.resolve(__dirname, '..');
const distDir = path.join(webpackDir, 'dist');
const defaultSiteRoot = path.resolve(webpackDir, '../wp-content/site');
const siteRoot = process.env.SITE_ROOT
  ? path.resolve(process.env.SITE_ROOT)
  : defaultSiteRoot;

function copySubdir(name) {
  const from = path.join(distDir, name);
  const to = path.join(siteRoot, name);

  if (!fs.existsSync(from)) {
    console.warn(`[copy-site-build] skip: missing ${from} (run webpack first)`);
    return;
  }

  fs.mkdirSync(siteRoot, { recursive: true });
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
  console.log(`[copy-site-build] ${from} → ${to}`);
}

for (const dir of ['js', 'css', 'fonts']) {
  copySubdir(dir);
}

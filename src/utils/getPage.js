const fs = require('fs');
const path = require('path');

/**
 * Default disk cache dir (under webpack/.cache/, gitignored via webpack/.gitignore).
 */
function defaultCacheDir() {
  return path.join(__dirname, '../../.cache/blueprint-wp');
}

function cacheFilePath(slug, cacheDir) {
  const safe = String(slug).replace(/[^a-zA-Z0-9-_]/g, '_') || 'page';
  return path.join(cacheDir, `${safe}.json`);
}

function isCacheFresh(filePath, maxAgeMs) {
  if (maxAgeMs == null || maxAgeMs === Infinity) return true;
  const stat = fs.statSync(filePath);
  return Date.now() - stat.mtimeMs <= maxAgeMs;
}

/**
 * Fetch a Blueprint page payload from WordPress (REST: blueprint/v1/page/{slug}).
 *
 * @param {string} slug - Page slug (e.g. "about", "blog-2024")
 * @param {object} [options]
 * @param {string} [options.baseUrl] - Site origin, e.g. https://blueprint.test (no trailing slash)
 * @param {AbortSignal} [options.signal]
 * @param {boolean} [options.cache] - If true, read/write JSON under cacheDir (also on when BLUEPRINT_WP_CACHE=1)
 * @param {string} [options.cacheDir] - Override default ({webpack}/.cache/blueprint-wp)
 * @param {number} [options.cacheMaxAgeMs] - If set, refetch when file is older than this (omit = use cache until deleted)
 * @param {boolean} [options.forceRefresh] - Ignore cache and refetch
 * @returns {Promise<{ id: number, slug: string, title: string, template: string, sections: array }>}
 */
async function getPage(slug, options = {}) {
  const useCache =
    options.cache === true || process.env.BLUEPRINT_WP_CACHE === '1';
  const forceRefresh = options.forceRefresh === true;

  const cacheDir = options.cacheDir || defaultCacheDir();
  const cachePath = cacheFilePath(slug, cacheDir);
  const maxAgeMs = options.cacheMaxAgeMs;

  if (useCache && !forceRefresh && fs.existsSync(cachePath)) {
    try {
      if (isCacheFresh(cachePath, maxAgeMs)) {
        const raw = fs.readFileSync(cachePath, 'utf8');
        return JSON.parse(raw);
      }
    } catch {
      // fall through to network
    }
  }

  const baseUrl =
    options.baseUrl ||
    process.env.WP_URL ||
    process.env.WORDPRESS_URL ||
    '';

  if (!baseUrl) {
    throw new Error(
      'getPage: pass options.baseUrl or set WP_URL / WORDPRESS_URL'
    );
  }

  const origin = baseUrl.replace(/\/$/, '');
  const url = `${origin}/wp-json/blueprint/v1/page/${encodeURIComponent(slug)}`;

  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal: options.signal,
  });

  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (!res.ok) {
    const msg =
      typeof body === 'object' && body !== null && body.message
        ? body.message
        : String(body || res.statusText);
    const err = new Error(`getPage("${slug}"): ${res.status} ${msg}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  if (useCache) {
    try {
      fs.mkdirSync(cacheDir, { recursive: true });
      fs.writeFileSync(cachePath, JSON.stringify(body, null, 2), 'utf8');
    } catch {
      // ignore cache write failures
    }
  }

  return body;
}

module.exports = { getPage, defaultCacheDir, cacheFilePath };

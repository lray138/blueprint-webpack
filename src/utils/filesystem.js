const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

/** Same filename rules as getPage.js (keep in sync). */
function wpCacheFilePath(slug, cacheDir) {
    const safe = String(slug).replace(/[^a-zA-Z0-9-_]/g, '_') || 'page';
    return path.join(cacheDir, `${safe}.json`);
}

/** Try several roots: HtmlWebpackPlugin cwd is usually `webpack/`, but not always. */
function wpCacheDirCandidates() {
    const fromThisFile = path.resolve(__dirname, '../../.cache/blueprint-wp');
    return [
        fromThisFile,
        path.join(process.cwd(), '.cache', 'blueprint-wp'),
        path.join(process.cwd(), 'webpack', '.cache', 'blueprint-wp'),
    ];
}

// Function to recursively get all .ejs files (site pages)
const getSitePages = (dir) => {
    let results = [];

    const list = fs.readdirSync(dir);

    list.forEach((file) => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getSitePages(fullPath)); // Recurse into subdirectory
        } else if (file.endsWith('.ejs')) {
            results.push(fullPath); // Add .ejs file to results
        }
    });

    return results;
};

const readMarkdown = (filePath, callerDir = null) => {
    const srcRoot = path.resolve(__dirname, '..');

    let resolvedPath;

    if (filePath.startsWith('/')) {
        resolvedPath = path.join(srcRoot, filePath.slice(1));
    } else if (callerDir) {
        resolvedPath = path.resolve(callerDir, filePath);
    } else {
        resolvedPath = path.resolve(srcRoot, filePath);
    }

    try {
        const raw = fs.readFileSync(resolvedPath, 'utf8');
        return { content: marked.parse(raw) };
    } catch (err) {
        if (err.code === 'ENOENT') {
            return { content: `Markdown file not found: ${resolvedPath}` };
        }
        console.log(err);
        return { content: '' };
    }
};

/**
 * Sync-read a Blueprint page JSON from the same cache `getPage` / `npm run sync:wp` uses
 * (webpack/.cache/blueprint-wp/{slug}.json). Use in EJS during build.
 *
 * @param {string} slug - WordPress slug (e.g. "home")
 * @returns {object|null} Parsed payload or null if missing / unreadable
 */
function loadWpPageFromCache(slug) {
    const seen = new Set();
    for (const dir of wpCacheDirCandidates()) {
        if (seen.has(dir)) continue;
        seen.add(dir);
        const filePath = wpCacheFilePath(slug, dir);
        if (!fs.existsSync(filePath)) {
            continue;
        }
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch {
            /* try next candidate */
        }
    }
    return null;
}

module.exports = {
    getSitePages,
    readMarkdown,
    loadWpPageFromCache,
};
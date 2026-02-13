const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

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

module.exports = {
    getSitePages,
    readMarkdown
};
const escapeHtml = require('/blueprint/utils/escape-html');

function codeBlock(content, options) {
  const opts = options || {};
  const language = opts.language || 'html';
  const preClass = opts.preClass || 'mb-0 bg-light p-3 rounded';
  const codeClass = opts.codeClass || `language-${language}`;
  const shouldEscape = opts.escape !== false;
  const body = shouldEscape ? escapeHtml(content) : String(content);

  return `<pre class="${preClass}"><code class="${codeClass}">${body}</code></pre>`;
}

module.exports = codeBlock;

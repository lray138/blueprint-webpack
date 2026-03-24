/**
 * Map HtmlWebpackPlugin EJS path key (relative to blueprint/pages, no .ejs)
 * to a WordPress page slug for blueprint/v1/page/{slug}.
 *
 * Examples: index → home (or BLUEPRINT_WP_INDEX_SLUG), blog/index → blog
 */
function ejsPageNameToWpSlug(pageName) {
  if (pageName === 'index') {
    return process.env.BLUEPRINT_WP_INDEX_SLUG || 'home';
  }
  return pageName.replace(/\/index$/, '');
}

module.exports = { ejsPageNameToWpSlug };

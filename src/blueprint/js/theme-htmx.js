import htmx from 'htmx.org';

// Lazy island may load after DOMContentLoaded — scan for hx-* attributes.
if (typeof document !== 'undefined') {
  htmx.process(document.body);
}

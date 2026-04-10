import BigPicture from 'bigpicture';

const BP_PAGE_ICON_ID = 'bp_page_icon';

const BP_PAGE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>' +
  '<path d="M15 3h6v6"/><path d="M10 14 21 3"/>' +
  '</svg>';

function pageHrefFrom(el) {
  if (!el) return '';
  const d = el.dataset && el.dataset.pageHref;
  if (d != null && String(d).trim() !== '') return String(d).trim();
  const attr = el.getAttribute('data-page-href');
  return (attr || '').trim();
}

function pageLabelFrom(el) {
  if (!el) return 'Open full page';
  const d = el.dataset && el.dataset.pageLinkLabel;
  if (d != null && String(d).trim() !== '') return String(d).trim();
  const attr = el.getAttribute('data-page-link-label');
  const s = (attr || '').trim();
  return s || 'Open full page';
}

function syncPageIcon(triggerEl) {
  const root = document.getElementById('bp_container');
  if (!root || !triggerEl) return;

  const href = pageHrefFrom(triggerEl);
  let link = root.querySelector('#' + BP_PAGE_ICON_ID);

  if (link && !root.contains(link)) {
    link.remove();
    link = null;
  }

  if (!href) {
    if (link) link.remove();
    return;
  }

  if (!link) {
    link = document.createElement('a');
    link.id = BP_PAGE_ICON_ID;
    link.className = 'bp-page-icon';
    link.innerHTML = BP_PAGE_ICON_SVG;
    link.addEventListener('click', function (e) {
      e.stopPropagation();
    });
    root.appendChild(link);
  }

  link.href = href;
  link.setAttribute('aria-label', pageLabelFrom(triggerEl));
  link.title = pageLabelFrom(triggerEl);
  root.appendChild(link);
}

function bindToggles() {
  document.querySelectorAll('[data-bigpicture]').forEach(function (toggle) {
    if (toggle.dataset.bpPageBound === '1') return;
    toggle.dataset.bpPageBound = '1';

    toggle.addEventListener('click', function (e) {
      e.preventDefault();

      const elementOptions = JSON.parse(toggle.dataset.bigpicture);
      const userAnimationStart = elementOptions.animationStart;
      const userAnimationEnd = elementOptions.animationEnd;
      const userOnChangeImage = elementOptions.onChangeImage;

      const options = {
        el: toggle,
        noLoader: true,
        overlayColor: 'rgb(14, 14, 16)',
        ...elementOptions,
        animationStart: function () {
          if (typeof userAnimationStart === 'function') userAnimationStart();
          syncPageIcon(toggle);
        },
        animationEnd: function () {
          if (typeof userAnimationEnd === 'function') userAnimationEnd();
          syncPageIcon(toggle);
        },
        onChangeImage: function (pair) {
          if (typeof userOnChangeImage === 'function') userOnChangeImage(pair);
          const meta = pair && pair[1];
          syncPageIcon(meta && meta.el ? meta.el : toggle);
        },
      };

      BigPicture(options);
      syncPageIcon(toggle);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bindToggles);
} else {
  bindToggles();
}

window.BigPicture = BigPicture;

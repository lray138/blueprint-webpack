import BigPicture from 'bigpicture';

const BP_PAGE_ICON_ID = 'bp_page_icon';

// stroke="#fff" avoids empty glyphs when `currentColor` resolves wrong on the overlay.
const BP_PAGE_ICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.92)" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="overflow:visible">' +
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

function layoutBpPageIcon(link) {
  if (!link) return;
  const mobile = typeof window.matchMedia === 'function' && window.matchMedia('(max-width: 600px)').matches;

  function set(name, value) {
    link.style.setProperty(name, value, 'important');
  }

  set('position', 'absolute');
  set('z-index', '500000');
  set('display', 'flex');
  set('align-items', 'center');
  set('justify-content', 'center');
  set('pointer-events', 'auto');
  set('visibility', 'visible');
  set('opacity', '1');
  set('top', 'auto');
  set('margin', '0');
  set('padding', '6px');
  set('box-sizing', 'border-box');
  set('isolation', 'isolate');
  set('-webkit-backface-visibility', 'hidden');
  set('backface-visibility', 'hidden');
  set('filter', 'drop-shadow(0 0 2px rgba(0,0,0,0.85))');

  if (mobile) {
    set('left', '50%');
    set('right', 'auto');
    set('transform', 'translate3d(-50%, 0, 0)');
    set('bottom', 'calc(10px + env(safe-area-inset-bottom, 0px))');
  } else {
    set('left', 'auto');
    set('right', 'calc(10px + env(safe-area-inset-right, 0px))');
    set('transform', 'translate3d(0, 0, 0)');
    set('bottom', 'calc(10px + env(safe-area-inset-bottom, 0px))');
  }

  var svg = link.querySelector('svg');
  if (svg) {
    svg.style.setProperty('pointer-events', 'auto', 'important');
    svg.style.setProperty('cursor', 'pointer', 'important');
    svg.style.setProperty('filter', 'none', 'important');
    svg.style.setProperty('overflow', 'visible', 'important');
  }
}

var bpLayoutResizeBound = false;

function bindLayoutResize() {
  if (bpLayoutResizeBound) return;
  bpLayoutResizeBound = true;
  var t = null;
  window.addEventListener('resize', function () {
    if (t) clearTimeout(t);
    t = setTimeout(function () {
      var root = document.getElementById('bp_container');
      var link = document.getElementById(BP_PAGE_ICON_ID);
      if (root && link && root.contains(link)) layoutBpPageIcon(link);
    }, 100);
  });
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
    bindLayoutResize();
  }

  link.href = href;
  link.setAttribute('aria-label', pageLabelFrom(triggerEl));
  link.title = pageLabelFrom(triggerEl);
  layoutBpPageIcon(link);
  root.appendChild(link);
}

function openBigPictureFromToggle(toggle) {
  var raw = toggle.getAttribute('data-bigpicture') || '{}';
  var elementOptions = {};
  try {
    elementOptions = JSON.parse(raw);
  } catch (err) {
    console.warn('bigpicture: invalid data-bigpicture JSON', err);
    elementOptions = {};
  }

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
  requestAnimationFrame(function () {
    syncPageIcon(toggle);
    requestAnimationFrame(function () {
      syncPageIcon(toggle);
    });
  });
  [50, 200, 450, 900].forEach(function (ms) {
    setTimeout(function () {
      syncPageIcon(toggle);
    }, ms);
  });
}

// Capture phase + delegation: survives Muuri reparenting and avoids missing per-node listeners.
function onBigPictureCaptureClick(e) {
  if (e.button !== 0) return;
  var toggle = e.target.closest('[data-bigpicture]');
  if (!toggle) return;

  var container = document.getElementById('bp_container');
  if (container && container.contains(toggle)) return;

  e.preventDefault();
  openBigPictureFromToggle(toggle);
}

document.addEventListener('click', onBigPictureCaptureClick, true);

window.BigPicture = BigPicture;

import "../scss/theme.scss";

//import "./components/theme-switcher.js";
import "./components/jump-to.js";
import "./components/accordion-docs.js";

import "./vendor/bigpicture";
import * as jfp from "./lray138fp.min.js";

//import 'bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle';  // Includes Popper


import Flickity from 'flickity';

// Make available globally
window.Flickity = Flickity;

document.documentElement.setAttribute('data-bs-theme', 'light');
localStorage.removeItem('theme');

import "./vendor/css-scope-inline.js";
import "./contact-form.js";

window.jfp = jfp;

// scripts.js
const get = (endpoint, acceptHeader = 'json', data, success_callback) => {
  var xhr = new XMLHttpRequest();
  var url = new URL(endpoint);

  const mimeTypes = {
    'html': 'text/html',
    'json': 'application/json',
  };

  const resolvedAcceptHeader = mimeTypes[acceptHeader] || acceptHeader;

  // Append data to the URL if provided
  if (data) {
    Object.keys(data).forEach(key => {
      url.searchParams.append(key, data[key]);
    });
  }

  xhr.open('GET', url.toString(), true);

  // Set the Accept header if provided
  if (resolvedAcceptHeader) {
    xhr.setRequestHeader('Accept', resolvedAcceptHeader);
  }

  xhr.send();

  xhr.onload = function () {
    if (xhr.status == 200) {
      var responseData;

      // Parse the response based on the content type
      if (xhr.getResponseHeader('Content-Type').includes('application/json')) {
        responseData = JSON.parse(xhr.responseText);
      } else {
        responseData = xhr.responseText;
      }

      if(success_callback) {
        success_callback(responseData);
      } else {
        console.log('no success callback provided');
      }
      
      //console.log('Response:', responseData);
    } else {
      console.error('Request failed. Status:', xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error('Request failed. Network error.');
  };
}

const post = (endpoint, acceptHeader = 'json', data, success_callback) => {
  var xhr = new XMLHttpRequest();
  var url = new URL(endpoint);

  const mimeTypes = {
    'html': 'text/html',
    'json': 'application/json',
  };

  const resolvedAcceptHeader = mimeTypes[acceptHeader] || acceptHeader;

  xhr.open('POST', url.toString(), true);

  // Set the Accept header if provided
  if (resolvedAcceptHeader) {
    xhr.setRequestHeader('Accept', resolvedAcceptHeader);
  }

  // Set the Content-Type header for POST requests
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

  // Prepare the request body if data is provided
  var requestBody = '';
  if (data) {
    Object.keys(data).forEach(key => {
      if (requestBody !== '') {
        requestBody += '&';
      }
      requestBody += encodeURIComponent(key) + '=' + encodeURIComponent(data[key]);
    });
  }

  xhr.send(requestBody);

  xhr.onload = function () {
    if (xhr.status == 200) {
      var responseData;

      // Parse the response based on the content type
      if (xhr.getResponseHeader('Content-Type').includes('application/json')) {
        responseData = JSON.parse(xhr.responseText);
      } else {
        responseData = xhr.responseText;
      }

      success_callback(responseData);
    } else {
      console.error('Request failed. Status:', xhr.status);
    }
  };

  xhr.onerror = function () {
    console.error('Request failed. Network error.');
  };
}

window.post = post;
window.get = get;


(function () {

    if (!document.body.classList.contains('bp-edit')) return;

    function getPostId() {
        return document.body?.dataset?.postId || null;
    }

    function getAdminUrl() {
        return document.body?.dataset?.adminUrl || null;
    }

    function buildEditUrl(el, bpId) {
        const adminUrl = getAdminUrl();
        if (!adminUrl || !bpId) return null;

        const postId =
            el?.dataset?.postId ||
            getPostId();

        if (!postId) return null;

        const url = new URL('post.php', adminUrl);
        url.searchParams.set('post', postId);
        url.searchParams.set('action', 'edit');
        url.searchParams.set('bp_edit', bpId);

        return url.toString();
    }

    function normalizeEditUrls() {
        document.querySelectorAll('[data-bp-id]').forEach(function (el) {

            if (el.dataset.bpEditUrl) return;

            const bpId = el.dataset.bpId;

            // Skip empty or whitespace bp_id
            if (!bpId || !bpId.trim()) return;

            const url = buildEditUrl(el, bpId);

            if (url) {
                el.dataset.bpEditUrl = url;
            }

        });
    }

    function ensureButton(el) {
        let btn = el.querySelector(':scope > .bp-edit-button');
        if (btn) return btn;

        const url = el.dataset.bpEditUrl;
        if (!url) return null;

        btn = document.createElement('a');
        btn.className = 'bp-edit-button';
        btn.href = url;
        btn.target = '_blank';
        btn.rel = 'noopener';
        btn.textContent = 'Edit';
        btn.style.display = 'none';

        const position = el.dataset.bpEditPosition === 'left' ? 'left' : 'right';
        btn.classList.add(position === 'left' ? 'is-left' : 'is-right');

        el.appendChild(btn);

        return btn;
    }

    function deactivateAll() {
        document.querySelectorAll('.bp-edit-active').forEach(function (el) {
            deactivate(el);
        });
    }

    function activate(el) {
        if (!el) return;

        deactivateAll();

        el.classList.add('bp-edit-active');

        const btn = ensureButton(el);
        if (btn) btn.style.display = '';
    }

    function deactivate(el) {
        if (!el) return;

        el.classList.remove('bp-edit-active');

        const btn = el.querySelector(':scope > .bp-edit-button');
        if (btn) btn.style.display = 'none';
    }

    document.addEventListener('mouseover', function (e) {
        const el = e.target.closest('[data-bp-edit-url]');
        if (!el) return;

        const fromEl = e.relatedTarget?.closest?.('[data-bp-edit-url]');
        if (fromEl === el) return;

        activate(el);
    });

    document.addEventListener('mouseout', function (e) {
        const el = e.target.closest('[data-bp-edit-url]');
        if (!el) return;

        const toEl = e.relatedTarget?.closest?.('[data-bp-edit-url]');
        if (toEl === el) return;

        deactivate(el);
    });

    window.addEventListener('blur', function () {
        deactivateAll();
    });

    normalizeEditUrls();

})();
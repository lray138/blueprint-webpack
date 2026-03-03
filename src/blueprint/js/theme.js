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
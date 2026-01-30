import "../scss/theme.scss";

//import "./components/theme-switcher.js";
import "./components/jump-to.js";
import "./components/accordion-docs.js";

import "./vendor/bigpicture";

//import 'bootstrap';
import 'bootstrap/dist/js/bootstrap.bundle';  // Includes Popper



import Flickity from 'flickity';

// Make available globally
window.Flickity = Flickity;

document.documentElement.setAttribute('data-bs-theme', 'light');
localStorage.removeItem('theme');

import "./vendor/css-scope-inline.js";
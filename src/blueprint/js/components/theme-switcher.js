/**
 * Bootstrap 5 Theme Switcher
 * Supports Light, Dark, and Auto (system preference) modes
 */

(function() {
  'use strict';

  const getStoredTheme = () => localStorage.getItem('theme');
  const setStoredTheme = theme => localStorage.setItem('theme', theme);

  const getPreferredTheme = () => {
    const storedTheme = getStoredTheme();
    if (storedTheme) {
      return storedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const setTheme = theme => {
    if (theme === 'auto') {
      document.documentElement.setAttribute(
        'data-bs-theme',
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      );
    } else {
      document.documentElement.setAttribute('data-bs-theme', theme);
    }
    setStoredTheme(theme);
  };

  const setActiveTheme = (theme, focus = false) => {
    const themeSwitcher = document.querySelector('#bd-theme');
    if (!themeSwitcher) return;

    const activeThemeIcon = themeSwitcher.querySelector('.theme-icon-active use');
    const btnToActive = document.querySelector(`[data-bs-theme-value="${theme}"]`);
    const svgOfActiveBtn = btnToActive?.querySelector('svg use')?.getAttribute('href');

    // Update all buttons
    document.querySelectorAll('[data-bs-theme-value]').forEach(element => {
      element.classList.remove('active');
      element.setAttribute('aria-pressed', 'false');
      const checkIcon = element.querySelector('.bi.ms-auto');
      if (checkIcon) {
        checkIcon.classList.add('d-none');
      }
    });

    // Set active button
    if (btnToActive) {
      btnToActive.classList.add('active');
      btnToActive.setAttribute('aria-pressed', 'true');
      const checkIcon = btnToActive.querySelector('.bi.ms-auto');
      if (checkIcon) {
        checkIcon.classList.remove('d-none');
      }
    }

    // Update dropdown button icon
    if (activeThemeIcon && svgOfActiveBtn) {
      activeThemeIcon.setAttribute('href', svgOfActiveBtn);
    }

    // Update aria-label
    const themeLabel = theme === 'auto' 
      ? `Toggle theme (system)` 
      : `Toggle theme (${theme})`;
    themeSwitcher.setAttribute('aria-label', themeLabel);

    if (focus) {
      themeSwitcher.focus();
    }
  };

  // Set theme on page load
  setTheme(getPreferredTheme());
  setActiveTheme(getPreferredTheme());

  // Handle theme button clicks
  window.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('[data-bs-theme-value]').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const theme = toggle.getAttribute('data-bs-theme-value');
        setStoredTheme(theme);
        setTheme(theme);
        setActiveTheme(theme, true);
      });
    });

    // Listen for system theme changes (for auto mode)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      const storedTheme = getStoredTheme();
      if (storedTheme === 'auto' || !storedTheme) {
        setTheme(getPreferredTheme());
      }
    });
  });
})();


/**
 * Mobile Navigation Toggle, Active Page Detection & Dark Mode
 */

document.addEventListener('DOMContentLoaded', () => {
  const navToggle = document.querySelector('.nav-toggle');
  const siteNav = document.querySelector('.site-nav');
  const darkModeToggle = document.querySelector('.dark-mode-toggle');

  // Set active class on current page nav link
  const currentPath = window.location.pathname;
  const navLinks = document.querySelectorAll('.site-nav a');

  navLinks.forEach(link => {
    const linkPath = new URL(link.href).pathname;
    if (linkPath === currentPath ||
        (currentPath === '/' && linkPath === '/index.html')) {
      link.classList.add('active');
    }
  });

  // Add home-page class to body on home page
  if (currentPath === '/' || currentPath === '/index.html') {
    document.body.classList.add('home-page');
  }

  // Dark Mode Toggle
  const darkModePreference = localStorage.getItem('darkMode');

  // Apply saved preference or default to light mode
  if (darkModePreference === 'enabled') {
    document.body.classList.add('dark-mode');
  }

  if (darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');

      // Save preference
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
      } else {
        localStorage.setItem('darkMode', 'disabled');
      }
    });
  }

  if (navToggle && siteNav) {
    navToggle.addEventListener('click', () => {
      siteNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded',
        siteNav.classList.contains('open')
      );
    });

    // Close nav when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.site-header')) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Close nav on escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && siteNav.classList.contains('open')) {
        siteNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
});

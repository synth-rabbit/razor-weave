document.addEventListener('DOMContentLoaded', () => {
  // TOC Toggle for mobile
  const tocToggle = document.querySelector('.toc-toggle');
  const toc = document.querySelector('.reader-toc');
  const content = document.querySelector('.reader-content');

  if (tocToggle && toc) {
    tocToggle.addEventListener('click', () => {
      toc.classList.toggle('open');
      tocToggle.textContent = toc.classList.contains('open')
        ? 'Close Menu'
        : 'Table of Contents';
    });

    // Close TOC when clicking outside on mobile
    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 &&
          toc.classList.contains('open') &&
          !toc.contains(e.target) &&
          !tocToggle.contains(e.target)) {
        toc.classList.remove('open');
        tocToggle.textContent = 'Table of Contents';
      }
    });

    // Close TOC when clicking a link on mobile
    if (window.innerWidth <= 768) {
      toc.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toc.classList.remove('open');
          tocToggle.textContent = 'Table of Contents';
        });
      });
    }
  }

  // Active section highlighting
  const tocLinks = document.querySelectorAll('.toc-list a');
  const sections = document.querySelectorAll('.reader-content section[id], .reader-content h2[id], .reader-content h3[id]');

  function updateActiveSection() {
    let current = '';
    const scrollPosition = window.scrollY + 100;

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;

      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });

    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent && current) {
      const activeLink = document.querySelector(`.toc-list a[href="#${current}"], .toc-root a[href="#${current}"]`);
      if (activeLink) {
        breadcrumbCurrent.textContent = activeLink.textContent;
      }
    }
  }

  if (sections.length > 0) {
    window.addEventListener('scroll', updateActiveSection);
    updateActiveSection(); // Initial call
  }

  // Smooth scroll polyfill for older browsers
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });
});

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

  // Reading Progress Bar
  const progressBar = document.querySelector('.reading-progress-bar');

  function updateReadingProgress() {
    if (!progressBar) return;

    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;

    // Calculate percentage scrolled
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;

    // Update progress bar width
    progressBar.style.width = Math.min(scrollPercent, 100) + '%';
  }

  if (progressBar) {
    window.addEventListener('scroll', updateReadingProgress);
    window.addEventListener('resize', updateReadingProgress);
    updateReadingProgress(); // Initial call
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

  // Chapter Navigation (Prev/Next buttons)
  function insertChapterNavigation() {
    const readerContent = document.querySelector('.reader-content');
    if (!readerContent) return;

    // Find all H2 chapter headings
    const chapters = Array.from(readerContent.querySelectorAll('h2[id]'));
    if (chapters.length === 0) return;

    chapters.forEach((chapter, index) => {
      // Find the next H2 or end of content
      let nextElement = chapter.nextElementSibling;
      let insertPoint = null;

      // Walk through siblings until we find the next H2 or run out
      while (nextElement) {
        if (nextElement.tagName === 'H2') {
          // Found next chapter, insert before it
          insertPoint = nextElement;
          break;
        }
        nextElement = nextElement.nextElementSibling;
      }

      // If no next H2 found, we're at the last chapter
      if (!insertPoint && index === chapters.length - 1) {
        // Don't add nav after last chapter
        return;
      }

      // Create navigation element
      const nav = document.createElement('nav');
      nav.className = 'chapter-nav';
      nav.setAttribute('aria-label', 'Chapter navigation');

      // Previous button
      if (index > 0) {
        const prevChapter = chapters[index - 1];
        const prevBtn = document.createElement('a');
        prevBtn.href = '#' + prevChapter.id;
        prevBtn.className = 'chapter-nav-btn prev';
        prevBtn.textContent = prevChapter.textContent;
        prevBtn.setAttribute('aria-label', 'Previous chapter: ' + prevChapter.textContent);
        nav.appendChild(prevBtn);
      } else {
        // Spacer to push next button to the right
        const spacer = document.createElement('div');
        spacer.className = 'chapter-nav-spacer';
        nav.appendChild(spacer);
      }

      // Next button
      if (index < chapters.length - 1) {
        const nextChapter = chapters[index + 1];
        const nextBtn = document.createElement('a');
        nextBtn.href = '#' + nextChapter.id;
        nextBtn.className = 'chapter-nav-btn next';
        nextBtn.textContent = nextChapter.textContent;
        nextBtn.setAttribute('aria-label', 'Next chapter: ' + nextChapter.textContent);
        nav.appendChild(nextBtn);
      }

      // Insert the navigation
      if (insertPoint) {
        insertPoint.parentNode.insertBefore(nav, insertPoint);
      } else if (nextElement) {
        // Insert after the last sibling before the next chapter
        nextElement.parentNode.insertBefore(nav, nextElement);
      }
    });
  }

  insertChapterNavigation();
});

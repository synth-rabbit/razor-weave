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
  const tocLinks = document.querySelectorAll('.toc-root a, .toc-list a');
  const sections = document.querySelectorAll('.reader-content section[id], .reader-content h2[id], .reader-content h3[id]');

  let previousActiveId = '';

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

    // Only update if the active section has actually changed
    if (current === previousActiveId) {
      return;
    }

    previousActiveId = current;

    let activeLink = null;
    tocLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
        activeLink = link;
      }
    });

    // Auto-scroll TOC to keep active link visible
    if (activeLink) {
      const tocContainer = document.querySelector('.reader-toc');
      if (tocContainer && !tocContainer.classList.contains('open')) {
        // Only auto-scroll if not in mobile drawer mode
        const linkTop = activeLink.offsetTop;
        const linkHeight = activeLink.offsetHeight;
        const containerHeight = tocContainer.clientHeight;
        const containerScroll = tocContainer.scrollTop;

        // Check if link is out of view
        if (linkTop < containerScroll || linkTop + linkHeight > containerScroll + containerHeight) {
          // Scroll to center the active link
          tocContainer.scrollTo({
            top: linkTop - (containerHeight / 2) + (linkHeight / 2),
            behavior: 'smooth'
          });
        }
      }
    }

    // Update breadcrumb
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent && current) {
      const breadcrumbLink = document.querySelector(`.toc-list a[href="#${current}"], .toc-root a[href="#${current}"]`);
      if (breadcrumbLink) {
        breadcrumbCurrent.textContent = breadcrumbLink.textContent;
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

  // Quick Jump Modal (Ctrl+K)
  const quickJumpModal = document.getElementById('quickJumpModal');
  const quickJumpSearch = document.getElementById('quickJumpSearch');
  const quickJumpResults = document.getElementById('quickJumpResults');

  if (quickJumpModal && quickJumpSearch && quickJumpResults) {
    // Build search index from TOC
    const searchIndex = [];
    const tocLinks = document.querySelectorAll('.toc-root a, .toc-list a');

    tocLinks.forEach(link => {
      const href = link.getAttribute('href');
      const text = link.textContent.trim();

      // Build path (parent sections)
      let path = [];
      let parent = link.closest('li')?.parentElement?.closest('li');
      while (parent) {
        const parentLink = parent.querySelector(':scope > a');
        if (parentLink) {
          path.unshift(parentLink.textContent.trim());
        }
        parent = parent.parentElement?.closest('li');
      }

      searchIndex.push({
        title: text,
        path: path.join(' › '),
        href: href
      });
    });

    let selectedIndex = 0;

    // Open modal with Ctrl+K / Cmd+K
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        openQuickJump();
      }

      // Close with Escape
      if (e.key === 'Escape' && quickJumpModal.classList.contains('open')) {
        closeQuickJump();
      }
    });

    function openQuickJump() {
      quickJumpModal.classList.add('open');
      quickJumpSearch.value = '';
      quickJumpSearch.focus();
      selectedIndex = 0;
      renderResults(searchIndex);
    }

    function closeQuickJump() {
      quickJumpModal.classList.remove('open');
      quickJumpSearch.blur();
    }

    // Click outside to close
    quickJumpModal.addEventListener('click', (e) => {
      if (e.target === quickJumpModal) {
        closeQuickJump();
      }
    });

    // Search input
    quickJumpSearch.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      selectedIndex = 0;

      if (query === '') {
        renderResults(searchIndex);
      } else {
        const filtered = searchIndex.filter(item => {
          return item.title.toLowerCase().includes(query) ||
                 item.path.toLowerCase().includes(query);
        });
        renderResults(filtered);
      }
    });

    // Keyboard navigation
    quickJumpSearch.addEventListener('keydown', (e) => {
      const results = quickJumpResults.querySelectorAll('.quick-jump-result');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
        updateSelection();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateSelection();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          const href = selected.dataset.href;
          navigateToSection(href);
          closeQuickJump();
        }
      }
    });

    function renderResults(results) {
      if (results.length === 0) {
        quickJumpResults.innerHTML = '<li class="quick-jump-empty">No results found</li>';
        return;
      }

      quickJumpResults.innerHTML = results.map((item, index) => `
        <li class="quick-jump-result ${index === selectedIndex ? 'selected' : ''}"
            data-href="${item.href}"
            data-index="${index}">
          <div class="quick-jump-result-title">${item.title}</div>
          ${item.path ? `<div class="quick-jump-result-path">${item.path}</div>` : ''}
        </li>
      `).join('');

      // Add click handlers
      quickJumpResults.querySelectorAll('.quick-jump-result').forEach(result => {
        result.addEventListener('click', () => {
          const href = result.dataset.href;
          navigateToSection(href);
          closeQuickJump();
        });

        result.addEventListener('mouseenter', () => {
          selectedIndex = parseInt(result.dataset.index);
          updateSelection();
        });
      });
    }

    function updateSelection() {
      const results = quickJumpResults.querySelectorAll('.quick-jump-result');
      results.forEach((result, index) => {
        if (index === selectedIndex) {
          result.classList.add('selected');
          result.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        } else {
          result.classList.remove('selected');
        }
      });
    }

    function navigateToSection(href) {
      if (!href || !href.startsWith('#')) return;

      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });

        // Update URL hash
        history.pushState(null, null, href);
      }
    }
  }
});

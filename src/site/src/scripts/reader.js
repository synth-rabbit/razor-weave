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
  // Only track section/header elements that match TOC links (ch-XX- pattern)
  const sections = document.querySelectorAll('.reader-content section[id^="ch-"], .reader-content section[id^="part-"], .reader-content header[id^="ch-"]');

  let previousActiveId = '';
  let previousActiveLink = null;

  function updateActiveSection() {
    const scrollPosition = window.scrollY + 150;
    let current = '';
    let closestDistance = Infinity;

    // Find the section closest to the top of the viewport
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const distance = Math.abs(scrollPosition - sectionTop);

      if (scrollPosition >= sectionTop && distance < closestDistance) {
        closestDistance = distance;
        current = section.getAttribute('id');
      }
    });

    // Fallback to first section if nothing found
    if (!current && sections.length > 0) {
      current = sections[0].getAttribute('id');
    }

    // Only update if the active section has actually changed
    if (current === previousActiveId) {
      return;
    }

    previousActiveId = current;

    // Find new active link
    const newActiveLink = document.querySelector(`.toc-list a[href="#${current}"], .toc-root a[href="#${current}"]`);

    // Only touch the 2 links that changed, not all 100+
    if (previousActiveLink) {
      previousActiveLink.classList.remove('active');
    }
    if (newActiveLink) {
      newActiveLink.classList.add('active');
      previousActiveLink = newActiveLink;

      // Auto-scroll TOC to keep active link visible
      const tocContainer = document.querySelector('.reader-toc');
      if (tocContainer && !tocContainer.classList.contains('open')) {
        // Only auto-scroll if not in mobile drawer mode
        const linkTop = newActiveLink.offsetTop;
        const linkHeight = newActiveLink.offsetHeight;
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

  // Throttled scroll handler using requestAnimationFrame
  // Combines both TOC highlighting and progress bar updates
  let rafScheduled = false;

  function handleScroll() {
    if (rafScheduled) return;
    rafScheduled = true;

    requestAnimationFrame(() => {
      updateActiveSection();
      updateReadingProgress();
      rafScheduled = false;
    });
  }

  if (sections.length > 0 || progressBar) {
    window.addEventListener('scroll', handleScroll);
    updateActiveSection(); // Initial call
    updateReadingProgress(); // Initial call
  }

  if (progressBar) {
    window.addEventListener('resize', updateReadingProgress);
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
  const breadcrumbSearchBtn = document.getElementById('breadcrumbSearchBtn');

  if (quickJumpModal && quickJumpSearch && quickJumpResults) {
    // Build comprehensive search index from page content
    const searchIndex = [];
    const readerContent = document.querySelector('.reader-content');

    // Get all sections and headings with IDs
    const sections = readerContent.querySelectorAll('section[id], header[id], h1[id], h2[id], h3[id], h4[id]');

    sections.forEach(section => {
      const id = section.getAttribute('id');
      if (!id) return;

      const href = '#' + id;

      // Get the heading text
      let title = '';
      if (section.tagName.match(/^H[1-6]$/)) {
        title = section.textContent.trim();
      } else {
        const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
        title = heading ? heading.textContent.trim() : id.replace(/-/g, ' ');
      }

      // Extract text content from this section (limit to avoid huge strings)
      let content = '';
      if (section.tagName === 'SECTION') {
        // Get first few paragraphs of content
        const paragraphs = Array.from(section.querySelectorAll('p, li'))
          .slice(0, 5)
          .map(p => p.textContent.trim())
          .join(' ');
        content = paragraphs.substring(0, 300); // Limit to 300 chars
      }

      // Find parent section for path
      let path = [];
      const tocLink = document.querySelector(`.toc-root a[href="#${id}"], .toc-list a[href="#${id}"]`);
      if (tocLink) {
        let parent = tocLink.closest('li')?.parentElement?.closest('li');
        while (parent) {
          const parentLink = parent.querySelector(':scope > a');
          if (parentLink) {
            path.unshift(parentLink.textContent.trim());
          }
          parent = parent.parentElement?.closest('li');
        }
      }

      searchIndex.push({
        title: title,
        path: path.join(' › '),
        content: content,
        href: href
      });
    });

    // Initialize Fuse.js with fuzzy search configuration
    const fuse = new Fuse(searchIndex, {
      keys: [
        { name: 'title', weight: 2 },      // Title is most important
        { name: 'path', weight: 1 },       // Path is secondary
        { name: 'content', weight: 0.5 }   // Content is tertiary
      ],
      threshold: 0.4, // 0 = exact match, 1 = match anything
      distance: 100,
      minMatchCharLength: 2,
      includeScore: true,
      ignoreLocation: true  // Search entire string, not just beginning
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

    // Add click handler for breadcrumb search button
    if (breadcrumbSearchBtn) {
      breadcrumbSearchBtn.addEventListener('click', openQuickJump);
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

    // Search input with fuzzy search
    quickJumpSearch.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      selectedIndex = 0;

      if (query === '') {
        renderResults(searchIndex);
      } else {
        // Use Fuse.js for fuzzy search
        const results = fuse.search(query);
        const filtered = results.map(result => result.item);
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

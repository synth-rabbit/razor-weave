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

  // ============================================================================
  // BOOKMARKING SYSTEM
  // ============================================================================

  const BOOKMARKS_KEY = 'razorweave-bookmarks';
  const MAX_BOOKMARKS = 10;

  // Get bookmarks from localStorage
  function getBookmarks() {
    try {
      const stored = localStorage.getItem(BOOKMARKS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error loading bookmarks:', e);
      return [];
    }
  }

  // Save bookmarks to localStorage
  function saveBookmarks(bookmarks) {
    try {
      localStorage.setItem(BOOKMARKS_KEY, JSON.stringify(bookmarks));
    } catch (e) {
      console.error('Error saving bookmarks:', e);
    }
  }

  // Check if section is bookmarked
  function isBookmarked(sectionId) {
    const bookmarks = getBookmarks();
    return bookmarks.some(b => b.id === sectionId);
  }

  // Add bookmark button to headings
  function addBookmarkButtons() {
    const headings = document.querySelectorAll('.reader-content h2[id], .reader-content h3[id]');

    headings.forEach(heading => {
      const sectionId = heading.getAttribute('id');
      if (!sectionId) return;

      const button = document.createElement('button');
      button.className = 'bookmark-btn';
      button.setAttribute('aria-label', 'Bookmark this section');
      button.setAttribute('data-section-id', sectionId);
      button.title = 'Bookmark this section';

      // Set initial state
      if (isBookmarked(sectionId)) {
        button.classList.add('bookmarked');
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
      } else {
        button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
      }

      button.addEventListener('click', (e) => {
        e.preventDefault();
        toggleBookmark(sectionId, heading.textContent.trim(), button);
      });

      heading.appendChild(button);
    });
  }

  // Toggle bookmark
  function toggleBookmark(sectionId, title, button) {
    let bookmarks = getBookmarks();
    const existing = bookmarks.findIndex(b => b.id === sectionId);

    if (existing !== -1) {
      // Remove bookmark
      bookmarks.splice(existing, 1);
      button.classList.remove('bookmarked');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
    } else {
      // Add bookmark
      if (bookmarks.length >= MAX_BOOKMARKS) {
        alert(`Maximum ${MAX_BOOKMARKS} bookmarks allowed. Remove one to add another.`);
        return;
      }

      bookmarks.push({
        id: sectionId,
        title: title,
        timestamp: Date.now()
      });

      button.classList.add('bookmarked');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
    }

    saveBookmarks(bookmarks);
    updateBookmarksDropdown();
  }

  // Create bookmarks dropdown in breadcrumb
  function createBookmarksDropdown() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const separator = document.createElement('span');
    separator.className = 'breadcrumb-separator';
    separator.textContent = '|';

    const dropdown = document.createElement('div');
    dropdown.className = 'bookmarks-dropdown';
    dropdown.innerHTML = `
      <button class="bookmarks-toggle breadcrumb-icon-btn" aria-label="My Bookmarks" title="Bookmarks">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>
        <span class="bookmarks-count">0</span>
      </button>
      <div class="bookmarks-menu" id="bookmarksMenu">
        <div class="bookmarks-header">
          <h3>My Bookmarks</h3>
        </div>
        <ul class="bookmarks-list" id="bookmarksList"></ul>
      </div>
    `;

    // Append to breadcrumb
    breadcrumb.appendChild(separator);
    breadcrumb.appendChild(dropdown);

    const toggle = dropdown.querySelector('.bookmarks-toggle');
    const menu = dropdown.querySelector('.bookmarks-menu');

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
    });

    // Close when clicking outside
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        menu.classList.remove('open');
      }
    });

    updateBookmarksDropdown();
  }

  // Update bookmarks dropdown content
  function updateBookmarksDropdown() {
    const bookmarksList = document.getElementById('bookmarksList');
    const bookmarksCount = document.querySelector('.bookmarks-count');
    if (!bookmarksList || !bookmarksCount) return;

    const bookmarks = getBookmarks();
    bookmarksCount.textContent = bookmarks.length;

    if (bookmarks.length === 0) {
      bookmarksList.innerHTML = '<li class="bookmarks-empty">No bookmarks yet</li>';
      return;
    }

    bookmarksList.innerHTML = bookmarks.map(bookmark => `
      <li class="bookmark-item">
        <a href="#${bookmark.id}" class="bookmark-link">
          ${bookmark.title}
        </a>
        <button class="bookmark-remove" data-id="${bookmark.id}" aria-label="Remove bookmark">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </li>
    `).join('');

    // Add remove handlers
    bookmarksList.querySelectorAll('.bookmark-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const sectionId = btn.dataset.id;
        removeBookmark(sectionId);
      });
    });

    // Close dropdown when clicking bookmark link
    bookmarksList.querySelectorAll('.bookmark-link').forEach(link => {
      link.addEventListener('click', () => {
        document.querySelector('.bookmarks-menu')?.classList.remove('open');
      });
    });
  }

  // Remove bookmark
  function removeBookmark(sectionId) {
    let bookmarks = getBookmarks();
    bookmarks = bookmarks.filter(b => b.id !== sectionId);
    saveBookmarks(bookmarks);
    updateBookmarksDropdown();

    // Update button if visible
    const button = document.querySelector(`.bookmark-btn[data-section-id="${sectionId}"]`);
    if (button) {
      button.classList.remove('bookmarked');
      button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>';
    }
  }

  // Initialize bookmarking
  if (document.querySelector('.reader-content')) {
    addBookmarkButtons();
    createBookmarksDropdown();
  }

  // ============================================================================
  // READER MODE (Distraction-Free)
  // ============================================================================

  const READER_MODE_KEY = 'razorweave-reader-mode';

  // Get reader mode preference
  function getReaderMode() {
    return localStorage.getItem(READER_MODE_KEY) === 'true';
  }

  // Save reader mode preference
  function setReaderMode(enabled) {
    localStorage.setItem(READER_MODE_KEY, enabled.toString());
  }

  // Create reader mode toggle
  function createReaderModeToggle() {
    const breadcrumb = document.querySelector('.breadcrumb');
    if (!breadcrumb) return;

    const toggle = document.createElement('span');
    toggle.className = 'breadcrumb-separator';
    toggle.textContent = '|';

    const button = document.createElement('button');
    button.className = 'reader-mode-toggle breadcrumb-icon-btn';
    button.setAttribute('aria-label', 'Toggle reader mode');
    button.setAttribute('title', 'Reader Mode');
    button.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;

    // Append to breadcrumb
    breadcrumb.appendChild(toggle);
    breadcrumb.appendChild(button);

    // Create floating close button for reader mode
    const closeButton = document.createElement('button');
    closeButton.className = 'reader-mode-close';
    closeButton.setAttribute('aria-label', 'Exit reader mode');
    closeButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    `;
    document.body.appendChild(closeButton);

    // Function to toggle reader mode
    function toggleReaderMode(enabled) {
      if (enabled) {
        document.body.classList.add('reader-mode');
      } else {
        document.body.classList.remove('reader-mode');
      }
      setReaderMode(enabled);
    }

    // Apply saved preference
    if (getReaderMode()) {
      document.body.classList.add('reader-mode');
    }

    // Toggle button click
    button.addEventListener('click', () => {
      const isEnabled = document.body.classList.toggle('reader-mode');
      setReaderMode(isEnabled);
    });

    // Close button click
    closeButton.addEventListener('click', () => {
      toggleReaderMode(false);
    });

    // Note: Escape key removed - conflicts with browser fullscreen in Firefox
    // Users can click the X button to exit reader mode
  }

  // Initialize reader mode
  if (document.querySelector('.reader-content')) {
    createReaderModeToggle();
  }

  // ============================================================================
  // KEYBOARD SHORTCUTS SYSTEM
  // ============================================================================

  function initKeyboardShortcuts() {
    const readerContent = document.querySelector('.reader-content');
    if (!readerContent) return;

    // Shortcut definitions - used for both handling and help panel
    const shortcutGroups = {
      navigation: {
        label: 'Navigation',
        shortcuts: [
          { keys: 'Alt+ArrowLeft', label: 'Previous chapter', action: 'prevChapter' },
          { keys: 'Alt+ArrowRight', label: 'Next chapter', action: 'nextChapter' },
          { keys: 'Alt+ArrowUp', label: 'Previous section', action: 'prevSection' },
          { keys: 'Alt+ArrowDown', label: 'Next section', action: 'nextSection' },
          { keys: 'Alt+Home', label: 'Top of document', action: 'goTop' },
          { keys: 'Alt+End', label: 'Bottom of document', action: 'goBottom' },
        ]
      },
      quickJumps: {
        label: 'Quick Jumps',
        shortcuts: [
          { keys: 'Alt+KeyG', label: 'Glossary', action: 'jumpGlossary' },
          { keys: 'Alt+KeyI', label: 'Index', action: 'jumpIndex' },
          { keys: 'Alt+KeyS', label: 'Reference Sheets', action: 'jumpSheets' },
        ]
      },
      bookmarks: {
        label: 'Bookmarks',
        shortcuts: [
          { keys: 'Alt+KeyB', label: 'Toggle bookmark', action: 'toggleBookmark' },
          { keys: 'Alt+Shift+KeyB', label: 'Open bookmarks', action: 'openBookmarks' },
        ]
      },
      search: {
        label: 'Search',
        shortcuts: [
          { keys: 'Ctrl+KeyK', label: 'Quick Jump search', action: 'quickJump', note: '⌘K on Mac' },
        ]
      }
    };

    // Get all chapter sections
    function getChapters() {
      return Array.from(readerContent.querySelectorAll('section[id^="ch-"]'));
    }

    // Get all section headings (h1, h2, h3 with IDs)
    function getSectionHeadings() {
      return Array.from(readerContent.querySelectorAll('h1[id], h2[id], h3[id]'));
    }

    // Find current section based on scroll position
    function getCurrentHeadingIndex(headings) {
      const scrollPos = window.scrollY + 150;
      let currentIndex = 0;

      for (let i = 0; i < headings.length; i++) {
        if (headings[i].offsetTop <= scrollPos) {
          currentIndex = i;
        } else {
          break;
        }
      }
      return currentIndex;
    }

    // Scroll to element with offset for sticky breadcrumb
    function scrollToElement(element) {
      if (!element) return;
      const offset = 80; // Account for sticky breadcrumb
      const top = element.offsetTop - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }

    // Navigation actions
    const actions = {
      prevChapter: () => {
        const chapters = getChapters();
        const currentIndex = getCurrentHeadingIndex(chapters);
        if (currentIndex > 0) {
          scrollToElement(chapters[currentIndex - 1]);
        }
      },
      nextChapter: () => {
        const chapters = getChapters();
        const currentIndex = getCurrentHeadingIndex(chapters);
        if (currentIndex < chapters.length - 1) {
          scrollToElement(chapters[currentIndex + 1]);
        }
      },
      prevSection: () => {
        const headings = getSectionHeadings();
        const currentIndex = getCurrentHeadingIndex(headings);
        if (currentIndex > 0) {
          scrollToElement(headings[currentIndex - 1]);
        }
      },
      nextSection: () => {
        const headings = getSectionHeadings();
        const currentIndex = getCurrentHeadingIndex(headings);
        if (currentIndex < headings.length - 1) {
          scrollToElement(headings[currentIndex + 1]);
        }
      },
      goTop: () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      goBottom: () => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      },
      jumpGlossary: () => {
        const el = document.getElementById('ch-28-glossary');
        scrollToElement(el);
      },
      jumpIndex: () => {
        const el = document.getElementById('ch-29-index');
        scrollToElement(el);
      },
      jumpSheets: () => {
        const el = document.getElementById('ch-27-sheets-and-play-aids');
        scrollToElement(el);
      },
      toggleBookmark: () => {
        // Find current section and toggle its bookmark
        const headings = getSectionHeadings();
        const currentIndex = getCurrentHeadingIndex(headings);
        const currentHeading = headings[currentIndex];
        if (currentHeading && currentHeading.id) {
          // Trigger the bookmark system if it exists
          const bookmarkBtn = document.querySelector('.bookmark-btn');
          if (bookmarkBtn) {
            // Use existing bookmark functionality
            const event = new CustomEvent('toggleBookmark', { detail: { id: currentHeading.id } });
            document.dispatchEvent(event);
          }
        }
      },
      openBookmarks: () => {
        const bookmarkBtn = document.querySelector('.bookmark-btn');
        if (bookmarkBtn) {
          bookmarkBtn.click();
        }
      },
      quickJump: () => {
        const quickJumpBtn = document.getElementById('breadcrumbSearchBtn');
        if (quickJumpBtn) {
          quickJumpBtn.click();
        }
      },
      toggleHelp: () => {
        toggleHelpPanel();
      }
    };

    // Build key combo string from event
    function getKeyCombo(e) {
      let combo = '';
      if (e.ctrlKey || e.metaKey) combo += 'Ctrl+';
      if (e.altKey) combo += 'Alt+';
      if (e.shiftKey) combo += 'Shift+';
      combo += e.code;
      return combo;
    }

    // Build lookup map from shortcut groups
    const shortcutMap = {};
    Object.values(shortcutGroups).forEach(group => {
      group.shortcuts.forEach(shortcut => {
        shortcutMap[shortcut.keys] = shortcut.action;
      });
    });

    // Main keyboard event handler
    document.addEventListener('keydown', (e) => {
      // Ignore when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
        return;
      }

      // ? key toggles help (without modifiers)
      if (e.key === '?' && !e.ctrlKey && !e.altKey && !e.metaKey) {
        e.preventDefault();
        toggleHelpPanel();
        return;
      }

      const combo = getKeyCombo(e);
      const actionName = shortcutMap[combo];

      if (actionName && actions[actionName]) {
        e.preventDefault();
        actions[actionName]();
      }
    });

    // ========== HELP PANEL ==========

    let helpPanel = null;

    function createHelpPanel() {
      const panel = document.createElement('div');
      panel.className = 'shortcuts-help-panel';
      panel.innerHTML = `
        <div class="shortcuts-help-header">
          <h3>Keyboard Shortcuts</h3>
          <button class="shortcuts-help-close" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="shortcuts-help-content">
          ${Object.values(shortcutGroups).map(group => `
            <div class="shortcuts-group">
              <h4>${group.label}</h4>
              ${group.shortcuts.map(s => `
                <div class="shortcut-row">
                  <kbd>${formatKeyDisplay(s.keys)}${s.note ? ` <span class="shortcut-note">${s.note}</span>` : ''}</kbd>
                  <span>${s.label}</span>
                </div>
              `).join('')}
            </div>
          `).join('')}
          <div class="shortcuts-group">
            <h4>Help</h4>
            <div class="shortcut-row">
              <kbd>?</kbd>
              <span>Toggle this panel</span>
            </div>
          </div>
        </div>
      `;

      panel.querySelector('.shortcuts-help-close').addEventListener('click', () => {
        toggleHelpPanel(false);
      });

      document.body.appendChild(panel);
      return panel;
    }

    function formatKeyDisplay(keys) {
      const isMac = /Mac|iPod|iPhone|iPad/.test(navigator.platform);

      let formatted = keys
        .replace('ArrowLeft', '←')
        .replace('ArrowRight', '→')
        .replace('ArrowUp', '↑')
        .replace('ArrowDown', '↓')
        .replace('Key', '');

      if (isMac) {
        formatted = formatted
          .replace('Alt+', '⌥ ')
          .replace('Ctrl+', '⌘ ')
          .replace('Shift+', '⇧ ');
      } else {
        formatted = formatted
          .replace('Alt+', 'Alt + ')
          .replace('Ctrl+', 'Ctrl + ')
          .replace('Shift+', 'Shift + ');
      }

      return formatted;
    }

    function toggleHelpPanel(show) {
      if (!helpPanel) {
        helpPanel = createHelpPanel();
      }

      const shouldShow = show !== undefined ? show : !helpPanel.classList.contains('open');

      if (shouldShow) {
        helpPanel.classList.add('open');
      } else {
        helpPanel.classList.remove('open');
      }
    }

    // Add help button to breadcrumb
    function addHelpButton() {
      const breadcrumb = document.querySelector('.breadcrumb');
      if (!breadcrumb) return;

      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '|';

      const button = document.createElement('button');
      button.className = 'breadcrumb-icon-btn shortcuts-help-btn';
      button.setAttribute('aria-label', 'Keyboard shortcuts');
      button.setAttribute('title', 'Keyboard shortcuts (?)');
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
          <circle cx="12" cy="17" r="1" fill="currentColor"></circle>
        </svg>
      `;
      button.addEventListener('click', () => toggleHelpPanel());

      breadcrumb.appendChild(separator);
      breadcrumb.appendChild(button);
    }

    // Initialize
    addHelpButton();
  }

  // Initialize keyboard shortcuts
  if (document.querySelector('.reader-content')) {
    initKeyboardShortcuts();
  }
});

/**
 * Scroll-triggered animations using Intersection Observer
 * Adds 'visible' class to elements when they enter the viewport
 */

document.addEventListener('DOMContentLoaded', () => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    // Skip animations for users who prefer reduced motion
    // Make all elements immediately visible
    document.querySelectorAll('.card, section:not(.hero)').forEach(el => {
      el.classList.add('visible');
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
    return;
  }

  // Create intersection observer
  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -100px 0px', // Trigger 100px before element enters viewport
    threshold: 0.1 // Trigger when 10% of element is visible
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Add visible class when element enters viewport
        entry.target.classList.add('visible');
        // Optionally unobserve after animation (prevents re-triggering)
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Observe all cards and sections (except hero)
  const elementsToAnimate = document.querySelectorAll('.card, section:not(.hero)');
  elementsToAnimate.forEach(element => {
    observer.observe(element);
  });
});

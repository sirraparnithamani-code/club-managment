/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - SHARED DOM HELPERS
 * ==========================================================================
 * Small utilities that every rendering module needs. They used to be
 * re-implemented (and sometimes forgotten) per page, which is why
 * pages/club-details.html threw `setText is not defined` and rendered blank.
 * ==========================================================================
 */

/** Escapes text destined for an innerHTML template. */
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);
}

/** Writes textContent into an element by id, if that element exists. */
export function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value == null ? '' : String(value);
  return el;
}

/** Reveals `.reveal-on-scroll` elements as they scroll into view. */
export function initScrollReveal(root = document) {
  const targets = root.querySelectorAll('.reveal-on-scroll:not(.is-visible)');
  if (targets.length === 0) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    targets.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      instance.unobserve(entry.target);
    });
  }, {
    root: null,
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  });

  targets.forEach(el => observer.observe(el));
}
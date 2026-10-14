/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - SHARED SITE BEHAVIOUR
 * ==========================================================================
 * Loaded on every page. Anything that only exists on one page is guarded, so
 * the same file safely drives Home, Clubs, Events, Dashboard, the detail
 * pages and Login.
 *
 * Responsibilities kept here (global concerns):
 *   - navigation wiring and active-link state  -> js/nav.js
 *   - mobile sidebar toggle                     -> js/nav.js
 *   - toast notifications                      -> js/toast.js
 *   - page-load entrance, scroll reveal, animated counters
 *   - smooth in-page anchor scrolling with the header offset
 *
 * Home-only concerns (all guarded by element presence):
 *   - live statistics derived from the shared data modules
 *   - the static 24-club grid filter
 *   - the upcoming-events preview, rendered from the shared event store so
 *     the cards can never drift from the Events page
 * ==========================================================================
 */

import { getEventDataSource, getEventStats, isVisibleToStudents, resolveTimingGroup, sortEvents, SORT_OPTIONS, TIME_FILTERS } from './event-data.js';
import { escapeHtml, initScrollReveal } from './dom.js';
import { initNav } from './nav.js';

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const HEADER_OFFSET = 80;

/**
 * Published campus figures that have no per-student record yet. Everything
 * that *can* be counted is counted from the shared data modules instead.
 */
const PUBLISHED_FIGURES = {
  students: 1000,
  activities: 50
};

function init() {
  initNav();
  initPageLoadSequence();
  initSidebarScrollLock();
  initScrollReveal();
  initHomeStatistics();
  initStatsCounter();
  initHomeClubFiltering();
  initSmoothAnchorScroll();
  initHomeCardNavigation();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

/* ==========================================================================
   PAGE LOAD ENTRANCE
   ========================================================================== */

function initPageLoadSequence() {
  const fadeElements = document.querySelectorAll('.page-load-fade');
  if (fadeElements.length === 0) return;

  if (prefersReducedMotion) {
    fadeElements.forEach(el => el.classList.add('loaded'));
    return;
  }

  fadeElements.forEach((el, index) => {
    setTimeout(() => el.classList.add('loaded'), 120 + index * 100);
  });
}

/* ==========================================================================
   SIDEBAR SCROLL LOCK (mobile)
   ========================================================================== */

function initSidebarScrollLock() {
  // Scroll lock on mobile overlay is handled by js/nav.js
  // This function is a no-op kept for initialization compatibility.
}

/* ==========================================================================
   HOME STATISTICS — single source of truth
   ========================================================================== */

function initHomeStatistics() {
  const statTargets = document.querySelectorAll('[data-stat-source]');
  const inlineStats = document.querySelectorAll('[data-inline-stat]');
  const diagramStats = document.querySelectorAll('[data-diagram-stat]');

  if (statTargets.length === 0 && inlineStats.length === 0 && diagramStats.length === 0) return;

  Promise.all([getEventStats(), getEventDataSource().list()])
    .then(([stats, events]) => {
      const values = Object.assign({}, PUBLISHED_FIGURES, {
        clubs: stats.clubs,
        events: stats.totalEvents,
        upcoming: stats.upcomingEvents,
        students: PUBLISHED_FIGURES.students
      });

      statTargets.forEach(el => {
        el.setAttribute('data-target', String(values[el.getAttribute('data-stat-source')] || 0));
      });

      inlineStats.forEach(el => {
        el.textContent = String(values[el.getAttribute('data-inline-stat')] || 0);
      });

      diagramStats.forEach(el => {
        el.textContent = String(values[el.getAttribute('data-diagram-stat')] || 0);
      });

      renderHomeEventPreview(events);
      runStatsCounter();
    })
    .catch(() => {
      // Statistics are decorative: leave the server-rendered values in place.
    });
}

/* ==========================================================================
   STATISTICS COUNTER
   ========================================================================== */

let counterStarted = false;

function initStatsCounter() {
  const statsSection = document.getElementById('statsSection');
  if (!statsSection || document.querySelectorAll('.stat-number').length === 0) return;

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    runStatsCounter();
    return;
  }

  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      runStatsCounter();
      instance.unobserve(entry.target);
    });
  }, { threshold: 0.25 });

  observer.observe(statsSection);
}

function runStatsCounter() {
  const statsSection = document.getElementById('statsSection');
  if (!statsSection || counterStarted) return;

  const statNumbers = statsSection.querySelectorAll('.stat-number');
  if (statNumbers.length === 0) return;

  counterStarted = true;

  statNumbers.forEach(statEl => {
    const target = parseInt(statEl.getAttribute('data-target'), 10) || 0;
    const suffix = statEl.getAttribute('data-suffix') || '';

    if (prefersReducedMotion) {
      statEl.textContent = `${target}${suffix}`;
      return;
    }

    const totalFrames = Math.round(1400 / (1000 / 60));
    let frame = 0;

    const timer = setInterval(() => {
      frame += 1;
      const progress = frame / totalFrames;
      const eased = 1 - Math.pow(1 - progress, 3);

      statEl.textContent = `${Math.floor(eased * target)}${suffix}`;

      if (frame >= totalFrames) {
        statEl.textContent = `${target}${suffix}`;
        clearInterval(timer);
      }
    }, 1000 / 60);
  });
}

/* ==========================================================================
   HOME: STATIC 24-CLUB GRID FILTER
   The Clubs page owns the canonical catalogue filter; this is only the local
   filter for the Home preview grid.
   ========================================================================== */

function initHomeClubFiltering() {
  const grid = document.getElementById('homeClubsGrid');
  const filterButtons = document.querySelectorAll('#clubs .filter-btn');

  if (!grid || filterButtons.length === 0) return;

  const cards = grid.querySelectorAll('.club-card');

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const target = (button.getAttribute('data-filter') || 'all').toLowerCase();

      filterButtons.forEach(other => {
        other.classList.toggle('is-active', other === button);
        other.setAttribute('aria-selected', other === button ? 'true' : 'false');
      });

      cards.forEach(card => {
        const matches = target === 'all'
          || (card.getAttribute('data-category') || '').toLowerCase() === target;

        card.classList.toggle('is-hidden', !matches);
      });
    });
  });
}

/* ==========================================================================
   HOME: UPCOMING EVENT PREVIEW
   Rendered from the shared event store so every card links to a real
   Event Details page. Nothing here is hardcoded.
   ========================================================================== */

const HOME_EVENT_LIMIT = 4;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function renderHomeEventPreview(events) {
  const grid = document.getElementById('homeEventsGrid');
  if (!grid) return;

  const now = new Date();
  const upcoming = sortEvents(
    (events || [])
      .filter(isVisibleToStudents)
      .filter(event => resolveTimingGroup(event, now) === TIME_FILTERS.UPCOMING),
    SORT_OPTIONS.SOONEST
  ).slice(0, HOME_EVENT_LIMIT);

  if (upcoming.length === 0) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = upcoming.map(renderHomeEventCard).join('');
  initScrollReveal(grid);
}

function renderHomeEventCard(event) {
  const start = new Date(`${event.startDate}T${event.startTime || '00:00'}`);
  const month = isNaN(start.getTime()) ? 'TBA' : MONTHS[start.getMonth()];
  const day = isNaN(start.getTime()) ? '--' : String(start.getDate());
  const href = `pages/event-details.html?id=${encodeURIComponent(event.id)}`;

  return `
    <article class="event-card reveal-on-scroll">
      <div class="event-date-badge">
        <span class="event-month">${escapeHtml(month)}</span>
        <span class="event-day">${escapeHtml(day)}</span>
      </div>
      ${event.clubName ? `<span class="event-club-tag">${escapeHtml(event.clubName)}</span>` : ''}
      <h3 class="event-title">${escapeHtml(event.title)}</h3>
      ${event.venue ? `
        <div class="event-location">
          <svg class="event-location-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${escapeHtml(event.venue)}</span>
        </div>` : ''}
      <p class="event-desc">${escapeHtml(event.description || '')}</p>
      <div class="event-footer">
        <a href="${href}" class="btn btn-secondary btn-sm btn-block">View Event Details</a>
      </div>
    </article>
  `;
}

/* ==========================================================================
   HOME: CLUB CARD NAVIGATION
   Every preview card opens the real Club Details page, matching the Clubs page.
   ========================================================================== */

function initHomeCardNavigation() {
  const grid = document.getElementById('homeClubsGrid');
  if (!grid) return;

  grid.addEventListener('click', event => {
    const button = event.target.closest('.club-card button[data-club-id]');
    if (!button) return;

    window.location.href = `pages/club-details.html?id=${encodeURIComponent(button.getAttribute('data-club-id'))}`;
  });
}

/* ==========================================================================
   SMOOTH IN-PAGE ANCHOR SCROLLING
   ========================================================================== */

function initSmoothAnchorScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', event => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.getElementById(href.substring(1));
      if (!target) return;

      event.preventDefault();

      const offset = target.getBoundingClientRect().top + window.pageYOffset - HEADER_OFFSET;

      window.scrollTo({
        top: offset,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

if (href !== `#${window.location.hash.substring(1)}`) {
        history.replaceState(null, '', href);
      }
    });
  });
}
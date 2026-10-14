/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - EVENTS PAGE MODULE
 * Page: pages/events.html
 *
 * Renders the published events feed. The event collection is
 * supplied by the data source, never hardcoded here, so a backend response
 * can replace the local store without touching this file's rendering code.
 * ==========================================================================
 */

import {
  STATUS_LABELS,
  SORT_OPTIONS,
  TIME_FILTERS,
  filterEvents,
  getEventDataSource,
  getSeatsRemaining,
  isRegistrationActive,
  isVisibleToStudents,
  normalizeEvent,
  resolveTimingGroup,
  sortEvents
} from './event-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

const EVENT_API_ENDPOINT = null;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const TIMING_FILTERS = [
  { id: TIME_FILTERS.ALL, label: 'All' },
  { id: TIME_FILTERS.UPCOMING, label: 'Upcoming' },
  { id: TIME_FILTERS.ONGOING, label: 'Ongoing' },
  { id: TIME_FILTERS.PAST, label: 'Past' }
];

const dataSource = getEventDataSource({ apiEndpoint: EVENT_API_ENDPOINT });

const state = {
  events: [],
  search: '',
  club: 'all',
  category: 'all',
  timing: TIME_FILTERS.ALL,
  sort: SORT_OPTIONS.SOONEST
};

const dom = {};

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  function cacheDom() {
    dom.grid = document.getElementById('eventsGrid');
    dom.searchInput = document.getElementById('eventSearchInput');
    dom.searchClear = document.getElementById('eventSearchClear');
    dom.clubFilter = document.getElementById('eventClubFilter');
    dom.categoryFilter = document.getElementById('eventCategoryFilter');
    dom.sortSelect = document.getElementById('eventSortSelect');
    dom.timingNav = document.getElementById('eventTimingNav');
    dom.resultsInfo = document.getElementById('eventResultsInfo');
    dom.noEventsState = document.getElementById('noEventsState');
    dom.noResultsState = document.getElementById('noResultsState');
    dom.clearFiltersBtn = document.getElementById('clearEventFiltersBtn');
  }

  function init() {
    cacheDom();

    if (!dom.grid) return;

    attachEventListeners();
    loadEvents();
  }

  /**
   * Reads every event the data source knows about, then keeps only the ones
   * a student is allowed to see. Draft and pending events are filtered out
   * here, so no downstream consumer has to think about them.
   */
  async function loadEvents() {
    try {
      const events = await dataSource.list();
      state.events = events.filter(isVisibleToStudents);
    } catch (error) {
      state.events = [];
      showToast('Events could not be loaded right now. Please try again shortly.');
    }

    buildFilterOptions();
    setControlsEnabled(state.events.length > 0);
    applyFilters();
  }

  function buildFilterOptions() {
    const clubs = uniqueOptions(state.events.map(event => ({
      value: event.clubKey,
      label: event.clubName || event.clubKey
    })));
    const categories = uniqueOptions(state.events.map(event => ({
      value: event.category,
      label: event.categoryLabel || event.category
    })));

    fillSelect(dom.clubFilter, 'All clubs', 'all', clubs);
    fillSelect(dom.categoryFilter, 'All categories', 'all', categories);
    renderTimingFilters();
  }

  function fillSelect(select, allLabel, allValue, options) {
    if (!select) return;

    const previous = select.value || allValue;
    const markup = [`<option value="${allValue}">${allLabel}</option>`];

    options.forEach(option => {
      markup.push(`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`);
    });

    select.innerHTML = markup.join('');
    select.value = options.some(option => option.value === previous) ? previous : allValue;
  }

  function renderTimingFilters() {
    if (!dom.timingNav) return;

    const now = new Date();
    const counts = {
      [TIME_FILTERS.ALL]: state.events.length,
      [TIME_FILTERS.UPCOMING]: 0,
      [TIME_FILTERS.ONGOING]: 0,
      [TIME_FILTERS.PAST]: 0
    };

    state.events.forEach(event => {
      counts[resolveTimingGroup(event, now)] += 1;
    });

    dom.timingNav.innerHTML = TIMING_FILTERS.map(filter => `
      <button
        class="timing-btn ${filter.id === state.timing ? 'is-active' : ''}"
        data-timing="${filter.id}"
        role="tab"
        aria-selected="${filter.id === state.timing}"
        aria-controls="eventsGrid"
      >
        ${filter.label} <span class="timing-count">(${counts[filter.id]})</span>
      </button>
    `).join('');

    dom.timingNav.hidden = state.events.length === 0;
  }

  function setControlsEnabled(enabled) {
    [dom.searchInput, dom.clubFilter, dom.categoryFilter, dom.sortSelect].forEach(control => {
      if (control) control.disabled = !enabled;
    });
  }

  function attachEventListeners() {
    dom.searchInput.addEventListener('input', debounce(() => {
      state.search = dom.searchInput.value.trim();
      dom.searchClear.hidden = state.search === '';
      applyFilters();
    }, 150));

    dom.searchClear.addEventListener('click', () => {
      dom.searchInput.value = '';
      state.search = '';
      dom.searchClear.hidden = true;
      applyFilters();
      dom.searchInput.focus();
    });

    dom.clubFilter.addEventListener('change', () => {
      state.club = dom.clubFilter.value;
      applyFilters();
    });

    dom.categoryFilter.addEventListener('change', () => {
      state.category = dom.categoryFilter.value;
      applyFilters();
    });

    dom.sortSelect.addEventListener('change', () => {
      state.sort = dom.sortSelect.value;
      applyFilters();
    });

    dom.timingNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.timing-btn');
      if (!btn) return;

      state.timing = btn.getAttribute('data-timing');
      renderTimingFilters();
      applyFilters();
    });

    dom.timingNav.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();

      const buttons = Array.from(dom.timingNav.querySelectorAll('.timing-btn'));
      const activeIndex = buttons.findIndex(b => b.classList.contains('is-active'));
      let nextIndex = activeIndex + (e.key === 'ArrowRight' ? 1 : -1);

      if (nextIndex >= buttons.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = buttons.length - 1;

      buttons[nextIndex].focus();
      buttons[nextIndex].click();
    });

    dom.clearFiltersBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      state.search = '';
      state.club = 'all';
      state.category = 'all';
      state.timing = TIME_FILTERS.ALL;
      state.sort = SORT_OPTIONS.SOONEST;

      dom.searchClear.hidden = true;
      dom.clubFilter.value = 'all';
      dom.categoryFilter.value = 'all';
      dom.sortSelect.value = SORT_OPTIONS.SOONEST;

      renderTimingFilters();
      applyFilters();
      dom.searchInput.focus();
    });
  }

  function applyFilters() {
    const matched = sortEvents(
      filterEvents(state.events, {
        search: state.search,
        club: state.club,
        category: state.category,
        timing: state.timing
      }),
      state.sort
    );

    renderEvents(matched);
    updateResultsInfo(matched.length);
  }

  /**
   * Renders any collection of normalized events. Exposed on window so a data
   * source, an API response or a developer console call can all drive it.
   */
  function renderEvents(events) {
    const hasEvents = state.events.length > 0;

    if (!hasEvents) {
      dom.grid.hidden = true;
      dom.grid.innerHTML = '';
      dom.noEventsState.hidden = false;
      dom.noResultsState.hidden = true;
      updateResultsInfo(0);
      return;
    }

    if (!events || events.length === 0) {
      dom.grid.hidden = true;
      dom.grid.innerHTML = '';
      dom.noEventsState.hidden = true;
      dom.noResultsState.hidden = false;
      updateResultsInfo(0, state.events.length);
      return;
    }

    dom.noEventsState.hidden = true;
    dom.noResultsState.hidden = true;
    dom.grid.hidden = false;
    dom.grid.innerHTML = events.map(renderEventCard).join('');

    dom.grid.querySelectorAll('.event-register-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `event-details.html?id=${encodeURIComponent(btn.getAttribute('data-event-id'))}`;
      });
    });
  }

  /** Builds one announcement card. Every field is rendered only if present. */
  function renderEventCard(event) {
    const start = parseDate(event.startDate);
    const registrationOpen = isRegistrationActive(event);
    const seatsLeft = getSeatsRemaining(event);

    return `
      <article class="event-announcement-card" role="listitem" data-event-id="${escapeHtml(event.id)}"
        data-status="${event.status}">
        <div class="event-banner">
          ${event.banner
            ? `<img src="${escapeHtml(event.banner)}" alt="" loading="lazy">`
            : '<span class="event-banner-placeholder">Event announcement</span>'}
          ${start ? `
            <div class="event-banner-date">
              <span class="event-banner-day">${start.getDate()}</span>
              <span class="event-banner-month">${MONTHS[start.getMonth()]}</span>
            </div>` : ''}
          <span class="event-status-badge ${event.status}">${STATUS_LABELS[event.status]}</span>
        </div>

        <div class="event-card-body">
          ${event.clubName ? `
            <span class="event-club-line">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              ${escapeHtml(event.clubName)}
            </span>` : ''}

          ${event.category ? `<span class="event-category-badge">${escapeHtml(event.categoryLabel || event.category)}</span>` : ''}

          <h3 class="event-announcement-title">${escapeHtml(event.title)}</h3>
          <p class="event-announcement-desc">${escapeHtml(truncate(event.description, 150))}</p>

          <div class="event-fact-list">
            ${factRow('When', dateTimeLabel(event))}
            ${factRow('Venue', event.venue)}
            ${event.registrationEnabled ? factRow('Register by', formatDate(event.registrationDeadline)) : ''}
            ${seatsFact(event, seatsLeft)}
          </div>

          <div class="event-card-footer">
            <a href="event-details.html?id=${encodeURIComponent(event.id)}" class="btn btn-secondary btn-sm">
              View Details
            </a>
            <button type="button" class="btn btn-primary btn-sm event-register-btn" data-event-id="${escapeHtml(event.id)}"
              ${registrationOpen ? '' : 'disabled'}>
              ${registrationOpen ? 'Register' : 'Registration Closed'}
            </button>
          </div>
        </div>
      </article>
    `;
  }

  function factRow(label, value) {
    if (!value) return '';
    return `
      <div class="event-fact">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
        </svg>
        <span><span class="event-fact-label">${label}:</span><span class="event-fact-value">${escapeHtml(value)}</span></span>
      </div>
    `;
  }

  function seatsFact(event, seatsLeft) {
    if (seatsLeft === null) return '';

    const fill = event.seats > 0 ? Math.round(((event.seats - seatsLeft) / event.seats) * 100) : 100;
    const label = event.seatsTaken ? `${seatsLeft} of ${event.seats} seats left` : `${event.seats} seats available`;

    return `
      <div class="event-fact">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
        </svg>
        <span>
          <span class="event-fact-value">${escapeHtml(label)}</span>
          <span class="event-seats-bar" aria-hidden="true">
            <span class="event-seats-fill" style="width:${fill}%"></span>
          </span>
        </span>
      </div>
    `;
  }

  function dateTimeLabel(event) {
    const date = formatDate(event.startDate);
    if (!date) return '';

    const time = [event.startTime, event.endTime].filter(Boolean).join(' – ');
    return time ? `${date} · ${time}` : date;
  }

  function updateResultsInfo(visibleCount, totalCount) {
    if (!dom.resultsInfo) return;

    if (state.events.length === 0) {
      dom.resultsInfo.textContent = '';
      return;
    }

    if (visibleCount === state.events.length) {
      dom.resultsInfo.innerHTML = `<span class="results-count">${visibleCount}</span> event${visibleCount === 1 ? '' : 's'} published`;
      return;
    }

    const total = totalCount === undefined ? state.events.length : totalCount;
    dom.resultsInfo.innerHTML = `Showing <span class="results-count">${visibleCount}</span> of ${total} published events`;
  }

  function uniqueOptions(options) {
    const seen = new Set();

    return options.filter(option => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }).sort((a, b) => a.label.localeCompare(b.label));
  }

  function parseDate(value) {
    if (!value) return null;
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  function formatDate(value) {
    const parsed = parseDate(value);
    if (!parsed) return '';
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  function truncate(value, limit) {
    if (!value) return '';
    if (value.length <= limit) return value;
    return `${value.slice(0, limit).trimEnd()}…`;
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SCMSEvents = {
    STATUS_LABELS,
    renderEvents,
    filterEvents,
    sortEvents,
    getVisibleEvents: () => state.events.slice(),
    setEvents: events => {
      state.events = (events || []).map(normalizeEvent).filter(isVisibleToStudents);
      buildFilterOptions();
      setControlsEnabled(state.events.length > 0);
      applyFilters();
    }
  };
})();

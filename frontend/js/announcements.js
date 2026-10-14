/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - ANNOUNCEMENTS PAGE MODULE
 * Page: pages/announcements.html
 *
 * Renders announcements with search, filter by category/priority, and sorting.
 * All data comes from the shared announcement data source.
 * ==========================================================================
 */

import {
  ANNOUNCEMENT_CATEGORIES_LIST,
  ANNOUNCEMENT_PRIORITIES_LIST,
  getAnnouncements,
  getVisibleAnnouncements,
  filterAnnouncements,
  sortAnnouncements,
  formatRelativeDate
} from './announcement-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const state = {
  announcements: [],
  search: '',
  category: 'all',
  priority: 'all',
  sort: 'newest'
};

const dom = {};

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  function cacheDom() {
    dom.searchInput = document.getElementById('announcementSearchInput');
    dom.searchClear = document.getElementById('announcementSearchClear');
    dom.categoryFilter = document.getElementById('announcementCategoryFilter');
    dom.priorityFilter = document.getElementById('announcementPriorityFilter');
    dom.sortSelect = document.getElementById('announcementSortSelect');
    dom.resultsInfo = document.getElementById('announcementResultsInfo');
    dom.pinnedSection = document.getElementById('pinnedAnnouncementsSection');
    dom.pinnedGrid = document.getElementById('pinnedAnnouncementsGrid');
    dom.regularGrid = document.getElementById('announcementsGrid');
    dom.noAnnouncementsState = document.getElementById('noAnnouncementsState');
    dom.noResultsState = document.getElementById('noResultsState');
    dom.clearFiltersBtn = document.getElementById('clearAnnouncementFiltersBtn');
  }

  function init() {
    cacheDom();

    if (!dom.regularGrid) return;

    attachEventListeners();
    loadAnnouncements();
  }

  async function loadAnnouncements() {
    try {
      // Students only see published/scheduled announcements. Drafts are
      // filtered here so no downstream consumer has to think about them.
      state.announcements = getVisibleAnnouncements();
    } catch (error) {
      state.announcements = [];
      showToast('Announcements could not be loaded right now. Please try again shortly.');
    }

    buildFilterOptions();
    applyFilters();
  }

  function buildFilterOptions() {
    const categories = uniqueOptions(state.announcements.map(ann => ({
      value: ann.category,
      label: ann.categoryLabel
    })));
    const priorities = uniqueOptions(state.announcements.map(ann => ({
      value: ann.priority,
      label: ann.priorityLabel
    })));

    fillSelect(dom.categoryFilter, 'All categories', 'all', categories);
    fillSelect(dom.priorityFilter, 'All priorities', 'all', priorities);
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

    dom.categoryFilter.addEventListener('change', () => {
      state.category = dom.categoryFilter.value;
      applyFilters();
    });

    dom.priorityFilter.addEventListener('change', () => {
      state.priority = dom.priorityFilter.value;
      applyFilters();
    });

    dom.sortSelect.addEventListener('change', () => {
      state.sort = dom.sortSelect.value;
      applyFilters();
    });

    dom.clearFiltersBtn.addEventListener('click', () => {
      dom.searchInput.value = '';
      state.search = '';
      state.category = 'all';
      state.priority = 'all';
      state.sort = 'newest';

      dom.searchClear.hidden = true;
      dom.categoryFilter.value = 'all';
      dom.priorityFilter.value = 'all';
      dom.sortSelect.value = 'newest';

      applyFilters();
      dom.searchInput.focus();
    });
  }

  function applyFilters() {
    const matched = sortAnnouncements(
      filterAnnouncements(state.announcements, {
        search: state.search,
        category: state.category,
        priority: state.priority
      }),
      state.sort
    );

    renderAnnouncements(matched);
    updateResultsInfo(matched.length);
  }

  function renderAnnouncements(announcements) {
    const hasAnnouncements = state.announcements.length > 0;

    if (!hasAnnouncements) {
      dom.pinnedSection.hidden = true;
      dom.regularGrid.hidden = true;
      dom.regularGrid.innerHTML = '';
      dom.noAnnouncementsState.hidden = false;
      dom.noResultsState.hidden = true;
      updateResultsInfo(0);
      return;
    }

    if (!announcements || announcements.length === 0) {
      dom.pinnedSection.hidden = true;
      dom.regularGrid.hidden = true;
      dom.regularGrid.innerHTML = '';
      dom.noAnnouncementsState.hidden = true;
      dom.noResultsState.hidden = false;
      updateResultsInfo(0, state.announcements.length);
      return;
    }

    dom.noAnnouncementsState.hidden = true;
    dom.noResultsState.hidden = true;

    // Separate pinned and regular
    const pinned = announcements.filter(ann => ann.pinned);
    const regular = announcements.filter(ann => !ann.pinned);

    // Render pinned section
    if (pinned.length > 0) {
      dom.pinnedSection.hidden = false;
      dom.pinnedGrid.hidden = false;
      dom.pinnedGrid.innerHTML = pinned.map(renderAnnouncementCard).join('');
    } else {
      dom.pinnedSection.hidden = true;
    }

    // Render regular announcements
    dom.regularGrid.hidden = false;
    dom.regularGrid.innerHTML = regular.map(renderAnnouncementCard).join('');

    initScrollReveal(dom.regularGrid);
    if (!dom.pinnedSection.hidden) {
      initScrollReveal(dom.pinnedGrid);
    }
  }

  function renderAnnouncementCard(ann) {
    const date = formatDate(ann.createdAt);
    const relativeDate = formatRelativeDate(ann.createdAt);

    return `
      <article class="announcement-card reveal-on-scroll ${ann.pinned ? 'is-pinned' : ''}" role="listitem" data-announcement-id="${escapeHtml(ann.id)}">
        ${ann.pinned ? '<span class="announcement-pin-badge" aria-label="Pinned">📌</span>' : ''}
        <div class="announcement-header">
          <span class="announcement-category-badge" style="background-color: ${ann.categoryColor}; color: white;">${escapeHtml(ann.categoryLabel)}</span>
          <span class="announcement-priority-badge ${ann.priorityBadge}">${escapeHtml(ann.priorityLabel)}</span>
        </div>
        <h3 class="announcement-title">${escapeHtml(ann.title)}</h3>
        <p class="announcement-body">${escapeHtml(truncate(ann.body, 200))}</p>
        <div class="announcement-meta">
          <span class="announcement-meta-item">
            <svg class="announcement-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${escapeHtml(date)} · ${escapeHtml(relativeDate)}
          </span>
          <span class="announcement-meta-item">
            <svg class="announcement-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
            ${escapeHtml(ann.author)} (${escapeHtml(ann.authorRole)})
          </span>
          ${ann.audience !== 'all' ? `
            <span class="announcement-meta-item">
              <svg class="announcement-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              </svg>
              Audience: ${escapeHtml(ann.audience === 'club' ? 'Club Members' : ann.audience === 'event' ? 'Event Participants' : ann.audience)}
            </span>
          ` : ''}
        </div>
      </article>
    `;
  }

  function truncate(value, limit) {
    if (!value) return '';
    if (value.length <= limit) return value;
    return `${value.slice(0, limit).trimEnd()}…`;
  }

  function formatDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  function updateResultsInfo(visibleCount, totalCount) {
    if (!dom.resultsInfo) return;

    if (state.announcements.length === 0) {
      dom.resultsInfo.textContent = '';
      return;
    }

    if (visibleCount === state.announcements.length) {
      dom.resultsInfo.innerHTML = `<span class="results-count">${visibleCount}</span> announcement${visibleCount === 1 ? '' : 's'}`;
      return;
    }

    const total = totalCount === undefined ? state.announcements.length : totalCount;
    dom.resultsInfo.innerHTML = `Showing <span class="results-count">${visibleCount}</span> of ${total} announcements`;
  }

  function uniqueOptions(options) {
    const seen = new Set();

    return options.filter(option => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }).sort((a, b) => a.label.localeCompare(b.label));
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

  window.SCMSAnnouncements = {
    renderAnnouncements,
    filterAnnouncements,
    sortAnnouncements,
    getVisibleAnnouncements: () => state.announcements.slice()
  };
})();
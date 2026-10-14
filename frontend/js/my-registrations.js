/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - MY REGISTRATIONS PAGE MODULE
 * Page: pages/my-registrations.html
 *
 * Shows all events the currently logged-in student has registered for,
 * separated into upcoming and past. Includes cancel registration with
 * a confirmation modal and cross-tab sync via storage events.
 * ==========================================================================
 */

import {
  STATUS_LABELS,
  cancelEventRegistration,
  getEventDataSource,
  getRegisteredEventIds,
  isRegistrationActive,
  isVisibleToStudents,
  resolveTimingGroup,
  TIME_FILTERS
} from './event-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

const EVENT_API_ENDPOINT = null;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dataSource = getEventDataSource({ apiEndpoint: EVENT_API_ENDPOINT });

const state = {
  events: [],
  registeredIds: [],
  registrations: []
};

const dom = {};

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  function cacheDom() {
    dom.upcomingList = document.getElementById('upcomingRegistrationsList');
    dom.upcomingCount = document.getElementById('upcomingCount');
    dom.pastList = document.getElementById('pastRegistrationsList');
    dom.pastCount = document.getElementById('pastCount');
    dom.noRegistrationsState = document.getElementById('noRegistrationsState');
    dom.cancelModal = document.getElementById('cancelConfirmModal');
    dom.cancelModalClose = document.getElementById('cancelModalClose');
    dom.cancelModalNo = document.getElementById('cancelModalNo');
    dom.cancelModalYes = document.getElementById('cancelModalYes');
  }

  function init() {
    cacheDom();

    if (!dom.upcomingList) return;

    attachEventListeners();
    loadRegistrations();
  }

  async function loadRegistrations() {
    try {
      const events = await dataSource.list();
      state.events = events.map(normalizeIfNeeded).filter(Boolean).filter(isVisibleToStudents);
      state.registeredIds = getRegisteredEventIds() || [];
      state.registrations = state.registeredIds
        .map(id => state.events.find(event => event.id === id))
        .filter(Boolean);
    } catch (error) {
      state.events = [];
      state.registeredIds = [];
      state.registrations = [];
      showToast('Could not load your registrations right now. Please try again shortly.');
    }

    renderRegistrations();
  }

  function normalizeIfNeeded(event) {
    if (event && typeof event.title === 'string') return event;
    return event;
  }

  function attachEventListeners() {
    if (dom.cancelModal) {
      dom.cancelModalClose.addEventListener('click', closeCancelModal);
      dom.cancelModalNo.addEventListener('click', closeCancelModal);

      dom.cancelModal.addEventListener('click', (e) => {
        if (e.target === dom.cancelModal) closeCancelModal();
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dom.cancelModal && !dom.cancelModal.hidden) {
          closeCancelModal();
        }
      });
    }

    if (dom.upcomingList) {
      dom.upcomingList.addEventListener('click', handleListClick);
    }
    if (dom.pastList) {
      dom.pastList.addEventListener('click', handleListClick);
    }

    window.addEventListener('storage', handleStorageChange);
  }

  function handleStorageChange(event) {
    if (event.key === 'scms_event_registrations') {
      state.registeredIds = getRegisteredEventIds() || [];
      state.registrations = state.registeredIds
        .map(id => state.events.find(e => e.id === id))
        .filter(Boolean);
      renderRegistrations();
    }
  }

  function handleListClick(event) {
    const viewBtn = event.target.closest('.registration-view-details-btn');
    if (viewBtn) {
      const eventId = viewBtn.getAttribute('data-event-id');
      if (eventId) {
        window.location.href = `event-details.html?id=${encodeURIComponent(eventId)}`;
      }
      return;
    }

    const cancelBtn = event.target.closest('.registration-cancel-btn');
    if (cancelBtn) {
      const eventId = cancelBtn.getAttribute('data-event-id');
      if (eventId) {
        openCancelModal(eventId);
      }
      return;
    }
  }

  function openCancelModal(eventId) {
    const event = state.registrations.find(e => e.id === eventId);
    if (!event) return;

    if (dom.cancelModal) {
      dom.cancelModal.hidden = false;
      document.body.style.overflow = 'hidden';
    }

    if (dom.cancelModalYes) {
      dom.cancelModalYes.onclick = () => confirmCancel(eventId, event);
    }
  }

  function closeCancelModal() {
    if (dom.cancelModal) {
      dom.cancelModal.hidden = true;
      document.body.style.overflow = '';
    }
  }

  function confirmCancel(eventId, event) {
    cancelEventRegistration(eventId);

    state.registeredIds = getRegisteredEventIds();
    state.registrations = state.registeredIds
      .map(id => state.events.find(e => e.id === id))
      .filter(Boolean);

    closeCancelModal();
    renderRegistrations();

    showToast(`Your registration for "${event.title}" was cancelled.`);
  }

  function renderRegistrations() {
    const now = new Date();
    const upcoming = state.registrations.filter(event => {
      const timing = resolveTimingGroup(event, now);
      return timing === TIME_FILTERS.UPCOMING || timing === TIME_FILTERS.ONGOING;
    });
    const past = state.registrations.filter(event => {
      const timing = resolveTimingGroup(event, now);
      return timing === TIME_FILTERS.PAST;
    });

    setText('upcomingCount', formatCount(upcoming.length, 'event'));
    setText('pastCount', formatCount(past.length, 'event'));

    dom.upcomingList.innerHTML = upcoming.length > 0
      ? upcoming.map(renderRegistrationCard).join('')
      : '<p class="registration-placeholder">No upcoming event registrations.</p>';

    dom.pastList.innerHTML = past.length > 0
      ? past.map(renderRegistrationCard).join('')
      : '<p class="registration-placeholder">No past event registrations.</p>';

    if (upcoming.length > 0) {
      initScrollReveal(dom.upcomingList);
    }
    if (past.length > 0) {
      initScrollReveal(dom.pastList);
    }

    if (state.registrations.length === 0) {
      dom.noRegistrationsState.hidden = false;
    } else {
      dom.noRegistrationsState.hidden = true;
    }
  }

  function renderRegistrationCard(event) {
    const now = new Date();
    const timing = resolveTimingGroup(event, now);
    const statusLabel = timing === TIME_FILTERS.UPCOMING
      ? 'Upcoming'
      : timing === TIME_FILTERS.ONGOING
        ? 'Ongoing'
        : 'Completed';
    const statusClass = `status-${timing}`;
    const registrationOpen = isRegistrationActive(event);
    const canCancel = timing !== TIME_FILTERS.COMPLETED && timing !== TIME_FILTERS.CANCELLED;

    return `
      <article class="registration-card" role="listitem" data-event-id="${escapeHtml(event.id)}">
        <div class="registration-card-header">
          <h3 class="registration-card-title">${escapeHtml(event.title)}</h3>
          <span class="registration-status-badge ${statusClass}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="registration-card-body">
          <div class="registration-fact">
            <svg class="fact-icon" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            <span class="fact-value">${escapeHtml(formatDateTime(event))}</span>
          </div>
          ${event.venue ? `
            <div class="registration-fact">
              <svg class="fact-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span class="fact-label">Venue:</span><span class="fact-value">${escapeHtml(event.venue)}</span>
            </div>` : ''}
          ${event.clubName ? `
            <div class="registration-fact registration-club-line">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
              </svg>
              <span class="fact-value">${escapeHtml(event.clubName)}</span>
            </div>` : ''}
          <div class="registration-fact">
            <svg class="fact-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 7v10M9 12h6"></path>
            </svg>
            <span class="fact-label">Event status:</span>
            <span class="fact-value">${escapeHtml(STATUS_LABELS[event.status] || event.status)}</span>
          </div>
        </div>
        <div class="registration-card-footer">
          <a href="event-details.html?id=${encodeURIComponent(event.id)}"
            class="btn btn-secondary btn-sm registration-view-details-btn"
            data-event-id="${escapeHtml(event.id)}">
            View Event Details
          </a>
          ${canCancel
            ? `<button type="button" class="btn btn-secondary btn-sm registration-cancel-btn"
              data-event-id="${escapeHtml(event.id)}" aria-label="Cancel registration for ${escapeHtml(event.title)}">
              Cancel Registration
            </button>`
            : ''
          }
        </div>
      </article>
    `;
  }

  function formatDateTime(event) {
    const date = formatDate(event.startDate);
    const time = [event.startTime, event.endTime].filter(Boolean).join(' – ');
    return time ? `${date} · ${time}` : date;
  }

  function formatDate(value) {
    if (!value) return 'Date TBA';
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return 'Date TBA';
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  function formatCount(count, label) {
    return count === 1 ? `1 ${label}` : `${count} ${label}s`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SCMSRegistrations = {
    refreshRegistrations: loadRegistrations,
    getRegistrations: () => state.registrations.slice()
  };
})();

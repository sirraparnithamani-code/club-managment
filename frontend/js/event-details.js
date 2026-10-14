/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - EVENT DETAILS PAGE MODULE
 * Page: pages/event-details.html
 *
 * Resolves a single published event from ?id=EVENT_ID and fills the page.
 * Nothing is hardcoded: every section is hidden unless the event record
 * actually carries that data.
 * ==========================================================================
 */

import {
  STATUS_LABELS,
  cancelEventRegistration,
  getEventDataSource,
  getSeatsRemaining,
  isRegisteredForEvent,
  isRegistrationActive,
  isVisibleToStudents,
  registerForEvent
} from './event-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

const EVENT_API_ENDPOINT = null;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const dataSource = getEventDataSource({ apiEndpoint: EVENT_API_ENDPOINT });

let currentEvent = null;

(function () {
  'use strict';

  if (!requireStudentSession()) return;

function init() {
    const eventId = new URLSearchParams(window.location.search).get('id');

    if (!eventId) {
      showNotFound();
      return;
    }

    loadEvent(eventId);
    
    // Listen for registration changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'scms_event_registrations' && currentEvent) {
        renderRegistration(currentEvent);
      }
    });
  }

  async function loadEvent(eventId) {
    let event = null;

    try {
      event = await dataSource.getById(eventId);
    } catch (error) {
      showNotFound();
      return;
    }

    if (!event || !isVisibleToStudents(event)) {
      showNotFound();
      return;
    }

    currentEvent = event;
    document.title = `${event.title} | SCMS`;

    renderEvent(event);
    attachEventListeners();
  }

  function showNotFound() {
    const details = document.getElementById('eventDetails');
    const notFound = document.getElementById('notFound');

    if (details) details.hidden = true;
    if (notFound) notFound.hidden = false;
  }

  function renderEvent(event) {
    const details = document.getElementById('eventDetails');
    if (details) details.hidden = false;

    setText('breadcrumbEventTitle', event.title);
    setText('eventTitle', event.title);

    renderBanner(event);
    renderStatus(event);
    renderClubLine(event);
    renderTypeBadge(event);
    renderDescription(event);
    renderInfoGrid(event);
    renderRegistration(event);
    renderContact(event);
  }

  function renderBanner(event) {
    const image = document.getElementById('eventBannerImage');
    const placeholder = document.getElementById('eventBannerPlaceholder');

    if (event.banner && image) {
      image.src = event.banner;
      image.alt = `${event.title} banner`;
      image.hidden = false;
      if (placeholder) placeholder.hidden = true;
      return;
    }

    if (placeholder) placeholder.hidden = false;
  }

  function renderStatus(event) {
    const badge = document.getElementById('eventStatusBadge');
    if (!badge) return;

    badge.textContent = STATUS_LABELS[event.status] || event.status;
    badge.className = `event-status-badge ${event.status}`;
    badge.hidden = false;
  }

  function renderClubLine(event) {
    const line = document.getElementById('eventClubLine');
    if (!line || !event.clubName) return;

    line.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
      ${escapeHtml(event.clubName)}
    `;
    line.hidden = false;
  }

  function renderTypeBadge(event) {
    const badge = document.getElementById('eventTypeBadge');
    const value = event.categoryLabel || event.eventType || event.category;
    if (!badge || !value) return;

    badge.textContent = value;
    badge.hidden = false;
  }

  function renderDescription(event) {
    const block = document.getElementById('eventDescriptionBlock');
    const target = document.getElementById('eventDescription');
    if (!event.description || !block || !target) return;

    event.description.split(/\n{2,}/).forEach(paragraph => {
      const p = document.createElement('p');
      p.textContent = paragraph.trim();
      target.appendChild(p);
    });
  }

  function renderInfoGrid(event) {
    const rows = [
      ['Date', formatDate(event.startDate)],
      ['Time', timeRange(event)],
      ['End date', event.endDate && event.endDate !== event.startDate ? formatDate(event.endDate) : ''],
      ['Venue', event.venue],
      ['Event type', event.categoryLabel || event.eventType || event.category],
      ['Status', STATUS_LABELS[event.status] || event.status]
    ].filter(row => row[1]);

    const grid = document.getElementById('eventInfoGrid');
    const block = document.getElementById('eventInfoBlock');
    if (!grid || rows.length === 0) {
      if (block) block.hidden = true;
      return;
    }

    grid.innerHTML = rows.map(row => `
      <div class="event-info-item">
        <span class="info-label">${row[0]}</span>
        <span class="info-value">${escapeHtml(row[1])}</span>
      </div>
    `).join('');
  }

  function renderRegistration(event) {
    const block = document.getElementById('eventRegistrationBlock');
    const btn = document.getElementById('registerBtn');

    if (!event.registrationEnabled) {
      if (block) block.hidden = true;
      return;
    }

    if (block) block.hidden = false;

    const open = isRegistrationActive(event);
    setText('registrationStatus', open ? 'Registration Open' : 'Registration Closed');

    const deadlineRow = document.getElementById('registrationDeadlineRow');
    if (deadlineRow) deadlineRow.hidden = !event.registrationDeadline;
    setText('registrationDeadline', formatDate(event.registrationDeadline));

    const eligibilityRow = document.getElementById('eligibilityRow');
    if (eligibilityRow) eligibilityRow.hidden = !event.eligibility;
    setText('eventEligibility', event.eligibility);

    const seatsLeft = getSeatsRemaining(event);
    const seatsRow = document.getElementById('seatsRow');
    if (seatsRow) seatsRow.hidden = seatsLeft === null;
    setText('eventSeats', seatsLeft === null ? '' : seatsLabel(event, seatsLeft));

    if (!btn) return;

    const registered = isRegisteredForEvent(event.id);

    if (registered) {
      btn.hidden = false;
      btn.disabled = false;
      btn.textContent = 'Registered';
      btn.classList.remove('btn-primary');
      btn.classList.add('btn-secondary');
      return;
    }

    btn.hidden = false;
    btn.textContent = open ? 'Register' : 'Registration Closed';
    btn.disabled = !open;
    btn.classList.add('btn-primary');
    btn.classList.remove('btn-secondary');
  }

  function renderContact(event) {
    const rows = [
      ['Organizing club', event.clubName],
      ['Email', event.contactEmail],
      ['Phone', event.contactPhone]
    ].filter(row => row[1]);

    const grid = document.getElementById('eventContactGrid');
    const block = document.getElementById('eventContactBlock');
    if (!grid || rows.length === 0) {
      if (block) block.hidden = true;
      return;
    }

    grid.innerHTML = rows.map(row => `
      <div class="event-info-item">
        <span class="info-label">${row[0]}</span>
        <span class="info-value">${escapeHtml(row[1])}</span>
      </div>
    `).join('');
  }

  function attachEventListeners() {
    const btn = document.getElementById('registerBtn');
    if (!btn || !currentEvent) return;

    btn.addEventListener('click', () => {
      if (isRegisteredForEvent(currentEvent.id)) {
        cancelEventRegistration(currentEvent.id);
        renderRegistration(currentEvent);
        showToast(`Your registration for "${currentEvent.title}" was cancelled.`);
        return;
      }

      registerForEvent(currentEvent.id);
      renderRegistration(currentEvent);
      showToast(`You are registered for "${currentEvent.title}".`);
    });
  }

  function seatsLabel(event, seatsLeft) {
    if (event.seatsTaken) {
      return `${seatsLeft} of ${event.seats} seats remaining`;
    }
    return `${event.seats} seats available`;
  }

  function timeRange(event) {
    return [event.startTime, event.endTime].filter(Boolean).join(' – ');
  }

  function formatDate(value) {
    if (!value) return '';

    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return '';

    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

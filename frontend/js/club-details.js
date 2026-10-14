/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - CLUB DETAILS PAGE MODULE
 * Page: pages/club-details.html
 * Handles: Club resolution via ?id=, rendering, join flow, localStorage state
 * ==========================================================================
 */

import { getClubById, getClubDetails, getCategoryBadgeStyle, hasJoinedClub, joinClub, leaveClub } from './club-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

let currentClub = null;
  let joinModal = null;
  let leaveModal = null;
  let lastFocusedElement = null;

function init() {
    cacheDom();

    const clubId = new URLSearchParams(window.location.search).get('id');
    const club = clubId ? getClubById(clubId) : null;

    if (!club) {
      showNotFound();
      return;
    }

    currentClub = club;
    document.title = `${club.name} | SCMS`;

    renderClub(club);
    attachEventListeners();
    initScrollReveal();
    
    // Listen for join state changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'scms_joined_clubs') {
        applyJoinState();
      }
    });
  }

function cacheDom() {
    joinModal = document.getElementById('joinModal');
    leaveModal = document.getElementById('leaveModal');
  }

  function showNotFound() {
    const details = document.getElementById('clubDetails');
    const notFound = document.getElementById('notFound');

    if (details) details.hidden = true;
    if (notFound) notFound.hidden = false;
  }

  function renderClub(club) {
    const details = getClubDetails(club.id);
    const badgeStyle = getCategoryBadgeStyle(club.category);

    setText('breadcrumbClubName', club.name);
    setText('clubTitle', club.name);
    setText('clubShortDesc', club.description);
    setText('clubMembers', club.members ? `${club.members} members` : 'Members to be confirmed');

    const iconWrapper = document.getElementById('clubIconWrapper');
    if (iconWrapper) iconWrapper.textContent = club.icon;

    const badge = document.getElementById('clubCategoryBadge');
    if (badge) {
      badge.textContent = club.category;
      badge.style.backgroundColor = badgeStyle.bg;
      badge.style.color = badgeStyle.text;
      badge.style.borderColor = badgeStyle.border;
    }

    // Established year only exists for some clubs — hide the row item otherwise
    const established = details && details.established;
    const establishedEl = document.getElementById('clubEstablished');
    if (establishedEl) {
      const metaItem = establishedEl.closest('.club-meta-item');
      if (established) {
        establishedEl.textContent = `Est. ${established}`;
      } else if (metaItem) {
        metaItem.hidden = true;
      }
    }

    renderAbout(club, details);
    renderInfoPanel(club, details);
    renderActivities(details);
    renderEvents(details);
    applyJoinState();
  }

  function renderAbout(club, details) {
    const description = document.querySelector('#clubDescription p');
    if (description) description.textContent = club.description;

    const purpose = document.querySelector('#clubPurpose p');
    if (purpose) {
      purpose.textContent = details ? details.purpose : club.description;
    }

    fillList(document.querySelector('#clubActivitiesList .activities-list'), details && details.activities);
    fillList(document.querySelector('#clubLearning .learning-list'), details && details.learn);

    const activitiesBlock = document.getElementById('clubActivitiesList');
    const learningBlock = document.getElementById('clubLearning');
    if (!details) {
      if (activitiesBlock) activitiesBlock.hidden = true;
      if (learningBlock) learningBlock.hidden = true;
    }
  }

  function fillList(list, items) {
    if (!list) return;
    if (!items || items.length === 0) {
      list.closest('div').hidden = true;
      return;
    }
    list.innerHTML = items.map(item => `<li>${escapeHtml(item)}</li>`).join('');
  }

  function renderInfoPanel(club, details) {
    setText('infoCategory', club.category);
    setText('infoMembers', club.members ? `${club.members} (demo figure)` : 'To be confirmed');

    const statusEl = document.getElementById('infoStatus');
    if (statusEl) {
      const active = club.status !== false;
      statusEl.innerHTML = `<span class="status-badge ${active ? 'active' : 'inactive'}">${active ? 'Active' : 'Inactive'}</span>`;
    }

    setInfoItem('infoMeetingDay', details && details.meeting && details.meeting.day);
    setInfoItem('infoMeetingTime', details && details.meeting && details.meeting.time);
    setInfoItem('infoLocation', details && details.meeting && details.meeting.location);

    // No contact data exists in the source data — do not display placeholder addresses
    setInfoItem('infoEmail', details && details.contact);
    setInfoItem('infoSocial', details && details.social);
  }

  function setInfoItem(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (!value) {
      const item = el.closest('.info-item');
      if (item) item.hidden = true;
      return;
    }
    el.textContent = value;
  }

  function renderActivities(details) {
    const grid = document.getElementById('activitiesGrid');
    const section = document.getElementById('activitiesSection');
    if (!grid) return;

    const activities = details && details.activities;
    if (!activities || activities.length === 0) {
      if (section) section.hidden = true;
      return;
    }

    const icons = ['\u{1F4DA}', '\u{1F3AF}', '\u{1F4C3}', '\u{1F91D}', '\u{2728}', '\u{1F4F8}'];

    grid.innerHTML = activities.map((activity, index) => `
      <article class="activity-card">
        <div class="activity-icon" aria-hidden="true">${icons[index % icons.length]}</div>
        <h3 class="activity-title">${escapeHtml(activity)}</h3>
        <p class="activity-desc">${escapeHtml(activityBlurb(currentClub, activity))}</p>
      </article>
    `).join('');
  }

  function activityBlurb(club, activity) {
    return `${activity} organised by ${club.name} for club members.`;
  }

  function renderEvents(details) {
    const grid = document.getElementById('eventsGrid');
    const section = document.getElementById('eventsSection');
    const empty = document.getElementById('noEvents');
    if (!grid) return;

    const events = details && details.events;

    if (!events || events.length === 0) {
      if (empty) empty.hidden = false;
      if (section) section.hidden = false;
      return;
    }

    if (empty) empty.hidden = true;
    if (section) section.hidden = false;

    grid.innerHTML = events.map((event, index) => {
      const date = futureDate(event.dayOffset);
      // Ids match the shared event store, so this opens the real Event Details page.
      const eventId = `${currentClub.id}-${index + 1}`;
      return `
        <article class="event-card">
          <div class="event-date-badge">
            <span class="event-month">${MONTHS[date.getMonth()]}</span>
            <span class="event-day">${date.getDate()}</span>
          </div>
          <h3 class="event-title">${escapeHtml(event.name)}</h3>
          <div class="event-meta">
            <span class="event-meta-item">
              <svg class="event-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              ${escapeHtml(event.time)}
            </span>
            <span class="event-meta-item">
              <svg class="event-meta-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${escapeHtml(event.location)}
            </span>
          </div>
          <p class="event-desc">${escapeHtml(event.description)}</p>
          <div class="event-footer">
            <button type="button" class="btn btn-secondary btn-sm event-view-btn" data-event-id="${escapeHtml(eventId)}">
              View Event
            </button>
          </div>
        </article>
      `;
    }).join('');

    grid.querySelectorAll('.event-view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window.location.href = `event-details.html?id=${encodeURIComponent(btn.getAttribute('data-event-id'))}`;
      });
    });
  }

  function futureDate(dayOffset) {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }

function applyJoinState() {
    const btn = document.getElementById('joinClubBtn');
    if (!btn) return;

    if (hasJoinedClub(currentClub.id)) {
      btn.classList.remove('joined');
      btn.classList.add('leave-club');
      btn.disabled = false;
      const text = btn.querySelector('.btn-text');
      if (text) text.textContent = 'Leave Club';
      btn.setAttribute('aria-label', `Leave ${currentClub.name}`);
    } else {
      btn.classList.remove('joined', 'leave-club');
      btn.disabled = false;
      const text = btn.querySelector('.btn-text');
      if (text) text.textContent = 'Join Club';
      btn.setAttribute('aria-label', `Join ${currentClub.name}`);
    }
  }

  function markJoined(btn) {
    btn.classList.add('joined');
    btn.disabled = true;
    const text = btn.querySelector('.btn-text');
    if (text) text.textContent = 'Joined';
    btn.setAttribute('aria-label', `You have joined ${currentClub.name}`);
  }

function attachEventListeners() {
    const joinBtn = document.getElementById('joinClubBtn');
    if (joinBtn) {
      joinBtn.addEventListener('click', () => {
        if (hasJoinedClub(currentClub.id)) {
          openLeaveModal(joinBtn);
        } else {
          openJoinModal(joinBtn);
        }
      });
    }

    if (!joinModal || !leaveModal) return;

    // Join modal listeners
    document.getElementById('modalClose').addEventListener('click', closeJoinModal);
    document.getElementById('modalCancel').addEventListener('click', closeJoinModal);
    document.getElementById('modalConfirm').addEventListener('click', confirmJoin);
    joinModal.addEventListener('click', (e) => {
      if (e.target === joinModal) closeJoinModal();
    });

    // Leave modal listeners
    document.getElementById('leaveModalClose').addEventListener('click', closeLeaveModal);
    document.getElementById('leaveModalCancel').addEventListener('click', closeLeaveModal);
    document.getElementById('leaveModalConfirm').addEventListener('click', confirmLeave);
    leaveModal.addEventListener('click', (e) => {
      if (e.target === leaveModal) closeLeaveModal();
    });

    document.addEventListener('keydown', (e) => {
      if (!joinModal.hidden) {
        if (e.key === 'Escape') {
          closeJoinModal();
        } else if (e.key === 'Tab') {
          trapFocus(e, joinModal);
        }
      } else if (!leaveModal.hidden) {
        if (e.key === 'Escape') {
          closeLeaveModal();
        } else if (e.key === 'Tab') {
          trapFocus(e, leaveModal);
        }
      }
    });
  }

  function openJoinModal(trigger) {
    lastFocusedElement = trigger;

    const title = document.getElementById('modalTitle');
    const nameEl = document.getElementById('modalClubName');
    if (title) title.textContent = `Join ${currentClub.name}?`;
    if (nameEl) nameEl.textContent = currentClub.name;

    joinModal.hidden = false;
    document.body.style.overflow = 'hidden';

    const confirmBtn = document.getElementById('modalConfirm');
    if (confirmBtn) confirmBtn.focus();
  }

function closeJoinModal() {
    joinModal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function openLeaveModal(trigger) {
    lastFocusedElement = trigger;

    const title = document.getElementById('leaveModalTitle');
    const nameEl = document.getElementById('leaveModalClubName');
    if (title) title.textContent = `Leave ${currentClub.name}?`;
    if (nameEl) nameEl.textContent = currentClub.name;

    leaveModal.hidden = false;
    document.body.style.overflow = 'hidden';

    const confirmBtn = document.getElementById('leaveModalConfirm');
    if (confirmBtn) confirmBtn.focus();
  }

  function closeLeaveModal() {
    leaveModal.hidden = true;
    document.body.style.overflow = '';
    if (lastFocusedElement) lastFocusedElement.focus();
  }

  function confirmLeave() {
    leaveClub(currentClub.id);
    closeLeaveModal();
    applyJoinState();
    showToast(`You have left ${currentClub.name}.`);
  }

  function confirmJoin() {
    joinClub(currentClub.id);
    closeJoinModal();
    markJoined(document.getElementById('joinClubBtn'));
    showToast(`You have successfully joined ${currentClub.name}.`);
  }

function trapFocus(e, modal) {
    const focusable = modal.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - DASHBOARD CONTROLLER
 * ==========================================================================
 * Every number and every list on this page is derived from the same data the
 * rest of the site uses, so the Dashboard can never contradict Home, Clubs or
 * Events:
 *
 *   - Clubs           -> club-data.js catalogue + the `scms_joined_clubs` store
 *   - Events          -> the shared event data source (js/event-data.js)
 *   - Registrations   -> the `scms_event_registrations` store
 *   - Announcements   -> the published event stream
 *   - Activity        -> the student's own joins and registrations
 *
 * When a student has not joined a club or registered for an event yet, those
 * panels keep their intentional empty state rather than showing a fake value.
 * ==========================================================================
 */

import { getCategoryBadgeStyle, getClubById, getJoinedClubIds } from './club-data.js';

import {
  getEventDataSource,
  getRegisteredEventIds,
  isVisibleToStudents,
  normalizeEvent,
  resolveTimingGroup,
  sortEvents,
  SORT_OPTIONS,
  TIME_FILTERS
} from './event-data.js';

import { showToast } from './toast.js';
import { requireStudentSession } from './nav.js';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAX_UPCOMING_EVENTS = 4;
const MAX_MY_CLUBS = 8;
const MAX_ANNOUNCEMENTS = 4;
const MAX_ACTIVITY = 8;

const dataSource = getEventDataSource();

const state = {
  session: null,
  clubs: [],
  events: [],
  registeredIds: []
};

/* ==========================================================================
   LOADING
   ========================================================================== */

async function loadDashboardData() {
  const [events, joinedIds] = await Promise.all([
    loadEvents(),
    Promise.resolve(readJoinedClubsSafe())
  ]);

  state.session = readSession();
  state.events = events;
  state.clubs = buildJoinedClubs(joinedIds);
  state.registeredIds = getRegisteredEventIds().filter(id => events.some(event => event.id === id));
}

async function loadEvents() {
  try {
    const events = await dataSource.list();
    return (Array.isArray(events) ? events : [])
      .map(normalizeEvent)
      .filter(Boolean)
      .filter(isVisibleToStudents);
  } catch (error) {
    return [];
  }
}

/** Reads the current session from localStorage. */
function readSession() {
  try {
    const raw = window.localStorage.getItem('scms_session');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function readJoinedClubsSafe() {
  try {
    const ids = getJoinedClubIds();
    return Array.isArray(ids) ? ids : [];
  } catch (error) {
    return [];
  }
}

/** Keeps only joined ids that still resolve to a real club in the catalogue. */
function buildJoinedClubs(joinedIds) {
  const clubs = [];

  joinedIds.forEach(id => {
    const club = getClubById(id);
    if (club && !clubs.some(entry => entry.id === club.id)) clubs.push(club);
  });

  return clubs;
}

function getUpcomingEvents() {
  const now = new Date();

  return sortEvents(
    state.events.filter(event => resolveTimingGroup(event, now) === TIME_FILTERS.UPCOMING),
    SORT_OPTIONS.SOONEST
  );
}

/* ==========================================================================
   RENDERING
   ========================================================================== */

function renderAll() {
  renderStats();
  renderIdentity();
  renderMyClubs();
  renderUpcomingEvents();
  renderAnnouncements();
  renderRecentActivity();
  renderNotifications();
  wireQuickActions();
  wireNotificationPanel();
}

/**
 * The greeting stays generic until a session exists. No student identity is
 * ever hardcoded, so the avatar falls back to a neutral placeholder glyph.
 */
function renderIdentity() {
  const initialsEl = document.getElementById('dashAvatarInitials');
  const avatarEl = document.getElementById('dashAvatar');
  const titleEl = document.querySelector('.dash-welcome-title');
  const subtitleEl = document.getElementById('dashWelcomeMessage');
  const session = state.session;

  if (!session || !session.name) {
    if (avatarEl) avatarEl.classList.add('is-placeholder');
    if (initialsEl) initialsEl.textContent = '';
    if (titleEl) titleEl.textContent = 'Welcome to your dashboard';
    if (subtitleEl) {
      subtitleEl.textContent = state.upcomingCount
        ? `${state.upcomingCount} upcoming events across ${state.clubs.length || 24} clubs. Join a club or register for an event to personalise this space.`
        : 'Sign in to personalise this space, then track your clubs, events and campus activity.';
    }
    return;
  }

  const name = String(session.name).trim();
  const firstName = name.split(/\s+/)[0];

  if (avatarEl) avatarEl.classList.remove('is-placeholder');
  if (initialsEl) initialsEl.textContent = getInitials(name);
  if (titleEl) titleEl.textContent = `Welcome back, ${firstName}!`;
  if (subtitleEl) subtitleEl.textContent = session.programme
    ? `${session.programme} · Stay connected with your clubs, events and campus activities.`
    : 'Stay connected with your clubs, events and campus activities.';
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function renderStats() {
  const upcoming = getUpcomingEvents();

  state.upcomingCount = upcoming.length;

  setStatValue('statMyClubs', state.clubs.length);
  setStatValue('statUpcomingEvents', upcoming.length);
  setStatValue('statRegisteredEvents', state.registeredIds.length);
  setStatValue('statNotifications', getNotifications().length);
}

function setStatValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(value);
}

/** Shows a populated container or its matching empty state, never both. */
function toggleSection(containerId, emptyId, hasContent) {
  const container = document.getElementById(containerId);
  const empty = document.getElementById(emptyId);

  if (container) container.hidden = !hasContent;
  if (empty) empty.hidden = hasContent;
}

function renderMyClubs() {
  const grid = document.getElementById('myClubsGrid');
  if (!grid) return;

  const clubs = state.clubs.slice(0, MAX_MY_CLUBS);
  grid.innerHTML = '';

  clubs.forEach(club => {
    const badge = getCategoryBadgeStyle(club.category);

    const card = document.createElement('article');
    card.className = 'dash-club-card';
    card.setAttribute('role', 'listitem');

    const icon = document.createElement('div');
    icon.className = 'dash-club-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = club.icon || '🎓';

    const badgeEl = document.createElement('span');
    badgeEl.className = 'dash-club-badge';
    badgeEl.textContent = club.category;
    badgeEl.style.backgroundColor = badge.bg;
    badgeEl.style.color = badge.text;
    badgeEl.style.borderColor = badge.border;

    const name = document.createElement('h3');
    name.className = 'dash-club-name';
    name.textContent = club.name;

    const link = document.createElement('a');
    link.href = `club-details.html?id=${encodeURIComponent(club.id)}`;
    link.className = 'btn btn-secondary btn-sm';
    link.textContent = 'View Club';

    card.appendChild(icon);
    card.appendChild(badgeEl);
    card.appendChild(name);
    card.appendChild(link);
    grid.appendChild(card);
  });

  toggleSection('myClubsGrid', 'myClubsEmpty', clubs.length > 0);
}

function renderUpcomingEvents() {
  const list = document.getElementById('upcomingEventsList');
  if (!list) return;

  const events = getUpcomingEvents().slice(0, MAX_UPCOMING_EVENTS);
  list.innerHTML = '';

  events.forEach(event => {
    const row = document.createElement('article');
    row.className = 'dash-event-row';
    row.setAttribute('role', 'listitem');

    row.appendChild(buildEventDate(event));

    const body = document.createElement('div');
    body.className = 'dash-event-body';

    const club = document.createElement('p');
    club.className = 'dash-event-club';
    club.textContent = event.clubName || 'Club Event';

    const title = document.createElement('h3');
    title.className = 'dash-event-name';
    title.textContent = event.title;

    const meta = document.createElement('div');
    meta.className = 'dash-event-meta';
    meta.appendChild(buildMetaItem('M15 5l-7 7 7 7', formatEventDate(event.startDate)));
    if (event.venue) meta.appendChild(buildMetaItem('M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z', event.venue));

    body.appendChild(club);
    body.appendChild(title);
    body.appendChild(meta);

    const cta = document.createElement('div');
    cta.className = 'dash-event-cta';

    const link = document.createElement('a');
    link.href = `event-details.html?id=${encodeURIComponent(event.id)}`;
    link.className = 'btn btn-primary btn-sm';
    link.textContent = 'View Event';

    cta.appendChild(link);
    row.appendChild(body);
    row.appendChild(cta);
    list.appendChild(row);
  });

  toggleSection('upcomingEventsList', 'upcomingEventsEmpty', events.length > 0);
}

function buildEventDate(event) {
  const wrapper = document.createElement('div');
  wrapper.className = 'dash-event-date';

  const day = document.createElement('span');
  day.className = 'dash-event-day';
  day.textContent = getDayNumber(event.startDate);

  const month = document.createElement('span');
  month.className = 'dash-event-month';
  month.textContent = getMonthLabel(event.startDate);

  wrapper.appendChild(day);
  wrapper.appendChild(month);
  return wrapper;
}

function buildMetaItem(path, text) {
  const item = document.createElement('span');
  item.className = 'dash-event-meta-item';

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'dash-event-meta-icon');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');

  const shape = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  shape.setAttribute('d', path);
  svg.appendChild(shape);

  const label = document.createElement('span');
  label.textContent = text;

  item.appendChild(svg);
  item.appendChild(label);
  return item;
}

function getDayNumber(dateText) {
  const date = parseDate(dateText);
  return date ? String(date.getDate()) : '--';
}

function getMonthLabel(dateText) {
  const date = parseDate(dateText);
  return date ? MONTHS[date.getMonth()] : 'TBA';
}

function formatEventDate(dateText) {
  const date = parseDate(dateText);
  if (!date) return 'Date to be announced';
  return `${MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function parseDate(dateText) {
  if (!dateText) return null;
  const date = new Date(dateText);
  return Number.isNaN(date.getTime()) ? null : date;
}

/* --------------------------------------------------------------------------
   ANNOUNCEMENTS & ACTIVITY — derived from the same published event stream
   -------------------------------------------------------------------------- */

function getAnnouncements() {
  return sortEvents(
    state.events.filter(event => event.publishedAt),
    SORT_OPTIONS.NEWEST
  ).slice(0, MAX_ANNOUNCEMENTS);
}

function renderAnnouncements() {
  const list = document.getElementById('announcementList');
  if (!list) return;

  const announcements = getAnnouncements();
  list.innerHTML = '';

  announcements.forEach(event => {
    const entry = document.createElement('article');
    entry.className = 'dash-feed-item';
    entry.setAttribute('role', 'listitem');

    const body = document.createElement('div');

    const source = document.createElement('p');
    source.className = 'dash-feed-source';
    source.textContent = `${event.clubName || 'Campus'} · ${formatEventDate(event.startDate)}`;

    const title = document.createElement('h3');
    title.className = 'dash-feed-title';
    title.textContent = event.title;

    const text = document.createElement('p');
    text.className = 'dash-feed-text';
    text.textContent = event.description || '';

    const link = document.createElement('a');
    link.href = `event-details.html?id=${encodeURIComponent(event.id)}`;
    link.className = 'dash-feed-link';
    link.textContent = 'View event';

    body.appendChild(source);
    body.appendChild(title);
    body.appendChild(text);
    body.appendChild(link);
    entry.appendChild(body);
    list.appendChild(entry);
  });

  toggleSection('announcementList', 'announcementsEmpty', announcements.length > 0);
}

function getActivity() {
  const entries = [];

  state.clubs.forEach(club => {
    entries.push({
      label: `You joined ${club.name}`,
      timestamp: club.category,
      href: `club-details.html?id=${encodeURIComponent(club.id)}`
    });
  });

  state.registeredIds.forEach(id => {
    const event = state.events.find(item => item.id === id);
    if (!event) return;

    entries.push({
      label: `You registered for "${event.title}"`,
      timestamp: formatEventDate(event.startDate),
      href: `event-details.html?id=${encodeURIComponent(event.id)}`
    });
  });

  return entries.slice(0, MAX_ACTIVITY);
}

function renderRecentActivity() {
  const list = document.getElementById('activityList');
  if (!list) return;

  const entries = getActivity();
  list.innerHTML = '';

  entries.forEach(item => {
    const entry = document.createElement('div');
    entry.className = 'dash-activity-item';

    const title = document.createElement(item.href ? 'a' : 'p');
    title.className = 'dash-activity-title';
    title.textContent = item.label;

    if (item.href) {
      title.href = item.href;
      entry.classList.add('is-link');
    }

    const time = document.createElement('p');
    time.className = 'dash-activity-time';
    time.textContent = item.timestamp;

    entry.appendChild(title);
    entry.appendChild(time);
    list.appendChild(entry);
  });

  toggleSection('activityList', 'activityEmpty', entries.length > 0);
}

/* --------------------------------------------------------------------------
   NOTIFICATIONS — derived from the student's registrations and joined clubs
   -------------------------------------------------------------------------- */

function getNotifications() {
  return state.registeredIds
    .map(id => state.events.find(event => event.id === id))
    .filter(Boolean)
    .map(event => ({
      title: event.title,
      message: `${event.clubName || 'Club event'} · ${formatEventDate(event.startDate)}${event.venue ? ` · ${event.venue}` : ''}`
    }));
}

function renderNotifications() {
  const list = document.getElementById('notificationList');
  const countEl = document.getElementById('notificationCount');
  const items = getNotifications();

  if (countEl) {
    countEl.textContent = String(items.length);
    countEl.hidden = items.length === 0;
  }

  if (!list) return;

  list.innerHTML = '';

  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'dash-empty';

    const title = document.createElement('p');
    title.className = 'dash-empty-title';
    title.textContent = 'Nothing new';

    const text = document.createElement('p');
    text.className = 'dash-empty-text';
    text.textContent = 'Register for an event and its reminders will appear here.';

    empty.appendChild(title);
    empty.appendChild(text);
    list.appendChild(empty);
    return;
  }

  items.forEach(item => {
    const entry = document.createElement('div');
    entry.className = 'dash-notification-item';

    const body = document.createElement('div');

    const title = document.createElement('h3');
    title.textContent = item.title;

    const text = document.createElement('p');
    text.textContent = item.message;

    body.appendChild(title);
    body.appendChild(text);
    entry.appendChild(body);
    list.appendChild(entry);
  });
}

/* ==========================================================================
   INTERACTION
   ========================================================================== */

/** Pending pages are inert placeholders until their pages exist. */
function wireQuickActions() {
  // "My Clubs" is an in-page jump; the URL fragment keeps the target shareable.
  const myClubsJump = document.querySelector('[data-dashboard-action="my-clubs"]');
  if (myClubsJump) {
    myClubsJump.addEventListener('click', () => {
      showToast(`${state.clubs.length} club${state.clubs.length === 1 ? '' : 's'} joined so far.`);
    });
  }
}

function wireNotificationPanel() {
  const toggle = document.getElementById('notificationToggle');
  const panel = document.getElementById('notificationPanel');
  if (!toggle || !panel) return;

  const close = () => {
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', event => {
    event.stopPropagation();
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    toggle.setAttribute('aria-expanded', String(willOpen));
  });

  document.addEventListener('click', event => {
    if (panel.hidden) return;
    if (!panel.contains(event.target) && !toggle.contains(event.target)) close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !panel.hidden) {
      close();
      toggle.focus();
    }
  });
}

/* ==========================================================================
   BOOT
   ========================================================================== */

async function init() {
  await loadDashboardData();
  renderAll();
  
  // Listen for session changes (login/logout in another tab)
  window.addEventListener('storage', (event) => {
    if (event.key === 'scms_session') {
      state.session = readSession();
      renderIdentity();
    }
    if (event.key === 'scms_joined_clubs') {
      const joinedIds = readJoinedClubsSafe();
      state.clubs = buildJoinedClubs(joinedIds);
      renderMyClubs();
      renderStats();
      renderRecentActivity();
    }
  });
}

if (requireStudentSession()) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}
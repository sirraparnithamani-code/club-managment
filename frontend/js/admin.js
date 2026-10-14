/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - ADMIN CONSOLE
 * Page: pages/admin.html
 * Vanilla JavaScript (Zero external libraries or frameworks)
 * ==========================================================================
 * Data provenance, stated up front because it matters for an admin surface:
 *
 *   REAL (read-only)      Clubs and events are read from the same modules the
 *                         student pages use - club-data.js and event-data.js.
 *                         The console never writes to `scms_events` or
 *                         `scms_joined_clubs`, so an administrator cannot
 *                         corrupt what students see.
 *
 *   LOCAL SAMPLE          Students, approvals, registrations and announcements
 *                         have no backend yet, so they live in this browser
 *                         under `scms_admin_*` keys and are clearly labelled as
 *                         sample data in the UI.
 *
 *   LOCAL OVERRIDES       Console-only flags (featured / cancelled) are kept in
 *                         `scms_admin_overrides` and merged over the real record
 *                         at render time. This gives administrators real
 *                         behaviour without mutating shared student state.
 *
 * Navigation isolation: this module never imports js/nav.js and no admin view
 * is registered in NAV_ITEMS, so the student site navigation is untouched.
 * ==========================================================================
 */

import { escapeHtml, setText } from './dom.js';
import { showToast } from './toast.js';
import { getCategories, getCategoryBadgeStyle, getClubData, toCategorySlug } from './club-data.js';
import {
  EVENT_STATUS,
  getEventDataSource,
  getSeatsRemaining,
  STATUS_LABELS
} from './event-data.js';

/* ==========================================================================
   ADMIN ROUTE GUARD
   Runs before any initialization. Redirects if no valid admin session exists.
   ========================================================================== */
const ADMIN_SESSION_KEY = 'scms_session';
function readAdminSession() {
  try {
    const raw = window.localStorage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

const adminSession = readAdminSession();
const isAdmin = adminSession && adminSession.role === 'admin';
if (!isAdmin) {
  // Not an admin - redirect to login without clearing valid student/coordinator sessions
  window.location.href = '../pages/login.html';
}

/* ==========================================================================
   CONSTANTS
   ========================================================================== */

const STORAGE = {
  students: 'scms_admin_students',
  approvals: 'scms_admin_approvals',
  announcements: 'scms_admin_announcements',
  settings: 'scms_admin_settings',
  overrides: 'scms_admin_overrides'
};

const VIEWS = {
  dashboard: { title: 'Dashboard', sub: 'Overview of SCMS activity' },
  students: { title: 'Students', sub: 'Search, verify and manage student records' },
  clubs: { title: 'Clubs', sub: 'Review and feature registered clubs' },
  events: { title: 'Events', sub: 'Monitor the event catalogue' },
  announcements: { title: 'Announcements', sub: 'Publish updates for students' },
  reports: { title: 'Reports', sub: 'Activity metrics and trends' },
  settings: { title: 'Settings', sub: 'Console preferences and local data' }
};

const WEEKS = 8;

const DEFAULT_SETTINGS = {
  requireClubApproval: true,
  requireEventApproval: true,
  emailOnApproval: false,
  showDrafts: false
};

/* ==========================================================================
   DETERMINISTIC SAMPLE DATA
   A seeded generator keeps the sample dataset identical on every device, so
   charts and totals do not shuffle on each reload before persistence kicks in.
   ========================================================================== */

function makeRandom(seed) {
  let state = seed >>> 0;

  return function next() {
    state = (state + 0x6D2B79F5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SAMPLE_FIRST_NAMES = [
  'Aarav', 'Diya', 'Vihaan', 'Ananya', 'Rohan', 'Ishita', 'Kabir', 'Meera',
  'Arjun', 'Saanvi', 'Aditya', 'Nisha', 'Rahul', 'Priya', 'Karan', 'Sneha',
  'Devansh', 'Aisha', 'Yash', 'Pooja', 'Manav', 'Riya', 'Siddharth', 'Neha'
];

const SAMPLE_LAST_NAMES = [
  'Sharma', 'Verma', 'Iyer', 'Nair', 'Reddy', 'Patel', 'Gupta', 'Menon',
  'Kulkarni', 'Bose', 'Rao', 'Singh', 'Das', 'Joshi', 'Mehta', 'Kapoor'
];

const SAMPLE_DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Biotechnology',
  'Business Administration', 'Design', 'Physics'
];

const STUDENT_STATUSES = ['active', 'active', 'active', 'active', 'pending', 'suspended'];

function daysAgo(days) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function buildSampleStudents(count = 34) {
  const random = makeRandom(20260907);
  const clubs = getClubData().map(club => club.id);
  const students = [];

  for (let index = 0; index < count; index += 1) {
    const first = SAMPLE_FIRST_NAMES[Math.floor(random() * SAMPLE_FIRST_NAMES.length)];
    const last = SAMPLE_LAST_NAMES[Math.floor(random() * SAMPLE_LAST_NAMES.length)];
    const year = 2023 + Math.floor(random() * 3);

    // Spread joins across the last 10 weeks so the weekly charts have shape.
    const joinedDaysAgo = Math.floor(random() * 70) + 1;
    const clubCount = Math.floor(random() * 4);

    const studentClubs = [];
    while (studentClubs.length < clubCount && clubs.length) {
      const candidate = clubs[Math.floor(random() * clubs.length)];
      if (!studentClubs.includes(candidate)) studentClubs.push(candidate);
    }

    students.push({
      id: `stu-${String(index + 1).padStart(3, '0')}`,
      name: `${first} ${last}`,
      rollNumber: `${year}${String(100000 + Math.floor(random() * 899999)).slice(0, 6)}`,
      department: SAMPLE_DEPARTMENTS[Math.floor(random() * SAMPLE_DEPARTMENTS.length)],
      year: `${year}-${year + 1}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@university.edu`,
      status: STUDENT_STATUSES[Math.floor(random() * STUDENT_STATUSES.length)],
      clubs: studentClubs,
      registrationCount: Math.floor(random() * 5),
      joinedAt: daysAgo(joinedDaysAgo),
      clubJoinedDaysAgo: Math.floor(random() * 56) + 1
    });
  }

  return students;
}

function buildSampleApprovals(students) {
  const random = makeRandom(77123);
  const clubs = getClubData();
  const items = [];

  // A few club submissions waiting for review.
  clubs.slice(0, 3).forEach((club, index) => {
    items.push({
      id: `appr-club-${index + 1}`,
      type: 'club',
      typeLabel: 'Club',
      title: club.name,
      detail: `${club.category} · submitted by club coordinator`,
      submittedAt: daysAgo(Math.floor(random() * 6) + 1),
      targetId: club.id
    });
  });

  // Two event submissions.
  clubs.slice(3, 5).forEach((club, index) => {
    items.push({
      id: `appr-event-${index + 1}`,
      type: 'event',
      typeLabel: 'Event',
      title: `${club.name} showcase`,
      detail: 'Event awaiting publication approval',
      submittedAt: daysAgo(Math.floor(random() * 5) + 1),
      targetId: club.id
    });
  });

  // Student verification requests come from the sample roster.
  students
    .filter(student => student.status === 'pending')
    .slice(0, 3)
    .forEach((student, index) => {
      items.push({
        id: `appr-student-${index + 1}`,
        type: 'student',
        typeLabel: 'Student',
        title: student.name,
        detail: `${student.rollNumber} · ${student.department}`,
        submittedAt: student.joinedAt,
        targetId: student.id
      });
    });

  return items.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

/* ==========================================================================
   LOCAL STORE
   Every access is defensive: a corrupt record or a browser that refuses
   localStorage must degrade to working defaults, never to a blank page.
   ========================================================================== */

function readStore(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed = JSON.parse(raw);
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (error) {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

const state = {
  students: [],
  approvals: [],
  announcements: [],
  settings: { ...DEFAULT_SETTINGS },
  overrides: {},
  events: [],
  activeView: 'dashboard'
};

function loadState() {
  state.students = readStore(STORAGE.students, null) || buildSampleStudents();
  state.approvals = readStore(STORAGE.approvals, null) || buildSampleApprovals(state.students);
  state.announcements = readStore(STORAGE.announcements, []);
  state.settings = { ...DEFAULT_SETTINGS, ...(readStore(STORAGE.settings, {}) || {}) };
  state.overrides = readStore(STORAGE.overrides, {}) || {};

  // Persist the freshly seeded sample data so totals stay stable.
  writeStore(STORAGE.students, state.students);
  writeStore(STORAGE.approvals, state.approvals);
}

function persistStudents() {
  return writeStore(STORAGE.students, state.students);
}

function persistApprovals() {
  return writeStore(STORAGE.approvals, state.approvals);
}

function persistAnnouncements() {
  return writeStore(STORAGE.announcements, state.announcements);
}

function persistSettings() {
  return writeStore(STORAGE.settings, state.settings);
}

function persistOverrides() {
  return writeStore(STORAGE.overrides, state.overrides);
}

/* ==========================================================================
   FORMAT HELPERS
   ========================================================================== */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Aarav Sharma" -> "AS" */
function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Parses YYYY-MM-DD without letting the timezone shift the day. */
function parseDay(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
}

function formatDay(value) {
  const date = parseDay(value);
  if (!date) return 'Date TBA';

  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

function formatRelative(value) {
  const date = parseDay(value);
  if (!date) return 'recently';

  const days = Math.round((Date.now() - date.getTime()) / 86400000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
  return formatDay(value);
}

/** Start-of-week buckets for the last N weeks, oldest first. */
function weekBuckets(count = WEEKS) {
  const buckets = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const start = new Date(today);
    start.setDate(start.getDate() - (offset * 7) + 3); // align to a Sunday-ish boundary
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    buckets.push({
      label: `${start.getDate()}/${start.getMonth() + 1}`,
      start,
      end,
      count: 0
    });
  }

  return buckets;
}

function bucketise(isoDate, buckets) {
  const date = parseDay(isoDate);
  if (!date) return -1;

  return buckets.findIndex(bucket => date >= bucket.start && date < bucket.end);
}

/* ==========================================================================
   SVG CHART BUILDERS
   Hand-built so the console needs no chart library, matching the project's
   zero-dependency rule. Every chart returns an SVG string sized by viewBox so
   it scales with the panel.
   ========================================================================== */

const CHART_COLORS = {
  primary: 'var(--accent-primary)',
  sage: 'var(--badge-sage-text)',
  clay: 'var(--badge-clay-text)',
  plum: 'var(--badge-plum-text)',
  muted: 'var(--border-hover)'
};

/** Rounds a maximum up to a friendly axis top. */
function niceMax(value) {
  if (value <= 5) return 5;
  if (value <= 10) return 10;
  if (value <= 25) return 25;
  if (value <= 50) return 50;
  if (value <= 100) return 100;
  return Math.ceil(value / 100) * 100;
}

/** Area + line chart with grid lines and axis labels. */
function buildLineChart(points, labels, options = {}) {
  const width = options.width || 340;
  const height = options.height || 190;
  const padLeft = 30;
  const padRight = 10;
  const padTop = 14;
  const padBottom = 24;

  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const max = niceMax(Math.max(...points, 1));
  const count = points.length;

  const xAt = index => padLeft + (innerWidth * index) / Math.max(count - 1, 1);
  const yAt = value => padTop + innerHeight - (innerHeight * value) / max;
  const baseline = padTop + innerHeight;

  const coords = points.map((value, index) => [xAt(index), yAt(value)]);
  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${coords[coords.length - 1][0].toFixed(1)},${baseline} L${coords[0][0].toFixed(1)},${baseline} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
    .map(step => {
      const y = padTop + innerHeight * (1 - step);
      const value = Math.round(max * step);
      return `<line class="admin-chart-grid-line" x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}"></line>
        <text class="admin-chart-axis-label" x="${padLeft - 6}" y="${(y + 3).toFixed(1)}" text-anchor="end">${value}</text>`;
    })
    .join('');

  // Label every other point so a dense series stays readable.
  const labelStep = count > 6 ? 2 : 1;
  const xLabels = labels
    .map((label, index) => (index % labelStep === 0 || index === count - 1
      ? `<text class="admin-chart-axis-label" x="${xAt(index).toFixed(1)}" y="${height - 7}" text-anchor="middle">${escapeHtml(label)}</text>`
      : ''))
    .join('');

  const dots = coords
    .map(([x, y], index) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="var(--color-surface)" stroke="${options.color || CHART_COLORS.primary}" stroke-width="2">
        <title>${escapeHtml(labels[index])}: ${points[index]}</title>
      </circle>`)
    .join('');

  const gradientId = `grad-${Math.abs(hashString(labels.join('|')))}`;

  return `<svg class="admin-chart" viewBox="0 0 ${width} ${height}" role="img"
      aria-label="${escapeHtml(options.label || 'Activity over time')}">
      <defs>
        <linearGradient id="${gradientId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="${options.color || CHART_COLORS.primary}" stop-opacity="0.28"></stop>
          <stop offset="100%" stop-color="${options.color || CHART_COLORS.primary}" stop-opacity="0.02"></stop>
        </linearGradient>
      </defs>
      ${gridLines}
      <path d="${areaPath}" fill="url(#${gradientId})"></path>
      <path d="${linePath}" fill="none" stroke="${options.color || CHART_COLORS.primary}" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round"></path>
      ${dots}
      ${xLabels}
    </svg>`;
}

/** Vertical bar chart with value labels. */
function buildBarChart(items, options = {}) {
  const width = options.width || 340;
  const height = options.height || 190;
  const padLeft = 30;
  const padRight = 10;
  const padTop = 18;
  const padBottom = 26;

  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;
  const max = niceMax(Math.max(...items.map(item => item.value), 1));
  const slot = innerWidth / Math.max(items.length, 1);
  const barWidth = Math.min(slot * 0.58, 30);
  const baseline = padTop + innerHeight;

  const gridLines = [0, 0.5, 1]
    .map(step => {
      const y = padTop + innerHeight * (1 - step);
      return `<line class="admin-chart-grid-line" x1="${padLeft}" y1="${y.toFixed(1)}" x2="${width - padRight}" y2="${y.toFixed(1)}"></line>`;
    })
    .join('');

  const bars = items.map((item, index) => {
    const barHeight = (innerHeight * item.value) / max;
    const x = padLeft + slot * index + (slot - barWidth) / 2;
    const y = baseline - barHeight;

    return `<rect class="admin-chart-bar" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth.toFixed(1)}"
        height="${Math.max(barHeight, 1).toFixed(1)}" rx="4" fill="${item.color || options.color || CHART_COLORS.primary}">
        <title>${escapeHtml(item.label)}: ${item.value}</title>
      </rect>
      <text class="admin-chart-value-label" x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 5).toFixed(1)}"
        text-anchor="middle">${item.value}</text>
      <text class="admin-chart-axis-label" x="${(x + barWidth / 2).toFixed(1)}" y="${height - 8}"
        text-anchor="middle">${escapeHtml(item.short || item.label)}</text>`;
  }).join('');

  return `<svg class="admin-chart" viewBox="0 0 ${width} ${height}" role="img"
      aria-label="${escapeHtml(options.label || 'Comparison by category')}">
      ${gridLines}
      ${bars}
    </svg>`;
}

/** Donut chart with a legend, used for the event lifecycle split. */
function buildDonutChart(slices) {
  const size = 190;
  const radius = 66;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  let offset = 0;
  const rings = slices.map(slice => {
    const fraction = total ? slice.value / total : 0;
    const length = fraction * circumference;
    const dash = `${length.toFixed(2)} ${(circumference - length).toFixed(2)}`;

    const segment = `<circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
        stroke="${slice.color}" stroke-width="${strokeWidth}" stroke-dasharray="${dash}"
        stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${size / 2} ${size / 2})">
        <title>${escapeHtml(slice.label)}: ${slice.value}</title>
      </circle>`;

    offset += length;
    return segment;
  }).join('');

  const legend = slices.map(slice => `
    <span class="admin-chart-legend-item">
      <span class="admin-chart-swatch" style="background:${slice.color}"></span>
      ${escapeHtml(slice.label)} (${slice.value})
    </span>`).join('');

  return `<svg class="admin-chart" viewBox="0 0 ${size} ${size}" role="img"
      aria-label="Event status distribution">
      <circle cx="${size / 2}" cy="${size / 2}" r="${radius}" fill="none"
        stroke="var(--bg-secondary)" stroke-width="${strokeWidth}"></circle>
      ${rings}
      <text x="${size / 2}" y="${size / 2 - 2}" text-anchor="middle"
        style="font-size:1.5rem;font-weight:700;fill:var(--text-primary)">${total}</text>
      <text x="${size / 2}" y="${size / 2 + 16}" text-anchor="middle"
        style="font-size:10px;fill:var(--text-muted)">events</text>
    </svg>
    <div class="admin-chart-legend">${legend}</div>`;
}

/** Small stable hash so gradient ids do not collide between charts. */
function hashString(value) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return hash;
}

function renderChart(containerId, markup) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = markup || '<p class="admin-chart-empty">No data available.</p>';
}

/* ==========================================================================
   LIVE DATA HELPERS
   ========================================================================== */

/** Merges console-local overrides over the shared event record. */
function effectiveEvent(event) {
  const override = state.overrides[`event:${event.id}`] || {};
  const status = override.status || event.status;

  return { ...event, status, featured: override.featured === true };
}

function effectiveClub(club) {
  const override = state.overrides[`club:${club.id}`] || {};
  return { ...club, featured: override.featured === true };
}

/** Groups events into the four buckets the donut chart displays. */
function eventStatusSlices() {
  const buckets = {
    live: { label: 'Live / open', value: 0, color: CHART_COLORS.sage },
    upcoming: { label: 'Registration closed', value: 0, color: CHART_COLORS.primary },
    finished: { label: 'Completed', value: 0, color: CHART_COLORS.clay },
    cancelled: { label: 'Cancelled / draft', value: 0, color: CHART_COLORS.muted }
  };

  state.events.forEach(raw => {
    const event = effectiveEvent(raw);

    switch (event.status) {
      case EVENT_STATUS.REGISTRATION_OPEN:
      case EVENT_STATUS.ONGOING:
      case EVENT_STATUS.PUBLISHED:
        buckets.live.value += 1;
        break;
      case EVENT_STATUS.REGISTRATION_CLOSED:
      case EVENT_STATUS.PENDING_APPROVAL:
        buckets.upcoming.value += 1;
        break;
      case EVENT_STATUS.COMPLETED:
        buckets.finished.value += 1;
        break;
      default:
        buckets.cancelled.value += 1;
    }
  });

  return Object.values(buckets).filter(slice => slice.value > 0);
}

/* ==========================================================================
   VIEW ROUTER
   ========================================================================== */

function switchView(name) {
  const meta = VIEWS[name];
  if (!meta) return;

  state.activeView = name;

  document.querySelectorAll('[data-view-panel]').forEach(panel => {
    const isActive = panel.dataset.viewPanel === name;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  });

  document.querySelectorAll('#adminNav [data-view]').forEach(link => {
    const isActive = link.dataset.view === name;
    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  setText('adminViewTitle', meta.title);
  setText('adminViewSub', meta.sub);

  if (window.location.hash !== `#${name}`) {
    window.history.replaceState(null, '', `#${name}`);
  }

  closeSidebar();
}

function initRouter() {
  document.querySelectorAll('#adminNav [data-view]').forEach(link => {
    link.addEventListener('click', () => switchView(link.dataset.view));
  });

  document.querySelectorAll('[data-goto]').forEach(button => {
    button.addEventListener('click', () => switchView(button.dataset.goto));
  });

  window.addEventListener('hashchange', () => {
    const name = window.location.hash.replace('#', '');
    if (VIEWS[name] && name !== state.activeView) switchView(name);
  });

  const initial = window.location.hash.replace('#', '');
  switchView(VIEWS[initial] ? initial : 'dashboard');
}

/* ==========================================================================
   MOBILE SIDEBAR
   ========================================================================== */

function openSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('adminBackdrop');
  const toggle = document.getElementById('adminSidebarToggle');
  if (!sidebar || !backdrop) return;

  sidebar.classList.add('is-open');
  backdrop.hidden = false;
  backdrop.classList.add('is-open');
  toggle.setAttribute('aria-expanded', 'true');
  document.body.style.overflow = 'hidden';
}

function closeSidebar() {
  const sidebar = document.getElementById('adminSidebar');
  const backdrop = document.getElementById('adminBackdrop');
  const toggle = document.getElementById('adminSidebarToggle');
  if (!sidebar || !backdrop) return;

  sidebar.classList.remove('is-open');
  backdrop.classList.remove('is-open');
  backdrop.hidden = true;
  toggle.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

function initSidebar() {
  const toggle = document.getElementById('adminSidebarToggle');
  const backdrop = document.getElementById('adminBackdrop');

  if (toggle) toggle.addEventListener('click', () => {
    const sidebar = document.getElementById('adminSidebar');
    if (sidebar && sidebar.classList.contains('is-open')) {
      closeSidebar();
    } else {
      openSidebar();
    }
  });

  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeSidebar();
      closeModal();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 899) closeSidebar();
  }, { passive: true });
}

/* ==========================================================================
   CONFIRM MODAL
   ========================================================================== */

let modalConfirmHandler = null;

function openModal(title, bodyHtml, confirmLabel, onConfirm) {
  const modal = document.getElementById('adminModal');
  const confirmButton = document.getElementById('adminModalConfirm');
  if (!modal) return;

  setText('adminModalTitle', title);
  document.getElementById('adminModalBody').innerHTML = bodyHtml;
  confirmButton.textContent = confirmLabel;
  modalConfirmHandler = onConfirm;

  modal.hidden = false;
  document.body.style.overflow = 'hidden';
  confirmButton.focus();
}

function closeModal() {
  const modal = document.getElementById('adminModal');
  if (!modal || modal.hidden) return;

  modal.hidden = true;
  modalConfirmHandler = null;
}

function initModal() {
  const cancel = document.getElementById('adminModalCancel');
  const close = document.getElementById('adminModalClose');
  const confirmButton = document.getElementById('adminModalConfirm');
  const modal = document.getElementById('adminModal');

  if (cancel) cancel.addEventListener('click', closeModal);
  if (close) close.addEventListener('click', closeModal);

  if (confirmButton) {
    confirmButton.addEventListener('click', () => {
      const handler = modalConfirmHandler;
      closeModal();
      if (typeof handler === 'function') handler();
    });
  }

  if (modal) {
    modal.addEventListener('click', event => {
      if (event.target === modal) closeModal();
    });
  }
}

/** Confirms a destructive action with the entity named in the sentence. */
function confirmAction({ title, message, confirmLabel, onConfirm }) {
  openModal(title, message, confirmLabel, onConfirm);
}

/* ==========================================================================
   STATUS PILL HELPERS
   ========================================================================== */

const STUDENT_STATUS_META = {
  active: { label: 'Active', badge: 'admin-badge-sage' },
  pending: { label: 'Pending', badge: 'admin-badge-clay' },
  suspended: { label: 'Suspended', badge: 'admin-badge-danger' }
};

const EVENT_STATUS_BADGE = {
  [EVENT_STATUS.DRAFT]: 'admin-badge-neutral',
  [EVENT_STATUS.PENDING_APPROVAL]: 'admin-badge-clay',
  [EVENT_STATUS.PUBLISHED]: 'admin-badge-mauve',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'admin-badge-sage',
  [EVENT_STATUS.REGISTRATION_CLOSED]: 'admin-badge-plum',
  [EVENT_STATUS.ONGOING]: 'admin-badge-sage',
  [EVENT_STATUS.COMPLETED]: 'admin-badge-neutral',
  [EVENT_STATUS.CANCELLED]: 'admin-badge-danger'
};

function badge(text, variant) {
  return `<span class="admin-badge ${variant}">${escapeHtml(text)}</span>`;
}

function iconButton({ action, id, label, icon, variant = '', disabled = false }) {
  return `<button type="button" class="admin-icon-btn ${variant}" data-action="${action}" data-id="${escapeHtml(id)}"
      title="${escapeHtml(label)}" aria-label="${escapeHtml(label)}"${disabled ? ' disabled' : ''}>
      <svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>
    </button>`;
}

const ICONS = {
  check: '<path d="M20 6L9 17l-5-5"></path>',
  ban: '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>',
  star: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"></path>',
  starOff: '<path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" fill="currentColor" stroke="none" opacity="0.25"></path><line x1="3" y1="3" x2="21" y2="21"></line>',
  trash: '<path d="M3 6h18"></path><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"></path><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"></path>',
  pin: '<path d="M12 17v5"></path><path d="M9 10.76V4h6v6.76l2.5 3.24H6.5z"></path>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>',
  clock: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>',
  pin2: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>',
  inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"></path><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ''}</svg>`;
}

/* ==========================================================================
   DASHBOARD VIEW
   ========================================================================== */

function renderStats() {
  const pendingCount = state.approvals.length;
  const clubs = getClubData();

  setText('statStudents', String(state.students.length));
  setText('statClubs', String(clubs.length));
  setText('statEvents', String(state.events.length));
  setText('statPending', String(pendingCount));

  const pendingTrend = document.getElementById('statPendingTrend');
  if (pendingTrend) {
    pendingTrend.className = pendingCount > 0 ? 'admin-stat-trend is-down' : 'admin-stat-trend is-up';
    pendingTrend.textContent = pendingCount > 0 ? 'needs review' : 'all clear';
  }

  const badgeEl = document.getElementById('adminPendingBadge');
  if (badgeEl) {
    badgeEl.textContent = String(pendingCount);
    badgeEl.hidden = pendingCount === 0;
  }

  setText('approvalsCountBadge', `${pendingCount} pending`);
}

function renderDashboardCharts() {
  const studentBuckets = weekBuckets();
  state.students.forEach(student => {
    const index = bucketise(student.joinedAt, studentBuckets);
    if (index !== -1) studentBuckets[index].count += 1;
  });

  renderChart('chartStudentActivity', buildLineChart(
    studentBuckets.map(bucket => bucket.count),
    studentBuckets.map(bucket => bucket.label),
    { label: 'New students per week', color: CHART_COLORS.primary }
  ));

  const clubBuckets = weekBuckets();
  state.students.forEach(student => {
    if (!student.clubs.length) return;
    const index = bucketise(daysAgo(student.clubJoinedDaysAgo), clubBuckets);
    if (index !== -1) clubBuckets[index].count += 1;
  });

  renderChart('chartClubActivity', buildBarChart(
    clubBuckets.map(bucket => ({ label: bucket.label, short: bucket.label, value: bucket.count })),
    { label: 'New club members per week', color: CHART_COLORS.sage }
  ));

  const slices = eventStatusSlices();
  renderChart('chartEventStatus', slices.length
    ? buildDonutChart(slices)
    : '<p class="admin-chart-empty">No events in the catalogue yet.</p>');
}

function renderRecentEvents() {
  const list = document.getElementById('recentEventsList');
  const empty = document.getElementById('recentEventsEmpty');
  if (!list || !empty) return;

  const events = state.events
    .slice()
    .sort((a, b) => String(b.startDate).localeCompare(String(a.startDate)))
    .slice(0, 6);

  if (!events.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  list.innerHTML = events.map(event => {
    const effective = effectiveEvent(event);
    const day = parseDay(event.startDate);
    const clubName = event.clubName || 'Unassigned club';

    return `<div class="admin-list-row">
        <span class="admin-list-icon" aria-hidden="true">${escapeHtml(String.fromCodePoint(0x1F4C5))}</span>
        <div class="admin-list-body">
          <p class="admin-list-title">${escapeHtml(event.title)}</p>
          <div class="admin-list-meta">
            <span class="admin-list-meta-item">${icon('calendar')}${escapeHtml(formatDay(event.startDate))}</span>
            <span class="admin-list-meta-item">${icon('users')}${escapeHtml(clubName)}</span>
            ${event.venue ? `<span class="admin-list-meta-item">${icon('pin2')}${escapeHtml(event.venue)}</span>` : ''}
          </div>
        </div>
        <div class="admin-list-side">
          ${badge(STATUS_LABELS[effective.status] || effective.status, EVENT_STATUS_BADGE[effective.status] || 'admin-badge-neutral')}
        </div>
      </div>`;
  }).join('');

  empty.hidden = true;
}

function renderRecentRegistrations() {
  const list = document.getElementById('recentRegistrationsList');
  const empty = document.getElementById('recentRegistrationsEmpty');
  if (!list || !empty) return;

  // Registrations pair a real event with a sample student, so the list stays
  // consistent with the catalogue while the roster remains local sample data.
  const recent = buildRegistrationFeed(6);

  if (!recent.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  list.innerHTML = recent.map(item => `<div class="admin-list-row">
      <span class="admin-avatar" aria-hidden="true">${escapeHtml(initialsOf(item.student.name))}</span>
      <div class="admin-list-body">
        <p class="admin-list-title">${escapeHtml(item.student.name)}</p>
        <div class="admin-list-meta">
          <span class="admin-list-meta-item">${icon('calendar')}${escapeHtml(item.event ? item.event.title : 'Event removed')}</span>
          <span class="admin-list-meta-item">${icon('clock')}${escapeHtml(formatRelative(item.registeredAt))}</span>
        </div>
      </div>
      <div class="admin-list-side">
        ${badge(item.student.department, 'admin-badge-neutral')}
      </div>
    </div>`).join('');

  empty.hidden = true;
}

/**
 * Deterministic registration feed derived from the sample roster and the real
 * event catalogue, so both the dashboard and the reports agree.
 */
function buildRegistrationFeed(limit) {
  const active = state.students.filter(student => student.status !== 'suspended');
  if (!active.length || !state.events.length) return [];

  const random = makeRandom(4242);
  const feed = [];

  active.forEach(student => {
    const take = Math.min(student.registrationCount, state.events.length);

    for (let index = 0; index < take; index += 1) {
      const event = state.events[Math.floor(random() * state.events.length)];
      feed.push({
        student,
        event,
        registeredAt: daysAgo(Math.floor(random() * 55) + 1)
      });
    }
  });

  return feed
    .sort((a, b) => b.registeredAt.localeCompare(a.registeredAt))
    .slice(0, limit);
}

function renderApprovals() {
  const list = document.getElementById('approvalsList');
  const empty = document.getElementById('approvalsEmpty');
  if (!list || !empty) return;

  const items = state.approvals;

  if (!items.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  const typeIcon = { club: 'users', event: 'calendar', student: 'check' };

  list.innerHTML = items.map(item => `<div class="admin-list-row">
      <span class="admin-list-icon" aria-hidden="true">${icon(typeIcon[item.type] || 'inbox')}</span>
      <div class="admin-list-body">
        <p class="admin-list-title">${escapeHtml(item.title)}</p>
        <div class="admin-list-meta">
          <span class="admin-list-meta-item">${icon('clock')}${escapeHtml(formatRelative(item.submittedAt))}</span>
          <span class="admin-list-meta-item">${escapeHtml(item.detail)}</span>
        </div>
      </div>
      <div class="admin-list-side">
        <div class="admin-actions">
          ${badge(item.typeLabel, item.type === 'student' ? 'admin-badge-mauve' : 'admin-badge-clay')}
          ${iconButton({ action: 'reject-approval', id: item.id, label: `Reject ${item.title}`, icon: ICONS.ban, variant: 'is-danger' })}
          ${iconButton({ action: 'approve', id: item.id, label: `Approve ${item.title}`, icon: ICONS.check, variant: 'is-approve' })}
        </div>
      </div>
    </div>`).join('');

  empty.hidden = true;
}

/* ==========================================================================
   STUDENTS VIEW
   ========================================================================== */

function filteredStudents() {
  const term = (document.getElementById('studentSearch')?.value || '').toLowerCase().trim();
  const status = document.getElementById('studentStatusFilter')?.value || 'all';

  return state.students.filter(student => {
    const matchesStatus = status === 'all' || student.status === status;
    const matchesTerm = !term
      || student.name.toLowerCase().includes(term)
      || student.rollNumber.toLowerCase().includes(term)
      || student.department.toLowerCase().includes(term);

    return matchesStatus && matchesTerm;
  });
}

function renderStudents() {
  const body = document.getElementById('studentsTableBody');
  const empty = document.getElementById('studentsEmpty');
  const count = document.getElementById('studentCount');
  if (!body || !empty) return;

  const students = filteredStudents();
  if (count) count.textContent = `${students.length} of ${state.students.length} students`;

  if (!students.length) {
    body.innerHTML = '';
    empty.hidden = false;
    return;
  }

  body.innerHTML = students.map(student => {
    const meta = STUDENT_STATUS_META[student.status] || STUDENT_STATUS_META.pending;

    return `<tr>
        <td>
          <span class="admin-table-name">${escapeHtml(student.name)}</span>
          <span class="admin-table-sub">${escapeHtml(student.rollNumber)} · ${escapeHtml(student.email)}</span>
        </td>
        <td>
          ${escapeHtml(student.department)}
          <span class="admin-table-sub">${escapeHtml(student.year)}</span>
        </td>
        <td>${student.clubs.length}</td>
        <td>${student.registrationCount}</td>
        <td>${badge(meta.label, meta.badge)}</td>
        <td>
          <div class="admin-actions">
            ${student.status === 'pending'
              ? iconButton({ action: 'verify-student', id: student.id, label: `Verify ${student.name}`, icon: ICONS.check, variant: 'is-approve' })
              : ''}
            ${student.status === 'suspended'
              ? iconButton({ action: 'reinstate-student', id: student.id, label: `Reinstate ${student.name}`, icon: ICONS.users, variant: 'is-approve' })
              : iconButton({ action: 'toggle-suspend', id: student.id, label: `${student.status === 'suspended' ? 'Reinstate' : 'Suspend'} ${student.name}`, icon: ICONS.ban, variant: 'is-danger' })}
          </div>
        </td>
      </tr>`;
  }).join('');

  empty.hidden = true;
}

function initStudentsView() {
  const search = document.getElementById('studentSearch');
  const filter = document.getElementById('studentStatusFilter');
  const reset = document.getElementById('studentResetBtn');

  if (search) search.addEventListener('input', renderStudents);
  if (filter) filter.addEventListener('change', renderStudents);

  if (reset) {
    reset.addEventListener('click', () => {
      confirmAction({
        title: 'Reset sample students',
        message: 'This restores the original sample roster. Any status changes, approvals and announcements you made in this browser will be discarded.',
        confirmLabel: 'Reset sample data',
        onConfirm: () => {
          state.students = buildSampleStudents();
          state.approvals = buildSampleApprovals(state.students);
          persistStudents();
          persistApprovals();
          renderStudents();
          renderApprovals();
          renderStats();
          renderDashboardCharts();
          showToast('Sample student data restored.');
        }
      });
    });
  }
}

/* ==========================================================================
   CLUBS VIEW
   ========================================================================== */

function filteredClubs() {
  const term = (document.getElementById('clubSearch')?.value || '').toLowerCase().trim();
  const category = document.getElementById('clubCategoryFilter')?.value || 'all';

  return getClubData()
    .map(effectiveClub)
    .filter(club => {
      const matchesCategory = category === 'all' || toCategorySlug(club.category) === category;
      const matchesTerm = !term
        || club.name.toLowerCase().includes(term)
        || club.category.toLowerCase().includes(term);

      return matchesCategory && matchesTerm;
    });
}

function renderClubs() {
  const body = document.getElementById('clubsTableBody');
  const empty = document.getElementById('clubsEmpty');
  const count = document.getElementById('clubCount');
  if (!body || !empty) return;

  const clubs = filteredClubs();
  if (count) count.textContent = `${clubs.length} of ${getClubData().length} clubs`;

  if (!clubs.length) {
    body.innerHTML = '';
    empty.hidden = false;
    return;
  }

  body.innerHTML = clubs.map(club => {
    const badgeStyle = getCategoryBadgeStyle(club.category);
    const styleAttr = [
      badgeStyle.bg ? `background-color:${badgeStyle.bg}` : '',
      badgeStyle.text ? `color:${badgeStyle.text}` : '',
      badgeStyle.border ? `border-color:${badgeStyle.border}` : ''
    ].filter(Boolean).join(';');

    return `<tr>
        <td>
          <span class="admin-table-name">${escapeHtml(club.icon || '')} ${escapeHtml(club.name)}</span>
          <span class="admin-table-sub">${escapeHtml(club.description)}</span>
        </td>
        <td><span class="admin-badge" style="${escapeHtml(styleAttr)}">${escapeHtml(club.category)}</span></td>
        <td>${escapeHtml(club.members || '—')}</td>
        <td>${club.featured ? badge('Featured', 'admin-badge-mauve') : badge('Standard', 'admin-badge-neutral')}</td>
        <td>
          <div class="admin-actions">
            ${iconButton({
              action: 'toggle-club-featured',
              id: club.id,
              label: club.featured ? `Unfeature ${club.name}` : `Feature ${club.name}`,
              icon: club.featured ? ICONS.starOff : ICONS.star,
              variant: 'is-approve'
            })}
            <a class="admin-icon-btn" href="club-details.html?id=${encodeURIComponent(club.id)}"
              title="View ${escapeHtml(club.name)}" aria-label="View ${escapeHtml(club.name)}">
              ${icon('eye')}
            </a>
          </div>
        </td>
      </tr>`;
  }).join('');

  empty.hidden = true;
}

function initClubsView() {
  const search = document.getElementById('clubSearch');
  const categoryFilter = document.getElementById('clubCategoryFilter');

  if (search) search.addEventListener('input', renderClubs);
  if (categoryFilter) {
    // Reuse the canonical category list from club-data.js, minus "All".
    categoryFilter.innerHTML = '<option value="all">All categories</option>'
      + getCategories()
        .filter(category => category.id !== 'all')
        .map(category => `<option value="${escapeHtml(category.id)}">${escapeHtml(category.label)} (${category.count})</option>`)
        .join('');
    categoryFilter.addEventListener('change', renderClubs);
  }
}

/* ==========================================================================
   EVENTS VIEW
   ========================================================================== */

function filteredEvents() {
  const term = (document.getElementById('eventSearch')?.value || '').toLowerCase().trim();
  const status = document.getElementById('eventStatusFilter')?.value || 'all';

  return state.events
    .map(effectiveEvent)
    .filter(event => {
      const matchesStatus = status === 'all' || event.status === status;
      const matchesTerm = !term
        || event.title.toLowerCase().includes(term)
        || String(event.clubName || '').toLowerCase().includes(term)
        || String(event.venue || '').toLowerCase().includes(term);

      return matchesStatus && matchesTerm;
    });
}

function renderEvents() {
  const body = document.getElementById('eventsTableBody');
  const empty = document.getElementById('eventsEmpty');
  const count = document.getElementById('eventCount');
  if (!body || !empty) return;

  let events = filteredEvents();

  // Drafts are an admin-only lifecycle stage, hidden unless opted in.
  if (!state.settings.showDrafts) {
    events = events.filter(event => event.status !== EVENT_STATUS.DRAFT);
  }

  if (count) count.textContent = `${events.length} of ${state.events.length} events`;

  if (!events.length) {
    body.innerHTML = '';
    empty.hidden = false;
    return;
  }

  body.innerHTML = events.map(event => {
    const remaining = getSeatsRemaining(event);
    const seatsText = event.seats === null
      ? 'Unlimited'
      : `${event.seatsTaken || 0}/${event.seats}`;

    return `<tr>
        <td>
          <span class="admin-table-name">${escapeHtml(event.title)}</span>
          <span class="admin-table-sub">${escapeHtml(String(event.venue || 'Venue TBA'))}</span>
        </td>
        <td>${escapeHtml(String(event.clubName || '—'))}</td>
        <td>${escapeHtml(formatDay(event.startDate))}</td>
        <td>
          ${escapeHtml(seatsText)}
          <span class="admin-table-sub">${remaining === null ? '' : `${remaining} seats left`}</span>
        </td>
        <td>
          ${badge(STATUS_LABELS[event.status] || event.status, EVENT_STATUS_BADGE[event.status] || 'admin-badge-neutral')}
          ${event.featured ? '<span class="admin-table-sub">Featured</span>' : ''}
        </td>
        <td>
          <div class="admin-actions">
            ${iconButton({
              action: 'toggle-event-featured',
              id: event.id,
              label: event.featured ? `Unfeature ${event.title}` : `Feature ${event.title}`,
              icon: event.featured ? ICONS.starOff : ICONS.star,
              variant: 'is-approve'
            })}
            ${event.status === EVENT_STATUS.CANCELLED
              ? iconButton({ action: 'restore-event', id: event.id, label: `Restore ${event.title}`, icon: ICONS.check, variant: 'is-approve' })
              : iconButton({ action: 'cancel-event', id: event.id, label: `Cancel ${event.title}`, icon: ICONS.ban, variant: 'is-danger' })}
            <a class="admin-icon-btn" href="event-details.html?id=${encodeURIComponent(event.id)}"
              title="View ${escapeHtml(event.title)}" aria-label="View ${escapeHtml(event.title)}">
              ${icon('eye')}
            </a>
          </div>
        </td>
      </tr>`;
  }).join('');

  empty.hidden = true;
}

function initEventsView() {
  const search = document.getElementById('eventSearch');
  const statusFilter = document.getElementById('eventStatusFilter');

  if (search) search.addEventListener('input', renderEvents);
  if (statusFilter) {
    statusFilter.innerHTML = '<option value="all">All statuses</option>'
      + Object.keys(STATUS_LABELS)
        .map(key => `<option value="${escapeHtml(key)}">${escapeHtml(STATUS_LABELS[key])}</option>`)
        .join('');
    statusFilter.addEventListener('change', renderEvents);
  }
}

/* ==========================================================================
   ANNOUNCEMENTS VIEW
   ========================================================================== */

function renderAnnouncements() {
  const list = document.getElementById('announcementList');
  const empty = document.getElementById('announcementEmpty');
  const count = document.getElementById('announcementCount');
  if (!list || !empty) return;

  const items = state.announcements.slice().sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return String(b.createdAt).localeCompare(String(a.createdAt));
  });

  if (count) count.textContent = `${items.length} published`;

  if (!items.length) {
    list.innerHTML = '';
    empty.hidden = false;
    return;
  }

  const audienceLabel = {
    all: 'All students',
    club: 'Club members',
    event: 'Event participants'
  };

  list.innerHTML = items.map(item => `<div class="admin-list-row">
      <span class="admin-list-icon" aria-hidden="true">${icon('inbox')}</span>
      <div class="admin-list-body">
        <p class="admin-list-title">${item.pinned ? '<strong>📌 </strong>' : ''}${escapeHtml(item.title)}</p>
        <p class="admin-list-meta"><span>${escapeHtml(item.body)}</span></p>
        <div class="admin-list-meta">
          <span class="admin-list-meta-item">${icon('clock')}${escapeHtml(formatRelative(item.createdAt))}</span>
          <span class="admin-list-meta-item">${icon('users')}${escapeHtml(audienceLabel[item.audience] || item.audience)}</span>
        </div>
      </div>
      <div class="admin-list-side">
        <div class="admin-actions">
          ${iconButton({
            action: 'toggle-pin',
            id: item.id,
            label: item.pinned ? `Unpin ${item.title}` : `Pin ${item.title}`,
            icon: ICONS.pin,
            variant: 'is-approve'
          })}
          ${iconButton({ action: 'delete-announcement', id: item.id, label: `Delete ${item.title}`, icon: ICONS.trash, variant: 'is-danger' })}
        </div>
      </div>
    </div>`).join('');

  empty.hidden = true;
}

function showFieldError(field, message) {
  if (!field) return;

  const target = document.getElementById(`${field.id}Error`);
  field.classList.add('is-invalid');

  if (target) target.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;

  const target = document.getElementById(`${field.id}Error`);
  field.classList.remove('is-invalid');

  if (target) target.textContent = '';
}

function initAnnouncementsView() {
  const form = document.getElementById('announcementForm');
  const titleInput = document.getElementById('annTitle');
  const bodyInput = document.getElementById('annBody');
  const audience = document.getElementById('annAudience');
  const pinned = document.getElementById('annPinned');
  const clearButton = document.getElementById('announcementClear');

  const validate = () => {
    let valid = true;
    const title = titleInput.value.trim();
    const body = bodyInput.value.trim();

    if (title.length < 4) {
      showFieldError(titleInput, 'Give the announcement a title of at least 4 characters.');
      valid = false;
    } else {
      clearFieldError(titleInput);
    }

    if (body.length < 10 || body.length > 600) {
      showFieldError(bodyInput, 'The message must be between 10 and 600 characters.');
      valid = false;
    } else {
      clearFieldError(bodyInput);
    }

    return valid;
  };

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!validate()) return;

      state.announcements.unshift({
        id: `ann-${Date.now()}`,
        title: titleInput.value.trim(),
        body: bodyInput.value.trim(),
        audience: audience.value,
        pinned: pinned.checked,
        createdAt: new Date().toISOString().slice(0, 10)
      });

      const persisted = persistAnnouncements();

      titleInput.value = '';
      bodyInput.value = '';
      pinned.checked = false;
      clearFieldError(titleInput);
      clearFieldError(bodyInput);

      renderAnnouncements();
      showToast(persisted ? 'Announcement published locally.' : 'Announcement added for this visit only.');
    });
  }

  [titleInput, bodyInput].forEach(field => {
    if (!field) return;
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) validate();
    });
  });

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      titleInput.value = '';
      bodyInput.value = '';
      pinned.checked = false;
      clearFieldError(titleInput);
      clearFieldError(bodyInput);
      titleInput.focus();
    });
  }
}

/* ==========================================================================
   REPORTS VIEW
   ========================================================================== */

function renderReports() {
  const clubs = getClubData().map(effectiveClub);
  const activeStudents = state.students.filter(student => student.status === 'active').length;
  const categories = new Set(clubs.map(club => club.category)).size;

  let seatsTaken = 0;
  let seatsTotal = 0;
  state.events.forEach(event => {
    if (event.seats === null) return;
    seatsTotal += event.seats;
    seatsTaken += event.seatsTaken || 0;
  });

  const fillRate = seatsTotal ? Math.round((seatsTaken / seatsTotal) * 100) : 0;
  const perClub = clubs.length ? (state.events.length / clubs.length) : 0;

  setText('reportActiveStudents', String(activeStudents));
  setText('reportClubCategories', String(categories));
  setText('reportSeatsFilled', `${fillRate}%`);
  setText('reportEventsPerClub', perClub.toFixed(1));

  // Membership by category, using the member strings the catalogue provides.
  const categoryTotals = {};
  clubs.forEach(club => {
    const members = parseInt(String(club.members || '0').replace(/[^\d]/g, ''), 10) || 0;
    categoryTotals[club.category] = (categoryTotals[club.category] || 0) + members;
  });

  const palette = [CHART_COLORS.primary, CHART_COLORS.sage, CHART_COLORS.clay, CHART_COLORS.plum, CHART_COLORS.muted];
  const categoryItems = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([label, value], index) => ({
      label,
      short: label.split(' ')[0].slice(0, 6),
      value,
      color: palette[index % palette.length]
    }));

  renderChart('reportClubChart', categoryItems.length
    ? buildBarChart(categoryItems, { label: 'Members by category' })
    : '<p class="admin-chart-empty">No club membership data available.</p>');

  // Registration trend across the last 8 weeks.
  const buckets = weekBuckets();
  buildRegistrationFeed(9999).forEach(entry => {
    const index = bucketise(entry.registeredAt, buckets);
    if (index !== -1) buckets[index].count += 1;
  });

  renderChart('reportRegistrationChart', buildLineChart(
    buckets.map(bucket => bucket.count),
    buckets.map(bucket => bucket.label),
    { label: 'Registrations per week', color: CHART_COLORS.plum }
  ));

  const byStatus = {};
  state.events.map(effectiveEvent).forEach(event => {
    byStatus[event.status] = (byStatus[event.status] || 0) + 1;
  });

  const feed = buildRegistrationFeed(9999);
  const uniqueRegistrants = new Set(feed.map(entry => entry.student.id)).size;
  const averageClubs = state.students.length
    ? (state.students.reduce((sum, student) => sum + student.clubs.length, 0) / state.students.length)
    : 0;

  const metrics = [
    { label: 'Students on record', value: String(state.students.length) },
    { label: 'Active students', value: String(activeStudents) },
    { label: 'Suspended students', value: String(state.students.length - activeStudents - state.students.filter(s => s.status === 'pending').length) },
    { label: 'Pending approvals', value: String(state.approvals.length) },
    { label: 'Clubs in catalogue', value: String(clubs.length) },
    { label: 'Featured clubs', value: String(clubs.filter(club => club.featured).length) },
    { label: 'Events in catalogue', value: String(state.events.length) },
    { label: 'Total registrations recorded', value: String(feed.length) },
    { label: 'Unique students registering', value: String(uniqueRegistrants) },
    { label: 'Average clubs per student', value: averageClubs.toFixed(1) },
    { label: 'Announcements published', value: String(state.announcements.length) }
  ];

  const metricsEl = document.getElementById('reportMetrics');
  if (metricsEl) {
    metricsEl.innerHTML = metrics
      .map(metric => `<div class="admin-metric-row">
          <span class="admin-metric-label">${escapeHtml(metric.label)}</span>
          <span class="admin-metric-value">${escapeHtml(metric.value)}</span>
        </div>`)
      .join('');
  }

  // Status breakdown, rendered as a labelled progress list.
  const statusHost = document.getElementById('reportStatusBreakdown');
  if (statusHost) {
    const total = state.events.length || 1;
    statusHost.innerHTML = Object.entries(byStatus)
      .sort((a, b) => b[1] - a[1])
      .map(([status, count]) => {
        const percent = Math.round((count / total) * 100);
        return `<div style="margin-bottom:14px">
            <div class="admin-metric-row" style="border:none;padding:0 0 6px">
              <span class="admin-metric-label">${escapeHtml(STATUS_LABELS[status] || status)}</span>
              <span class="admin-metric-value">${count} · ${percent}%</span>
            </div>
            <div class="admin-progress">
              <div class="admin-progress-bar" style="width:${percent}%"></div>
            </div>
          </div>`;
      })
      .join('');
  }
}

/* ==========================================================================
   SETTINGS VIEW
   ========================================================================== */

function renderSettings() {
  document.querySelectorAll('[data-setting]').forEach(input => {
    input.checked = Boolean(state.settings[input.dataset.setting]);
  });

  const storageList = document.getElementById('adminStorageList');
  if (!storageList) return;

  const rows = [
    { key: STORAGE.students, label: 'Sample students', count: state.students.length },
    { key: STORAGE.approvals, label: 'Pending approvals', count: state.approvals.length },
    { key: STORAGE.announcements, label: 'Announcements', count: state.announcements.length },
    { key: STORAGE.overrides, label: 'Club / event overrides', count: Object.keys(state.overrides).length },
    { key: STORAGE.settings, label: 'Console preferences', count: Object.keys(state.settings).length }
  ];

  storageList.innerHTML = rows.map(row => `<div class="admin-metric-row">
      <span class="admin-metric-label">
        ${escapeHtml(row.label)}
        <span class="admin-table-sub">${escapeHtml(row.key)}</span>
      </span>
      <span class="admin-metric-value">${row.count}</span>
    </div>`).join('');
}

function initSettingsView() {
  document.querySelectorAll('[data-setting]').forEach(input => {
    input.addEventListener('change', () => {
      state.settings[input.dataset.setting] = input.checked;
      const persisted = persistSettings();

      // Draft visibility changes what the events table can show.
      renderEvents();

      showToast(persisted
        ? 'Preference saved.'
        : 'Preference saved for this visit only.');
    });
  });

  const resetButton = document.getElementById('adminResetData');
  if (!resetButton) return;

  resetButton.addEventListener('click', () => {
    confirmAction({
      title: 'Reset local admin data',
      message: 'This clears the sample students, approvals, announcements and any club or event overrides stored in this browser. It does not touch the shared SCMS club or event catalogue.',
      confirmLabel: 'Reset everything',
      onConfirm: () => {
        Object.values(STORAGE).forEach(key => {
          try {
            window.localStorage.removeItem(key);
          } catch (error) {
            /* storage unavailable; in-memory state is reset regardless */
          }
        });

        state.students = buildSampleStudents();
        state.approvals = buildSampleApprovals(state.students);
        state.announcements = [];
        state.settings = { ...DEFAULT_SETTINGS };
        state.overrides = {};

        persistStudents();
        persistApprovals();
        persistAnnouncements();
        persistSettings();
        persistOverrides();

        renderAll();
        showToast('Local admin data reset.');
      }
    });
  });
}

/* ==========================================================================
   ADMIN ACTIONS
   One delegated listener covers every icon button in the console.
   ========================================================================== */

function initActions() {
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;

    const { action, id } = button.dataset;
    handleAction(action, id, button);
  });
}

function findStudent(id) {
  return state.students.find(student => student.id === id) || null;
}

function findAnnouncement(id) {
  return state.announcements.find(item => item.id === id) || null;
}

function findApproval(id) {
  return state.approvals.find(item => item.id === id) || null;
}

function overrideFor(entity, id) {
  return state.overrides[`${entity}:${id}`] || {};
}

function setOverride(entity, id, patch) {
  const key = `${entity}:${id}`;
  const next = { ...overrideFor(entity, id), ...patch };
  state.overrides[key] = next;
  persistOverrides();
}

function handleAction(action, id, button) {
  switch (action) {
    /* ---------------- Students ---------------- */
    case 'verify-student': {
      const student = findStudent(id);
      if (!student) return;

      student.status = 'active';
      persistStudents();
      removeApprovalFor('student', student.id);
      renderStudents();
      renderStats();
      renderApprovals();
      showToast(`${student.name} verified.`);
      return;
    }

    case 'toggle-suspend': {
      const student = findStudent(id);
      if (!student) return;

      if (student.status === 'suspended') {
        student.status = 'active';
        persistStudents();
        renderStudents();
        showToast(`${student.name} reinstated.`);
        return;
      }

      confirmAction({
        title: 'Suspend student',
        message: `Suspend <strong>${escapeHtml(student.name)}</strong> (${escapeHtml(student.rollNumber)})? They will be marked inactive in this console's sample data.`,
        confirmLabel: 'Suspend student',
        onConfirm: () => {
          student.status = 'suspended';
          persistStudents();
          renderStudents();
          showToast(`${student.name} suspended.`);
        }
      });
      return;
    }

    case 'reinstate-student': {
      const student = findStudent(id);
      if (!student) return;

      student.status = 'active';
      persistStudents();
      renderStudents();
      showToast(`${student.name} reinstated.`);
      return;
    }

    /* ---------------- Clubs ---------------- */
    case 'toggle-club-featured': {
      const club = getClubData().find(item => item.id === id);
      if (!club) return;

      const current = overrideFor('club', id).featured === true;
      setOverride('club', id, { featured: !current });

      renderClubs();
      renderReports();
      showToast(`${club.name} ${current ? 'removed from' : 'added to'} featured clubs.`);
      return;
    }

    /* ---------------- Events ---------------- */
    case 'toggle-event-featured': {
      const event = state.events.find(item => item.id === id);
      if (!event) return;

      const current = overrideFor('event', id).featured === true;
      setOverride('event', id, { featured: !current });

      renderEvents();
      showToast(`${event.title} ${current ? 'unfeatured' : 'featured'} in this console.`);
      return;
    }

    case 'cancel-event': {
      const event = state.events.find(item => item.id === id);
      if (!event) return;

      confirmAction({
        title: 'Cancel event',
        message: `Mark <strong>${escapeHtml(event.title)}</strong> as cancelled? This is recorded as a console override — the shared event store that students read is left untouched.`,
        confirmLabel: 'Cancel event',
        onConfirm: () => {
          setOverride('event', id, { status: EVENT_STATUS.CANCELLED });
          renderEvents();
          renderRecentEvents();
          renderDashboardCharts();
          showToast(`${event.title} marked cancelled in this console.`);
        }
      });
      return;
    }

    case 'restore-event': {
      const event = state.events.find(item => item.id === id);
      if (!event) return;

      setOverride('event', id, { status: null });
      renderEvents();
      renderRecentEvents();
      renderDashboardCharts();
      showToast(`${event.title} restored.`);
      return;
    }

    /* ---------------- Announcements ---------------- */
    case 'toggle-pin': {
      const item = findAnnouncement(id);
      if (!item) return;

      item.pinned = !item.pinned;
      persistAnnouncements();
      renderAnnouncements();
      showToast(item.pinned ? `Pinned "${item.title}".` : `Unpinned "${item.title}".`);
      return;
    }

    case 'delete-announcement': {
      const item = findAnnouncement(id);
      if (!item) return;

      confirmAction({
        title: 'Delete announcement',
        message: `Delete <strong>${escapeHtml(item.title)}</strong>? This only removes it from the announcements stored in this browser.`,
        confirmLabel: 'Delete',
        onConfirm: () => {
          state.announcements = state.announcements.filter(entry => entry.id !== id);
          persistAnnouncements();
          renderAnnouncements();
          showToast('Announcement deleted.');
        }
      });
      return;
    }

    /* ---------------- Approvals ---------------- */
    case 'approve': {
      const item = findApproval(id);
      if (!item) return;

      applyApproval(item, true);
      return;
    }

    case 'reject-approval': {
      const item = findApproval(id);
      if (!item) return;

      confirmAction({
        title: 'Reject request',
        message: `Reject <strong>${escapeHtml(item.title)}</strong>? The request is removed from the pending queue in this console.`,
        confirmLabel: 'Reject',
        onConfirm: () => applyApproval(item, false)
      });
      return;
    }

    default:
      return;
  }
}

/** Approving a student request activates the matching sample record. */
function applyApproval(item, approved) {
  if (item.type === 'student') {
    const student = findStudent(item.targetId);
    if (student) {
      student.status = approved ? 'active' : 'suspended';
      persistStudents();
    }
  }

  state.approvals = state.approvals.filter(entry => entry.id !== item.id);
  persistApprovals();

  renderApprovals();
  renderStudents();
  renderStats();

  showToast(approved
    ? `${item.typeLabel} approved: ${item.title}.`
    : `${item.typeLabel} rejected: ${item.title}.`);
}

function removeApprovalFor(type, targetId) {
  const before = state.approvals.length;
  state.approvals = state.approvals.filter(item => !(item.type === type && item.targetId === targetId));

  if (state.approvals.length !== before) persistApprovals();
}

/* ==========================================================================
   RENDER ALL
   ========================================================================== */

function renderAll() {
  renderStats();
  renderDashboardCharts();
  renderRecentEvents();
  renderRecentRegistrations();
  renderApprovals();
  renderStudents();
  renderClubs();
  renderEvents();
  renderAnnouncements();
  renderReports();
  renderSettings();
}

/* ==========================================================================
   INIT
   ========================================================================== */

function formatToday() {
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(new Date());
  } catch (error) {
    return '';
  }
}

async function init() {
  loadState();

  // Events are the only async source; the console renders once they arrive.
  try {
    const source = getEventDataSource();
    state.events = await source.list();
  } catch (error) {
    state.events = [];
  }

  setText('adminTodayLabel', formatToday());

  initRouter();
  initSidebar();
  initModal();
  initActions();
  initStudentsView();
  initClubsView();
  initEventsView();
  initAnnouncementsView();
  initSettingsView();

  renderAll();
}

if (isAdmin) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

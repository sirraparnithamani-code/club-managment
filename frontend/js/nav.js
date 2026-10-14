/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - SHARED SITE NAVIGATION
 * ==========================================================================
 * Single implementation of the primary navigation behaviour.
 *
 * Every student-facing page ships the *same* sidebar structure. nav.js
 * dynamically populates the navigation links from NAV_ITEMS below, then
 * manages active-link state, the mobile sidebar overlay, and user session
 * display in the sidebar footer.
 *
 *   1. The canonical route table (NAV_ITEMS) — the one place that defines
 *      which HTML file backs each navigation key, its icon, and active-file list.
 *   2. renderSidebar() — generates the sidebar navigation markup from NAV_ITEMS.
 *   3. Active-link resolution, so exactly one item is highlighted and it is
 *      always the item matching the current URL (file + optional hash).
 *   4. The mobile sidebar overlay (open/close, focus, scroll lock).
 *   5. User session display in the sidebar footer (login/logout, avatar).
 *
 * Routing strategy (deliberately minimal — no URLs were renamed):
 *   Dashboard -> pages/dashboard.html
 *   Clubs  -> pages/club.html       (details -> pages/club-details.html)
 *   Events -> pages/events.html     (details -> pages/event-details.html)
 *   Announcements -> pages/announcements.html
 *   Notifications -> pages/notifications.html
 *   My Registrations -> pages/my-registrations.html
 *   Profile -> pages/profile.html
 *   Login  -> pages/login.html (sidebar footer only, not in main nav)
 *
 * Because each section of the site is a real document, refresh, browser back
 * and browser forward all behave natively and no blank screen is possible.
 * ==========================================================================
 */

import { showToast } from './toast.js';
import { getUnreadCount } from './notification-data.js';

const SESSION_STORAGE_KEY = 'scms_session';
const NOTIFICATION_STORAGE_KEY = 'scms_notifications';

/**
 * Checks if the current session is a valid student session.
 * Returns true if allowed, false if redirected (redirect happens internally).
 */
export function requireStudentSession() {
  const session = readSession();
  if (!session || session.role !== 'student') {
    // Do not clear session here - user may have a valid coordinator/admin session
    // Just redirect to login for student pages
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/**
 * Checks if the current session is a valid coordinator session.
 * Returns true if allowed, false if redirected (redirect happens internally).
 */
export function requireCoordinatorSession() {
  const session = readSession();
  if (!session || session.role !== 'coordinator') {
    // Do not clear session here - user may have a valid student/admin session
    window.location.href = 'login.html';
    return false;
  }
  return true;
}

/**
 * Canonical navigation order.
 * `path`  — the target HTML file (used to compute the relative href)
 * `files` — every document that should keep the key highlighted (details pages
 *           inherit their listing's key)
 * `hash`  — the in-page section that selects the key on the Home document
 * `icon`  — SVG path elements string for the sidebar nav icon
 * `hidden` — if true, item is not rendered in the sidebar (used for login)
 */
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', path: 'dashboard.html', files: ['dashboard.html'], hash: '',
    icon: '<rect x="3" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="3" width="7" height="7" rx="1"></rect><rect x="14" y="14" width="7" height="7" rx="1"></rect><rect x="3" y="14" width="7" height="7" rx="1"></rect>' },
  { key: 'clubs', label: 'Clubs', path: 'club.html', files: ['club.html', 'club-details.html'], hash: '',
    icon: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>' },
  { key: 'events', label: 'Events', path: 'events.html', files: ['events.html', 'event-details.html'], hash: '',
    icon: '<rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line>' },
  { key: 'announcements', label: 'Announcements', path: 'announcements.html', files: ['announcements.html'], hash: '',
    icon: '<path d="M12 2l9 3v10c0 5-3.5 8.3-8 9-4 .5-8 .5-8-1V5l8-3z"></path><path d="M12 2v6m0 6v1"></path>' },
  { key: 'notifications', label: 'Notifications', path: 'notifications.html', files: ['notifications.html'], hash: '',
    icon: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path>' },
  { key: 'my-registrations', label: 'My Registrations', path: 'my-registrations.html', files: ['my-registrations.html'], hash: '',
    icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="8" y1="13" x2="16" y2="13"></line><line x1="8" y1="17" x2="16" y2="17"></line>' },
  { key: 'profile', label: 'Profile', path: 'profile.html', files: ['profile.html'], hash: '',
    icon: '<circle cx="12" cy="7" r="4"></circle><path d="M5.5 20a7.5 7.5 0 0 1 13 0"></path>' },
  // Login button in sidebar footer — not rendered in main nav list
  { key: 'login', label: 'Login', path: 'login.html', files: ['login.html'], hash: '', hidden: true, icon: '' }
];

const MOBILE_BREAKPOINT = 768;

/**
 * Resolves the correct relative path for a target HTML file, based on the
 * current document's location. This keeps hrefs correct whether the page
 * lives at the site root (index.html) or inside the pages/ subdirectory.
 */
function resolveRelativePath(targetFile, hash = '') {
  const path = window.location.pathname;
  const segments = path.split('/').filter(Boolean);
  const isInPages = segments.includes('pages');

  let basePath;
  if (targetFile === 'index.html') {
    basePath = isInPages ? '../index.html' : 'index.html';
  } else {
    basePath = isInPages ? targetFile : 'pages/' + targetFile;
  }

  return hash ? basePath + hash : basePath;
}

/** Initialises navigation behaviour. Safe to call on any page. */
export function initNav() {
  // Login page must be reachable without a session. Student pages that
  // require authentication enforce their own guard (e.g. dashboard.js).
  renderSidebar();
  initSidebarToggle();
  syncActiveLink();
  renderUserSession();
  renderNotificationBadge();
  window.addEventListener('hashchange', syncActiveLink);
  window.addEventListener('storage', handleStorageChange);
}

/** Reads the current session from localStorage. */
export function readSession() {
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

/** Clears the session (logout). */
export function clearSession() {
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    // Ignore
  }
}

/**
 * Dynamically builds the sidebar navigation list from NAV_ITEMS.
 * Replaces the previous static HTML approach — now every page gets
 * identical nav markup generated from the single source of truth.
 */
function renderSidebar() {
  const list = document.getElementById('sidebarNavList');
  if (!list) return;

  list.innerHTML = '';

  const fragment = document.createDocumentFragment();

  NAV_ITEMS.forEach(item => {
    if (item.hidden) return;
    const li = document.createElement('li');
    li.className = 'sidebar-nav-item';

    const a = document.createElement('a');
    a.href = resolveRelativePath(item.path, item.hash);
    a.className = 'sidebar-nav-link';
    a.setAttribute('data-nav', item.key);

    if (item.icon) {
      const icon = document.createElement('span');
      icon.className = 'sidebar-nav-icon';
      icon.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + item.icon + '</svg>';
      a.appendChild(icon);
    }

    const label = document.createElement('span');
    label.className = 'sidebar-nav-label';
    label.textContent = item.label;
    a.appendChild(label);

    li.appendChild(a);
    fragment.appendChild(li);
  });

  list.appendChild(fragment);
}

/** Renders the user session state in the sidebar footer. */
export function renderUserSession() {
  const session = readSession();
  const loginBtn = document.querySelector('.btn-login[data-nav="login"]');
  const userDisplay = document.getElementById('userDisplay');

  if (session && session.name) {
    if (loginBtn) loginBtn.style.display = 'none';

    if (userDisplay) {
      const initials = getInitials(session.name);
      userDisplay.innerHTML =
        '<div class="user-avatar" aria-hidden="true">' + escapeHtml(initials) + '</div>' +
        '<span class="user-name">' + escapeHtml(session.name) + '</span>' +
        '<button type="button" class="btn btn-secondary btn-sm btn-logout" id="logoutBtn" aria-label="Log out">Logout</button>';
      userDisplay.style.display = 'flex';

      const logoutBtn = userDisplay.querySelector('#logoutBtn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          clearSession();
          renderUserSession();
          showToast('You have been logged out.');
          const protectedPages = ['dashboard.html', 'profile.html'];
          const currentFile = fileNameOf(window.location.pathname);
          if (protectedPages.includes(currentFile)) {
            window.location.href = '../index.html';
          }
        });
      }
    }
  } else {
    if (loginBtn) loginBtn.style.display = '';
    if (userDisplay) userDisplay.style.display = 'none';
  }
}

function handleStorageChange(event) {
  if (event.key === SESSION_STORAGE_KEY) {
    renderUserSession();
  }
  if (event.key === NOTIFICATION_STORAGE_KEY) {
    renderNotificationBadge();
  }
}

/** Renders the unread notification count badge on the Notifications nav link. */
export function renderNotificationBadge() {
  let count;
  try {
    count = getUnreadCount();
  } catch (error) {
    count = 0;
  }

  const navLinks = document.querySelectorAll('.sidebar-nav-link[data-nav="notifications"]');
  navLinks.forEach(navLink => {
    let badge = navLink.querySelector('.notify-badge-nav');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'notify-badge-nav';
      badge.setAttribute('aria-hidden', 'true');
      navLink.appendChild(badge);
    }

    badge.textContent = String(count);
    badge.hidden = count === 0 ? true : false;
  });
}

/** Resolves which navigation key matches the current location.
 * A hash on the Home document wins over the bare file match, which is what
 * makes `#about` light up "About" instead of "Home".
 */
export function resolveActiveKey(locationRef = window.location) {
  const file = fileNameOf(locationRef.pathname);
  const hash = locationRef.hash || '';

  if (file === 'index.html' && hash) {
    const match = NAV_ITEMS.find(item => item.hash === hash);
    if (match) return match.key;
  }

  const match = NAV_ITEMS.find(item => item.files.indexOf(file) !== -1);
  return match ? match.key : '';
}

/** Applies `is-active` / `aria-current` to sidebar nav links. */
export function syncActiveLink() {
  const activeKey = resolveActiveKey();

  document.querySelectorAll('[data-nav]').forEach(link => {
    const isActive = link.getAttribute('data-nav') === activeKey;

    link.classList.toggle('is-active', isActive);

    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  // Stagger classes are only a first-paint effect on the Home page.
  if (activeKey !== 'home') {
    document.querySelectorAll('.stagger-1, .stagger-2, .stagger-3, .stagger-4, .stagger-5, .stagger-6, .stagger-7, .stagger-8')
      .forEach(el => el.classList.remove('stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5', 'stagger-6', 'stagger-7', 'stagger-8'));
  }
}

function fileNameOf(pathname) {
  const segment = String(pathname || '').split('/').filter(Boolean).pop() || '';
  try {
    return decodeURIComponent(segment);
  } catch (error) {
    return segment;
  }
}

function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/* --------------------------------------------------------------------------
:    MOBILE SIDEBAR OVERLAY
:    -------------------------------------------------------------------------- */

function initSidebarToggle() {
  const toggle = document.getElementById('navToggle');
  const sidebar = document.getElementById('siteSidebar');
  const overlay = document.getElementById('sidebarOverlay');

  if (!toggle || !sidebar) return;

  const setOpen = isOpen => {
    sidebar.classList.toggle('is-open', isOpen);
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
    if (overlay) overlay.hidden = !isOpen;
  };

  const isOpen = () => sidebar.classList.contains('is-open');

  toggle.addEventListener('click', () => setOpen(!isOpen()));

  // Close when clicking a nav link (mobile)
  sidebar.addEventListener('click', event => {
    const link = event.target.closest('.sidebar-nav-link, .btn-login');
    if (link) setOpen(false);
  });

  // Close on Escape
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close on resize to desktop
  window.addEventListener('resize', () => {
    if (window.innerWidth >= MOBILE_BREAKPOINT && isOpen()) setOpen(false);
  }, { passive: true });
}

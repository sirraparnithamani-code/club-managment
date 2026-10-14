/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - STUDENT PROFILE PAGE
 * Page: pages/profile.html
 * Vanilla JavaScript (Zero external libraries or frameworks)
 *
 * Design rules honoured here:
 *   1. Nothing on this page is invented. The system has no authentication or
 *      session service yet, so email, student ID, branch and college name have
 *      no source of truth. They render as "not available" until a backend
 *      supplies them, rather than being filled with believable sample data.
 *   2. Everything the student actually owns IS real: joined clubs come from
 *      club-data.js + the `scms_joined_clubs` store, and event registrations
 *      come from the shared event store + the `scms_event_registrations` store.
 *      Joining a club or registering for an event elsewhere is reflected here.
 *   3. Only the four fields the college does not own are editable. Institutional
 *      identifiers are never writable from the browser.
 *   4. Storage access is defensive: private-mode browsers throw on
 *      localStorage, and the page must degrade to in-memory state, not break.
 * ==========================================================================
 */

import { escapeHtml, setText } from './dom.js';
import { showToast } from './toast.js';
import {
  getCategoryBadgeStyle,
  getClubById,
  getJoinedClubIds
} from './club-data.js';
import {
  EVENT_STATUS,
  getEventDataSource,
  getRegisteredEventIds,
  getSeatsRemaining,
  isVisibleToStudents,
  resolveTimingGroup,
  TIME_FILTERS
} from './event-data.js';
import { requireStudentSession } from './nav.js';

const PROFILE_STORAGE_KEY = 'scms_user_profile';

const FIELD_LIMITS = {
  fullName: { min: 2, max: 80 },
  department: { max: 80 },
  phone: { minDigits: 7, maxDigits: 15 }
};

const ACADEMIC_YEAR_PATTERN = /^\d{4}\s*[-–—]\s*\d{4}$/;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_PREFERENCES = {
  eventReminders: true,
  clubAnnouncements: true,
  emailDigest: false
};

/* ==========================================================================
   PROFILE STATE
   ========================================================================== */

/** Last-resort holder used when localStorage is unavailable (private mode). */
let memoryProfile = null;

function emptyProfile() {
  return {
    fullName: '',
    phone: '',
    department: '',
    academicYear: '',
    email: '',
    studentId: '',
    branch: '',
    collegeName: '',
    preferences: { ...DEFAULT_PREFERENCES }
  };
}

/**
 * Reads the stored profile, repairing anything missing or of the wrong type.
 * A corrupt or partial record must never break the page.
 */
function readProfile() {
  const base = emptyProfile();

  let raw = null;
  try {
    raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
  } catch (error) {
    return normalizeProfile(memoryProfile, base);
  }

  if (raw === null) return base;

  try {
    return normalizeProfile(JSON.parse(raw), base);
  } catch (error) {
    return base;
  }
}

function normalizeProfile(value, base = emptyProfile()) {
  if (!value || typeof value !== 'object') return base;

  const text = key => (typeof value[key] === 'string' ? value[key].trim() : base[key]);
  const storedPrefs = value.preferences && typeof value.preferences === 'object' ? value.preferences : {};

  return {
    fullName: text('fullName'),
    phone: text('phone'),
    department: text('department'),
    academicYear: text('academicYear'),
    email: text('email'),
    studentId: text('studentId'),
    branch: text('branch'),
    collegeName: text('collegeName'),
    preferences: {
      eventReminders: readPref(storedPrefs.eventReminders, base.preferences.eventReminders),
      clubAnnouncements: readPref(storedPrefs.clubAnnouncements, base.preferences.clubAnnouncements),
      emailDigest: readPref(storedPrefs.emailDigest, base.preferences.emailDigest)
    }
  };
}

function readPref(value, fallback) {
  return typeof value === 'boolean' ? value : fallback;
}

/** Persists the profile, silently falling back to memory when storage throws. */
function writeProfile(profile) {
  memoryProfile = profile;

  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (error) {
    return false;
  }
}

/* ==========================================================================
   FIELD VALIDATION
   ========================================================================== */

/**
 * Validates one editable field. Returns `{ isValid, message }`, matching the
 * shape auth.js uses so both pages report errors the same way.
 */
function validateField(field) {
  if (!field) return { isValid: true, message: '' };

  const value = field.value.trim();

  if (field.id === 'fullName') {
    if (!value) {
      return { isValid: false, message: 'Please enter your full name.' };
    }
    if (value.length < FIELD_LIMITS.fullName.min) {
      return { isValid: false, message: `Your name must be at least ${FIELD_LIMITS.fullName.min} characters.` };
    }
    if (value.length > FIELD_LIMITS.fullName.max) {
      return { isValid: false, message: `Your name must be ${FIELD_LIMITS.fullName.max} characters or fewer.` };
    }
    return { isValid: true, message: '' };
  }

  if (field.id === 'phone') {
    if (!value) return { isValid: true, message: '' };

    const digits = value.replace(/[\s-]/g, '').replace(/^\+/, '');

    if (!/^\d+$/.test(digits)) {
      return { isValid: false, message: 'Phone number can only contain digits, spaces, dashes and a leading +.' };
    }
    if (digits.length < FIELD_LIMITS.phone.minDigits || digits.length > FIELD_LIMITS.phone.maxDigits) {
      return {
        isValid: false,
        message: `Phone number must contain between ${FIELD_LIMITS.phone.minDigits} and ${FIELD_LIMITS.phone.maxDigits} digits.`
      };
    }
    return { isValid: true, message: '' };
  }

  if (field.id === 'department') {
    if (!value) return { isValid: true, message: '' };
    if (value.length > FIELD_LIMITS.department.max) {
      return { isValid: false, message: `Department must be ${FIELD_LIMITS.department.max} characters or fewer.` };
    }
    return { isValid: true, message: '' };
  }

  if (field.id === 'academicYear') {
    if (!value) return { isValid: true, message: '' };
    if (!ACADEMIC_YEAR_PATTERN.test(value)) {
      return { isValid: false, message: 'Use the format 2026-2027.' };
    }

    const [start, end] = value.split(/\s*[-–—]\s*/).map(Number);
    if (end <= start) {
      return { isValid: false, message: 'The ending year must be later than the starting year.' };
    }
    return { isValid: true, message: '' };
  }

  return { isValid: true, message: '' };
}

/**
 * Shows an inline error using the auth.js contract: the message lives in the
 * `<fieldId>Error` element and the field carries `is-invalid` / `aria-invalid`.
 */
function showFieldError(field, message) {
  if (!field) return;

  const errorElement = document.getElementById(`${field.id}Error`);
  field.classList.add('is-invalid');
  field.setAttribute('aria-invalid', 'true');

  if (errorElement) errorElement.textContent = message;
}

function clearFieldError(field) {
  if (!field) return;

  const errorElement = document.getElementById(`${field.id}Error`);
  field.classList.remove('is-invalid');
  field.removeAttribute('aria-invalid');

  if (errorElement) errorElement.textContent = '';
}

/** Validates every editable field, focusing and reporting the first failure. */
function validateForm(fields) {
  let isValid = true;
  let firstInvalid = null;

  fields.forEach(field => {
    const result = validateField(field);

    if (result.isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, result.message);
      isValid = false;
      if (!firstInvalid) firstInvalid = field;
    }
  });

  if (firstInvalid) firstInvalid.focus();

  return isValid;
}

/** Clears an error as soon as the student starts correcting the field. */
function attachFieldListeners(field) {
  if (!field) return;

  field.addEventListener('input', () => {
    if (!field.classList.contains('is-invalid')) return;

    const result = validateField(field);
    if (result.isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, result.message);
    }
  });

  field.addEventListener('blur', () => {
    if (field.value.trim().length === 0) return;

    const result = validateField(field);
    if (result.isValid) {
      clearFieldError(field);
    } else {
      showFieldError(field, result.message);
    }
  });
}

/* ==========================================================================
   RENDERING - IDENTITY AND PERSONAL INFORMATION
   ========================================================================== */

/** Placeholder text used whenever the backend has not supplied a value yet. */
function orNotAvailable(value, label) {
  return value ? value : `${label} not available`;
}

/** "Aarav Sharma" -> "AS". Falls back to a neutral person glyph. */
function initialsOf(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Writes into a hero chip without destroying the icon it contains.
 * Chips ship as `<span class="profile-chip"><svg/><span>label</span></span>`,
 * so setting textContent on the chip itself would delete the SVG.
 */
function setChipText(id, value) {
  const chip = document.getElementById(id);
  if (!chip) return;

  const label = chip.querySelector('span');
  if (label) {
    label.textContent = value;
    return;
  }

  chip.textContent = value;
}

function renderIdentity(profile) {
  const initials = initialsOf(profile.fullName);

  setText('profileAvatarInitials', initials);
  setText('profileName', orNotAvailable(profile.fullName, 'Student name'));
  setText('profileEmail', orNotAvailable(profile.email, 'Email'));

  setChipText('profileHeroStudentId', orNotAvailable(profile.studentId, 'Student ID'));
  setChipText('profileHeroDepartment', orNotAvailable(profile.department, 'Department'));
  setChipText('profileHeroYear', orNotAvailable(profile.academicYear, 'Academic year'));

  // The neutral person glyph only shows until a real name exists, so initials
  // are never invented for a student whose name we do not have.
  const avatar = document.getElementById('profileAvatar');
  if (avatar) avatar.classList.toggle('has-initials', Boolean(initials));
}

function renderPersonalInformation(profile) {
  setText('infoFullName', orNotAvailable(profile.fullName, 'Student name'));
  setText('infoEmail', orNotAvailable(profile.email, 'Email'));
  setText('infoPhone', orNotAvailable(profile.phone, 'Phone number'));
  setText('infoStudentId', orNotAvailable(profile.studentId, 'Student ID'));
  setText('infoDepartment', orNotAvailable(profile.department, 'Department'));
  setText('infoBranch', orNotAvailable(profile.branch, 'Branch'));
  setText('infoAcademicYear', orNotAvailable(profile.academicYear, 'Academic year'));
  setText('infoCollege', orNotAvailable(profile.collegeName, 'College'));
}

/* ==========================================================================
   RENDERING - MY CLUBS
   Reads the real joined-club store written by pages/club-details.html.
   ========================================================================== */

function renderMyClubs() {
  const grid = document.getElementById('myClubsGrid');
  const emptyState = document.getElementById('myClubsEmpty');
  if (!grid || !emptyState) return;

  const joinedIds = getJoinedClubIds();
  const clubs = joinedIds
    .map(id => getClubById(id))
    .filter(Boolean);

  if (clubs.length === 0) {
    grid.innerHTML = '';
    grid.hidden = true;
    emptyState.hidden = false;
    return;
  }

  grid.innerHTML = clubs.map(renderClubCard).join('');
  grid.hidden = false;
  emptyState.hidden = true;
}

function renderClubCard(club) {
  const badge = getCategoryBadgeStyle(club.category);

  return `
    <article class="profile-club-card" role="listitem">
      <div class="profile-club-top">
        <span class="profile-club-icon" aria-hidden="true">${escapeHtml(club.icon || '')}</span>
        <div>
          <h3 class="profile-club-name">${escapeHtml(club.name)}</h3>
          <p class="profile-club-meta">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
            </svg>
            <span>${escapeHtml(club.members || 'Members not listed')}</span>
          </p>
        </div>
      </div>

      <span class="profile-club-badge" style="${escapeHtml(badgeStyleAttr(badge))}">${escapeHtml(club.category)}</span>

      <a class="btn btn-secondary btn-sm" href="club-details.html?id=${encodeURIComponent(club.id)}">View Club</a>
    </article>
  `;
}

/** Turns a badge token object into inline style attributes. */
function badgeStyleAttr(badge) {
  if (!badge || typeof badge !== 'object') return '';

  return [
    badge.bg ? `background-color:${badge.bg}` : '',
    badge.text ? `color:${badge.text}` : '',
    badge.border ? `border-color:${badge.border}` : ''
  ].filter(Boolean).join(';');
}

/* ==========================================================================
   RENDERING - MY EVENT REGISTRATIONS
   Reads the real registration store written by pages/events.html.
   ========================================================================== */

async function renderMyRegistrations() {
  const list = document.getElementById('myRegistrationsList');
  const emptyState = document.getElementById('myRegistrationsEmpty');
  if (!list || !emptyState) return;

  const registeredIds = getRegisteredEventIds();
  if (registeredIds.length === 0) {
    showEmptyRegistrations(list, emptyState);
    return;
  }

  let events = [];
  try {
    const source = getEventDataSource();
    events = await source.list();
  } catch (error) {
    events = [];
  }

  const registered = registeredIds
    .map(id => events.find(event => event && event.id === id))
    .filter(event => event && isVisibleToStudents(event));

  if (registered.length === 0) {
    showEmptyRegistrations(list, emptyState);
    return;
  }

  // Soonest first, so the next thing the student has to attend is on top.
  registered.sort((a, b) => String(a.startDate).localeCompare(String(b.startDate)));

  list.innerHTML = registered.map(renderRegistrationRow).join('');
  list.hidden = false;
  emptyState.hidden = true;
}

function showEmptyRegistrations(list, emptyState) {
  list.innerHTML = '';
  list.hidden = true;
  emptyState.hidden = false;
}

function renderRegistrationRow(event) {
  const startDate = parseDate(event.startDate);
  const day = startDate ? startDate.getDate() : '--';
  const month = startDate ? MONTHS[startDate.getMonth()] : 'TBA';
  const clubName = event.clubName || (getClubById(event.clubId) || {}).name || '';
  const status = registrationStatusOf(event);
  const seats = getSeatsRemaining(event);

  const timeRange = [event.startTime, event.endTime].filter(Boolean).join(' - ');

  return `
    <article class="profile-event-row" role="listitem">
      <div class="profile-event-date">
        <span class="profile-event-day">${escapeHtml(day)}</span>
        <span class="profile-event-month">${escapeHtml(month)}</span>
      </div>

      <div class="profile-event-body">
        ${clubName ? `<p class="profile-event-club">${escapeHtml(clubName)}</p>` : ''}
        <h3 class="profile-event-name">${escapeHtml(event.title)}</h3>

        <div class="profile-event-meta">
          ${metaItem('M11 19h8M12 16v3M8 3h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z', timeRange)}
          ${event.venue ? metaItem('M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z', event.venue) : ''}
          ${seats === null ? '' : metaItem('M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2', `${seats} ${seats === 1 ? 'seat' : 'seats'} left`)}
          <span class="profile-event-meta-item">
            <span class="profile-status profile-status-${status.className}">${escapeHtml(status.label)}</span>
          </span>
        </div>
      </div>

      <div class="profile-event-cta">
        <a class="btn btn-secondary btn-sm" href="event-details.html?id=${encodeURIComponent(event.id)}">View Event</a>
      </div>
    </article>
  `;
}

function metaItem(path, text) {
  if (!text) return '';

  return `
    <span class="profile-event-meta-item">
      <svg viewBox="0 0 24 24" aria-hidden="true"><path d="${path}"></path></svg>
      <span>${escapeHtml(text)}</span>
    </span>
  `;
}

/** Maps a live event onto the three status pills the stylesheet defines. */
function registrationStatusOf(event) {
  if (event.status === EVENT_STATUS.CANCELLED) {
    return { className: 'closed', label: 'Cancelled' };
  }

  const timing = resolveTimingGroup(event);

  if (event.status === EVENT_STATUS.COMPLETED || timing === TIME_FILTERS.PAST) {
    return { className: 'closed', label: 'Completed' };
  }
  if (event.status === EVENT_STATUS.ONGOING || timing === TIME_FILTERS.ONGOING) {
    return { className: 'ongoing', label: 'Ongoing' };
  }
  return { className: 'upcoming', label: 'Upcoming' };
}

/** Parses a YYYY-MM-DD string without letting the timezone shift the day. */
function parseDate(value) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value || '').trim());
  if (!match) return null;

  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return isNaN(date.getTime()) ? null : date;
}

/* ==========================================================================
   EDIT PROFILE MODAL
   ========================================================================== */

function createModalController() {
  const modal = document.getElementById('editProfileModal');
  const form = document.getElementById('editProfileForm');
  const isOpen = () => Boolean(modal) && !modal.hidden;

  if (!modal || !form) {
    return { open() {}, close() {}, isOpen: () => false, modal: null };
  }

  const lastFocusedHolder = { element: null };

  function open() {
    lastFocusedHolder.element = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';

    const firstField = form.querySelector('input, select, textarea');
    if (firstField) firstField.focus();
  }

  function close() {
    if (!isOpen()) return;

    modal.hidden = true;
    document.body.style.overflow = '';

    const previous = lastFocusedHolder.element;
    if (previous && typeof previous.focus === 'function') previous.focus();
  }

  // Click on the backdrop (but not inside the dialog) dismisses it.
  modal.addEventListener('click', event => {
    if (event.target === modal) close();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) close();
  });

  return { open, close, isOpen, modal };
}

/** Keeps Tab focus inside the dialog while it is open. */
function trapFocus(modal, isOpen) {
  if (!modal) return;

  const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled])';

  document.addEventListener('keydown', event => {
    if (event.key !== 'Tab' || !isOpen()) return;

    const focusable = Array.from(modal.querySelectorAll(FOCUSABLE))
      .filter(el => el.offsetParent !== null);

    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

/* ==========================================================================
   ACCOUNT SETTINGS
   ========================================================================== */

/**
 * Change Password and Logout have no backend to talk to. They acknowledge the
 * click and state plainly what is missing instead of pretending to work.
 */
function initAccountActions() {
  const changePasswordButton = document.getElementById('changePasswordBtn');
  if (changePasswordButton) {
    changePasswordButton.addEventListener('click', () => {
      showToast('Changing your password will be available once the SCMS account service is connected.');
    });
  }

  const logoutButton = document.getElementById('logoutBtn');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      showToast('Logout will end your session once the SCMS account service is connected. Your clubs and event registrations stay saved on this device.');
    });
  }
}

/** Notification preferences are real, persisted toggles. */
function initNotificationPreferences(profile) {
  const panel = document.getElementById('notificationPrefs');
  const toggle = document.getElementById('notificationPrefsBtn');
  if (!panel || !toggle) return;

  const checkboxes = Array.from(panel.querySelectorAll('input[type="checkbox"][data-pref]'));

  const syncFromProfile = () => {
    checkboxes.forEach(input => {
      input.checked = Boolean(profile.preferences[input.dataset.pref]);
    });
  };

  syncFromProfile();

  toggle.addEventListener('click', () => {
    const willOpen = !panel.classList.contains('is-open');

    panel.classList.toggle('is-open', willOpen);
    toggle.setAttribute('aria-expanded', String(willOpen));
    toggle.textContent = willOpen ? 'Hide Preferences' : 'Preferences';

    if (willOpen) {
      const firstCheckbox = checkboxes[0];
      if (firstCheckbox) firstCheckbox.focus();
    }
  });

  checkboxes.forEach(input => {
    input.addEventListener('change', () => {
      profile.preferences[input.dataset.pref] = input.checked;

      const persisted = writeProfile(profile);
      showToast(persisted
        ? 'Notification preferences saved.'
        : 'Notification preferences saved for this visit only.');
    });
  });
}

/* ==========================================================================
   PAGE INITIALISATION
   ========================================================================== */

function init() {
  const profile = readProfile();

  renderIdentity(profile);
  renderPersonalInformation(profile);
  renderMyClubs();
  renderMyRegistrations();

  const form = document.getElementById('editProfileForm');
  const fieldMap = {
    fullName: document.getElementById('fullName'),
    phone: document.getElementById('phone'),
    department: document.getElementById('department'),
    academicYear: document.getElementById('academicYear')
  };
  const fields = Object.values(fieldMap).filter(Boolean);

  const modal = createModalController();
  trapFocus(modal.modal, modal.isOpen);

  Object.keys(fieldMap).forEach(key => {
    if (fieldMap[key]) fieldMap[key].value = profile[key];
  });

  fields.forEach(attachFieldListeners);

  const formError = document.getElementById('profileFormError');
  const hideFormError = () => {
    if (!formError) return;
    formError.hidden = true;
    formError.textContent = '';
  };

  // Every "Edit Profile" control on the page opens the same dialog.
  document.querySelectorAll('[data-open-edit-profile]').forEach(button => {
    button.addEventListener('click', () => {
      hideFormError();
      fields.forEach(clearFieldError);
      modal.open();
    });
  });

  const closeButton = document.getElementById('editProfileClose');
  if (closeButton) closeButton.addEventListener('click', modal.close);

  const cancelButton = document.getElementById('editProfileCancel');
  if (cancelButton) cancelButton.addEventListener('click', modal.close);

  if (form) {
    form.addEventListener('submit', event => {
      event.preventDefault();
      hideFormError();

      if (!validateForm(fields)) {
        if (formError) {
          formError.textContent = 'Please correct the highlighted fields before saving.';
          formError.hidden = false;
        }
        return;
      }

Object.keys(fieldMap).forEach(key => {
        if (fieldMap[key]) profile[key] = fieldMap[key].value.trim();
      });

      const persisted = writeProfile(profile);

      renderIdentity(profile);
      renderPersonalInformation(profile);
      modal.close();

      showToast(persisted
        ? 'Profile updated.'
        : 'Profile updated for this visit only. Browser storage is unavailable.');
    });
  }

  initNotificationPreferences(profile);
  initAccountActions();

  // Keep the page honest when the student joins a club in another tab.
  window.addEventListener('storage', event => {
    if (event.key === 'scms_joined_clubs' || event.key === 'scms_event_registrations') {
      renderMyClubs();
      renderMyRegistrations();
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
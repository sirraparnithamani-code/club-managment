
import { getClubById, getClubData, getClubDetails, toCategorySlug } from './club-data.js';
import { countEventRegistrations } from './registration-data.js';

/**
 * Full event lifecycle. Draft and Pending Approval are admin-only stages and
 * are never rendered on the student-facing Events page.
 */
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending-approval',
  PUBLISHED: 'published',
  REGISTRATION_OPEN: 'registration-open',
  REGISTRATION_CLOSED: 'registration-closed',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const STATUS_LABELS = {
  [EVENT_STATUS.DRAFT]: 'Draft',
  [EVENT_STATUS.PENDING_APPROVAL]: 'Pending Approval',
  [EVENT_STATUS.PUBLISHED]: 'Published',
  [EVENT_STATUS.REGISTRATION_OPEN]: 'Registration Open',
  [EVENT_STATUS.REGISTRATION_CLOSED]: 'Registration Closed',
  [EVENT_STATUS.ONGOING]: 'Ongoing',
  [EVENT_STATUS.COMPLETED]: 'Completed',
  [EVENT_STATUS.CANCELLED]: 'Cancelled'
};

/** Statuses a student is allowed to see once an event has been published. */
export const STUDENT_VISIBLE_STATUSES = [
  EVENT_STATUS.PUBLISHED,
  EVENT_STATUS.REGISTRATION_OPEN,
  EVENT_STATUS.REGISTRATION_CLOSED,
  EVENT_STATUS.ONGOING,
  EVENT_STATUS.COMPLETED,
  EVENT_STATUS.CANCELLED
];

/** Timeline buckets used by the Upcoming / Ongoing / Past filter. */
export const TIME_FILTERS = {
  ALL: 'all',
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  PAST: 'past'
};

export const SORT_OPTIONS = {
  SOONEST: 'soonest',
  NEWEST: 'newest',
  TITLE: 'title'
};

const DEFAULT_STORAGE_KEY = 'scms_events';
const REGISTRATION_STORAGE_KEY = 'scms_event_registrations';

/** A single shared instance so every page reads the same collection. */
let sharedDataSource = null;

/** Returns the application-wide event data source. */
export function getEventDataSource(options) {
  if (!sharedDataSource) sharedDataSource = createEventDataSource(options);
  return sharedDataSource;
}

/**
 * Fills in every field the renderers rely on so the UI never has to guess
 * whether a property exists. Accepts a raw API record or a locally authored
 * record and always returns the same shape.
 */
export function normalizeEvent(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const status = Object.values(EVENT_STATUS).indexOf(raw.status) !== -1
    ? raw.status
    : EVENT_STATUS.PUBLISHED;

  const clubId = toText(raw.clubId);
  const clubName = toText(raw.clubName);

  const seats = numberOrNull(raw.seats);
  // Derive seatsTaken from registration records when not explicitly set.
  // This keeps the student and coordinator views in sync.
  const rawSeatsTaken = numberOrNull(raw.seatsTaken);
  const seatsTaken = rawSeatsTaken !== null
    ? rawSeatsTaken
    : (toText(raw.id) ? countEventRegistrations(toText(raw.id)) : 0);

  return {
    id: toText(raw.id),
    title: toText(raw.title),
    description: toText(raw.description),
    clubId,
    clubName,
    clubKey: clubId || clubName,
    category: toText(raw.category),
    categoryLabel: toText(raw.categoryLabel || raw.category),
    eventType: toText(raw.eventType),
    venue: toText(raw.venue),
    banner: toText(raw.banner),
    status,
    startDate: toText(raw.startDate),
    endDate: toText(raw.endDate),
    startTime: toText(raw.startTime),
    endTime: toText(raw.endTime),
    registrationEnabled: raw.registrationEnabled === true,
    registrationDeadline: toText(raw.registrationDeadline),
    seats,
    seatsTaken,
    eligibility: toText(raw.eligibility),
    contactEmail: toText(raw.contactEmail),
    contactPhone: toText(raw.contactPhone),
    publishedAt: toText(raw.publishedAt),
    createdAt: toText(raw.createdAt),
    updatedAt: toText(raw.updatedAt)
  };
}

export function isVisibleToStudents(event) {
  return Boolean(event) && STUDENT_VISIBLE_STATUSES.indexOf(event.status) !== -1;
}

/** True when the status is derived from the calendar rather than declared. */
function isCalendarDerived(status) {
  return status === EVENT_STATUS.PUBLISHED || status === EVENT_STATUS.REGISTRATION_OPEN;
}

/** Resolves the event's lifecycle stage from its dates, falling back to status. */
export function resolveTimingGroup(event, now) {
  if (!event) return TIME_FILTERS.UPCOMING;

  if (event.status === EVENT_STATUS.ONGOING) return TIME_FILTERS.ONGOING;
  if (event.status === EVENT_STATUS.COMPLETED || event.status === EVENT_STATUS.CANCELLED) {
    return TIME_FILTERS.PAST;
  }

  const start = toDate(event.startDate, event.startTime);
  const end = toDate(event.endDate || event.startDate, event.endTime) || start;

  if (start && now >= start && now <= end) return TIME_FILTERS.ONGOING;
  if (end && now > end) return TIME_FILTERS.PAST;

  return isCalendarDerived(event.status) ? TIME_FILTERS.UPCOMING : TIME_FILTERS.PAST;
}

export function isRegistrationActive(event) {
  if (!event || !event.registrationEnabled) return false;
  if (event.status === EVENT_STATUS.CANCELLED || event.status === EVENT_STATUS.COMPLETED) return false;

  const now = new Date();
  if (event.registrationDeadline) {
    const deadline = toDate(event.registrationDeadline, '23:59');
    if (deadline && now > deadline) return false;
  }

  return event.status === EVENT_STATUS.REGISTRATION_OPEN || event.status === EVENT_STATUS.PUBLISHED;
}

export function getSeatsRemaining(event) {
  if (!event || event.seats === null) return null;
  const taken = event.seatsTaken || 0;
  return Math.max(event.seats - taken, 0);
}

export function filterEvents(events, criteria) {
  const { search = '', club = 'all', category = 'all', timing = TIME_FILTERS.ALL } = criteria || {};
  const term = String(search).toLowerCase().trim();
  const now = new Date();

  return events.filter(event => {
    if (!isVisibleToStudents(event)) return false;
    if (club !== 'all' && event.clubKey !== club) return false;
    if (category !== 'all' && event.category !== category) return false;
    if (timing !== TIME_FILTERS.ALL && resolveTimingGroup(event, now) !== timing) return false;

    if (term !== '') {
      const haystack = [
        event.title,
        event.description,
        event.clubName,
        event.category,
        event.eventType,
        event.venue
      ].join(' ').toLowerCase();

      if (haystack.indexOf(term) === -1) return false;
    }

    return true;
  });
}

export function sortEvents(events, mode) {
  const list = events.slice();

  if (mode === SORT_OPTIONS.NEWEST) {
    return list.sort((a, b) => timestamp(b.publishedAt) - timestamp(a.publishedAt));
  }

  if (mode === SORT_OPTIONS.TITLE) {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }

  return list.sort((a, b) => {
    const left = timestamp(a.startDate) || Number.MAX_SAFE_INTEGER;
    const right = timestamp(b.startDate) || Number.MAX_SAFE_INTEGER;
    return left - right;
  });
}

export function createEventDataSource(options) {
  const { apiEndpoint = null, storageKey = DEFAULT_STORAGE_KEY } = options || {};

  return {
    usesApi: Boolean(apiEndpoint),

    /** Resolves to the list of events this source knows about. */
    async list() {
      if (apiEndpoint) return requestApi(apiEndpoint);

      const stored = await readLocalStore(storageKey);
      if (stored.length > 0) return stored;

      const demo = getDemoEvents();
      writeLocalStore(storageKey, demo);
      return demo;
    },

    /** Resolves to a single event, or null when the id is unknown. */
    async getById(id) {
      if (!id) return null;

      if (apiEndpoint) {
        try {
          return normalizeEvent(await requestApi(`${apiEndpoint}/${encodeURIComponent(id)}`));
        } catch (error) {
          return null;
        }
      }

      const events = await this.list();
      const match = events.find(event => event.id === id);
      return match ? normalizeEvent(match) : null;
    }
  };
}

async function requestApi(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Event service responded with ${response.status}`);
  }

  const payload = await response.json();
  const records = Array.isArray(payload) ? payload : (payload && payload.content) || [];
  return records.map(normalizeEvent).filter(Boolean);
}

async function readLocalStore(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeEvent).filter(Boolean);
  } catch (error) {
    return [];
  }
}

function writeLocalStore(storageKey, events) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(events));
  } catch (error) {
    /* storage unavailable (private mode) — demo data stays in memory */
  }
}

let demoEventsCache = null;

export function getDemoEvents() {
  if (!demoEventsCache) demoEventsCache = buildDemoEvents();
  return demoEventsCache.map(event => Object.assign({}, event));
}

function buildDemoEvents() {
  const records = [];

  getClubData().forEach(club => {
    const details = getClubDetails(club.id);
    if (!details || !Array.isArray(details.events)) return;

    details.events.forEach((entry, index) => {
      const dayOffset = Number.isFinite(entry.dayOffset) ? entry.dayOffset : index + 7;
      const range = parseTimeRange(entry.time);

      records.push(normalizeEvent({
        id: `${club.id}-${index + 1}`,
        title: entry.name,
        description: entry.description,
        clubId: club.id,
        clubName: club.name,
        // Slug so the Events category filter matches the club filters and the
        // footer deep links; label so the card badge reads like the club cards.
        category: toCategorySlug(club.category),
        categoryLabel: club.category,
        eventType: club.category,
        venue: entry.location,
        status: index === 0 ? EVENT_STATUS.REGISTRATION_OPEN : EVENT_STATUS.PUBLISHED,
        startDate: offsetDate(dayOffset),
        startTime: range.start,
        endTime: range.end,
        registrationEnabled: true,
        registrationDeadline: offsetDate(Math.max(dayOffset - 2, 0)),
        seats: 40 + ((index + 1) * 10),
        seatsTaken: ((index + 1) * 10) % 4,
        eligibility: 'Open to all registered SCMS students',
        contactEmail: `${club.id}@clubs.university.edu`,
        publishedAt: offsetDate(dayOffset - 14) + 'T09:00'
      }));
    });
  });

  return records;
}

/** Whole-day entries ("All day") fall back to a sensible morning slot. */
function parseTimeRange(text) {
  const value = String(text || '').trim();
  const match = value.match(/(\d{1,2}):(\d{2})\s*(am|pm)?\s*(?:-|–|to)\s*(\d{1,2}):(\d{2})\s*(am|pm)?/i);

  if (!match) return { start: '09:00', end: '17:00' };

  return {
    start: toTwentyFourHour(match[1], match[2], match[3]),
    end: toTwentyFourHour(match[4], match[5], match[6] || match[3])
  };
}

function toTwentyFourHour(hours, minutes, meridiem) {
  let hour = parseInt(hours, 10);
  const suffix = String(meridiem || '').toLowerCase();

  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;

  return `${String(hour).padStart(2, '0')}:${minutes}`;
}

/** Local-time YYYY-MM-DD, dayOffset days from today. */
function offsetDate(dayOffset) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + dayOffset);

  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

/* ==========================================================================
   PLATFORM STATISTICS
   Home and Dashboard both read these so their numbers can never drift.
   ========================================================================== */

/**
 * Resolves the platform-wide counts used across the site.
 * `students` is a published campus figure; it has no per-student record yet.
 */
export async function getEventStats() {
  const source = getEventDataSource();
  const events = await source.list();

  const now = new Date();
  const visible = events.filter(isVisibleToStudents);

  return {
    clubs: getClubData().length,
    totalEvents: visible.length,
    upcomingEvents: visible.filter(event => resolveTimingGroup(event, now) === TIME_FILTERS.UPCOMING).length,
    ongoingEvents: visible.filter(event => resolveTimingGroup(event, now) === TIME_FILTERS.ONGOING).length,
    students: 1000
  };
}

/** Published, student-visible, not yet finished — soonest first. */
export async function listUpcomingEvents() {
  const source = getEventDataSource();
  const events = await source.list();
  const now = new Date();

  return sortEvents(
    events.filter(isVisibleToStudents)
      .filter(event => resolveTimingGroup(event, now) === TIME_FILTERS.UPCOMING),
    SORT_OPTIONS.SOONEST
  );
}

export function getRegisteredEventIds() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(id => typeof id === 'string') : [];
  } catch (error) {
    return [];
  }
}

export function isRegisteredForEvent(eventId) {
  return Boolean(eventId) && getRegisteredEventIds().indexOf(eventId) !== -1;
}

export function registerForEvent(eventId) {
  if (!eventId) return [];
  const ids = getRegisteredEventIds();
  if (ids.indexOf(eventId) === -1) ids.push(eventId);
  writeRegisteredIds(ids);
  return ids;
}

export function cancelEventRegistration(eventId) {
  const ids = getRegisteredEventIds().filter(id => id !== eventId);
  writeRegisteredIds(ids);
  return ids;
}

function writeRegisteredIds(ids) {
  try {
    window.localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(ids));
  } catch (error) {
    /* storage unavailable (private mode) — registrations stay session-only */
  }
}

/** Resolves the club record behind an event, for joined-club filtering. */
export function getEventClub(event) {
  if (!event) return null;
  return getClubById(event.clubId);
}

/**
 * Creates a new event record. The coordinator can save as draft or publish.
 * Returns the normalized event or null on failure.
 */
export function createEvent(data) {
  const events = readLocalStoreSync(DEFAULT_STORAGE_KEY);
  const event = normalizeEvent({
    ...data,
    id: data.id || `evt-${Date.now()}`,
    clubId: data.clubId,
    clubName: data.clubName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  events.push(event);
  writeLocalStore(DEFAULT_STORAGE_KEY, events);
  return event;
}

/**
 * Updates an existing event. Returns the updated normalized event or null.
 */
export function updateEvent(id, data) {
  const events = readLocalStoreSync(DEFAULT_STORAGE_KEY);
  const index = events.findIndex(e => e.id === id);
  if (index === -1) return null;

  const updated = normalizeEvent({
    ...events[index],
    ...data,
    id,
    updatedAt: new Date().toISOString()
  });
  events[index] = updated;
  writeLocalStore(DEFAULT_STORAGE_KEY, events);
  return updated;
}

/**
 * Deletes an event by id. Returns true on success.
 * Callers should check for registrations before calling this.
 */
export function deleteEvent(id) {
  const events = readLocalStoreSync(DEFAULT_STORAGE_KEY).filter(e => e.id !== id);
  writeLocalStore(DEFAULT_STORAGE_KEY, events);
  return true;
}

/**
 * Returns the raw (unnormalized) stored events, used by CRUD helpers.
 */
function readLocalStoreSync(storageKey) {
  try {
    const raw = window.localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

/**
 * Publishes an event: sets status to published and records publishedAt.
 */
export function publishEvent(id) {
  return updateEvent(id, {
    status: EVENT_STATUS.PUBLISHED,
    publishedAt: new Date().toISOString()
  });
}

/**
 * Cancels an event: sets status to cancelled.
 */
export function cancelEvent(id) {
  return updateEvent(id, {
    status: EVENT_STATUS.CANCELLED
  });
}

/**
 * Restores an event from cancelled back to published.
 */
export function restoreEvent(id) {
  return updateEvent(id, {
    status: EVENT_STATUS.PUBLISHED
  });
}

/**
 * Returns events belonging to a specific club, including drafts and cancelled.
 */
export async function getClubEvents(clubId) {
  if (!clubId) return [];
  const source = getEventDataSource();
  const events = await source.list();
  return events.filter(e => e.clubId === clubId);
}

function toText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function numberOrNull(value) {
  return typeof value === 'number' && isFinite(value) ? value : null;
}

function timestamp(value) {
  if (!value) return 0;
  const parsed = Date.parse(value);
  return isNaN(parsed) ? 0 : parsed;
}

function toDate(dateValue, timeValue) {
  if (!dateValue) return null;

  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(dateValue) ? `${dateValue}T${timeValue || '00:00'}` : dateValue;
  const parsed = new Date(normalized);
  return isNaN(parsed.getTime()) ? null : parsed;
}

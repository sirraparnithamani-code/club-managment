/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - REGISTRATION RECORDS
 * Shared registration data between student registration and coordinator views.
 *
 * The original event-data.js stored only event IDs per browser tab. This module
 * stores detailed registration records (student name, email, registration date,
 * status) so coordinators can view and manage participants. Students and
 * coordinators read the same records.
 * ==========================================================================
 */

const REGISTRATION_RECORDS_KEY = 'scms_event_registration_records';

const REGISTRATION_STATUS = {
  REGISTERED: 'registered',
  CANCELLED: 'cancelled',
  ATTENDED: 'attended',
  NO_SHOW: 'no-show'
};

const REGISTRATION_STATUS_LABELS = {
  [REGISTRATION_STATUS.REGISTERED]: 'Registered',
  [REGISTRATION_STATUS.CANCELLED]: 'Cancelled',
  [REGISTRATION_STATUS.ATTENDED]: 'Attended',
  [REGISTRATION_STATUS.NO_SHOW]: 'No Show'
};

function readRecords() {
  try {
    const raw = window.localStorage.getItem(REGISTRATION_RECORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeRecords(list) {
  try {
    window.localStorage.setItem(REGISTRATION_RECORDS_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const status = Object.values(REGISTRATION_STATUS).indexOf(raw.status) !== -1
    ? raw.status
    : REGISTRATION_STATUS.REGISTERED;

  return {
    id: String(raw.id || `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`),
    eventId: String(raw.eventId || ''),
    studentId: String(raw.studentId || ''),
    studentName: String(raw.studentName || 'Student'),
    studentEmail: String(raw.studentEmail || ''),
    registeredAt: String(raw.registeredAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || raw.registeredAt || new Date().toISOString()),
    status
  };
}

/**
 * Returns all registration records, newest first.
 */
export function getRegistrationRecords() {
  return readRecords()
    .map(normalizeRecord)
    .filter(Boolean)
    .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
}

/**
 * Returns registration records for a specific event.
 */
export function getEventRegistrations(eventId) {
  if (!eventId) return [];
  return getRegistrationRecords().filter(r => r.eventId === eventId);
}

/**
 * Returns registration records for events belonging to a specific club.
 */
export function getClubRegistrations(clubId, eventIds) {
  if (!clubId || !eventIds || !eventIds.length) return [];
  const idSet = new Set(eventIds);
  return getRegistrationRecords().filter(r => idSet.has(r.eventId));
}

/**
 * Checks if a student is registered for an event.
 */
export function isStudentRegisteredForEvent(studentId, eventId) {
  if (!studentId || !eventId) return false;
  return getRegistrationRecords().some(
    r => r.studentId === studentId && r.eventId === eventId && r.status !== REGISTRATION_STATUS.CANCELLED
  );
}

/**
 * Creates a registration record when a student registers for an event.
 * Returns the created record or null if already registered.
 */
export function registerStudentForEvent(studentId, studentName, studentEmail, eventId) {
  if (!studentId || !eventId) return null;

  // Prevent duplicate active registrations
  if (isStudentRegisteredForEvent(studentId, eventId)) {
    return null;
  }

  const records = readRecords();
  const record = normalizeRecord({
    id: `reg-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    eventId,
    studentId,
    studentName,
    studentEmail,
    registeredAt: new Date().toISOString(),
    status: REGISTRATION_STATUS.REGISTERED
  });

  records.unshift(record);
  writeRecords(records);
  return record;
}

/**
 * Cancels a student's registration.
 */
export function cancelStudentRegistration(studentId, eventId) {
  if (!studentId || !eventId) return null;

  const records = readRecords();
  const index = records.findIndex(
    r => r.studentId === studentId && r.eventId === eventId && r.status !== REGISTRATION_STATUS.CANCELLED
  );

  if (index === -1) return null;

  records[index].status = REGISTRATION_STATUS.CANCELLED;
  records[index].updatedAt = new Date().toISOString();
  writeRecords(records);
  return normalizeRecord(records[index]);
}

/**
 * Updates a registration's status (coordinator action: attended, no-show, etc.)
 */
export function updateRegistrationStatus(recordId, status) {
  if (!recordId || !Object.values(REGISTRATION_STATUS).includes(status)) return null;

  const records = readRecords();
  const index = records.findIndex(r => r.id === recordId);
  if (index === -1) return null;

  records[index].status = status;
  records[index].updatedAt = new Date().toISOString();
  writeRecords(records);
  return normalizeRecord(records[index]);
}

/**
 * Deletes a registration record entirely (coordinator override).
 */
export function deleteRegistrationRecord(recordId) {
  if (!recordId) return false;
  const records = readRecords().filter(r => r.id !== recordId);
  writeRecords(records);
  return true;
}

/**
 * Counts active registrations for an event.
 */
export function countEventRegistrations(eventId) {
  if (!eventId) return 0;
  return getEventRegistrations(eventId).filter(
    r => r.status !== REGISTRATION_STATUS.CANCELLED
  ).length;
}

/**
 * Counts active registrations for multiple events (by event IDs).
 */
export function countRegistrationsForEvents(eventIds) {
  if (!eventIds || !eventIds.length) return 0;
  const idSet = new Set(eventIds);
  return getRegistrationRecords().filter(
    r => idSet.has(r.eventId) && r.status !== REGISTRATION_STATUS.CANCELLED
  ).length;
}

export const REGISTRATION_STATUS_LIST = REGISTRATION_STATUS;
export const REGISTRATION_STATUS_LABELS_LIST = REGISTRATION_STATUS_LABELS;
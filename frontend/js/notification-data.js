/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - NOTIFICATION DATA
 * Centralized notification data with localStorage persistence.
 * ==========================================================================
 */

const NOTIFICATION_STORAGE_KEY = 'scms_notifications';

const NOTIFICATION_TYPES = [
  { id: 'event_registration', label: 'Event Registration', badge: 'notify-badge-event' },
  { id: 'club_request', label: 'Club Request', badge: 'notify-badge-club' },
  { id: 'announcement', label: 'Announcement', badge: 'notify-badge-announcement' },
  { id: 'event_reminder', label: 'Event Reminder', badge: 'notify-badge-reminder' }
];

const DEFAULT_NOTIFICATIONS = [
  {
    id: 'notif-1',
    type: 'event_registration',
    title: 'Event Registration Confirmed',
    message: 'Your registration for "36-Hour Campus Hackathon" has been confirmed. Join us on August 5th at the Innovation Lab.',
    relatedId: 'hackathon-2026',
    relatedType: 'event',
    read: false,
    createdAt: '2026-08-01T09:30:00'
  },
  {
    id: 'notif-2',
    type: 'club_request',
    title: 'Club Join Request Received',
    message: 'Your request to join the Photography Club has been received and is pending approval by the club lead.',
    relatedId: 'photography-club',
    relatedType: 'club',
    read: false,
    createdAt: '2026-07-28T15:45:00'
  },
  {
    id: 'notif-3',
    type: 'announcement',
    title: 'New Announcement Published',
    message: 'A new announcement has been posted: "Library Renovation - Temporary Closure" from Campus Facilities.',
    relatedId: 'ann-5',
    relatedType: 'announcement',
    read: false,
    createdAt: '2026-07-30T08:00:00'
  },
  {
    id: 'notif-4',
    type: 'event_reminder',
    title: 'Reminder: Upcoming Event Tomorrow',
    message: 'This is a reminder for the "Golden Hour Photo Walk" hosted by Photography Club tomorrow at 4:30 PM at Campus Quad.',
    relatedId: 'photo-walk-aug',
    relatedType: 'event',
    read: false,
    createdAt: '2026-07-29T18:00:00'
  },
  {
    id: 'notif-5',
    type: 'event_registration',
    title: 'Event Registration Successful',
    message: 'You have successfully registered for the "Hangul for Beginners" workshop by the Japanese Club.',
    relatedId: 'hangul-workshop',
    relatedType: 'event',
    read: true,
    createdAt: '2026-07-26T10:15:00'
  },
  {
    id: 'notif-6',
    type: 'club_request',
    title: 'Club Join Approved',
    message: 'Great news! Your request to join the Coding Club has been approved. Welcome aboard!',
    relatedId: 'coding-club',
    relatedType: 'club',
    read: true,
    createdAt: '2026-07-24T12:00:00'
  },
  {
    id: 'notif-7',
    type: 'announcement',
    title: 'New Announcement Published',
    message: 'A new announcement has been posted: "Scholarship Application Deadline Extended" from Financial Aid Office.',
    relatedId: 'ann-6',
    relatedType: 'announcement',
    read: true,
    createdAt: '2026-08-01T07:00:00'
  },
  {
    id: 'notif-8',
    type: 'event_reminder',
    title: 'Reminder: Club Registration Open',
    message: 'Club registration for the Fall Semester is open. Browse 24+ clubs on the Clubs page and join communities that match your interests.',
    relatedId: 'club-registration-2026',
    relatedType: 'announcement',
    read: true,
    createdAt: '2026-07-20T00:00:00'
  }
];

function readNotifications() {
  try {
    const raw = window.localStorage.getItem(NOTIFICATION_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeNotifications(list) {
  try {
    window.localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

function getStoredNotifications() {
  const stored = readNotifications();
  if (stored.length > 0) return stored;
  writeNotifications(DEFAULT_NOTIFICATIONS);
  return DEFAULT_NOTIFICATIONS.map(n => ({ ...n }));
}

function normalizeNotification(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const type = NOTIFICATION_TYPES.find(t => t.id === raw.type) || NOTIFICATION_TYPES[0];

  return {
    id: String(raw.id || `notif-${Date.now()}`),
    type: type.id,
    typeLabel: type.label,
    typeBadge: type.badge,
    title: String(raw.title || '').trim(),
    message: String(raw.message || '').trim(),
    relatedId: String(raw.relatedId || ''),
    relatedType: String(raw.relatedType || ''),
    read: Boolean(raw.read),
    createdAt: String(raw.createdAt || new Date().toISOString()),
    updatedAt: String(raw.updatedAt || String(raw.createdAt || new Date().toISOString()))
  };
}

export const NOTIFICATION_TYPES_LIST = NOTIFICATION_TYPES;

export function getNotifications() {
  return getStoredNotifications().map(normalizeNotification).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );
}

export function getNotificationById(id) {
  const notifications = getNotifications();
  return notifications.find(n => n.id === id) || null;
}

export function getUnreadCount() {
  return getNotifications().filter(n => !n.read).length;
}

export function markAsRead(id) {
  const notifications = getStoredNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) return null;

  notifications[index].read = true;
  notifications[index].updatedAt = new Date().toISOString();
  writeNotifications(notifications);
  return notifications[index];
}

export function markAsUnread(id) {
  const notifications = getStoredNotifications();
  const index = notifications.findIndex(n => n.id === id);
  if (index === -1) return null;

  notifications[index].read = false;
  notifications[index].updatedAt = new Date().toISOString();
  writeNotifications(notifications);
  return notifications[index];
}

export function markAllAsRead() {
  const notifications = getStoredNotifications().map(n => ({
    ...n,
    read: true,
    updatedAt: new Date().toISOString()
  }));
  writeNotifications(notifications);
  return notifications.length;
}

export function deleteNotification(id) {
  const notifications = getStoredNotifications().filter(n => n.id !== id);
  writeNotifications(notifications);
  return notifications;
}

export function createNotification(data) {
  const notifications = getStoredNotifications();
  const notification = normalizeNotification({
    ...data,
    id: `notif-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  notifications.unshift(notification);
  writeNotifications(notifications);
  return notification;
}

export function filterNotifications(notifications, criteria) {
  const { type = 'all', read = 'all', search = '' } = criteria || {};
  const term = String(search).toLowerCase().trim();

  return notifications.filter(n => {
    if (type !== 'all' && n.type !== type) return false;
    if (read === 'unread' && n.read) return false;
    if (read === 'read' && !n.read) return false;

    if (term !== '') {
      const haystack = [n.title, n.message, n.typeLabel].join(' ').toLowerCase();
      if (haystack.indexOf(term) === -1) return false;
    }

    return true;
  });
}

export function formatNotificationDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
  if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
  if (diffDays < 2) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

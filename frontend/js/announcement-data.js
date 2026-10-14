/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - ANNOUNCEMENT DATA
 * Centralized announcement data for the Announcements page
 * ==========================================================================
 */

const ANNOUNCEMENT_STORAGE_KEY = 'scms_announcements';

/**
 * Announcement lifecycle statuses. Coordinators can draft, publish,
 * unpublish (back to draft), or delete. Students only see published.
 */
export const ANNOUNCEMENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  SCHEDULED: 'scheduled',
  EXPIRED: 'expired'
};

export const ANNOUNCEMENT_STATUS_LABELS = {
  [ANNOUNCEMENT_STATUS.DRAFT]: 'Draft',
  [ANNOUNCEMENT_STATUS.PUBLISHED]: 'Published',
  [ANNOUNCEMENT_STATUS.SCHEDULED]: 'Scheduled',
  [ANNOUNCEMENT_STATUS.EXPIRED]: 'Expired'
};

/** Statuses a student is allowed to see. */
export const STUDENT_VISIBLE_ANNOUNCEMENT_STATUSES = [
  ANNOUNCEMENT_STATUS.PUBLISHED,
  ANNOUNCEMENT_STATUS.SCHEDULED,
  ANNOUNCEMENT_STATUS.EXPIRED
];

const ANNOUNCEMENT_CATEGORIES = [
  { id: 'general', label: 'General', color: 'var(--color-primary)' },
  { id: 'academic', label: 'Academic', color: 'var(--color-info, #3B82F6)' },
  { id: 'event', label: 'Event', color: 'var(--color-accent)' },
  { id: 'deadline', label: 'Deadline', color: 'var(--color-warning, #F59E0B)' },
  { id: 'maintenance', label: 'Maintenance', color: 'var(--color-muted)' },
  { id: 'achievement', label: 'Achievement', color: 'var(--color-success, #10B981)' }
];

const ANNOUNCEMENT_PRIORITIES = [
  { id: 'normal', label: 'Normal', badge: 'ann-badge-normal' },
  { id: 'high', label: 'High', badge: 'ann-badge-high' },
  { id: 'urgent', label: 'Urgent', badge: 'ann-badge-urgent' }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    title: 'Welcome to the New Academic Year 2026-2027',
    body: 'We are excited to welcome all students back for the new academic year! The Student Club Management System (SCMS) is your gateway to discovering clubs, events, and campus activities. Take some time to explore the platform and find communities that match your interests.',
    category: 'general',
    priority: 'high',
    audience: 'all',
    pinned: true,
    author: 'SCMS Administration',
    authorRole: 'Admin',
    createdAt: '2026-07-15',
    updatedAt: '2026-07-15'
  },
  {
    id: 'ann-2',
    title: 'Club Registration Opens for Fall Semester',
    body: 'Registration for all student clubs is now open! Browse through 24+ recognized clubs across categories including Technical, Arts & Culture, Sports & Fitness, Language & Culture, Media & Communication, Social Service, Entertainment, and Personal Development. Join clubs to build your network, develop skills, and make the most of campus life.',
    category: 'event',
    priority: 'normal',
    audience: 'all',
    pinned: true,
    author: 'Student Affairs Office',
    authorRole: 'Coordinator',
    createdAt: '2026-07-20',
    updatedAt: '2026-07-20'
  },
  {
    id: 'ann-3',
    title: 'Upcoming Hackathon Club 36-Hour Campus Hackathon',
    body: 'The Hackathon Club is organizing a 36-hour campus hackathon starting August 5th. Teams of up to 4 students can participate. Mentors will be on-site throughout the event. Registration deadline is August 1st. Prizes worth ₹50,000 for winning teams!',
    category: 'event',
    priority: 'high',
    audience: 'all',
    pinned: false,
    author: 'Hackathon Club',
    authorRole: 'Club Lead',
    createdAt: '2026-07-25',
    updatedAt: '2026-07-25'
  },
  {
    id: 'ann-4',
    title: 'Photography Club - Golden Hour Photo Walk This Friday',
    body: 'Join the Photography Club for a golden hour photo walk across campus this Friday at 4:30 PM. Bring any camera (phone cameras welcome!). We will meet at the Campus Quad and explore the best spots for evening photography. No experience needed - all skill levels welcome.',
    category: 'event',
    priority: 'normal',
    audience: 'all',
    pinned: false,
    author: 'Photography Club',
    authorRole: 'Club Lead',
    createdAt: '2026-07-28',
    updatedAt: '2026-07-28'
  },
  {
    id: 'ann-5',
    title: 'Important: Library Renovation - Temporary Closure',
    body: 'The main campus library will be closed for renovation from August 1st to August 15th. During this period, digital resources remain accessible 24/7 through the library portal. A temporary study space has been set up in the Student Center (Rooms 301-303). We apologize for any inconvenience.',
    category: 'maintenance',
    priority: 'urgent',
    audience: 'all',
    pinned: true,
    author: 'Campus Facilities',
    authorRole: 'Admin',
    createdAt: '2026-07-30',
    updatedAt: '2026-07-30'
  },
  {
    id: 'ann-6',
    title: 'Scholarship Application Deadline Extended',
    body: 'The deadline for the Merit Scholarship and Need-Based Financial Aid applications has been extended to August 15th, 2026. Students who have not yet submitted their applications are encouraged to do so before the new deadline. Visit the Student Affairs Office (Room 204) for assistance.',
    category: 'deadline',
    priority: 'high',
    audience: 'all',
    pinned: false,
    author: 'Financial Aid Office',
    authorRole: 'Coordinator',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-01'
  },
  {
    id: 'ann-7',
    title: 'Coding Club Wins Regional Programming Competition',
    body: 'Congratulations to the Coding Club team for securing 1st place at the Regional Inter-College Programming Competition! The team solved 8 out of 10 problems in 3 hours. Special thanks to the club mentors and all members who participated in the preparation sessions.',
    category: 'achievement',
    priority: 'normal',
    audience: 'all',
    pinned: false,
    author: 'Coding Club',
    authorRole: 'Club Lead',
    createdAt: '2026-08-05',
    updatedAt: '2026-08-05'
  },
  {
    id: 'ann-8',
    title: 'NSS Club Blood Donation Camp - August 12th',
    body: 'The NSS Club is organizing a blood donation camp on August 12th from 9:00 AM to 4:00 PM at the Sports Complex Indoor Hall. All healthy students aged 18+ are eligible to donate. Registration at the entrance. Refreshments will be provided. Your donation can save up to 3 lives!',
    category: 'event',
    priority: 'high',
    audience: 'all',
    pinned: false,
    author: 'NSS Club',
    authorRole: 'Club Lead',
    createdAt: '2026-08-08',
    updatedAt: '2026-08-08'
  },
  {
    id: 'ann-9',
    title: 'New Course Registration Portal Launched',
    body: 'The new online course registration portal is now live. Students can register for Fall 2026 courses through the student portal. The new system features real-time seat availability, waitlist management, and automated schedule conflict detection. Support available at the Academic Affairs Office.',
    category: 'academic',
    priority: 'normal',
    audience: 'all',
    pinned: false,
    author: 'Academic Affairs',
    authorRole: 'Admin',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10'
  },
  {
    id: 'ann-10',
    title: 'Japanese Club - Hangul Workshop for Beginners',
    body: 'The Japanese Club is hosting a "Hangul for Absolute Beginners" workshop on August 18th at 5:00 PM in Language Lab 2. Learn to read and write Korean from the very first session! No prior knowledge required. All materials provided. Open to all students.',
    category: 'event',
    priority: 'normal',
    audience: 'all',
    pinned: false,
    author: 'Japanese Club',
    authorRole: 'Club Lead',
    createdAt: '2026-08-12',
    updatedAt: '2026-08-12'
  }
];

function readAnnouncements() {
  try {
    const raw = window.localStorage.getItem(ANNOUNCEMENT_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function writeAnnouncements(list) {
  try {
    window.localStorage.setItem(ANNOUNCEMENT_STORAGE_KEY, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

function getStoredAnnouncements() {
  const stored = readAnnouncements();
  if (stored.length > 0) return stored;
  
  writeAnnouncements(DEFAULT_ANNOUNCEMENTS);
  return DEFAULT_ANNOUNCEMENTS.map(a => ({ ...a }));
}

function normalizeAnnouncement(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const category = ANNOUNCEMENT_CATEGORIES.find(c => c.id === raw.category) || ANNOUNCEMENT_CATEGORIES[0];
  const priority = ANNOUNCEMENT_PRIORITIES.find(p => p.id === raw.priority) || ANNOUNCEMENT_PRIORITIES[0];

  // Default to published for existing records without a status field.
  const status = Object.values(ANNOUNCEMENT_STATUS).indexOf(raw.status) !== -1
    ? raw.status
    : ANNOUNCEMENT_STATUS.PUBLISHED;

  return {
    id: String(raw.id || `ann-${Date.now()}`),
    title: String(raw.title || '').trim(),
    body: String(raw.body || '').trim(),
    category: category.id,
    categoryLabel: category.label,
    categoryColor: category.color,
    priority: priority.id,
    priorityLabel: priority.label,
    priorityBadge: priority.badge,
    audience: String(raw.audience || 'all'),
    pinned: Boolean(raw.pinned),
    author: String(raw.author || 'SCMS'),
    authorRole: String(raw.authorRole || 'Admin'),
    status,
    statusLabel: ANNOUNCEMENT_STATUS_LABELS[status],
    scheduledFor: String(raw.scheduledFor || ''),
    expiresAt: String(raw.expiresAt || ''),
    createdAt: String(raw.createdAt || new Date().toISOString().slice(0, 10)),
    updatedAt: String(raw.updatedAt || new Date().toISOString().slice(0, 10))
  };
}

export const ANNOUNCEMENT_CATEGORIES_LIST = ANNOUNCEMENT_CATEGORIES;
export const ANNOUNCEMENT_PRIORITIES_LIST = ANNOUNCEMENT_PRIORITIES;

export function getAnnouncements() {
  return getStoredAnnouncements().map(normalizeAnnouncement);
}

export function getAnnouncementById(id) {
  const announcements = getAnnouncements();
  return announcements.find(a => a.id === id) || null;
}

export function createAnnouncement(data) {
  const announcements = getStoredAnnouncements();
  const announcement = normalizeAnnouncement({
    ...data,
    id: `ann-${Date.now()}`,
    createdAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10)
  });
  announcements.unshift(announcement);
  writeAnnouncements(announcements);
  return announcement;
}

export function updateAnnouncement(id, data) {
  const announcements = getStoredAnnouncements();
  const index = announcements.findIndex(a => a.id === id);
  if (index === -1) return null;
  
  const updated = normalizeAnnouncement({
    ...announcements[index],
    ...data,
    updatedAt: new Date().toISOString().slice(0, 10)
  });
  announcements[index] = updated;
  writeAnnouncements(announcements);
  return updated;
}

export function deleteAnnouncement(id) {
  const announcements = getStoredAnnouncements().filter(a => a.id !== id);
  writeAnnouncements(announcements);
  return announcements;
}

export function togglePinAnnouncement(id) {
  const announcements = getStoredAnnouncements();
  const item = announcements.find(a => a.id === id);
  if (item) {
    item.pinned = !item.pinned;
    item.updatedAt = new Date().toISOString().slice(0, 10);
    writeAnnouncements(announcements);
  }
  return item;
}

export function filterAnnouncements(announcements, criteria) {
  const { search = '', category = 'all', priority = 'all', audience = 'all' } = criteria || {};
  const term = String(search).toLowerCase().trim();
  
  return announcements.filter(ann => {
    if (category !== 'all' && ann.category !== category) return false;
    if (priority !== 'all' && ann.priority !== priority) return false;
    if (audience !== 'all' && ann.audience !== audience) return false;
    
    if (term !== '') {
      const haystack = [
        ann.title,
        ann.body,
        ann.categoryLabel,
        ann.author
      ].join(' ').toLowerCase();
      
      if (haystack.indexOf(term) === -1) return false;
    }
    
    return true;
  });
}

export function sortAnnouncements(announcements, mode = 'newest') {
  const list = announcements.slice();
  
  if (mode === 'oldest') {
    return list.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
  }
  
  if (mode === 'title') {
    return list.sort((a, b) => a.title.localeCompare(b.title));
  }
  
  if (mode === 'priority') {
    const priorityOrder = { urgent: 0, high: 1, normal: 2 };
    return list.sort((a, b) => (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2));
  }
  
  return list.sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function getAnnouncementCategories() {
  return ANNOUNCEMENT_CATEGORIES;
}

export function getAnnouncementPriorities() {
  return ANNOUNCEMENT_PRIORITIES;
}

export function formatRelativeDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diff = now - date;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
}

/**
 * Returns only announcements students are allowed to see (published/scheduled/expired).
 * Drafts are never rendered on student-facing pages.
 */
export function getVisibleAnnouncements() {
  return getAnnouncements().filter(
    a => STUDENT_VISIBLE_ANNOUNCEMENT_STATUSES.indexOf(a.status) !== -1
  );
}

/**
 * Publishes an announcement (draft -> published).
 */
export function publishAnnouncement(id) {
  return updateAnnouncement(id, {
    status: ANNOUNCEMENT_STATUS.PUBLISHED
  });
}

/**
 * Unpublishes an announcement (published -> draft). Students no longer see it.
 */
export function unpublishAnnouncement(id) {
  return updateAnnouncement(id, {
    status: ANNOUNCEMENT_STATUS.DRAFT
  });
}

/**
 * Marks an announcement as scheduled (visible to students only when scheduledFor is reached).
 */
export function scheduleAnnouncement(id, scheduledFor) {
  return updateAnnouncement(id, {
    status: ANNOUNCEMENT_STATUS.SCHEDULED,
    scheduledFor: String(scheduledFor || '')
  });
}
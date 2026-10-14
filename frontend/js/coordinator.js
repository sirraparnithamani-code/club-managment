/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - COORDINATOR PORTAL
 * Club Coordinator dashboard and management module
 * ==========================================================================
 */

import { requireCoordinatorSession, readSession, clearSession } from './nav.js';
import { getClubById, getJoinedClubIds } from './club-data.js';
import { getEventDataSource, listUpcomingEvents, isVisibleToStudents, resolveTimingGroup, TIME_FILTERS, EVENT_STATUS, STATUS_LABELS } from './event-data.js';
import { getAnnouncements, formatRelativeDate } from './announcement-data.js';
import { escapeHtml } from './dom.js';
import { showToast } from './toast.js';

// Guard: Coordinator pages require a coordinator session
const isCoordinator = requireCoordinatorSession();

/**
 * Initializes the coordinator dashboard.
 */
export async function initCoordinatorDashboard() {
  const session = readSession();
  if (!session || !session.clubId) {
    showToast('No club assigned. Please contact an administrator.');
    return;
  }

  // Load club data
  const club = getClubById(session.clubId);
  if (!club) {
    showToast('Assigned club not found.');
    return;
  }

  // Render club header
  renderClubHeader(club, session);

  // Load and render stats
  await renderStats(club.id);

  // Load and render upcoming events
  await renderUpcomingEvents(club.id);

  // Load and render recent announcements
  await renderRecentAnnouncements(club.id);

  // Setup logout
  setupLogout();
}

/**
 * Renders the club header with club info and coordinator name.
 */
function renderClubHeader(club, session) {
  const clubNameTitle = document.getElementById('clubNameTitle');
  const coordinatorName = document.getElementById('coordinatorName');
  const coordinatorAvatar = document.getElementById('coordinatorAvatar');
  const clubBadge = document.getElementById('coordinatorClubBadge');

  if (clubNameTitle) {
    clubNameTitle.textContent = club.name;
  }

  if (coordinatorName) {
    coordinatorName.textContent = session.name || 'Coordinator';
  }

  if (coordinatorAvatar) {
    const initials = getInitials(session.name || 'C');
    coordinatorAvatar.textContent = initials;
  }

  if (clubBadge) {
    clubBadge.textContent = club.name;
    clubBadge.style.display = 'inline-flex';
  }
}

/**
 * Renders overview statistics for the assigned club.
 */
async function renderStats(clubId) {
  const events = await listUpcomingEvents();
  const clubEvents = events.filter(e => e.clubId === clubId);

  const totalMembers = getJoinedClubIds().filter(id => id === clubId).length;
  const upcomingCount = clubEvents.filter(e => resolveTimingGroup(e, new Date()) === TIME_FILTERS.UPCOMING).length;
  
  const announcements = getAnnouncements();
  const clubAnnouncements = announcements.filter(a => a.category === 'event' && a.title.toLowerCase().includes(clubId.replace('-', ' ')));

  const statTotalMembers = document.getElementById('statTotalMembers');
  const statUpcomingEvents = document.getElementById('statUpcomingEvents');
  const statAnnouncements = document.getElementById('statAnnouncements');
  const statPendingApprovals = document.getElementById('statPendingApprovals');

  if (statTotalMembers) statTotalMembers.textContent = totalMembers || '—';
  if (statUpcomingEvents) statUpcomingEvents.textContent = upcomingCount;
  if (statAnnouncements) statAnnouncements.textContent = clubAnnouncements.length;
  if (statPendingApprovals) statPendingApprovals.textContent = '—'; // Placeholder for future approvals feature
}

/**
 * Renders upcoming events for the assigned club.
 */
async function renderUpcomingEvents(clubId) {
  const tbody = document.getElementById('upcomingEventsBody');
  if (!tbody) return;

  const events = await listUpcomingEvents();
  const clubEvents = events
    .filter(e => e.clubId === clubId)
    .filter(e => resolveTimingGroup(e, new Date()) === TIME_FILTERS.UPCOMING)
    .slice(0, 5);

  if (clubEvents.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 32px;"><div class="admin-empty" style="margin: 0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"><rect x="3" y="4" width="18" height="18" rx="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg><div class="admin-empty-title">No upcoming events</div><div class="admin-empty-text">Create your first event to get started</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = clubEvents.map(event => `
    <tr>
      <td>
        <div class="admin-table-name">
          <span class="admin-table-name-title">${escapeHtml(event.title)}</span>
        </div>
      </td>
      <td>${formatEventDateTime(event.startDate, event.startTime)}</td>
      <td>${escapeHtml(event.venue || 'TBA')}</td>
      <td>${event.seats !== null ? `${event.seatsTaken || 0} / ${event.seats}` : 'Unlimited'}</td>
      <td><span class="admin-badge ${getStatusBadgeClass(event.status)}">${STATUS_LABELS[event.status] || event.status}</span></td>
      <td>
        <div class="admin-actions">
          <a href="coordinator-events.html?edit=${event.id}" class="btn btn-secondary btn-sm" aria-label="Edit ${escapeHtml(event.title)}">Edit</a>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Renders recent announcements for the assigned club.
 */
async function renderRecentAnnouncements(clubId) {
  const tbody = document.getElementById('recentAnnouncementsBody');
  if (!tbody) return;

  const announcements = getAnnouncements()
    .filter(a => a.category === 'event' || a.category === 'general')
    .slice(0, 5);

  if (announcements.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 32px;"><div class="admin-empty" style="margin: 0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 48px; height: 48px; color: var(--text-muted); margin-bottom: 12px;"><path d="M12 2l9 3v10c0 5-3.5 8.3-8 9-4 .5-8 .5-8-1V5l8-3z"></path><path d="M12 2v6m0 6v1"></path></svg><div class="admin-empty-title">No announcements</div><div class="admin-empty-text">Post your first announcement</div></div></td></tr>';
    return;
  }

  tbody.innerHTML = announcements.map(ann => `
    <tr>
      <td>${escapeHtml(ann.title)}</td>
      <td>${formatRelativeDate(ann.createdAt)}</td>
      <td><span class="admin-badge ${getPriorityBadgeClass(ann.priority)}">${ann.priorityLabel}</span></td>
      <td>
        <div class="admin-actions">
          <a href="coordinator-announcements.html?edit=${ann.id}" class="btn btn-secondary btn-sm" aria-label="Edit ${escapeHtml(ann.title)}">Edit</a>
        </div>
      </td>
    </tr>
  `).join('');
}

/**
 * Sets up logout button handler.
 */
function setupLogout() {
  const logoutBtn = document.getElementById('coordinatorLogoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearSession();
      showToast('You have been logged out.');
      window.location.href = '../index.html';
    });
  }
}

/**
 * Formats event date and time for display.
 */
function formatEventDateTime(dateStr, timeStr) {
  if (!dateStr) return 'TBA';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'TBA';
  
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  const datePart = date.toLocaleDateString('en-US', options);
  
  if (timeStr) {
    return `${datePart} at ${formatTime12h(timeStr)}`;
  }
  return datePart;
}

/**
 * Converts 24-hour time to 12-hour format.
 */
function formatTime12h(time24) {
  const [hours, minutes] = time24.split(':').map(Number);
  if (hours === undefined || minutes === undefined) return time24;
  
  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

/**
 * Returns CSS class for status badge.
 */
function getStatusBadgeClass(status) {
  switch (status) {
    case EVENT_STATUS.REGISTRATION_OPEN: return 'admin-badge-sage';
    case EVENT_STATUS.PUBLISHED: return 'admin-badge-mauve';
    case EVENT_STATUS.ONGOING: return 'admin-badge-clay';
    case EVENT_STATUS.COMPLETED: return 'admin-badge-plum';
    case EVENT_STATUS.CANCELLED: return 'admin-badge-danger';
    case EVENT_STATUS.PENDING_APPROVAL: return 'admin-badge-neutral';
    case EVENT_STATUS.DRAFT: return 'admin-badge-neutral';
    default: return 'admin-badge-neutral';
  }
}

/**
 * Returns CSS class for priority badge.
 */
function getPriorityBadgeClass(priority) {
  switch (priority) {
    case 'urgent': return 'admin-badge-danger';
    case 'high': return 'admin-badge-clay';
    case 'normal': return 'admin-badge-mauve';
    default: return 'admin-badge-neutral';
  }
}

/**
 * Gets initials from a name.
 */
function getInitials(name) {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'C';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Initialize on DOM ready
if (isCoordinator) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCoordinatorDashboard);
  } else {
    initCoordinatorDashboard();
  }
}
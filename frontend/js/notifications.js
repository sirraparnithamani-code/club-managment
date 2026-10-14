/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - NOTIFICATIONS PAGE MODULE
 * Page: pages/notifications.html
 *
 * Renders notifications with filter by type/status, mark as read, mark all
 * as read, and storage-event based cross-tab sync.
 * ==========================================================================
 */

import {
  NOTIFICATION_TYPES_LIST,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAsUnread,
  markAllAsRead,
  filterNotifications,
  formatNotificationDate
} from './notification-data.js';

import { escapeHtml, initScrollReveal, setText } from './dom.js';
import { showToast } from './toast.js';
import { requireStudentSession, renderNotificationBadge } from './nav.js';

const NOTIFICATION_TYPE_ICONS = {
  event_registration: '<path d="M20.59 13.41l-7.58 7.58a2 2 0 0 1-2.83 0L5.41 16.67a9 9 0 1 1 15.18 0 2 2 0 0 1-2.83 2.83L10.41 17.07a1 1 0 0 0 0-1.41l4.58-4.58a1 1 0 1 0-1.41-1.41l2 2 2.58-2.58a2.99 2.99 0 0 1 4 0z"></path>',
  club_request: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.87"></path>',
  announcement: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><path d="M12 3v5"></path>',
  event_reminder: '<circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>'
};

const state = {
  notifications: [],
  type: 'all',
  status: 'all',
  sort: 'newest'
};

const dom = {};

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  function cacheDom() {
    dom.list = document.getElementById('notificationList');
    dom.typeFilter = document.getElementById('notificationTypeFilter');
    dom.statusFilter = document.getElementById('notificationStatusFilter');
    dom.sortSelect = document.getElementById('notificationSortSelect');
    dom.resultInfo = document.getElementById('notificationResultInfo');
    dom.markAllReadBtn = document.getElementById('markAllReadBtn');
    dom.noNotificationsState = document.getElementById('noNotificationsState');
    dom.noResultsState = document.getElementById('noResultsState');
    dom.clearFiltersBtn = document.getElementById('clearNotificationFiltersBtn');
  }

  function init() {
    cacheDom();

    if (!dom.list) return;

    attachEventListeners();
    loadNotifications();
    renderNotificationBadge();
  }

  function loadNotifications() {
    try {
      state.notifications = getNotifications();
    } catch (error) {
      state.notifications = [];
      showToast('Notifications could not be loaded right now. Please try again shortly.');
    }

    buildFilterOptions();
    applyFilters();
  }

  function buildFilterOptions() {
    const types = uniqueOptions(state.notifications.map(n => ({
      value: n.type,
      label: NOTIFICATION_TYPES_LIST.find(t => t.id === n.type)?.label || n.type
    })));

    fillSelect(dom.typeFilter, 'All types', 'all', types);
  }

  function fillSelect(select, allLabel, allValue, options) {
    if (!select) return;

    const previous = select.value || allValue;
    const markup = [`<option value="${allValue}">${allLabel}</option>`];

    options.forEach(option => {
      markup.push(`<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`);
    });

    select.innerHTML = markup.join('');
    select.value = options.some(option => option.value === previous) ? previous : allValue;
  }

  function attachEventListeners() {
    dom.typeFilter.addEventListener('change', () => {
      state.type = dom.typeFilter.value;
      applyFilters();
    });

    dom.statusFilter.addEventListener('change', () => {
      state.status = dom.statusFilter.value;
      applyFilters();
    });

    dom.sortSelect.addEventListener('change', () => {
      state.sort = dom.sortSelect.value;
      applyFilters();
    });

    dom.markAllReadBtn.addEventListener('click', () => {
      const unread = state.notifications.filter(n => !n.read).length;
      if (unread === 0) {
        showToast('All notifications are already read.');
        return;
      }

      markAllAsRead();
      state.notifications = getNotifications();
      renderNotificationBadge();
      applyFilters();
      showToast(`Marked ${unread} notification${unread === 1 ? '' : 's'} as read.`);
    });

    dom.clearFiltersBtn.addEventListener('click', () => {
      state.type = 'all';
      state.status = 'all';
      state.sort = 'newest';

      dom.typeFilter.value = 'all';
      dom.statusFilter.value = 'all';
      dom.sortSelect.value = 'newest';

      applyFilters();
    });

    window.addEventListener('storage', handleStorageChange);
  }

  function handleStorageChange(event) {
    if (event.key === 'scms_notifications') {
      state.notifications = getNotifications();
      renderNotificationBadge();
      applyFilters();
    }
  }

  function applyFilters() {
    const filtered = filterNotifications(state.notifications, {
      type: state.type,
      read: state.status === 'all' ? 'all' : state.status
    });

    if (state.sort === 'oldest') {
      filtered.reverse();
    }

    renderNotifications(filtered);
    updateResultInfo(filtered.length);
  }

  function renderNotifications(notifications) {
    const hasNotifications = state.notifications.length > 0;

    if (!hasNotifications) {
      dom.list.innerHTML = '';
      dom.list.hidden = true;
      dom.noNotificationsState.hidden = false;
      dom.noResultsState.hidden = true;
      updateResultInfo(0);
      return;
    }

    if (!notifications || notifications.length === 0) {
      dom.list.innerHTML = '';
      dom.list.hidden = true;
      dom.noNotificationsState.hidden = true;
      dom.noResultsState.hidden = false;
      updateResultInfo(0, state.notifications.length);
      return;
    }

    dom.noNotificationsState.hidden = true;
    dom.noResultsState.hidden = true;
    dom.list.hidden = false;

    dom.list.innerHTML = notifications.map(renderNotificationCard).join('');

    dom.list.querySelectorAll('.notification-mark-read').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleRead(btn.closest('.notification-card').dataset.notificationId);
      });
    });

    dom.list.querySelectorAll('.notification-card').forEach(card => {
      card.addEventListener('click', () => {
        const relatedId = card.dataset.relatedId;
        const relatedType = card.dataset.relatedType;
        navigateToRelated(relatedId, relatedType);
      });
      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const relatedId = card.dataset.relatedId;
          const relatedType = card.dataset.relatedType;
          navigateToRelated(relatedId, relatedType);
        }
      });
      card.style.cursor = 'pointer';
    });

    initScrollReveal(dom.list);
  }

  function renderNotificationCard(notification) {
    const icon = NOTIFICATION_TYPE_ICONS[notification.type] || NOTIFICATION_TYPE_ICONS.announcement;
    const badgeClass = notification.typeBadge;
    const time = formatNotificationDate(notification.createdAt);
    const isUnread = !notification.read;
    const relatedId = escapeHtml(notification.relatedId || '');
    const relatedType = escapeHtml(notification.relatedType || '');
    const hasRelatedContent = Boolean(relatedId && relatedType);

    return `
      <article class="notification-card ${isUnread ? 'is-unread' : ''}" data-notification-id="${escapeHtml(notification.id)}" data-related-id="${relatedId}" data-related-type="${relatedType}" ${hasRelatedContent ? 'tabindex="0" role="button" aria-label="View related content"' : ''}>
        ${isUnread ? '<span class="notification-unread-dot" aria-hidden="true"></span>' : ''}
        <div class="notification-card-header">
          <span class="notification-icon ${badgeClass}" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              ${icon}
            </svg>
          </span>
          <div class="notification-content">
            <h3 class="notification-title">${escapeHtml(notification.title)}</h3>
            <p class="notification-message">${escapeHtml(notification.message)}</p>
            <div class="notification-meta">
              <span class="notification-meta-item">
                <svg class="notification-meta-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                ${escapeHtml(time)}
              </span>
              <span class="notification-type-badge ${badgeClass}">${escapeHtml(notification.typeLabel)}</span>
            </div>
          </div>
          <div class="notification-actions">
            ${isUnread
              ? `<button type="button" class="btn btn-secondary btn-sm notification-mark-read" aria-label="Mark as read">\n  <span class="btn-text">Mark Read</span>\n</button>`
              : `<button type="button" class="btn btn-secondary btn-sm notification-mark-read" aria-label="Mark as unread">\n  <span class="btn-text">Unread</span>\n</button>`
            }
          </div>
        </div>
      </article>
    `;
  }

  function navigateToRelated(relatedId, relatedType) {
    if (!relatedId || !relatedType) return;

    let url = null;
    switch (relatedType) {
      case 'event':
        url = `event-details.html?id=${encodeURIComponent(relatedId)}`;
        break;
      case 'club':
        url = `club-details.html?id=${encodeURIComponent(relatedId)}`;
        break;
      case 'announcement':
        url = 'announcements.html';
        break;
      default:
        return;
    }

    if (url) {
      window.location.href = url;
    }
  }

  function toggleRead(id) {
    const notification = state.notifications.find(n => n.id === id);
    if (!notification) return;

    if (notification.read) {
      markAsUnread(id);
      showToast('Marked as unread.');
    } else {
      markAsRead(id);
      showToast('Marked as read.');
    }

    state.notifications = getNotifications();
    renderNotificationBadge();
    applyFilters();
  }

  function updateResultInfo(visibleCount, totalCount) {
    if (!dom.resultInfo) return;

    if (state.notifications.length === 0) {
      dom.resultInfo.textContent = '';
      return;
    }

    if (visibleCount === state.notifications.length) {
      dom.resultInfo.innerHTML = `<span class="results-count">${visibleCount}</span> notification${visibleCount === 1 ? '' : 's'}`;
      return;
    }

    const total = totalCount === undefined ? state.notifications.length : totalCount;
    dom.resultInfo.innerHTML = `Showing <span class="results-count">${visibleCount}</span> of ${total} notifications`;
  }

  function uniqueOptions(options) {
    const seen = new Set();

    return options.filter(option => {
      if (!option.value || seen.has(option.value)) return false;
      seen.add(option.value);
      return true;
    }).sort((a, b) => a.label.localeCompare(b.label));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.SCMSNotifications = {
    getUnreadCount,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    renderNotificationBadge,
    getVisibleNotifications: () => state.notifications.slice()
  };
})();

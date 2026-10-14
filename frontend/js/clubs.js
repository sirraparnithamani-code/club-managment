/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - CLUBS PAGE MODULE
 * Page: pages/club.html
 * Handles: Search, Category Filtering, Club Card Rendering
 * ==========================================================================
 */

import { getClubData, getCategories, getCategoryBadgeStyle, filterClubs, toCategorySlug } from './club-data.js';
import { requireStudentSession } from './nav.js';

(function () {
  'use strict';

  if (!requireStudentSession()) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements
  let searchInput = null;
  let searchClearBtn = null;
  let categoryFilterNav = null;
  let clubsGrid = null;
  let emptyState = null;
  let clearFiltersBtn = null;
  let resultsInfo = null;

  // State
  let currentSearchTerm = '';
  let currentCategory = 'all';
  let allClubs = [];

  function init() {
    // Cache DOM elements
    searchInput = document.getElementById('clubSearchInput');
    searchClearBtn = document.getElementById('searchClearBtn');
    categoryFilterNav = document.getElementById('categoryFilterNav');
    clubsGrid = document.getElementById('clubsGrid');
    emptyState = document.getElementById('emptyState');
    clearFiltersBtn = document.getElementById('clearFiltersBtn');
    resultsInfo = document.getElementById('clubsResultsInfo');

    if (!searchInput || !categoryFilterNav || !clubsGrid) {
      console.warn('[Clubs] Required DOM elements not found');
      return;
    }

    // Load club data
    allClubs = getClubData();

    // Render category filters
    renderCategoryFilters();

    // Render initial clubs
    renderClubs(allClubs);
    updateResultsInfo(allClubs.length);

    // Attach event listeners
    attachEventListeners();

    // Check for URL filter param
    checkUrlFilterParam();
  }

  function renderCategoryFilters() {
    const categories = getCategories();
    
    categoryFilterNav.innerHTML = categories.map(cat => `
      <button 
        class="filter-btn ${cat.id === 'all' ? 'is-active' : ''}" 
        data-filter="${cat.id}"
        role="tab" 
        aria-selected="${cat.id === 'all'}"
        aria-controls="clubsGrid"
      >
        ${cat.label} <span class="filter-count">(${cat.count})</span>
      </button>
    `).join('');
  }

  function renderClubs(clubs) {
    if (clubs.length === 0) {
      clubsGrid.innerHTML = '';
      clubsGrid.hidden = true;
      emptyState.hidden = false;
      return;
    }

    emptyState.hidden = true;
    clubsGrid.hidden = false;

    clubsGrid.innerHTML = clubs.map(club => {
      const badgeStyle = getCategoryBadgeStyle(club.category);
      const categorySlug = toCategorySlug(club.category);
      
      return `
        <article class="club-card reveal-on-scroll" data-category="${categorySlug}" role="listitem">
          <div class="club-card-top">
            <div class="club-icon-wrapper" aria-hidden="true">${club.icon}</div>
            <span class="club-category-badge" style="
              background-color: ${badgeStyle.bg};
              color: ${badgeStyle.text};
              border-color: ${badgeStyle.border};
            ">${club.category}</span>
          </div>
          <h3 class="club-title">${club.name}</h3>
          <p class="club-desc">${club.description}</p>
          <div class="club-card-footer">
            <span class="club-meta-tag">${club.members} members</span>
            <button type="button" class="club-view-btn" data-club-id="${club.id}" aria-label="View ${club.name} details">
              <span>View Club</span>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </article>
      `;
    }).join('');

    // Re-observe for scroll reveal
    initScrollReveal();

    // Attach view button listeners
    attachViewButtonListeners();
  }

  function attachViewButtonListeners() {
    const viewButtons = clubsGrid.querySelectorAll('.club-view-btn');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const clubId = btn.getAttribute('data-club-id');
        
        // Tactile press response
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
          btn.style.transform = '';
        }, 150);

        // Navigate to club details page
        window.location.href = `club-details.html?id=${clubId}`;
      });
    });
  }

  function filterAndRender() {
    const filtered = filterClubs(currentSearchTerm, currentCategory);
    renderClubs(filtered);
    updateResultsInfo(filtered.length, allClubs.length);
  }

  function updateResultsInfo(visibleCount, totalCount) {
    if (!resultsInfo) return;
    
    if (visibleCount === totalCount && currentSearchTerm === '' && currentCategory === 'all') {
      resultsInfo.textContent = `${visibleCount} clubs`;
    } else {
      resultsInfo.innerHTML = `Showing <span class="results-count">${visibleCount}</span> of ${totalCount} clubs`;
    }
  }

  function attachEventListeners() {
    // Search input
    searchInput.addEventListener('input', debounce(() => {
      currentSearchTerm = searchInput.value.trim();
      searchClearBtn.hidden = currentSearchTerm === '';
      filterAndRender();
    }, 150));

    // Search clear button
    searchClearBtn.addEventListener('click', () => {
      searchInput.value = '';
      currentSearchTerm = '';
      searchClearBtn.hidden = true;
      searchInput.focus();
      filterAndRender();
    });

    // Category filter buttons
    categoryFilterNav.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;

      const filterVal = btn.getAttribute('data-filter');
      if (!filterVal) return;

      // Update button states
      categoryFilterNav.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');

      currentCategory = filterVal;
      filterAndRender();
    });

    // Clear filters button
    clearFiltersBtn.addEventListener('click', () => {
      // Reset search
      searchInput.value = '';
      currentSearchTerm = '';
      searchClearBtn.hidden = true;

      // Reset category
      currentCategory = 'all';
      categoryFilterNav.querySelectorAll('.filter-btn').forEach(b => {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      const allBtn = categoryFilterNav.querySelector('[data-filter="all"]');
      if (allBtn) {
        allBtn.classList.add('is-active');
        allBtn.setAttribute('aria-selected', 'true');
      }

      filterAndRender();
      searchInput.focus();
    });

    // Keyboard navigation for filter buttons
    categoryFilterNav.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const buttons = Array.from(categoryFilterNav.querySelectorAll('.filter-btn'));
        const activeIndex = buttons.findIndex(b => b.classList.contains('is-active'));
        let nextIndex = activeIndex + (e.key === 'ArrowRight' ? 1 : -1);
        
        if (nextIndex >= buttons.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = buttons.length - 1;
        
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      }
    });
  }

  function checkUrlFilterParam() {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    
    if (filterParam) {
      const validCategories = getCategories().map(c => c.id);
      if (validCategories.includes(filterParam)) {
        currentCategory = filterParam;
        
        // Update UI
        categoryFilterNav.querySelectorAll('.filter-btn').forEach(b => {
          b.classList.remove('is-active');
          b.setAttribute('aria-selected', 'false');
        });
        const targetBtn = categoryFilterNav.querySelector(`[data-filter="${filterParam}"]`);
        if (targetBtn) {
          targetBtn.classList.add('is-active');
          targetBtn.setAttribute('aria-selected', 'true');
        }
        
        filterAndRender();
      }
    }
  }

  function initScrollReveal() {
    const revealElements = clubsGrid.querySelectorAll('.reveal-on-scroll');
    
    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      revealElements.forEach(el => el.classList.add('is-visible'));
      return;
    }

    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
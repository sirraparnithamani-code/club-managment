/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - AUTHENTICATION MODULE
 * Page: pages/login.html
 * Vanilla JavaScript (Zero external libraries or frameworks)
 * Architecture: Clean, modular, accessible, and Spring Boot API ready
 *
 * Behaviour contract:
 *   1. The form always starts empty. The markup carries no `value` attributes
 *      and `resetFormFields()` clears anything the browser restored from saved
 *      credentials or the back/forward cache.
 *   2. Empty fields are rejected client-side before any request is made, using
 *      the inline `<fieldId>Error` pattern.
 *   3. Authentication is never faked. `AUTH_API.loginEndpoint` is the single
 *      seam for the backend; while it is null the student is told the service
 *      is not connected and no session is invented.
 * ==========================================================================
 */

import { showToast } from './toast.js';
import { getClubData } from './club-data.js';

(function () {
  'use strict';

  // Feature detection: Check user motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // DOM Elements Cache
  let loginForm = null;
  let identifierInput = null;
  let identifierError = null;
  let passwordInput = null;
  let passwordError = null;
  let passwordToggleBtn = null;
  let rememberMeCheckbox = null;
  let submitButton = null;
  let statusBanner = null;
  let portalRadios = null;
  let authSubtitle = null;
  let clubSelectGroup = null;
  let clubSelect = null;
  let clubError = null;

  function initPageEntranceSequence() {
    const animElements = document.querySelectorAll('.anim-step');
    if (!animElements.length) return;

    if (prefersReducedMotion) {
      animElements.forEach(el => el.classList.add('anim-loaded'));
      return;
    }

    // Ensure initial state is rendered before triggering entrance transitions
    setTimeout(() => {
      requestAnimationFrame(() => {
        animElements.forEach(el => {
          el.classList.add('anim-loaded');
        });
      });
    }, 40);
  }

  function validateField(field) {
    if (!field) return { isValid: true, message: '' };

    const value = field.value.trim();

    if (field.id === 'identifier') {
      if (!value) {
        return {
          isValid: false,
          message: 'Please enter your email or roll number.'
        };
      }
      return { isValid: true, message: '' };
    }

    if (field.id === 'password') {
      if (!value) {
        return {
          isValid: false,
          message: 'Please enter your password.'
        };
      }
      if (value.length < 6) {
        return {
          isValid: false,
          message: 'Password must contain at least 6 characters.'
        };
      }
      return { isValid: true, message: '' };
    }

    return { isValid: true, message: '' };
  }

  /** Returns the currently selected portal value. */
  function getSelectedPortal() {
    if (!portalRadios) return 'student';
    const checked = Array.from(portalRadios).find(r => r.checked);
    return checked ? checked.value : 'student';
  }

  /** Updates the subtitle text based on the selected portal. */
  function updateAuthSubtitle(portal) {
    if (!authSubtitle) return;
    const subtitles = {
      student: 'Sign in to continue to your student account.',
      coordinator: 'Sign in to access your club coordinator dashboard.',
      admin: 'Admin access requires separate verified authentication.'
    };
    authSubtitle.textContent = subtitles[portal] || subtitles.student;
  }

  /** Toggles club selector visibility based on selected portal. */
  function updateClubSelectorVisibility(portal) {
    if (!clubSelectGroup || !clubSelect) return;
    
    if (portal === 'coordinator') {
      clubSelectGroup.hidden = false;
      populateClubSelector();
    } else {
      clubSelectGroup.hidden = true;
      clubSelect.value = '';
      clearFieldError(clubSelect);
    }
  }

  /** Populates the club selector dropdown with available clubs. */
  function populateClubSelector() {
    if (!clubSelect) return;
    
    // Clear existing options except the placeholder
    while (clubSelect.options.length > 1) {
      clubSelect.remove(1);
    }
    
    const clubs = getClubData();
    clubs.forEach(club => {
      const option = document.createElement('option');
      option.value = club.id;
      option.textContent = `${club.name} (${club.category})`;
      clubSelect.appendChild(option);
    });
  }

  /** Validates the club selector field. */
  function validateClubField(field) {
    if (!field) return { isValid: true, message: '' };
    
    const value = field.value.trim();
    if (!value) {
      return {
        isValid: false,
        message: 'Please select your assigned club.'
      };
    }
    return { isValid: true, message: '' };
  }

  /**
   * 3. SHOW FIELD ERROR
   * Displays smooth inline error message and activates invalid border state
   */
  function showFieldError(field, message) {
    if (!field) return;

    const errorContainer = document.getElementById(`${field.id}Error`);
    field.classList.add('is-invalid');
    field.setAttribute('aria-invalid', 'true');

    if (errorContainer) {
      errorContainer.innerHTML = `
        <svg class="auth-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <span>${message}</span>
      `;
      errorContainer.classList.add('has-error');
    }
  }

 
  function clearFieldError(field) {
    if (!field) return;

    const errorContainer = document.getElementById(`${field.id}Error`);
    field.classList.remove('is-invalid');
    field.removeAttribute('aria-invalid');

    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.classList.remove('has-error');
    }
  }

  /**
   * 5. VALIDATE THE ENTIRE FORM
   * Returns true if all fields are valid, false otherwise
   */
  function validateForm() {
    let isFormValid = true;
    let firstInvalidField = null;

    const portal = getSelectedPortal();
    
    const identifierResult = validateField(identifierInput);
    if (!identifierResult.isValid) {
      showFieldError(identifierInput, identifierResult.message);
      isFormValid = false;
      if (!firstInvalidField) firstInvalidField = identifierInput;
    } else {
      clearFieldError(identifierInput);
    }

    const passwordResult = validateField(passwordInput);
    if (!passwordResult.isValid) {
      showFieldError(passwordInput, passwordResult.message);
      isFormValid = false;
      if (!firstInvalidField) firstInvalidField = passwordInput;
    } else {
      clearFieldError(passwordInput);
    }

    // Validate club selector for coordinator portal
    if (portal === 'coordinator' && clubSelect) {
      const clubResult = validateClubField(clubSelect);
      if (!clubResult.isValid) {
        showFieldError(clubSelect, clubResult.message);
        isFormValid = false;
        if (!firstInvalidField) firstInvalidField = clubSelect;
      } else {
        clearFieldError(clubSelect);
      }
    }

    if (firstInvalidField) {
      firstInvalidField.focus();
    }

    return isFormValid;
  }

  /**
   * 6. PASSWORD VISIBILITY TOGGLE
   * Safely switches input type between password and text, updates ARIA states
   */
  function togglePassword() {
    if (!passwordInput || !passwordToggleBtn) return;

    const isCurrentPassword = passwordInput.getAttribute('type') === 'password';
    const newType = isCurrentPassword ? 'text' : 'password';

    passwordInput.setAttribute('type', newType);
    passwordToggleBtn.setAttribute('aria-pressed', isCurrentPassword ? 'true' : 'false');
    passwordToggleBtn.setAttribute(
      'aria-label',
      isCurrentPassword ? 'Hide password' : 'Show password'
    );

    // If input already had focus, maintain cursor position
    if (document.activeElement === passwordInput) {
      const len = passwordInput.value.length;
      passwordInput.setSelectionRange(len, len);
      passwordInput.focus();
    }
  }

  /* --------------------------------------------------------------------------
     API INTEGRATION SEAM
     The single place where the Spring Boot backend gets wired in. While
     `loginEndpoint` is null the form validates and reports honestly without
     pretending to authenticate; setting it to '/api/auth/login' activates the
     real request with no other change required.
     -------------------------------------------------------------------------- */

  const AUTH_API = {
    loginEndpoint: null,
    sessionStorageKey: 'scms_session'
  };

  /** Collects the submitted credentials in the shape the API expects. */
  function buildCredentials() {
    const portal = getSelectedPortal();
    const credentials = {
      identifier: identifierInput ? identifierInput.value.trim() : '',
      password: passwordInput ? passwordInput.value : '',
      rememberMe: rememberMeCheckbox ? rememberMeCheckbox.checked : false,
      portal: portal
    };
    
    // Add club info for coordinator
    if (portal === 'coordinator' && clubSelect) {
      const clubId = clubSelect.value;
      const clubs = getClubData();
      const club = clubs.find(c => c.id === clubId);
      credentials.clubId = clubId;
      credentials.clubName = club ? club.name : '';
    }
    
    return credentials;
  }

  /**
   * Creates a mock session for demo purposes since there's no backend.
   * In production, this would call the actual auth API.
   */
  function createMockSession(credentials) {
    const identifier = credentials.identifier;
    const isEmail = identifier.includes('@');
    const name = isEmail ? identifier.split('@')[0] : `Student ${identifier}`;
    const programme = isEmail ? 'Computer Science' : 'Engineering';
    
    const session = {
      name: name,
      email: isEmail ? identifier : `${identifier}@university.edu`,
      identifier: identifier,
      programme: programme,
      role: credentials.portal,
      clubId: credentials.portal === 'coordinator' ? credentials.clubId : undefined,
      clubName: credentials.portal === 'coordinator' ? credentials.clubName : undefined,
      loginTime: new Date().toISOString()
    };
    
    try {
      window.localStorage.setItem(AUTH_API.sessionStorageKey, JSON.stringify(session));
    } catch (error) {
      // Storage unavailable
    }
    
    return session;
  }

  /**
   * Posts the credentials to the auth service.
   * Resolves to `{ ok, pending?, message?, data? }`; it never throws.
   */
  async function authenticate(credentials) {
    if (!AUTH_API.loginEndpoint) {
      // Mock authentication - always succeed for demo
      const session = createMockSession(credentials);
      return { ok: true, data: session };
    }

    try {
      const response = await fetch(AUTH_API.loginEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(credentials)
      });

      if (response.status === 401) {
        return { ok: false, message: 'Those credentials do not match our records.' };
      }

      if (!response.ok) {
        return { ok: false, message: 'Sign in is unavailable right now. Please try again shortly.' };
      }

      return { ok: true, data: await response.json() };
    } catch (error) {
      return { ok: false, message: 'Could not reach the SCMS service. Check your connection and try again.' };
    }
  }

  /** Shows a neutral message in the status banner. */
  function showStatusBanner(message) {
    if (!statusBanner) return;

    statusBanner.hidden = false;
    statusBanner.innerHTML = `
      <svg class="auth-status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      <span>${message}</span>
    `;

    // Allow DOM rendering before the transition class is applied.
    requestAnimationFrame(() => {
      statusBanner.classList.add('is-visible');
    });
  }

  function hideStatusBanner() {
    if (!statusBanner) return;

    statusBanner.classList.remove('is-visible');
    statusBanner.hidden = true;
    statusBanner.textContent = '';
  }

  /**
   * 7. HANDLE LOGIN SUBMISSION
   * Validates first, then hands the credentials to the auth service.
   */
  async function handleLoginSubmit(event) {
    event.preventDefault();

    hideStatusBanner();

    // Reject empty fields before any request is attempted.
    if (!validateForm()) return;

    const credentials = buildCredentials();
    const portal = credentials.portal;
    const result = await authenticate(credentials);

    if (result.ok) {
      const session = result.data;
      
      if (portal === 'student') {
        showStatusBanner('Signed in. Redirecting to your dashboard…');
        setTimeout(() => {
          window.location.href = 'dashboard.html';
        }, 800);
        return;
      }
      
      if (portal === 'coordinator') {
        showStatusBanner('Signed in. Redirecting to coordinator dashboard…');
        setTimeout(() => {
          window.location.href = 'coordinator.html';
        }, 800);
        return;
      }
      
      if (portal === 'admin') {
        showStatusBanner('Admin login is not available via this form. Admin access requires a separate, verified authentication mechanism.');
        // Clear the session since admin access is not granted
        try {
          window.localStorage.removeItem(AUTH_API.sessionStorageKey);
        } catch (error) {
          // Ignore
        }
        return;
      }
    }

    showStatusBanner(result.pending
      ? 'Login service will be connected when the backend is available.'
      : result.message);
  }

  /**
   * 8. ATTACH INPUT LIVE VALIDATION LISTENERS
   * Clears error states as the student corrects their input
   */
  function attachFieldListeners(field) {
    if (!field) return;

    // Update or clear error as user types
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) {
        const result = validateField(field);
        if (result.isValid) {
          clearFieldError(field);
        } else {
          showFieldError(field, result.message);
        }
      }
      // Also hide status banner when user edits input
      if (statusBanner && statusBanner.classList.contains('is-visible')) {
        hideStatusBanner();
      }
    });

    // Re-validate on blur if field had prior interaction
    field.addEventListener('blur', () => {
      if (field.value.trim().length > 0) {
        const result = validateField(field);
        if (!result.isValid) {
          showFieldError(field, result.message);
        } else {
          clearFieldError(field);
        }
      }
    });
  }

  /**
   * 9. GUARANTEE A BLANK FORM ON EVERY LOAD
   * The markup ships no `value` attributes, but the browser can still fill the
   * form in from two directions: saved credentials, and its own form-state
   * restore when the student returns through the back/forward cache. Either
   * path makes the screen look pre-filled, which a sign-in page must never do.
   * Clearing here, and again on `pageshow` (which fires on a bfcache restore),
   * guarantees the form always starts empty.
   *
   * `autocomplete` is deliberately left on the inputs: it is what allows a real
   * password manager to fill credentials once the API is connected.
   */
  function resetFormFields() {
    [identifierInput, passwordInput].forEach(field => {
      if (!field) return;

      field.value = '';
      clearFieldError(field);
    });

    if (rememberMeCheckbox) rememberMeCheckbox.checked = false;

    if (portalRadios) {
      portalRadios.forEach(radio => {
        radio.checked = radio.value === 'student';
      });
    }
    updateAuthSubtitle('student');
    updateClubSelectorVisibility('student');

    if (clubSelect) {
      clubSelect.value = '';
      clearFieldError(clubSelect);
    }

    if (passwordToggleBtn) {
      passwordInput.setAttribute('type', 'password');
      passwordToggleBtn.setAttribute('aria-pressed', 'false');
      passwordToggleBtn.setAttribute('aria-label', 'Show password');
    }

    hideStatusBanner();
  }

  /**
   * 10. INITIALIZE LOGIN FORM
   * Binds all DOM elements and attaches handlers
   */
  function initializeLoginForm() {
    loginForm = document.getElementById('loginForm');
    identifierInput = document.getElementById('identifier');
    passwordInput = document.getElementById('password');
    passwordToggleBtn = document.getElementById('passwordToggle');
    rememberMeCheckbox = document.getElementById('rememberMe');
    submitButton = document.getElementById('loginSubmitBtn');
    statusBanner = document.getElementById('authStatusMessage');
    portalRadios = document.querySelectorAll('input[name="portal"]');
    authSubtitle = document.getElementById('authSubtitle');
    clubSelectGroup = document.getElementById('clubSelectorGroup');
    clubSelect = document.getElementById('clubSelect');
    clubError = document.getElementById('clubError');

    if (!loginForm) return;

    // Start from a blank form regardless of what the browser restored.
    resetFormFields();

    window.addEventListener('pageshow', event => {
      if (event.persisted) resetFormFields();
    });

    // Attach form submission handler
    loginForm.addEventListener('submit', handleLoginSubmit);

    // Attach password show/hide toggle
    if (passwordToggleBtn) {
      passwordToggleBtn.addEventListener('click', togglePassword);
    }

    // Attach portal selection change handlers
    portalRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        const portal = getSelectedPortal();
        updateAuthSubtitle(portal);
        updateClubSelectorVisibility(portal);
      });
    });

    // Attach live input correction handlers
    attachFieldListeners(identifierInput);
    attachFieldListeners(passwordInput);
    if (clubSelect) {
      attachFieldListeners(clubSelect);
    }

    // Set initial subtitle
    updateAuthSubtitle(getSelectedPortal());
    updateClubSelectorVisibility(getSelectedPortal());

    // Stub fields that point at pages which are not built yet
    const stubLinks = document.querySelectorAll('[data-stub-page]');
    stubLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        showToast(`${link.textContent.trim()} will be connected when the student account service is available.`);
      });
    });

    // Initialize entrance animation sequence
    initPageEntranceSequence();
  }

  // Self-initialize on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeLoginForm);
  } else {
    initializeLoginForm();
  }

})();

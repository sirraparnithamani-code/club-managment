/**
 * ==========================================================================
 * STUDENT CLUB MANAGEMENT SYSTEM (SCMS) - SHARED TOAST NOTIFICATION
 * ==========================================================================
 * One implementation, one timer, one DOM node (#scmsToast) for the whole
 * application. Every module imports `showToast` instead of building its own
 * copy, which previously produced four near-identical functions with
 * conflicting timers and z-index values.
 * ==========================================================================
 */

const TOAST_DURATION = 3800;

let hideTimer = null;

export function showToast(message) {
  if (!message) return;

  const toast = ensureToastElement();

  toast.textContent = message;
  toast.style.opacity = '1';
  toast.style.transform = 'translateY(0)';

  if (hideTimer) clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(12px)';
  }, TOAST_DURATION);
}

function ensureToastElement() {
  let toast = document.getElementById('scmsToast');

  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'scmsToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');

    // Styled inline so the toast never depends on which page stylesheet loaded.
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      maxWidth: 'min(380px, calc(100vw - 48px))',
      padding: '14px 20px',
      borderRadius: 'var(--radius-md, 10px)',
      backgroundColor: 'var(--bg-card, #FFFFFF)',
      color: 'var(--text-primary, #442A20)',
      border: '1px solid var(--accent-primary-border, rgba(125, 91, 144, 0.28))',
      boxShadow: 'var(--shadow-lg, 0 10px 28px rgba(68, 42, 32, 0.07))',
      fontSize: '0.875rem',
      lineHeight: '1.5',
      zIndex: '2000',
      opacity: '0',
      transform: 'translateY(12px)',
      transition: 'opacity 250ms var(--ease-natural, ease), transform 250ms var(--ease-natural, ease)',
      pointerEvents: 'none'
    });

    document.body.appendChild(toast);
  }

  return toast;
}
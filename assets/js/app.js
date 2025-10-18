const focusableSelectors = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

document.addEventListener('DOMContentLoaded', () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const navLinks = document.querySelectorAll('a.nav-link');
  const currentPath = window.location.pathname.replace(/index\.html$/, '');

  navLinks.forEach((link) => {
    const linkPath = new URL(link.href).pathname.replace(/index\.html$/, '');
    if (linkPath === currentPath || (currentPath === '/' && linkPath === '/')) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });

  initMobileNav();
  initReveals(prefersReducedMotion);
  initParallax(prefersReducedMotion);
  initCounters(prefersReducedMotion);
  initForms();

  console.info('SalvationThroughJesus app initialized');
});

function initMobileNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!navToggle || !mobileNav) return;

  let previousFocusedElement = null;

  const closeButton = mobileNav.querySelector('[data-close-nav]');
  const navLinks = mobileNav.querySelectorAll('a');

  const openNav = () => {
    previousFocusedElement = document.activeElement;
    mobileNav.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    const firstFocusable = mobileNav.querySelector(focusableSelectors);
    firstFocusable?.focus();
    mobileNav.addEventListener('keydown', handleTrap);
  };

  const closeNav = () => {
    mobileNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    mobileNav.removeEventListener('keydown', handleTrap);
    previousFocusedElement?.focus();
  };

  const handleTrap = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeNav();
      return;
    }
    if (event.key !== 'Tab') return;

    const focusable = mobileNav.querySelectorAll(focusableSelectors);
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  navToggle.addEventListener('click', () => {
    const isOpen = mobileNav.classList.contains('open');
    if (isOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  mobileNav.addEventListener('click', (event) => {
    if (event.target === mobileNav) {
      closeNav();
    }
  });

  closeButton?.addEventListener('click', () => closeNav());
  navLinks.forEach((link) => link.addEventListener('click', () => closeNav()));
}

function initParallax(prefersReducedMotion) {
  if (prefersReducedMotion) return;
  const hero = document.querySelector('[data-parallax-hero]');
  if (!hero) return;

  let ticking = false;

  const updateParallax = () => {
    const rect = hero.getBoundingClientRect();
    const offset = Math.max(0, -rect.top);
    const clamped = Math.min(offset, 360);
    hero.style.setProperty('--parallax-offset', `${clamped}px`);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateParallax);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallax();
}

function initReveals(prefersReducedMotion) {
  const revealElements = document.querySelectorAll('.reveal-up, .reveal-hidden, .reveal-fade');
  if (!revealElements.length) return;

  if (prefersReducedMotion) {
    revealElements.forEach((el) => el.classList.add('reveal-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  revealElements.forEach((el) => observer.observe(el));
}

async function initCounters(prefersReducedMotion) {
  const counterContainers = document.querySelectorAll('[data-counter-container]');
  if (!counterContainers.length) return;

  try {
    const response = await fetch('/data/impact.json', { cache: 'no-cache' });
    if (!response.ok) throw new Error('Failed to load impact data');
    const data = await response.json();

    const applyData = () => {
      const counterElements = document.querySelectorAll('[data-counter-target]');
      counterElements.forEach((el) => {
        const key = el.getAttribute('data-counter-target');
        const value = Number(data[key]) || 0;
        if (prefersReducedMotion) {
          el.textContent = value.toLocaleString();
        } else {
          animateCount(el, value);
        }
      });

      const lastUpdatedEl = document.querySelectorAll('[data-impact-updated]');
      lastUpdatedEl.forEach((el) => {
        if (data.lastUpdated) {
          const date = new Date(data.lastUpdated);
          const formatted = Number.isNaN(date.getTime()) ? data.lastUpdated : date.toLocaleDateString();
          el.textContent = `Last updated: ${formatted}`;
        }
      });
    };

    if (prefersReducedMotion) {
      applyData();
      return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          applyData();
          obs.disconnect();
        }
      });
    }, { threshold: 0.3 });

    counterContainers.forEach((container) => observer.observe(container));
  } catch (error) {
    console.error(error);
  }
}

function animateCount(element, target) {
  const duration = 2200;
  const start = performance.now();
  const initial = 0;

  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeOutQuad(progress);
    const value = Math.floor(initial + (target - initial) * eased);
    element.textContent = value.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = target.toLocaleString();
    }
  };

  requestAnimationFrame(step);
}

function easeOutQuad(t) {
  return t * (2 - t);
}

function initForms() {
  const forms = document.querySelectorAll('form[data-enhanced="true"]');
  if (!forms.length) return;

  forms.forEach((form) => {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      showToast('Thanks — we\'ll be in touch.');
      form.reset();
    });
  });
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2600);
}

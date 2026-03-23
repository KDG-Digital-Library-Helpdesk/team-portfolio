'use strict';

// KdG Library Helpdesk, Portfolio Site JS
// All interactivity in one file, no dependencies.

// Helpers
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];


// 1. READING PROGRESS BAR
function initProgressBar() {
  const bar = $('#reading-progress');
  if (!bar) return;

  const update = () => {
    const scrollTop  = window.scrollY;
    const docHeight  = document.body.scrollHeight - window.innerHeight;
    const pct        = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    bar.style.width  = `${Math.min(pct, 100).toFixed(1)}%`;
    bar.setAttribute('aria-valuenow', Math.round(pct));
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}


// 2. HEADER SHRINK
function initHeaderShrink() {
  const header = $('#site-header');
  if (!header) return;

  const update = () => {
    header.classList.toggle('scrolled', window.scrollY > 80);
  };

  window.addEventListener('scroll', update, { passive: true });
  update();
}


// 3. HAMBURGER NAV
function initHamburger() {
  const toggle = $('#nav-toggle');
  const nav    = $('#main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    nav.classList.toggle('is-open', !isOpen);
  });

  // Close nav when a link is clicked (mobile UX)
  $$('.nav-link', nav).forEach(link => {
    link.addEventListener('click', () => {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    });
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !toggle.contains(e.target)) {
      toggle.setAttribute('aria-expanded', 'false');
      nav.classList.remove('is-open');
    }
  });
}


// 4. DARK MODE TOGGLE
function initThemeToggle() {
  const toggle = $('#theme-toggle');
  if (!toggle) return;

  const STORAGE_KEY = 'kdg-theme';

  // Respect prefers-color-scheme on first visit
  const saved = localStorage.getItem(STORAGE_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = saved ?? (prefersDark ? 'dark' : 'light');

  document.documentElement.setAttribute('data-theme', initial);

  toggle.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem(STORAGE_KEY, next);
  });
}


// 5. SCROLL REVEAL
function initScrollReveal() {
  const els = $$('[data-reveal]');
  if (!els.length) return;

  // Stagger items in the same parent grid
  const grids = $$('.team-grid');
  grids.forEach(grid => {
    $$('[data-reveal]', grid).forEach((card, i) => {
      card.style.transitionDelay = `${i * 100}ms`;
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
  );

  els.forEach(el => observer.observe(el));
}


// 6. SIDE NAV ACTIVE DOTS
function initSideNav() {
  const dots    = $$('.nav-dot');
  const sections = $$('section[id]');
  if (!dots.length || !sections.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          dots.forEach(dot => {
            const isActive = dot.getAttribute('href') === `#${id}`;
            dot.classList.toggle('active', isActive);
          });
        }
      });
    },
    { threshold: 0.5, rootMargin: `-${getHeaderHeight()}px 0px 0px 0px` }
  );

  sections.forEach(s => observer.observe(s));
}


// 7. TEAM CARD FLIP (mobile tap)
function initCardFlip() {
  const cards = $$('.team-card');
  if (!cards.length) return;

  const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  cards.forEach(card => {
    // On hover devices (desktop), CSS :hover handles the flip — JS click should do nothing
    // On touch devices (mobile), toggle is-flipped on tap
    if (!isHoverDevice) {
      card.addEventListener('click', () => {
        card.classList.toggle('is-flipped');
      });

      // Prevent LinkedIn link clicks from bubbling up and toggling the flip
      card.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => e.stopPropagation());
      });
    }

    // Allow keyboard flip on both device types
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        card.classList.toggle('is-flipped');
      }
      if (e.key === 'Escape') {
        card.classList.remove('is-flipped');
      }
    });
  });
}


// 8. BOOK SPINE GENERATOR
function initBookSpines() {
  const container = $('#book-spines');
  if (!container) return;

  const palette = [
    '#8B4513', '#C68642', '#2C5F2E', '#4A3728',
    '#7A5C2E', '#556B2F', '#8B6914', '#5C3317',
    '#6B4226', '#9C6B2E', '#3D5A3E', '#7A4A1E',
  ];

  const COUNT = 28;

  for (let i = 0; i < COUNT; i++) {
    const spine  = document.createElement('div');
    const color  = palette[i % palette.length];
    const width  = 18 + (i % 5) * 8;               // 18, 26, 34, 42, 50 px
    const height = 55 + ((i * 7 + 13) % 40);        // deterministic 55–94 px

    spine.className = 'spine';
    spine.style.cssText = [
      `width: ${width}px`,
      `height: ${height}px`,
      `background: ${color}`,
      `opacity: ${0.75 + (i % 4) * 0.07}`,
      `border-left: 1px solid rgba(255,255,255,0.15)`,
    ].join(';');

    container.appendChild(spine);
  }
}


// 9. PDF FALLBACK (Google Docs viewer)
function initPdfFallback() {
  // Handles all PDF iframes on the page
  // After deployment, swap each iframe's src to Google Docs viewer (see README).
  const iframes = $$('#pdf-viewer, #article-pdf-viewer, #prototype-doc-viewer, #user-guide-viewer');

  iframes.forEach(iframe => {
    iframe.addEventListener('error', () => {
      const container = iframe.closest('.slides-viewer');
      if (!container) return;
      container.innerHTML = `
        <div style="display:flex;align-items:center;justify-content:center;height:100%;
                    font-family:var(--font-body);color:var(--color-ink-muted);
                    text-align:center;padding:2rem;flex-direction:column;gap:1rem;">
          <p style="font-size:1rem;">
            PDF viewer unavailable. Use the Download button above.
          </p>
        </div>`;
    });
  });
}


// 10. SMOOTH SCROLL WITH HEADER OFFSET
function getHeaderHeight() {
  const header = $('#site-header');
  return header ? header.offsetHeight : 64;
}

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const target = $(anchor.getAttribute('href'));
      if (!target) return;

      e.preventDefault();
      const top = target.getBoundingClientRect().top + window.scrollY - getHeaderHeight() - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}


// INIT
document.addEventListener('DOMContentLoaded', () => {
  initProgressBar();
  initHeaderShrink();
  initHamburger();
  initThemeToggle();
  initScrollReveal();
  initSideNav();
  initCardFlip();
  initBookSpines();
  initPdfFallback();
  initSmoothScroll();
});

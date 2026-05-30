// ─── HDC Training & Consultancy ─────────────────────────────────────

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Mark sections for scroll-reveal (skipped under reduced-motion — CSS already neutralises)
const revealTargets = document.querySelectorAll(
  '.pillar, .feature-card, .rail__item, .voice, .case, .biblio__item, .clients__col, .hero__meta-item, .track__stage, .proc-fact'
);

if (!prefersReducedMotion) {
  revealTargets.forEach((el, i) => {
    el.classList.add('in-view');
    el.style.transitionDelay = `${(i % 6) * 45}ms`;
  });

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
  );
  revealTargets.forEach((el) => io.observe(el));
}

// Contact form — POSTs to /api/contact which forwards to GoHighLevel
const contactForm = document.getElementById('contact-form');
if (contactForm) {
  const statusEl = contactForm.querySelector('.contact-form__status');
  const submitBtn = contactForm.querySelector('.contact-form__submit');
  const submitLabel = submitBtn ? submitBtn.querySelector('span') : null;
  const originalLabel = submitLabel ? submitLabel.textContent : 'Send message';

  const setStatus = (message, kind) => {
    statusEl.textContent = message || '';
    statusEl.classList.remove('is-success', 'is-error');
    if (kind) statusEl.classList.add(`is-${kind}`);
  };

  contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (contactForm.classList.contains('is-success')) return;

    setStatus('', null);

    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());

    // Quick client-side validation (server validates too)
    if (!payload.name || !payload.email || !payload.message) {
      setStatus('Please fill in your name, email, and message.', 'error');
      return;
    }

    submitBtn.disabled = true;
    if (submitLabel) submitLabel.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setStatus('Thank you — Helen will be in touch within 48 hours.', 'success');
        contactForm.classList.add('is-success');
      } else {
        setStatus(data.error || 'Something went wrong. Please email info@hdconsultants.org.uk.', 'error');
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = originalLabel;
      }
    } catch (err) {
      console.error(err);
      setStatus('Network error. Please email info@hdconsultants.org.uk.', 'error');
      submitBtn.disabled = false;
      if (submitLabel) submitLabel.textContent = originalLabel;
    }
  });
}

// Hide mobile bottom CTA bar when contact section is in view (avoids duplicate CTAs)
const mobileCta = document.querySelector('.mobile-cta');
const contactSection = document.getElementById('contact');
if (mobileCta && contactSection && 'IntersectionObserver' in window) {
  const ctaObserver = new IntersectionObserver(
    ([entry]) => {
      mobileCta.classList.toggle('is-hidden', entry.isIntersecting);
    },
    { rootMargin: '0px 0px -20% 0px', threshold: 0.05 }
  );
  ctaObserver.observe(contactSection);
}

// Mobile nav drawer
const navToggle = document.querySelector('.nav-toggle');
const mobileNav = document.getElementById('mobile-nav');

if (navToggle && mobileNav) {
  const setOpen = (open) => {
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    mobileNav.classList.toggle('is-open', open);
    mobileNav.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('nav-open', open);
  };

  navToggle.addEventListener('click', () => {
    const isOpen = navToggle.getAttribute('aria-expanded') === 'true';
    setOpen(!isOpen);
  });

  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setOpen(false));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      navToggle.focus();
    }
  });
}

// Header shadow on scroll (toggle via class — avoid layout thrash)
const masthead = document.querySelector('.masthead');
if (masthead) {
  const onScroll = () => {
    masthead.classList.toggle('is-scrolled', window.scrollY > 8);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

// Smooth anchor scrolling is handled by CSS (scroll-behavior + scroll-margin-top).
// Keep the same handler so reduced-motion users get instant jumps.
if (prefersReducedMotion) {
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'auto', block: 'start' });
    });
  });
}

// ─── HDC Training & Consultancy ─────────────────────────────────────

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Footer year
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Scroll-reveal — deliberately restrained. The $10K test: this should
// feel like content settling into place, not AOS-fade-up sprayed
// everywhere. Only section heads (where the §-chip lives) and hero meta
// get the treatment — every list-item card animating in is slop.
const revealTargets = document.querySelectorAll('.section-head, .hero__meta-item');

if (!prefersReducedMotion) {
  revealTargets.forEach((el, i) => {
    el.classList.add('in-view');
    // Stagger only the hero meta trio; section heads animate as one.
    if (el.classList.contains('hero__meta-item')) {
      el.style.transitionDelay = `${i * 80}ms`;
    }
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
    { rootMargin: '0px 0px -12% 0px', threshold: 0.12 }
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

// Header shadow on scroll + scroll-progress hairline.
// Both update on the same scroll tick to avoid duplicate work.
const masthead = document.querySelector('.masthead');
const progressBar = document.querySelector('.scroll-progress__bar');
if (masthead || progressBar) {
  const docEl = document.documentElement;
  let ticking = false;
  const update = () => {
    if (masthead) {
      masthead.classList.toggle('is-scrolled', window.scrollY > 8);
    }
    if (progressBar) {
      const total = docEl.scrollHeight - docEl.clientHeight;
      const pct = total > 0 ? Math.min(1, Math.max(0, window.scrollY / total)) : 0;
      progressBar.style.setProperty('--scroll-progress', pct.toFixed(4));
    }
    ticking = false;
  };
  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  update();
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

/* ============================================================================
   Thomson & Foley Property Maintenance — site behaviour
   ----------------------------------------------------------------------------
   No dependencies. Everything here is progressive enhancement: with JS off the
   page still renders, reads and submits. Roughly 5 KB against the ~120 KB of
   GSAP + ScrollTrigger + Lenis it replaces.

   Modules: reveals · parallax · nav · mobile menu · scroll progress ·
            gallery filter + lightbox · quote form · year stamp
   ========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── Reveals ──────────────────────────────────────────────────────────────
     Siblings that come into view together are staggered by DOM order so a grid
     of cards arrives as a sequence rather than a single block. */
  (function reveals() {
    var items = $$('[data-reveal]');
    if (!items.length) return;
    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('in'); });
      return;
    }
    // The top margin is deliberately enormous: it keeps anything that has been
    // scrolled past counted as intersecting, so jumping to an anchor or hitting
    // End can never strand a mid-page section at opacity 0.
    var io = new IntersectionObserver(function (entries) {
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (entry, i) {
        entry.target.style.setProperty('--d', Math.min(i, 6) * 70 + 'ms');
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '10000px 0px -12% 0px', threshold: 0 });
    items.forEach(function (el) { io.observe(el); });
  })();

  /* ── Parallax ─────────────────────────────────────────────────────────────
     One rAF-throttled scroll listener drives every backdrop. Elements are only
     moved while they are on screen, so offscreen bands cost nothing. */
  (function parallax() {
    var layers = $$('[data-parallax], [data-parallax-soft]');
    if (!layers.length || reduced) return;
    var ticking = false;

    function frame() {
      ticking = false;
      var vh = window.innerHeight;
      for (var i = 0; i < layers.length; i++) {
        var el = layers[i];
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) continue;
        var depth = el.hasAttribute('data-parallax-soft') ? 0.06 : 0.12;
        // -1 above the fold … 1 below it
        var progress = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
        el.style.transform = 'translate3d(0,' + (progress * depth * r.height).toFixed(1) + 'px,0)';
      }
    }
    function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }

    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll, { passive: true });
    frame();
  })();

  /* ── Nav state + reading progress ─────────────────────────────────────── */
  (function nav() {
    var bar = $('[data-nav]');
    var prog = $('[data-progress]');
    if (!bar && !prog) return;
    var ticking = false;

    function frame() {
      ticking = false;
      var y = window.scrollY || 0;
      if (bar) bar.classList.toggle('scrolled', y > 40);
      if (prog) {
        var max = document.body.scrollHeight - window.innerHeight;
        prog.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
      }
    }
    addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(frame); }
    }, { passive: true });
    frame();
  })();

  /* ── Mobile menu ──────────────────────────────────────────────────────────
     Focus moves into the panel on open, is trapped while it is up, and returns
     to the burger on close. Escape and a link click both close it. */
  (function menu() {
    var panel = $('[data-menu]');
    var open = $('[data-menu-open]');
    var close = $('[data-menu-close]');
    if (!panel || !open) return;
    var last = null;

    function focusables() {
      return $$('a[href], button:not([disabled])', panel)
        .filter(function (el) { return el.offsetParent !== null; });
    }
    function setOpen(on) {
      panel.classList.toggle('open', on);
      panel.toggleAttribute('inert', !on);
      panel.setAttribute('aria-hidden', on ? 'false' : 'true');
      open.setAttribute('aria-expanded', on ? 'true' : 'false');
      document.body.classList.toggle('locked', on);
      if (on) { last = document.activeElement; (close || focusables()[0] || panel).focus(); }
      else if (last) { last.focus(); last = null; }
    }

    open.addEventListener('click', function () { setOpen(true); });
    if (close) close.addEventListener('click', function () { setOpen(false); });
    $$('a', panel).forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });

    // Escape is caught on the document as well: focus can legitimately sit
    // outside the panel (a click on the backdrop, an extension stealing it).
    addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) setOpen(false);
    });
    panel.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = focusables();
      if (!f.length) return;
      var first = f[0], lastEl = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
    });
    // number the links so CSS can stagger their entrance
    $$('.menu__links a', panel).forEach(function (a, i) { a.style.setProperty('--i', i); });
  })();

  /* ── Gallery: filters + lightbox ──────────────────────────────────────── */
  (function gallery() {
    var grid = $('[data-gallery]');
    if (!grid) return;
    var figures = $$('figure', grid);

    // filters
    $$('[data-filter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var want = btn.getAttribute('data-filter');
        $$('[data-filter]').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        figures.forEach(function (fig) {
          var tags = (fig.getAttribute('data-tags') || '').split(' ');
          fig.hidden = want !== 'all' && tags.indexOf(want) === -1;
        });
        var live = $('[data-gallery-count]');
        if (live) {
          var n = figures.filter(function (f) { return !f.hidden; }).length;
          live.textContent = n + (n === 1 ? ' photo' : ' photos') + ' shown';
        }
      });
    });

    // lightbox
    var lb = $('[data-lightbox]');
    if (!lb) return;
    var img = $('img', lb);
    var cap = $('[data-lb-cap]');
    var idx = 0, opener = null;

    function visible() { return figures.filter(function (f) { return !f.hidden; }); }
    function show(i) {
      var list = visible();
      if (!list.length) return;
      idx = (i + list.length) % list.length;
      var fig = list[idx];
      var thumb = $('img', fig);
      img.src = fig.getAttribute('data-full');
      img.alt = thumb ? thumb.alt : '';
      if (cap) cap.innerHTML = (thumb ? thumb.alt : '') + '<b>' + (idx + 1) + ' of ' + list.length + '</b>';
    }
    function openAt(fig) {
      opener = document.activeElement;
      show(visible().indexOf(fig));
      lb.classList.add('open');
      lb.setAttribute('aria-hidden', 'false');
      document.body.classList.add('locked');
      $('[data-lb-close]', lb).focus();
    }
    function shut() {
      lb.classList.remove('open');
      lb.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('locked');
      img.removeAttribute('src');
      if (opener) { opener.focus(); opener = null; }
    }

    figures.forEach(function (fig) {
      var btn = $('button', fig);
      if (btn) btn.addEventListener('click', function () { openAt(fig); });
    });
    $('[data-lb-close]', lb).addEventListener('click', shut);
    $('[data-lb-prev]', lb).addEventListener('click', function () { show(idx - 1); });
    $('[data-lb-next]', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) shut(); });
    addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') shut();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        // three controls only, so cycle them by hand
        var f = $$('button', lb);
        var at = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(at + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    // swipe on touch
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
      x0 = null;
    }, { passive: true });
  })();

  /* ── Quote form ───────────────────────────────────────────────────────────
     Validates in place, then posts to the endpoint named in data-endpoint. If
     no endpoint is configured the form falls back to opening a pre-filled
     email — so the page never silently swallows an enquiry. */
  (function quoteForm() {
    var box = $('[data-form]');
    if (!box) return;
    var form = $('form', box);
    if (!form) return;
    var submit = $('button[type=submit]', form);
    var status = $('[data-form-status]', box);
    var endpoint = form.getAttribute('data-endpoint') || '';
    var mailto = form.getAttribute('data-mailto') || '';

    var ts = $('input[name=ts]', form);
    if (ts) ts.value = String(Date.now());

    function fieldOf(input) { return input.closest('.field'); }
    function messageFor(input) {
      if (input.validity.valueMissing) return 'This one is needed.';
      if (input.type === 'email' && input.validity.typeMismatch) return 'That email does not look right.';
      if (input.validity.tooShort) return 'A little more detail, please.';
      return input.validationMessage || 'Please check this.';
    }
    function mark(input) {
      var wrap = fieldOf(input);
      if (!wrap) return input.checkValidity();
      var err = $('.err', wrap);
      var ok = input.checkValidity();
      wrap.classList.toggle('invalid', !ok);
      input.setAttribute('aria-invalid', ok ? 'false' : 'true');
      if (err) err.textContent = ok ? '' : messageFor(input);
      return ok;
    }
    $$('input, select, textarea', form).forEach(function (input) {
      if (input.type === 'hidden' || input.name === 'botcheck') return;
      input.addEventListener('blur', function () { mark(input); });
      input.addEventListener('input', function () {
        if (fieldOf(input) && fieldOf(input).classList.contains('invalid')) mark(input);
      });
    });

    function bodyText(data) {
      return ['Name: ' + (data.get('name') || ''),
        'Phone: ' + (data.get('phone') || ''),
        'Email: ' + (data.get('email') || ''),
        'Suburb: ' + (data.get('suburb') || ''),
        'Service: ' + (data.get('service') || ''),
        '', String(data.get('message') || '')].join('\n');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('input, select, textarea', form).filter(function (i) {
        return i.type !== 'hidden' && i.name !== 'botcheck';
      });
      var bad = fields.filter(function (i) { return !mark(i); });
      if (bad.length) { bad[0].focus(); if (status) status.textContent = 'Some details still need filling in.'; return; }

      var honey = $('input[name=botcheck]', form);
      if (honey && honey.checked) { box.classList.add('sent'); return; }   // bot: pretend it worked

      var data = new FormData(form);

      if (!endpoint) {                                   // no backend wired up yet
        if (mailto) {
          location.href = mailto + '?subject=' + encodeURIComponent('Quote request from ' + (data.get('name') || 'the website')) +
            '&body=' + encodeURIComponent(bodyText(data));
        }
        box.classList.add('sent');
        return;
      }

      submit.setAttribute('aria-busy', 'true');
      var was = submit.textContent;
      submit.textContent = 'Sending…';
      if (status) status.textContent = 'Sending your details…';

      fetch(endpoint, { method: 'POST', body: data })
        .then(function (r) { if (!r.ok) throw new Error(r.status); box.classList.add('sent'); })
        .catch(function () {
          if (status) {
            status.textContent = 'That did not send. Please call or text 0468 373 784, or email thomson.foley@outlook.com.';
          }
          submit.textContent = was;
          submit.removeAttribute('aria-busy');
        });
    });
  })();

  /* ── Year stamp ───────────────────────────────────────────────────────── */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  root.classList.add('ready');
})();

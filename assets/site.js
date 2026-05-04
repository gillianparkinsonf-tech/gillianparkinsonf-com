/* ============================================================
   gillianparkinsonf.com — Shared scripts
   ============================================================ */

(function () {
  'use strict';

  /* ---- Mobile nav toggle ---- */
  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  if (header && toggle) {
    toggle.addEventListener('click', function () {
      var open = header.getAttribute('data-open') === 'true';
      header.setAttribute('data-open', open ? 'false' : 'true');
      toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
    });
  }

  /* ---- Reveal-on-scroll ---- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('in'); });
  }

  /* ---- Lead-magnet form ---- */
  // TODO: Set window.GHL_WEBHOOK_URL on page (or replace this placeholder)
  // when the GoHighLevel inbound webhook URL is provided. Until then, the
  // form falls back to a direct PDF download from /assets/.
  var FORM_ENDPOINT = window.GHL_WEBHOOK_URL || '';
  // Static fallback URL — keep available even after GHL is wired up
  var PDF_FALLBACK_URL = '/assets/7-signs-disconnected.pdf';

  function setOk(status, html) {
    if (!status) { return; }
    status.className = 'form-status ok';
    status.innerHTML = html;
  }
  function setErr(status, html) {
    if (!status) { return; }
    status.className = 'form-status err';
    status.innerHTML = html;
  }

  document.querySelectorAll('form.lead-form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var status = form.querySelector('.form-status');

      // Honeypot
      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value) { return; }

      // Rate-limit: max 5 submits per hour (best-effort client-side via
      // localStorage). NOTE: spec calls for server-side rate-limiting per IP
      // — without a server here this is the best we can do; the GHL webhook
      // / backend should still enforce its own limits.
      try {
        var RL_KEY = 'gpf_lead_submits';
        var RL_WINDOW_MS = 60 * 60 * 1000; // 60 minutes
        var RL_MAX = 5;
        var now = Date.now();
        var stored = [];
        try { stored = JSON.parse(localStorage.getItem(RL_KEY) || '[]'); } catch (e) { stored = []; }
        if (!Array.isArray(stored)) { stored = []; }
        var recent = stored.filter(function (t) { return typeof t === 'number' && (now - t) < RL_WINDOW_MS; });
        if (recent.length >= RL_MAX) {
          setErr(status, 'Too many submissions. Please try again later.');
          return;
        }
        recent.push(now);
        localStorage.setItem(RL_KEY, JSON.stringify(recent));
      } catch (e) { /* localStorage unavailable — proceed without rate limit */ }

      var data = {
        email: form.email && form.email.value.trim(),
        firstName: form.firstName && form.firstName.value.trim(),
        challenge: form.challenge && form.challenge.value.trim(),
        source: form.dataset.source || 'lead_magnet_7_signs',
        page: window.location.pathname,
        submittedAt: new Date().toISOString()
      };

      if (!data.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
        setErr(status, 'Please enter a valid email address.');
        return;
      }

      var okMessage = 'Thanks. Check your email — the booklet is on its way. ' +
        'Or <a href="' + PDF_FALLBACK_URL + '" download>download it directly</a>.';

      if (!FORM_ENDPOINT) {
        // No webhook configured yet — trigger a direct download as the primary path.
        setOk(status, 'Here&rsquo;s the booklet: <a href="' + PDF_FALLBACK_URL + '" download>The 7 Signs (PDF)</a>.');
        form.reset();
        return;
      }

      fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) { throw new Error('Network'); }
        setOk(status, okMessage);
        form.reset();
      }).catch(function () {
        setErr(status, 'Something went wrong. ' +
          'You can still grab the booklet here: ' +
          '<a href="' + PDF_FALLBACK_URL + '" download>The 7 Signs (PDF)</a>.');
      });
    });
  });
})();

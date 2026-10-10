/* GA4 + Clarity events */
(function () {
  'use strict';
  var path = location.pathname;

  function send(name, params) {
    if (typeof gtag !== 'function') return;
    params = params || {};
    params.page_path = path;
    gtag('event', name, params);
    if (typeof window.clarity === 'function') window.clarity('event', name);
  }

  function text(el) {
    return (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  }

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,[data-track]') : null;
    if (!el) return;
    var href = el.getAttribute('href') || '';
    var h = href.toLowerCase();
    var track = (el.getAttribute('data-track') || '').toLowerCase();
    var rel = (el.getAttribute('rel') || '').toLowerCase();
    var p = { link_url: el.href || href, link_text: text(el) };
    var name = null;

    if (h.indexOf('tel:') === 0) name = 'phone_click';
    else if (h.indexOf('mailto:') === 0) name = 'email_click';
    else if (track === 'book_call' || /\/widget\/booking\/|calendly\.com|\/book|#book/.test(h)) name = 'book_call_click';
    else if (rel.indexOf('sponsored') > -1 || el.hasAttribute('data-affiliate')) name = 'affiliate_click';
    else if (track === 'lead_magnet' || /brand-impact-audit|guide|guia|7-signs|diagnostico/.test(h)) name = 'lead_magnet_click';
    else if (/buy\.stripe\.com|checkout\.stripe\.com/.test(h)) name = 'begin_checkout';
    else if (/wa\.me\/|whatsapp\.com/.test(h)) name = 'whatsapp_click';
    else if (track) { name = 'cta_click'; p.cta_name = track; }
    else if (el.tagName === 'A' && el.hostname === location.hostname) {
      var onEs = /^\/es(\/|$)/.test(path);
      var toEs = /^\/es(\/|$)/.test(el.pathname);
      if (!onEs && toEs) { name = 'language_switch'; p.language = 'es'; }
      else if (onEs && !toEs && (el.pathname === '/' || el.getAttribute('hreflang') === 'en')) { name = 'language_switch'; p.language = 'en'; }
    }
    if (name) send(name, p);
  }, true);

  /* Lead form submit */
  document.addEventListener('submit', function (e) {
    var f = e.target;
    if (!f || f.tagName !== 'FORM') return;
    var em = f.querySelector('input[type="email"],input[name="email"]');
    var hp = f.querySelector('input[name="website"].honeypot');
    if (hp && hp.value) return;
    if (!em || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em.value.trim())) return;
    send('generate_lead', { form_id: f.getAttribute('data-source') || f.id || 'form', method: 'form' });
  }, true);

  /* Thank-you pages */
  if (/thank-you|thankyou|gracias|confirmed|welcome/i.test(path)) {
    var fire = function () {
      send('generate_lead', { method: 'thank_you_page' });
      var m = document.querySelector('meta[name="analytics-conversion"]');
      if (m && m.content) send(m.content, {});
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fire);
    else fire();
  }
})();

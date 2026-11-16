/* "Request Demo Video" modal. Any element with [data-demo-request] opens it.
   Posts { name, email, source } to the app's /api/demo-request (saves the lead, emails the demo link,
   CCs Austin, starts follow-ups), then sends the visitor to /demo-video.html. */
(function () {
  var API = 'https://app.yourhrcoach.ai/api/demo-request';
  var DEST = '/demo-video.html';
  var css = '' +
    '.drq-ov{position:fixed;inset:0;background:rgba(20,30,25,.55);display:none;align-items:center;justify-content:center;z-index:1000;padding:20px}' +
    '.drq-ov.open{display:flex}' +
    '.drq{background:#fff;border-radius:18px;max-width:440px;width:100%;padding:32px 30px 26px;box-shadow:0 30px 80px rgba(0,0,0,.25);position:relative;font-family:"DM Sans",sans-serif;color:#495459}' +
    '.drq h3{font-family:"Cormorant Garamond",serif;font-size:30px;font-weight:700;line-height:1.15;margin:0 0 8px;color:#2f3a3f}' +
    '.drq p{font-size:14.5px;line-height:1.6;color:#4a5568;margin:0 0 18px}' +
    '.drq label{display:block;font-size:12.5px;font-weight:600;margin:0 0 6px;color:#2f3a3f}' +
    '.drq input{width:100%;padding:12px 14px;border:1.5px solid #e2e8f0;border-radius:10px;font:inherit;font-size:15px;margin:0 0 14px;outline:none;box-sizing:border-box}' +
    '.drq input:focus{border-color:#4a9e6b}' +
    '.drq button[type=submit]{width:100%;padding:14px;border:0;border-radius:10px;background:linear-gradient(135deg,#4a9e6b,#357a52);color:#fff;font:inherit;font-size:15.5px;font-weight:600;cursor:pointer}' +
    '.drq button[disabled]{opacity:.7;cursor:wait}' +
    '.drq-x{position:absolute;top:12px;right:14px;background:none;border:0;font-size:26px;line-height:1;color:#a0aec0;cursor:pointer}' +
    '.drq-err{color:#c0392b;font-size:13.5px;margin:-4px 0 12px;display:none}' +
    '.drq-fine{font-size:12px!important;color:#a0aec0!important;text-align:center;margin:12px 0 0!important}' +
    '.drq-hp{position:absolute!important;left:-9999px!important;height:0;width:0;opacity:0}';
  var html = '' +
    '<div class="drq" role="dialog" aria-modal="true" aria-labelledby="drq-t">' +
    '<button class="drq-x" type="button" aria-label="Close">&times;</button>' +
    '<h3 id="drq-t">Watch the full demo</h3>' +
    '<p>See every feature of Your HR Coach in about 8 minutes. We\'ll also email you the link so you can come back to it.</p>' +
    '<form novalidate>' +
    '<label for="drq-n">Your name</label><input id="drq-n" name="name" autocomplete="name" required maxlength="80">' +
    '<label for="drq-e">Work email</label><input id="drq-e" name="email" type="email" autocomplete="email" required maxlength="254">' +
    '<input class="drq-hp" name="company" tabindex="-1" autocomplete="off" aria-hidden="true">' +
    '<div class="drq-err" role="alert"></div>' +
    '<button type="submit">Watch the demo &rarr;</button>' +
    '<p class="drq-fine">No spam. Unsubscribe any time.</p>' +
    '</form></div>';
  function init() {
    var st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
    var ov = document.createElement('div'); ov.className = 'drq-ov'; ov.innerHTML = html; document.body.appendChild(ov);
    var form = ov.querySelector('form'), err = ov.querySelector('.drq-err'), btn = ov.querySelector('button[type=submit]');
    var source = 'site';
    function open(src) { source = src || 'site'; ov.classList.add('open'); setTimeout(function () { ov.querySelector('#drq-n').focus(); }, 30); }
    function close() { ov.classList.remove('open'); }
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.drq-x').addEventListener('click', close);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('click', function (e) {
      var t = e.target.closest && e.target.closest('[data-demo-request]');
      if (t) { e.preventDefault(); open(t.getAttribute('data-demo-request')); }
    });
    if (/[?&]demo=1\b/.test(location.search)) open('link');
    form.addEventListener('submit', function (e) {
      e.preventDefault(); err.style.display = 'none';
      var name = form.name.value.trim(), email = form.email.value.trim();
      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { err.textContent = 'Please enter your name and a valid email.'; err.style.display = 'block'; return; }
      btn.disabled = true; btn.textContent = 'One moment…';
      var params = new URLSearchParams(location.search);
      var src = [source, location.pathname, params.get('utm_source'), params.get('utm_campaign')].filter(Boolean).join(' | ');
      var go = function () {
        try { sessionStorage.setItem('yhc_demo_name', name.split(/\s+/)[0]); } catch (x) {}
        location.href = DEST;
      };
      fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, email: email, source: src, company: form.company.value }) })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok && res.d && res.d.error) { err.textContent = res.d.error; err.style.display = 'block'; btn.disabled = false; btn.innerHTML = 'Watch the demo &rarr;'; return; }
          try { if (window.fbq) fbq('track', 'Lead', { content_name: 'Demo video' }); } catch (x) {}
          try { if (window.gtag) gtag('event', 'generate_lead', { method: 'demo_video' }); } catch (x) {}
          setTimeout(go, 250);
        })
        .catch(go); // network trouble: still show them the video
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

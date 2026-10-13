// Partner referral links: yourhrcoach.ai/emerson, /go/<code>, or /?ref=<code>.
// Remembers the partner code (first touch wins) and adds ?ref=<code> to every link into
// app.yourhrcoach.ai, where the app saves it on the new account and on the Stripe subscription.
//
// CO-BRANDED PARTNER PAGES
// To add a partner: add an entry below, drop their logo in /images/partners/<code>.png
// (transparent PNG or SVG, any width, ~200px tall is plenty), and optionally add a vanity
// path (e.g. /emerson) to netlify.toml. /go/<code> works for every partner with no extra setup.
// Partner pages are noindex (meta tag here + X-Robots-Tag header in netlify.toml) so they are
// reachable by direct link only. The app shows the same logo on its sign-in screen.
var YHC_PARTNERS = {
  emerson:       { name: 'Emerson & Company', logo: '/images/partners/emerson.png' },
  readyaimclimb: { name: 'Ready Aim Climb',   logo: '/images/partners/readyaimclimb.png' }
};
// Vanity paths that serve the homepage co-branded (keep in sync with netlify.toml)
var YHC_PARTNER_PATHS = { '/emerson': 'emerson', '/readyaimclimb': 'readyaimclimb' };

(function () {
  var ok = function (v) { v = String(v || '').trim().toLowerCase(); return /^[a-z0-9_-]{2,40}$/.test(v) ? v : null; };
  var path = location.pathname.replace(/\/+$/, '').toLowerCase();
  var goMatch = path.match(/^\/go\/([^\/]+)$/);
  var fromPath = YHC_PARTNER_PATHS[path] || (goMatch ? ok(decodeURIComponent(goMatch[1])) : null);
  var fromUrl = ok(new URLSearchParams(location.search).get('ref')) || fromPath;
  var ref = null;
  try {
    if (fromUrl && !localStorage.getItem('yhc_ref')) {
      localStorage.setItem('yhc_ref', fromUrl);
      localStorage.setItem('yhc_ref_at', new Date().toISOString());
    }
    ref = ok(localStorage.getItem('yhc_ref')) || fromUrl;
  } catch (e) { ref = fromUrl; }

  // Co-brand only when the visitor arrived on a partner link (not on later plain visits).
  var partnerCode = fromUrl ? fromUrl.split('-')[0] : null;
  var partner = partnerCode && YHC_PARTNERS[partnerCode];
  if (fromUrl) hideFromSearch();

  if (ref) {
    var tag = function (a) {
      try {
        var u = new URL(a.href, location.href);
        if (u.hostname !== 'app.yourhrcoach.ai' || u.searchParams.get('ref')) return;
        u.searchParams.set('ref', ref); a.href = u.toString();
      } catch (e) {}
    };
    var tagAll = function () { document.querySelectorAll('a[href*="app.yourhrcoach.ai"]').forEach(tag); };
    onReady(tagAll);
    // catch links added later / changed by other scripts
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) tag(a); }, true);
  }
  if (partner) onReady(function () { coBrand(partner); });

  function onReady(fn) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // Partner/referral URLs must never show up in Google: noindex and drop the canonical.
  function hideFromSearch() {
    var m = document.createElement('meta'); m.name = 'robots'; m.content = 'noindex, nofollow';
    document.head.appendChild(m);
    var c = document.querySelector('link[rel="canonical"]'); if (c) c.parentNode.removeChild(c);
  }

  function partnerMark(p, cls) {
    var wrap = document.createElement('span'); wrap.className = cls;
    var img = new Image(); img.src = p.logo; img.alt = p.name;
    img.onerror = function () { wrap.textContent = p.name; wrap.classList.add('yhc-pm-text'); };
    wrap.appendChild(img);
    return wrap;
  }

  function coBrand(p) {
    var css = document.createElement('style');
    css.textContent =
      '.yhc-nav-x{color:#a0aec0;font-size:18px;font-weight:300;margin:0 2px}' +
      '.yhc-nav-partner{display:inline-flex;align-items:center;height:36px}' +
      '.yhc-nav-partner img{max-height:34px;max-width:150px;display:block}' +
      '.yhc-pm-text{font-family:"DM Sans",sans-serif;font-weight:600;font-size:15px;color:#495459;white-space:nowrap}' +
      '.yhc-partner-strip{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 18px;margin-bottom:22px;box-shadow:0 6px 24px rgba(0,0,0,0.05);max-width:520px}' +
      '.yhc-partner-strip .yhc-strip-logo img{max-height:46px;max-width:170px;display:block}' +
      '.yhc-partner-strip .yhc-strip-logo.yhc-pm-text{font-size:17px}' +
      '.yhc-strip-text{font-size:13.5px;color:#4a5568;line-height:1.4;border-left:1px solid #e2e8f0;padding-left:14px}' +
      '.yhc-strip-text strong{color:#357a52}' +
      '@media (max-width:768px){.yhc-nav-x,.yhc-nav-partner{display:none}.yhc-partner-strip{flex-direction:column;align-items:flex-start;gap:8px}.yhc-strip-text{border-left:0;padding-left:0}}';
    document.head.appendChild(css);

    var logo = document.querySelector('.nav-logo');
    if (logo) {
      // keep YHC logo + partner logo together on the left side of the nav
      var group = document.createElement('div'); group.style.cssText = 'display:flex;align-items:center;gap:12px';
      logo.parentNode.insertBefore(group, logo);
      var x = document.createElement('span'); x.className = 'yhc-nav-x'; x.textContent = '×';
      group.appendChild(logo); group.appendChild(x); group.appendChild(partnerMark(p, 'yhc-nav-partner'));
    }

    var hero = document.querySelector('.hero-content');
    if (hero) {
      var strip = document.createElement('div'); strip.className = 'yhc-partner-strip';
      strip.appendChild(partnerMark(p, 'yhc-strip-logo'));
      var t = document.createElement('div'); t.className = 'yhc-strip-text';
      t.innerHTML = 'Brought to you by <strong></strong>, in partnership with Your HR Coach.';
      t.querySelector('strong').textContent = p.name;
      strip.appendChild(t);
      hero.insertBefore(strip, hero.firstChild);
    }
  }
})();

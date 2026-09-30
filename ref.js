// Partner referral links: yourhrcoach.ai/?ref=<code> (or /go/<code>, /emerson ...).
// Remembers the partner code (first touch wins) and adds ?ref=<code> to every link into
// app.yourhrcoach.ai, where the app saves it on the new account and on the Stripe subscription.
(function () {
  var ok = function (v) { v = String(v || '').trim().toLowerCase(); return /^[a-z0-9_-]{2,40}$/.test(v) ? v : null; };
  var ref = null;
  try {
    var fromUrl = ok(new URLSearchParams(location.search).get('ref'));
    if (fromUrl && !localStorage.getItem('yhc_ref')) {
      localStorage.setItem('yhc_ref', fromUrl);
      localStorage.setItem('yhc_ref_at', new Date().toISOString());
    }
    ref = ok(localStorage.getItem('yhc_ref')) || fromUrl;
  } catch (e) { ref = ok(new URLSearchParams(location.search).get('ref')); }
  if (!ref) return;
  function tag(a) {
    try {
      var u = new URL(a.href, location.href);
      if (u.hostname !== 'app.yourhrcoach.ai' || u.searchParams.get('ref')) return;
      u.searchParams.set('ref', ref); a.href = u.toString();
    } catch (e) {}
  }
  function tagAll() { document.querySelectorAll('a[href*="app.yourhrcoach.ai"]').forEach(tag); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tagAll); else tagAll();
  // catch links added later / changed by other scripts
  document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('a[href]'); if (a) tag(a); }, true);
})();

/* Gelişim Takip — kod yükleyici
   Telefonda (APK) açılışta GitHub'daki en son app.js / styles.css / index.html'i indirir,
   saklar ve kullanır. Böylece arayüz değişiklikleri için yeni APK kurmak gerekmez.
   Veriler (localStorage) aynı yerde kaldığı için hiçbir kayıt kaybolmaz.
   Web'de ve bir şey ters giderse APK içindeki dosyalar kullanılır. */
(function () {
  'use strict';
  var REPO = 'mbedilsah-tech/Gelisim_Takip';
  var KEY = 'gt_code_v1';
  var C = window.Capacitor;
  var native = !!(C && typeof C.isNativePlatform === 'function' && C.isNativePlatform());

  function ls(k, v) {
    try {
      if (v === undefined) return localStorage.getItem(k);
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v);
    } catch (e) { /* depolama yoksa önemli değil */ }
    return null;
  }
  function loadBundled() {
    window.__codeInfo = { source: 'apk' };
    var s = document.createElement('script');
    s.src = 'app.js';
    document.body.appendChild(s);
  }
  function applyShell(html) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var keep = [];
    for (var i = 0; i < document.body.children.length; i++) {
      if (document.body.children[i].tagName === 'SCRIPT') keep.push(document.body.children[i]);
    }
    document.body.innerHTML = '';
    var kids = doc.body.children;
    for (var j = 0; j < kids.length; j++) {
      if (kids[j].tagName !== 'SCRIPT') document.body.appendChild(document.importNode(kids[j], true));
    }
    keep.forEach(function (n) { document.body.appendChild(n); });
  }
  function applyCss(css) {
    var link = document.getElementById('appCss');
    var st = document.createElement('style');
    st.textContent = css;
    if (link) link.parentNode.replaceChild(st, link); else document.head.appendChild(st);
  }
  function runJs(code) {
    var s = document.createElement('script');
    s.text = code + '\n//# sourceURL=app.js';
    document.body.appendChild(s);
  }

  if (!native) { loadBundled(); return; }

  var pack = null;
  try { pack = JSON.parse(ls(KEY)); } catch (e) { pack = null; }

  if (pack && pack.js) {
    try {
      if (pack.html) applyShell(pack.html);
      if (pack.css) applyCss(pack.css);
      window.__appBooted = false;
      window.__codeInfo = { source: 'github', sha: pack.sha, at: pack.at };
      runJs(pack.js);
      if (!window.__appBooted) throw new Error('indirilen kod açılmadı');
    } catch (e) {
      // İndirilen sürüm bozuksa sil, bu sürümü bir daha indirme ve APK içindekine dön
      ls(KEY + '_bad', pack.sha || '');
      ls(KEY, null);
      location.reload();
      return;
    }
  } else {
    loadBundled();
  }

  function get(url) {
    return fetch(url, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    });
  }

  // Arka planda güncelleme kontrolü
  window.__checkUpdate = function (manual) {
    return get('https://api.github.com/repos/' + REPO + '/commits/main')
      .then(function (t) {
        var sha = JSON.parse(t).sha;
        if (!sha) throw new Error('sha yok');
        if (pack && pack.sha === sha) return 'guncel';
        if (ls(KEY + '_bad') === sha) return 'guncel'; // bozuk çıkan sürüm: düzeltme gelene kadar bekle
        var raw = 'https://raw.githubusercontent.com/' + REPO + '/' + sha + '/';
        return Promise.all([get(raw + 'index.html'), get(raw + 'styles.css'), get(raw + 'app.js')]).then(function (r) {
          var np = { sha: sha, at: Date.now(), html: r[0], css: r[1], js: r[2] };
          if (np.js.indexOf('__appBooted') < 0) throw new Error('geçersiz kod');
          var same = pack && pack.js === np.js && pack.css === np.css && pack.html === np.html;
          ls(KEY, JSON.stringify(np));
          pack = np;
          if (same) return 'guncel';
          var busy = document.querySelector('.overlay:not([hidden])') || document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName);
          if (manual || !busy) { location.reload(); return 'yenilendi'; }
          return 'sonraki-acilista';
        });
      });
  };
  setTimeout(function () { window.__checkUpdate(false).catch(function () { /* internet yoksa sorun değil */ }); }, 1500);
})();

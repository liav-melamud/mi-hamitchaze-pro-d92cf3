
// ---------- מוזיקת רקע בספוטיפי: המארח מדביק קישור, וכל השחקנים מקבלים נגן קטן בפינה ----------
(function () {
  var EN = window.MM_LANG === 'en', T = function (he, en) { return EN ? en : he; };
  var ref = '', open = false, dock, body, frameHost, inp;
  var CSS = '#musicDock{position:fixed;left:10px;bottom:76px;width:min(310px,calc(100vw - 20px));z-index:34;background:linear-gradient(#241a08,#14100a);border:1px solid #ffb547aa;border-radius:14px;box-shadow:0 0 16px #ffb54733;color:#ffd166;font:inherit;direction:' + (EN ? 'ltr' : 'rtl') + '}' +
    '#musicDock .mh{display:flex;align-items:center;justify-content:space-between;padding:6px 12px;cursor:pointer;font-weight:800;font-size:13px;user-select:none}' +
    '#musicDock .mb{padding:0 10px 10px}#musicDock .mb.hid{display:none}' +
    '#musicDock input{width:100%;box-sizing:border-box;margin:4px 0;padding:7px 10px;border-radius:9px;border:1px solid #ffb54766;background:#0d0a05;color:#fff;font:inherit;font-size:13px;direction:ltr;text-align:left}' +
    '#musicDock .mr{display:flex;gap:6px;margin-bottom:6px}#musicDock button.mbt{flex:1;padding:6px;border-radius:9px;border:1px solid #ffb547;background:#3a2a08;color:#ffd166;font:inherit;font-weight:800;font-size:13px;cursor:pointer}' +
    '#musicDock .mn{font-size:11px;color:#c9b27a;margin:2px 0 6px;line-height:1.4}#musicDock iframe{border:0;border-radius:12px;display:block;width:100%}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function mount() {
    if (dock) return;
    dock = document.createElement('div'); dock.id = 'musicDock'; dock.style.display = 'none';
    dock.innerHTML = '<div class="mh"><span>🎵 ' + T('מוזיקה', 'Music') + '</span><span id="mArrow">▴</span></div><div class="mb hid"><div id="mCtl"></div><div id="mFrame"></div></div>';
    document.body.appendChild(dock);
    body = dock.querySelector('.mb'); frameHost = dock.querySelector('#mFrame');
    dock.querySelector('.mh').onclick = function () { open = !open; body.classList.toggle('hid', !open); dock.querySelector('#mArrow').textContent = open ? '▾' : '▴'; };
    var ctl = dock.querySelector('#mCtl');
    ctl.innerHTML = '<input id="mUrl" type="text" placeholder="open.spotify.com/..." autocomplete="off"><div class="mr"><button class="mbt" id="mGo" type="button">▶ ' + T('הפעל לכולם', 'Play for all') + '</button><button class="mbt" id="mStop" type="button">⏹ ' + T('עצור', 'Stop') + '</button></div><div class="mn">' + T('הדבק קישור לשיר או פלייליסט מספוטיפי. כל שחקן לוחץ ▶ בנגן כדי להתחיל (דפדפנים לא מאפשרים הפעלה אוטומטית). מי שמחובר לספוטיפי שומע שירים מלאים, אחרים שומעים קטע של 30 שניות.', 'Paste a Spotify song or playlist link. Each player presses ▶ in the player to start (browsers block autoplay). Players logged in to Spotify hear full songs, others hear 30-second previews.') + '</div>';
    inp = ctl.querySelector('#mUrl');
    ctl.querySelector('#mGo').onclick = function () { if (typeof api === 'function') api({ type: 'music', url: inp.value }); };
    ctl.querySelector('#mStop').onclick = function () { inp.value = ''; if (typeof api === 'function') api({ type: 'music', url: '' }); };
    ['keydown', 'keyup', 'keypress'].forEach(function (ev) { inp.addEventListener(ev, function (e) { e.stopPropagation(); }); });
  }
  function setRef(r) {
    if (r === ref) return; ref = r; mount(); frameHost.innerHTML = '';
    if (r) {
      var f = document.createElement('iframe'); f.src = 'https://open.spotify.com/embed/' + r + '?utm_source=generator&theme=0'; f.height = /^track|^episode/.test(r) ? '80' : '152';
      f.allow = 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture'; f.loading = 'lazy'; frameHost.appendChild(f);
      if (!open) dock.querySelector('.mh').click();
    }
  }
  function patch() {
    if (typeof onState !== 'function' || window.__mmMusic) return;
    window.__mmMusic = true; var orig = onState;
    window.onState = onState = function (s) { orig.apply(this, arguments); try { if (s && typeof s.music === 'string') setRef(s.music); } catch (e) {} };
  }
  setInterval(function () {
    patch();
    var inGame = typeof S !== 'undefined' && S && S.phase;
    var host = typeof isHost !== 'undefined' && isHost;
    var show = !!(inGame && (host || ref));
    if (show) mount();
    if (dock) { dock.style.display = show ? '' : 'none'; var c = dock.querySelector('#mCtl'); if (c) c.style.display = host ? '' : 'none'; }
    if (!inGame && ref) { ref = ''; if (frameHost) frameHost.innerHTML = ''; }
  }, 500);
})();

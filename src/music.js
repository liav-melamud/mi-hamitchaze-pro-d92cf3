
// ---------- מוזיקת רקע בספוטיפי: המארח מדביק קישור, וכל השחקנים מקבלים נגן קטן בפינה ----------
(function () {
  var EN = window.MM_LANG === 'en', T = function (he, en) { return EN ? en : he; };
  var ref = '', open = false, dock, body, frameHost, inp;
  var CSS = '#musicDock{position:fixed;left:10px;bottom:76px;width:min(310px,calc(100vw - 20px));z-index:34;background:linear-gradient(#241a08,#14100a);border:1px solid #ffb547aa;border-radius:14px;box-shadow:0 0 16px #ffb54733;color:#ffd166;font:inherit;direction:' + (EN ? 'ltr' : 'rtl') + '}' +
    '#musicDock .mh{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:6px 12px;cursor:grab;font-weight:800;font-size:13px;user-select:none;touch-action:none}' +
    '#musicDock.min{width:auto;border-radius:999px;opacity:.8}#musicDock.min .mh{padding:6px 10px}#musicDock.min .mt{display:none}' +
    '#musicDock .mb{padding:0 10px 10px}#musicDock .mb.hid{display:none}' +
    '#musicDock input{width:100%;box-sizing:border-box;margin:4px 0;padding:7px 10px;border-radius:9px;border:1px solid #ffb54766;background:#0d0a05;color:#fff;font:inherit;font-size:13px;direction:ltr;text-align:left}' +
    '#musicDock .mr{display:flex;gap:6px;margin-bottom:6px}#musicDock button.mbt{flex:1;padding:6px;border-radius:9px;border:1px solid #ffb547;background:#3a2a08;color:#ffd166;font:inherit;font-weight:800;font-size:13px;cursor:pointer}' +
    '#musicDock .mn{font-size:11px;color:#c9b27a;margin:2px 0 6px;line-height:1.4}#musicDock iframe{border:0;border-radius:12px;display:block;width:100%}';
  var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);

  function mount() {
    if (dock) return;
    dock = document.createElement('div'); dock.id = 'musicDock'; dock.style.display = 'none';
    dock.className = 'min'; dock.innerHTML = '<div class="mh"><span>🎵<span class="mt"> ' + T('מוזיקה', 'Music') + '</span></span><span id="mArrow">▴</span></div><div class="mb hid"><div id="mCtl"></div><div id="mFrame"></div></div>';
    document.body.appendChild(dock);
    body = dock.querySelector('.mb'); frameHost = dock.querySelector('#mFrame');
    var head = dock.querySelector('.mh'), dg = null, moved = false;
    head.onclick = function () { if (moved) { moved = false; return; } open = !open; body.classList.toggle('hid', !open); dock.classList.toggle('min', !open); dock.querySelector('#mArrow').textContent = open ? '▾' : '▴'; requestAnimationFrame(clamp); };
    // גרירה: מחזיקים את הכותרת וגוררים לאן שנוח; המקום נשמר
    head.addEventListener('pointerdown', function (e) { var r = dock.getBoundingClientRect(); dg = { x: e.clientX, y: e.clientY, l: r.left, t: r.top }; moved = false; try { head.setPointerCapture(e.pointerId); } catch (er) {} });
    head.addEventListener('pointermove', function (e) { if (!dg) return; var dx = e.clientX - dg.x, dy = e.clientY - dg.y; if (!moved && Math.hypot(dx, dy) < 7) return; moved = true; place(dg.l + dx, dg.t + dy); });
    var drop = function () { if (dg && moved) { var r = dock.getBoundingClientRect(); try { localStorage.setItem('mm_musicpos', JSON.stringify([r.left, r.top])); } catch (er) {} } dg = null; };
    head.addEventListener('pointerup', drop); head.addEventListener('pointercancel', function () { dg = null; });
    var ctl = dock.querySelector('#mCtl');
    ctl.innerHTML = '<input id="mQ" type="text" placeholder="' + T('שם של שיר לחיפוש', 'Song name to search') + '" autocomplete="off"><div class="mr"><button class="mbt" id="mFind" type="button">🔍 ' + T('חפש בספוטיפיי', 'Search Spotify') + '</button></div><input id="mUrl" type="text" placeholder="open.spotify.com/..." autocomplete="off"><div class="mr"><button class="mbt" id="mGo" type="button">▶ ' + T('הפעל לכולם', 'Play for all') + '</button><button class="mbt" id="mStop" type="button">⏹ ' + T('עצור', 'Stop') + '</button></div><div class="mn">' + T('הדבק קישור לשיר או פלייליסט מספוטיפי. כל שחקן לוחץ ▶ בנגן כדי להתחיל (דפדפנים לא מאפשרים הפעלה אוטומטית). מי שמחובר לספוטיפי שומע שירים מלאים, אחרים שומעים קטע של 30 שניות.', 'Paste a Spotify song or playlist link. Each player presses ▶ in the player to start (browsers block autoplay). Players logged in to Spotify hear full songs, others hear 30-second previews.') + '</div>';
    inp = ctl.querySelector('#mUrl');
    var q = ctl.querySelector('#mQ');
    ctl.querySelector('#mFind').onclick = function () { var v = q.value.trim(); if (v) window.open('https://open.spotify.com/search/' + encodeURIComponent(v), '_blank', 'noopener'); };
    ['keydown', 'keyup', 'keypress'].forEach(function (ev) { q.addEventListener(ev, function (e) { e.stopPropagation(); if (ev === 'keydown' && e.key === 'Enter') ctl.querySelector('#mFind').click(); }); });
    ctl.querySelector('#mGo').onclick = function () { if (typeof api === 'function') api({ type: 'music', url: inp.value }); };
    ctl.querySelector('#mStop').onclick = function () { inp.value = ''; if (typeof api === 'function') api({ type: 'music', url: '' }); };
    ['keydown', 'keyup', 'keypress'].forEach(function (ev) { inp.addEventListener(ev, function (e) { e.stopPropagation(); }); });
  }
  function place(x, y) { var w = dock.offsetWidth || 60, h = dock.offsetHeight || 32; dock.style.left = Math.max(4, Math.min(innerWidth - w - 4, x)) + 'px'; dock.style.top = Math.max(4, Math.min(innerHeight - h - 4, y)) + 'px'; dock.style.bottom = 'auto'; }
  function clamp() { if (!dock || !dock.offsetWidth) return; var p = null; try { p = JSON.parse(localStorage.getItem('mm_musicpos') || 'null'); } catch (e) {} if (p) place(p[0], p[1]); }
  window.addEventListener('resize', clamp);
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
    if (dock) { var was = dock.style.display; dock.style.display = show ? '' : 'none'; if (show && was === 'none') clamp(); var c = dock.querySelector('#mCtl'); if (c) c.style.display = host ? '' : 'none'; }
    if (!inGame && ref) { ref = ''; if (frameHost) frameHost.innerHTML = ''; }
  }, 500);
})();

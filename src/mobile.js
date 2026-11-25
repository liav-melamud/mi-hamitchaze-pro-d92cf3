
// ---------- טלפון: מסך מלא אוטומטי, כרטיס תפקיד מתקפל, ומיקום ג'ויסטיק לבחירת השחקן ----------
(function () {
  var EN = window.MM_LANG === 'en', T = function (he, en) { return EN ? en : he; };
  var touch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  try { window.MM_JOYPOS = JSON.parse(localStorage.getItem('mm_joypos') || 'null'); } catch (e) { window.MM_JOYPOS = null; }
  var st = document.createElement('style');
  st.textContent = '#rolecard.mini{width:auto!important;max-width:60vw}#rolecard.mini #roledesc,#rolecard.mini #tasklist{display:none!important}#rolecard.mini #rolename::after{content:" ▾"}' +
    '#joyEdit{position:fixed;inset:0;z-index:90;background:rgba(0,0,0,.6);touch-action:none;color:#fff;text-align:center;font:inherit}' +
    '#joyEdit .dot{position:absolute;width:130px;height:130px;margin:-65px 0 0 -65px;border-radius:50%;background:rgba(255,181,71,.35);border:3px solid #ffb547;display:flex;align-items:center;justify-content:center;font-size:30px}' +
    '#joyEdit .bar{position:absolute;top:12px;left:0;right:0}#joyEdit button{margin:6px;padding:8px 18px;border-radius:999px;border:2px solid #ffb547;background:#3a2a08;color:#ffd166;font:inherit;font-weight:800}';
  document.head.appendChild(st);

  // מסך מלא: בנגיעה הראשונה אחרי שהמשחק מתחיל (דפדפן מאפשר מסך מלא רק אחרי נגיעה)
  var asked = false;
  document.addEventListener('touchend', function () {
    if (typeof S === 'undefined' || !S || S.phase !== 'play') { asked = false; return; }
    var standalone = navigator.standalone || matchMedia('(display-mode: fullscreen), (display-mode: standalone)').matches;
    var de = document.documentElement;
    if (asked || standalone || document.fullscreenElement || !de.requestFullscreen) return;
    asked = true;
    try { de.requestFullscreen({ navigationUI: 'hide' }).then(function () { try { screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} }).catch(function () {}); } catch (e) {}
  }, true);

  function mount() {
    var rc = document.getElementById('rolecard');
    if (rc) rc.addEventListener('click', function (e) { if (e.target.closest('#rolename')) rc.classList.toggle('mini'); });
    var after = document.getElementById('notifMode');
    if (touch && after && !document.getElementById('joyPlace')) {
      var b = document.createElement('button'); b.id = 'joyPlace'; b.type = 'button'; b.style.cssText = 'width:100%;margin:6px 0';
      b.textContent = T('📍 מקם את הג׳ויסטיק', '📍 Move the joystick'); b.onclick = edit;
      after.closest('.setrow').insertAdjacentElement('afterend', b);
    }
    // כשנבחר מקום קבוע, הג'ויסטיק נשאר מוצג שם
    setInterval(function () {
      var el = document.getElementById('joy'), p = window.MM_JOYPOS; if (!el || !p || !touch) return;
      var playing = typeof S !== 'undefined' && S && S.phase === 'play';
      if (playing && !(typeof joy !== 'undefined' && joy.active)) { el.style.left = (p.x * innerWidth - 65) + 'px'; el.style.top = (p.y * innerHeight - 65) + 'px'; el.classList.remove('hidden'); }
      else if (!playing) el.classList.add('hidden');
    }, 250);
  }
  function save(p) { window.MM_JOYPOS = p; try { p ? localStorage.setItem('mm_joypos', JSON.stringify(p)) : localStorage.removeItem('mm_joypos'); } catch (e) {} if (!p) { var el = document.getElementById('joy'); if (el) el.classList.add('hidden'); } }
  function edit() {
    var close = document.getElementById('keysClose'); if (close) close.click();
    var o = document.createElement('div'); o.id = 'joyEdit';
    var p = window.MM_JOYPOS || { x: 0.18, y: 0.7 };
    o.innerHTML = '<div class="dot">✥</div><div class="bar"><div>' + T('גרור את העיגול למקום שנוח לך', 'Drag the circle to where it is comfortable') + '</div><button id="joySave" type="button">' + T('שמור', 'Save') + '</button><button id="joyFloat" type="button">' + T('ג׳ויסטיק צף (רגיל)', 'Floating (default)') + '</button></div>';
    document.body.appendChild(o);
    var dot = o.querySelector('.dot'), down = false;
    var show = function () { dot.style.left = (p.x * 100) + '%'; dot.style.top = (p.y * 100) + '%'; }; show();
    var to = function (e) { p = { x: Math.max(0.08, Math.min(0.92, e.clientX / innerWidth)), y: Math.max(0.15, Math.min(0.9, e.clientY / innerHeight)) }; show(); };
    o.addEventListener('pointerdown', function (e) { if (e.target.tagName === 'BUTTON') return; down = true; to(e); });
    o.addEventListener('pointermove', function (e) { if (down) to(e); });
    o.addEventListener('pointerup', function () { down = false; });
    o.querySelector('#joySave').onclick = function () { save(p); o.remove(); };
    o.querySelector('#joyFloat').onclick = function () { save(null); o.remove(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

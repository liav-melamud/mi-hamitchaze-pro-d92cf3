// מועדון פרו: מסך משחקים בפתיח (קלפים, חידות ומזל) עם ארנק מטבעות משותף.
// כל משחק רושם את עצמו ב-MM_ARC.games עם start(el, api) שמחזיר פונקציית ניקוי.
(function () {
  'use strict';
  const LS = 'mm_pro_arcade';
  let W = {};
  try { W = JSON.parse(localStorage.getItem(LS) || '{}') || {}; } catch (e) { W = {}; }
  W = Object.assign({ coins: 500, best: {}, day: '', played: 0, wins: 0, muted: false }, W);
  W.best = W.best || {};
  const save = () => { try { localStorage.setItem(LS, JSON.stringify(W)); } catch (e) {} };
  const dayKey = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };

  // ---- סאונד קטן (WebAudio, בלי קבצים) ----
  let ac = null;
  function tone(f, d, type, v, when) {
    if (W.muted) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), g = ac.createGain(), s = ac.currentTime + (when || 0);
      o.type = type || 'sine'; o.frequency.value = f; g.gain.setValueAtTime(v || 0.06, s);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.connect(g); g.connect(ac.destination); o.start(s); o.stop(s + d + 0.02);
    } catch (e) {}
  }
  const sfx = {
    click: () => tone(520, 0.06), card: () => tone(300, 0.07, 'triangle', 0.08), coin: () => tone(1300, 0.08, 'square', 0.03),
    win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.2, 'sine', 0.07, i * 0.09)),
    lose: () => [300, 240, 180].forEach((f, i) => tone(f, 0.22, 'sawtooth', 0.04, i * 0.12)),
    tick: () => tone(700, 0.03, 'square', 0.02),
  };

  const A = window.MM_ARC = { games: [], W, save, sfx, dayKey };
  const $ = s => document.querySelector(s);
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  A.shuffle = shuffle;
  A.coins = n => { W.coins = Math.max(0, Math.round(W.coins + n)); save(); paintCoins(); };
  A.best = (id, v) => { if (v > (W.best[id] || 0)) { W.best[id] = v; save(); return true; } return false; };
  A.played = won => { W.played++; if (won) W.wins++; save(); };
  A.addGame = g => A.games.push(g);
  const paintCoins = () => { const e = $('#arcCoins'); if (e) e.textContent = '🪙 ' + W.coins.toLocaleString('en-US'); };

  const CSS = `
  #arc { position: fixed; inset: 0; z-index: 3000; background: radial-gradient(ellipse at 50% -10%, #1b2250 0%, #0b0e16 60%); color: #e9eef7; overflow-y: auto; -webkit-overflow-scrolling: touch; font-family: inherit; }
  #arc.hidden { display: none; }
  #arc .arcBox { max-width: 760px; margin: 0 auto; padding: 10px 14px calc(30px + env(safe-area-inset-bottom)); }
  #arc .arcTop { display: flex; align-items: center; gap: 8px; position: sticky; top: 0; z-index: 5; padding: 8px 0 10px; background: linear-gradient(#0b0e16f0, #0b0e16d0 80%, transparent); backdrop-filter: blur(4px); }
  #arc .arcTop b { flex: 1; font-size: 20px; }
  #arc .arcTop button { background: #232c4a; border: 1px solid #36406a; color: #e9eef7; border-radius: 10px; padding: 7px 11px; font-size: 16px; }
  #arcCoins { background: linear-gradient(135deg, #7a5a10, #c89418); color: #fff7d6; padding: 6px 12px; border-radius: 999px; font-weight: 800; white-space: nowrap; box-shadow: 0 0 14px #ffb54755; }
  #arc .arcGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(215px, 1fr)); gap: 12px; margin-top: 8px; }
  #arc .gcard { text-align: right; background: linear-gradient(160deg, #1d2548, #121830); border: 1px solid #343f6c; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 4px; color: #e9eef7; transition: transform .15s, box-shadow .15s; cursor: pointer; }
  #arc .gcard:hover { transform: translateY(-3px); box-shadow: 0 8px 24px #0008, 0 0 0 1px #ffb54766; }
  #arc .gcard .gi { font-size: 38px; line-height: 1.1; }
  #arc .gcard b { font-size: 18px; } #arc .gcard small { color: #9aa6c4; font-size: 13px; } #arc .gcard em { font-style: normal; color: #ffb547; font-size: 12px; margin-top: 2px; }
  #arc .banner { margin: 6px 0 4px; padding: 10px 12px; border-radius: 12px; background: linear-gradient(90deg, #3a2a08, #1d2548); border: 1px solid #ffb54777; font-weight: 700; }
  #arc .banner button { margin-inline-start: 8px; background: #ffb547; color: #1a1205; border-radius: 8px; padding: 6px 12px; font-weight: 800; }
  #arc .gwrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding-top: 6px; }
  #arc .gbtn { background: #2a3566; color: #fff; border: 1px solid #4150888a; border-radius: 12px; padding: 11px 18px; font-size: 16px; font-weight: 700; }
  #arc .gbtn.p { background: linear-gradient(135deg, #ffb547, #ff8a1f); color: #1a1205; border: 0; }
  #arc .gbtn.g { background: linear-gradient(135deg, #22b25a, #0e8a43); border: 0; }
  #arc .gbtn.r { background: linear-gradient(135deg, #e5484d, #b3262c); border: 0; }
  #arc .gbtn:disabled { opacity: .4; }
  #arc .row { display: flex; gap: 8px; flex-wrap: wrap; justify-content: center; align-items: center; }
  #arc .msg { min-height: 28px; font-size: 19px; font-weight: 800; text-align: center; }
  #arc .sub { color: #9aa6c4; font-size: 14px; text-align: center; margin: 0; }
  #arc .chip { width: 54px; height: 54px; border-radius: 50%; font-weight: 900; font-size: 14px; color: #fff; border: 4px dashed #ffffffaa; box-shadow: 0 3px 0 #0006, inset 0 0 0 3px #0003; }
  .pc { position: relative; width: 58px; height: 84px; border-radius: 9px; background: #fbfbfd; color: #1b1b24; font-weight: 900; box-shadow: 0 3px 8px #0008; direction: ltr; display: inline-flex; flex-direction: column; align-items: center; justify-content: center; animation: pcIn .28s ease-out; flex: 0 0 auto; }
  .pc.red { color: #d1252d; } .pc i { font-style: normal; position: absolute; top: 4px; left: 6px; font-size: 15px; } .pc i.br { top: auto; left: auto; bottom: 4px; right: 6px; transform: rotate(180deg); }
  .pc b { font-size: 30px; }
  .pc.down { background: repeating-linear-gradient(45deg, #2b3d9a, #2b3d9a 6px, #3a4fc0 6px, #3a4fc0 12px); border: 3px solid #fbfbfd; }
  @keyframes pcIn { from { transform: translateY(-26px) scale(.8) rotate(-6deg); opacity: 0; } to { transform: none; opacity: 1; } }
  .hand { display: flex; gap: 6px; flex-wrap: wrap; justify-content: center; min-height: 90px; }
  @media (max-width: 520px) { .pc { width: 48px; height: 70px; } .pc b { font-size: 24px; } .pc i { font-size: 12px; } }
  `;

  function mount() {
    if ($('#arc')) return;
    const st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    const d = document.createElement('div'); d.id = 'arc'; d.className = 'hidden';
    d.innerHTML = '<div class="arcBox"><div class="arcTop"><button id="arcBack" class="hidden" aria-label="חזרה">→</button><b id="arcTitle">🎰 מועדון פרו</b><span id="arcCoins"></span><button id="arcMute" aria-label="צליל">🔊</button><button id="arcX" aria-label="סגור">✖</button></div><div id="arcBody"></div></div>';
    document.body.appendChild(d);
    const row = $('#modsBtn') && $('#modsBtn').parentNode;
    if (row) { const b = document.createElement('button'); b.className = 'link'; b.id = 'arcBtn'; b.textContent = '🎰 מועדון פרו'; b.style.fontWeight = '800'; b.style.color = 'var(--accent)'; row.insertBefore(b, row.firstChild); b.onclick = open; }
    $('#arcX').onclick = close; $('#arcBack').onclick = menu;
    $('#arcMute').onclick = () => { W.muted = !W.muted; save(); $('#arcMute').textContent = W.muted ? '🔇' : '🔊'; };
    $('#arcMute').textContent = W.muted ? '🔇' : '🔊';
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#arc').classList.contains('hidden')) { cur ? menu() : close(); } });
  }
  let cur = null;
  function stop() { if (cur) { try { cur(); } catch (e) {} cur = null; } }
  function open() { mount(); $('#arc').classList.remove('hidden'); document.body.style.overflow = 'hidden'; menu(); }
  function close() { stop(); $('#arc').classList.add('hidden'); document.body.style.overflow = ''; }
  function menu() {
    stop(); $('#arcBack').classList.add('hidden'); $('#arcTitle').textContent = '🎰 מועדון פרו'; paintCoins();
    let note = '';
    if (W.day !== dayKey()) { W.day = dayKey(); W.coins += 200; save(); paintCoins(); note = '<div class="banner">🎁 בונוס יומי: קיבלת 200 מטבעות! חזור מחר לעוד.</div>'; }
    if (W.coins < 10) note += '<div class="banner">😅 נגמרו המטבעות?<button id="arcRefill">קבל 100 מטבעות</button></div>';
    $('#arcBody').innerHTML = note + '<p class="sub" style="margin:8px 0 2px">משחקי קלפים, חידות ומזל – עם מטבעות וירטואליים בלבד (לא כסף אמיתי). ' + W.wins + ' ניצחונות מתוך ' + W.played + ' משחקים.</p><div class="arcGrid">' +
      A.games.map(g => `<button class="gcard" data-g="${g.id}"><span class="gi">${g.icon}</span><b>${g.name}</b><small>${g.desc}</small><em>${W.best[g.id] ? 'שיא: ' + W.best[g.id] : g.tag || ''}</em></button>`).join('') + '</div>';
    const rf = $('#arcRefill'); if (rf) rf.onclick = () => { A.coins(100); menu(); };
    document.querySelectorAll('#arcBody .gcard').forEach(b => b.onclick = () => play(b.dataset.g));
  }
  function play(id) {
    stop(); const g = A.games.find(x => x.id === id); if (!g) return;
    $('#arcBack').classList.remove('hidden'); $('#arcTitle').textContent = g.icon + ' ' + g.name;
    const body = $('#arcBody'); body.innerHTML = '<div class="gwrap"></div>';
    cur = g.start(body.firstChild, A) || null;
  }
  A.menu = menu; A.open = open; A.close = close; A.paintCoins = paintCoins;
  A.init = () => { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount(); };
  // כרטיס קלף: דרגה + צורה
  A.SUITS = ['♠', '♥', '♦', '♣']; A.RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  A.cardHtml = (c, down) => down ? '<div class="pc down"></div>' : `<div class="pc ${c.s === '♥' || c.s === '♦' ? 'red' : ''}"><i>${c.r}</i><b>${c.s}</b><i class="br">${c.r}</i></div>`;
  A.newDeck = () => { const d = []; for (const s of A.SUITS) for (const r of A.RANKS) d.push({ r, s }); return shuffle(d); };
  A.sleep = ms => new Promise(r => setTimeout(r, ms));
})();

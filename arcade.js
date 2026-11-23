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
// בלאק ג'ק (21): הימור במטבעות, "הוסף" / "עצור" / "כפל", בלאק ג'ק משלם 3:2, הקופה עוצרת על 17.
(function () {
  const A = window.MM_ARC;
  const val = c => c.r === 'A' ? 11 : ['J', 'Q', 'K'].includes(c.r) ? 10 : +c.r;
  const total = h => { let t = h.reduce((s, c) => s + val(c), 0), a = h.filter(c => c.r === 'A').length; while (t > 21 && a-- > 0) t -= 10; return t; };
  A.blackjackTotal = total;
  A.addGame({
    id: 'bj', icon: '🂡', name: 'בלאק ג\'ק', desc: 'הגע ל-21 בלי לעבור. מנצחים את הקופה ומרוויחים!', tag: 'קלאסי',
    start(el) {
      let alive = true, deck = A.newDeck(), P = [], D = [], bet = 0, phase = 'bet', msg = '', lastBet = 0;
      const draw = () => { if (deck.length < 15) deck = A.newDeck(); return deck.pop(); };
      function render() {
        if (!alive) return;
        const hideSecond = phase === 'play';
        el.innerHTML = `<div class="msg" id="bjMsg">${msg}</div>
          <div class="sub">הקופה ${D.length ? (hideSecond ? '' : '– ' + total(D)) : ''}</div>
          <div class="hand">${D.map((c, i) => A.cardHtml(c, hideSecond && i === 1)).join('') || '<div class="pc down" style="opacity:.25"></div>'}</div>
          <div class="sub">אתה ${P.length ? '– ' + total(P) : ''}</div>
          <div class="hand">${P.map(c => A.cardHtml(c)).join('') || '<div class="pc down" style="opacity:.25"></div>'}</div>
          ${phase === 'bet' ? `<div class="sub">הימור: <b style="color:#ffb547">${bet}</b> 🪙</div>
            <div class="row">${[10, 50, 100, 500].map((v, i) => `<button class="chip" data-chip="${v}" style="background:${['#2f7ad1', '#2faa55', '#8a3fd1', '#d1352f'][i]}">${v}</button>`).join('')}</div>
            <div class="row"><button class="gbtn" id="bjClear">נקה</button><button class="gbtn p" id="bjDeal" ${bet > 0 ? '' : 'disabled'}>חלק קלפים</button>${lastBet && lastBet <= A.W.coins ? `<button class="gbtn" id="bjAgain">שוב ${lastBet}</button>` : ''}</div>` : ''}
          ${phase === 'play' ? `<div class="row"><button class="gbtn g" id="bjHit">➕ הוסף</button><button class="gbtn r" id="bjStand">✋ עצור</button>${P.length === 2 && A.W.coins >= bet ? '<button class="gbtn p" id="bjDouble">✖️2 כפל</button>' : ''}</div>` : ''}
          ${phase === 'done' ? '<div class="row"><button class="gbtn p" id="bjNew">סיבוב חדש</button></div>' : ''}`;
        const q = s => el.querySelector(s);
        el.querySelectorAll('[data-chip]').forEach(b => b.onclick = () => { const v = +b.dataset.chip; if (bet + v <= A.W.coins) { bet += v; A.sfx.coin(); render(); } else { msg = 'אין מספיק מטבעות'; render(); } });
        if (q('#bjClear')) q('#bjClear').onclick = () => { bet = 0; msg = ''; render(); };
        if (q('#bjAgain')) q('#bjAgain').onclick = () => { bet = lastBet; deal(); };
        if (q('#bjDeal')) q('#bjDeal').onclick = deal;
        if (q('#bjHit')) q('#bjHit').onclick = hit;
        if (q('#bjStand')) q('#bjStand').onclick = stand;
        if (q('#bjDouble')) q('#bjDouble').onclick = dbl;
        if (q('#bjNew')) q('#bjNew').onclick = () => { P = []; D = []; bet = 0; msg = ''; phase = 'bet'; render(); };
      }
      function deal() {
        if (bet <= 0 || bet > A.W.coins) return;
        A.coins(-bet); lastBet = bet; msg = ''; A.sfx.card();
        P = [draw(), draw()]; D = [draw(), draw()]; phase = 'play';
        if (total(P) === 21) { reveal(); } else render();
      }
      function hit() { P.push(draw()); A.sfx.card(); if (total(P) > 21) finish('bust'); else if (total(P) === 21) stand(); else render(); }
      function dbl() { A.coins(-bet); bet *= 2; P.push(draw()); A.sfx.card(); if (total(P) > 21) finish('bust'); else stand(); }
      async function stand() { await reveal(); }
      async function reveal() {
        phase = 'dealer'; render();
        const natural = P.length === 2 && total(P) === 21;
        while (alive && !natural && total(D) < 17) { await A.sleep(650); if (!alive) return; D.push(draw()); A.sfx.card(); render(); }
        if (!alive) return;
        const p = total(P), d = total(D);
        if (natural && !(D.length === 2 && d === 21)) finish('blackjack');
        else if (d > 21) finish('dealerBust');
        else if (p > d) finish('win');
        else if (p === d) finish('push');
        else finish('lose');
      }
      function finish(r) {
        phase = 'done';
        const T = { bust: ['💥 עברת 21! הפסדת', 0, false], blackjack: ['🎉 בלאק ג\'ק! 3:2', 2.5, true], dealerBust: ['🎉 הקופה עברה 21 – ניצחת!', 2, true], win: ['🎉 ניצחת!', 2, true], push: ['🤝 תיקו – ההימור חוזר', 1, null], lose: ['😕 הקופה ניצחה', 0, false] }[r];
        const back = Math.round(bet * T[1]); if (back) A.coins(back);
        msg = T[0] + (back > bet ? ' (+' + (back - bet) + ' 🪙)' : '');
        if (T[2] !== null) { A.played(T[2]); T[2] ? A.sfx.win() : A.sfx.lose(); }
        const net = back - bet; if (net > 0) A.best('bj', net);
        render();
      }
      render();
      return () => { alive = false; };
    },
  });
})();
// מכונת מזל: שלוש גלגלות, טבלת תשלומים, סיבוב מונפש. מטבעות וירטואליים בלבד.
(function () {
  const A = window.MM_ARC;
  const SYM = [['🍒', 30, 6], ['🍋', 25, 10], ['🔔', 20, 16], ['⭐', 12, 30], ['💎', 8, 60], ['7️⃣', 5, 150]]; // [סמל, משקל, כפל לשלישייה]
  const pick = () => { let r = Math.random() * 100; for (const s of SYM) { if ((r -= s[1]) < 0) return s[0]; } return SYM[0][0]; };
  // חישוב זכייה: שלישייה = הכפל של הסמל; שני דובדבנים = x2 (החזר תיאורטי ~93%)
  A.slotPay = (r, bet) => {
    if (r[0] === r[1] && r[1] === r[2]) return bet * SYM.find(s => s[0] === r[0])[2];
    const cherries = r.filter(x => x === '🍒').length;
    if (cherries === 2) return bet * 2;
    return 0;
  };
  A.addGame({
    id: 'slots', icon: '🎰', name: 'מכונת מזל', desc: 'סובב וקבל שלישייה! 7️⃣7️⃣7️⃣ משלם פי 150.', tag: 'מזל',
    start(el) {
      let alive = true, bet = 10, spinning = false, reels = ['🍒', '🔔', '7️⃣'], msg = '', timers = [];
      function render(hl) {
        if (!alive) return;
        el.innerHTML = `<div class="msg">${msg}</div>
          <div class="row" style="gap:10px;background:linear-gradient(#2a1740,#150c25);padding:16px 18px;border-radius:18px;border:3px solid #ffb547;box-shadow:0 0 28px #ffb54755, inset 0 0 20px #0008">
            ${reels.map((s, i) => `<div id="rl${i}" style="width:82px;height:96px;border-radius:12px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:54px;box-shadow:inset 0 0 14px #0006;${hl ? 'outline:3px solid #4ade80;' : ''}">${s}</div>`).join('')}</div>
          <div class="sub">הימור: <b style="color:#ffb547">${bet}</b> 🪙</div>
          <div class="row">${[10, 50, 100, 250].map(v => `<button class="gbtn ${v === bet ? 'p' : ''}" data-bet="${v}" ${spinning ? 'disabled' : ''}>${v}</button>`).join('')}</div>
          <button class="gbtn p" id="slSpin" style="font-size:20px;padding:13px 40px" ${spinning || A.W.coins < bet ? 'disabled' : ''}>${spinning ? '…' : '🎰 סובב'}</button>
          <details class="sub" style="max-width:340px"><summary style="cursor:pointer">טבלת תשלומים</summary>
            ${SYM.map(s => `<div>${s[0]}${s[0]}${s[0]} → פי ${s[2]}</div>`).join('')}<div>🍒🍒 (כל שני דובדבנים) → פי 2</div></details>`;
        el.querySelectorAll('[data-bet]').forEach(b => b.onclick = () => { bet = +b.dataset.bet; A.sfx.click(); render(); });
        const sp = el.querySelector('#slSpin'); if (sp) sp.onclick = spin;
      }
      function spin() {
        if (spinning || A.W.coins < bet) return;
        A.coins(-bet); spinning = true; msg = '';
        const final = [pick(), pick(), pick()];
        render();
        let done = 0;
        [0, 1, 2].forEach(i => {
          const iv = setInterval(() => { const e = el.querySelector('#rl' + i); if (e) e.textContent = pick(); A.sfx.tick(); }, 70);
          timers.push(iv);
          timers.push(setTimeout(() => {
            clearInterval(iv); reels[i] = final[i]; const e = el.querySelector('#rl' + i); if (e) e.textContent = final[i]; A.sfx.card();
            if (++done === 3 && alive) {
              spinning = false; const pay = A.slotPay(final, bet);
              if (pay > bet) { msg = '🎉 זכית ב-' + pay + ' 🪙!'; A.sfx.win(); A.best('slots', pay); A.played(true); }
              else { msg = '😕 לא הפעם'; A.played(false); }
              if (pay) A.coins(pay);
              render(pay > bet);
            }
          }, 800 + i * 520));
        });
      }
      render();
      return () => { alive = false; timers.forEach(t => { clearTimeout(t); clearInterval(t); }); };
    },
  });
})();
// קלף אחרון: משחק קלפים צבעוניים נגד 3 בוטים. מי שנפטר ראשון מכל הקלפים מנצח.
// כללים: מתאימים צבע או מספר/סמל. ⛔ דילוג, 🔁 היפוך, +2 (הבא מושך 2 ומדלג), 🌈 ג'וקר (בוחרים צבע), +4 (ג'וקר והבא מושך 4).
(function () {
  const A = window.MM_ARC;
  const COL = { r: ['#e5484d', 'אדום'], y: ['#f2c12e', 'צהוב'], g: ['#2faa55', 'ירוק'], b: ['#2f7ad1', 'כחול'] };
  const buildDeck = () => {
    const d = [];
    for (const c of Object.keys(COL)) {
      d.push({ c, v: '0' });
      for (const v of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'rev', '+2']) { d.push({ c, v }); d.push({ c, v }); }
    }
    for (let i = 0; i < 4; i++) { d.push({ c: null, v: 'wild' }); d.push({ c: null, v: '+4' }); }
    return A.shuffle(d);
  };
  const SYMB = { skip: '⛔', rev: '🔁', '+2': '+2', wild: '🌈', '+4': '+4' };
  A.lastCardDeck = buildDeck;
  // האם אפשר לשחק את הקלף על הערימה (צבע נוכחי + קלף עליון)
  A.lastCardCanPlay = (card, top, color) => card.c === null || card.c === color || card.v === top.v;
  const cardHtml = (c, playable, extra) => {
    const bg = c.c ? COL[c.c][0] : 'linear-gradient(135deg,#e5484d 25%,#f2c12e 25% 50%,#2faa55 50% 75%,#2f7ad1 75%)';
    return `<button class="lc ${playable ? 'ok' : ''}" ${extra || ''} style="background:${bg}"><span>${SYMB[c.v] || c.v}</span></button>`;
  };
  const CSS = `
  .lc { width: 56px; height: 82px; border-radius: 10px; border: 3px solid #fff; color: #fff; font-weight: 900; font-size: 24px; text-shadow: 0 2px 3px #0008; box-shadow: 0 3px 8px #0008; flex: 0 0 auto; transition: transform .12s; animation: pcIn .25s ease-out; padding: 0; direction: ltr; }
  .lc span { display: block; transform: rotate(-8deg); }
  .lc.ok { transform: translateY(-9px); box-shadow: 0 0 0 3px #4ade80, 0 6px 14px #0009; cursor: pointer; }
  .lc.back { background: repeating-linear-gradient(45deg, #1a1a28, #1a1a28 6px, #2a2a40 6px, #2a2a40 12px); } .lc.sm { width: 28px; height: 40px; border-width: 2px; margin-inline-start: -16px; }
  .lcOpp { text-align: center; padding: 6px 10px; border-radius: 12px; background: #151b36; border: 2px solid transparent; min-width: 92px; }
  .lcOpp.turn { border-color: #ffb547; box-shadow: 0 0 14px #ffb54777; }
  .lcOpp b { display: block; font-size: 14px; } .lcOpp small { color: #9aa6c4; }
  .lcDot { display: inline-block; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #fff; vertical-align: middle; }
  @media (max-width: 520px) { .lc { width: 46px; height: 68px; font-size: 20px; } }`;
  let cssDone = false;
  A.addGame({
    id: 'lastcard', icon: '🃏', name: 'קלף אחרון', desc: 'משחק קלפים צבעוני נגד 3 בוטים. מי נפטר מהקלפים ראשון – מנצח!', tag: 'קלפים · נגד בוטים',
    start(el) {
      if (!cssDone) { const s = document.createElement('style'); s.textContent = CSS; document.head.appendChild(s); cssDone = true; }
      let alive = true;
      const NAMES = ['אתה', 'נובה', 'פיקסל', 'רובי'];
      let entry = 50, deck, disc, hands, turn, dir, color, over, msg, canPass, drawnThisTurn, picking, timers = [];
      const later = (fn, ms) => { const t = setTimeout(() => { if (alive) fn(); }, ms); timers.push(t); };
      function intro() {
        el.innerHTML = `<div class="msg">🃏 קלף אחרון</div><p class="sub" style="max-width:420px">נגד שלושה בוטים. בוחרים כמה לשים בקופה: המנצח לוקח את כל הקופה (פי 4 מהכניסה).<br>התאם צבע או מספר, ⛔ מדלג, 🔁 הופך כיוון, +2 / +4 גורמים לבא להרים, 🌈 בוחר צבע.</p>
          <div class="row">${[0, 50, 200].map(v => `<button class="gbtn ${v === entry ? 'p' : ''}" data-e="${v}" ${v > A.W.coins ? 'disabled' : ''}>${v ? v + ' 🪙' : 'תרגול (בחינם)'}</button>`).join('')}</div>
          <button class="gbtn g" id="lcGo" style="font-size:19px;padding:13px 36px">התחל משחק</button>`;
        el.querySelectorAll('[data-e]').forEach(b => b.onclick = () => { entry = +b.dataset.e; intro(); });
        el.querySelector('#lcGo').onclick = begin;
      }
      const draw1 = () => {
        if (!deck.length) { const top = disc.pop(); deck = A.shuffle(disc); disc = [top]; }
        return deck.length ? deck.pop() : null;
      };
      const next = (i, steps) => ((i + dir * (steps || 1)) % 4 + 4) % 4;
      const top = () => disc[disc.length - 1];
      function begin() {
        if (entry > A.W.coins) entry = 0;
        if (entry) A.coins(-entry);
        deck = buildDeck(); hands = [[], [], [], []];
        for (let k = 0; k < 7; k++) for (let i = 0; i < 4; i++) hands[i].push(deck.pop());
        let first; do { first = deck.pop(); if (first.c === null || !/^\d$/.test(first.v)) { deck.unshift(first); first = null; } } while (!first);
        disc = [first]; color = first.c; turn = 0; dir = 1; over = false; msg = 'התור שלך!'; canPass = false; drawnThisTurn = false; picking = null;
        render();
      }
      function render() {
        if (!alive) return;
        const t = top();
        const opp = i => `<div class="lcOpp ${turn === i && !over ? 'turn' : ''}"><b>${NAMES[i]}</b><div style="height:42px;padding-inline-start:16px">${Array.from({ length: Math.min(hands[i].length, 8) }, () => '<button class="lc back sm" tabindex="-1"></button>').join('')}</div><small>${hands[i].length} קלפים</small></div>`;
        el.innerHTML = `<div class="row" style="align-items:flex-start;gap:10px">${opp(1)}${opp(2)}${opp(3)}</div>
          <div class="row" style="gap:22px;margin:6px 0">
            <button class="lc back" id="lcDeck" style="${turn === 0 && !over && !canPass && !picking ? 'box-shadow:0 0 0 3px #ffb547' : ''}" title="משוך קלף"></button>
            ${cardHtml(t, false)}
            <div style="text-align:center"><span class="lcDot" style="background:${COL[color][0]}"></span><div class="sub">${COL[color][1]} ${dir === 1 ? '↻' : '↺'}</div></div></div>
          <div class="msg" id="lcMsg">${msg}</div>
          ${picking ? `<div class="row">${Object.keys(COL).map(c => `<button class="gbtn" data-pc="${c}" style="background:${COL[c][0]};border:0">${COL[c][1]}</button>`).join('')}</div>` : ''}
          ${canPass && turn === 0 && !over ? '<button class="gbtn" id="lcPass">עבור תור</button>' : ''}
          ${over ? '<div class="row"><button class="gbtn p" id="lcAgain">שחק שוב</button></div>' : ''}
          <div class="sub">הקלפים שלך (${hands[0].length})</div>
          <div class="hand">${hands[0].map((c, i) => cardHtml(c, turn === 0 && !over && !picking && A.lastCardCanPlay(c, t, color), `data-i="${i}"`)).join('')}</div>`;
        const q = s => el.querySelector(s);
        if (q('#lcDeck')) q('#lcDeck').onclick = humanDraw;
        if (q('#lcPass')) q('#lcPass').onclick = () => { canPass = false; drawnThisTurn = false; advance(1); };
        if (q('#lcAgain')) q('#lcAgain').onclick = intro;
        el.querySelectorAll('[data-pc]').forEach(b => b.onclick = () => { const c = b.dataset.pc, card = picking; picking = null; finishPlay(0, card, c); });
        el.querySelectorAll('.hand .lc').forEach(b => b.onclick = () => humanPlay(+b.dataset.i));
      }
      function humanPlay(i) {
        if (turn !== 0 || over || picking) return;
        const c = hands[0][i]; if (!A.lastCardCanPlay(c, top(), color)) { msg = 'אי אפשר לשחק את הקלף הזה'; render(); return; }
        hands[0].splice(i, 1); A.sfx.card();
        if (c.c === null) { picking = c; disc.push(c); msg = 'בחר צבע'; render(); return; }
        finishPlay(0, c, c.c, true);
      }
      function humanDraw() {
        if (turn !== 0 || over || picking || canPass) return;
        if (hands[0].some(c => A.lastCardCanPlay(c, top(), color)) && !drawnThisTurn) { msg = 'יש לך קלף לשחק – אי אפשר למשוך'; render(); return; }
        const c = draw1(); if (!c) { advance(1); return; }
        hands[0].push(c); A.sfx.card(); drawnThisTurn = true;
        if (A.lastCardCanPlay(c, top(), color)) { canPass = true; msg = 'משכת קלף שאפשר לשחק – שחק אותו או עבור'; render(); }
        else { msg = 'משכת ואין מה לשחק – עובר'; render(); later(() => { drawnThisTurn = false; advance(1); }, 700); }
      }
      // סיום שחקון קלף: (alreadyOnDiscard) מציין שהקלף כבר הונח על הערימה (ג'וקר שנבחר לו צבע)
      function finishPlay(who, c, chosen, normal) {
        if (normal) disc.push(c);
        color = c.c || chosen; canPass = false; drawnThisTurn = false;
        if (!hands[who].length) { return end(who); }
        let steps = 1, m = NAMES[who] + ' שיחק ' + (SYMB[c.v] || c.v) + (c.c ? '' : ' וביקש ' + COL[color][1]);
        const n = next(who, 1);
        if (c.v === 'skip') { steps = 2; m += ' – ' + NAMES[n] + ' מדלג'; }
        else if (c.v === 'rev') { dir = -dir; m += ' – כיוון הפוך'; }
        else if (c.v === '+2' || c.v === '+4') { const k = c.v === '+2' ? 2 : 4; for (let j = 0; j < k; j++) { const x = draw1(); if (x) hands[n].push(x); } steps = 2; m += ' – ' + NAMES[n] + ' מושך ' + k; }
        msg = m; advance(steps, true);
      }
      function advance(steps, keepMsg) {
        turn = next(turn, steps); picking = null;
        if (!keepMsg) msg = turn === 0 ? 'התור שלך!' : 'התור של ' + NAMES[turn];
        else if (turn === 0) msg += ' · התור שלך!';
        render();
        if (turn !== 0 && !over) later(botTurn, 900);
      }
      function botTurn() {
        if (over || turn === 0) return;
        const i = turn, h = hands[i], t = top();
        const ok = h.map((c, k) => k).filter(k => A.lastCardCanPlay(h[k], t, color));
        let k = null;
        if (ok.length) {
          const pressure = hands.some((x, j) => j !== i && x.length <= 2);
          const normal = ok.filter(x => h[x].c !== null), special = normal.filter(x => !/^\d$/.test(h[x].v));
          k = pressure && special.length ? special[0] : normal.length ? normal[Math.floor(Math.random() * normal.length)] : ok[0];
        } else {
          const c = draw1();
          if (c) { h.push(c); A.sfx.card(); if (A.lastCardCanPlay(c, t, color)) k = h.length - 1; }
          if (k === null) { msg = NAMES[i] + ' משך קלף ועבר'; advance(1, true); return; }
        }
        const c = h.splice(k, 1)[0]; disc.push(c); A.sfx.card();
        let chosen = c.c;
        if (c.c === null) { const cnt = {}; h.forEach(x => { if (x.c) cnt[x.c] = (cnt[x.c] || 0) + 1; }); chosen = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0] || Object.keys(COL)[Math.floor(Math.random() * 4)]; }
        finishPlay(i, c, chosen, false);
      }
      function end(who) {
        over = true; const won = who === 0;
        msg = won ? '🏆 ניצחת!' + (entry ? ' (+' + entry * 4 + ' 🪙)' : '') : '😕 ' + NAMES[who] + ' ניצח';
        if (won && entry) { A.coins(entry * 4); A.best('lastcard', entry * 3); }
        A.played(won); won ? A.sfx.win() : A.sfx.lose(); render();
      }
      A.lastCardDebug = () => ({ hands, disc, deck, turn, dir, color, over });
      intro();
      return () => { alive = false; timers.forEach(clearTimeout); };
    },
  });
})();
// 2048: מחליקים אריחים (חיצים / WASD / החלקה במסך), מחברים שווים ומגיעים ל-2048. כל 250 נקודות = מטבע.
(function () {
  const A = window.MM_ARC;
  const COLORS = { 2: '#eee4da', 4: '#ede0c8', 8: '#f2b179', 16: '#f59563', 32: '#f67c5f', 64: '#f65e3b', 128: '#edcf72', 256: '#edcc61', 512: '#edc850', 1024: '#edc53f', 2048: '#edc22e' };
  // החלקה של שורה אחת שמאלה: מחזיר [שורה חדשה, ניקוד שנוסף]
  A.slideRow = row => {
    const a = row.filter(x => x); let score = 0;
    for (let i = 0; i < a.length - 1; i++) if (a[i] === a[i + 1]) { a[i] *= 2; score += a[i]; a.splice(i + 1, 1); }
    while (a.length < row.length) a.push(0);
    return [a, score];
  };
  A.move2048 = (g, dir) => { // dir: 0 שמאלה, 1 למעלה, 2 ימינה, 3 למטה
    const N = 4, out = g.slice(); let score = 0, moved = false;
    const get = (l, k) => dir === 0 ? l * N + k : dir === 2 ? l * N + (N - 1 - k) : dir === 1 ? k * N + l : (N - 1 - k) * N + l;
    for (let l = 0; l < N; l++) {
      const row = Array.from({ length: N }, (_, k) => g[get(l, k)]);
      const [nr, sc] = A.slideRow(row); score += sc;
      nr.forEach((v, k) => { if (out[get(l, k)] !== v) moved = true; out[get(l, k)] = v; });
    }
    return { g: out, score, moved };
  };
  const canMove = g => [0, 1, 2, 3].some(d => A.move2048(g, d).moved);
  A.addGame({
    id: 'g2048', icon: '🔢', name: '2048', desc: 'חבר אריחים שווים והגע ל-2048. חיצים או החלקה.', tag: 'חידה',
    start(el) {
      let alive = true, g, score, over, won, prev;
      const spawn = () => { const e = g.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (e.length) g[e[Math.floor(Math.random() * e.length)]] = Math.random() < 0.9 ? 2 : 4; };
      function fresh() { g = Array(16).fill(0); score = 0; over = false; won = false; prev = null; spawn(); spawn(); render(); }
      function render() {
        if (!alive) return;
        el.innerHTML = `<div class="row" style="gap:14px"><div class="gbtn" style="cursor:default">ניקוד: <b>${score}</b></div><div class="gbtn" style="cursor:default">שיא: <b>${A.W.best.g2048 || 0}</b></div></div>
          <div id="gBoard" style="position:relative;display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:8px;background:#3a3a50;border-radius:14px;width:min(340px,88vw);touch-action:none;direction:ltr">
            ${g.map(v => `<div style="aspect-ratio:1;border-radius:9px;background:${v ? (COLORS[v] || '#3c3a32') : '#4c4c66'};color:${v > 4 ? '#fff' : '#5a4a3a'};font-weight:900;font-size:${v >= 1024 ? 22 : v >= 128 ? 28 : 34}px;display:flex;align-items:center;justify-content:center;${v ? 'animation:pcIn .18s ease-out' : ''}">${v || ''}</div>`).join('')}
            ${over ? '<div style="position:absolute;inset:0;background:#000b;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;font-size:26px;font-weight:900">אין מהלכים 😵</div>' : ''}</div>
          <div class="msg">${won && !over ? '🎉 הגעת ל-2048! אפשר להמשיך' : ''}</div>
          <div class="row"><button class="gbtn" id="gUndo" ${prev ? '' : 'disabled'}>↩ בטל מהלך</button><button class="gbtn p" id="gNew">משחק חדש</button></div>`;
        el.querySelector('#gNew').onclick = () => { finish(); fresh(); };
        el.querySelector('#gUndo').onclick = () => { if (prev) { g = prev.g; score = prev.score; prev = null; over = false; render(); } };
        const b = el.querySelector('#gBoard');
        let sx = 0, sy = 0;
        b.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        b.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return; go(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3)); });
      }
      let coinsGiven = 0;
      function finish() { const c = Math.floor(score / 250) - coinsGiven; if (c > 0) A.coins(c); coinsGiven = 0; if (score) { A.best('g2048', score); } }
      function go(d) {
        if (over) return;
        const r = A.move2048(g, d); if (!r.moved) return;
        prev = { g: g.slice(), score }; g = r.g; score += r.score; spawn(); A.sfx.click();
        if (!won && g.includes(2048)) { won = true; A.sfx.win(); A.played(true); }
        const c = Math.floor(score / 250); if (c > coinsGiven) { A.coins(c - coinsGiven); coinsGiven = c; A.sfx.coin(); }
        if (!canMove(g)) { over = true; if (!won) { A.played(false); A.sfx.lose(); } A.best('g2048', score); }
        render();
      }
      const onKey = e => {
        const m = { ArrowLeft: 0, a: 0, ArrowUp: 1, w: 1, ArrowRight: 2, d: 2, ArrowDown: 3, s: 3 }[e.key];
        if (m !== undefined) { e.preventDefault(); go(m); }
      };
      document.addEventListener('keydown', onKey);
      fresh();
      return () => { alive = false; document.removeEventListener('keydown', onKey); if (score) A.best('g2048', score); };
    },
  });
})();
// נחש: אוכלים תפוחים, תפוח זהוב כל 5 תפוחים (שווה פי 3), המהירות עולה. חיצים / WASD / החלקה / כפתורי כיוון. כל תפוח = מטבע.
(function () {
  const A = window.MM_ARC;
  const N = 18, CELL = 20;
  A.addGame({
    id: 'snake', icon: '🐍', name: 'נחש', desc: 'אכול תפוחים, גדל ואל תתנגש. תפוח זהוב שווה פי 3!', tag: 'ארקייד',
    start(el) {
      let alive = true, iv = null, snake, dir, queue, apple, golden, score, eaten, speed, running, dead;
      const place = () => { let p; do { p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; } while (snake.some(s => s.x === p.x && s.y === p.y)); return p; };
      function reset() { snake = [{ x: 9, y: 9 }, { x: 8, y: 9 }, { x: 7, y: 9 }]; dir = { x: 1, y: 0 }; queue = []; score = 0; eaten = 0; speed = 140; running = false; dead = false; apple = place(); golden = false; }
      function ui() {
        el.innerHTML = `<div class="row" style="gap:12px"><div class="gbtn" style="cursor:default">ניקוד: <b id="snS">0</b></div><div class="gbtn" style="cursor:default">שיא: <b>${A.W.best.snake || 0}</b></div></div>
          <canvas id="snC" width="${N * CELL}" height="${N * CELL}" style="width:min(360px,90vw);border-radius:12px;border:3px solid #36406a;background:#0d1226;touch-action:none"></canvas>
          <div class="msg" id="snM">לחץ על חץ או החלק כדי להתחיל</div>
          <div class="row" style="direction:ltr"><div style="display:grid;grid-template-columns:repeat(3,54px);gap:6px;justify-items:center">
            <span></span><button class="gbtn" data-d="0,-1">▲</button><span></span><button class="gbtn" data-d="-1,0">◀</button><button class="gbtn" data-d="0,1">▼</button><button class="gbtn" data-d="1,0">▶</button></div></div>
          <button class="gbtn p" id="snNew">משחק חדש</button>`;
        el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const [x, y] = b.dataset.d.split(',').map(Number); turn(x, y); });
        el.querySelector('#snNew').onclick = () => { stopLoop(); reset(); ui(); draw(); };
        const c = el.querySelector('#snC'); let sx = 0, sy = 0;
        c.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; }, { passive: true });
        c.addEventListener('touchend', e => { const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return; Math.abs(dx) > Math.abs(dy) ? turn(dx < 0 ? -1 : 1, 0) : turn(0, dy < 0 ? -1 : 1); });
        c.addEventListener('mousedown', e => { /* לחיצה על הלוח מתחילה */ if (!running && !dead) start(); });
      }
      function turn(x, y) {
        if (dead) return;
        const last = queue.length ? queue[queue.length - 1] : dir;
        if (last.x === -x && last.y === -y) return; // אין פנייה לאחור
        if (last.x === x && last.y === y) { if (!running) start(); return; }
        if (queue.length < 3) queue.push({ x, y });
        if (!running) start();
      }
      function start() { if (running || dead) return; running = true; el.querySelector('#snM').textContent = ''; loop(); }
      function stopLoop() { if (iv) { clearTimeout(iv); iv = null; } running = false; }
      function loop() { iv = setTimeout(() => { if (!alive || !running) return; step(); if (running) loop(); }, speed); }
      function step() {
        if (queue.length) dir = queue.shift();
        const h = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
        if (h.x < 0 || h.y < 0 || h.x >= N || h.y >= N || snake.some((s, i) => i < snake.length - 1 && s.x === h.x && s.y === h.y)) return die();
        snake.unshift(h);
        if (h.x === apple.x && h.y === apple.y) {
          const pts = golden ? 3 : 1; score += pts; eaten++; A.sfx.coin();
          golden = eaten % 5 === 4; apple = place(); speed = Math.max(70, 140 - eaten * 3);
          const s = el.querySelector('#snS'); if (s) s.textContent = score;
        } else snake.pop();
        draw();
      }
      function die() {
        stopLoop(); dead = true; A.sfx.lose(); A.played(score >= 10); if (score) A.coins(score); A.best('snake', score);
        draw(); const m = el.querySelector('#snM'); if (m) m.textContent = '💥 הפסדת! ניקוד ' + score + (score ? ' (+' + score + ' 🪙)' : '');
      }
      function draw() {
        const c = el.querySelector('#snC'); if (!c) return; const g = c.getContext('2d');
        g.fillStyle = '#0d1226'; g.fillRect(0, 0, N * CELL, N * CELL);
        g.fillStyle = '#131a36'; for (let x = 0; x < N; x++) for (let y = 0; y < N; y++) if ((x + y) % 2) g.fillRect(x * CELL, y * CELL, CELL, CELL);
        g.font = (CELL - 3) + 'px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(golden ? '🌟' : '🍎', apple.x * CELL + CELL / 2, apple.y * CELL + CELL / 2 + 1);
        snake.forEach((s, i) => { g.fillStyle = dead ? '#777' : i === 0 ? '#7dff9a' : `hsl(${140 - i * 2},65%,${48 - Math.min(i, 14)}%)`; g.beginPath(); g.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 7 : 5); g.fill(); });
        const h = snake[0]; g.fillStyle = '#111'; g.fillRect(h.x * CELL + 5 + dir.x * 3, h.y * CELL + 6 + dir.y * 3, 3, 3); g.fillRect(h.x * CELL + 12 + dir.x * 3, h.y * CELL + 6 + dir.y * 3, 3, 3);
      }
      const onKey = e => {
        const m = { ArrowLeft: [-1, 0], a: [-1, 0], ArrowUp: [0, -1], w: [0, -1], ArrowRight: [1, 0], d: [1, 0], ArrowDown: [0, 1], s: [0, 1] }[e.key];
        if (m) { e.preventDefault(); turn(m[0], m[1]); }
      };
      document.addEventListener('keydown', onKey);
      reset(); ui(); draw();
      A.snakeDebug = { step: () => step(), state: () => ({ snake, apple, score, dead, dir }), setApple: p => { apple = p; } };
      return () => { alive = false; stopLoop(); document.removeEventListener('keydown', onKey); };
    },
  });
})();
// שולה מוקשים: 9×9 עם 10 מוקשים. הלחיצה הראשונה תמיד בטוחה. קליק ימני / לחיצה ארוכה / "מצב דגל" מסמנים. ניצחון = 30 מטבעות + בונוס מהירות.
(function () {
  const A = window.MM_ARC;
  const R = 9, C = 9, M = 10;
  const around = (i) => { const r = Math.floor(i / C), c = i % C, o = []; for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { if (!dr && !dc) continue; const rr = r + dr, cc = c + dc; if (rr >= 0 && rr < R && cc >= 0 && cc < C) o.push(rr * C + cc); } return o; };
  A.minesPlace = (safe) => { // פיזור מוקשים בלי התא הראשון ושכניו; מחזיר מערך מוקשים ומספרי שכנים
    const ban = new Set([safe, ...around(safe)]), cells = A.shuffle(Array.from({ length: R * C }, (_, i) => i).filter(i => !ban.has(i)));
    const mine = Array(R * C).fill(false); cells.slice(0, M).forEach(i => mine[i] = true);
    const num = mine.map((m, i) => around(i).filter(j => mine[j]).length);
    return { mine, num };
  };
  const COLS = ['', '#4aa3ff', '#4ade80', '#ff6b6b', '#8a7dff', '#ff9a4a', '#3be3d0', '#ddd', '#999'];
  A.addGame({
    id: 'mines', icon: '💣', name: 'שולה מוקשים', desc: 'חשוף את כל התאים הבטוחים בלי לפגוע במוקש.', tag: 'חשיבה',
    start(el) {
      let alive = true, field = null, open, flag, state, flagMode = false, t0 = 0, timer = null, time = 0;
      function fresh() { field = null; open = Array(R * C).fill(false); flag = Array(R * C).fill(false); state = 'ready'; time = 0; clearInterval(timer); timer = null; render(); }
      function render() {
        if (!alive) return;
        const left = M - flag.filter(Boolean).length;
        el.innerHTML = `<div class="row" style="gap:12px"><div class="gbtn" style="cursor:default">💣 ${left}</div><div class="gbtn" style="cursor:default">⏱ ${time}</div><div class="gbtn" style="cursor:default">שיא: ${A.W.best.mines ? A.W.best.mines : '-'}</div></div>
          <div id="mnB" style="display:grid;grid-template-columns:repeat(${C},34px);gap:3px;direction:ltr;user-select:none;-webkit-user-select:none">
            ${Array.from({ length: R * C }, (_, i) => {
              let txt = '', st = 'background:#2a3566;', cls = '';
              if (open[i]) { st = 'background:#171e3d;'; if (field && field.mine[i]) { txt = '💥'; st = 'background:#7a1f24;'; } else if (field && field.num[i]) txt = `<b style="color:${COLS[field.num[i]]}">${field.num[i]}</b>`; }
              else if (flag[i]) txt = '🚩';
              else if (state === 'lost' && field && field.mine[i]) { txt = '💣'; st = 'background:#4a2030;'; }
              return `<button data-c="${i}" style="${st}width:34px;height:34px;border-radius:6px;font-size:17px;padding:0;color:#fff;border:1px solid #4150887a">${txt}</button>`;
            }).join('')}</div>
          <div class="msg">${state === 'won' ? '🎉 ניצחת! ' + time + ' שניות' : state === 'lost' ? '💥 פגעת במוקש' : ''}</div>
          <div class="row"><button class="gbtn ${flagMode ? 'p' : ''}" id="mnFlag">🚩 מצב דגל: ${flagMode ? 'פעיל' : 'כבוי'}</button><button class="gbtn p" id="mnNew">משחק חדש</button></div>
          <p class="sub">במחשב: קליק ימני לדגל · בטלפון: לחיצה ארוכה או "מצב דגל"</p>`;
        el.querySelector('#mnNew').onclick = fresh;
        el.querySelector('#mnFlag').onclick = () => { flagMode = !flagMode; render(); };
        el.querySelectorAll('#mnB button').forEach(b => {
          const i = +b.dataset.c; let lp = null, fired = false;
          b.onpointerdown = () => { fired = false; lp = setTimeout(() => { fired = true; toggleFlag(i); }, 380); };
          b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearTimeout(lp);
          b.onclick = () => { if (fired) return; flagMode ? toggleFlag(i) : reveal(i); };
          b.oncontextmenu = e => { e.preventDefault(); toggleFlag(i); };
        });
      }
      function toggleFlag(i) { if (state === 'won' || state === 'lost' || open[i]) return; flag[i] = !flag[i]; A.sfx.click(); render(); }
      function reveal(i) {
        if (state === 'won' || state === 'lost' || flag[i] || open[i]) return;
        if (!field) { field = A.minesPlace(i); state = 'play'; t0 = Date.now(); timer = setInterval(() => { time = Math.floor((Date.now() - t0) / 1000); const e = el.querySelector('.row .gbtn:nth-child(2)'); if (e) e.textContent = '⏱ ' + time; }, 500); }
        if (field.mine[i]) { open[i] = true; state = 'lost'; clearInterval(timer); A.sfx.lose(); A.played(false); render(); return; }
        const st = [i];
        while (st.length) { const k = st.pop(); if (open[k] || flag[k]) continue; open[k] = true; if (!field.num[k]) around(k).forEach(j => { if (!open[j] && !field.mine[j]) st.push(j); }); }
        A.sfx.click();
        if (open.filter(Boolean).length === R * C - M) {
          state = 'won'; clearInterval(timer); time = Math.floor((Date.now() - t0) / 1000);
          const bonus = Math.max(0, 60 - time); A.coins(30 + Math.floor(bonus / 2)); A.sfx.win(); A.played(true);
          if (!A.W.best.mines || time < A.W.best.mines) { A.W.best.mines = time; A.save(); }
        }
        render();
      }
      A.minesDebug = () => ({ field, open, state });
      A.minesReveal = i => reveal(i);
      fresh();
      return () => { alive = false; clearInterval(timer); };
    },
  });
})();
window.MM_ARC.init();

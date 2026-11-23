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

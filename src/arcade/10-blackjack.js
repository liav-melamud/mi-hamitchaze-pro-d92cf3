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

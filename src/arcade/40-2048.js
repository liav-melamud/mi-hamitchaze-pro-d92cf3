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

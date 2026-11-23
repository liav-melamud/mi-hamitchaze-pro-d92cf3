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

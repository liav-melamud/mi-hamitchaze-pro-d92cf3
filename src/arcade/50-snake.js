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

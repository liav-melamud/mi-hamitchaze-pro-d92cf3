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

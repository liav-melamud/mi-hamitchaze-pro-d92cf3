
// ---------- אנימציית חיסול (3 שניות) במבט של הקורבן. הסגנון תלוי בתלבושת של ההורג ----------
(function () {
  var EN = window.MM_LANG === 'en', cvK = null, g = null, run = null, lastAt = 0;
  // תלבושת (מספר) -> סגנון חיסול
  var STYLE = { 10: 'claws', 16: 'claws', 17: 'claws', 13: 'claws', 1: 'tether', 4: 'tether', 6: 'tether', 7: 'tether', 9: 'tether', 11: 'zap', 8: 'zap', 14: 'zap', 3: 'zap', 15: 'magic', 5: 'magic', 12: 'magic', 18: 'magic', 2: 'magic' };
  var DUR = 3;
  var ease = function (x) { x = Math.max(0, Math.min(1, x)); return 1 - Math.pow(1 - x, 3); };
  var cl = function (x) { return Math.max(0, Math.min(1, x)); };

  function ensure() {
    if (cvK) return; cvK = document.createElement('canvas'); cvK.id = 'killAnim';
    cvK.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:80;pointer-events:none;display:none';
    document.body.appendChild(cvK); g = cvK.getContext('2d');
  }
  function drone(x, y, sc, rot, color, hat, dir, ghost) {
    var saved = ctx, kyS = typeof KY !== 'undefined' ? KY : 1;
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(sc, sc);
    try { ctx = g; try { KY = 1; } catch (e) {} drawDrone(0, 0, color, dir, { hat: hat, ghost: ghost, noShadow: true }); } finally { ctx = saved; try { KY = kyS; } catch (e) {} g.restore(); }
  }
  function streakBand(W, H, yBase, up, off, amp) { // פס אדום משונן כמו ברקע חיסול
    g.beginPath(); g.moveTo(-60, yBase);
    for (var x = -60, i = 0; x <= W + 120; x += 46, i++) { var n = Math.sin(i * 12.9898 + off) * 43758.5453; n -= Math.floor(n); g.lineTo(x, yBase + up * (amp * (0.35 + n * 0.9))); }
    g.lineTo(W + 120, yBase); g.closePath(); g.fillStyle = '#e1141b'; g.fill();
    g.strokeStyle = '#ff6a5e'; g.lineWidth = 3; g.stroke();
  }
  function claw(x, y, s, rot) { // כף יד אדומה גדולה
    g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
    g.fillStyle = '#e1141b'; g.strokeStyle = '#2a0508'; g.lineWidth = 4;
    g.beginPath(); g.ellipse(0, 0, 26, 30, 0, 0, 7); g.fill(); g.stroke();
    for (var i = 0; i < 4; i++) { g.save(); g.rotate(-0.55 + i * 0.37); g.beginPath(); g.ellipse(0, -42, 9, 22, 0, 0, 7); g.fill(); g.stroke(); g.restore(); }
    g.save(); g.rotate(1.15); g.beginPath(); g.ellipse(0, -30, 9, 18, 0, 0, 7); g.fill(); g.stroke(); g.restore();
    g.restore();
  }
  function bolt(x1, y1, x2, y2, t) {
    g.save(); g.strokeStyle = '#fff36a'; g.lineWidth = 10; g.shadowColor = '#fff'; g.shadowBlur = 24; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x1, y1);
    var n = 9; for (var i = 1; i < n; i++) { var k = i / n; g.lineTo(x1 + (x2 - x1) * k + Math.sin(i * 7 + t * 40) * 38, y1 + (y2 - y1) * k + Math.cos(i * 5 + t * 33) * 38); }
    g.lineTo(x2, y2); g.stroke(); g.restore();
  }
  function star(x, y, r, rot, col) { g.save(); g.translate(x, y); g.rotate(rot); g.fillStyle = col; g.beginPath(); for (var i = 0; i < 10; i++) { var rr = i % 2 ? r * 0.42 : r, a = i * Math.PI / 5; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); g.restore(); }

  function frame(T, kd) {
    var W = cvK.width, H = cvK.height, sc = Math.min(W / 2.1, H) / 110, st = STYLE[kd.by.hat] || 'slash';
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, H);
    var a = cl(T / 0.18) * (1 - cl((T - 2.65) / 0.35)); g.globalAlpha = a;
    // רקע ורוד-לבן + קווי מהירות
    var bg = g.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, Math.max(W, H) * 0.7); bg.addColorStop(0, '#fff1ee'); bg.addColorStop(1, '#ffa99f'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 5;
    for (var i = 0; i < 16; i++) { var yy = ((i * 97) % 100) / 100 * H, len = W * (0.25 + ((i * 53) % 40) / 100), xx = (W - ((T * 2600 + i * 331) % (W + len))); g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + len, yy); g.stroke(); }
    // פסים אדומים: למעלה, למטה, ופס גדול שעובר באמצע בהתחלה
    streakBand(W, H, 0, 1, 1.3, H * 0.2); streakBand(W, H, H, -1, 7.1, H * 0.2);
    if (T < 0.9) { g.save(); g.translate(W * (1 - ease(T / 0.9)) * 1.6 - W * 0.1, 0); streakBand(W, H, H * 0.3, 1, 3.3, H * 0.16); streakBand(W, H, H * 0.7, -1, 5.5, H * 0.16); g.restore(); }
    // הדמויות
    var cx = W * 0.58, cy = H * 0.52, kx, ky = cy, rotV = 0, vx = cx, vy = cy, vs = 1, kRot = 0, ghost = false;
    kx = -W * 0.2 + (W * 0.3 + W * 0.2) * ease((T - 0.15) / 0.95);
    var act = cl((T - 1.15) / 0.7), hit = T > 1.5 && T < 2.0;
    if (st === 'slash') kx += W * 0.1 * Math.sin(act * Math.PI) + (act > 0 ? W * 0.05 * ease(act * 2) : 0);
    if (st === 'tether' && T > 1.2) vx -= W * 0.05 * ease((T - 1.25) / 0.6) * (T < 2 ? 1 : 0);
    if (hit) { vx += Math.sin(T * 90) * 9; vs = 0.86 + 0.12 * Math.sin(T * 60); }
    if (T >= 2.0) { var q = T - 2.0; vx += q * q * W * 1.1; vy -= q * H * 0.18; rotV = q * 13; ghost = true; vs = 1 - q * 0.25; }
    var in3d = false;
    try { in3d = !!(window.MM_KILL3D && window.MM_KILL3D(g, W, H, kd, { x: kx, y: ky, sc: sc, rot: kRot }, { x: vx, y: vy, sc: sc * vs, rot: rotV, ghost: ghost })); } catch (e) { console.error(e); }
    if (!in3d) { drone(kx, ky, sc, kRot, kd.by.color, kd.by.hat, 1, false); drone(vx, vy, sc * vs, rotV, kd.me.color, kd.me.hat, -1, ghost); }
    // אפקט לפי הסגנון
    if (st === 'slash' && T > 1.35 && T < 2.2) { var p = cl((T - 1.35) / 0.2); g.strokeStyle = '#fff'; g.lineWidth = 14; g.lineCap = 'round'; g.shadowColor = '#e1141b'; g.shadowBlur = 20;
      g.beginPath(); g.moveTo(cx - 90 * sc * p, cy - 70 * sc * p); g.lineTo(cx + 90 * sc * p, cy + 70 * sc * p); g.stroke(); g.beginPath(); g.moveTo(cx + 90 * sc * p, cy - 70 * sc * p); g.lineTo(cx - 90 * sc * p, cy + 70 * sc * p); g.stroke(); g.shadowBlur = 0; }
    if (st === 'claws' && T > 1.1 && T < 2.3) { var k2 = ease((T - 1.1) / 0.35), sl = T > 1.5 ? ease((T - 1.5) / 0.15) : 0;
      claw(vx - 90 * sc * (1 - k2) - 14 * sc * sl, vy - 30 * sc + (1 - k2) * -60 * sc, sc * 0.5, 0.6 - sl * 0.5); claw(vx + 90 * sc * (1 - k2) + 14 * sc * sl, vy - 22 * sc + (1 - k2) * -60 * sc, sc * 0.5, -0.6 + sl * 0.5); }
    if (st === 'tether' && T > 1.0 && T < 2.25) { var tk = ease((T - 1.0) / 0.3); g.strokeStyle = '#2a2230'; g.lineWidth = 6 * sc / 3; g.beginPath(); g.moveTo(kx + 12 * sc, ky - 4 * sc); g.lineTo(kx + 12 * sc + (vx - kx - 12 * sc) * tk, ky - 4 * sc + (vy - ky) * tk); g.stroke(); g.fillStyle = '#2a2230'; g.beginPath(); g.arc(kx + 12 * sc + (vx - kx - 12 * sc) * tk, ky - 4 * sc + (vy - ky) * tk, 6 * sc / 2, 0, 7); g.fill(); }
    if (st === 'zap' && T > 1.2 && T < 2.2 && Math.floor(T * 20) % 2 === 0) { bolt(kx + 14 * sc, ky - 20 * sc, vx, vy, T); g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, 0, W, H); }
    if (st === 'magic' && T > 1.2 && T < 2.4) { for (var j = 0; j < 12; j++) { var an = j * 0.52 + T * 4, rr = (T - 1.2) * sc * 90 + 20; star(vx + Math.cos(an) * rr, vy + Math.sin(an) * rr, 14 * sc / 2, an * 2, j % 2 ? '#ffd166' : '#fff'); }
      g.strokeStyle = '#c9a0ff'; g.lineWidth = 8; g.beginPath(); g.arc(vx, vy, (T - 1.2) * sc * 120, 0, 7); g.stroke(); }
    if (T > 1.45 && T < 1.62) { g.fillStyle = 'rgba(255,255,255,.75)'; g.fillRect(0, 0, W, H); } // הבזק הפגיעה
    // כיתוב
    g.globalAlpha = a * cl((T - 0.5) / 0.3); g.textAlign = 'center'; g.font = 'bold ' + Math.round(Math.min(W, H) * 0.075) + 'px Rubik, Arial'; g.lineWidth = 8; g.strokeStyle = '#2a0508'; g.fillStyle = '#fff';
    var msg = (EN ? '🔪 ' + kd.by.name + ' got you!' : '🔪 ' + kd.by.name + ' חיסל אותך!'); g.strokeText(msg, W / 2, H * 0.9); g.fillText(msg, W / 2, H * 0.9);
    g.globalAlpha = 1;
  }
  function play(kd, freeze) {
    ensure(); var dpr = Math.min(window.devicePixelRatio || 1, 1.5); cvK.width = Math.round(innerWidth * dpr); cvK.height = Math.round(innerHeight * dpr); cvK.style.display = 'block';
    var t0 = performance.now(); run = { kd: kd };
    (function loop() {
      if (run && run.kd !== kd) return;
      var T = freeze != null ? freeze : (performance.now() - t0) / 1000;
      if (T >= DUR) { cvK.style.display = 'none'; run = null; return; }
      try { frame(T, kd); } catch (e) { console.error(e); cvK.style.display = 'none'; run = null; return; }
      if (freeze == null) requestAnimationFrame(loop);
    })();
  }
  window.MM_KILLANIM = { play: play };
  setInterval(function () {
    try {
      var k = typeof S !== 'undefined' && S && S.kd;
      if (k && k.at !== lastAt) { lastAt = k.at; if (k.ago < 2.5 && S.phase === 'play') play(k); }
    } catch (e) {}
  }, 120);
})();

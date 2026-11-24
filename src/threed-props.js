// ריהוט החדרים בתלת מימד: אותם פריטים כמו בתצוגה הרגילה (drawDecor), רק עם נפח. וקישוטי חנוכה.
(function () {
  var Z = window.MM_3D;
  var TYPE_OF = { U: 'engine', D: 'engine', R: 'reactor', M: 'med', F: 'cafe', W: 'weapons', O: 'oxygen', SE: 'sec', EL: 'elec', A: 'admin', N: 'nav', T: 'storage', C: 'comms', SH: 'shield', HB: 'beds', LB: 'lab', MH: 'round', GH: 'greenhouse', DR: 'drill', SC: 'sec2', HT: 'boiler', OB: 'obs', GR: 'garage', GN: 'gen', ST: 'icecrates', RD: 'radar' };
  var rot = function (m, f) { return function (t) { f(m, t); }; };

  Z.roomProps = function (k, r, A, idx, fallback) {
    var X = r.x, Y = r.y, type = r.type || TYPE_OF[k] || fallback, cx = r.cx, cy = r.cy;
    var glow = function (t) { return 0.6 + 0.4 * Math.sin(t / 300); };
    var screens = function (x, y, n, step, w, cols) { for (var i = 0; i < n; i++) { A.B(x + i * step, y, w, 30, 26, 0x3b4255, 0, {}); var s = A.GL(x + i * step + 4, y + 8, w - 8, 3, 18, cols[i % cols.length], 26); } };
    switch (type) {
      case 'engine': {
        var ey = Y + 70, cyE = ey + 62;
        A.GL(X + 24, ey + 150, 190, 10, 1.5, 0xd9a82b, 0.6);
        A.B(X + 66, ey + 14, 138, 98, 52, 0x8b94a6, 0, { metalness: 0.7, roughness: 0.35 });
        [98, 134, 170].forEach(function (dx) { A.B(X + dx, ey + 12, 8, 102, 56, 0x3a4050, 0); });
        A.B(X + 150, ey + 52, 40, 22, 14, 0xa8372a, 52); A.GL(X + 154, ey + 56, 32, 14, 4, 0xffc85a, 66);
        A.C(X + 114, ey + 38, 11, 3, 0xf1f3f7, 52);
        A.C(X + 62, cyE, 50, 14, 0x566075, 0, { metalness: 0.7 });
        var fan = new THREE.Group(); fan.position.set(X + 62, 16, cyE); A.add(fan);
        for (var i = 0; i < 6; i++) { var bl = new THREE.Mesh(new THREE.BoxGeometry(40, 2, 9), A.mat(i % 2 ? 0x7d8799 : 0x9aa4b5)); bl.rotation.y = i * Math.PI / 3; bl.position.set(0, 0, 0); var pv = new THREE.Group(); pv.rotation.y = i * Math.PI / 3; bl.position.x = 16; pv.add(bl); fan.add(pv); }
        A.anim(function (t) { fan.rotation.y = t / 120; });
        A.C(X + 232, cyE, 30, 70, 0x3a404d, 0, {}, 22);
        var fl = A.GL(X + 236, cyE - 18, 34, 36, 30, 0xff9a3c, 20); A.anim(function (t) { fl.scale.set(0.8 + glow(t) * 0.6, 1, 1); });
        A.C(X + 250, ey + 18, 4, 40, 0xb08a4a, 0); A.B(X + 190, ey + 14, 60, 8, 8, 0x7a5c2e, 40);
        break;
      }
      case 'reactor': {
        [[-95, -95], [95, -95], [-95, 95], [95, 95]].forEach(function (d) { A.B(cx + d[0] - 12, cy + 10 + d[1] - 12, 24, 24, 50, 0x4d5466); });
        A.C(cx, cy + 10, 70, 12, 0x262b38, 0, { metalness: 0.6 });
        var core = A.C(cx, cy + 10, 46, 54, 0x55e0ff, 12, { emissive: 0x1a6a80, transparent: true, opacity: 0.8 });
        var ball = A.S(cx, cy + 10, 22, 0xdffbff, 40, { emissive: 0xaaeeff });
        var sp = new THREE.Group(); sp.position.set(cx, 8, cy + 10); A.add(sp);
        for (var q = 0; q < 4; q++) { var sb = new THREE.Mesh(new THREE.BoxGeometry(46, 3, 5), A.mat(0x58607a)); sb.position.x = 26; var pv2 = new THREE.Group(); pv2.rotation.y = q * Math.PI / 2; pv2.add(sb); sp.add(pv2); }
        A.anim(function (t) { sp.rotation.y = t / 1500; core.material.emissiveIntensity = 0.6 + 0.8 * glow(t); ball.scale.setScalar(0.9 + 0.2 * glow(t)); });
        break;
      }
      case 'med': {
        [130, 200].forEach(function (dx) { A.B(X + dx, Y + 120, 50, 100, 20, 0xcfd8e3, 6, { metalness: 0.3 }); A.B(X + dx + 6, Y + 126, 38, 20, 8, 0xffffff, 26); A.B(X + dx, Y + 160, 50, 60, 12, 0x5aa0d8, 26); });
        var pad = A.DISC(X + 220, Y + 140, 32, 0x46aaff, 1.5, 0.35); A.anim(function (t) { pad.material.opacity = 0.25 + 0.3 * glow(t); });
        A.B(X + 20, Y + 44, 60, 34, 30, 0xe8eef5, 0); A.GL(X + 45, Y + 50, 10, 22, 2, 0xe53935, 31); A.GL(X + 39, Y + 56, 22, 10, 2, 0xe53935, 31);
        break;
      }
      case 'cafe': {
        [[120, 110], [380, 110], [120, 260], [380, 260]].forEach(function (p) {
          var tx = X + p[0], ty = Y + p[1];
          for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; A.C(tx + Math.cos(a) * 46, ty + Math.sin(a) * 46, 9, 16, 0x6b4b33); }
          A.C(tx, ty, 32, 24, 0x9aa4b5, 0, { metalness: 0.4 }); A.C(tx, ty, 8, 14, 0x5b6577, 24);
          A.C(tx + 12, ty - 8, 7, 4, 0xe8c07a, 24); A.C(tx - 14, ty + 8, 6, 5, 0xd45a5a, 24);
        });
        break;
      }
      case 'weapons': {
        A.DISC(X + 230, Y + 150, 62, 0x05070d, 1.6); A.STARS(X + 190, Y + 110, 80, 80, 18, 2.4);
        A.B(X + 60, Y + 120, 60, 60, 40, 0x4d5466, 0, { metalness: 0.6 }); A.B(X + 120, Y + 140, 70, 20, 14, 0x7d8596, 24); A.C(X + 90, Y + 150, 14, 12, 0xc0442f, 40);
        break;
      }
      case 'oxygen': {
        for (var i2 = 0; i2 < 3; i2++) { A.C(X + 46 + i2 * 44, Y + 108, 16, 96, 0x7fd3e6, 0, { metalness: 0.3, transparent: true, opacity: 0.9 }); A.GL(X + 42 + i2 * 44, Y + 72, 3, 3, 70, 0xffffff, 6); }
        [60, 120].forEach(function (px) { A.B(X + px, Y + 160, 34, 26, 22, 0x8a5a33, 0); A.S(X + px + 17, Y + 150, 18, 0x3c9a4a, 32); A.S(X + px + 8, Y + 156, 11, 0x4fbf5e, 44); });
        break;
      }
      case 'sec': {
        A.B(X + 30, Y + 44, 200, 38, 26, 0x3b4255, 0); for (var i3 = 0; i3 < 4; i3++) A.GL(X + 40 + i3 * 48, Y + 52, 40, 6, 24, i3 % 2 ? 0x2d8ee0 : 0x2fc08a, 28);
        A.C(X + 130, Y + 120, 18, 18, 0x4d5466); A.B(X + 30, Y + 190, 40, 30, 24, 0x4d5466);
        break;
      }
      case 'sec2': { screens(X + 30, Y + 44, 3, 74, 64, [0x2d8ee0, 0x2fc08a, 0x2d8ee0]); break; }
      case 'elec': {
        for (var i4 = 0; i4 < 4; i4++) { var px2 = X + 26 + i4 * 56; A.B(px2, Y + 42, 48, 16, 70, 0x5b6170, 0); [0xe53935, 0x1e63d6, 0xf2d22e, 0xe83fd0].forEach(function (c, j) { A.GL(px2 + 8, Y + 58, 32, 2, 3, c, 14 + j * 14); }); }
        A.B(X + 140, Y + 150, 70, 60, 36, 0x7d8596, 0, { metalness: 0.5 }); var zap = A.GL(X + 150, Y + 160, 50, 40, 6, 0xffe650, 36); A.anim(function (t) { zap.scale.y = 0.6 + glow(t); });
        break;
      }
      case 'admin': {
        var ax = cx - 20, ay = cy + 10;
        [[-110, 0], [110, 0], [0, -62], [0, 62]].forEach(function (d) { A.C(ax + d[0], ay + d[1], 13, 14, 0x4d5466); });
        var tb = A.C(ax, ay, 1, 24, 0x5b6577, 0, { metalness: 0.4 }); tb.scale.set(90, 1, 46);
        var hl = A.C(ax, ay, 1, 3, 0x50dcff, 26, { emissive: 0x2090b0, transparent: true, opacity: 0.55 }); hl.scale.set(70, 1, 32); A.anim(function (t) { hl.material.opacity = 0.35 + 0.3 * glow(t); });
        [[-40, -14], [-6, -18], [30, -12]].forEach(function (d) { A.GL(ax + d[0], ay + d[1] - 6, 26, 2, 16, 0x9ff0ff, 40); });
        break;
      }
      case 'nav': {
        var wx = X + r.w - 70; A.B(wx - 28, Y + 60, 56, r.h - 120, 70, 0x0b1230, 0); A.STARS(wx - 28, Y + 60, 56, r.h - 120, 14, 71);
        for (var i5 = 0; i5 < 5; i5++) { var a2 = Math.PI * (0.76 + i5 * 0.12); var bx = wx + Math.cos(a2) * 110, bz = cy + Math.sin(a2) * 110; A.B(bx - 12, bz - 12, 24, 24, 26, 0x4d5466, 0); if (i5 % 2 === 0) A.GL(bx - 9, bz - 6, 18, 12, 10, 0x2d8ee0, 26); }
        A.C(X + 110, cy, 16, 18, 0x4d5466);
        break;
      }
      case 'storage': {
        [[70, 80, 46], [120, 80, 46], [95, 42, 40], [230, 200, 50], [290, 220, 40], [400, 160, 46], [180, 70, 42], [330, 220, 44]].forEach(function (c) { if (X + c[0] + c[2] / 2 > X + r.w - 20 || Y + c[1] + c[2] / 2 > Y + r.h - 20) return; A.B(X + c[0] - c[2] / 2, Y + c[1] - c[2] / 2, c[2], c[2], c[2], 0x9a6a3a, 0); A.GL(X + c[0] - c[2] / 2 + 3, Y + c[1] - c[2] / 2 + 3, c[2] - 6, c[2] - 6, 1, 0x6b4520, c[2]); });
        [[330, 70], [360, 70], [345, 100]].forEach(function (p) { A.C(X + p[0], Y + p[1], 14, 32, 0x4f6f8a); });
        break;
      }
      case 'comms': {
        for (var i6 = 0; i6 < 3; i6++) { A.B(X + 30 + i6 * 70, Y + 44, 60, 32, 28, 0x3b4255, 0); A.GL(X + 38 + i6 * 70, Y + 52, 44, 4, 18, i6 === 1 ? 0xc8508a : 0x2d8ee0, 28); }
        A.C(X + 90, Y + 160, 4, 40, 0xcfd6e4, 0);
        var dish = new THREE.Mesh(new THREE.SphereGeometry(34, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), A.mat(0xcfd6e4, { side: THREE.DoubleSide, metalness: 0.6 })); dish.position.set(X + 90, 46, Y + 160); dish.rotation.x = Math.PI / 2.6; A.add(dish);
        var led = A.S(X + 90, Y + 160, 5, 0xff5a5a, 58, { emissive: 0xff2020 }); A.anim(function (t) { led.material.emissiveIntensity = glow(t) * 2; });
        break;
      }
      case 'shield': {
        A.C(cx, cy + 14, 78, 8, 0x242a3a, 0, { metalness: 0.6 });
        [0x8fb2ff, 0xb08fff, 0x78e6ff].forEach(function (c, i) { var tr = new THREE.Mesh(new THREE.TorusGeometry(66 - i * 17, 2.6, 8, 40, Math.PI * 1.25), new THREE.MeshBasicMaterial({ color: c })); tr.rotation.x = Math.PI / 2; var g = new THREE.Group(); g.position.set(cx, 26 + i * 8, cy + 14); g.add(tr); A.add(g); A.anim(function (t) { g.rotation.y = t / (900 + i * 400) * (i % 2 ? -1 : 1); }); });
        var co = A.S(cx, cy + 14, 14, 0xffffff, 30, { emissive: 0xa0b8ff }); A.anim(function (t) { co.scale.setScalar(0.9 + 0.3 * glow(t)); });
        [[-120, -80], [120, -80], [-120, 70], [120, 70]].forEach(function (d) { A.B(cx + d[0] - 16, cy + 14 + d[1] - 16, 32, 32, 30, 0x4d5466, 0); A.S(cx + d[0], cy + 14 + d[1], 6, 0x8caaff, 34, { emissive: 0x6080ff }); });
        break;
      }
      case 'beds': {
        for (var i7 = 0; i7 < 3; i7++) { A.B(X + 30 + i7 * 100, Y + 60, 80, 46, 22, 0x5c6f85, 0); A.B(X + 34 + i7 * 100, Y + 64, 26, 38, 8, 0xe9eef5, 22); A.B(X + 62 + i7 * 100, Y + 64, 44, 38, 6, i7 % 2 ? 0xd45a5a : 0x5aa0d8, 22); }
        A.DISC(cx, cy + 60, 90, 0xc85050, 1.5, 0.4);
        break;
      }
      case 'lab': {
        A.B(X + 30, Y + 70, r.w - 60, 40, 30, 0x56657a, 0, { metalness: 0.4 });
        for (var i8 = 0; i8 < 8; i8++) { var tcol = [0x7af0ff, 0x9dff8a, 0xff9df0][i8 % 3]; var tube = A.C(X + 55 + i8 * 32, Y + 80, 5, 24, tcol, 30, { emissive: tcol, emissiveIntensity: 0.6, transparent: true, opacity: 0.85 }); A.anim(function (t, tb) { }); }
        break;
      }
      case 'round': { A.C(cx, cy + 10, 92, 22, 0x55667c, 0, { metalness: 0.4 }); A.C(cx, cy + 10, 60, 10, 0x647892, 22); A.C(cx, cy + 10, 12, 30, 0x8fa4c4, 22); break; }
      case 'greenhouse': {
        for (var i9 = 0; i9 < 3; i9++) { A.B(X + 30, Y + 60 + i9 * 60, r.w - 60, 34, 14, 0x5a3f2a, 0); for (var j9 = 0; j9 < 9; j9++) { A.S(X + 50 + j9 * 30, Y + 77 + i9 * 60, 9, [0x3f9a4a, 0x57b85f, 0x7bd16a][(i9 + j9) % 3], 24); } }
        var gl = A.DISC(cx, cy, Math.min(r.w, r.h) * 0.45, 0xff78dc, 1.8, 0.12); A.anim(function (t) { gl.material.opacity = 0.08 + 0.08 * glow(t); });
        break;
      }
      case 'drill': {
        A.DISC(cx, cy + 30, 60, 0xa9d6ef, 1.5); A.DISC(cx, cy + 30, 34, 0x123044, 1.8);
        [[-50, 30], [50, 30], [0, -40]].forEach(function (p) { var leg = A.C(cx + p[0] * 0.5, cy + 10 + p[1] * 0.4, 3, 100, 0xd6a43a, 0); leg.rotation.z = p[0] * -0.004; leg.position.y = 50; });
        var dr = A.C(cx, cy + 30, 6, 80, 0x9aa4b5, 10); A.anim(function (t) { dr.position.y = 50 + Math.sin(t / 120) * 8; });
        break;
      }
      case 'boiler': {
        A.B(cx - 60, cy - 70, 120, 110, 70, 0x6a4a3a, 0, { metalness: 0.4 }); var fire = A.S(cx, cy - 10, 24, 0xffa63c, 30, { emissive: 0xff7a1c }); A.anim(function (t) { fire.scale.set(1, 0.8 + glow(t) * 0.6, 1); fire.material.emissiveIntensity = glow(t) * 1.6; });
        break;
      }
      case 'obs': {
        A.B(X + 30, Y + 40, r.w - 60, 14, 60, 0x0b1230, 0); A.STARS(X + 30, Y + 40, r.w - 60, 14, 26, 61);
        var te = A.C(cx, cy + 30, 12, 90, 0xcfd6e4, 0); te.rotation.z = 0.6; te.position.y = 45;
        break;
      }
      case 'garage': { A.B(cx - 80, cy - 20, 160, 50, 28, 0xd64545, 6); A.B(cx - 100, cy + 30, 200, 12, 6, 0x3a3f48, 0); A.B(cx - 30, cy - 12, 50, 30, 14, 0x9fe7ff, 34); break; }
      case 'gen': { A.B(X + 40, Y + 60, 120, 90, 46, 0x6a6236, 0); var gb = A.C(X + 100, Y + 105, 22, 8, 0xffe65a, 46, { emissive: 0xaa8a10 }); A.anim(function (t) { gb.material.emissiveIntensity = glow(t) * 1.5; }); break; }
      case 'icecrates': { [[60, 80], [120, 80], [90, 40], [300, 200], [360, 200]].forEach(function (p) { if (X + p[0] + 24 > X + r.w - 10 || Y + p[1] + 24 > Y + r.h - 10) return; A.B(X + p[0] - 24, Y + p[1] - 24, 48, 48, 44, 0x8fb9d4, 0, { transparent: true, opacity: 0.95 }); }); break; }
      case 'radar': {
        var rd = new THREE.Group(); rd.position.set(cx, 0, cy + 10); A.add(rd);
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(4, 6, 50, 10), A.mat(0xcfd6e4)); pole.position.y = 25; rd.add(pole);
        var dsh = new THREE.Mesh(new THREE.SphereGeometry(40, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.4), A.mat(0xe0e6f2, { side: THREE.DoubleSide })); dsh.position.set(0, 60, 0); dsh.rotation.x = Math.PI / 3; rd.add(dsh);
        A.anim(function (t) { rd.rotation.y = t / 900; }); A.S(cx, cy + 10, 6, 0x5aff8c, 4, { emissive: 0x1aff5a });
        break;
      }
    }
  };

  // ---- חנוכה: זרי אורות, כוכב, חנוכייה וסביבון בכל חדר ----
  var PAL = [0xff5a5a, 0xffd646, 0x58c8ff, 0x8aff8a, 0xff8ae0, 0xffffff];
  Z.hanukBuild = function (M, A, G) {
    var bulbs = [];
    Object.keys(M.ROOMS).forEach(function (k, idx) {
      var r = M.ROOMS[k];
      // כוכב מגן דוד זוהר על הרצפה
      var sh = new THREE.Shape(), R0 = Math.min(r.w, r.h) * 0.27;
      for (var tri = 0; tri < 2; tri++) { for (var q = 0; q < 3; q++) { var a = (q * 2 * Math.PI / 3) + (tri ? Math.PI / 3 : 0) + Math.PI / 2; var px = Math.cos(a) * R0, py = Math.sin(a) * R0; if (q === 0) { if (!tri) sh.moveTo(px, py); } } }
      var geoA = new THREE.ShapeGeometry(new THREE.Shape([0, 1, 2].map(function (q) { var a = q * 2 * Math.PI / 3 + Math.PI / 2; return new THREE.Vector2(Math.cos(a) * R0, Math.sin(a) * R0); })));
      var geoB = new THREE.ShapeGeometry(new THREE.Shape([0, 1, 2].map(function (q) { var a = q * 2 * Math.PI / 3 - Math.PI / 2; return new THREE.Vector2(Math.cos(a) * R0, Math.sin(a) * R0); })));
      [geoA, geoB].forEach(function (g) { var m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: 0xffe082, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.set(r.cx, 1.6, r.cy); G.add(m); });
      // זר אורות לאורך הקיר הצפוני
      var n = Math.floor((r.w - 30) / 22);
      for (var i = 0; i < n; i++) {
        var b = new THREE.Mesh(new THREE.SphereGeometry(3.4, 8, 6), new THREE.MeshBasicMaterial({ color: PAL[(i + idx) % PAL.length] })); b.position.set(r.x + 20 + i * 22, 46 + (i % 2) * 5 + Math.sin(i * 0.9) * 2, r.y + 12); G.add(b); bulbs.push(b);
      }
      // חנוכייה קטנה וסביבון או סופגנייה בפינות
      var mn = A.sprite(A.emojiTex('🕎'), 34, 34); mn.position.set(r.x + 30, 20, r.y + r.h - 24); G.add(mn);
      if (((r.x / 10) | 0) % 2) { var dn = A.sprite(A.emojiTex('🍩'), 30, 30); dn.position.set(r.x + r.w - 30, 16, r.y + r.h - 24); G.add(dn); }
      else {
        var dg = new THREE.Group(); dg.position.set(r.x + r.w - 30, 0, r.y + r.h - 24);
        var body = new THREE.Mesh(new THREE.BoxGeometry(14, 14, 14), A.mat(0x4a7bd8, { roughness: 0.4 })); body.position.y = 22; dg.add(body);
        var tip = new THREE.Mesh(new THREE.ConeGeometry(10, 14, 4), A.mat(0xffd646)); tip.rotation.x = Math.PI; tip.position.y = 8; dg.add(tip);
        var hd = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 8, 6), A.mat(0xffd646)); hd.position.y = 33; dg.add(hd);
        G.add(dg); (function (g2, ph) { A.anim(function (t) { g2.rotation.y = t / 500 + ph; }); })(dg, idx);
      }
    });
    A.anim(function (t) { if (!G.visible) return; for (var i = 0; i < bulbs.length; i++) { var s = 0.8 + 0.4 * Math.sin(t / 260 + i * 1.3); bulbs[i].scale.setScalar(s); } });
    // נצנוצים סביב השחקן
    var N = 70, pos = new Float32Array(N * 3), pts = new THREE.Points(new THREE.BufferGeometry(), new THREE.PointsMaterial({ color: 0xffe082, size: 4, transparent: true, opacity: 0.8, depthWrite: false }));
    pts.geometry.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pts.frustumCulled = false; G.add(pts); Z._sp = { pts: pts, pos: pos, N: N };
  };

  var flame = null;
  Z.hanukFrame = function (S, t, M, dyn, o, A) {
    // נצנוצים יורדים סביב השחקן
    var sp = Z._sp; if (sp && S.hanuk) { for (var i = 0; i < sp.N; i++) { var ph = (i * 0.137 + t / (5500 + (i % 5) * 500)) % 1; sp.pos[i * 3] = o.cam.x + Math.sin(i * 12.9) * 380; sp.pos[i * 3 + 1] = 140 - ph * 140; sp.pos[i * 3 + 2] = o.cam.y + Math.cos(i * 7.7) * 380; } sp.pts.geometry.attributes.position.needsUpdate = true; }
    // שמונה נרות (מצב חנוכה): נר דולק או כבוי בכל חדר
    var cs = S.candles || [];
    cs.forEach(function (cd, n) {
      var T = M.TASKS[cd.i]; if (!T) return;
      var g = Z.candles[n];
      if (!g) {
        g = Z.candles[n] = new THREE.Group();
        var base = new THREE.Mesh(new THREE.CylinderGeometry(14, 17, 10, 12), A.mat(0xe8b030, { metalness: 0.7, roughness: 0.3 })); base.position.y = 5; g.add(base);
        var cn = new THREE.Mesh(new THREE.CylinderGeometry(5.5, 5.5, 38, 10), A.mat(cd.i % 2 ? 0x9ad4ff : 0xf4f8ff)); cn.position.y = 29; g.add(cn);
        var fl = new THREE.Mesh(new THREE.SphereGeometry(6, 10, 8), new THREE.MeshBasicMaterial({ color: 0xff9d1c })); fl.scale.set(0.8, 1.7, 0.8); fl.position.y = 56; g.add(fl);
        var ring = new THREE.Mesh(new THREE.RingGeometry(26, 30, 28), new THREE.MeshBasicMaterial({ color: 0xffd646, transparent: true, opacity: 0.7, side: THREE.DoubleSide })); ring.rotation.x = -Math.PI / 2; ring.position.y = 2; g.add(ring);
        var e = A.sprite(A.label('E', '#fff0b0'), 44, 20); e.position.y = 76; g.add(e);
        var lt = new THREE.PointLight(0xffc860, 1.4, 260, 1.5); lt.position.y = 58; g.add(lt);
        g.userData = { fl: fl, ring: ring, e: e, lt: lt }; dyn.add(g);
      }
      g.position.set(T.x, 0, T.y + 10); g.visible = true;
      var u = g.userData; u.fl.visible = !!cd.lit; u.lt.visible = !!cd.lit; u.ring.visible = !cd.lit; u.e.visible = !cd.lit;
      if (cd.lit) { var f = 1 + 0.2 * Math.sin(t / 90 + cd.i); u.fl.scale.set(0.8 * f, 1.7 * f, 0.8 * f); u.lt.intensity = 1.2 + 0.4 * Math.sin(t / 70 + cd.i); } else u.ring.material.opacity = 0.35 + 0.35 * Math.sin(t / 250);
    });
    for (var j = cs.length; j < Z.candles.length; j++) if (Z.candles[j]) Z.candles[j].visible = false;
    // נס פח השמן
    var ms = S.miracles || [];
    ms.forEach(function (m, n) {
      var g = Z.mir[n];
      if (!g) {
        g = Z.mir[n] = new THREE.Group();
        var halo = new THREE.Mesh(new THREE.CylinderGeometry(230, 230, 160, 40, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false })); halo.position.y = 80; g.add(halo);
        var disc = new THREE.Mesh(new THREE.CircleGeometry(230, 40), new THREE.MeshBasicMaterial({ color: 0xffd25a, transparent: true, opacity: 0.18, depthWrite: false })); disc.rotation.x = -Math.PI / 2; disc.position.y = 2; g.add(disc);
        var mn = A.sprite(A.emojiTex('🕎'), 50, 50); mn.position.y = 70; g.add(mn);
        var cnt = A.sprite(A.label('15', '#fff3b0'), 70, 22); cnt.position.y = 105; g.add(cnt);
        var lt = new THREE.PointLight(0xffd070, 1.6, 420, 1.2); lt.position.y = 90; g.add(lt);
        g.userData = { cnt: cnt, txt: '', mn: mn }; dyn.add(g);
      }
      g.position.set(m.x, 0, m.y); g.visible = true; g.children[0].material.opacity = 0.1 + 0.05 * Math.sin(t / 300); g.userData.mn.position.y = 70 + Math.sin(t / 300) * 5;
      var tx = String(m.left | 0); if (g.userData.txt !== tx) { g.userData.txt = tx; g.remove(g.userData.cnt); var c2 = A.sprite(A.label(tx, '#fff3b0'), 70, 22); c2.position.y = 105; g.add(c2); g.userData.cnt = c2; }
    });
    for (var j2 = ms.length; j2 < Z.mir.length; j2++) if (Z.mir[j2]) Z.mir[j2].visible = false;
  };
})();

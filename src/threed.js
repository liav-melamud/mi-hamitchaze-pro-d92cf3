// מי המתחזה? פרו – מצב תלת מימד אמיתי (three.js): מצלמה מאחורי השחקן, דמויות תלת ממדיות עם התלבושות, קירות וחדרים.
// נטען רק כשלוחצים על "תלת מימד". משתמש במצב המשחק הקיים (S, MAP, disp) ולא משנה את חוקי המשחק או הקלט.
(function () {
  var Z = window.MM_3D = { ok: false };
  var R, scene, camera, cv3, built = null, staticG, dyn, lights = {};
  var players = {}, bodies = [], texCache = {}, hatCache = {}, beacons = {}, sabM = [], doorM = [], emoPool = [], bodyPool = [];
  var camPos = null, camLook = null;
  var tex = function (k, mk) { return texCache[k] || (texCache[k] = mk()); };

  function label(text, color, big) {
    return tex('L' + text + color + (big ? 1 : 0), function () {
      var c = document.createElement('canvas'), g = c.getContext('2d'); c.width = 320; c.height = 72;
      g.font = 'bold ' + (big ? 34 : 30) + 'px Rubik, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 7; g.strokeStyle = 'rgba(0,0,0,.8)';
      g.strokeText(text, 160, 36); g.fillStyle = color; g.fillText(text, 160, 36);
      var t = new THREE.CanvasTexture(c); t.anisotropy = 2; return t;
    });
  }
  function sprite(t, w, h) { var s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthWrite: false })); s.scale.set(w, h, 1); return s; }
  function emojiTex(e) {
    return tex('E' + e, function () { var c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = 96; g.font = '70px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(e, 48, 52); return new THREE.CanvasTexture(c); });
  }
  function hatTex(h) { // התלבושות של המשחק (מצוירות ב-2D) הופכות לתמונה שמרחפת מעל הראש
    if (!h) return null;
    if (hatCache[h]) return hatCache[h];
    var c = document.createElement('canvas'); c.width = c.height = 200; var g = c.getContext('2d'), saved = ctx;
    try { ctx = g; g.translate(100, 130); g.scale(2, 2); drawHat(h, 1); } catch (e) {} finally { ctx = saved; }
    return (hatCache[h] = new THREE.CanvasTexture(c));
  }
  function checker(c1, c2) {
    return tex('C' + c1 + c2, function () {
      var c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = 64; g.fillStyle = c1; g.fillRect(0, 0, 64, 64); g.fillStyle = c2; g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
      var t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
    });
  }

  function init() {
    if (R) return true;
    try {
      cv3 = document.createElement('canvas'); cv3.id = 'cv3'; cv3.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;display:none;touch-action:none';
      var base = document.getElementById('cv'); base.parentNode.insertBefore(cv3, base.nextSibling);
      R = new THREE.WebGLRenderer({ canvas: cv3, antialias: true }); R.setClearColor(0x04050b);
      scene = new THREE.Scene(); camera = new THREE.PerspectiveCamera(52, 1, 5, 4000);
      lights.h = new THREE.HemisphereLight(0xcfdcff, 0x1c2030, 1.0); scene.add(lights.h);
      lights.d = new THREE.DirectionalLight(0xffffff, 0.9); lights.d.position.set(-300, 600, 400); scene.add(lights.d);
      lights.p = new THREE.PointLight(0xffe2a8, 1.1, 650, 1.4); scene.add(lights.p);
      staticG = new THREE.Group(); dyn = new THREE.Group(); scene.add(staticG, dyn);
      Z.ok = true;
    } catch (e) { Z.ok = false; R = null; }
    return Z.ok;
  }

  // ---- בניית המפה: רצפות, קירות (מרשת ההליכה), ריהוט ועמודים ----
  function build() {
    while (staticG.children.length) { var o = staticG.children.pop(); if (o.geometry) o.geometry.dispose(); }
    beacons = {}; dyn.children.slice().forEach(function (o) { dyn.remove(o); }); players = {}; bodyPool = []; emoPool = []; sabM = []; doorM = [];
    var M = MAP, W3 = M.WORLD.w, H3 = M.WORLD.h, pro = /^mod_pro/.test(M.id || '');
    var floorMat = function (col, w, h) { var t = checker('#ffffff', '#e3e3ea').clone(); t.needsUpdate = true; t.repeat.set(w / 80, h / 80); return new THREE.MeshStandardMaterial({ color: col, map: t, roughness: 0.85 }); };
    var plane = function (x, y, w, h, col, yy) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), floorMat(col, w, h)); m.rotation.x = -Math.PI / 2; m.position.set(x + w / 2, yy || 0, y + h / 2); staticG.add(m); return m; };
    M.CORRIDORS.forEach(function (c) { plane(c.x, c.y, c.w, c.h, M.theme === 'ice' ? 0x6f8296 : 0x4a5166, 0); });
    Object.keys(M.ROOMS).forEach(function (k) { var r = M.ROOMS[k]; plane(r.x, r.y, r.w, r.h, new THREE.Color(r.c).multiplyScalar(1.5), 0.4); });
    // קירות: כל תא שאי אפשר ללכת בו וצמוד לשטח הליכה. קירות מדרום נמוכים (כדי שהמצלמה תראה מעליהם)
    var CELL = 20, gx = Math.ceil(W3 / CELL) + 2, gy = Math.ceil(H3 / CELL) + 2, wk = new Uint8Array(gx * gy);
    for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) wk[j * gx + i] = M.walkable(i * CELL + CELL / 2, j * CELL + CELL / 2) ? 1 : 0;
    var cells = [];
    for (j = 1; j < gy - 1; j++) for (i = 1; i < gx - 1; i++) {
      if (wk[j * gx + i]) continue; var near = false;
      for (var dj = -1; dj <= 1 && !near; dj++) for (var di = -1; di <= 1; di++) if (wk[(j + dj) * gx + i + di]) { near = true; break; }
      if (near) cells.push([i, j, wk[(j - 1) * gx + i] ? 18 : 84]);
    }
    var wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: pro ? 0x5b5486 : 0x4b5a80, roughness: 0.7, metalness: 0.1 }), cells.length), mx = new THREE.Matrix4();
    cells.forEach(function (c, n) { mx.makeScale(CELL, c[2], CELL); mx.setPosition(c[0] * CELL + CELL / 2, c[2] / 2, c[1] * CELL + CELL / 2); wm.setMatrixAt(n, mx); });
    staticG.add(wm);
    // ריהוט לאורך הקיר האחורי של כל חדר, ושם החדר
    Object.keys(M.ROOMS).forEach(function (k, idx) {
      var r = M.ROOMS[k], col = new THREE.Color(r.c).multiplyScalar(0.9);
      for (var q = 1; q <= 3; q++) {
        var b = new THREE.Mesh(new THREE.BoxGeometry(46, 26, 20), new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.3 })); b.position.set(r.x + r.w * q / 4, 13, r.y + 46); staticG.add(b);
        var sc = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), new THREE.MeshBasicMaterial({ color: (q + idx) % 2 ? 0x59d8ff : 0x8cffb0 })); sc.position.set(r.x + r.w * q / 4, 20, r.y + 56.2); staticG.add(sc);
      }
      var lb = sprite(label(r.name, '#ffffff'), 150, 34); lb.position.set(r.cx, 96, r.y + 14); staticG.add(lb);
      if (pro) {
        [[r.x + 30, r.y + 70], [r.x + r.w - 30, r.y + 70]].forEach(function (p) { var cy = new THREE.Mesh(new THREE.CylinderGeometry(11, 13, 96, 16), new THREE.MeshStandardMaterial({ color: 0xffd166, metalness: 0.8, roughness: 0.25, emissive: 0x4a3200 })); cy.position.set(p[0], 48, p[1]); staticG.add(cy); });
        var rug = new THREE.Mesh(new THREE.PlaneGeometry(r.w * 0.55, r.h * 0.4), new THREE.MeshStandardMaterial({ color: 0xc9962b, roughness: 0.9, transparent: true, opacity: 0.45 })); rug.rotation.x = -Math.PI / 2; rug.position.set(r.cx, 1, r.cy); staticG.add(rug);
      }
    });
    // כפתור חירום
    var bb = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 14, 24), new THREE.MeshStandardMaterial({ color: 0x777c88, metalness: 0.5, roughness: 0.4 })); bb.position.set(M.BUTTON.x, 7, M.BUTTON.y); staticG.add(bb);
    var bt = new THREE.Mesh(new THREE.CylinderGeometry(20, 22, 12, 24), new THREE.MeshStandardMaterial({ color: 0xe02828, emissive: 0x801010, roughness: 0.3 })); bt.position.set(M.BUTTON.x, 19, M.BUTTON.y); staticG.add(bt); Z.btn = bt;
    var bl = sprite(label('חירום', '#ffdddd'), 90, 22); bl.position.set(M.BUTTON.x, 52, M.BUTTON.y); staticG.add(bl);
    // פתחי אוורור
    M.VENTS.forEach(function (v) {
      var vm = new THREE.Mesh(new THREE.BoxGeometry(46, 5, 30), new THREE.MeshStandardMaterial({ color: 0x20242e, metalness: 0.7, roughness: 0.4 })); vm.position.set(v.x, 3, v.y); staticG.add(vm);
      for (var q2 = 0; q2 < 4; q2++) { var sl = new THREE.Mesh(new THREE.BoxGeometry(38, 1.5, 2.5), new THREE.MeshStandardMaterial({ color: 0x9aa4b8 })); sl.position.set(v.x, 6, v.y - 10 + q2 * 6.5); staticG.add(sl); }
    });
    built = M.id || 'm' + W3;
  }

  // ---- דמות: שעועית של "החלליות" עם מגן ראש, תרמיל ורגליים ----
  function makeBean(color) {
    var g = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.42, metalness: 0.05 }), dark = new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.7), roughness: 0.5 });
    var body = new THREE.Mesh(new THREE.CapsuleGeometry(15, 24, 6, 18), mat); body.position.y = 38; g.add(body);
    var legL = new THREE.Mesh(new THREE.CapsuleGeometry(6.5, 7, 4, 10), dark), legR = legL.clone(); legL.position.set(-8, 9, 0); legR.position.set(8, 9, 0); g.add(legL, legR);
    var vis = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: 0x9fe7ff, emissive: 0x2a7fa8, roughness: 0.08, metalness: 0.3 })); vis.scale.set(12.5, 8.5, 8); vis.position.set(0, 47, 11.5); g.add(vis);
    var pack = new THREE.Mesh(new THREE.BoxGeometry(18, 26, 10), dark); pack.position.set(0, 36, -17); g.add(pack);
    var sh = new THREE.Mesh(new THREE.CircleGeometry(22, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.9; g.add(sh);
    g.userData = { body: body, legs: [legL, legR], mats: [mat, dark, vis.material, sh.material], shadow: sh };
    g.scale.setScalar(1.25);
    return g;
  }
  function setOpacity(g, a) { g.userData.mats.forEach(function (m, i) { if (i === 3) { m.opacity = 0.38 * a; return; } m.transparent = a < 1; m.opacity = a; }); }

  function getPlayer(p) {
    var e = players[p.id];
    if (e && e.color !== p.color) { dyn.remove(e.g); e = null; }
    if (!e) {
      var g = makeBean(p.color); dyn.add(g);
      e = players[p.id] = { g: g, color: p.color, head: 0, hat: -1, hs: null, nm: '', ns: null, pet: -1, ps: null, lx: null, lz: null, moving: 0 };
    }
    return e;
  }
  function poolEmoji(n, e) {
    var s = emoPool[n]; if (!s) { s = emoPool[n] = sprite(emojiTex(e), 30, 30); dyn.add(s); }
    if (s.userData.e !== e) { s.material.map = emojiTex(e); s.material.needsUpdate = true; s.userData.e = e; }
    s.visible = true; return s;
  }

  Z.hide = function () { if (cv3) cv3.style.display = 'none'; var b = document.getElementById('cv'); if (b) b.style.visibility = ''; };

  Z.draw = function (o) {
    if (!R && !init()) return false;
    var S = o.S, me = o.me, cam = o.cam, t = o.t, M = MAP;
    if (built !== (M.id || 'm' + M.WORLD.w)) build();
    var w = o.W, h = o.H, pr = Math.min(o.DPR || 1, 1.6);
    if (Z._w !== w || Z._h !== h || Z._pr !== pr) { Z._w = w; Z._h = h; Z._pr = pr; R.setPixelRatio(pr); R.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    cv3.style.display = 'block'; document.getElementById('cv').style.visibility = 'hidden';
    var zm = Math.max(0.6, Math.min(1.6, (typeof ZOOM !== 'undefined' ? ZOOM : 1)));
    var back = 450 / zm, up = 340 / zm;
    var tp = new THREE.Vector3(cam.x, 0, cam.y);
    var want = new THREE.Vector3(tp.x, up, tp.z + back), look = new THREE.Vector3(tp.x, 22, tp.z - 30);
    if (!camPos) { camPos = want.clone(); camLook = look.clone(); }
    var k = Math.min(1, (o.dt || 0.016) * 7);
    camPos.lerp(want, k); camLook.lerp(look, k); camera.position.copy(camPos); camera.lookAt(camLook);
    lights.p.position.set(tp.x, 140, tp.z);
    // חושך: ערפל לפי טווח הראייה
    var d0 = camPos.distanceTo(tp);
    if (o.noDark) scene.fog = new THREE.Fog(0x04050b, d0 + 2500, d0 + 3500);
    else scene.fog = new THREE.Fog(0x04050b, d0 + o.vision * 0.55, d0 + o.vision * 1.12);
    scene.background = new THREE.Color(0x04050b);
    // כפתור חירום פועם
    if (Z.btn) Z.btn.material.emissiveIntensity = 0.6 + 0.5 * Math.sin(t / 300);

    var seen = {};
    S.players.forEach(function (p) {
      if (p.spec) return;
      var d = o.disp[p.id]; if (!d) return;
      if (!o.inView(p) && !S.settings.reveal) { if (players[p.id]) players[p.id].g.visible = false; return; }
      seen[p.id] = 1;
      var e = getPlayer(p), g = e.g; g.visible = true;
      var dx = e.lx === null ? 0 : d.x - e.lx, dz = e.lx === null ? 0 : d.y - e.lz; e.lx = d.x; e.lz = d.y;
      var sp = Math.hypot(dx, dz);
      if (sp > 0.25) { var ang = Math.atan2(dx, dz), df = ang - e.head; df = Math.atan2(Math.sin(df), Math.cos(df)); e.head += df * 0.25; e.moving = Math.min(1, e.moving + 0.3); } else e.moving = Math.max(0, e.moving - 0.12);
      g.position.set(d.x, 0, d.y); g.rotation.y = e.head;
      var ph = t / 90, bob = e.moving * Math.abs(Math.sin(ph)) * 2.5, ghost = !p.alive;
      var ud = g.userData; ud.body.position.y = 38 + bob + (ghost ? 8 + Math.sin(t / 300) * 3 : 0);
      ud.legs[0].position.z = Math.sin(ph) * 5 * e.moving; ud.legs[1].position.z = -Math.sin(ph) * 5 * e.moving;
      ud.legs[0].visible = ud.legs[1].visible = !ghost; ud.shadow.visible = !ghost;
      setOpacity(g, ghost ? 0.45 : p.vent ? 0.3 : 1);
      // תלבושת
      var hs = p.hat | 0;
      if (e.hat !== hs) { if (e.hs) dyn.remove(e.hs); e.hs = null; e.hat = hs; var ht = hatTex(hs); if (ht) { e.hs = sprite(ht, 96, 96); dyn.add(e.hs); } }
      var top = 46 * 1.25 + bob + (ghost ? 8 : 0);
      if (e.hs) { e.hs.position.set(d.x, top + 8, d.y); e.hs.material.opacity = ghost ? 0.5 : 1; }
      // חיית מחמד
      var pet = p.pet | 0;
      if (e.pet !== pet) { if (e.ps) dyn.remove(e.ps); e.ps = null; e.pet = pet; if (pet && PETS[pet] && PETS[pet] !== '@dreidel') { e.ps = sprite(emojiTex(PETS[pet]), 28, 28); dyn.add(e.ps); } }
      if (e.ps) e.ps.position.set(d.x - Math.sin(e.head) * 40 + 10, 14 + Math.abs(Math.sin(t / 160)) * 5, d.y - Math.cos(e.head) * 40);
      // שם
      var imp = p.team === 'imp' && (p.id === me.id || me.team === 'imp' || o.reveal), txt = cs(p.color) + p.name + (o.reveal && p.role && p.id !== me.id ? ' · ' + p.role : '');
      var nk = txt + (imp ? 'r' : 'w');
      if (e.nm !== nk) { if (e.ns) dyn.remove(e.ns); e.nm = nk; e.ns = sprite(label(txt, imp ? '#ff6b6b' : '#ffffff'), 120, 27); dyn.add(e.ns); }
      e.ns.position.set(d.x, top + 52, d.y);
      if (me.id === p.id) lights.p.position.set(d.x, 130, d.y);
    });
    Object.keys(players).forEach(function (id) { if (!seen[id]) { var e = players[id]; if (e.g) e.g.visible = false; if (e.hs) e.hs.visible = false; if (e.ns) e.ns.visible = false; if (e.ps) e.ps.visible = false; } else { var e2 = players[id]; if (e2.hs) e2.hs.visible = true; if (e2.ns) e2.ns.visible = true; if (e2.ps) e2.ps.visible = true; } });

    // גופות
    var bn = 0;
    (S.bodies || []).forEach(function (b) {
      if (!(o.noDark || D(cam, b) <= o.vision)) return;
      var bg = bodyPool[bn]; if (!bg) { bg = bodyPool[bn] = new THREE.Group(); dyn.add(bg); }
      if (bg.userData.c !== b.color) { while (bg.children.length) bg.remove(bg.children[0]); var bean = makeBean(b.color); bean.rotation.z = Math.PI / 2; bean.position.y = 20; bean.children.forEach(function (c) { if (c.geometry && c.geometry.type === 'CircleGeometry') c.visible = false; }); bg.add(bean); var bone = new THREE.Mesh(new THREE.BoxGeometry(5, 5, 26), new THREE.MeshStandardMaterial({ color: 0xf3efe0 })); bone.position.set(-20, 36, 0); bg.add(bone); bg.userData.c = b.color; }
      bg.position.set(b.x, 0, b.y); bg.visible = true; bn++;
    });
    for (var bi = bn; bi < bodyPool.length; bi++) bodyPool[bi].visible = false;

    // משימות שלי: עמוד אור צהוב
    Object.keys(beacons).forEach(function (i) { beacons[i].visible = false; });
    if (me.team !== 'imp' && me.tasks) me.tasks.forEach(function (tk) {
      if (tk.done) return; var T = M.TASKS[tk.i]; if (!T || T.ev === 'candle') return;
      var bc = beacons[tk.i];
      if (!bc) {
        bc = beacons[tk.i] = new THREE.Group();
        var ring = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 90, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xffd646, transparent: true, opacity: 0.35, side: THREE.DoubleSide, depthWrite: false })); ring.position.y = 45; bc.add(ring);
        var base = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 3, 16), new THREE.MeshBasicMaterial({ color: 0xffd646 })); base.position.y = 2; bc.add(base);
        var ex = sprite(label('❗ ' + T.name, '#ffe9a0'), 170, 38); ex.position.y = 108; bc.add(ex);
        bc.position.set(T.x, 0, T.y); dyn.add(bc);
      }
      bc.visible = true; bc.children[0].material.opacity = 0.28 + 0.15 * Math.sin(t / 250); bc.children[2].position.y = 108 + Math.sin(t / 300) * 4;
    });

    // משבר פעיל, דלתות נעולות
    sabM.forEach(function (m) { m.visible = false; });
    if (S.sab) M.SAB_POINTS[S.sab.type].forEach(function (q, i) {
      if (S.sab.fixed[i]) return;
      var m = sabM[i]; if (!m) { m = sabM[i] = new THREE.Group(); var c = new THREE.Mesh(new THREE.CylinderGeometry(22, 22, 130, 20, 1, true), new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })); c.position.y = 65; m.add(c); m.userData.txt = ''; dyn.add(m); }
      var nm = ({ lights: '💡', oxygen: '💨', reactor: '☢️', freeze: '❄️' }[S.sab.type] || '⚠️') + ' ' + q.name;
      if (m.userData.txt !== nm) { if (m.children[1]) m.remove(m.children[1]); var sp2 = sprite(label(nm, '#ffd0d0'), 170, 38); sp2.position.y = 150; m.add(sp2); m.userData.txt = nm; }
      m.position.set(q.x, 0, q.y); m.visible = true; m.children[0].material.opacity = 0.3 + 0.25 * Math.sin(t / 150);
    });
    doorM.forEach(function (m) { m.visible = false; });
    var dn = 0, addDoor = function (d, col) {
      var m = doorM[dn]; if (!m) { m = doorM[dn] = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: col, transparent: true, opacity: 0.75, emissive: 0x330000 })); dyn.add(m); }
      m.material.color.setHex(col); m.scale.set(d.w, 100, d.h); m.position.set(d.x + d.w / 2, 50, d.y + d.h / 2); m.visible = true; dn++;
    };
    if (S.doors) S.doors.forEach(function (rid) { M.doorRects(rid).forEach(function (d) { addDoor(d, 0xb01e1e); }); });
    if (S.hauntDoors) S.hauntDoors.forEach(function (d) { addDoor(d, 0x6a2fb0); });

    // חפצים קטנים על הרצפה: בננות, מלכודות, פצצות
    var en = 0;
    if (S.bananas) S.bananas.forEach(function (b) { if (o.noDark || D(cam, b) <= o.vision) { poolEmoji(en++, '🍌').position.set(b.x, 14, b.y); } });
    if (S.traps) S.traps.forEach(function (b) { poolEmoji(en++, '🪤').position.set(b.x, 14, b.y); });
    if (S.bombs) S.bombs.forEach(function (b) { poolEmoji(en++, '💣').position.set(b.x, 16, b.y); });
    for (var ei = en; ei < emoPool.length; ei++) if (emoPool[ei]) emoPool[ei].visible = false;

    R.render(scene, camera);
    return true;
  };
  Z.reset = function () { camPos = null; built = null; };
  init();
})();

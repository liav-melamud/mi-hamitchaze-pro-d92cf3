// מי המתחזה? פרו – מצב תלת מימד אמיתי (three.js): מצלמה מאחורי השחקן, דמויות תלת ממדיות עם התלבושות, קירות וחדרים.
// נטען רק כשלוחצים על "תלת מימד". משתמש במצב המשחק הקיים (S, MAP, disp) ולא משנה את חוקי המשחק או הקלט.
(function () {
  var Z = window.MM_3D = { ok: false, yaw: 0, zoom: 1, view: 'eye' }; // view: 'eye' = מבט מהעין של הדמות (ברירת מחדל), 'out' = מבחוץ (F3)
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
      cv3.style.pointerEvents = 'auto'; var drag = null;
      cv3.addEventListener('pointerdown', function (e) { drag = { x: e.clientX, id: e.pointerId }; try { cv3.setPointerCapture(e.pointerId); } catch (er) {} });
      cv3.addEventListener('pointermove', function (e) { if (!drag || e.pointerId !== drag.id) return; var dx = e.clientX - drag.x; drag.x = e.clientX; Z.yaw -= dx * (2.4 / Math.max(500, cv3.clientWidth)); if (typeof sendInput === 'function') sendInput(); }); // ימינה = פנייה ימינה; גרירה על כל רוחב המסך ≈ 140 מעלות
      cv3.addEventListener('pointerup', function () { drag = null; }); cv3.addEventListener('pointercancel', function () { drag = null; });
      cv3.addEventListener('wheel', function (e) { Z.zoom = Math.max(0.6, Math.min(1.8, Z.zoom * (e.deltaY < 0 ? 1.08 : 0.93))); e.preventDefault(); }, { passive: false });
      Z.ok = true;
    } catch (e) { Z.ok = false; R = null; }
    return Z.ok;
  }

  // ---- בניית המפה: רצפות, קירות צבעוניים (מרשת ההליכה), וריהוט לכל חדר כמו בתצוגה הרגילה ----
  var anims = [], hanG = null, API = null;
  function build() {
    while (staticG.children.length) { var o = staticG.children.pop(); if (o.geometry) o.geometry.dispose(); }
    beacons = {}; dyn.children.slice().forEach(function (o) { dyn.remove(o); }); players = {}; bodyPool = []; emoPool = []; sabM = []; doorM = []; Z.candles = []; Z.mir = []; anims = [];
    var M = MAP, W3 = M.WORLD.w, H3 = M.WORLD.h, pro = /^mod_pro/.test(M.id || ''), ice = M.theme === 'ice';
    var mat = function (c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.15 }, o || {})); };
    var add = function (m) { staticG.add(m); return m; };
    API = {
      mat: mat, add: add, anim: function (f) { anims.push(f); }, sprite: sprite, label: label, emojiTex: emojiTex, pro: pro, ice: ice,
      B: function (x, y, w, d, h, c, e, o) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(c, o)); m.position.set(x + w / 2, (e || 0) + h / 2, y + d / 2); return add(m); },
      C: function (cx, cy, r, h, c, e, o, r2) { var m = new THREE.Mesh(new THREE.CylinderGeometry(r2 === undefined ? r : r2, r, h, 22), mat(c, o)); m.position.set(cx, (e || 0) + h / 2, cy); return add(m); },
      S: function (cx, cy, r, c, e, o) { var m = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat(c, o)); m.position.set(cx, e || 0, cy); return add(m); },
      GL: function (x, y, w, d, h, c, e) { var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ color: c })); m.position.set(x + w / 2, (e || 0) + h / 2, y + d / 2); return add(m); },
      DISC: function (cx, cy, r, c, e, op) { var m = new THREE.Mesh(new THREE.CircleGeometry(r, 28), new THREE.MeshBasicMaterial({ color: c, transparent: op !== undefined, opacity: op === undefined ? 1 : op, depthWrite: op === undefined })); m.rotation.x = -Math.PI / 2; m.position.set(cx, e || 1.2, cy); return add(m); },
      STARS: function (x, y, w, d, n, e) { for (var i = 0; i < n; i++) { var m = new THREE.Mesh(new THREE.SphereGeometry(1.4, 5, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); m.position.set(x + (i * 37 % 100) / 100 * w, e || 2, y + (i * 61 % 100) / 100 * d); add(m); } },
      stool: function (cx, cy, r, h, c) { return this.C(cx, cy, r, h, c); }
    };
    var floorMat = function (col, w, h, ccol) { var t = checker('#ffffff', ice ? '#f2f6fb' : '#dcdce6').clone(); t.needsUpdate = true; t.repeat.set(w / 80, h / 80); return new THREE.MeshStandardMaterial({ color: col, map: t, roughness: ice ? 0.35 : 0.8, metalness: ice ? 0.1 : 0 }); };
    var plane = function (x, y, w, h, col, yy) { var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), floorMat(col, w, h)); m.rotation.x = -Math.PI / 2; m.position.set(x + w / 2, yy || 0, y + h / 2); add(m); return m; };
    M.CORRIDORS.forEach(function (c) { plane(c.x, c.y, c.w, c.h, ice ? 0xa9bccd : 0x59627c, 0); });
    Object.keys(M.ROOMS).forEach(function (k) { var r = M.ROOMS[k]; plane(r.x, r.y, r.w, r.h, new THREE.Color(r.c).multiplyScalar(ice ? 2.3 : 1.9), 0.4); });
    // קירות: צבע הקיר לפי החדר שהוא צמוד אליו
    var CELL = 20, gx = Math.ceil(W3 / CELL) + 2, gy = Math.ceil(H3 / CELL) + 2, wk = new Uint8Array(gx * gy);
    for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) wk[j * gx + i] = M.walkable(i * CELL + CELL / 2, j * CELL + CELL / 2) ? 1 : 0;
    var cells = [];
    for (j = 1; j < gy - 1; j++) for (i = 1; i < gx - 1; i++) {
      if (wk[j * gx + i]) continue; var near = null;
      for (var dj = -1; dj <= 1 && !near; dj++) for (var di = -1; di <= 1; di++) if (wk[(j + dj) * gx + i + di]) { near = [i + di, j + dj]; break; }
      if (near) { var rr = M.roomAt(near[0] * CELL + CELL / 2, near[1] * CELL + CELL / 2); cells.push([i, j, rr ? rr.c : null]); }
    }
    var WH = 54, wm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15 }), cells.length), mx = new THREE.Matrix4(), cc = new THREE.Color();
    cells.forEach(function (c, n) {
      mx.makeScale(CELL, WH, CELL); mx.setPosition(c[0] * CELL + CELL / 2, WH / 2, c[1] * CELL + CELL / 2); wm.setMatrixAt(n, mx);
      if (c[2]) { cc.set(c[2]); cc.offsetHSL(0, 0.06, 0.09); } else cc.set(ice ? 0xcfe0ee : 0x8089a8);
      wm.setColorAt(n, cc);
    });
    add(wm);
    // רצועת תאורה בראש הקירות
    var tm = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), cells.length);
    cells.forEach(function (c, n) { mx.makeScale(CELL, 3, CELL); mx.setPosition(c[0] * CELL + CELL / 2, WH + 1.5, c[1] * CELL + CELL / 2); tm.setMatrixAt(n, mx); if (c[2]) { cc.set(c[2]); cc.offsetHSL(0, 0.3, 0.38); } else cc.set(0xdfe6ff); tm.setColorAt(n, cc); });
    add(tm);
    // ריהוט לכל חדר (כמו בתצוגה הרגילה), ושם החדר
    var types = ['cafe', 'sec', 'elec', 'med', 'admin', 'storage', 'shield', 'comms', 'reactor', 'weapons', 'oxygen', 'nav', 'lab', 'greenhouse', 'engine'];
    Object.keys(M.ROOMS).forEach(function (k, idx) {
      var r = M.ROOMS[k];
      try { Z.roomProps(k, r, API, idx, r.type || types[idx % types.length]); } catch (e) { console.error('props', k, e); }
      var lb = sprite(label(r.name, '#ffffff'), 130, 30); lb.position.set(r.cx, 72, r.y + 14); add(lb);
      if (pro) {
        [[r.x + 30, r.y + 70], [r.x + r.w - 30, r.y + 70]].forEach(function (p) { API.C(p[0], p[1], 11, 96, 0xffd166, 0, { metalness: 0.8, roughness: 0.25, emissive: 0x4a3200 }, 13); });
        API.DISC(r.cx, r.y + r.h - 70, 60, 0xc9962b, 1.5, 0.35);
      }
    });
    // כפתור חירום
    API.C(M.BUTTON.x, M.BUTTON.y, 34, 14, 0x777c88, 0, { metalness: 0.5 }, 30);
    Z.btn = API.C(M.BUTTON.x, M.BUTTON.y, 22, 12, 0xe02828, 14, { emissive: 0x801010, roughness: 0.3 }, 20);
    var bl = sprite(label('חירום', '#ffdddd'), 70, 17); bl.position.set(M.BUTTON.x, 52, M.BUTTON.y); add(bl);
    // פתחי אוורור
    M.VENTS.forEach(function (v) {
      API.B(v.x - 23, v.y - 15, 46, 30, 5, 0x20242e, 0, { metalness: 0.7, roughness: 0.4 });
      for (var q2 = 0; q2 < 4; q2++) API.B(v.x - 19, v.y - 11 + q2 * 6.5, 38, 2.5, 1.5, 0x9aa4b8, 5);
    });
    // חנוכה: קישוטים לכל חדר (מוצגים רק כשהמצב פעיל)
    hanG = new THREE.Group(); hanG.visible = false; staticG.add(hanG);
    try { Z.hanukBuild(M, API, hanG); } catch (e) { console.error('hanuk', e); }
    built = (M.id || 'm' + W3) + ':' + (ice ? 'i' : 's');
  }

  // ---- דמות: אותו רחפן עגול כמו במשחק – גוף כדורי, עין גדולה ושתי אנטנות ----
  function makeBean(color) {
    var g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    var mat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.4, metalness: 0.1 });
    var ball = new THREE.Mesh(new THREE.SphereGeometry(18, 28, 20), mat); ball.position.y = 22; body.add(ball);
    var shine = new THREE.Mesh(new THREE.SphereGeometry(5.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })); shine.position.set(-8, 31, 11); body.add(shine);
    var eyeMat = new THREE.MeshStandardMaterial({ color: 0xf4f7fb, roughness: 0.25 });
    var eye = new THREE.Mesh(new THREE.SphereGeometry(8.5, 18, 14), eyeMat); eye.scale.set(1, 1, 0.55); eye.position.set(4, 24, 15.5); body.add(eye);
    var pup = new THREE.Mesh(new THREE.SphereGeometry(4.2, 12, 10), new THREE.MeshBasicMaterial({ color: 0x141826 })); pup.position.set(6, 24, 19.6); body.add(pup);
    var antMat = new THREE.MeshStandardMaterial({ color: 0xcfd6e4, metalness: 0.6, roughness: 0.3 });
    [-1, 1].forEach(function (sd) {
      var st = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 15, 6), antMat); st.position.set(sd * 9.5, 46, 0); st.rotation.z = -sd * 0.38; body.add(st);
      var tip = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), new THREE.MeshStandardMaterial({ color: sd > 0 ? 0xffd166 : 0xcfd6e4, emissive: sd > 0 ? 0x7a5a10 : 0x000000 })); tip.position.set(sd * 12.5, 54, 0); body.add(tip);
    });
    var sh = new THREE.Mesh(new THREE.CircleGeometry(22, 20), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.38 })); sh.rotation.x = -Math.PI / 2; sh.position.y = 0.9; g.add(sh);
    var dummy = [new THREE.Object3D(), new THREE.Object3D()];
    g.userData = { body: body, legs: dummy, mats: [mat, antMat, eyeMat, sh.material], shadow: sh };
    g.scale.setScalar(1.3);
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
    var S = o.S, me = o.me, cam = Z.dbg || o.cam, t = o.t, M = MAP;
    if (built !== (M.id || 'm' + M.WORLD.w) + ':' + (M.theme === 'ice' ? 'i' : 's')) build();
    var w = o.W, h = o.H, pr = Math.min(o.DPR || 1, 1.6);
    if (Z._w !== w || Z._h !== h || Z._pr !== pr) { Z._w = w; Z._h = h; Z._pr = pr; R.setPixelRatio(pr); R.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
    cv3.style.display = 'block'; document.getElementById('cv').style.visibility = 'hidden';
    var zm = Math.max(0.6, Math.min(1.8, (typeof ZOOM !== 'undefined' ? ZOOM : 1) * Z.zoom));
    var back = 330 / zm, up = 190 / zm, yaw = Z.yaw, sy = Math.sin(yaw), cy = Math.cos(yaw);
    var tp = new THREE.Vector3(cam.x, 0, cam.y);
    // מצלמה מאחורי הדמות (כמו בגוף שלישי), מביטה קדימה לאן שהיא "מסתכלת"
    var eye = Z.view !== 'out';
    var want = new THREE.Vector3(tp.x + sy * back, up, tp.z + cy * back), look = new THREE.Vector3(tp.x - sy * 90, 30, tp.z - cy * 90);
    if (eye) { want.set(tp.x - sy * 12, 44, tp.z - cy * 12); look.set(tp.x - sy * 220, 40, tp.z - cy * 220); }
    var fovW = eye ? 72 : 52; if (camera.fov !== fovW) { camera.fov = fovW; camera.updateProjectionMatrix(); }
    if (!camPos) { camPos = want.clone(); camLook = look.clone(); }
    var k = eye ? 1 : Math.min(1, (o.dt || 0.016) * 9);
    camPos.lerp(want, k); camLook.lerp(look, k); camera.position.copy(camPos); camera.lookAt(camLook);
    lights.p.position.set(tp.x, 140, tp.z);
    var d0 = camPos.distanceTo(tp), fogc = M.theme === 'ice' ? 0xc9dbe8 : 0x04050b;
    if (o.noDark) scene.fog = new THREE.Fog(fogc, d0 + 2500, d0 + 3500);
    else scene.fog = new THREE.Fog(fogc, d0 + o.vision * 0.6, d0 + o.vision * 1.15);
    scene.background = new THREE.Color(fogc);
    for (var ai = 0; ai < anims.length; ai++) anims[ai](t);
    if (hanG) hanG.visible = !!S.hanuk;
    if (S.hanuk || (S.candles && S.candles.length)) try { Z.hanukFrame(S, t, M, dyn, o, API); } catch (e) {}
    // כפתור חירום פועם
    if (Z.btn) Z.btn.material.emissiveIntensity = 0.6 + 0.5 * Math.sin(t / 300);

    var seen = {};
    S.players.forEach(function (p) {
      if (p.spec) return;
      var d = o.disp[p.id]; if (!d) return;
      if (!o.inView(p) && !S.settings.reveal) { if (players[p.id]) players[p.id].g.visible = false; return; }
      seen[p.id] = 1;
      var e = getPlayer(p), g = e.g; g.visible = !(eye && p.id === me.id);
      var dx = e.lx === null ? 0 : d.x - e.lx, dz = e.lx === null ? 0 : d.y - e.lz; e.lx = d.x; e.lz = d.y;
      var sp = Math.hypot(dx, dz);
      if (sp > 0.25) { var ang = Math.atan2(dx, dz), df = ang - e.head; df = Math.atan2(Math.sin(df), Math.cos(df)); e.head += df * 0.25; e.moving = Math.min(1, e.moving + 0.3); } else e.moving = Math.max(0, e.moving - 0.12);
      g.position.set(d.x, 0, d.y); g.rotation.y = e.head;
      var ph = t / 90, bob = e.moving * Math.abs(Math.sin(ph)) * 2.5, ghost = !p.alive;
      var ud = g.userData; ud.body.position.y = bob + (ghost ? 8 + Math.sin(t / 300) * 3 : 0);
      ud.legs[0].position.z = Math.sin(ph) * 5 * e.moving; ud.legs[1].position.z = -Math.sin(ph) * 5 * e.moving;
      ud.legs[0].visible = ud.legs[1].visible = !ghost; ud.shadow.visible = !ghost;
      setOpacity(g, ghost ? 0.45 : p.vent ? 0.3 : 1);
      // תלבושת
      var hs = p.hat | 0;
      if (e.hat !== hs) { if (e.hs) dyn.remove(e.hs); e.hs = null; e.hat = hs; var ht = hatTex(hs); if (ht) { e.hs = sprite(ht, 96, 96); dyn.add(e.hs); } }
      var top = 52 * 1.3 + bob + (ghost ? 8 : 0);
      if (e.hs) { e.hs.position.set(d.x, top + 8, d.y); e.hs.material.opacity = ghost ? 0.5 : 1; }
      // חיית מחמד
      var pet = p.pet | 0;
      if (e.pet !== pet) { if (e.ps) dyn.remove(e.ps); e.ps = null; e.pet = pet; if (pet && PETS[pet] && PETS[pet] !== '@dreidel') { e.ps = sprite(emojiTex(PETS[pet]), 28, 28); dyn.add(e.ps); } }
      if (e.ps) e.ps.position.set(d.x - Math.sin(e.head) * 40 + 10, 14 + Math.abs(Math.sin(t / 160)) * 5, d.y - Math.cos(e.head) * 40);
      // שם
      var imp = p.team === 'imp' && (p.id === me.id || me.team === 'imp' || o.reveal), txt = cs(p.color) + p.name + (o.reveal && p.role && p.id !== me.id ? ' · ' + p.role : '');
      var nk = txt + (imp ? 'r' : 'w');
      if (e.nm !== nk) { if (e.ns) dyn.remove(e.ns); e.nm = nk; e.ns = sprite(label(txt, imp ? '#ff6b6b' : '#ffffff'), 104, 23); dyn.add(e.ns); }
      e.ns.position.set(d.x, top + 52, d.y);
      if (me.id === p.id) { lights.p.position.set(d.x, 130, d.y); if (eye) { if (e.hs) e.hs.position.y = -999; if (e.ns) e.ns.position.y = -999; if (e.ps) e.ps.position.y = -999; } }
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

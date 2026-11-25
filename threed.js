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
      cv3.addEventListener('pointerdown', function (e) { if (e.pointerType === 'touch' && !meetOn && (window.MM_JOYPOS ? Math.hypot(e.clientX - window.MM_JOYPOS.x * innerWidth, e.clientY - window.MM_JOYPOS.y * innerHeight) <= 110 : e.clientX <= innerWidth * 0.55)) return; /* צד שמאל = ג'ויסטיק */ if (e.pointerType === 'mouse' && e.button !== 0) return; e.preventDefault(); drag = { x: e.clientX, id: e.pointerId }; try { cv3.setPointerCapture(e.pointerId); } catch (er) {} });
      cv3.addEventListener('pointermove', function (e) { if (!drag || e.pointerId !== drag.id) return; if (e.pointerType === 'mouse' && !(e.buttons & 1)) { drag = null; return; } var dx = e.clientX - drag.x; drag.x = e.clientX; Z.yaw -= dx * (3.4 / Math.max(500, cv3.clientWidth)); if (typeof sendInput === 'function') sendInput(); }); // ימינה = פנייה ימינה; גרירה על כל רוחב המסך ≈ 195 מעלות
      cv3.addEventListener('pointerup', function () { drag = null; }); cv3.addEventListener('pointercancel', function () { drag = null; });
      cv3.addEventListener('lostpointercapture', function () { drag = null; }); window.addEventListener('blur', function () { drag = null; }); cv3.addEventListener('contextmenu', function (e) { e.preventDefault(); drag = null; }); cv3.style.userSelect = 'none';
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
    for (var j = 0; j < gy; j++) for (var i = 0; i < gx; i++) wk[j * gx + i] = M.walkable(i * CELL + CELL / 2, j * CELL + CELL / 2, -8) ? 1 : 0; // -8: הקירות עומדים בקצה האמיתי של החדר, לא בתוך השטח שהשחקן יכול להגיע אליו
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
    // חצים ימינה/שמאלה מסובבים את המבט (לא בזמן מיני-משחק)
    if (window.MM_TURN !== false && S.phase === 'play' && typeof keys !== 'undefined' && (typeof miniOpen === 'undefined' || miniOpen === null)) {
      var turn = (keys.has('ArrowLeft') ? 1 : 0) - (keys.has('ArrowRight') ? 1 : 0);
      if (turn) { yaw = Z.yaw += turn * 2.4 * Math.min(0.1, o.dt || 0.016); sy = Math.sin(yaw); cy = Math.cos(yaw); if (typeof sendInput === 'function') sendInput(); }
    }
    var eye = Z.view !== 'out';
    var want = new THREE.Vector3(tp.x + sy * back, up, tp.z + cy * back), look = new THREE.Vector3(tp.x - sy * 90, 30, tp.z - cy * 90);
    if (eye) { var bk = 0; for (var d = 42; d > 0; d -= 6) if (M.walkable(tp.x + sy * d, tp.z + cy * d, 4)) { bk = d; break; } // צעד קטן אחורה כשיש מקום, כדי לא להידבק לקיר שמולך
      want.set(tp.x + sy * bk, 46, tp.z + cy * bk); look.set(tp.x - sy * 220, 36, tp.z - cy * 220); }
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
  // ---- פגישה בתלת מימד: כולם עומדים במעגל ליד כפתור החירום, ומסך ההצבעה מרחף מולם ----
  var meetOn = false, meetYaw = 0, meetLast = 0, ticks = {}, peek = null;
  function meetUI() {
    if (peek) return;
    var st = document.createElement('style');
    st.textContent = 'body.m3d #meeting{background:transparent;pointer-events:none;align-items:flex-start;padding:10px}' +
      'body.m3d #meeting .card{pointer-events:auto;width:min(640px,96%);max-height:62vh;background:rgba(14,30,60,.86);border:2px solid #5fd4ff;box-shadow:0 0 28px rgba(95,212,255,.55),0 26px 40px rgba(0,0,0,.45);animation:mmFloat 4s ease-in-out infinite}' +
      '@media (max-height:520px){body.m3d #meeting .card{max-height:74vh;padding:12px}}' +
      'body.m3d #chatbox{height:74px;min-height:0}body.m3d #msub{margin-bottom:8px}' +
      '@keyframes mmFloat{50%{transform:translateY(7px)}}' +
      'body.m3d.m3d-peek #meeting .card{display:none}' +
      '#peekBtn{position:fixed;left:50%;bottom:calc(14px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:21;display:none;background:#12648a;color:#fff;font-weight:700;border:2px solid #5fd4ff;white-space:nowrap}' +
      'body.m3d #peekBtn{display:block}';
    document.head.appendChild(st);
    peek = document.createElement('button'); peek.id = 'peekBtn'; peek.type = 'button';
    peek.onclick = function () { document.body.classList.toggle('m3d-peek'); paintPeek(); peek.blur(); };
    document.body.appendChild(peek);
  }
  function paintPeek() { var t = document.body.classList.contains('m3d-peek') ? '📺 המסך הגדול – להצביע' : '👀 להסתכל מסביב'; if (peek.dataset.t !== t) { peek.dataset.t = t; peek.textContent = t; } }
  function meetStart(S) {
    meetOn = true; meetYaw = Z.yaw; meetLast = 0; camPos = null; meetUI(); document.body.classList.add('m3d'); document.body.classList.remove('m3d-peek'); paintPeek();
    var seats = seating(S), my = seats.map[S.me.id] || seats.first;
    Z.yaw = Math.atan2(my.x - seats.cx, my.z - seats.cz); // פונים אל מרכז המעגל
  }
  function meetEnd() {
    meetOn = false; Z.yaw = meetYaw; camPos = null; document.body.classList.remove('m3d', 'm3d-peek');
    Object.keys(ticks).forEach(function (i) { ticks[i].visible = false; });
  }
  function seating(S) { // אותו סדר ישיבה אצל כל השחקנים
    var list = S.players.filter(function (p) { return !p.spec; }).sort(function (a, b) { return String(a.id) < String(b.id) ? -1 : 1; });
    var M = MAP, B = M.BUTTON, rad = Math.max(135, list.length * 62 / (2 * Math.PI)), rm = M.roomAt(B.x, B.y), cx = B.x, cz = B.y;
    if (rm) { // כשהכפתור צמוד לקיר, מזיזים את המעגל פנימה לתוך החדר
      var pad = rad + 24;
      cx = rm.w > pad * 2 ? Math.max(rm.x + pad, Math.min(rm.x + rm.w - pad, cx)) : rm.x + rm.w / 2;
      cz = rm.h > pad * 2 ? Math.max(rm.y + pad, Math.min(rm.y + rm.h - pad, cz)) : rm.y + rm.h / 2;
      rad = Math.max(60, Math.min(rad, rm.w / 2 - 24, rm.h / 2 - 24));
    }
    var map = {}, first = null;
    list.forEach(function (p, i) { var a = i / list.length * Math.PI * 2, st = map[p.id] = { x: cx + Math.sin(a) * rad, z: cz + Math.cos(a) * rad }; if (!first) first = st; });
    return { list: list, map: map, cx: cx, cz: cz, rad: rad, first: first || { x: cx, z: cz + rad } };
  }
  function drawMeeting(S, t, W, H) {
    var M = MAP;
    if (built !== (M.id || 'm' + M.WORLD.w) + ':' + (M.theme === 'ice' ? 'i' : 's')) build();
    var pr = Math.min(window.devicePixelRatio || 1, 1.6);
    if (Z._w !== W || Z._h !== H || Z._pr !== pr) { Z._w = W; Z._h = H; Z._pr = pr; R.setPixelRatio(pr); R.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); }
    cv3.style.display = 'block'; document.getElementById('cv').style.visibility = 'hidden';
    var seats = seating(S), my = seats.map[S.me.id] || seats.first, sy = Math.sin(Z.yaw), cy = Math.cos(Z.yaw);
    if (camera.fov !== 72) { camera.fov = 72; camera.updateProjectionMatrix(); }
    var ex = my.x, ez = my.z; for (var d = 78; d > 0; d -= 6) if (M.walkable(my.x + (my.x - seats.cx) / seats.rad * d, my.z + (my.z - seats.cz) / seats.rad * d, 4)) { ex = my.x + (my.x - seats.cx) / seats.rad * d; ez = my.z + (my.z - seats.cz) / seats.rad * d; break; }
    camera.position.set(ex, 118, ez); camera.lookAt(ex - sy * 200, 92, ez - cy * 200);
    var fogc = M.theme === 'ice' ? 0xc9dbe8 : 0x04050b; scene.fog = new THREE.Fog(fogc, 1600, 2600); scene.background = new THREE.Color(fogc);
    lights.p.position.set(seats.cx, 150, seats.cz);
    for (var ai = 0; ai < anims.length; ai++) anims[ai](t);
    if (hanG) hanG.visible = !!S.hanuk;
    if (Z.btn) Z.btn.material.emissiveIntensity = 0.6 + 0.5 * Math.sin(t / 300);
    [bodyPool, emoPool, sabM, doorM].forEach(function (a) { a.forEach(function (m) { if (m) m.visible = false; }); });
    Object.keys(beacons).forEach(function (i) { beacons[i].visible = false; });
    var voted = (S.meeting && S.meeting.voted) || [], here = {};
    seats.list.forEach(function (p) {
      var st = seats.map[p.id], e = getPlayer(p), mine = p.id === S.me.id, show = !mine && (p.alive || !S.me.alive);
      here[p.id] = show;
      e.g.visible = show; e.g.position.set(st.x, 0, st.z); e.head = Math.atan2(seats.cx - st.x, seats.cz - st.z); e.g.rotation.y = e.head; e.lx = null; e.moving = 0;
      e.g.userData.body.position.y = p.alive ? 0 : 8; e.g.userData.shadow.visible = p.alive; setOpacity(e.g, p.alive ? 1 : 0.45);
      var hs = p.hat | 0;
      if (e.hat !== hs) { if (e.hs) dyn.remove(e.hs); e.hs = null; e.hat = hs; var ht = hatTex(hs); if (ht) { e.hs = sprite(ht, 96, 96); dyn.add(e.hs); } }
      var nk = p.name + p.color + 'm';
      if (e.nm !== nk) { if (e.ns) dyn.remove(e.ns); e.nm = nk; e.ns = sprite(label(cs(p.color) + p.name, '#ffffff'), 76, 17); dyn.add(e.ns); }
      var top = 52 * 1.3;
      if (e.hs) { e.hs.position.set(st.x, top + 8, st.z); e.hs.visible = show; }
      e.ns.position.set(st.x, top + 26, st.z); e.ns.visible = show;
      if (e.ps) e.ps.visible = false;
      var tk = ticks[p.id]; if (!tk) { tk = ticks[p.id] = sprite(emojiTex('✅'), 22, 22); }
      if (tk.parent !== dyn) dyn.add(tk);
      tk.position.set(st.x, top + 48, st.z); tk.visible = show && voted.indexOf(p.id) >= 0;
    });
    Object.keys(players).forEach(function (id) { if (!here[id]) { var e = players[id]; [e.g, e.hs, e.ns, e.ps].forEach(function (o) { if (o) o.visible = false; }); } });
    R.render(scene, camera);
  }
  function meetLoop(t) {
    requestAnimationFrame(meetLoop);
    var s = typeof S !== 'undefined' ? S : null, want = !!(window.MM_V3 && Z.ok && R && s && s.phase === 'meeting');
    if (!want) { if (meetOn) meetEnd(); return; }
    if (meetOn && t - meetLast < 30) return;
    try { if (!meetOn) meetStart(s); meetLast = t; drawMeeting(s, t, innerWidth, innerHeight); paintPeek(); } catch (e) { console.error('meet3d', e); meetEnd(); Z.hide(); Z.ok = false; }
  }
  requestAnimationFrame(meetLoop);
  Z.meetFrame = meetLoop;

  Z.kit = { makeBean: makeBean, sprite: sprite, label: label, hatTex: hatTex, setOpacity: setOpacity };
  Z.reset = function () { camPos = null; built = null; };
  init();
})();
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
// ---------- אנימציות המשחק בתלת מימד (פרו): הכרזה על ישיבה, הצבעה והדחה, ניצחון וחיסול ----------
// מצויר ברנדרר נסתר ומועתק לקנבסים הקיימים; כשהתלת מימד כבוי נשארות האנימציות הרגילות.
(function () {
  var Z = window.MM_3D; if (!Z || !Z.kit || !Z.ok) return;
  var K = Z.kit, R2 = null, V = null;
  function on() { return !!(window.MM_V3 && Z.ok); }
  function renderer(w, h) {
    if (!R2) { R2 = new THREE.WebGLRenderer({ antialias: true, alpha: true }); V = new THREE.Vector3(); }
    if (R2.domElement.width !== w || R2.domElement.height !== h) R2.setSize(w, h, false);
    return R2;
  }
  function stage(w, h, fov) {
    var sc = new THREE.Scene(), cam = new THREE.PerspectiveCamera(fov || 40, w / h, 5, 6000);
    sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x242a40, 1.05));
    var d = new THREE.DirectionalLight(0xffffff, 0.9); d.position.set(-200, 400, 300); sc.add(d);
    return { sc: sc, cam: cam, w: w, h: h };
  }
  function snap(st, g) { var r = renderer(st.w, st.h); r.render(st.sc, st.cam); g.drawImage(r.domElement, 0, 0); }
  function at(st, x, y, z) { st.cam.updateMatrixWorld(); V.set(x, y, z).project(st.cam); return { x: (V.x + 1) / 2 * st.w, y: (1 - V.y) / 2 * st.h }; }
  function actor(st, color, hat, ghost) {
    var b = K.makeBean(color || '#cccccc'), t = hat ? K.hatTex(hat | 0) : null;
    if (t) { var s = K.sprite(t, 74, 74); s.position.y = 58; b.add(s); if (ghost) s.material.opacity = 0.5; }
    if (ghost) { K.setOpacity(b, 0.5); b.userData.shadow.visible = false; }
    st.sc.add(b); return b;
  }
  function mesh(st, geo, color, x, y, z, opts) { var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: 0.5, metalness: 0.2 }, opts || {}))); m.position.set(x || 0, y || 0, z || 0); st.sc.add(m); return m; }
  var box = function (w, h, d) { return new THREE.BoxGeometry(w, h, d); }, cyl = function (a, b, h) { return new THREE.CylinderGeometry(a, b, h, 32); };
  function stars(st, n, spread) {
    var p = []; for (var i = 0; i < n; i++) p.push(((i * 137.5) % 100 / 100 - 0.5) * spread, ((i * 89.3) % 100 / 100 - 0.5) * spread * 0.6, -300 - (i * 53) % 500);
    var g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    var m = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 4 })); st.sc.add(m); return m;
  }
  function text(g, s, x, y, font, col, lw) { g.font = font; g.textAlign = 'center'; g.lineWidth = lw || 3; g.strokeStyle = 'rgba(0,0,0,.85)'; g.fillStyle = col || '#fff'; g.strokeText(s, x, y); g.fillText(s, x, y); }

  // ---- הכרזה לפני ישיבה ----
  var alertAnim = 0, alertKey = '', origAlert = renderAlert;
  renderAlert = function (s) {
    origAlert(s);
    var a = s.alert; if (!a || !on()) return;
    var key = JSON.stringify(a), c = document.getElementById('alertCv');
    if (key === alertKey && alertAnim) return;
    alertKey = key; cancelAnimationFrame(alertAnim);
    var st = stage(720, 400, 40), start = performance.now(), who, btn;
    st.cam.position.set(0, 120, 300); st.cam.lookAt(0, 42, 0);
    mesh(st, cyl(190, 190, 6), a.body ? 0x3a3020 : 0x3a2028, 0, -4, 0);
    who = actor(st, a.color, a.hat); who.scale.setScalar(1.7);
    if (a.body) {
      who.position.set(-80, 0, 0); who.rotation.y = 0.75;
      var horn = mesh(st, new THREE.ConeGeometry(18, 40, 24, 1, true), 0xe8edf2, -35, 40, 28, { side: THREE.DoubleSide }); horn.rotation.set(0, -0.35, Math.PI / 2);
      var dead = actor(st, a.bodyColor, 0); dead.scale.setScalar(1.4); dead.rotation.z = Math.PI / 2; dead.position.set(125, 24, 0); dead.userData.shadow.visible = false;
      mesh(st, box(7, 7, 44), 0xf3efe0, 78, 48, 0);
    } else {
      who.position.set(-75, 0, -10); who.rotation.y = 0.7;
      mesh(st, cyl(62, 70, 26), 0x6a7080, 65, 13, 10);
      btn = mesh(st, cyl(44, 48, 28), 0xe02424, 65, 40, 10, { emissive: 0x601010, roughness: 0.3 });
    }
    (function frame() {
      if (document.getElementById('alert').classList.contains('hidden') || !on()) { alertAnim = 0; return; }
      var t = (performance.now() - start) / 1000, g = c.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 720, 400);
      g.save(); g.translate(360, 210); g.rotate(t * 0.5); g.fillStyle = a.body ? 'rgba(255,181,71,.12)' : 'rgba(255,90,90,.18)';
      for (var i = 0; i < 16; i++) { g.rotate(Math.PI / 8); g.beginPath(); g.moveTo(0, 0); g.lineTo(430, -50); g.lineTo(430, 50); g.closePath(); g.fill(); }
      g.restore();
      var jump = Math.abs(Math.sin(t * 5));
      who.position.y = jump * 14; if (btn) btn.position.y = 40 - (jump < 0.25 ? 10 : 0);
      var ang = Math.sin(t * 0.9) * 0.35; st.cam.position.set(Math.sin(ang) * 300, 120, Math.cos(ang) * 300); st.cam.lookAt(0, 42, 0);
      snap(st, g);
      if (!a.body) text(g, '!', 470, 90, 'bold 60px Rubik, Arial', '#fff', 6);
      alertAnim = requestAnimationFrame(frame);
    })();
  };

  // ---- מי הצביע על מי, ואז ההדחה לחלל ----
  var origVote = voteScene;
  voteScene = function (e) {
    if (!on()) return origVote(e);
    var cv = document.getElementById('voteCv'); if (!cv) return;
    var vs = e.votes || [], n = vs.length, start = performance.now(), lines = ejectLines(e), line1 = lines[0], line2 = lines[1];
    var tAll = 0.4 + n * 0.3 + 0.45, tV = n ? tAll + 1 : 0, pos = {};
    // שולחן הישיבות
    var tb = stage(640, 360, 40); tb.cam.position.set(0, 300, 390); tb.cam.lookAt(0, 0, 8);
    var top = mesh(tb, cyl(115, 105, 20), 0x2c3550, 0, 14, 0); top.scale.x = 1.35;
    mesh(tb, cyl(20, 22, 10), 0xe02424, 0, 28, 0, { emissive: 0x501010 });
    var floor = mesh(tb, cyl(290, 290, 4), 0x141a2e, 0, -4, 0); floor.scale.z = 0.7;
    var beans = {}, arrows = [];
    vs.forEach(function (v, i) {
      var a = Math.PI / 2 + (i / n) * Math.PI * 2; pos[v.id] = { x: Math.cos(a) * 215, z: Math.sin(a) * 140 };
      var b = beans[v.id] = actor(tb, v.c, v.hat); b.position.set(pos[v.id].x, 0, pos[v.id].z);
    });
    vs.forEach(function (v, i) {
      var p = pos[v.id], q = v.to === 'p' && pos[v.tid];
      beans[v.id].rotation.y = q ? Math.atan2(q.x - p.x, q.z - p.z) : Math.atan2(-p.x, -p.z);
      if (!q) return;
      var dx = q.x - p.x, dz = q.z - p.z, L = Math.hypot(dx, dz) || 1, ux = dx / L, uz = dz / L;
      var grp = new THREE.Group(), rad = v.w > 1 ? 5 : 3.2;
      var mat = new THREE.MeshBasicMaterial({ color: v.c });
      var rod = new THREE.Mesh(cyl(rad, rad, 1), mat); rod.rotation.z = -Math.PI / 2; grp.add(rod);
      var tip = new THREE.Mesh(new THREE.ConeGeometry(rad * 2.8, 20, 16), mat); tip.rotation.z = -Math.PI / 2; grp.add(tip);
      grp.position.set(p.x + ux * 28 - uz * 6, 62 + (i % 3) * 5, p.z + uz * 28 + ux * 6); grp.rotation.y = Math.atan2(-uz, ux); tb.sc.add(grp);
      arrows.push({ i: i, v: v, g: grp, rod: rod, tip: tip, len: Math.max(20, L - 76) });
    });
    // החלל
    var sp = stage(640, 360, 45); sp.cam.position.set(0, 0, 420); sp.cam.lookAt(0, 0, 0);
    var sky = stars(sp, 220, 1600), ship = new THREE.Group(); sp.sc.add(ship);
    var part = function (geo, col, x, y, z) { var m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: col, roughness: 0.5, metalness: 0.4 })); m.position.set(x, y, z); ship.add(m); return m; };
    part(box(150, 520, 120), 0x5a6378, -290, 0, -20);
    for (var yy = -180; yy <= 180; yy += 60) part(box(154, 5, 124), 0x3f4659, -290, yy, -20);
    part(box(20, 110, 90), 0x11131c, -212, 0, 0);
    for (var k = 0; k < 6; k++) part(box(14, 18, 96), k % 2 ? 0x222222 : 0xffd646, -208, -45 + k * 18, 0).scale.x = 0.6;
    var ej = null; if (e.id) { ej = actor(sp, e.c, e.hat); ej.userData.shadow.visible = false; }

    cancelAnimationFrame(voteAnim);
    var frame = function () {
      if (!document.body.contains(cv) || document.getElementById('eject').classList.contains('hidden')) return;
      var t = (performance.now() - start) / 1000, g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0); g.direction = 'inherit';
      var bg = g.createLinearGradient(0, 0, 0, 360); bg.addColorStop(0, '#05060f'); bg.addColorStop(1, '#0d1430'); g.fillStyle = bg; g.fillRect(0, 0, 640, 360);
      if (t < tV) {
        var prog = vs.map(function (v, i) { return Math.max(0, Math.min(1, (t - 0.4 - i * 0.3) / 0.45)); }), cnt = {};
        arrows.forEach(function (a) {
          var p = prog[a.i], len = a.len * (1 - Math.pow(1 - p, 3)); a.g.visible = p > 0;
          a.rod.scale.y = Math.max(0.01, len); a.rod.position.x = len / 2; a.tip.position.x = len + 8;
          if (p >= 1) cnt[a.v.tid] = (cnt[a.v.tid] || 0) + a.v.w;
        });
        vs.forEach(function (v) { var out = e.id === v.id && t > tAll, b = beans[v.id]; b.position.x = pos[v.id].x + (out ? Math.sin(t * 40) * 3 : 0); b.position.y = out ? (t - tAll) * 26 : 0; });
        snap(tb, g);
        g.direction = 'rtl';
        vs.forEach(function (v, i) {
          var p = pos[v.id], foot = at(tb, p.x, -6, p.z), head = at(tb, p.x, 92, p.z);
          text(g, v.n.length > 12 ? v.n.slice(0, 11) + '…' : v.n, foot.x, foot.y + 10, 'bold 13px Rubik, Arial');
          if (prog[i] > 0 && v.to !== 'p') text(g, v.to === 'skip' ? T('⏭ דילג') : T('💤 לא הצביע'), head.x, head.y, '13px Rubik, Arial');
          if (cnt[v.id]) { g.fillStyle = '#ff4d4d'; g.beginPath(); g.arc(head.x + 24, head.y + 8, 11, 0, 7); g.fill(); g.fillStyle = '#fff'; g.font = 'bold 13px Rubik, Arial'; g.textAlign = 'center'; g.fillText(cnt[v.id], head.x + 24, head.y + 13); }
        });
      } else {
        var u = t - tV;
        sky.position.x = -u * 40; ship.position.x = -u * 34;
        if (ej) { var x = -200 + u * 120 + u * u * 14; ej.position.set(x, -34 + Math.sin(u * 2.2) * 26 + u * 6, 40 - u * 90); ej.rotation.set(u * 2.4, u * 3.1, -u * 3.6); ej.scale.setScalar(Math.max(0.8, 2 - u * 0.2)); ej.visible = x < 460; }
        snap(sp, g);
        if (u < 0.5) { g.fillStyle = 'rgba(255,255,255,' + (0.5 - u) + ')'; g.fillRect(70, 130, 570, 100); }
        var t0 = e.id ? 1.6 : 0.5, cps = 22; g.direction = 'rtl';
        var type = function (s, y, from, font, col) { var m = Math.max(0, Math.min(s.length, Math.floor((u - from) * cps))); if (m) text(g, s.slice(0, m), 320, y, font, col, 5); };
        type(line1, 90, t0, 'bold 30px Rubik, Arial', e.jester ? '#ff9f1c' : e.team === 'imp' ? '#ff5a5a' : '#fff');
        if (line2) type(line2, 316, t0 + line1.length / cps + 0.35, '22px Rubik, Arial', '#ffd646');
      }
      voteAnim = requestAnimationFrame(frame);
    };
    frame();
  };

  // ---- מסיבת ניצחון ----
  var origDance = danceScene;
  danceScene = function (s, roles) {
    var cv = document.getElementById('endCv'), w = s.winner;
    if (!on() || w.team === 'race' || w.team === 'nobody') return origDance(s, roles);
    var sig = '3d' + JSON.stringify([w, s.roster.map(function (p) { return p.id + p.alive; })]);
    if (sig === danceSig && danceAnim) return;
    if (sig !== danceSig) victoryMusic(w.team);
    danceSig = sig; cancelAnimationFrame(danceAnim); danceAnim = 0;
    cv.style.display = 'block';
    var all = s.roster.filter(function (p) { return !p.spec; }).map(function (p) { return Object.assign({}, p, { team: (roles[p.id] || {}).team }); });
    var winners = w.team === 'jester' ? all.filter(function (p) { return p.id === w.jester || p.team === 'jester'; }) : all.filter(function (p) { return p.team === w.team || (w.team === 'imp' && p.team === 'mole'); });
    var jester = w.team === 'jester' ? null : all.find(function (p) { return (roles[p.id] || {}).roleKey === 'jester'; });
    var st = stage(640, 300, 38), start = performance.now();
    var tiles = []; for (var i = 0; i < 14; i++) for (var j = 0; j < 6; j++) tiles.push(mesh(st, box(56, 6, 56), 0x1a2036, (i - 6.5) * 58, -6, (j - 3) * 58));
    var beams = [0xffd646, 0x4dd2ff, 0xff6bd6, 0x7dff7a].map(function (col, i) {
      var geo = new THREE.ConeGeometry(55, 320, 20, 1, true); geo.translate(0, -160, 0);
      var m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.13, side: THREE.DoubleSide, depthWrite: false })); m.position.set((i - 1.5) * 150, 250, -40); st.sc.add(m); return m;
    });
    var cols = Math.min(7, winners.length) || 1;
    var dancers = winners.map(function (p, i) {
      var row = Math.floor(i / cols), inRow = Math.min(cols, winners.length - row * cols), x = ((i % cols) - (inRow - 1) / 2) * Math.min(90, 440 / cols), z = 20 - row * 80;
      var b = actor(st, p.color, p.hat, !p.alive); b.position.set(x, 0, z); return { p: p, b: b, x: x, z: z };
    });
    var jb = null;
    if (jester) { mesh(st, box(64, 12, 50), 0x2b3350, 250, 16, 40); jb = actor(st, jester.color, jester.hat); jb.position.set(250, 14, 40); jb.rotation.y = -0.6; jb.userData.shadow.visible = false; }
    var confGeo = new THREE.PlaneGeometry(7, 4), confMats = [0xffd646, 0x4dd2ff, 0xff6bd6, 0x7dff7a, 0xff9f1c].map(function (c) { return new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide }); });
    var conf = []; for (i = 0; i < 80; i++) { var m = new THREE.Mesh(confGeo, confMats[i % 5]); st.sc.add(m); conf.push(m); }
    var frame = function () {
      if (!document.body.contains(cv) || document.getElementById('end').classList.contains('hidden')) { danceAnim = 0; return; }
      var t = (performance.now() - start) / 1000, g = cv.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      var bg = g.createLinearGradient(0, 0, 0, 300); bg.addColorStop(0, '#141a33'); bg.addColorStop(1, '#0a0d1a'); g.fillStyle = bg; g.fillRect(0, 0, 640, 300);
      var beat = Math.floor(t * 3);
      tiles.forEach(function (m, i) { var a = Math.floor(i / 6), b = i % 6; m.material.color.setHex((beat + a + b) % 3 === 0 ? [0x4b3f9a, 0x2f7f9a, 0x9a3f7f][(a + b) % 3] : 0x1a2036); });
      beams.forEach(function (b, i) { b.rotation.z = Math.sin(t * 1.3 + i * 1.7) * 0.5; });
      dancers.forEach(function (d, i) { var ph = t * 6 + i * 1.3; d.b.position.y = Math.abs(Math.sin(ph)) * 30; d.b.rotation.z = Math.sin(ph / 2) * 0.28; d.b.rotation.y = (t + i * 0.7) % 5 < 1 ? ((t + i * 0.7) % 5) * Math.PI * 2 : Math.sin(t * 1.5 + i) * 0.5; });
      conf.forEach(function (m, i) { m.position.set(((i * 97) % 600) - 300 + Math.sin(t * 2 + i) * 10, 230 - ((t * (40 + (i % 7) * 12) + (i * 53) % 240) % 240), ((i * 41) % 160) - 70); m.rotation.set(t * 3 + i, t * 2 + i, i); });
      var ang = Math.sin(t * 0.4) * 0.28; st.cam.position.set(Math.sin(ang) * 480, 170, Math.cos(ang) * 480); st.cam.lookAt(0, 38, 0);
      snap(st, g);
      g.direction = 'rtl';
      dancers.forEach(function (d) { var f = at(st, d.x, -4, d.z); text(g, d.p.name, f.x, Math.min(294, f.y + 14), 'bold 12px Rubik, Arial'); });
      if (jester) { var h = at(st, 250, 104, 40), f2 = at(st, 250, -4, 40); text(g, '😒', h.x, h.y, '19px serif'); text(g, '🤡 ' + jester.name, f2.x, Math.min(294, f2.y + 14), 'bold 12px Rubik, Arial', '#ff9f1c'); }
      danceAnim = requestAnimationFrame(frame);
    };
    frame();
  };

  // ---- חיסול: שתי הדמויות בתלת מימד, באותם מקומות של האנימציה הרגילה (הנקודה בפיקסלים = יחידה בעולם) ----
  var kill = null;
  window.MM_KILL3D = function (g, W, H, kd, a, b) {
    if (!on()) return false;
    var key = [W, H, kd.at, kd.by.color, kd.me.color].join();
    if (!kill || kill.key !== key) {
      var st = stage(W, H, 30), dist = H / 2 / Math.tan(15 * Math.PI / 180);
      st.cam.position.set(0, 0, dist); st.cam.far = dist + 4000; st.cam.updateProjectionMatrix();
      var make = function (c, hat) { var holder = new THREE.Group(), bean = K.makeBean(c), t = hat ? K.hatTex(hat | 0) : null; bean.userData.shadow.visible = false; if (t) { var s = K.sprite(t, 74, 74); s.position.y = 58; bean.add(s); } bean.scale.setScalar(1); bean.position.y = -22; holder.add(bean); st.sc.add(holder); return { holder: holder, bean: bean }; };
      kill = { key: key, st: st, a: make(kd.by.color, kd.by.hat), b: make(kd.me.color, kd.me.hat) };
    }
    [[kill.a, a, 0.9], [kill.b, b, -0.9]].forEach(function (q) {
      var o = q[0], v = q[1];
      o.holder.position.set(v.x - W / 2, H / 2 - v.y, 0); o.holder.scale.setScalar(Math.max(0.01, v.sc * 1.15)); o.holder.rotation.z = -v.rot;
      o.bean.rotation.y = q[2] + (v.ghost ? v.rot : 0); K.setOpacity(o.bean, v.ghost ? 0.5 : 1); o.bean.userData.shadow.visible = false;
    });
    snap(kill.st, g);
    return true;
  };
})();

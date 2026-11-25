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

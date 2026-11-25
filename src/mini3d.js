// ---------- משימות בתלת מימד (פרו): כשהתלת מימד פעיל, המשחקון של המשימה מוחלף במשחקון תלת מימדי ----------
(function () {
  var Z = window.MM_3D; if (!Z || !Z.kit || !Z.ok) return;
  var K = Z.kit, R = null;
  // סוג המשחקון הרגיל -> [מנגנון תלת מימדי, אייקון]. משימות הפרו החדשות מגיעות עם d3 משלהן. מה שלא כאן (חידונים ומבוך) נשאר שטוח
  var BY_KIND = {
    wires: ['pairs', '🔌'], dial: ['dial', '🎛️'], code: ['order', '🔢'], switches: ['memory', '🔘'], simon: ['memory', '🎵'], sliders: ['dial', '🎚️'], tapfill: ['timing', '🛢️'], sortnum: ['order', '🔢'],
    pairs: ['pairs', '🧬'], catch: ['tap', '🛸'], timing: ['timing', '🎯'], pattern: ['memory', '🧩'], bins: ['sort', '📦'], balance: ['dial', '⚖️'], track: ['tap', '📡'], charge: ['timing', '🔋'],
    valve: ['dial', '🚰'], lights: ['memory', '💡'], swipe: ['timing', '💳'], scrub: ['scrub', '🧽'], combo: ['dial', '🔐'], pipes: ['order', '🔧'], download: ['timing', '💾'], slide: ['stack', '📦'],
    reflex: ['timing', '⚡'], dreidel: ['spin', '🌀'], gelt: ['pairs', '🪙'], menorahmem: ['memory', '🕯️'], sufganiya: ['timing', '🍩'], oil: ['timing', '🫒']
  };
  var HINT = {
    tap: ['לחץ על כל החפצים המרחפים', 'Tap every floating object'], order: ['לחץ על הקוביות לפי הסדר: 1, 2, 3…', 'Tap the cubes in order: 1, 2, 3…'],
    memory: ['צפה אילו עמודים נדלקים, ואז לחץ באותו סדר', 'Watch which pillars light up, then tap them in the same order'], pairs: ['הפוך קלפים ומצא את כל הזוגות', 'Flip the cards and find all pairs'],
    timing: ['לחץ כשהכדור בתוך האזור הירוק (3 פעמים)', 'Tap when the ball is in the green zone (3 times)'], dial: ['גרור ימינה ושמאלה עד שהחץ על הסימן הירוק, והרפה', 'Drag left or right until the arrow hits the green mark, then release'],
    sort: ['לחץ על הארגז בצבע של הכדור', 'Tap the bin that matches the ball colour'], scrub: ['העבר את האצבע על הלכלוך עד שהכול נקי', 'Drag over the dirt until it is all clean'],
    catch: ['גרור את הסל ותפוס 6', 'Drag the basket and catch 6'], stack: ['לחץ כדי להניח את הקופסה על המגדל (4 קומות)', 'Tap to drop the box onto the tower (4 floors)'], spin: ['לחץ כדי לסובב את הסביבון (3 פעמים)', 'Tap to spin the dreidel (3 times)']
  };
  var COLORS = [0xe53935, 0x1e88e5, 0x43a047, 0xfdd835, 0x8e44ad, 0xfb8c00];
  var rnd = function (a, b) { return a + Math.random() * (b - a); };
  var mat = function (c, o) { return new THREE.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.45, metalness: 0.2 }, o || {})); };
  var mesh = function (geo, c, parent, x, y, z, o) { var m = new THREE.Mesh(geo, mat(c, o)); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; };
  var box = function (w, h, d) { return new THREE.BoxGeometry(w, h, d); }, cyl = function (a, b, h) { return new THREE.CylinderGeometry(a, b, h, 28); }, ball = function (r) { return new THREE.SphereGeometry(r, 24, 16); };
  function icon(parent, e, size, x, y, z) { var s = K.sprite(emo(e), size, size); s.position.set(x || 0, y || 0, z || 0); s.renderOrder = 5; parent.add(s); return s; }
  var emoCache = {};
  function emo(e) {
    return emoCache[e] || (emoCache[e] = (function () { var c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = 128; g.font = '96px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(e, 64, 70); return new THREE.CanvasTexture(c); })());
  }

  // כל מנגנון מקבל את הסצנה (G.sc, תחום בערך x: ‎-5..5, y: ‎-3..4) ומחזיר { down, move, up, tick }
  var GAMES = {
    tap: function (G) {
      var left = 6, items = [];
      for (var i = 0; i < 6; i++) {
        var o = new THREE.Group(); mesh(ball(0.7), COLORS[i], o, 0, 0, 0, { transparent: true, opacity: 0.45 }); icon(o, G.icon, 1.3, 0, 0, 0.8); G.sc.add(o);
        o.userData = { x: rnd(-3.8, 3.8), y: rnd(-1.4, 2.4), z: rnd(-1.5, 1), p: rnd(0, 6), s: rnd(0.8, 1.8) }; items.push(o);
      }
      G.info('0/6');
      return {
        tick: function (t) { items.forEach(function (o) { var u = o.userData; o.position.set(u.x + Math.sin(t * u.s + u.p) * 1.1, u.y + Math.cos(t * u.s * 1.3 + u.p) * 0.7, u.z); }); },
        down: function () { var o = G.hit(items); if (!o || !o.visible) return; o.visible = false; items.splice(items.indexOf(o), 1); G.info((6 - --left) + '/6'); if (!left) G.win(); }
      };
    },
    order: function (G) {
      var n = 6, next = 1, cubes = [], slots = [0, 1, 2, 3, 4, 5].sort(function () { return Math.random() - 0.5; });
      slots.forEach(function (sl, i) {
        var o = new THREE.Group(); var c = mesh(box(1.7, 1.7, 1.2), COLORS[i], o); icon(o, String(i + 1), 1.7, 0, -0.1, 1); icon(o, G.icon, 0.8, 0.55, 0.75, 0.9);
        o.position.set((sl % 3 - 1) * 2.7, sl < 3 ? 1.8 : -0.6, 0); G.sc.add(o); o.userData = { n: i + 1, c: c }; cubes.push(o);
      });
      return {
        tick: function (t) { cubes.forEach(function (o, i) { o.rotation.y = Math.sin(t * 1.4 + i) * 0.28; o.position.z = o.userData.n < next ? -1.2 : 0; }); },
        down: function () {
          var o = G.hit(cubes); if (!o) return;
          if (o.userData.n === next) { o.userData.c.material.emissive.setHex(0x1a7a3a); next++; G.info((next - 1) + '/' + n); if (next > n) G.win(); }
          else if (o.userData.n > next) { next = 1; cubes.forEach(function (q) { q.userData.c.material.emissive.setHex(0); }); G.info(G.en ? 'Wrong – start again' : 'טעות – מתחילים מ-1'); }
        }
      };
    },
    memory: function (G) {
      var pads = [], seq = [], at = 0, show = 0, start = 0.8, input = false;
      for (var i = 0; i < 4; i++) { var o = new THREE.Group(), c = mesh(cyl(0.85, 0.95, 2.4), COLORS[i], o); icon(o, G.icon, 1, 0, 1.9, 0); o.position.set((i - 1.5) * 2.3, -0.4, 0); G.sc.add(o); o.userData = { c: c, i: i, lit: 0 }; pads.push(o); }
      for (i = 0; i < 4; i++) seq.push(Math.floor(Math.random() * 4));
      var now = 0;
      return {
        tick: function (t) {
          now = t;
          if (!input) { var step = Math.floor((t - start) / 0.7); if (step >= seq.length) { input = true; at = 0; G.info(G.en ? 'Your turn!' : 'עכשיו אתה!'); } else if (step >= 0 && step >= show) { pads[seq[step]].userData.lit = t + 0.42; show = step + 1; } }
          pads.forEach(function (o) { var on = o.userData.lit > t; o.userData.c.material.emissive.setHex(on ? 0xffffff : 0); o.userData.c.material.emissiveIntensity = 0.7; o.position.y = on ? 0 : -0.4; });
        },
        down: function () {
          if (!input) return; var o = G.hit(pads); if (!o) return; o.userData.lit = now + 0.25;
          if (o.userData.i === seq[at]) { G.info(++at + '/' + seq.length); if (at === seq.length) G.win(); }
          else { input = false; show = 0; start = now + 0.9; G.info(G.en ? 'Watch again' : 'טעות – צפה שוב'); }
        }
      };
    },
    pairs: function (G) {
      var faces = [G.icon, '⭐', '🚀', '💎'], deck = faces.concat(faces).sort(function () { return Math.random() - 0.5; }), cards = [], open = [], found = 0, now = 0, closeAt = 0;
      deck.forEach(function (f, i) {
        var o = new THREE.Group(); mesh(box(1.8, 2.1, 0.25), 0x3d5afe, o); var s = icon(o, f, 1.4, 0, 0, 0.3); s.visible = false; var q = icon(o, '?', 1.5, 0, 0, 0.35);
        o.position.set((i % 4 - 1.5) * 2.15, i < 4 ? 1.7 : -0.8, 0); G.sc.add(o); o.userData = { f: f, s: s, q: q, up: false, done: false, a: 0 }; cards.push(o);
      });
      var flip = function (o, up) { o.userData.up = up; o.userData.a = Math.PI; };
      return {
        tick: function (t, dt) {
          now = t; if (closeAt && t > closeAt) { open.forEach(function (o) { flip(o, false); }); open = []; closeAt = 0; }
          cards.forEach(function (o) { var u = o.userData; u.a = Math.max(0, u.a - dt * 14); o.rotation.y = u.a > Math.PI / 2 ? Math.PI - u.a : u.a; u.s.visible = u.up; u.q.visible = !u.up; });
        },
        down: function () {
          var o = G.hit(cards); if (!o || o.userData.up || open.length >= 2) return; flip(o, true); open.push(o);
          if (open.length < 2) return;
          if (open[0].userData.f === open[1].userData.f) { open.forEach(function (c) { c.userData.done = true; c.children[0].material.color.setHex(0x2e9e55); }); open = []; G.info(++found + '/4'); if (found === 4) G.win(); }
          else closeAt = now + 0.8;
        }
      };
    },
    timing: function (G) {
      var hits = 0, ang = 0, zone = rnd(0, 6.28), width = 0.8, dir = 1;
      mesh(new THREE.TorusGeometry(2.6, 0.22, 16, 80), 0x4a557a, G.sc, 0, 0.4, 0);
      var green = mesh(new THREE.TorusGeometry(2.6, 0.36, 16, 30, width), 0x2ecc71, G.sc, 0, 0.4, 0, { emissive: 0x115522 });
      var dot = mesh(ball(0.42), 0xffd646, G.sc, 0, 0, 0.35, { emissive: 0x553300 });
      var mid = icon(G.sc, G.icon, 2.2, 0, 0.4, 0);
      G.info('0/3');
      return {
        tick: function (t, dt) { ang = (ang + dir * dt * (2.2 + hits * 0.4) + 6.2832) % 6.2832; green.rotation.z = zone; dot.position.set(Math.cos(ang) * 2.6, 0.4 + Math.sin(ang) * 2.6, 0.35); mid.scale.setScalar(2.2 + Math.sin(t * 4) * 0.12); },
        down: function () {
          var d = (ang - zone + 6.2832) % 6.2832;
          if (d <= width + 0.12 || d > 6.2832 - 0.12) { G.info(++hits + '/3'); zone = rnd(0, 6.28); dir = -dir; if (hits === 3) G.win(); }
          else G.info(hits + '/3 · ' + (G.en ? 'missed' : 'פספוס'));
        }
      };
    },
    dial: function (G) {
      var knob = new THREE.Group(); G.sc.add(knob); knob.position.y = 0.4;
      var body = mesh(cyl(2.1, 2.3, 0.9), 0x8a93ad, knob, 0, 0, 0, { metalness: 0.7, roughness: 0.3 }); body.rotation.x = Math.PI / 2;
      for (var i = 0; i < 12; i++) mesh(box(0.14, 0.4, 0.2), 0x222838, knob, Math.sin(i * Math.PI / 6) * 1.75, Math.cos(i * Math.PI / 6) * 1.75, 0.5);
      mesh(box(0.3, 1.6, 0.3), 0xe53935, knob, 0, 0.8, 0.6, { emissive: 0x551010 });
      var target = rnd(1, 5.2), val = 0, grab = null;
      var mark = mesh(ball(0.35), 0x2ecc71, G.sc, Math.sin(target) * 2.9, 0.4 + Math.cos(target) * 2.9, 0.2, { emissive: 0x1a7a3a });
      icon(G.sc, G.icon, 1.3, 0, 0.4, 1.4);
      var off = function () { var d = (val - target) % 6.2832; if (d > 3.1416) d -= 6.2832; if (d < -3.1416) d += 6.2832; return Math.abs(d); };
      return {
        tick: function (t) { knob.rotation.z = -val; mark.scale.setScalar(off() < 0.16 ? 1.5 + Math.sin(t * 10) * 0.2 : 1); },
        down: function (p) { grab = p.x; }, move: function (p) { if (grab === null) return; val = (val + (p.x - grab) * 3.2 + 6.2832) % 6.2832; grab = p.x; G.info(off() < 0.16 ? (G.en ? 'Release!' : 'הרפה!') : ''); },
        up: function () { if (grab === null) return; grab = null; if (off() < 0.16) G.win(); }
      };
    },
    sort: function (G) {
      var bins = [], left = 6, col = 0;
      for (var i = 0; i < 3; i++) { var o = new THREE.Group(); mesh(box(2.2, 1.5, 1.4), COLORS[i], o); mesh(box(2.4, 0.18, 1.6), 0x222838, o, 0, 0.82, 0); o.position.set((i - 1) * 3, -1.5, 0); o.userData.i = i; G.sc.add(o); bins.push(o); }
      var item = new THREE.Group(); var sph = mesh(ball(0.8), COLORS[0], item); icon(item, G.icon, 1.1, 0, 0, 0.85); G.sc.add(item);
      var fly = null;
      var next = function () { col = Math.floor(Math.random() * 3); sph.material.color.setHex(COLORS[col]); item.position.set(0, 2.2, 0); };
      next(); G.info('0/6');
      return {
        tick: function (t, dt) {
          item.rotation.y = Math.sin(t * 2) * 0.4;
          if (fly) { fly.k = Math.min(1, fly.k + dt * 4); item.position.set(fly.x * fly.k, 2.2 - fly.k * 3.2, 0); if (fly.k === 1) { fly = null; if (!left) G.win(); else next(); } }
        },
        down: function () { if (fly || !left) return; var o = G.hit(bins); if (!o) return; if (o.userData.i === col) { fly = { k: 0, x: o.position.x }; G.info((6 - --left) + '/6'); } else G.info(G.en ? 'Wrong bin' : 'לא הארגז הזה'); }
      };
    },
    scrub: function (G) {
      var plate = mesh(cyl(3, 3, 0.5), 0xdfe6f2, G.sc, 0, 0.4, -0.4, { metalness: 0.4, roughness: 0.25 }); plate.rotation.x = Math.PI / 2;
      icon(G.sc, G.icon, 3, 0, 0.4, 0);
      var dirt = [], total = 26, down = false;
      for (var i = 0; i < total; i++) { var a = i * 2.4, r = Math.sqrt((i + 0.5) / total) * 2.6; var d = mesh(ball(rnd(0.4, 0.62)), i % 2 ? 0x6b4a2a : 0x4f3a20, G.sc, Math.cos(a) * r, 0.4 + Math.sin(a) * r, 0.35, { roughness: 1 }); d.scale.z = 0.35; d.userData.h = 0; dirt.push(d); }
      var wipe = function () { if (!down) return; var d = G.hit(dirt); if (!d) return; if (++d.userData.h > 1 || d.scale.x < 0.6) { G.sc.remove(d); dirt.splice(dirt.indexOf(d), 1); G.info(Math.round(100 * (1 - dirt.length / total)) + '%'); if (dirt.length <= 1) { dirt.forEach(function (q) { G.sc.remove(q); }); G.win(); } } else d.scale.multiplyScalar(0.7); };
      return { down: function () { down = true; wipe(); }, move: wipe, up: function () { down = false; } };
    },
    catch: function (G) {
      var basket = new THREE.Group(); mesh(new THREE.CylinderGeometry(1.1, 0.8, 0.9, 24, 1, true), 0xb5793a, basket, 0, 0, 0, { side: THREE.DoubleSide }); mesh(new THREE.TorusGeometry(1.1, 0.1, 10, 32), 0xe0a35c, basket, 0, 0.45, 0).rotation.x = Math.PI / 2; basket.position.set(0, -2, 0); G.sc.add(basket);
      var drops = [], got = 0, wait = 0, tx = 0;
      G.info('0/6');
      return {
        tick: function (t, dt) {
          basket.position.x += (tx - basket.position.x) * Math.min(1, dt * 18);
          if ((wait -= dt) <= 0) { wait = 0.75; var o = icon(G.sc, G.icon, 1.2, rnd(-3.8, 3.8), 4, 0); drops.push(o); }
          for (var i = drops.length - 1; i >= 0; i--) {
            var o2 = drops[i]; o2.position.y -= dt * 3.4;
            if (o2.position.y < -1.5 && o2.position.y > -2.3 && Math.abs(o2.position.x - basket.position.x) < 1.25) { G.sc.remove(o2); drops.splice(i, 1); G.info(++got + '/6'); if (got === 6) G.win(); }
            else if (o2.position.y < -3.5) { G.sc.remove(o2); drops.splice(i, 1); }
          }
        },
        down: function (p) { tx = p.x * 5; }, move: function (p) { tx = p.x * 5; }
      };
    },
    stack: function (G) {
      mesh(box(3.2, 0.5, 2), 0x4a557a, G.sc, 0, -2.4, 0);
      var floors = 0, top = 0, mover = null, dir = 1, fall = false;
      var spawn = function () { mover = new THREE.Group(); mesh(box(2.4, 0.9, 1.6), COLORS[floors], mover); icon(mover, G.icon, 0.8, 0, 0, 0.95); mover.position.set(-3.5, -1.7 + floors * 0.92 + 1.1, 0); G.sc.add(mover); fall = false; dir = 1; };
      spawn(); G.info('0/4');
      return {
        tick: function (t, dt) {
          if (!mover) return;
          if (!fall) { mover.position.x += dir * dt * (3.2 + floors * 0.5); if (Math.abs(mover.position.x) > 3.5) { dir = -dir; mover.position.x = Math.sign(mover.position.x) * 3.5; } return; }
          var ty = -1.7 + floors * 0.92; mover.position.y -= dt * 9;
          if (mover.position.y <= ty) {
            if (Math.abs(mover.position.x - top) <= 1.15) { mover.position.y = ty; top = mover.position.x; G.info(++floors + '/4'); if (floors === 4) { mover = null; G.win(); } else spawn(); }
            else { G.sc.remove(mover); G.info(floors + '/4 · ' + (G.en ? 'it fell' : 'נפל')); spawn(); }
          }
        },
        down: function () { if (mover) fall = true; }
      };
    },
    spin: function (G) {
      var d = new THREE.Group(); G.sc.add(d); d.position.y = 0.4;
      mesh(box(2.2, 2.2, 2.2), 0x1e88e5, d); var tip = mesh(new THREE.ConeGeometry(1.5, 1.4, 4), 0x1565c0, d, 0, -1.8, 0); tip.rotation.set(Math.PI, Math.PI / 4, 0); mesh(cyl(0.22, 0.22, 1.2), 0xffd646, d, 0, 1.6, 0);
      var letters = ['נ', 'ג', 'ה', 'פ'];
      letters.forEach(function (l, i) { var c = document.createElement('canvas'), g = c.getContext('2d'); c.width = c.height = 128; g.font = 'bold 96px Rubik, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(l, 64, 70); var p = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true })); var a = i * Math.PI / 2; p.position.set(Math.sin(a) * 1.12, 0, Math.cos(a) * 1.12); p.rotation.y = a; d.add(p); });
      var speed = 0, spins = 0, spinning = false;
      G.info('0/3');
      return {
        tick: function (t, dt) {
          if (!spinning) { d.rotation.y += dt * 0.5; return; }
          d.rotation.y += speed * dt; d.rotation.z = Math.sin(t * 9) * Math.max(0, 0.25 - speed * 0.012); speed -= dt * 11;
          if (speed <= 0) { spinning = false; d.rotation.z = 0; var side = Math.floor(Math.random() * 4); d.rotation.y = -side * Math.PI / 2; G.info(++spins + '/3 · ' + letters[side]); if (spins === 3) G.win(); }
        },
        down: function () { if (!spinning && spins < 3) { spinning = true; speed = rnd(14, 20); } }
      };
    }
  };

  function start(el, tk, mech, ic) {
    var en = window.MM_LANG === 'en';
    el.innerHTML = '<p class="sub" style="margin:8px 0">' + HINT[mech][en ? 1 : 0] + '</p><div id="m3Box" style="position:relative;max-width:440px;margin:0 auto"><div id="m3Info" style="position:absolute;top:8px;left:0;right:0;text-align:center;font-weight:800;color:#fff;text-shadow:0 0 6px #000;pointer-events:none"></div></div>';
    if (!R) { R = new THREE.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6)); R.setSize(440, 340, false); }
    var cv = R.domElement; cv.id = 'm3Cv'; cv.style.cssText = 'width:100%;aspect-ratio:440/340;display:block;border-radius:14px;touch-action:none;cursor:pointer;max-height:56vh;object-fit:contain';
    var boxEl = el.querySelector('#m3Box'); boxEl.insertBefore(cv, boxEl.firstChild);
    var sc = new THREE.Scene(); sc.background = new THREE.Color(0x101a33);
    sc.add(new THREE.HemisphereLight(0xdfe8ff, 0x242a40, 1.05)); var dl = new THREE.DirectionalLight(0xffffff, 0.8); dl.position.set(-3, 6, 8); sc.add(dl);
    var cam = new THREE.PerspectiveCamera(42, 440 / 340, 0.1, 100); cam.position.set(0, 2.2, 11.2); cam.lookAt(0, 0.4, 0);
    var floor = new THREE.GridHelper(30, 30, 0x2f4a8a, 0x223258); floor.position.y = -2.8; sc.add(floor);
    var ray = new THREE.Raycaster(), ptr = new THREE.Vector2(), t0 = performance.now(), won = false;
    var G = {
      sc: sc, icon: ic, en: en,
      info: function (s) { var i = el.querySelector('#m3Info'); if (i) i.textContent = s; },
      hit: function (list) {
        ray.setFromCamera(ptr, cam);
        var h = ray.intersectObjects(list, true); if (!h.length) return null;
        var o = h[0].object; while (o && list.indexOf(o) < 0) o = o.parent; return o;
      },
      win: function () { // השרת לא מקבל משימה שנגמרה בפחות משנייה וחצי
        if (won) return; won = true; G.info('✔');
        setTimeout(function () { if (alive(tk)) miniDone(); }, Math.max(350, 1800 - (performance.now() - t0)));
      }
    };
    var game = GAMES[mech](G);
    var point = function (e) { var r = cv.getBoundingClientRect(), w = r.width, h = r.height, ar = 440 / 340; if (w / h > ar) { var nw = h * ar; r = { left: r.left + (w - nw) / 2, top: r.top, width: nw, height: h }; } else { var nh = w / ar; r = { left: r.left, top: r.top + (h - nh) / 2, width: w, height: nh }; } ptr.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); return ptr; };
    cv.onpointerdown = function (e) { e.preventDefault(); e.stopPropagation(); if (won || !alive(tk)) return; try { cv.setPointerCapture(e.pointerId); } catch (er) {} sc.updateMatrixWorld(); var p = point(e); if (game.down) game.down(p); };
    cv.onpointermove = function (e) { if (won || !alive(tk)) return; var p = point(e); if (game.move) game.move(p); };
    cv.onpointerup = cv.onpointercancel = function () { if (!won && alive(tk) && game.up) game.up(); };
    var last = 0;
    var loop = function (now) {
      if (!alive(tk)) { sc.traverse(function (o) { if (o.geometry) o.geometry.dispose(); }); return; }
      var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
      if (game.tick) game.tick((now - t0) / 1000, dt);
      R.render(sc, cam); requestAnimationFrame(loop);
    };
    if (game.tick) game.tick(0, 0);
    R.render(sc, cam); requestAnimationFrame(loop);
    window.MM_MINI3D.last = { game: game, loop: loop, mech: mech };
  }

  var origBuild = buildRound;
  buildRound = function () {
    var T = miniSabIdx === null && miniOpen !== null && miniOpen >= 0 ? MAP.TASKS[miniOpen] : null;
    var d3 = T && window.MM_V3 && Z.ok ? (T.d3 || BY_KIND[miniCur.kind]) : null;
    if (!d3) return origBuild();
    var tk = ++miniToken;
    miniKeyHook = null; if (miniKind === 'code') miniKeyHook = function () {};
    document.getElementById('miniTitle').textContent = miniCur.title;
    show('#mini', true);
    try { start(document.getElementById('miniBody'), tk, d3[0], d3[1]); } catch (e) { console.error('mini3d', e); miniKeyHook = null; origBuild(); }
  };
  window.MM_MINI3D = { start: start, games: Object.keys(GAMES), byKind: BY_KIND };
})();

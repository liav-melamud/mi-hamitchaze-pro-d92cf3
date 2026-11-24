// מי המתחזה? פרו – נטען רק באתר הפרו. מפעיל את מצב פרו ומוסיף חבילה של 100 תפקידים מיוחדים.
// כל תפקיד נבנה מאחת מ-20 תבניות יכולת (כמו בעורך המודים), עם שם, אייקון וזמנים משלו.
window.MM_PRO = true;
(function () {
  // [תבנית, [שם, אייקון, המתנה (ש׳), שימושים, משך אפקט (ש׳)] × 5]
  var F = [
    ['sprinter', [['ברק', '⚡', 25, 0, 4], ['צ׳יטה', '🐆', 35, 0, 6], ['שליח', '📨', 30, 0, 5], ['אצן מרתון', '🏅', 40, 0, 8], ['רקטה', '🚀', 50, 0, 10]]],
    ['medic', [['רופא שדה', '🩺', 0, 1, 0], ['חובש', '⛑️', 0, 2, 0], ['שמאן', '🪄', 0, 1, 0], ['מציל', '🛟', 0, 1, 0], ['פרמדיק', '🚑', 0, 2, 0]]],
    ['scout', [['סייר', '🔭', 0, 0, 0], ['נץ', '🦅', 0, 0, 0], ['חוקר דרכים', '🧭', 0, 0, 0], ['שומר מגדל', '🗼', 0, 0, 0], ['עין חדה', '👁️', 0, 0, 0]]],
    ['lucky', [['בר מזל', '🍀', 0, 0, 0], ['חתול שחור', '🐈‍⬛', 0, 0, 0], ['שביעי בשבעה', '7️⃣', 0, 0, 0], ['קמע', '🧿', 0, 0, 0], ['פרסה', '🧲', 0, 0, 0]]],
    ['trapper', [['ציידת', '🪤', 8, 2, 0], ['דוב קוטב', '🐻‍❄️', 6, 3, 0], ['בונה מלכודות', '🔨', 10, 2, 0], ['עכביש', '🕷️', 5, 4, 0], ['נינג׳ה', '🥷', 12, 3, 0]]],
    ['radar', [['מכ״ם', '📡', 45, 3, 5], ['סונאר', '🛰️', 40, 3, 6], ['חייזר', '👽', 55, 2, 8], ['חוקר כוכבים', '🔮', 35, 4, 4], ['מצפה', '🔭', 60, 2, 10]]],
    ['taskmaster', [['אשף משימות', '⚡', 0, 0, 0], ['מכונאי', '🔧', 0, 0, 0], ['שען', '⏱️', 0, 0, 0], ['טכנאי', '🛠️', 0, 0, 0], ['קוסם הקצב', '🎩', 0, 0, 0]]],
    ['jailer', [['סוהר', '🔒', 45, 0, 0], ['שוער', '🚪', 35, 0, 0], ['מפתחן', '🗝️', 50, 0, 0], ['שומר סף', '🛡️', 40, 0, 0], ['אסיר לשעבר', '⛓️', 55, 0, 0]]],
    ['empath', [['חוש שישי', '😨', 25, 0, 0], ['מדיום', '🔮', 20, 0, 0], ['כלב גישוש', '🐕', 30, 0, 0], ['טלפת', '🧠', 35, 0, 0], ['עין שלישית', '👁️‍🗨️', 15, 0, 0]]],
    ['sniper', [['צלף', '🎯', 0, 0, 0], ['קשת', '🏹', 0, 0, 0], ['נצר', '🦂', 0, 0, 0], ['צייד', '🦌', 0, 0, 0], ['רובאי', '🔫', 0, 0, 0]]],
    ['poisoner', [['מרעיל', '☠️', 0, 0, 0], ['עקרב', '🦂', 0, 0, 0], ['צפע', '🐍', 0, 0, 0], ['אלכימאי', '⚗️', 0, 0, 0], ['פטרייה', '🍄', 0, 0, 0]]],
    ['blinker', [['משגר', '🌀', 40, 0, 0], ['שד קטן', '👹', 35, 0, 0], ['טלפורטר', '📡', 45, 0, 0], ['רוח רפאים', '👻', 30, 0, 0], ['קוסם', '🪄', 50, 0, 0]]],
    ['cleaner', [['מנקה', '🧹', 30, 0, 0], ['שוטף', '🧽', 25, 0, 0], ['שרוף', '🔥', 35, 0, 0], ['קברן', '⚰️', 40, 0, 0], ['שואב אבק', '🌪️', 20, 0, 0]]],
    ['zapper', [['חשמלאי', '⚡', 40, 0, 0], ['ברק קטלני', '🌩️', 35, 0, 0], ['טייזר', '🔌', 30, 0, 0], ['טסלה', '🧪', 45, 0, 0], ['צלופח', '🐟', 50, 0, 0]]],
    ['vampire', [['ערפד', '🧛', 0, 0, 0], ['עטלף', '🦇', 0, 0, 0], ['דרקולה', '🏰', 0, 0, 0], ['זאב לילה', '🐺', 0, 0, 0], ['יתוש', '🦟', 0, 0, 0]]],
    ['bomber', [['מפוצץ', '💣', 0, 1, 0], ['דינמיט', '🧨', 0, 1, 0], ['פיצוצן', '🎆', 0, 2, 0], ['חבלן', '💥', 0, 1, 0], ['קמיקזה', '☄️', 0, 1, 0]]],
    ['martyr', [['קורבן', '🕊️', 0, 0, 0], ['משיח שקר', '😇', 0, 0, 0], ['שהיד', '🌹', 0, 0, 0], ['גיבור הצל', '🦸', 0, 0, 0], ['שעיר לעזאזל', '🐐', 0, 0, 0]]],
    ['vulture', [['נשר', '🦅', 5, 0, 0], ['צבוע', '🐺', 5, 0, 0], ['עורב', '🐦‍⬛', 5, 0, 0], ['זאב ערבות', '🌵', 5, 0, 0], ['חרק גופות', '🪲', 5, 0, 0]]],
    ['survivor', [['ניצול', '🛟', 0, 0, 0], ['תיקן', '🪳', 0, 0, 0], ['שורד', '🏕️', 0, 0, 0], ['צב', '🐢', 0, 0, 0], ['חתול בעל תשע נשמות', '🐱', 0, 0, 0]]],
    ['instigator', [['מסית', '🗣️', 0, 0, 0], ['שדכן', '💬', 0, 0, 0], ['שרלטן', '🎭', 0, 0, 0], ['נחש מדבר', '🐍', 0, 0, 0], ['פוליטיקאי', '🎤', 0, 0, 0]]],
  ];
  var out = [];
  F.forEach(function (f) { f[1].forEach(function (v, i) {
    out.push({ id: 'p' + (out.length + 1), tpl: f[0], name: v[0].slice(0, 14), icon: v[1], cd: v[2], uses: v[3], dur: v[4], tier: i + 1 });
  }); });
  window.MM_PRO_ROLES = out;
  // קודי פרו, להצגה בחלון "קודים" (נכתבים בשדה "קוד מיוחד" בלובי, אפשר כמה יחד עם רווח)
  window.MM_PRO_CODES = [
    ['1000', '⚡ אולטרה', 'מהירות גבוהה לכולם (לפחות פי 1.4)'],
    ['2000', '🌑 ליל חשכה', 'טווח ראייה קצר מאוד לכולם'],
    ['3000', '🎭 כולם מיוחדים', 'כל אנשי הצוות מקבלים תפקיד מיוחד'],
    ['4000', '🧩 רק תפקידי פרו', 'בלי התפקידים הרגילים – רק תפקידי המודים והפרו'],
    ['9000', '⚔️ מלחמה', 'חיסולים כל 10 שניות ומשימות ארוכות'],
    ['5555', '🎪 מוד מרוץ-בלגן', 'שילוב שימושי: 3000 + 1000 – כולם מיוחדים ומהירים'],
  ];


  // ---------- מפת פרו: "מגדל הכתר" – 15 חדרים בשלוש קומות של רשת, אולם מרכזי גדול, עמודי זהב וניאון ----------
  (function () {
    var X = [100, 620, 1100, 1680, 2200], Wd = [360, 360, 440, 360, 360], Y = [80, 640, 1220], Hh = [280, 300, 280];
    var N = [['מגדל תצפית', 'מעבדת קוונטים', 'אולם הכתר', 'גן קריסטלים', 'רציף נחיתה'], ['מנוע ראשי', 'מרכז בקרה', 'לב התחנה', 'ספרייה', 'מרפאה'], ['מחסן', 'תחנת כוח', 'ארמון המראות', 'סדנה', 'מקלט']];
    var C = [['#3b3a63', '#2d5a6a', '#5a4a22', '#2f5f4f', '#4b3050'], ['#603a30', '#2c4570', '#51402a', '#4a3a5f', '#2f5a58'], ['#4f4a36', '#5b4a2a', '#34406a', '#4a4a4a', '#3a3e56']];
    var rooms = {}, ids = [[], [], []];
    for (var r = 0; r < 3; r++) for (var c = 0; c < 5; c++) { var id = 'P' + (r + 1) + (c + 1); ids[r][c] = id; rooms[id] = { name: N[r][c], x: X[c], y: Y[r], w: Wd[c], h: Hh[r], c: C[r][c] }; }
    var corr = [], cx = X.map(function (x, i) { return x + Wd[i] / 2; }), cy = Y.map(function (y, i) { return y + Hh[i] / 2; });
    for (r = 0; r < 3; r++) for (c = 0; c < 4; c++) corr.push([ids[r][c], ids[r][c + 1], 'h', cy[r]]);
    for (c = 0; c < 5; c++) for (r = 0; r < 2; r++) corr.push([ids[r][c], ids[r + 1][c], 'v', cx[c]]);
    var def = {
      id: 'mod_protower', theme: 'space', rooms: rooms, corr: corr, tasks: [], perRoom: 3,
      vents: [{ x: 410, y: 320, net: 0 }, { x: 2000, y: 900, net: 0 }, { x: 900, y: 1450, net: 0 }, { x: 2510, y: 320, net: 1 }, { x: 150, y: 900, net: 1 }, { x: 1480, y: 1450, net: 1 }, { x: 1500, y: 320, net: 2 }, { x: 940, y: 900, net: 2 }, { x: 2510, y: 1450, net: 2 }],
      button: { x: 1320, y: 710 }, world: { w: 2700, h: 1600 },
      cams: [{ name: 'אולם הכתר', x: 1320, y: 230, mx: 1320, my: 92 }, { name: 'מרכז בקרה', x: 800, y: 800, mx: 800, my: 652 }, { name: 'לב התחנה', x: 1320, y: 800, mx: 1320, my: 652 }, { name: 'ארמון המראות', x: 1320, y: 1370, mx: 1320, my: 1232 }],
      camConsole: { x: 800, y: 760 }
    };
    window.MM_PRO_MAPS = { mod_protower: { name: '👑 מגדל הכתר (פרו, 15 חדרים)', def: def } };
  })();

  // ---------- כפתור תלת מימד (בכל משחק) ----------
  window.MM_V3 = false; try { window.MM_V3 = localStorage.getItem('mm_v3') === '1'; } catch (e) {}
  var loading3d = false;
  function load3d() { // three.js נטען רק כשמפעילים תלת מימד (כ-600KB, ואז נשמר במטמון)
    if (loading3d || (window.MM_3D && window.MM_3D.ok) || window.MM_3D_FAIL) return; loading3d = true;
    function add(src, cb) { var sc = document.createElement('script'); sc.src = src; sc.onload = cb; sc.onerror = function () { window.MM_3D_FAIL = true; loading3d = false; }; document.head.appendChild(sc); }
    add('three.min.js', function () { add('threed.js', function () { loading3d = false; }); });
  }
  window.MM_load3d = load3d;
  if (window.MM_V3) setTimeout(load3d, 1500);
  // ---------- שרת האונליין: פינג כל 5 דקות כדי שיישאר ער (כל עוד האתר פתוח), וקישור מראש לשרת ----------
  function keepWarm() {
    var cfg = window.MM_SIGNAL; if (!cfg) return;
    try { fetch('https://' + cfg.host + '/ice?k=' + Date.now(), { mode: 'no-cors', cache: 'no-store' }).catch(function () {}); } catch (e) {}
  }
  keepWarm(); setInterval(keepWarm, 5 * 60 * 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) keepWarm(); });
  // ---------- מטמון לטעינה מהירה: אחרי הכניסה הראשונה האתר נפתח מהמכשיר, ומתעדכן ברקע ----------
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(function () {});

  // ---------- מראה ותחושת פרו: ערכת זהב, תג כתר במשחק, ופאנל קודים בצד הלובי ----------
  var CSS = [
    'h1 span{background:linear-gradient(100deg,#ffb547,#fff1b8,#ffb547);background-size:200% 100%;-webkit-background-clip:text;background-clip:text;color:transparent;animation:proShine 3.5s linear infinite}',
    'h1::after{content:" 👑 פרו";font-size:.45em;color:#ffd166;letter-spacing:1px;vertical-align:middle}',
    '@keyframes proShine{to{background-position:-200% 0}}',
    '#hostSettings{border:1px solid #ffb54788!important;box-shadow:0 0 22px #ffb54722}',
    '#proBadge{position:absolute;top:8px;left:10px;background:linear-gradient(#3a2a08,#1f1604);border:1px solid #ffb547;color:#ffd166;border-radius:999px;padding:2px 12px;font-size:12px;font-weight:800;letter-spacing:1px;box-shadow:0 0 12px #ffb54766;pointer-events:none}',
    '#proSide{position:fixed;left:10px;top:118px;width:268px;max-height:calc(100vh - 140px);overflow:auto;z-index:30;background:linear-gradient(#241a08,#14100a);border:1px solid #ffb547aa;border-radius:14px;padding:10px 12px;box-shadow:0 0 18px #ffb54733;text-align:right}',
    '#proSide.shut{display:none}',
    '#proFab{position:fixed;left:10px;top:74px;z-index:31;background:linear-gradient(#3a2a08,#1f1604);border:1px solid #ffb547;color:#ffd166;border-radius:999px;padding:7px 14px;font:inherit;font-weight:800;cursor:pointer;box-shadow:0 0 14px #ffb54755}',
    '#proFab.hidden{display:none}',
    '#d3Btn{position:absolute;top:8px;left:84px;background:#1c1710;border:1px solid #ffb547aa;color:#ffd166;border-radius:999px;padding:2px 12px;font:inherit;font-size:12px;font-weight:800;cursor:pointer;pointer-events:auto}#d3Btn.on{background:#3a2c0b;box-shadow:0 0 12px #ffb54777}',
    '#proSide h3{margin:0 0 2px;font-size:16px;color:#ffd166}#proSide .ps{font-size:12px;color:#c9b684;margin:0 0 8px}',
    '#proSide .pc{display:flex;align-items:center;gap:8px;width:100%;margin:4px 0;padding:7px 9px;border-radius:10px;background:#1c1710;border:1px solid #4a3a1c;color:#eadfc4;text-align:right;cursor:pointer;font:inherit}',
    '#proSide .pc b{direction:ltr;min-width:46px;text-align:center;background:#000;border-radius:7px;padding:3px 6px;color:#ffd166;font-size:15px}',
    '#proSide .pc small{display:block;color:#a8996f;font-size:11px;line-height:1.25}',
    '#proSide .pc.on{background:#3a2c0b;border-color:#ffb547;box-shadow:0 0 10px #ffb54755}',
    '#proSide .pc.on::after{content:"✓";margin-inline-start:auto;color:#4ade80;font-weight:900}',
    '#proSide .pc.lock{cursor:default;opacity:.8}#proSide .pc.lock::after{content:"פעיל תמיד";margin-inline-start:auto;color:#4ade80;font-size:11px}',
    '#proSide .pc:disabled{opacity:.55;cursor:default}',
    '#proSide .pclr{margin-top:6px;background:none;border:1px dashed #6a5526;color:#c9b684;border-radius:8px;padding:4px 10px;cursor:pointer;font:inherit;font-size:12px}'
  ].join('\n');
  var OPEN = [['54321', '🧩 מודים + ליצן', 'תפקידי מודים, ליצן וסטודיו'], ['8888', '🕎 חנוכה', 'נרות, סביבונים ומשימות חנוכה'], ['12345', '🙈 מחבואים', 'מקומות מחבוא במצב מחבואים']];
  function mount() {
    var st = document.createElement('style'); st.textContent = CSS; document.head.appendChild(st);
    var hud = document.getElementById('hud');
    if (hud && !document.getElementById('proBadge')) { var b = document.createElement('div'); b.id = 'proBadge'; b.textContent = '👑 PRO'; hud.appendChild(b); }
    var pm = document.querySelector('#proCodes p.sub'); if (pm) pm.textContent = 'בלובי, בהגדרות המשחק, יש פאנל "קודי פרו" – לוחצים על קוד כדי להפעיל אותו (אפשר כמה יחד). רק המארח צריך להפעיל.';
    if (hud && !document.getElementById('d3Btn')) {
      var d3 = document.createElement('button'); d3.id = 'd3Btn'; d3.type = 'button';
      var paint = function () { d3.textContent = window.MM_V3 ? '🧊 תלת מימד: פעיל' : '🧊 תלת מימד'; d3.classList.toggle('on', !!window.MM_V3); };
      d3.onclick = function () { window.MM_V3 = !window.MM_V3; try { localStorage.setItem('mm_v3', window.MM_V3 ? '1' : '0'); } catch (e) {} if (window.MM_V3) load3d(); paint(); d3.blur(); };
      paint(); hud.appendChild(d3);
      document.addEventListener('keydown', function (e) { if (e.key === '3' && !/INPUT|TEXTAREA|SELECT/.test((e.target || {}).tagName || '') && !hud.classList.contains('hidden')) d3.click(); });
    }
    var inp = document.getElementById('secretCode'), grid = document.getElementById('settingsGrid');
    if (!inp || !grid) return;
    var lab = inp.closest('label'); if (lab) lab.style.display = 'none'; // במקום השדה: פאנל הקודים
    var box = document.createElement('div'); box.id = 'proSide';
    box.innerHTML = '<h3>👑 קודי פרו</h3><p class="ps">לחץ כדי להפעיל או לכבות. אפשר לשלב כמה קודים יחד.</p><div id="proSideList"></div><button class="pclr" id="proSideClr" type="button">נקה קודים</button>';
    var lobby = document.getElementById('lobby'); lobby.appendChild(box);
    var fab = document.createElement('button'); fab.id = 'proFab'; fab.type = 'button'; fab.textContent = '👑 קודי פרו'; lobby.appendChild(fab);
    if (window.innerWidth < 900) box.classList.add('shut');
    fab.onclick = function () { box.classList.toggle('shut'); };
    var list = box.querySelector('#proSideList');
    list.innerHTML = OPEN.map(function (r) { return '<div class="pc lock"><b>' + r[0] + '</b><span><span>' + r[1] + '</span><small>' + r[2] + '</small></span></div>'; }).join('') +
      window.MM_PRO_CODES.map(function (r) { return '<button type="button" class="pc" data-c="' + r[0] + '"><b>' + r[0] + '</b><span><span>' + r[1] + '</span><small>' + r[2] + '</small></span></button>'; }).join('');
    function toks() { return inp.value.split(/[ ,]+/).filter(Boolean); }
    function put(a) { inp.value = a.join(' '); inp.dispatchEvent(new Event('change', { bubbles: true })); sync(); }
    function sync() {
      var t = toks(), on = {}; t.forEach(function (x) { on[x] = 1; });
      list.querySelectorAll('button.pc').forEach(function (e) { e.classList.toggle('on', !!on[e.dataset.c]); e.disabled = inp.disabled; });
      box.querySelector('#proSideClr').disabled = inp.disabled;
      var lb = document.getElementById('lobby'), shown = lb && !lb.classList.contains('hidden') && !inp.disabled; // רק למארח, רק בלובי
      fab.classList.toggle('hidden', !shown); if (!shown) box.style.display = 'none'; else box.style.display = '';
    }
    list.onclick = function (e) {
      var bt = e.target.closest('button.pc'); if (!bt || inp.disabled) return;
      var c = bt.dataset.c, t = toks(), i = t.indexOf(c); if (i >= 0) t.splice(i, 1); else t.push(c); put(t);
    };
    box.querySelector('#proSideClr').onclick = function () { if (!inp.disabled) put(toks().filter(function (x) { return OPEN.some(function (o) { return o[0] === x; }); })); };
    setInterval(sync, 500);
    sync();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

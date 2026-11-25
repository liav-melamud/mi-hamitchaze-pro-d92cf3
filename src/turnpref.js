
// ---------- הגדרה ⚙️: בתלת מימד, מקשי ימינה/שמאלה מסובבים את המבט (ברירת מחדל) או הולכים הצידה ----------
(function () {
  try { window.MM_TURN = localStorage.getItem('mm_turnkeys') !== '0'; } catch (e) { window.MM_TURN = true; }
  function mount() {
    var after = document.getElementById('notifMode'); if (!after || document.getElementById('turnMode')) return;
    var row = document.createElement('div'); row.className = 'setrow';
    var lab = document.createElement('label'), cb = document.createElement('input'); cb.type = 'checkbox'; cb.id = 'turnMode'; cb.checked = window.MM_TURN;
    lab.appendChild(cb); lab.appendChild(document.createTextNode(' ' + (window.MM_LANG === 'en' ? '🧊 3D: left/right keys turn the view (off = step sideways)' : '🧊 תלת מימד: ימינה/שמאלה מסובבים את המבט (כבוי = הולכים הצידה)')));
    row.appendChild(lab); after.closest('.setrow').insertAdjacentElement('afterend', row);
    cb.onchange = function () { window.MM_TURN = cb.checked; try { localStorage.setItem('mm_turnkeys', cb.checked ? '1' : '0'); } catch (e) {} if (typeof sendInput === 'function') sendInput(); };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();

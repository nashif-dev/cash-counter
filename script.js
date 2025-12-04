/* script.js
   Plain, well-commented JavaScript for the Currency Counter.
   - easy to read
   - explicit listeners (one per input + per button)
   - updates subtotals, grand total, and target difference
   - saves counts to localStorage
   - Reset clears values and storage
*/

/* ===== Configuration: mapping of input IDs to note values =====
   If you add/remove denominations in HTML, change this array accordingly.
*/
const DENOMS = [
  { id: 'note500', value: 500, totalId: 'note500Total' },
  { id: 'note200', value: 200, totalId: 'note200Total' },
  { id: 'note100', value: 100, totalId: 'note100Total' },
  { id: 'note50',  value: 50,  totalId: 'note50Total' },
  { id: 'note20',  value: 20,  totalId: 'note20Total' },
  { id: 'note10',  value: 10,  totalId: 'note10Total' },
  { id: 'note1',   value: 1,   totalId: 'note1Total' }
];

const LS_KEY = 'cash_counter_v3';        // key where counts are saved
const LS_TARGET = 'cash_counter_target_v3'; // key where target is saved

/* ===== Utility: format number in Indian style with ₹ sign ===== */
function formatINR(n) {
  // n might be NaN or not a number — coerce to 0
  const rounded = Math.round(Number(n) || 0);
  return '₹' + rounded.toLocaleString('en-IN');
}

/* ===== Persistence helpers ===== */
function loadCounts() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveCounts(obj) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(obj)); } catch {}
}

function loadTarget() {
  try { return Number(localStorage.getItem(LS_TARGET)) || 0; } catch { return 0; }
}
function saveTarget(n) {
  try { localStorage.setItem(LS_TARGET, String(n)); } catch {}
}

/* ===== Main behavior - runs after DOM is ready ===== */
document.addEventListener('DOMContentLoaded', () => {
  // Cached DOM references
  const targetInput = document.getElementById('target');
  const grandEl = document.getElementById('grand-total');
  const diffEl = document.getElementById('diff');
  const resetBtn = document.getElementById('resetBtn');

  // Load saved counts and target if any
  const savedCounts = loadCounts();
  const savedTarget = loadTarget();
  if (savedTarget) targetInput.value = savedTarget;

  // For each denomination: wire up input and buttons, and hydrate saved value
  DENOMS.forEach(d => {
    const input = document.getElementById(d.id);
    const totalEl = document.getElementById(d.totalId);
    const card = input ? input.closest('.denom-card') : null;
    const incBtn = card ? card.querySelector('.incBtn') : null;
    const decBtn = card ? card.querySelector('.decBtn') : null;

    // hydrate input from saved counts (if saved)
    if (input && savedCounts && typeof savedCounts[d.id] !== 'undefined') {
      // write saved number (as integer)
      input.value = Math.floor(Number(savedCounts[d.id]) || 0);
    }

    // function: compute subtotal for this input and update DOM
    function updateSubtotal() {
      if (!input || !totalEl) return 0;
      // don't overwrite the user's typing; treat empty string as 0
      let qty = input.value === '' ? 0 : Number(input.value);
      if (!Number.isFinite(qty) || qty < 0) qty = 0;
      qty = Math.floor(qty); // use integer quantities for calculations

      const subtotal = qty * d.value;
      totalEl.textContent = formatINR(subtotal);

      // small visual pulse to indicate update
      totalEl.classList.remove('pulse');
      void totalEl.offsetWidth; // force reflow
      totalEl.classList.add('pulse');

      return subtotal;
    }

    // input event handler — triggered as user types
    if (input) {
      input.addEventListener('input', () => {
        // while typing we update UI and totals but we do NOT force-rewrite the input
        updateAllTotals();
        // also toggle button symbols to active state
        if (card) {
          card.querySelectorAll('button').forEach(b => b.classList.add('active'));
        }
      });

      // blur event handler — when user leaves the input we coerce to integer and persist
      input.addEventListener('blur', () => {
        // coerce to integer and update the field value (nice UX after typing)
        input.value = Math.max(0, Math.floor(Number(input.value) || 0));
        updateAllTotals();
        saveCurrentCounts(); // persist counts after user finished editing
        // revert symbols to idle on blur
        if (card) {
          card.querySelectorAll('button').forEach(b => b.classList.remove('active'));
        }
      });

      // keyboard convenience
      input.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowUp') {
          input.value = (Number(input.value) || 0) + 1;
          updateAllTotals();
          e.preventDefault();
        } else if (e.key === 'ArrowDown') {
          input.value = Math.max(0, (Number(input.value) || 0) - 1);
          updateAllTotals();
          e.preventDefault();
        } else if (e.key === 'Enter') {
          // move to next qty input (simple tab-like behavior)
          const all = Array.from(document.querySelectorAll('.qtyInput'));
          const idx = all.indexOf(input);
          if (idx >= 0 && idx < all.length - 1) all[idx + 1].focus();
        }
      });
    }

    // inc / dec buttons: simple +1 / -1 behavior and focus back to input
    if (incBtn) {
      incBtn.addEventListener('click', () => {
        input.value = (Number(input.value) || 0) + 1;
        updateAllTotals();
        input.focus();
        saveCurrentCounts();
      });
    }
    if (decBtn) {
      decBtn.addEventListener('click', () => {
        input.value = Math.max(0, (Number(input.value) || 0) - 1);
        updateAllTotals();
        input.focus();
        saveCurrentCounts();
      });
    }
  }); // end each denom wiring

  /* ===== updateAllTotals
     Re-calculates every subtotal + grand total + difference.
     Called frequently (on input) and once initially.
  */
  function updateAllTotals() {
    let grand = 0;
    DENOMS.forEach(d => {
      const input = document.getElementById(d.id);
      const total = document.getElementById(d.totalId);
      if (!input || !total) return;
      // updateSubtotal inline (same logic) to keep code easy to follow
      let qty = input.value === '' ? 0 : Number(input.value);
      if (!Number.isFinite(qty) || qty < 0) qty = 0;
      qty = Math.floor(qty);
      const subtotal = qty * d.value;
      total.textContent = formatINR(subtotal);
      grand += subtotal;
    });

    // update grand total display
    grandEl.textContent = formatINR(grand);

    // update difference between target and total
    const tgt = Number(targetInput.value) || 0;
    const diff = tgt - grand;
    if (diff >= 0) {
      diffEl.textContent = `Difference: ${formatINR(diff)}`;
      diffEl.classList.remove('text-red-600');
    } else {
      diffEl.textContent = `Short by ${formatINR(Math.abs(diff))}`;
      diffEl.classList.add('text-red-600');
    }
  }

  // Save current counts object to localStorage
  function saveCurrentCounts() {
    const obj = {};
    DENOMS.forEach(d => {
      const el = document.getElementById(d.id);
      obj[d.id] = el && el.value !== '' ? Math.floor(Number(el.value) || 0) : 0;
    });
    saveCounts(obj);
  }

  // Target input: live update of diff, save on blur/change
  targetInput.addEventListener('input', () => {
    updateAllTotals(); // show live diff as user types
  });
  targetInput.addEventListener('blur', () => {
    // coerce and persist target
    targetInput.value = Math.max(0, Math.floor(Number(targetInput.value) || 0));
    saveTarget(Number(targetInput.value) || 0);
    updateAllTotals();
  });

  // Reset: clear all inputs, totals, and storage
  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset all counts and target?')) return;
    DENOMS.forEach(d => {
      const el = document.getElementById(d.id);
      const total = document.getElementById(d.totalId);
      if (el) el.value = '';
      if (total) total.textContent = formatINR(0);
      // remove active class from any button in the card
      const card = document.getElementById(d.id)?.closest('.denom-card');
      if (card) card.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    });
    targetInput.value = '';
    saveCounts({});
    saveTarget(0);
    updateAllTotals();
  });

  // Final: initial render (compute totals from saved data or blank)
  updateAllTotals();

  // Persist counts whenever the user leaves the page (safety)
  window.addEventListener('beforeunload', saveCurrentCounts);
});

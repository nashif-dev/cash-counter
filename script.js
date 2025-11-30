const DENOMS = [
  { id: 'note500', value: 500, totalId: 'note500Total' },
  { id: 'note200', value: 200, totalId: 'note200Total' },
  { id: 'note100', value: 100, totalId: 'note100Total' },
  { id: 'note50', value: 50, totalId: 'note50Total' },
  { id: 'note20', value: 20, totalId: 'note20Total' },
  { id: 'note10', value: 10, totalId: 'note10Total' },
  { id: 'note1', value: 1, totalId: 'note1Total' }
];

const LS_KEY = 'cash_counter_v2';
const LS_TARGET = 'cash_counter_target_v2';

function fmtINR(n) {
  return '₹' + (Math.round(n) || 0).toLocaleString('en-IN');
}

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch { }
}

function loadTarget() {
  try { return Number(localStorage.getItem(LS_TARGET)) || 0; } catch { return 0; }
}
function saveTarget(n) {
  try { localStorage.setItem(LS_TARGET, String(n)); } catch { }
}

document.addEventListener('DOMContentLoaded', () => {
  const state = loadState();
  const targetInput = document.getElementById('target');
  const applyTargetBtn = document.getElementById('applyTarget');
  const grandEl = document.getElementById('grand-total');
  const diffEl = document.getElementById('diff');
  const resetBtn = document.getElementById('resetBtn');

  DENOMS.forEach(d => {
    const el = document.getElementById(d.id);
    if (!el) return;
    const saved = state[d.id];
    if (typeof saved !== 'undefined') el.value = Number(saved) || 0;
  });

  const savedTarget = loadTarget();
  if (targetInput) targetInput.value = savedTarget || '';

  function updateSubtotal(d) {
    const input = document.getElementById(d.id);
    const out = document.getElementById(d.totalId);
    if (!input || !out) return 0;
    let qty = parseInt(input.value || "");
    if (isNaN(qty) || qty < 0) qty = 0;
    const subtotal = qty * d.value;
    out.textContent = fmtINR(subtotal);
    out.classList.remove('pulse');
    void out.offsetWidth;
    out.classList.add('pulse');

    return subtotal;
  }

  function updateAll() {
    let grand = 0;
    const newState = {};
    DENOMS.forEach(d => {
      const sub = updateSubtotal(d);
      grand += sub;
      const input = document.getElementById(d.id);
      newState[d.id] = Number(input.value) || 0;
    });
    grandEl.textContent = fmtINR(grand);

    const tgt = Number(targetInput.value) || 0;
    const diff = tgt - grand;
    const diffFormatted = fmtINR(diff);
    if (diff >= 0) {
      diffEl.textContent = `Difference: ${diffFormatted}`;
      diffEl.classList.remove('text-red-600');
      diffEl.classList.add('text-slate-600');
    } else {
      diffEl.textContent = `excess ${fmtINR(Math.abs(diff))}`;
      diffEl.classList.remove('text-slate-600');
      diffEl.classList.add('text-red-600');
    }

    saveState(newState);
  }

  DENOMS.forEach(d => {
    const input = document.getElementById(d.id);
    if (!input) return;

    input.addEventListener('input', () => {
      // input.value = Math.max(0, Math.floor(Number(input.value) || 0));
      updateAll();
    });

    input.addEventListener('change', () => {
      input.value = Math.max(0, Math.floor(Number(input.value) || 0));
      updateAll();
    });

    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const all = Array.from(document.querySelectorAll('.qtyInput, input[type=number]'));
        const idx = all.indexOf(input);
        if (idx >= 0 && idx < all.length - 1) all[idx + 1].focus();
      }
    });

    const card = input.closest('.denom-card');
    if (card) {
      const inc = card.querySelector('.incBtn');
      const dec = card.querySelector('.decBtn');
      if (inc) inc.addEventListener('click', () => { input.value = (Number(input.value) || 0) + 1; updateAll(); });
      if (dec) dec.addEventListener('click', () => { input.value = Math.max(0, (Number(input.value) || 0) - 1); updateAll(); });
    }
  });

  applyTargetBtn?.addEventListener('click', () => {
    const t = Math.max(0, Math.floor(Number(targetInput.value) || 0));
    targetInput.value = t;
    saveTarget(t);
    updateAll();
  });

  targetInput?.addEventListener('input', () => {
    updateAll();
  });

  resetBtn?.addEventListener('click', () => {
    if (!confirm('Reset all counts and target?')) return;
    DENOMS.forEach(d => {
      const input = document.getElementById(d.id);
      if (input) input.value = 0;
      const out = document.getElementById(d.totalId);
      if (out) out.textContent = fmtINR(0);
    });
    targetInput.value = '';
    saveState({});
    saveTarget(0);
    updateAll();
  });

  updateAll();
});

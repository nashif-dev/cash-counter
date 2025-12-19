/* ===============================
   CONFIGURATION
================================ */
const DENOMS = [
  { id: 'note500', value: 500 },
  { id: 'note200', value: 200 },
  { id: 'note100', value: 100 },
  { id: 'note50', value: 50 },
  { id: 'note20', value: 20 },
  { id: 'note10', value: 10 },
  { id: 'note1', value: 1 }
];

/* ===============================
   HELPERS
================================ */
function formatINR(n) {
  return '₹' + (Number(n) || 0).toLocaleString('en-IN');
}

/* ===============================
   MAIN LOGIC
================================ */
document.addEventListener('DOMContentLoaded', () => {

  const targetInput = document.getElementById('target');
  const grandEl = document.getElementById('grand-total');
  const diffEl = document.getElementById('diff');
  const saveBtn = document.getElementById('saveBtn');
  const resetBtn = document.getElementById('resetBtn');
  const timestampText = document.getElementById('timestamp-text');
  const captureArea = document.getElementById('capture-area');

  // update all totals
  function updateTotals() {
    let grand = 0;

    DENOMS.forEach(d => {
      const input = document.getElementById(d.id);
      const totalEl = document.getElementById(d.id + 'Total');
      const qty = Math.max(0, Number(input.value) || 0);
      const sub = qty * d.value;
      totalEl.textContent = formatINR(sub);
      grand += sub;
    });

    grandEl.textContent = formatINR(grand);

    const target = Number(targetInput.value) || 0;
    const diff = target - grand;
    diffEl.textContent = diff >= 0
      ? `Difference: ${formatINR(diff)
  } `
      : `excess ${formatINR(Math.abs(diff)) } `;
  }

  // button + input wiring
  document.querySelectorAll('.denom-card').forEach(card => {
    const input = card.querySelector('.qtyInput');
    const inc = card.querySelector('.incBtn');
    const dec = card.querySelector('.decBtn');

    input.addEventListener('focus', () =>
      card.querySelectorAll('button').forEach(b => b.classList.add('active'))
    );

    input.addEventListener('blur', () =>
      card.querySelectorAll('button').forEach(b => b.classList.remove('active'))
    );

    input.addEventListener('input', updateTotals);
    inc.onclick = () => { input.value++; updateTotals(); input.focus(); };
    dec.onclick = () => { input.value = Math.max(0, input.value-1); updateTotals(); input.focus(); };
  });

  targetInput.addEventListener('input', updateTotals);

  // SAVE AS IMAGE + TIMESTAMP
  saveBtn.onclick = () => {
    timestampText.textContent = new Date().toLocaleString('en-IN');
    html2canvas(captureArea, { scale: 2 }).then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL();
      a.download = 'currency-counter.png';
      a.click();
    });
  };

  // RESET
  resetBtn.onclick = () => {
    if (!confirm('Reset everything?')) return;
    document.querySelectorAll('.qtyInput').forEach(i => i.value = '');
    targetInput.value = '';
    updateTotals();
  };

  updateTotals();
});

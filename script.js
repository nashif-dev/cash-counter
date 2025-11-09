const denominations = [
  { inputId: 'note500', value: 500, totalId: 'note500Total' },
  { inputId: 'note200', value: 200, totalId: 'note200Total' },
  { inputId: 'note100', value: 100, totalId: 'note100Total' },
  { inputId: 'note50',  value: 50,  totalId: 'note50Total' },
  { inputId: 'note20',  value: 20,  totalId: 'note20Total' },
  { inputId: 'note10',  value: 10,  totalId: 'note10Total' },
  { inputId: 'note1',   value: 1,   totalId: 'note1Total' }
];

const grandEl = document.getElementById('grand-total');

function fmt(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function calcSubtotal(entry) {
  const input = document.getElementById(entry.inputId);
  const totalEl = document.getElementById(entry.totalId);
  const qty = Number(input.value) || 0;
  const subtotal = qty * entry.value;
  totalEl.textContent = fmt(subtotal);
  return subtotal;
}

function updateAll() {
  let grand = 0;
  for (const d of denominations) {
    grand += calcSubtotal(d);
  }
  grandEl.textContent = `Total: ${fmt(grand)}`;
}

for (const d of denominations) {
  const input = document.getElementById(d.inputId);

  input.addEventListener('input', updateAll);

  input.addEventListener('change', () => {
    input.value = Math.max(0, Math.floor(Number(input.value) || 0));
    updateAll();
  });
}

updateAll();

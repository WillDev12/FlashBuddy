// ══════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════
function uid() { return Math.random().toString(36).slice(2,9) + Date.now().toString(36); }

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function escHtml(s) {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function checkSimilar(a, b) {
  // Allow 1-char tolerance for answers > 5 chars
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 2) return false;
  let diff = 0;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) { if ((a[i] || '') !== (b[i] || '')) diff++; }
  return diff <= 1 && a.length > 4;
}

function normalizeAnswer(s) { return String(s).trim().toLowerCase(); }

function toast(msg, duration = 2500) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), duration);
}

function getCards() {
  if (!activeDeckId || !decks[activeDeckId]) return [];
  return decks[activeDeckId].cards.filter(c => c.term || c.def);
}

function getValidCards() {
  return getCards().filter(c => c.term && c.def);
}

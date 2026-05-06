// ══════════════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════════════
function storeSave() {
  try { localStorage.setItem('flashbuddy_v1', JSON.stringify(decks)); } catch(e) {}
}

function storeLoad() {
  try {
    const d = localStorage.getItem('flashbuddy_v1');
    if (d) decks = JSON.parse(d);
  } catch(e) { decks = {}; }
}

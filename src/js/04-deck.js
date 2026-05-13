// ══════════════════════════════════════════════
//  DECK SELECT & MODE
// ══════════════════════════════════════════════
function refreshSelect() {
  const sel = document.getElementById('deckSelect');
  const cur = sel.value;
  sel.innerHTML = '<option value="">— select a deck —</option>';
  for (const id in decks) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = decks[id].name;
    if (id === activeDeckId) opt.selected = true;
    sel.appendChild(opt);
  }
}

function onDeckChange() {
  activeDeckId = document.getElementById('deckSelect').value || null;
  resetAllModes();
  render();
}

function switchMode(mode) {
  activeMode = mode;
  document.querySelectorAll('.mode-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.mode === mode);
  });
  resetMode(mode);
  render();
}

function resetAllModes() {
  ['flashcards','learn','test','match'].forEach(resetMode);
}

function resetMode(mode) {
  const cards = getValidCards();
  if (mode === 'flashcards') {
    fc.order = shuffle(cards.map((_,i) => i));
    fc.idx = 0; fc.flipped = false;
  } else if (mode === 'learn') {
    learnInit(cards);
  } else if (mode === 'test') {
    buildTest(cards);
  } else if (mode === 'match') {
    if (mt.timerInterval) { clearInterval(mt.timerInterval); mt.timerInterval = null; }
    mt.cards = []; mt.started = false; mt.pairs = 0; mt.total = 0;
  }
}

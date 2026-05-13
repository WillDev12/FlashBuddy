// ══════════════════════════════════════════════
//  RENDER DISPATCH
// ══════════════════════════════════════════════
function render() {
  const main = document.getElementById('main');
  const cards = getValidCards();

  if (activeMode !== 'test') {
    const tw = document.getElementById('testTimerWidget');
    if (tw) { tw.style.display = 'none'; }
    if (tform.timerInterval) { clearInterval(tform.timerInterval); tform.timerInterval = null; }
  }

  if (!activeDeckId) {
    main.innerHTML = `
      <div class="empty">
        <div class="empty-glyph">✦</div>
        <h2>No deck selected</h2>
        <p>Pick a deck from the dropdown or create a new one to get started.</p>
        <br>
        <button class="btn btn-primary" onclick="openManage()">Manage Decks</button>
      </div>`;
    return;
  }

  if (cards.length === 0) {
    main.innerHTML = `
      <div class="empty">
        <div class="empty-glyph">∅</div>
        <h2>${escHtml(decks[activeDeckId]?.name || '')}</h2>
        <p>This deck has no complete cards yet.</p>
        <br>
        <button class="btn btn-primary" onclick="openEditor('${activeDeckId}')">Edit Deck</button>
      </div>`;
    return;
  }

  if (activeMode === 'flashcards') renderFlashcards(cards);
  else if (activeMode === 'learn') renderLearn(cards);
  else if (activeMode === 'test') renderTest(cards);
  else if (activeMode === 'match') renderMatch(cards);
}

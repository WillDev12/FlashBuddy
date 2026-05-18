// ══════════════════════════════════════════════
//  FOCUS TRAP
// ══════════════════════════════════════════════
function makeTrapHandler(container) {
  return function(e) {
    if (e.key !== 'Tab') return;
    const focusable = Array.from(container.querySelectorAll(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'
    )).filter(el => !el.closest('.hidden'));
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };
}

// ══════════════════════════════════════════════
//  MANAGE MODAL
// ══════════════════════════════════════════════
let _manageFocusOrigin = null;
let _manageTrapHandler = null;

function openManage() {
  refreshDeckList();
  const modal = document.getElementById('manageModal');
  _manageFocusOrigin = document.activeElement;
  modal.classList.remove('hidden');
  const first = modal.querySelector('button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])');
  if (first) setTimeout(() => first.focus(), 50);
  _manageTrapHandler = makeTrapHandler(modal);
  modal.addEventListener('keydown', _manageTrapHandler);
}

function closeManage() {
  const modal = document.getElementById('manageModal');
  modal.classList.add('hidden');
  if (_manageTrapHandler) { modal.removeEventListener('keydown', _manageTrapHandler); _manageTrapHandler = null; }
  if (_manageFocusOrigin) { _manageFocusOrigin.focus(); _manageFocusOrigin = null; }
}

function refreshDeckList() {
  const list = document.getElementById('deckList');
  const ids = Object.keys(decks);
  if (!ids.length) {
    list.innerHTML = '<p style="color:var(--ink3);font-size:14px">No decks yet.</p>';
    return;
  }
  list.innerHTML = ids.map(id => `
    <div class="deck-item">
      <div class="deck-item-info">
        <div class="deck-item-name">${escHtml(decks[id].name)}</div>
        <div class="deck-item-count">${decks[id].cards.filter(c=>c.term||c.def).length} cards</div>
      </div>
      <div class="deck-item-actions">
        <button class="btn btn-ghost btn-sm" onclick="openEditor('${id}')">Edit</button>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════
//  EDITOR MODAL
// ══════════════════════════════════════════════
let _editorFocusOrigin = null;
let _editorTrapHandler = null;

function openEditor(id) {
  editingId = id;
  const titleEl = document.getElementById('editorTitle');
  const nameEl = document.getElementById('deckNameInput');
  const deleteBtn = document.getElementById('deleteDeckBtn');

  if (id && decks[id]) {
    titleEl.textContent = 'Edit Deck';
    nameEl.value = decks[id].name;
    deleteBtn.classList.remove('hidden');
    populateRows(decks[id].cards);
  } else {
    titleEl.textContent = 'New Deck';
    nameEl.value = '';
    deleteBtn.classList.add('hidden');
    populateRows([{term:'',def:''},{term:'',def:''}]);
  }

  document.getElementById('exportString').value = '';
  document.getElementById('exportStatus').textContent = '';
  document.getElementById('exportStatus').className = 'import-status';
  updateExtStatus(extInstalled);
  const editorModal = document.getElementById('editorModal');
  _editorFocusOrigin = document.activeElement;
  editorModal.classList.remove('hidden');
  setTimeout(() => nameEl.focus(), 80);
  _editorTrapHandler = makeTrapHandler(editorModal);
  editorModal.addEventListener('keydown', _editorTrapHandler);
}

function closeEditor() {
  const editorModal = document.getElementById('editorModal');
  editorModal.classList.add('hidden');
  if (_editorTrapHandler) { editorModal.removeEventListener('keydown', _editorTrapHandler); _editorTrapHandler = null; }
  if (_editorFocusOrigin) { _editorFocusOrigin.focus(); _editorFocusOrigin = null; }
  editingId = null;
}

function populateRows(cards) {
  const rows = cards.map((c, i) => makeRowHtml(c.term || '', c.def || '', i)).join('');
  document.getElementById('cardRows').innerHTML = rows;
}

function makeRowHtml(term, def, i) {
  return `<div class="card-row" id="row_${i}">
    <input class="card-row-input" type="text" placeholder="Term" aria-label="Card ${i + 1} term" value="${escHtml(term)}" />
    <input class="card-row-input" type="text" placeholder="Definition" aria-label="Card ${i + 1} definition" value="${escHtml(def)}" />
    <button class="row-del" onclick="removeRow('row_${i}')" aria-label="Delete card ${i + 1}">×</button>
  </div>`;
}

function addRow() {
  const container = document.getElementById('cardRows');
  const idx = container.querySelectorAll('.card-row').length;
  const el = document.createElement('div');
  el.id = 'row_' + idx;
  el.className = 'card-row';
  el.innerHTML = `
    <input class="card-row-input" type="text" placeholder="Term" aria-label="Card ${idx + 1} term" />
    <input class="card-row-input" type="text" placeholder="Definition" aria-label="Card ${idx + 1} definition" />
    <button class="row-del" onclick="removeRow('row_${idx}')" aria-label="Delete card ${idx + 1}">×</button>`;
  container.appendChild(el);
  el.querySelector('input').focus();
  container.scrollTop = container.scrollHeight;
}

function removeRow(id) {
  const row = document.getElementById(id);
  if (row) row.remove();
}

function readEditorCards() {
  const cards = [];
  document.querySelectorAll('#cardRows .card-row').forEach(row => {
    const inputs = row.querySelectorAll('input');
    const term = inputs[0]?.value.trim() || '';
    const def = inputs[1]?.value.trim() || '';
    if (term || def) cards.push({ term, def });
  });
  return cards;
}

function saveDeck() {
  const name = document.getElementById('deckNameInput').value.trim();
  if (!name) { toast('Give your deck a name first'); return; }

  const cards = readEditorCards();
  const id = editingId || uid();
  decks[id] = { name, cards };
  storeSave();
  refreshSelect();
  refreshDeckList();

  if (!activeDeckId) {
    activeDeckId = id;
    document.getElementById('deckSelect').value = id;
    resetAllModes();
  }

  closeEditor();
  toast('Deck saved ✓');
  render();
}

function deleteDeck() {
  if (!editingId) return;
  const name = decks[editingId]?.name || 'this deck';
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  delete decks[editingId];
  if (activeDeckId === editingId) { activeDeckId = null; }
  storeSave();
  refreshSelect();
  refreshDeckList();
  closeEditor();
  render();
  toast('Deck deleted.');
}

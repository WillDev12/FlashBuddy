// ══════════════════════════════════════════════
//  MANAGE MODAL
// ══════════════════════════════════════════════
function openManage() {
  refreshDeckList();
  document.getElementById('manageModal').classList.remove('hidden');
}

function closeManage() {
  document.getElementById('manageModal').classList.add('hidden');
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

  document.getElementById('quizletUrl').value = '';
  document.getElementById('importStatus').textContent = '';
  document.getElementById('importStatus').className = 'import-status';
  document.getElementById('exportString').value = '';
  document.getElementById('exportStatus').textContent = '';
  document.getElementById('exportStatus').className = 'import-status';
  document.getElementById('editorModal').classList.remove('hidden');
  setTimeout(() => nameEl.focus(), 80);
}

function closeEditor() {
  document.getElementById('editorModal').classList.add('hidden');
  editingId = null;
}

function populateRows(cards) {
  const rows = cards.map((c, i) => makeRowHtml(c.term || '', c.def || '', i)).join('');
  document.getElementById('cardRows').innerHTML = rows;
}

function makeRowHtml(term, def, i) {
  return `<div class="card-row" id="row_${i}">
    <input class="card-row-input" type="text" placeholder="Term" value="${escHtml(term)}" />
    <input class="card-row-input" type="text" placeholder="Definition" value="${escHtml(def)}" />
    <button class="row-del" onclick="removeRow('row_${i}')">×</button>
  </div>`;
}

function addRow() {
  const container = document.getElementById('cardRows');
  const idx = container.querySelectorAll('.card-row').length;
  const el = document.createElement('div');
  el.id = 'row_' + idx;
  el.className = 'card-row';
  el.innerHTML = `
    <input class="card-row-input" type="text" placeholder="Term" />
    <input class="card-row-input" type="text" placeholder="Definition" />
    <button class="row-del" onclick="removeRow('row_${idx}')">×</button>`;
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

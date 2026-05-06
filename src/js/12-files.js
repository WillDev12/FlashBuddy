// ══════════════════════════════════════════════
//  FILE EXPORT / IMPORT
// ══════════════════════════════════════════════
function exportAll() {
  const data = JSON.stringify(decks, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'flashbuddy.json'; a.click();
  URL.revokeObjectURL(url);
}

function importFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      let count = 0;
      for (const id in data) {
        if (data[id]?.name && Array.isArray(data[id]?.cards)) {
          decks[id] = data[id]; count++;
        }
      }
      storeSave(); refreshSelect(); refreshDeckList();
      toast(`Imported ${count} deck${count !== 1 ? 's' : ''} ✓`);
    } catch(err) { toast('Could not read file.'); }
  };
  reader.readAsText(file);
  e.target.value = '';
}

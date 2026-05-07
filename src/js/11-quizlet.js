// ══════════════════════════════════════════════
//  QUIZLET IMPORT
// ══════════════════════════════════════════════
function doQuizletHtmlImport(input) {
  const file = input.files[0];
  const statusEl = document.getElementById('htmlImportStatus');
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const cards = parseQuizlet(ev.target.result);
    if (!cards || cards.length === 0) {
      statusEl.className = 'import-status err';
      statusEl.textContent = 'No cards found in this file. Make sure you saved the full Quizlet page.';
    } else {
      populateRows(cards);
      statusEl.className = 'import-status ok';
      statusEl.textContent = `Imported ${cards.length} card${cards.length !== 1 ? 's' : ''} ✓`;
      if (!document.getElementById('deckNameInput').value.trim()) {
        const m = file.name.replace(/\.html?$/i, '').replace(/[-_]/g, ' ');
        document.getElementById('deckNameInput').value = m;
      }
    }
  };
  reader.readAsText(file);
  input.value = '';
}

function doQuizletImport() {
  const url = document.getElementById('quizletUrl').value.trim();
  const status = document.getElementById('importStatus');
  const logEl = document.getElementById('scrapeLog');

  if (!SCRAPER_URL) {
    status.className = 'import-status err';
    status.textContent = 'URL import requires the scraper server — download the Scraper Included release.';
    return;
  }

  if (!url.includes('quizlet.com')) {
    status.className = 'import-status err';
    status.textContent = 'Enter a valid Quizlet URL.';
    return;
  }

  status.className = 'import-status hidden';
  status.textContent = '';
  logEl.innerHTML = '';
  logEl.classList.remove('hidden');

  let activeLineEl = null;

  function appendLog(msg, state = 'spin') {
    if (activeLineEl) {
      const icon = activeLineEl.querySelector('.log-icon');
      if (icon) { icon.textContent = '✓'; icon.className = 'log-icon ok'; }
    }
    const line = document.createElement('div');
    line.className = 'log-line';
    const iconChar = state === 'spin' ? '◌' : state === 'ok' ? '✓' : '✗';
    const iconCls  = state === 'spin' ? 'spin' : state === 'ok' ? 'ok' : 'err';
    line.innerHTML = `<span class="log-icon ${iconCls}">${iconChar}</span><span class="log-text">${escHtml(msg)}</span>`;
    logEl.appendChild(line);
    logEl.scrollTop = logEl.scrollHeight;
    activeLineEl = state === 'spin' ? line : null;
    return line;
  }

  function finalizeLog(msg, state) {
    if (activeLineEl) {
      const icon = activeLineEl.querySelector('.log-icon');
      if (icon) { icon.textContent = state === 'ok' ? '✓' : '✗'; icon.className = 'log-icon ' + state; }
      const txt = activeLineEl.querySelector('.log-text');
      if (txt && msg) txt.textContent = msg;
      activeLineEl = null;
    } else {
      appendLog(msg, state);
    }
  }

  appendLog('Connecting to scraper server…');

  const es = new EventSource(`${SCRAPER_URL}/scrape?url=${encodeURIComponent(url)}`);

  es.onerror = () => {
    es.close();
    finalizeLog('Could not reach scraper. Run: cd scraper && npm start', 'err');
  };

  es.onmessage = (e) => {
    const data = JSON.parse(e.data);

    if (data.type === 'log') {
      appendLog(data.msg);

    } else if (data.type === 'done') {
      es.close();
      finalizeLog(`Done — ${data.cards.length} cards collected`, 'ok');

      if (data.name && !document.getElementById('deckNameInput').value.trim()) {
        document.getElementById('deckNameInput').value = data.name;
      }
      document.getElementById('cardRows').innerHTML =
        data.cards.map((c, i) => makeRowHtml(c.term, c.def, i)).join('');

    } else if (data.type === 'error') {
      es.close();
      finalizeLog(`Error: ${data.msg}`, 'err');
    }
  };
}

function doExportImport() {
  const text = document.getElementById('exportString').value;
  const statusEl = document.getElementById('exportStatus');

  if (!text.trim()) {
    statusEl.textContent = 'Paste export text first.';
    statusEl.className = 'import-status err';
    return;
  }

  const termDelMap = { tab: '\t', comma: ',', semicolon: ';', pipe: '|' };
  const cardDelMap = { newline: '\n', semicolon: ';', comma: ',' };

  const termDel = termDelMap[document.getElementById('exportTermDel').value];
  const cardDel = cardDelMap[document.getElementById('exportCardDel').value];

  const cards = text.split(cardDel).reduce((acc, line) => {
    const trimmed = line.trim();
    if (!trimmed) return acc;
    const idx = trimmed.indexOf(termDel);
    if (idx === -1) return acc;
    const term = trimmed.slice(0, idx).trim();
    const def  = trimmed.slice(idx + termDel.length).trim();
    if (term || def) acc.push({ term, def });
    return acc;
  }, []);

  if (!cards.length) {
    statusEl.textContent = 'No cards found — check delimiters.';
    statusEl.className = 'import-status err';
    return;
  }

  populateRows(cards);
  statusEl.textContent = `Imported ${cards.length} card${cards.length !== 1 ? 's' : ''} ✓`;
  statusEl.className = 'import-status ok';
}

function parseQuizlet(html) {
  // 1. Try __NEXT_DATA__ (Next.js — most common on modern Quizlet)
  const nextMatch = html.match(/<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (nextMatch) {
    try {
      const data = JSON.parse(nextMatch[1]);
      const found = deepFindTerms(data);
      if (found && found.length) return found;
    } catch(e) {}
  }

  // 2. Try any script block with JSON
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)];
  for (const s of scripts) {
    const text = s[1].trim();
    if (text.length < 50) continue;
    // Look for JSON starting with {
    const jsonStart = text.indexOf('{');
    if (jsonStart === -1) continue;
    try {
      const data = JSON.parse(text.slice(jsonStart));
      const found = deepFindTerms(data);
      if (found && found.length > 2) return found;
    } catch(e) {}
  }

  // 3. Regex: "word":"...","definition":"..."
  const pattern1 = [...html.matchAll(/"word"\s*:\s*"((?:[^"\\]|\\.)*)"\s*(?:,\s*"\w+"\s*:\s*(?:"[^"]*"|-?\d+|true|false|null)\s*)*,?\s*"definition"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (pattern1.length) return pattern1.map(m => ({ term: unescJson(m[1]), def: unescJson(m[2]) }));

  // 4. Regex: "term":"...","definition":"..."
  const pattern2 = [...html.matchAll(/"term"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,[\s\S]*?"definition"\s*:\s*"((?:[^"\\]|\\.)*)"/g)];
  if (pattern2.length) return pattern2.map(m => ({ term: unescJson(m[1]), def: unescJson(m[2]) }));

  return [];
}

function deepFindTerms(obj, depth = 0) {
  if (depth > 20 || !obj) return null;

  // Try base64 decode for encoded state
  if (typeof obj === 'string' && obj.length > 100 && /^[A-Za-z0-9+/=]+$/.test(obj)) {
    try {
      const decoded = atob(obj);
      if (decoded.startsWith('{') || decoded.startsWith('[')) {
        const parsed = JSON.parse(decoded);
        const found = deepFindTerms(parsed, depth + 1);
        if (found && found.length) return found;
      }
    } catch(e) {}
  }

  if (Array.isArray(obj) && obj.length > 0) {
    const first = obj[0];
    if (first && typeof first === 'object') {
      const hasWord = 'word' in first || 'term' in first || 'front' in first;
      const hasDef = 'definition' in first || 'def' in first || 'back' in first;
      if (hasWord && hasDef) {
        return obj.filter(Boolean).map(item => ({
          term: String(item.word ?? item.term ?? item.front ?? ''),
          def: String(item.definition ?? item.def ?? item.back ?? '')
        })).filter(c => c.term || c.def);
      }
    }
    for (const item of obj) {
      const r = deepFindTerms(item, depth + 1);
      if (r && r.length > 0) return r;
    }
  } else if (obj && typeof obj === 'object') {
    // Prioritized keys
    for (const key of ['terms','studiableItems','flashcards','cards','termIdToTermsMap','set','props','pageProps','dehydratedReduxStateKey','dehydratedState']) {
      if (obj[key]) {
        const r = deepFindTerms(obj[key], depth + 1);
        if (r && r.length > 0) return r;
      }
    }
    for (const key of Object.keys(obj)) {
      const r = deepFindTerms(obj[key], depth + 1);
      if (r && r.length > 0) return r;
    }
  }
  return null;
}

function unescJson(s) {
  return s.replace(/\\n/g,'\n').replace(/\\t/g,'\t').replace(/\\"/g,'"').replace(/\\\\/g,'\\').replace(/\\r/g,'');
}

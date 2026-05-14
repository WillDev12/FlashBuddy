// ══════════════════════════════════════════════
//  QUIZLET IMPORT
// ══════════════════════════════════════════════

const PDFJS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

function loadPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = PDFJS_CDN;
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      resolve(window.pdfjsLib);
    };
    s.onerror = () => reject(new Error('Failed to load PDF.js'));
    document.head.appendChild(s);
  });
}

async function doQuizletPdfImport(input) {
  const file = input.files[0];
  const statusEl = document.getElementById('pdfImportStatus');
  if (!file) return;
  statusEl.className = 'import-status';
  statusEl.textContent = 'Reading PDF…';

  try {
    const pdfjs = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

    const allItems = [];
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent({ normalizeWhitespace: true });
      for (const item of content.items) {
        if (!item.str) continue;
        allItems.push({ str: item.str, x: item.transform[4], y: item.transform[5], w: item.width || 0, page: p });
      }
    }

    const cards = parsePdfItems(allItems);

    if (!cards.length) {
      statusEl.className = 'import-status err';
      statusEl.textContent = 'No cards found. Make sure the PDF is a printed Quizlet page.';
    } else {
      populateRows(cards);
      statusEl.className = 'import-status ok';
      statusEl.textContent = `Imported ${cards.length} card${cards.length !== 1 ? 's' : ''} ✓`;
      const nameInput = document.getElementById('deckNameInput');
      if (!nameInput.value.trim()) {
        const title = extractPdfTitle(allItems);
        if (title) nameInput.value = title;
      }
    }
  } catch (err) {
    statusEl.className = 'import-status err';
    statusEl.textContent = 'Error: ' + err.message;
  }
  input.value = '';
}

function extractPdfTitle(items) {
  const hit = items.find(i => i.str && i.str.includes('Flashcards | Quizlet'));
  return hit ? hit.str.replace(/\s*Flashcards\s*\|\s*Quizlet.*$/i, '').trim() : null;
}

function parsePdfItems(items) {
  if (!items.length) return [];

  // Group items into rows by page + Y coordinate (±4pt tolerance)
  // Page must match to prevent cross-page Y collisions
  const rows = [];
  for (const item of items) {
    if (!item.str.trim()) {
      const existing = rows.find(r => r.page === item.page && Math.abs(r.y - item.y) <= 4);
      if (existing) existing.parts.push(item);
      continue;
    }
    const existing = rows.find(r => r.page === item.page && Math.abs(r.y - item.y) <= 4);
    if (existing) {
      existing.parts.push(item);
    } else {
      rows.push({ y: item.y, page: item.page, parts: [item] });
    }
  }
  // Sort by page, then top-to-bottom within page
  rows.sort((a, b) => a.page !== b.page ? a.page - b.page : b.y - a.y);

  // For each multi-item row, find the biggest intra-row gap → that splits term from def.
  // Record where the right side (definition) starts; the modal value = definition column X.
  // Find the biggest intra-row gap using only non-space items (spaces are trailing
  // layout glyphs that sit between columns and corrupt the gap measurement).
  function rowGap(parts) {
    const sig = parts.filter(p => p.str.trim()).sort((a, b) => a.x - b.x);
    let bigGap = 0, splitAfter = -1;
    for (let i = 1; i < sig.length; i++) {
      // Use end-to-start gap so adjacent glyphs of the same word (e.g. accented
      // chars stored as separate fragments) don't produce a false large gap.
      const gap = sig[i].x - (sig[i - 1].x + sig[i - 1].w);
      if (gap > bigGap) { bigGap = gap; splitAfter = i; }
    }
    // threshold = midpoint between end of last left item and start of first right item
    const threshold = splitAfter > 0
      ? ((sig[splitAfter - 1].x + sig[splitAfter - 1].w) + sig[splitAfter].x) / 2
      : null;
    return { bigGap, sigRight: splitAfter > 0 ? sig[splitAfter] : null, threshold };
  }

  const defStarts = [];
  for (const row of rows) {
    if (row.parts.filter(p => p.str.trim()).length < 2) continue;
    const { bigGap, sigRight } = rowGap(row.parts);
    if (sigRight && bigGap > 30) {
      defStarts.push(Math.round(sigRight.x / 5) * 5);
    }
  }

  // Find modal definition column start (bin by 5px)
  const freq = {};
  for (const x of defStarts) freq[x] = (freq[x] || 0) + 1;
  const modalDefX = defStarts.length
    ? parseInt(Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0])
    : null;

  if (!modalDefX) return [];

  const skip = /terms in this set|students also studied|practice questions|quizlet\.com|study with|flashcard|don't know|leave the first/i;
  const cards = [];

  for (const row of rows) {
    const { bigGap, sigRight, threshold } = rowGap(row.parts);
    if (!sigRight || bigGap <= 30) continue;

    // Definition column must start near modalDefX (±20px)
    if (Math.abs(sigRight.x - modalDefX) > 20) continue;

    // Partition all parts (including spaces) at the midpoint threshold
    const left  = row.parts.filter(p => p.x <= threshold).sort((a, b) => a.x - b.x).map(p => p.str).join('');
    const right = row.parts.filter(p => p.x >  threshold).sort((a, b) => a.x - b.x).map(p => p.str).join('');
    if (!left.trim() || !right.trim()) continue;
    if (skip.test(left) || skip.test(right)) continue;

    cards.push({ term: left.trim(), def: right.trim() });
  }
  return cards;
}

function doQuizletImport() {
  const url = document.getElementById('quizletUrl').value.trim();
  const status = document.getElementById('importStatus');
  const logEl = document.getElementById('scrapeLog');

  if (!SCRAPER_URL) {
    status.className = 'import-status err';
    status.innerHTML = 'URL import requires the URL Import release. <a href="https://flashbuddy.vercel.app/docs/setup-scraper-server" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Setup guide →</a>';
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
    finalizeLog('Could not reach scraper server — is it running?', 'err');
    status.className = 'import-status err';
    status.innerHTML = 'Scraper not running. <a href="https://flashbuddy.vercel.app/docs/setup-scraper-server" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">Setup guide →</a>';
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


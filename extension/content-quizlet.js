// Runs on quizlet.com set pages

(function () {
  'use strict';

  if (!/quizlet\.com\/\d+\//.test(location.href)) return;

  // ── Scraping ──────────────────────────────────────────────────────────────

  const FAKE_TERMS = new Set(['term', 'definition', 'word', 'answer', 'front', 'back']);

  function isRealCard(term, def) {
    const t = term.toLowerCase().trim();
    const d = def.toLowerCase().trim();
    return t.length > 0 && d.length > 0 && !FAKE_TERMS.has(t) && !FAKE_TERMS.has(d);
  }

  function scrapeFromDOM() {
    const rows = document.querySelectorAll('[aria-label="Term"]');
    if (rows.length) {
      const cards = [];
      for (const row of rows) {
        const sides = row.querySelectorAll('[data-testid="set-page-term-card-side"] .TermText');
        if (sides.length >= 2) {
          const term = sides[0].textContent.trim();
          const def  = sides[1].textContent.trim();
          if (term || def) cards.push({ term, def });
        }
      }
      if (cards.length) return cards;
    }
    const all = document.querySelectorAll('[data-testid="set-page-term-card-side"] .TermText');
    if (all.length >= 2) {
      const cards = [];
      for (let i = 0; i + 1 < all.length; i += 2) {
        const term = all[i].textContent.trim();
        const def  = all[i + 1].textContent.trim();
        if (term || def) cards.push({ term, def });
      }
      if (cards.length) return cards;
    }
    return [];
  }

  function scrapeFromNextData() {
    const el = document.getElementById('__NEXT_DATA__');
    if (!el) return [];
    try {
      const data = JSON.parse(el.textContent);
      const found = [], seen = new Set();
      function walk(obj) {
        if (!obj || typeof obj !== 'object') return;
        if (Array.isArray(obj)) { obj.forEach(walk); return; }
        const word = obj.word || obj.term || '';
        const def  = obj.definition || '';
        if (word && def && typeof word === 'string' && typeof def === 'string' && isRealCard(word, def)) {
          const key = `${word}\x00${def}`;
          if (!seen.has(key)) { seen.add(key); found.push({ term: word.trim(), def: def.trim() }); }
          return;
        }
        Object.values(obj).forEach(v => { if (v && typeof v === 'object') walk(v); });
      }
      walk(data);
      return found;
    } catch (_) { return []; }
  }

  // Wait for Quizlet to render the initial batch of cards
  function waitForInitialCards() {
    return new Promise(resolve => {
      const immediate = scrapeFromDOM();
      if (immediate.length) { resolve(immediate); return; }
      let debounce = null, done = false;
      function finish(cards) {
        if (done) return;
        done = true; observer.disconnect(); clearTimeout(debounce); resolve(cards);
      }
      function check() {
        const cards = scrapeFromDOM();
        if (cards.length) { finish(cards); return; }
        debounce = setTimeout(() => finish(scrapeFromNextData()), 600);
      }
      const observer = new MutationObserver(() => { clearTimeout(debounce); debounce = setTimeout(check, 200); });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => finish(scrapeFromDOM().length ? scrapeFromDOM() : scrapeFromNextData()), 12000);
    });
  }

  // Click every visible "See N more" button and wait for the DOM to settle.
  // Loops until none remain (handles multi-round pagination).
  async function expandAll() {
    while (true) {
      const btns = [...document.querySelectorAll('button[aria-label]')]
        .filter(b => /^See \d+ more$/i.test(b.getAttribute('aria-label')));
      if (!btns.length) break;
      const savedY = window.scrollY;
      btns.forEach(b => b.click());
      // Restore scroll before the browser settles (two rAF = past layout/scroll pass)
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      window.scrollTo({ top: savedY, behavior: 'instant' });
      // Wait for newly rendered cards to appear
      await new Promise(resolve => {
        let quiet = null;
        const obs = new MutationObserver(() => {
          clearTimeout(quiet);
          quiet = setTimeout(() => { obs.disconnect(); resolve(); }, 400);
        });
        obs.observe(document.body, { childList: true, subtree: true });
        // Safety timeout in case nothing mutates
        setTimeout(() => { obs.disconnect(); resolve(); }, 3000);
      });
    }
  }

  async function waitForCards() {
    const initial = await waitForInitialCards();
    if (!initial.length) return [];
    await expandAll();
    const all = scrapeFromDOM();
    return all.length ? all : initial;
  }

  function getDeckName() {
    const h1 = document.querySelector('h1');
    if (h1) return h1.textContent.trim();
    return document.title.replace(/\s*[|\-].*$/, '').trim();
  }

  // ── Theme detection ───────────────────────────────────────────────────────

  function isDarkMode() {
    const html = document.documentElement;
    if (html.dataset.colorScheme === 'dark') return true;
    if (html.classList.contains('dark') || document.body.classList.contains('dark')) return true;
    const bg = getComputedStyle(document.body).backgroundColor;
    const rgb = bg.match(/\d+/g)?.map(Number);
    if (rgb) return (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255 < 0.5;
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }

  // ── UI ────────────────────────────────────────────────────────────────────

  const TERM_DELS = { tab: '\t', comma: ',', semicolon: ';', pipe: '|' };
  const CARD_DELS = { newline: '\n', semicolon: ';', comma: ',' };

  function injectUI(initialCards, initialName) {
    let cards    = initialCards;
    let deckName = initialName;

    const root = document.createElement('div');
    root.id = 'fb-ext-root';
    const shadow = root.attachShadow({ mode: 'open' });

    shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; }

        /* ── Light theme (default) ── */
        #wrap {
          --bg:       #FFFFFF;
          --surface:  #F6F7FB;
          --border:   #EDEFF4;
          --text:     #282E3E;
          --text2:    #586380;
          --blue:     #4255FF;
          --blue-hov: #3444E6;
          --green:    #23B26D;
          --red:      #FF4B4B;
          --shadow:   0 4px 24px rgba(40,46,62,0.14);
          --btn-bg:   #4255FF;
        }
        /* ── Dark theme ── */
        #wrap[data-dark="true"] {
          --bg:       #282E3E;
          --surface:  #1E2436;
          --border:   #3B4072;
          --text:     #FFFFFF;
          --text2:    #939BB4;
          --shadow:   0 4px 24px rgba(0,0,0,0.4);
        }

        @keyframes fbFadeIn {
          from { opacity: 0; transform: scale(0.8) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        #btn {
          position: fixed; bottom: 24px; right: 24px;
          width: 52px; height: 52px; border-radius: 50%;
          background: var(--blue); color: #fff;
          border: none; cursor: pointer; z-index: 2147483646;
          box-shadow: 0 4px 16px rgba(66,85,255,0.4);
          display: flex; align-items: center; justify-content: center;
          font-weight: 800; font-size: 14px;
          animation: fbFadeIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        #btn:hover { transform: scale(1.08); box-shadow: 0 6px 22px rgba(66,85,255,0.55); }

        #dlg {
          position: fixed; bottom: 88px; right: 24px;
          width: 320px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px; padding: 16px;
          z-index: 2147483645;
          box-shadow: var(--shadow);
          color: var(--text);
        }
        #dlg.hidden { display: none; }

        .fb-title { font-size: 11px; font-weight: 700; color: var(--blue); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
        .deck-name { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .count { font-size: 12px; color: var(--text2); margin-bottom: 12px; }

        .export-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
        .export-label { font-size: 11px; font-weight: 700; color: var(--text2); letter-spacing: 0.05em; text-transform: uppercase; }
        #copy-btn {
          font-size: 11px; font-weight: 600; color: var(--blue);
          background: none; border: 1px solid var(--border); border-radius: 5px;
          padding: 2px 8px; cursor: pointer; transition: background 0.12s;
        }
        #copy-btn:hover { background: var(--surface); }

        .del-row { display: flex; gap: 6px; align-items: center; margin-bottom: 7px; flex-wrap: wrap; }
        .del-label { font-size: 11px; color: var(--text2); white-space: nowrap; }
        .del-select {
          font-size: 11px; padding: 2px 5px;
          background: var(--surface); color: var(--text);
          border: 1px solid var(--border); border-radius: 5px;
          cursor: pointer; outline: none;
        }
        .del-select:focus { border-color: var(--blue); }

        textarea {
          width: 100%; height: 90px; resize: vertical;
          background: var(--surface); color: var(--text);
          border: 1px solid var(--border); border-radius: 8px;
          padding: 8px 10px; font-size: 11px; font-family: "Courier New", monospace;
          line-height: 1.65; outline: none; margin-bottom: 10px; display: block;
        }
        textarea:focus { border-color: var(--blue); }
        textarea::-webkit-resizer { background: var(--border); }

        #import-btn {
          width: 100%; padding: 10px 0;
          background: var(--blue); color: #fff;
          border: none; border-radius: 8px;
          font-size: 13px; font-weight: 700; cursor: pointer;
          transition: background 0.15s; letter-spacing: 0.01em;
        }
        #import-btn:hover:not(:disabled) { background: var(--blue-hov); }
        #import-btn:disabled { opacity: 0.4; cursor: default; }

        #status { font-size: 12px; font-weight: 600; margin-top: 8px; min-height: 16px; }
        #status.ok  { color: var(--green); }
        #status.err { color: var(--red); }
      </style>

      <div id="wrap">
        <div id="dlg" class="hidden">
          <div class="fb-title">FlashBuddy Extras</div>
          <div class="deck-name" id="dname"></div>
          <div class="count" id="count"></div>

          <div class="export-header">
            <span class="export-label">Universal Export String</span>
            <button id="copy-btn">Copy</button>
          </div>
          <div class="del-row">
            <span class="del-label">Term / Def</span>
            <select class="del-select" id="term-del">
              <option value="tab">Tab</option>
              <option value="comma">Comma (,)</option>
              <option value="semicolon">Semicolon (;)</option>
              <option value="pipe">Pipe (|)</option>
            </select>
            <span class="del-label">Between cards</span>
            <select class="del-select" id="card-del">
              <option value="newline">New line</option>
              <option value="semicolon">Semicolon (;)</option>
              <option value="comma">Comma (,)</option>
            </select>
          </div>
          <textarea id="export-text" readonly spellcheck="false"></textarea>
          <button id="import-btn">Import to FlashBuddy</button>
          <div id="status"></div>
        </div>
        <button id="btn" title="FlashBuddy Extras">FB</button>
      </div>
    `;

    const wrap      = shadow.getElementById('wrap');
    const btn       = shadow.getElementById('btn');
    const dlg       = shadow.getElementById('dlg');
    const dnameEl   = shadow.getElementById('dname');
    const countEl   = shadow.getElementById('count');
    const exportTxt = shadow.getElementById('export-text');
    const copyBtn   = shadow.getElementById('copy-btn');
    const termDel   = shadow.getElementById('term-del');
    const cardDel   = shadow.getElementById('card-del');
    const importBtn = shadow.getElementById('import-btn');
    const status    = shadow.getElementById('status');

    // Theme
    function applyTheme() { wrap.dataset.dark = isDarkMode(); }
    applyTheme();
    new MutationObserver(applyTheme).observe(document.documentElement, {
      attributes: true, attributeFilter: ['class', 'data-color-scheme', 'data-theme']
    });
    new MutationObserver(applyTheme).observe(document.body, {
      attributes: true, attributeFilter: ['class']
    });

    // Export string
    function buildExport() {
      const td = TERM_DELS[termDel.value] ?? '\t';
      const cd = CARD_DELS[cardDel.value] ?? '\n';
      return cards.map(c => `${c.term}${td}${c.def}`).join(cd);
    }
    function refreshExport() { exportTxt.value = buildExport(); }

    termDel.addEventListener('change', refreshExport);
    cardDel.addEventListener('change', refreshExport);

    // Copy
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(exportTxt.value);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
      } catch (_) {
        exportTxt.select();
        document.execCommand('copy');
      }
    });

    // Toggle dialog
    btn.addEventListener('click', () => dlg.classList.toggle('hidden'));

    // Import
    importBtn.addEventListener('click', async () => {
      importBtn.disabled = true;
      importBtn.textContent = 'Sending…';
      status.textContent = ''; status.className = '';
      try {
        const res = await chrome.runtime.sendMessage({ type: 'SEND_TO_FLASHBUDDY', name: deckName, cards });
        if (res?.success) {
          status.textContent = 'Imported! Switch to FlashBuddy.';
          status.className = 'ok';
          importBtn.textContent = 'Imported ✓';
        } else {
          status.textContent = res?.error || 'FlashBuddy not found — is it open?';
          status.className = 'err';
          importBtn.disabled = false;
          importBtn.textContent = 'Import to FlashBuddy';
        }
      } catch (_) {
        status.textContent = 'Extension error. Try reloading.';
        status.className = 'err';
        importBtn.disabled = false;
        importBtn.textContent = 'Import to FlashBuddy';
      }
    });

    // Expose updater for SPA deck switches — keeps dialog open, swaps content
    root._update = (newCards, newName) => {
      cards    = newCards;
      deckName = newName;
      dnameEl.textContent = newName;
      countEl.textContent = `${newCards.length} card${newCards.length !== 1 ? 's' : ''}`;
      refreshExport();
      importBtn.disabled = false;
      importBtn.textContent = 'Import to FlashBuddy';
      status.textContent = ''; status.className = '';
    };

    // Initial render
    dnameEl.textContent = deckName;
    countEl.textContent = `${cards.length} card${cards.length !== 1 ? 's' : ''}`;
    refreshExport();

    document.body.appendChild(root);
  }

  // ── Main ──────────────────────────────────────────────────────────────────

  async function init() {
    const cards = await waitForCards();
    if (!cards.length) return;
    const name = getDeckName();
    const existing = document.getElementById('fb-ext-root');
    if (existing?._update) {
      existing._update(cards, name);
    } else {
      injectUI(cards, name);
    }
  }

  init();

  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href === lastUrl) return;
    lastUrl = location.href;
    if (/quizlet\.com\/\d+\//.test(location.href)) setTimeout(init, 800);
  }).observe(document.body, { childList: true, subtree: true });
})();

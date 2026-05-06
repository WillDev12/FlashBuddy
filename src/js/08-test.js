// ══════════════════════════════════════════════
//  TEST FORM
// ══════════════════════════════════════════════
const ALPHA = 'ABCDEFGHIJKLMNOP';

function buildTest(cards) {
  if (!cards || !cards.length) {
    tform.mc = []; tform.matchTerms = []; tform.matchDefs = []; tform.written = []; return;
  }

  const s = tform.settings;
  const flip = s.flip;
  const qN = Math.min(Math.max(1, s.qCount), cards.length);
  const pool = shuffle([...cards]);

  if (s.mc) {
    tform.mc = pool.slice(0, qN).map(card => {
      const prompt = flip ? card.def : card.term;
      const correct = flip ? card.term : card.def;
      const wrong = shuffle(cards.filter(c => c !== card)).slice(0, 3).map(c => flip ? c.term : c.def);
      return { card, prompt, opts: shuffle([correct, ...wrong]), correctAns: correct, answer: null };
    });
  } else { tform.mc = []; }

  if (s.match && cards.length >= 4) {
    const matchPool = shuffle([...cards]).slice(0, Math.min(qN, cards.length));
    const shuffledDefs = shuffle([...matchPool]);
    tform.matchDefs = shuffledDefs.map((card, i) => ({
      letter: ALPHA[i], text: flip ? card.term : card.def, card
    }));
    tform.matchTerms = matchPool.map(card => ({
      card,
      termText: flip ? card.def : card.term,
      correctLetter: tform.matchDefs.find(d => d.card === card).letter,
      answer: null,
    }));
  } else { tform.matchTerms = []; tform.matchDefs = []; }

  if (s.written) {
    const inMC = new Set(tform.mc.map(q => q.card));
    const writtenPool = [...shuffle(cards.filter(c => !inMC.has(c))), ...shuffle(cards.filter(c => inMC.has(c)))];
    tform.written = writtenPool.slice(0, qN).map(card => ({
      card,
      prompt: flip ? card.def : card.term,
      correctAns: flip ? card.term : card.def,
      answer: ''
    }));
  } else { tform.written = []; }

  tform.graded = false;
  tform.scores = { mc: 0, match: 0, written: 0 };
}

function testSettingsHtml(cards) {
  const s = tform.settings;
  const maxQ = cards.length;
  const curQ = Math.min(s.qCount, maxQ);
  const open = tform.settingsOpen;
  return `
    <div class="test-settings-bar">
      <button class="test-settings-btn${open ? ' open' : ''}" onclick="testToggleSettings()">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        Settings
        <span class="test-settings-chevron">${open ? '▴' : '▾'}</span>
      </button>
      <div class="test-settings-panel" id="testSettingsPanel" style="display:${open ? 'block' : 'none'}">
        <div class="test-settings-grid">
          <label class="test-setting-item">
            <div class="test-toggle-wrap">
              <input type="checkbox" ${s.mc ? 'checked' : ''} onchange="tform.settings.mc=this.checked">
              <span class="test-toggle-track"></span>
            </div>
            <span class="test-setting-label">Multiple choice</span>
          </label>
          <label class="test-setting-item">
            <div class="test-toggle-wrap">
              <input type="checkbox" ${s.match ? 'checked' : ''} onchange="tform.settings.match=this.checked">
              <span class="test-toggle-track"></span>
            </div>
            <span class="test-setting-label">Matching</span>
          </label>
          <label class="test-setting-item">
            <div class="test-toggle-wrap">
              <input type="checkbox" ${s.written ? 'checked' : ''} onchange="tform.settings.written=this.checked">
              <span class="test-toggle-track"></span>
            </div>
            <span class="test-setting-label">Written responses</span>
          </label>
          <label class="test-setting-item">
            <div class="test-toggle-wrap">
              <input type="checkbox" ${s.flip ? 'checked' : ''} onchange="tform.settings.flip=this.checked">
              <span class="test-toggle-track"></span>
            </div>
            <span class="test-setting-label">Flip terms &amp; definitions</span>
          </label>
        </div>
        <div class="test-settings-footer">
          <div class="test-setting-item test-setting-num-item">
            <span class="test-setting-label">Questions per section</span>
            <input type="number" class="test-setting-num-input" value="${curQ}" min="1" max="${maxQ}"
              oninput="tform.settings.qCount=Math.min(${maxQ},Math.max(1,+this.value||1))">
            <span class="test-setting-num-max">of ${maxQ}</span>
          </div>
          <button class="btn btn-primary" onclick="testApplySettings()">New Test</button>
        </div>
      </div>
    </div>`;
}

function testToggleSettings() {
  tform.settingsOpen = !tform.settingsOpen;
  const panel = document.getElementById('testSettingsPanel');
  if (panel) panel.style.display = tform.settingsOpen ? 'block' : 'none';
  const btn = document.querySelector('.test-settings-btn');
  if (btn) {
    btn.classList.toggle('open', tform.settingsOpen);
    const chev = btn.querySelector('.test-settings-chevron');
    if (chev) chev.textContent = tform.settingsOpen ? '▴' : '▾';
  }
}

function testApplySettings() {
  tform.settingsOpen = false;
  buildTest(getValidCards());
  render();
}

function renderTest(cards) {
  if (!tform.mc.length && !tform.matchTerms.length && !tform.written.length) buildTest(cards);

  const settingsBar = testSettingsHtml(cards);

  if (!tform.mc.length && !tform.matchTerms.length && !tform.written.length) {
    document.getElementById('main').innerHTML = `
      <div class="test-form">
        ${settingsBar}
        <div class="test-notice">Enable at least one question type in settings to build a test.</div>
      </div>`;
    return;
  }

  // ── Score banner ──
  let banner = '';
  if (tform.graded) {
    const total   = tform.mc.length + tform.matchTerms.length + tform.written.length;
    const correct = tform.scores.mc + tform.scores.match + tform.scores.written;
    const pct = total ? Math.round((correct / total) * 100) : 0;
    banner = `
      <div class="test-score-banner">
        <div>
          <div class="test-score-pct">${pct}%</div>
          <div class="test-score-sub">${correct} / ${total} correct</div>
        </div>
        <div class="test-score-breakdown">
          ${tform.mc.length         ? `<div>MC &nbsp;&nbsp;&nbsp;&nbsp;${tform.scores.mc}/${tform.mc.length}</div>` : ''}
          ${tform.matchTerms.length ? `<div>Match &nbsp;${tform.scores.match}/${tform.matchTerms.length}</div>` : ''}
          ${tform.written.length    ? `<div>Written ${tform.scores.written}/${tform.written.length}</div>` : ''}
        </div>
      </div>`;
  }

  // ── Part 1: Multiple Choice ──
  let partNum = 0;
  let mcHtml = '';
  if (tform.mc.length) {
    partNum++;
    const qs = tform.mc.map((q, qi) => {
      const opts = q.opts.map((opt, oi) => {
        const sel = (!tform.graded && q.answer === oi) ? ' selected' : '';
        return `<button class="mc-opt${sel}" onclick="mcPick(${qi},${oi})" ${tform.graded ? 'disabled' : ''}>${escHtml(opt)}</button>`;
      }).join('');
      return `<div class="mc-question" id="mc_${qi}">
        <div class="mc-qnum">Q${qi + 1}</div>
        <div class="mc-qterm">${escHtml(q.prompt)}</div>
        <div class="mc-opts">${opts}</div>
      </div>`;
    }).join('');
    mcHtml = `
      <div class="test-section">
        <div class="test-section-header">
          <span class="test-section-title">Part ${partNum} — Multiple Choice</span>
          <span class="test-section-meta">${tform.graded ? tform.scores.mc + ' / ' + tform.mc.length : tform.mc.length + ' questions'}</span>
        </div>
        ${qs}
      </div>`;
  }

  // ── Part 2: Matching ──
  let matchHtml = '';
  if (tform.matchTerms.length) {
    partNum++;
    const flip = tform.settings.flip;
    const letters = tform.matchDefs.map(d => d.letter);
    const termsCol = tform.matchTerms.map((t, i) => {
      const opts = letters.map(l => `<option value="${l}" ${t.answer === l ? 'selected' : ''}>${l}</option>`).join('');
      return `<div class="match-term-row">
        <span class="match-num">${i + 1}.</span>
        <span class="match-term-text">${escHtml(t.termText)}</span>
        <select class="match-select" id="ms_${i}" onchange="matchPick(${i},this.value)" ${tform.graded ? 'disabled' : ''}>
          <option value="">—</option>${opts}
        </select>
      </div>`;
    }).join('');
    const defsCol = tform.matchDefs.map(d => `
      <div class="match-def-row">
        <span class="match-letter">${d.letter}.</span>
        <span class="match-def-text">${escHtml(d.text)}</span>
      </div>`).join('');
    matchHtml = `
      <div class="test-section">
        <div class="test-section-header">
          <span class="test-section-title">Part ${partNum} — Matching</span>
          <span class="test-section-meta">${tform.graded ? tform.scores.match + ' / ' + tform.matchTerms.length : tform.matchTerms.length + ' pairs'}</span>
        </div>
        <div class="match-form-layout">
          <div class="match-terms-col">
            <div class="match-col-label">${flip ? 'Definitions' : 'Terms'} → select letter</div>
            ${termsCol}
          </div>
          <div class="match-defs-col">
            <div class="match-col-label">${flip ? 'Terms' : 'Definitions'}</div>
            ${defsCol}
          </div>
        </div>
      </div>`;
  }

  // ── Part 3: Written ──
  let writtenHtml = '';
  if (tform.written.length) {
    partNum++;
    const flip = tform.settings.flip;
    const qs = tform.written.map((q, i) => `
      <div class="written-question" id="wr_${i}">
        <span class="written-qnum">${i + 1}.</span>
        <span class="written-term">${escHtml(q.prompt)}</span>
        <div class="written-input-wrap">
          <input class="written-inp" id="wi_${i}" type="text" placeholder="${flip ? 'Term…' : 'Definition…'}"
            value="${escHtml(q.answer)}"
            oninput="writtenType(${i},this.value)"
            onkeydown="if(event.key==='Enter'){const n=document.getElementById('wi_${i+1}');if(n)n.focus();}"
            ${tform.graded ? 'readonly' : ''} autocomplete="off" />
          <div class="written-reveal" id="wr_rev_${i}"></div>
        </div>
      </div>`).join('');
    writtenHtml = `
      <div class="test-section">
        <div class="test-section-header">
          <span class="test-section-title">Part ${partNum} — Written</span>
          <span class="test-section-meta">${tform.graded ? tform.scores.written + ' / ' + tform.written.length : tform.written.length + ' questions'}</span>
        </div>
        ${qs}
      </div>`;
  }

  const submitRow = tform.graded
    ? `<button class="btn btn-ghost" onclick="testRetake()">Retake Test</button>`
    : `<button class="btn btn-primary" onclick="gradeTest()">Submit Test</button>`;

  document.getElementById('main').innerHTML = `
    <div class="test-form">
      ${settingsBar}
      ${banner}
      ${mcHtml}
      ${matchHtml}
      ${writtenHtml}
      <div class="test-submit-row">${submitRow}</div>
    </div>`;

  if (tform.graded) applyGradeStyles();
  else if (tform.written.length) setTimeout(() => document.getElementById('wi_0')?.focus(), 40);
}

function mcPick(qi, oi) {
  if (tform.graded) return;
  tform.mc[qi].answer = oi;
  document.querySelectorAll(`#mc_${qi} .mc-opt`).forEach((b, i) => b.classList.toggle('selected', i === oi));
}

function matchPick(i, val) {
  if (tform.graded) return;
  tform.matchTerms[i].answer = val || null;
}

function writtenType(i, val) {
  tform.written[i].answer = val;
}

function gradeTest() {
  tform.graded = true;
  tform.scores.mc = tform.mc.filter(q => q.answer !== null && q.opts[q.answer] === q.correctAns).length;
  tform.scores.match = tform.matchTerms.filter(t => t.answer === t.correctLetter).length;
  tform.scores.written = tform.written.filter(q =>
    q.answer && checkSimilar(normalizeAnswer(q.answer), normalizeAnswer(q.correctAns))
  ).length;
  renderTest(getValidCards());
}

function applyGradeStyles() {
  tform.mc.forEach((q, qi) => {
    const correctIdx = q.opts.indexOf(q.correctAns);
    document.querySelectorAll(`#mc_${qi} .mc-opt`).forEach((btn, oi) => {
      if (oi === correctIdx) btn.classList.add('opt-correct');
      else if (oi === q.answer) btn.classList.add('opt-wrong');
    });
  });
  tform.matchTerms.forEach((t, i) => {
    const sel = document.getElementById('ms_' + i);
    if (!sel) return;
    sel.classList.add(t.answer === t.correctLetter ? 'opt-correct' : 'opt-wrong');
  });
  tform.written.forEach((q, i) => {
    const inp = document.getElementById('wi_' + i);
    const rev = document.getElementById('wr_rev_' + i);
    if (!inp) return;
    const ok = q.answer && checkSimilar(normalizeAnswer(q.answer), normalizeAnswer(q.correctAns));
    inp.classList.add(ok ? 'opt-correct' : 'opt-wrong');
    if (!ok && rev) rev.textContent = q.correctAns;
  });
}

function testRetake() { buildTest(getValidCards()); render(); }

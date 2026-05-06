// ══════════════════════════════════════════════
//  LEARN
// ══════════════════════════════════════════════
const SECTION_SIZE = 7;

/* ─── INIT ─── */
function learnInit(cards) {
  const order = shuffle(cards.map((_,i) => i));
  ln.sections = [];
  for (let i = 0; i < order.length; i += SECTION_SIZE)
    ln.sections.push({ cards: order.slice(i, i + SECTION_SIZE) });

  ln.secIdx = 0;
  ln.phase = 'mc';
  ln.totalSteps = cards.length * 2;
  ln.correctSet = new Set();
  ln.showBreak = false;
  ln.breakSecIdx = -1;
  ln.isAnswered = false;
  ln.score = { c: 0, w: 0 };

  if (cards.length) lnStartPhase();
}

function lnStartPhase() {
  const sec = ln.sections[ln.secIdx];
  ln.queue = sec.cards.map(ci => ({ cardIdx: ci, mode: ln.phase }));
  ln.missed = [];
  ln.initialQueueLen = ln.queue.length;
  ln.isAnswered = false;
  lnPrepQuestion();
}

function lnPrepQuestion() {
  const q = ln.queue[0];
  if (!q) return;
  ln.isAnswered = false;
  ln.mcSelected = null;
  ln.mcIsCorrect = null;
  if (q.mode === 'mc') ln.mcChoices = lnBuildChoices(q.cardIdx);
}

function lnBuildChoices(cardIdx) {
  const cards = getValidCards();
  const correct = cards[cardIdx].term;
  const pool = shuffle(cards.filter((_,i) => i !== cardIdx).map(c => c.term));
  return shuffle([correct, ...pool.slice(0, 3)]);
}

/* ─── PROGRESS ─── */
function lnPct() {
  return ln.totalSteps ? Math.round(ln.correctSet.size / ln.totalSteps * 100) : 0;
}

function lnSegFill(i) {
  const sec = ln.sections[i];
  if (!sec) return 0;
  const done = sec.cards.reduce((n, ci) =>
    n + (ln.correctSet.has(`${ci}:mc`) ? 1 : 0) + (ln.correctSet.has(`${ci}:type`) ? 1 : 0), 0);
  return Math.round(done / (sec.cards.length * 2) * 100);
}

function lnProgressHtml() {
  const pct = lnPct();
  const segs = ln.sections.map((sec, i) => {
    const fill = lnSegFill(i);
    const isActive = i === ln.secIdx && !ln.showBreak;
    return `<div class="lp-seg${isActive ? ' active' : ''}" style="flex:${sec.cards.length}">
      <div class="lp-fill" style="width:${fill}%"></div>
    </div>`;
  }).join('');
  return `<div class="lp-row">
    <span class="lp-pct">${pct}%</span>
    <div class="lp-bar">${segs}</div>
  </div>`;
}

/* ─── RENDER DISPATCH ─── */
function renderLearn(cards) {
  if (!ln.sections.length) { learnInit(cards); if (!cards.length) return; }
  if (ln.showBreak) { renderLearnBreak(cards); return; }
  if (!ln.queue.length && !ln.missed.length) { lnPhaseComplete(cards); return; }

  const q = ln.queue[0];
  if (!q) return;
  const ph = lnProgressHtml();
  if (q.mode === 'mc') renderLearnMC(cards, q, ph);
  else renderLearnType(cards, q, ph);
}

/* ─── MULTIPLE CHOICE ─── */
function renderLearnMC(cards, q, progressHtml) {
  const card = cards[q.cardIdx];
  const choicesHtml = ln.mcChoices.map((ch, i) => {
    let cls = 'mc-choice';
    if (ln.isAnswered) {
      if (ch === card.term) cls += ' state-correct';
      else if (i === ln.mcSelected && !ln.mcIsCorrect) cls += ' state-wrong';
    }
    return `<button class="${cls}" onclick="lnMCPick(${i})" ${ln.isAnswered ? 'disabled' : ''}>
      <span class="mc-num">${i+1}</span><span>${escHtml(ch)}</span>
    </button>`;
  }).join('');

  const sectionLabel = `Section ${ln.secIdx + 1} of ${ln.sections.length} · Multiple Choice`;

  document.getElementById('main').innerHTML = `
    <div class="learn-wrap">
      ${progressHtml}
      <div class="lp-section-label">${sectionLabel}</div>
      <div class="learn-card">
        <div class="learn-prompt-label">Definition</div>
        <div class="learn-term">${escHtml(card.def)}</div>
        <div class="learn-prompt-label">Choose an answer</div>
        <div class="mc-grid">${choicesHtml}</div>
        ${ln.isAnswered ? `<div class="learn-btn-row"><button class="btn btn-primary" onclick="lnNext()">Next →</button></div>` : ''}
      </div>
    </div>`;
}

function lnMCPick(idx) {
  if (ln.isAnswered) return;
  const cards = getValidCards();
  const q = ln.queue[0];
  if (!q) return;

  const isCorrect = ln.mcChoices[idx] === cards[q.cardIdx].term;
  ln.mcSelected = idx;
  ln.mcIsCorrect = isCorrect;
  ln.isAnswered = true;

  if (isCorrect) {
    ln.score.c++;
    ln.correctSet.add(`${q.cardIdx}:mc`);
  } else {
    ln.score.w++;
    ln.missed.push({ ...q });
  }
  render();
}

/* ─── TYPING ─── */
function renderLearnType(cards, q, progressHtml) {
  const card = cards[q.cardIdx];
  const sectionLabel = `Section ${ln.secIdx + 1} of ${ln.sections.length} · Typing`;

  document.getElementById('main').innerHTML = `
    <div class="learn-wrap">
      ${progressHtml}
      <div class="lp-section-label">${sectionLabel}</div>
      <div class="learn-card">
        <div class="learn-prompt-label">Definition</div>
        <div class="learn-term">${escHtml(card.def)}</div>
        <div class="learn-prompt-label">Your answer</div>
        <input class="learn-input" id="learnInput" placeholder="Type the term…"
          onkeydown="if(event.key==='Enter'&&!this.readOnly)lnTypeCheck()" autocomplete="off" />
        <div class="learn-feedback" id="lnFeedback"></div>
        <div class="learn-btn-row" id="lnBtns">
          <button class="btn btn-primary" onclick="lnTypeCheck()">Check</button>
          <button class="btn btn-ghost" onclick="lnTypeReveal()">Reveal</button>
        </div>
      </div>
    </div>`;

  setTimeout(() => document.getElementById('learnInput')?.focus(), 40);
}

function lnTypeCheck() {
  const input = document.getElementById('learnInput');
  if (!input || input.readOnly) return;
  const cards = getValidCards();
  const q = ln.queue[0];
  if (!q) return;

  const card = cards[q.cardIdx];
  const isOk = checkSimilar(normalizeAnswer(input.value), normalizeAnswer(card.term));
  lnTypeApply(isOk, card.term, q, input);
}

function lnTypeReveal() {
  const input = document.getElementById('learnInput');
  if (!input || input.readOnly) return;
  const cards = getValidCards();
  const q = ln.queue[0];
  if (!q) return;
  lnTypeApply(false, cards[q.cardIdx].term, q, input);
}

function lnTypeApply(isOk, correctTerm, q, input) {
  input.readOnly = true;
  input.classList.add(isOk ? 'state-correct' : 'state-incorrect');

  const fb = document.getElementById('lnFeedback');
  if (fb) {
    fb.className = 'learn-feedback ' + (isOk ? 'correct' : 'incorrect');
    fb.textContent = isOk ? '✓ Correct!' : `✗ ${correctTerm}`;
  }

  if (isOk) {
    ln.score.c++;
    ln.correctSet.add(`${q.cardIdx}:type`);
  } else {
    ln.score.w++;
    ln.missed.push({ ...q });
  }
  ln.isAnswered = true;

  const btns = document.getElementById('lnBtns');
  if (btns) btns.innerHTML = `<button class="btn btn-primary" onclick="lnNext()">Next →</button>`;
}

/* ─── NAVIGATION ─── */
function lnNext() {
  ln.queue.shift();

  if (!ln.queue.length && ln.missed.length) {
    ln.queue = [...ln.missed];
    ln.missed = [];
  }

  lnPrepQuestion();
  render();
}

function lnPhaseComplete(cards) {
  if (ln.phase === 'mc') {
    ln.phase = 'type';
    lnStartPhase();
    render();
  } else {
    ln.breakSecIdx = ln.secIdx;
    ln.secIdx++;
    ln.showBreak = true;
    render();
  }
}

/* ─── BREAK SCREEN ─── */
function renderLearnBreak(cards) {
  const sec = ln.sections[ln.breakSecIdx];
  const isLast = ln.secIdx >= ln.sections.length;
  const pct = lnPct();
  const correctInSec = sec.cards.filter(ci =>
    ln.correctSet.has(`${ci}:mc`) && ln.correctSet.has(`${ci}:type`)).length;

  const termListHtml = sec.cards.map(ci => {
    const card = cards[ci];
    const bothDone = ln.correctSet.has(`${ci}:mc`) && ln.correctSet.has(`${ci}:type`);
    return `<div class="ln-term-row${bothDone ? ' done' : ''}">
      <div class="ln-term-cell">${escHtml(card.term)}</div>
      <div class="ln-term-cell dim">${escHtml(card.def)}</div>
    </div>`;
  }).join('');

  document.getElementById('main').innerHTML = `
    <div class="ln-break">
      <div class="ln-break-header">
        <h2>${isLast ? 'All done!' : 'Keep it up!'}</h2>
        <div class="ln-break-sub">Total progress: <span>${pct}%</span></div>
      </div>
      <div class="ln-break-bar-row">
        <span class="ln-break-side-label correct-label">Correct</span>
        <div class="ln-break-bar-track">
          <div class="ln-break-bar-fill" style="width:0%"></div>
        </div>
        <span class="ln-break-side-label total-label">${cards.length} total</span>
      </div>
      <div>
        <div class="ln-term-list-header">Terms studied in this section</div>
        <div class="ln-term-list">${termListHtml}</div>
      </div>
      <div class="ln-break-footer">
        <div class="ln-break-hint">${isLast ? '' : 'Press any key to continue'}</div>
        <button class="btn btn-primary" onclick="${isLast ? 'learnShowFinal()' : 'lnContinueBreak()'}">
          ${isLast ? 'See Results' : 'Continue'}
        </button>
      </div>
    </div>`;

  // Animate bar in after paint
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const fill = document.querySelector('.ln-break-bar-fill');
    if (fill) fill.style.width = pct + '%';
  }));
}

function lnContinueBreak() {
  ln.showBreak = false;
  ln.phase = 'mc';
  lnStartPhase();
  render();
}

function learnShowFinal() {
  const cards = getValidCards();
  const pct = lnPct();
  document.getElementById('main').innerHTML = `
    <div class="result-screen">
      <div class="result-glyph">✓</div>
      <div class="result-score">${pct}%</div>
      <div class="result-label">${cards.length} terms · ${ln.score.c} correct · ${ln.score.w} incorrect</div>
      <button class="btn btn-primary" onclick="learnRestart()">Study Again</button>
    </div>`;
}

function learnRestart() {
  learnInit(getValidCards());
  render();
}

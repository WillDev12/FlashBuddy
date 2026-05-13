// ══════════════════════════════════════════════
//  MATCH
// ══════════════════════════════════════════════
function buildMatch(cards) {
  if (mt.timerInterval) { clearInterval(mt.timerInterval); mt.timerInterval = null; }
  const pool = shuffle(cards).slice(0, 8);
  const items = [];
  pool.forEach((card, pi) => {
    items.push({ id: uid(), pairId: pi, text: card.term, kind: 'term', matched: false });
    items.push({ id: uid(), pairId: pi, text: card.def, kind: 'def', matched: false });
  });
  mt.cards = shuffle(items);
  mt.selected = null;
  mt.pairs = 0;
  mt.total = pool.length;
  mt.errors = 0;
  mt.startTime = Date.now();
}

function renderMatch() {
  if (!mt.started) {
    document.getElementById('main').innerHTML = `
      <div class="match-start-screen">
        <div class="match-start-title">Match</div>
        <div class="match-start-desc">Match each term to its definition as fast as you can.</div>
        <button class="btn btn-primary" onclick="matchBegin()">Start Game</button>
      </div>`;
    return;
  }

  if (!mt.cards.length) { buildMatch(getValidCards()); }

  if (mt.pairs === mt.total && mt.total > 0) {
    if (mt.timerInterval) { clearInterval(mt.timerInterval); mt.timerInterval = null; }
    const elapsed = Math.round((Date.now() - mt.startTime) / 1000);
    const m = Math.floor(elapsed / 60), s = elapsed % 60;
    const timeStr = m > 0 ? `${m}m ${s}s` : `${s}s`;
    document.getElementById('main').innerHTML = `
      <div class="result-screen">
        <div class="result-glyph">✦</div>
        <div class="result-title">All matched!</div>
        <div class="result-score">${timeStr}</div>
        <div class="result-label">${mt.errors} mistake${mt.errors !== 1 ? 's' : ''}</div>
        <button class="btn btn-primary" onclick="matchRestart()">Play Again</button>
      </div>`;
    return;
  }

  const grid = mt.cards.map(mc => {
    let cls = 'match-card';
    let ariaLabel = escHtml(mc.text);
    if (mc.matched) { cls += ' matched'; ariaLabel += ' — matched'; }
    else if (mt.selected && mt.selected.id === mc.id) { cls += ' selected'; ariaLabel += ' — selected'; }
    const disabled = mc.matched ? 'aria-disabled="true"' : '';
    return `<div class="${cls}" id="mc_${mc.id}" role="button" tabindex="${mc.matched ? '-1' : '0'}" aria-label="${ariaLabel}" ${disabled} onclick="matchSelect('${mc.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();matchSelect('${mc.id}')}">${escHtml(mc.text)}</div>`;
  }).join('');

  // Timer
  const elapsed = Math.round((Date.now() - mt.startTime) / 1000);
  const m = Math.floor(elapsed / 60), s = elapsed % 60;
  const timerStr = (m > 0 ? m + ':' : '') + String(s).padStart(2, '0');

  document.getElementById('main').innerHTML = `
    <div class="match-wrap">
      <div class="match-header">
        <div class="match-timer" id="matchTimer">${timerStr}</div>
        <div class="match-info">${mt.pairs} / ${mt.total} matched · ${mt.errors} mistakes</div>
      </div>
      <div class="match-grid">${grid}</div>
    </div>`;

  if (!mt.timerInterval) {
    mt.timerInterval = setInterval(() => {
      const el = document.getElementById('matchTimer');
      if (!el) { clearInterval(mt.timerInterval); mt.timerInterval = null; return; }
      const sec = Math.round((Date.now() - mt.startTime) / 1000);
      const mm = Math.floor(sec / 60), ss = sec % 60;
      el.textContent = (mm > 0 ? mm + ':' : '') + String(ss).padStart(2, '0');
    }, 1000);
  }
}

function matchSelect(id) {
  const mc = mt.cards.find(c => c.id === id);
  if (!mc || mc.matched) return;

  if (!mt.selected) {
    mt.selected = mc;
    document.getElementById('mc_' + id)?.classList.add('selected');
    return;
  }

  if (mt.selected.id === id) {
    mt.selected = null;
    document.getElementById('mc_' + id)?.classList.remove('selected');
    return;
  }

  const prev = mt.selected;
  mt.selected = null;

  if (prev.pairId === mc.pairId && prev.kind !== mc.kind) {
    prev.matched = true; mc.matched = true; mt.pairs++;
    const e1 = document.getElementById('mc_' + prev.id);
    const e2 = document.getElementById('mc_' + mc.id);
    if (e1) { e1.classList.remove('selected'); e1.classList.add('matched'); }
    if (e2) { e2.classList.remove('selected'); e2.classList.add('matched'); }
    // Update info
    const info = document.querySelector('.match-info');
    if (info) info.textContent = `${mt.pairs} / ${mt.total} matched · ${mt.errors} mistakes`;
    if (mt.pairs === mt.total) setTimeout(renderMatch, 700);
  } else {
    mt.errors++;
    const e1 = document.getElementById('mc_' + prev.id);
    const e2 = document.getElementById('mc_' + mc.id);
    const flash = (el) => { if(!el) return; el.classList.add('wrong'); setTimeout(() => el.classList.remove('wrong','selected'), 500); };
    flash(e1); flash(e2);
    const info = document.querySelector('.match-info');
    if (info) info.textContent = `${mt.pairs} / ${mt.total} matched · ${mt.errors} mistakes`;
  }
}

function matchBegin() {
  buildMatch(getValidCards());
  mt.started = true;
  render();
}

function matchRestart() {
  if (mt.timerInterval) { clearInterval(mt.timerInterval); mt.timerInterval = null; }
  buildMatch(getValidCards());
  mt.started = true;
  render();
}

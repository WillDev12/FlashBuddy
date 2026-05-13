// ══════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════
function renderFlashcards(cards) {
  if (!fc.order.length) { fc.order = shuffle(cards.map((_,i) => i)); fc.idx = 0; }
  const cardIdx = fc.order[fc.idx];
  const card = cards[cardIdx];
  const total = cards.length;
  const current = fc.idx;

  // Build dots (show up to 15)
  const show = Math.min(total, 15);
  const startDot = Math.max(0, Math.min(current - 7, total - show));
  let dots = '';
  for (let i = startDot; i < startDot + show; i++) {
    const cls = i < current ? 'past' : i === current ? 'current' : 'future';
    dots += `<div class="fc-dot ${cls}"></div>`;
  }

  document.getElementById('main').innerHTML = `
    <div class="fc-wrap">
      <div class="fc-meta">
        <div class="fc-progress-text">${current + 1} / ${total}</div>
        <div class="fc-dots">${dots}</div>
        <div class="fc-hints">space to flip · ← → to navigate</div>
      </div>

      <div class="card-viewport" onclick="fcFlip()" id="cardViewport"
           role="button" tabindex="0" aria-label="${fc.flipped ? 'Definition: ' + escHtml(card.def) : 'Term: ' + escHtml(card.term) + ' — press to reveal definition'}"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();fcFlip()}">
        <div class="card-inner${fc.flipped ? ' flipped' : ''}" id="cardInner" aria-hidden="true">
          <div class="card-face card-face-front">
            <div class="card-label">TERM</div>
            <div class="card-text">${escHtml(card.term)}</div>
          </div>
          <div class="card-face card-face-back">
            <div class="card-label">DEFINITION</div>
            <div class="card-text">${escHtml(card.def)}</div>
          </div>
        </div>
      </div>

      <div class="fc-controls">
        <button class="fc-nav-btn" onclick="event.stopPropagation();fcPrev()" ${fc.idx === 0 ? 'disabled' : ''} title="Previous (←)" aria-label="Previous card">←</button>
        <button class="fc-flip-btn" onclick="fcFlip()">Flip</button>
        <button class="fc-nav-btn" onclick="event.stopPropagation();fcNext()" ${fc.idx >= total - 1 ? 'disabled' : ''} title="Next (→)" aria-label="Next card">→</button>
      </div>

      <div class="fc-actions">
        <button class="btn btn-ghost btn-sm" onclick="fcShuffle()">Shuffle</button>
        <button class="btn btn-ghost btn-sm" onclick="fcRestart()">Restart</button>
      </div>
    </div>`;
}

function announce(text) {
  const el = document.getElementById('a11yAnnounce');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = text; }, 50);
}

function fcFlip() {
  fc.flipped = !fc.flipped;
  const el = document.getElementById('cardInner');
  if (el) el.classList.toggle('flipped', fc.flipped);
  const vp = document.getElementById('cardViewport');
  if (vp) {
    const cards = getValidCards();
    const card = cards[fc.order[fc.idx]];
    if (card) {
      const label = fc.flipped
        ? 'Definition: ' + card.def
        : 'Term: ' + card.term + ' — press to reveal definition';
      vp.setAttribute('aria-label', label);
      announce(fc.flipped ? 'Definition: ' + card.def : 'Term: ' + card.term);
    }
  }
}

function fcNext() {
  const cards = getValidCards();
  if (fc.idx < cards.length - 1) {
    fc.idx++; fc.flipped = false; render();
    const card = cards[fc.order[fc.idx]];
    if (card) announce('Card ' + (fc.idx + 1) + ' of ' + cards.length + '. Term: ' + card.term);
  }
}

function fcPrev() {
  if (fc.idx > 0) {
    fc.idx--; fc.flipped = false; render();
    const cards = getValidCards();
    const card = cards[fc.order[fc.idx]];
    if (card) announce('Card ' + (fc.idx + 1) + ' of ' + cards.length + '. Term: ' + card.term);
  }
}

function fcShuffle() {
  const cards = getValidCards();
  fc.order = shuffle(cards.map((_,i) => i));
  fc.idx = 0; fc.flipped = false; render();
}

function fcRestart() { fc.idx = 0; fc.flipped = false; render(); }

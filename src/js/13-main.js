// ══════════════════════════════════════════════
//  KEYBOARD SHORTCUTS
// ══════════════════════════════════════════════
document.addEventListener('keydown', e => {
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
  if (document.querySelector('.overlay:not(.hidden)')) return;

  if (activeMode === 'flashcards') {
    if (e.key === ' ' || e.key === 'f') { e.preventDefault(); fcFlip(); }
    if (e.key === 'ArrowRight' || e.key === 'l') fcNext();
    if (e.key === 'ArrowLeft' || e.key === 'h') fcPrev();
  }
  if (activeMode === 'learn' && ln.showBreak && ln.secIdx < ln.sections.length) {
    lnContinueBreak();
  }
  if (e.key === 'Escape') {
    closeManage(); closeEditor();
  }
});

// ══════════════════════════════════════════════
//  CONNECTIVITY
// ══════════════════════════════════════════════
window.addEventListener('offline', () => toast('No internet connection — some features disabled', 4000));
window.addEventListener('online',  () => toast('Back online ✓'));

// ══════════════════════════════════════════════
//  UPDATE CHECK
// ══════════════════════════════════════════════
async function checkForUpdate() {
  if (!GITHUB_REPO) return;

  const CACHE_KEY = 'flashbuddy_update_checked';
  const last = parseInt(localStorage.getItem(CACHE_KEY) || '0');
  if (Date.now() - last < 86_400_000) return;   // once per day
  localStorage.setItem(CACHE_KEY, Date.now());

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json' } }
    );
    if (!res.ok) return;
    const { tag_name, html_url } = await res.json();
    if (!tag_name) return;

    const clean = v => v.replace(/^v/, '').split('.').map(Number);
    const [la, lb, lc] = clean(tag_name);
    const [ca, cb, cc] = clean(APP_VERSION);
    const newer = la !== ca ? la > ca : lb !== cb ? lb > cb : lc > cc;
    if (!newer) return;

    document.getElementById('updateBannerTag').textContent = tag_name;
    document.getElementById('updateBannerLink').href = html_url;
    document.getElementById('updateBanner').classList.remove('hidden');
  } catch(_) {}
}

function dismissUpdate() {
  document.getElementById('updateBanner').classList.add('hidden');
}

function dismissWelcome() {
  document.getElementById('welcomeBanner').classList.add('hidden');
  localStorage.setItem('flashbuddy_welcomed', '1');
}

// ══════════════════════════════════════════════
//  BROWSER EXTENSION
// ══════════════════════════════════════════════
function updateExtStatus(connected) {
  const dot  = document.getElementById('extStatusDot');
  const text = document.getElementById('extStatusText');
  const hint = document.getElementById('extHint');
  if (!dot || !text) return;
  if (connected) {
    dot.className = 'ext-status-dot connected';
    text.textContent = 'Extension connected';
    if (hint) hint.innerHTML = 'Open a Quizlet deck and click the FlashBuddy button to import.';
  } else {
    dot.className = 'ext-status-dot';
    text.textContent = 'Extension not detected';
    if (hint) hint.innerHTML = 'Install the FlashBuddy extension to use this feature. <a href="https://flashbuddy.vercel.app/docs/install-extension" target="_blank" rel="noopener" style="color:var(--accent)">Get extension →</a>';
  }
}

window.addEventListener('message', e => {
  if (!e.data || typeof e.data !== 'object') return;
  if (e.data.type === 'FLASHBUDDY_EXT_INSTALLED') {
    extInstalled = true;
    updateExtStatus(true);
  } else if (e.data.type === 'FLASHBUDDY_IMPORT_DECK') {
    const { name, cards } = e.data;
    if (!Array.isArray(cards) || !cards.length) return;
    openEditor(null);
    if (name) document.getElementById('deckNameInput').value = name;
    populateRows(cards);
    toast(`Imported ${cards.length} card${cards.length !== 1 ? 's' : ''} from extension ✓`);
  }
});

// ══════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════
storeLoad();
refreshSelect();
const ids = Object.keys(decks);
if (ids.length) {
  activeDeckId = ids[0];
  document.getElementById('deckSelect').value = activeDeckId;
  resetAllModes();
}
render();
if (!navigator.onLine) setTimeout(() => toast('No internet connection — some features disabled', 4000), 400);

checkForUpdate();

// Help link always points to Vercel docs
const helpLink = document.getElementById('helpLink');
if (helpLink) {
  helpLink.href = 'https://flashbuddy.vercel.app/docs';
  const welcomeDocsLink = document.getElementById('welcomeDocsLink');
  if (welcomeDocsLink) welcomeDocsLink.href = 'https://flashbuddy.vercel.app/docs';
}

// First-time welcome banner
if (!localStorage.getItem('flashbuddy_welcomed')) {
  document.getElementById('welcomeBanner').classList.remove('hidden');
}

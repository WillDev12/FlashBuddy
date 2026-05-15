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
function setOnlineUI(online) {
  const notice = document.getElementById('quizletOfflineNotice');
  const input  = document.getElementById('quizletUrl');
  const btn    = document.getElementById('quizletImportBtn');
  if (notice) notice.classList.toggle('hidden', online);
  if (input)  input.disabled  = !online;
  if (btn)    btn.disabled    = !online;
}

window.addEventListener('offline', () => {
  if (!SCRAPER_URL) return;
  toast('No internet connection — some features disabled', 4000);
  setOnlineUI(false);
});

window.addEventListener('online', () => {
  if (!SCRAPER_URL) return;
  toast('Back online ✓');
  setOnlineUI(true);
});

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
if (!SCRAPER_URL) {
  const notice = document.getElementById('quizletOfflineNotice');
  if (notice) notice.textContent = 'URL import not available in standalone mode';
  setOnlineUI(false);
} else {
  setOnlineUI(navigator.onLine);
  if (!navigator.onLine) setTimeout(() => toast('No internet connection — some features disabled', 4000), 400);
}
checkForUpdate();

// Help link
const helpLink = document.getElementById('helpLink');
if (helpLink) {
  const docsUrl = 'https://flashbuddy.vercel.app/docs';
  helpLink.href = docsUrl;
  const welcomeDocsLink = document.getElementById('welcomeDocsLink');
  if (welcomeDocsLink) welcomeDocsLink.href = docsUrl;
}

// First-time welcome banner
if (!localStorage.getItem('flashbuddy_welcomed')) {
  document.getElementById('welcomeBanner').classList.remove('hidden');
}

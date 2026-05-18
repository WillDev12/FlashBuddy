// Runs on local HTML files — only activates on FlashBuddy pages

if (document.getElementById('deckSelect') && document.getElementById('manageModal') && document.querySelector('.logo-dot')) {
  // Signal presence to the app
  window.postMessage({ type: 'FLASHBUDDY_EXT_INSTALLED' }, '*');

  // Relay deck imports from background to the app page
  chrome.runtime.onMessage.addListener(msg => {
    if (msg.type === 'IMPORT_DECK') {
      window.postMessage({ type: 'FLASHBUDDY_IMPORT_DECK', name: msg.name, cards: msg.cards }, '*');
    }
  });
}

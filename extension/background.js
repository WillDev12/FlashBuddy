// Background service worker — routes deck data from Quizlet to FlashBuddy

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'SEND_TO_FLASHBUDDY') {
    sendToFlashBuddy(msg.name, msg.cards).then(sendResponse);
    return true; // keep channel open for async response
  }
});

async function sendToFlashBuddy(name, cards) {
  const tabs = await chrome.tabs.query({});

  // First pass: find by URL hint
  let fbTab = tabs.find(t =>
    t.url && (
      /flashbuddy/i.test(t.url) ||
      t.url.endsWith('index.html')
    )
  );

  // Second pass: check all accessible tabs for the FlashBuddy deckSelect element
  if (!fbTab) {
    for (const tab of tabs) {
      if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => !!(document.getElementById('deckSelect') && document.getElementById('manageModal'))
        });
        if (result?.result) { fbTab = tab; break; }
      } catch (_) { /* tab not accessible */ }
    }
  }

  if (!fbTab) {
    return { success: false, error: 'FlashBuddy is not open in any tab. Please open it first.' };
  }

  try {
    await chrome.tabs.sendMessage(fbTab.id, { type: 'IMPORT_DECK', name, cards });
    return { success: true };
  } catch (e) {
    return { success: false, error: 'Could not reach FlashBuddy tab. Try refreshing it.' };
  }
}

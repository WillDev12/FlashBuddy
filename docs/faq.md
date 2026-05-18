# Frequently Asked Questions

## My decks disappeared — what happened?

FlashBuddy stores your decks in your browser's **local storage**. Data can be lost if you:

- Cleared your browser history or site data
- Opened FlashBuddy in a private/incognito window (data doesn't persist after closing)
- Used a different browser or browser profile than usual

**To prevent data loss:** use **Manage → Export All** regularly to save a backup `.json` file. You can re-import it at any time with **Manage → Import File**.

## Do my decks sync across devices or browsers?

No. Each browser stores its own copy in local storage. To move decks between devices, export from one and import on the other: **Manage → Export All**, then **Manage → Import File** on the new device.

## Which browsers are supported?

FlashBuddy works in any modern desktop browser:

| Browser | Status |
|---------|--------|
| Chrome / Chromium | Fully supported |
| Firefox | Fully supported |
| Edge | Fully supported |
| Safari | Fully supported |
| Brave, Opera, Arc | Fully supported |

The **FlashBuddy Extras** extension (for Quizlet import) is Chrome/Chromium only. Other import methods (PDF, export string) work in all browsers.

Mobile browsers work for studying, but the deck editor is designed for desktop use.

## How do I import cards from Quizlet?

Three ways:

- **FlashBuddy Extras extension** — install the Chrome extension, open any Quizlet deck, and click the FlashBuddy button that appears on the page. See [Import via Extension](import-cards-using-extension).
- **Export string** — on Quizlet, click **…** → **Export**, copy the text, and paste it into the import field in the deck editor.
- **PDF** — save a Quizlet set as a PDF and upload it. See [Import via PDF](import-cards-using-pdf).

## The extension says "Extension not detected" in FlashBuddy — what do I do?

1. Make sure **FlashBuddy Extras** is installed and enabled in Chrome (visit `chrome://extensions`).
2. Reload the FlashBuddy page — the extension check runs on load.
3. If you're running FlashBuddy as a local `.html` file, make sure the extension has **file access** enabled: `chrome://extensions` → FlashBuddy Extras → Details → toggle "Allow access to file URLs".

## The extension button doesn't appear on Quizlet — what do I do?

1. Make sure the URL contains a deck ID (e.g. `quizlet.com/123456/...`). The button only appears on individual deck pages, not search results or profile pages.
2. Try reloading the Quizlet page.
3. If Quizlet prompts you to log in to view the deck, the extension cannot access private decks.

## How do I back up my decks?

Open **Manage**, scroll to the **Files** section, and click **Export All**. This saves a `.json` file containing all your decks. Store it somewhere safe — cloud storage, email it to yourself, etc.

## Can I use FlashBuddy offline?

Yes. After the initial page load, FlashBuddy works fully offline. The only features that require internet are:
- PDF.js for the first PDF import in a session (loaded from a CDN once, then cached)
- The update notification banner

## How do I bookmark FlashBuddy for quick access?

Open the `.html` file in your browser, then bookmark it:

- **Chrome / Edge:** `Ctrl+D` (Windows/Linux) or `Cmd+D` (Mac)
- **Firefox:** `Ctrl+D` / `Cmd+D`
- **Safari:** `Cmd+D`

Your decks stay saved as long as you reopen from the same browser and profile.

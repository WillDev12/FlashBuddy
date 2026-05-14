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
| ChromeOS (browser only) | Supported — no scraper |

The scraper server (URL import) is not available on ChromeOS. Use the [PDF import method](import-cards-using-pdf) instead.

Mobile browsers work for studying, but the deck editor is designed for desktop use.

## What is the "URL Import" release for?

The **URL Import** release includes a small local server that lets you import Quizlet sets directly by pasting a URL. The **Standalone** release works without it — you can still import via PDF or pasted export string.

See [Set up the scraper server](setup-scraper-server) for setup instructions.

## The URL import fails — what do I do?

1. Make sure the scraper window is open and shows the "listening on port..." message.
2. The Quizlet set must be **public**. Private sets cannot be scraped.
3. If import still fails, try the [PDF import method](import-cards-using-pdf) as a fallback.

## How do I back up my decks?

Open **Manage**, scroll to the **Files** section, and click **Export All**. This saves a `.json` file containing all your decks. Store it somewhere safe — cloud storage, email it to yourself, etc.

## Can I use FlashBuddy offline?

Yes. After the initial page load, FlashBuddy works fully offline. The only features that require internet are:
- URL import (requires the scraper server, which itself needs internet to reach Quizlet)
- PDF.js for the first PDF import in a session (loaded from a CDN once, then cached)
- The update notification banner

## How do I bookmark FlashBuddy for quick access?

Open the `.html` file in your browser, then bookmark it:

- **Chrome / Edge:** `Ctrl+D` (Windows/Linux) or `Cmd+D` (Mac)
- **Firefox:** `Ctrl+D` / `Cmd+D`
- **Safari:** `Cmd+D`

Your decks stay saved as long as you reopen from the same browser and profile.

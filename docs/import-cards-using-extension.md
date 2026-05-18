# Import from Quizlet via Extension

**FlashBuddy Extras** is a Chrome extension that scrapes any public Quizlet deck and sends the cards directly to FlashBuddy — no server, no copy-pasting.

## Requirements

- Google Chrome (or any Chromium-based browser: Edge, Brave, Arc, Opera)
- FlashBuddy Extras installed ([install guide](install-extension))

## How to Use

1. Open FlashBuddy in your browser.
2. In a separate tab, open the Quizlet deck you want to import.
3. A **FlashBuddy** button will appear in the bottom-right corner of the Quizlet page.
4. Click the button — the extension scrapes the deck and displays the cards in a preview panel.
5. Review the cards, then click **Send to FlashBuddy**.
6. Switch back to the FlashBuddy tab — the deck editor will open with the imported cards pre-filled.
7. Give the deck a name and click **Save Deck**.

## Notes

- The deck must be **public**. Private decks require a Quizlet login, which the extension cannot access.
- Large decks (100+ cards) are fully supported — the extension expands all "See more" sections automatically.
- If you switch to a different Quizlet deck while the panel is open, the content updates automatically.
- The extension panel adapts to Quizlet's light or dark theme.

## Troubleshooting

**Button doesn't appear on the Quizlet page** — make sure the URL contains a deck ID (e.g. `quizlet.com/123456/deck-name`). The button only shows on individual deck pages.

**"Extension not detected" in FlashBuddy** — reload the FlashBuddy page. If running as a local `.html` file, enable "Allow access to file URLs" in the extension settings: `chrome://extensions` → FlashBuddy Extras → Details.

**Import fails / no cards found** — try the [PDF import method](import-cards-using-pdf) as a fallback. Quizlet occasionally changes their page structure, which can break scraping temporarily.

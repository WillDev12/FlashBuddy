# Import from Quizlet URL

This method automatically scrapes a Quizlet set using a local browser. It requires the **Scraper Included** release and Node.js installed on your machine.

## Requirements

- **FlashBuddy — Scraper Included** (the `.zip` release)
- [Node.js](https://nodejs.org) v18 or later

## Setup

See [Setting Up the Scraper Server](setup-scraper) before using this method.

## How to Use

1. Open FlashBuddy in your browser.
2. Click **Manage** → **+ New Deck** (or edit an existing deck).
3. Under **Import from Quizlet → By URL**, paste your Quizlet set URL.
4. Click **Import**.
5. A log will show the progress. When it finishes, the cards appear in the editor.
6. Give the deck a name and click **Save Deck**.

## Notes

- The set must be **public**. Private sets require you to be logged in, which the scraper does not support.
- Large sets (100+ cards) may take 30–60 seconds to fully scrape.
- If the import fails with a "Cards not found" error, try the [Saved HTML File](import-html) method instead.

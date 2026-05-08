# Import via 'Print Page'

This method lets you import a Quizlet set by saving it as a PDF file. It works entirely offline — no scraper server or internet connection needed after the PDF is saved (though the first use requires a brief internet connection to load the PDF reader).

## How to Use

### Step 1 — Load all terms on the Quizlet page

Quizlet only renders the terms that are visible on screen. If you print before scrolling, cards below the fold will be missing from the PDF.

1. Open the Quizlet set in your browser.
2. Scroll all the way to the bottom of the **Terms in this set** table.
3. If there is a **Show more** or similar button, click it and wait for all terms to appear.
4. Confirm the number of visible rows matches the count shown in the **Terms in this set (N)** heading.

### Step 2 — Save the page as a PDF

1. Press **Ctrl+P** (Windows/Linux) or **Cmd+P** (Mac) to open the print dialog.
2. Set the destination to **Save as PDF** (Chrome/Edge) or **Microsoft Print to PDF** (Windows).
3. Click **Save** and choose a location.

### Step 3 — Import into FlashBuddy

1. Open FlashBuddy and click **Manage** → **+ New Deck** (or edit an existing deck).
2. Under **Import from Quizlet → By Printed PDF**, click **Upload Quizlet .pdf**.
3. Select the PDF file you saved.
4. FlashBuddy reads the file, fills in the deck name automatically, and populates the card editor.
5. Review the cards, then click **Save Deck**.

## Notes

- **First use requires internet.** The PDF reader (PDF.js) is loaded from a CDN the first time you use this feature. Subsequent uses in the same session are instant.
- **All terms must be loaded before printing.** If the imported count is less than the number shown in the Quizlet heading, go back and scroll/expand the terms table before printing again.
- The deck name is filled automatically from the PDF. You can edit it before saving.
- This method works on any Quizlet set, including private sets you are logged into, because you are printing directly from your browser.

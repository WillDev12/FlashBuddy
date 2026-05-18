# Installing FlashBuddy Extras

**FlashBuddy Extras** is a Chrome extension that lets you import Quizlet decks directly into FlashBuddy with one click — no server or copy-pasting required.

## Install from the Download Page

1. Go to [flashbuddy.vercel.app/download](https://flashbuddy.vercel.app/download).
2. Under **FlashBuddy Extras**, click the download button to get `FlashBuddy-extension.zip`.
3. Unzip the file — you'll get a folder called `FlashBuddy-extension`.
4. Open Chrome and go to `chrome://extensions`.
5. Enable **Developer mode** (toggle in the top-right corner).
6. Click **Load unpacked** and select the `FlashBuddy-extension` folder.
7. The extension is now installed. You'll see the FlashBuddy Extras icon in your toolbar.

## Allow Access to Local Files (optional)

If you run FlashBuddy as a local `.html` file (rather than from a web server), you need to grant the extension file access:

1. Go to `chrome://extensions`.
2. Click **Details** under FlashBuddy Extras.
3. Toggle **Allow access to file URLs** on.

## Verifying the Install

1. Open FlashBuddy and click **Manage** → **+ New Deck** (or edit an existing deck).
2. In the editor, look for the **By Extension** section — it should show **Extension connected** with a green dot.
3. Open a public Quizlet deck in another tab — the FlashBuddy button should appear in the bottom-right corner of the page.

## Updating the Extension

The extension doesn't update automatically (it's installed as unpacked). To update:

1. Download the new `FlashBuddy-extension.zip` from the [download page](https://flashbuddy.vercel.app/download).
2. Unzip it, replacing the old folder.
3. Go to `chrome://extensions` and click the refresh icon on the FlashBuddy Extras card.

## Compatibility

FlashBuddy Extras works in Chrome and any Chromium-based browser (Edge, Brave, Arc, Opera). It is not available for Firefox or Safari.

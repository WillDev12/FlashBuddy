# Setting Up the Scraper Server

The scraper server enables **URL import** from Quizlet. It runs on your local machine and uses a real browser to load and extract flashcard data.

**Note for ChromeOS users: This feature will not be compatible with your device! Standard Chromebooks offer no nodejs support.**

## Requirements

- [Node.js](https://nodejs.org) v18 or later
   - Download [here](https://nodejs.org/en/download), not available on ChromeOS
- The **FlashBuddy — URL Import** `.zip` release

## Installation

1. Download and unzip the **URL Import** release.
2. Start the server from the unzipped folder:
   - **Mac / Linux:** Open Terminal and run:
     ```bash
     bash /path/to/start.sh
     ```
     You can drag `start.sh` from Finder/Files into the terminal window to fill in the path automatically.
   - **Windows:** Double-click `start.bat`.
3. The first run downloads a bundled browser (~150 MB) — this only happens once and can take 1–5 minutes.
4. When you see `FlashBuddy scraper listening on http://localhost:3000`, the server is ready.

> **macOS Gatekeeper:** If you see "cannot be opened because the developer cannot be verified", run this command on the unzipped folder and try again:
> ```bash
> xattr -cr /path/to/FlashBuddy-url-import
> ```

## Usage

Keep the scraper terminal window open while using FlashBuddy. You can close it when you're done importing.

To start the server again later, repeat step 2.

## Troubleshooting

**"node is not recognized"** — Node.js is not installed. Download it from [nodejs.org](https://nodejs.org) and retry.

**Port 3000 already in use** — Another process is using port 3000. Run the server on a different port by setting the `PORT` environment variable:
- Mac / Linux: `PORT=3001 bash start.sh`
- Windows: `set PORT=3001 && start.bat`

**Import still fails after starting the server** — Make sure the server window shows the "listening" message before importing. If the Quizlet set is private, use the PDF import method instead.

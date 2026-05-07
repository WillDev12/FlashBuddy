# Setting Up the Scraper Server

The scraper server enables **URL import** from Quizlet. It runs on your local machine and uses a real browser to load and extract flashcard data.

## Requirements

- [Node.js](https://nodejs.org) v18 or later
- The **FlashBuddy — Scraper Included** `.zip` release

## Installation

1. Download and unzip the **Scraper Included** release.
2. Inside the unzipped folder, open the `scraper/` directory.
3. Start the server:
   - **Mac / Linux:** Double-click `start.sh`, or run it in a terminal:
     ```bash
     bash start.sh
     ```
   - **Windows:** Double-click `start.bat`.
4. The first run downloads a bundled browser (~150 MB) — this only happens once.
5. When you see `FlashBuddy scraper listening on http://localhost:3000`, the server is ready.

## Usage

Keep the scraper terminal window open while using FlashBuddy. You can close it when you're done importing.

To start the server again later, repeat step 3.

## Troubleshooting

**"node is not recognized"** — Node.js is not installed. Download it from [nodejs.org](https://nodejs.org) and retry.

**Port 3000 already in use** — Another process is using port 3000. Close it or change the port by editing `scraper/server.js` (line: `const PORT = 3000`).

**Import still fails after starting the server** — Make sure the server window shows the "listening" message before importing. If the Quizlet set is private, use the [Saved HTML File](import-html) method instead.

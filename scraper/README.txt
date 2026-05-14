FlashBuddy — Scraper Setup Guide
=================================

The scraper lets you import Quizlet decks directly by URL. It runs
a small local server on your computer (port 3000 by default). Keep
the window open while importing -- you can close it when you're done.

NOTE: The scraper is NOT currently supported on ChromeOS.
      Use the "Import via PDF" import method instead.

-----------------------------------------------------------------
WINDOWS
-----------------------------------------------------------------
1. Install Node.js (if you haven't already):
     https://nodejs.org/en/download/
     Download the "Windows Installer (.msi)" and run it.
     Accept all defaults during setup.

2. Double-click  start.bat  in this folder.

3. The first run downloads ~150 MB of packages including a bundled
   copy of Chrome (used to scrape Quizlet). This only happens once
   and can take 1-5 minutes. Leave the window open.

4. Open FlashBuddy.html and use "Import from URL".

-----------------------------------------------------------------
macOS
-----------------------------------------------------------------
1. Install Node.js (if you haven't already):
     https://nodejs.org/en/download/
     Download the "macOS Installer (.pkg)" and run it.
     Or, with Homebrew: brew install node

2. Open Terminal (search "Terminal" in Spotlight) and run:
     bash /path/to/start.sh
   Replace /path/to/ with the actual folder. You can drag the
   file from Finder into Terminal to fill in the path.

   If you get a "permission denied" error, first run:
     chmod +x start.sh
   Then try again.

   macOS Gatekeeper may block the script with "cannot be opened
   because the developer cannot be verified." To fix this, run:
     xattr -cr /path/to/scraper
   (replacing /path/to/scraper with the actual folder path),
   then try running start.sh again.

3. The first run downloads ~150 MB of packages including a bundled
   copy of Chrome. This only happens once and can take 1-5 minutes.
   Leave Terminal open.

4. Open FlashBuddy.html and use "Import from URL".

-----------------------------------------------------------------
LINUX
-----------------------------------------------------------------
1. Install Node.js (if you haven't already):
     Ubuntu/Debian:   sudo apt install nodejs npm
     Fedora:          sudo dnf install nodejs
     Arch:            sudo pacman -S nodejs npm
     Other:           https://nodejs.org/en/download/

2. Open a terminal, navigate to this folder, and run:
     chmod +x start.sh
     ./start.sh

3. The first run downloads ~150 MB of packages including a bundled
   copy of Chrome. This only happens once and can take 1-5 minutes.
   Leave the terminal open.

4. Open FlashBuddy.html and use "Import from URL".

-----------------------------------------------------------------
ChromeOS
-----------------------------------------------------------------
The scraper is NOT currently supported on ChromeOS due to
restrictions on running local servers.

Use the "Import via PDF" import method instead.

-----------------------------------------------------------------
CHANGING THE PORT
-----------------------------------------------------------------
The server uses port 3000 by default. To use a different port,
set the PORT environment variable before starting:

  Mac / Linux:  PORT=3001 bash start.sh
  Windows:      set PORT=3001 && start.bat

If you change the port, you must also update the scraper URL
inside FlashBuddy (it defaults to http://localhost:3000).

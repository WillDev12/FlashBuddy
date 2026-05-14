#!/bin/bash
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed on this computer."
    echo ""
    echo "You need Node.js to run the scraper. Install it first, then run this script again."
    echo ""
    echo "  macOS:          https://nodejs.org/en/download/"
    echo "                  Or with Homebrew: brew install node"
    echo "  Ubuntu/Debian:  sudo apt install nodejs npm"
    echo "  Fedora:         sudo dnf install nodejs"
    echo "  Arch:           sudo pacman -S nodejs npm"
    echo "  Other Linux:    https://nodejs.org/en/download/"
    echo ""
    echo "  Step-by-step guide: See README.txt in this folder."
    echo ""
    exit 1
fi

cd "$(dirname "$0")/scraper"
echo "Installing scraper dependencies..."
echo ""
echo "(First run only: Node.js needs to download ~150 MB of packages including a bundled"
echo " browser. This usually takes 1-5 minutes. Please wait -- it won't happen next time.)"
echo ""
npm install
echo ""

BOLD='\033[1m'
RESET='\033[0m'
PORT_IN_USE=${PORT:-3000}
echo -e "${BOLD}============================================================${RESET}"
echo -e "${BOLD}  Quizlet scraper is up on port ${PORT_IN_USE}!${RESET}"
echo -e "${BOLD}  You can now use \"Import from URL\" in FlashBuddy.${RESET}"
echo -e "${BOLD}  Keep this window open while importing.${RESET}"
if [ -n "$PORT" ]; then
  echo -e "${BOLD}  (Custom port: ${PORT} — update FlashBuddy if needed)${RESET}"
fi
echo -e "${BOLD}============================================================${RESET}"
echo ""
node server.js

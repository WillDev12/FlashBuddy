#!/bin/bash
cd "$(dirname "$0")"
echo "Installing dependencies (first run may take a minute)..."
npm install
echo ""
echo "FlashBuddy scraper running at http://localhost:3000"
echo "Keep this window open while importing from Quizlet."
echo ""
node server.js

<h1>FlashBuddy</h1>

<p>
  <img src="https://img.shields.io/github/last-commit/WillDev12/FlashBuddy" alt="GitHub last commit">
  <img src="https://img.shields.io/github/commits-since/WillDev12/FlashBuddy/latest" alt="GitHub commits since latest release">
  <img src="https://img.shields.io/github/contributors/WillDev12/FlashBuddy" alt="GitHub contributors">
  <img src="https://img.shields.io/github/checks-status/WillDev12/FlashBuddy/main" alt="GitHub commit status">
  <img src="https://img.shields.io/github/size/WillDev12/FlashBuddy/dist/standalone/FlashBuddy-standalone.html?label=standalone%20html" alt="Standalone HTML file size">
  <img src="https://img.shields.io/github/stars/WillDev12/FlashBuddy" alt="GitHub repo stars">
</p>

A standalone, single-file flashcard study app. No accounts, no tracking, no internet required — just open `index.html` and study.

## Features

- **Flashcards** — flip through cards with keyboard shortcuts
- **Learn** — adaptive MC + typing rounds in spaced sections
- **Test** — configurable exam with multiple choice, matching, and written responses; flip terms/definitions; set question count
- **Match** — timed drag-and-drop matching game
- **Quizlet import** — import by URL (requires scraper) or paste an export string directly
- **Offline support** — works fully offline; internet-only features are gracefully disabled
- **Auto-update check** — notifies you when a new release is posted to GitHub

## Quick start

Download the latest `FlashBuddy-standalone.html` from the [releases page](https://github.com/WillDev12/FlashBuddy/releases) and open it in any browser. That's it.

## Development

**Requirements:** Node.js 18+

```bash
# one-time build
npm run build

# rebuild automatically on every file change
npm run watch
```

Source files live in `src/` — CSS in `src/css/`, JS in `src/js/`, HTML shell in `src/template.html`. The build script concatenates and minifies everything into a single `index.html`.

## Publishing a release

1. Bump `APP_VERSION` in `src/js/01-state.js`
2. Run `npm run build`
3. Create a GitHub release tagged with the new version (e.g. `v1.0.1`)
4. Attach `dist/standalone/FlashBuddy-standalone.html` as a release asset

Users running an older version will see an update banner the next time they open the app.

<h1>FlashBuddy</h1>

<p>
  <img src="https://img.shields.io/github/last-commit/WillDev12/FlashBuddy" alt="GitHub last commit">
  <img src="https://img.shields.io/github/commits-since/WillDev12/FlashBuddy/latest" alt="GitHub commits since latest release">
  <img src="https://img.shields.io/github/contributors/WillDev12/FlashBuddy" alt="GitHub contributors">
  <img src="https://img.shields.io/github/checks-status/WillDev12/FlashBuddy/main" alt="GitHub commit status">
  <img src="https://img.shields.io/github/size/WillDev12/FlashBuddy/dist/standalone/FlashBuddy-standalone.html?label=standalone%20html" alt="Standalone HTML file size">
  <img src="https://img.shields.io/github/stars/WillDev12/FlashBuddy?style=default&color=yellow" alt="GitHub repo stars">
</p>

A standalone, single-file flashcard study app. No accounts, no tracking, no internet required — just open `FlashBuddy-standalone.html` and study.

## Features

- **Flashcards** — flip through cards with keyboard shortcuts
- **Learn** — adaptive MC + typing rounds in spaced sections
- **Test** — configurable exam with multiple choice, matching, and written responses; flip terms/definitions; set question count
- **Match** — timed drag-and-drop matching game
- **Quizlet import** — import via the FlashBuddy Extras Chrome extension, PDF, or pasted export string
- **Offline support** — works fully offline after initial load
- **Auto-update check** — notifies you when a new release is posted to GitHub

## Quick start

Download the latest `FlashBuddy-standalone.html` from the [releases page](https://github.com/WillDev12/FlashBuddy/releases) and open it in any browser. That's it.

To import Quizlet decks, also grab the **FlashBuddy Extras** extension from the same releases page.

## Docs

- [How to use](docs/how-to-use.md)
- [Import cards via extension](docs/import-cards-using-extension.md)
- [Import cards from PDF](docs/import-cards-using-pdf.md)
- [Install FlashBuddy Extras](docs/install-extension.md)
- [FAQ](docs/faq.md)

See [CHANGELOG.md](CHANGELOG.md) for what's new in each release.

## Development

**Requirements:** Node.js 18+

```bash
# one-time build
npm run build

# rebuild automatically on every file change
npm run watch
```

Source files live in `src/` — CSS in `src/css/`, JS in `src/js/`, HTML shell in `src/template.html`. The build script concatenates and minifies everything into a single `index.html` and also produces the extension zip.

## Publishing a release

There are two separate releases published independently:

### FlashBuddy (program)

1. Bump `version` in `package.json`
2. Update `CHANGELOG.md`
3. Push a `v*` tag — CI builds and attaches `FlashBuddy-standalone.html`:

```bash
git tag v2.0.1
git push origin v2.0.1
```

### FlashBuddy Extras (extension)

1. Bump `version` in `extension/manifest.json`
2. Push an `ext-v*` tag — CI builds and attaches `FlashBuddy-extension.zip`:

```bash
git tag ext-v1.0.1
git push origin ext-v1.0.1
```

The [download page](https://flashbuddy.vercel.app/download) fetches both releases from the GitHub API and displays them separately.

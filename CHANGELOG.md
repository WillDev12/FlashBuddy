# Changelog

## ext-[1.0.0] - 2026-05-18
- Initial release of FlashBuddy Extras
- Scrapes any public Quizlet deck in-page and sends cards directly to FlashBuddy — no server required
- Auto-expands "See N more" sections to capture full decks (100+ cards)
- Adapts to Quizlet light/dark theme
- Supports SPA navigation — switching decks updates the panel without closing it
- Export string delimiter controls in the preview panel

## [2.0.0] - 2026-05-18
- Replace URL import (local scraper server) with FlashBuddy Extras Chrome extension — no Node.js or local server required
- New Chrome extension scrapes Quizlet decks in-page and sends cards directly to FlashBuddy via browser messaging
- Extension auto-expands "See N more" sections to capture full decks (100+ cards)
- Extension UI adapts to Quizlet light/dark theme
- Extension supports SPA navigation — switching decks updates the panel without closing it
- Export string delimiter controls added to extension panel
- Deck editor shows extension connection status with install link when not detected
- Rename `scraper/` to `server/` — local server is now the web backend only, not a user-facing tool
- Separate GitHub release pipelines: `v*` tags publish `FlashBuddy-standalone.html`, `ext-v*` tags publish `FlashBuddy-extension.zip`
- Download page shows latest program and extension releases independently
- Docs: rewrote import guide for extension workflow, added extension install guide, updated FAQ and usage guide

## [1.2.0] - 2026-05-14
- Scraper: significantly faster import times — average reduced from 5–10 minutes to under 20 seconds
- Rename "Scraper Included" release to "URL Import" for clarity
- Scraper server port is now configurable via `PORT` environment variable
- First-time welcome banner with link to docs
- Help (?) button in header linking to docs
- URL import error messages now include a direct link to the setup guide
- Docs: new FAQ page covering data loss, browser support, backups, offline use
- Docs: added browser compatibility and deck backup sections to the usage guide
- Docs: macOS Gatekeeper fix documented in scraper setup guide
- Fix: scraper setup guide incorrectly directed users into the `scraper/` subdirectory

## [1.1.4] - 2026-05-13
- Accessibility: ARIA roles and labels on modals, tabs, flashcard, match game, and test results
- Accessibility: focus trap and focus restore on all modals
- Accessibility: `prefers-reduced-motion` support for card flip, match, and toast animations
- Accessibility: `--ink3` contrast raised to meet WCAG AA
- GitHub Actions: automated release workflow on version tag push
- GitHub Actions: CI build check on `src/` changes

## [1.1.3] - 2025-01-01
- Replace test timer with SVG fill ring animation

## [1.1.2] - 2025-01-01
- Minify CSS in build output
- Inject version from package.json automatically
- Add stars badge to README

## [1.1.1] - 2025-01-01
- Minify JS with terser
- Resize favicon to 64×64

## [1.1.0]
- Add timer option to Test mode
- Add flip terms/definitions toggle to Test mode
- Add question count setting to Test mode

## [1.0.0]
- Initial release
- Flashcards, Learn, Test, and Match modes
- Quizlet import by URL, PDF, and export string
- Offline support
- Auto-update notifications

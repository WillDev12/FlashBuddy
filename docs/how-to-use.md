# Basic Usage

## Getting Started

Download `Flashbuddy vx.x.x -- Standalone` from the [download page](download) and open it in any browser. No install, no account, no internet required.

*For details on how to install the Scraper Included release, see [Setting up the Scraper Server](setup-scraper-server.md).*

## Creating a Deck

1. Click **Manage** in the top navigation.
2. Click **+ New Deck**.
3. Enter a deck name.
4. Add cards — type a **term** and **definition** for each row. Press **Tab** to move between fields, or click **+ Add Card** to append a new row.
5. Click **Save Deck**.

## Editing and Deleting Decks

- To edit: open **Manage**, click the deck name, make changes, click **Save Deck**.
- To delete: open **Manage**, click the trash icon next to the deck, confirm.

## Study Modes

Select a deck from the home screen, then pick a mode:

| Mode | What it does |
|------|-------------|
| **Flashcards** | Flip through cards one at a time. Press **Space** or click to flip. Arrow keys or buttons to advance. |
| **Learn** | Adaptive rounds of multiple choice and typed answers. FlashBuddy prioritizes cards you get wrong. |
| **Test** | Configurable exam — set question count, question types (multiple choice, matching, written), and whether to flip terms/definitions. |
| **Match** | Timed drag-and-drop game. Match each term to its definition before the clock runs out. |

## Keyboard Shortcuts (Flashcards mode)

| Key | Action |
|-----|--------|
| `Space` or `↑` | Flip card |
| `→` | Next card |
| `←` | Previous card |
| `1` | Mark correct |
| `2` | Mark incorrect |

## Importing Cards

FlashBuddy supports several import methods:

- **By URL** — requires the scraper server. See [Import by URL](import-cards-using-url.md).
- **By PDF** — save a Quizlet set as a PDF and upload it. See [Import via PDF](import-cards-using-pdf.md).
- **Paste export string** — copy a Quizlet export string and paste it directly into the import field in the deck editor.

## Offline Use

FlashBuddy works fully offline after the initial page load. Features that require a scraper server (URL import) are gracefully disabled when the server is unreachable.

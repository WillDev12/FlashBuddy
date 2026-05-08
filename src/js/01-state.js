// ══════════════════════════════════════════════
//  CONFIG  — fill in before publishing
// ══════════════════════════════════════════════
const APP_VERSION = '1.1.1';
const GITHUB_REPO = 'WillDev12/FlashBuddy';
const SCRAPER_URL = 'http://localhost:3000';

// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let decks = {};          // { id: { name, cards: [{term,def}] } }
let activeDeckId = null;
let activeMode = 'flashcards';
let editingId = null;

// Per-mode state
const fc = { idx: 0, flipped: false, order: [] };
const ln = {
  sections: [],       // [{cards:[cardIdx,...]}]
  secIdx: 0,
  phase: 'mc',        // 'mc' | 'type'
  totalSteps: 0,      // cards.length * 2
  queue: [],          // [{cardIdx, mode}] remaining this pass
  missed: [],         // [{cardIdx, mode}] wrong this pass, re-queued next pass
  initialQueueLen: 0,
  showBreak: false,
  breakSecIdx: -1,
  isAnswered: false,
  score: { c: 0, w: 0 },
  correctSet: new Set(), // "cardIdx:mc" | "cardIdx:type" — tracks unique completions
  mcChoices: [],
  mcSelected: null,
  mcIsCorrect: null,
};
const tform = {
  mc: [], matchTerms: [], matchDefs: [], written: [],
  graded: false,
  scores: { mc:0, match:0, written:0 },
  settings: { mc: true, match: true, written: true, qCount: 10, flip: false },
  settingsOpen: false,
};
const mt = { cards: [], selected: null, pairs: 0, total: 0, errors: 0, startTime: 0, timerInterval: null };

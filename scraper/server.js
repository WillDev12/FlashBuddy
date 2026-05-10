const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { esc, downloadPage, errorPage, docsIndexPage, docsPage } = require('./views');

const app  = express();
const PORT = 3000;
const GITHUB_REPO = 'WillDev12/FlashBuddy';
const DOCS_DIR    = path.join(__dirname, '../docs');

// ─────────────────────────────────────────────

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.get('/scrape', async (req, res) => {
  const url = req.query.url;
  if (!url || !url.includes('quizlet.com')) {
    return res.status(400).json({ error: 'Invalid Quizlet URL' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (type, payload = {}) =>
    res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);

  send('log', { msg: 'Connection established' });

  let browser;
  try {
    send('log', { msg: 'Launching browser…' });
    const puppeteer = require('puppeteer');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
    });

    send('log', { msg: 'Navigating to Quizlet…' });
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    } catch (e) {
      if (!e.message.includes('timeout')) throw e;
    }

    await page.evaluate(() => {
      for (const sel of ['[data-testid="cookie-banner-accept"]', 'button[aria-label*="Accept"]'])
        document.querySelector(sel)?.click();
    });

    send('log', { msg: 'Waiting for cards to appear…' });
    await page.waitForSelector('[aria-label="Term"]', { timeout: 30000 });

    send('log', { msg: 'Scraping…' });
    const seen = new Map();

    const collectPage = () => page.evaluate(() => {
      return Array.from(document.querySelectorAll('[aria-label="Term"]')).map(item => {
        const sides = item.querySelectorAll('[data-testid="set-page-term-card-side"]');
        const term = sides[0]?.querySelector('.TermText')?.textContent?.trim() ?? '';
        const def  = sides[1]?.querySelector('.TermText')?.textContent?.trim() ?? '';
        return { term, def };
      }).filter(c => c.term && c.def);
    });

    let stable = 0, lastReported = 0;
    while (stable < 4) {
      const batch = await collectPage();
      const before = seen.size;
      batch.forEach(c => { if (!seen.has(c.term)) seen.set(c.term, c); });
      stable = seen.size === before ? stable + 1 : 0;
      if (seen.size !== lastReported && seen.size > 0) {
        send('log', { msg: `Scraping… ${seen.size} cards collected` });
        lastReported = seen.size;
      }
      await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
      await new Promise(r => setTimeout(r, 500));
    }
    (await collectPage()).forEach(c => { if (!seen.has(c.term)) seen.set(c.term, c); });

    const cards = [...seen.values()];
    if (cards.length === 0) {
      send('error', { msg: 'No cards found — deck may be private or Quizlet changed their HTML.' });
      return res.end();
    }

    const name = await page.evaluate(() => {
      for (const el of [document.querySelector('h1'), document.querySelector('[data-testid="set-title"]')]) {
        if (el?.textContent?.trim()) return el.textContent.trim().replace(/\s*[-|]\s*Quizlet.*/i, '').trim();
      }
      return document.title.replace(/\s*[-|]\s*Quizlet.*/i, '').trim();
    });

    send('done', { name, cards });
  } catch (err) {
    console.error(err);
    send('error', { msg: err.message });
  } finally {
    if (browser) await browser.close();
    res.end();
  }
});

app.get('/', (req, res) => res.redirect('/download'));

app.get('/download', async (req, res) => {
  try {
    const apiRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'FlashBuddy' } }
    );
    if (apiRes.status === 404) return res.status(404).send(errorPage('No releases found for this repo.'));
    if (!apiRes.ok) return res.status(502).send(errorPage(`GitHub API returned ${apiRes.status}.`));
    res.send(downloadPage(await apiRes.json()));
  } catch (err) {
    res.status(502).send(errorPage(`Could not reach GitHub: ${err.message}`));
  }
});

app.get('/docs', (req, res) => {
  try {
    const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md')).sort();
    res.send(docsIndexPage(files));
  } catch {
    res.status(500).send(errorPage('Docs not found.'));
  }
});

app.get('/docs/:name', (req, res) => {
  const name = path.basename(req.params.name);
  const file = path.join(DOCS_DIR, name + '.md');
  if (!fs.existsSync(file)) return res.status(404).send(errorPage('Doc not found.'));
  const content = fs.readFileSync(file, 'utf8');
  const title   = name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  res.send(docsPage(title, content));
});

app.listen(PORT, () =>
  console.log(`FlashBuddy scraper listening on http://localhost:${PORT}`)
);

module.exports = app;

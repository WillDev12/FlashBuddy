const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { esc, downloadPage, errorPage, docsIndexPage, docsPage } = require('./views');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin  = require('puppeteer-extra-plugin-stealth');
puppeteerExtra.use(StealthPlugin());

const app  = express();
const PORT = process.env.PORT || 3000;
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
    browser = await puppeteerExtra.launch({
      headless: 'new',
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
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      if (!e.message.includes('timeout')) throw e;
    }

    await page.evaluate(() => {
      for (const sel of ['[data-testid="cookie-banner-accept"]', 'button[aria-label*="Accept"]'])
        document.querySelector(sel)?.click();
    });

    // Fast path: extract cards from Quizlet's embedded JS state
    send('log', { msg: 'Trying fast extraction…' });
    const fastCards = await page.evaluate(() => {
      try {
        // Next.js page data
        const nd = window.__NEXT_DATA__?.props?.pageProps;
        const sets = nd?.dehydratedReduxStateKey
          ? JSON.parse(nd.dehydratedReduxStateKey)
          : nd?.queryData;

        const findCards = (obj, depth = 0) => {
          if (depth > 8 || !obj || typeof obj !== 'object') return null;
          // Quizlet studiableItems / terms array
          for (const key of ['studiableItems', 'terms', 'flashcards']) {
            if (Array.isArray(obj[key]) && obj[key].length > 0 && obj[key][0]?.cardSides) {
              return obj[key].map(item => {
                const sides = item.cardSides;
                const term = sides?.find(s => s.label === 0 || s.label === 'word')?.media?.[0]?.plainText ?? sides?.[0]?.media?.[0]?.plainText ?? '';
                const def  = sides?.find(s => s.label === 1 || s.label === 'definition')?.media?.[0]?.plainText ?? sides?.[1]?.media?.[0]?.plainText ?? '';
                return { term: term.trim(), def: def.trim() };
              }).filter(c => c.term && c.def);
            }
          }
          for (const val of Object.values(obj)) {
            const result = findCards(val, depth + 1);
            if (result && result.length > 0) return result;
          }
          return null;
        };

        const fromState = sets ? findCards(sets) : null;
        if (fromState && fromState.length > 0) return fromState;

        // Inline JSON script tags
        for (const script of document.querySelectorAll('script[type="application/json"], script#__NEXT_DATA__')) {
          try {
            const data = JSON.parse(script.textContent);
            const result = findCards(data);
            if (result && result.length > 0) return result;
          } catch {}
        }
      } catch {}
      return null;
    });

    const seen = new Map();

    if (fastCards && fastCards.length > 0) {
      fastCards.forEach(c => seen.set(c.term, c));
      send('log', { msg: `Scraping… ${seen.size} cards collected` });
    } else {
      // Slow path: wait for DOM rendering and scroll-collect
      send('log', { msg: 'Fast extraction failed, waiting for DOM…' });
      await page.waitForFunction(
        () => !!document.querySelector('.TermText, [aria-label="Term"], [data-testid="set-page-term-card-side"]'),
        { timeout: 90000 }
      );

      send('log', { msg: 'Scraping…' });

      const collectPage = () => page.evaluate(() => {
        const byAriaLabel = Array.from(document.querySelectorAll('[aria-label="Term"]')).map(item => {
          const sides = item.querySelectorAll('[data-testid="set-page-term-card-side"]');
          const term = sides[0]?.querySelector('.TermText')?.textContent?.trim() ?? '';
          const def  = sides[1]?.querySelector('.TermText')?.textContent?.trim() ?? '';
          return { term, def };
        }).filter(c => c.term && c.def);
        if (byAriaLabel.length > 0) return byAriaLabel;

        const sides = Array.from(document.querySelectorAll('[data-testid="set-page-term-card-side"]'));
        const byTestId = [];
        for (let i = 0; i + 1 < sides.length; i += 2) {
          const term = sides[i].querySelector('.TermText')?.textContent?.trim() ?? '';
          const def  = sides[i + 1].querySelector('.TermText')?.textContent?.trim() ?? '';
          if (term && def) byTestId.push({ term, def });
        }
        if (byTestId.length > 0) return byTestId;

        const texts = Array.from(document.querySelectorAll('.TermText'));
        const byTermText = [];
        for (let i = 0; i + 1 < texts.length; i += 2) {
          const term = texts[i].textContent?.trim() ?? '';
          const def  = texts[i + 1].textContent?.trim() ?? '';
          if (term && def) byTermText.push({ term, def });
        }
        return byTermText;
      });

      let stable = 0, lastReported = 0;
      while (stable < 3) {
        const batch = await collectPage();
        const before = seen.size;
        batch.forEach(c => { if (!seen.has(c.term)) seen.set(c.term, c); });
        const atBottom = await page.evaluate(
          () => (window.innerHeight + window.scrollY) >= document.body.scrollHeight - 50
        );
        stable = (seen.size === before || atBottom) ? stable + 1 : 0;
        if (seen.size !== lastReported && seen.size > 0) {
          send('log', { msg: `Scraping… ${seen.size} cards collected` });
          lastReported = seen.size;
        }
        if (atBottom && seen.size === before) break;
        await page.evaluate(() => window.scrollBy(0, window.innerHeight * 2));
        await new Promise(r => setTimeout(r, 800));
      }
      (await collectPage()).forEach(c => { if (!seen.has(c.term)) seen.set(c.term, c); });
    }

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

const express = require('express');

const puppeteer = require('puppeteer-core');
const { execSync } = require('child_process');

function findChromium() {
  if (process.env.CHROMIUM_PATH) return process.env.CHROMIUM_PATH;
  for (const bin of ['chromium', 'chromium-browser', 'google-chrome']) {
    try { return execSync(`which ${bin}`).toString().trim(); } catch (_) {}
  }
  throw new Error('No Chromium binary found — set CHROMIUM_PATH env var');
}

async function launchBrowser() {
  return puppeteer.launch({
    headless: true,
    executablePath: findChromium(),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--window-size=1920,1080',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

const app = express();
const PORT = 3000;
const GITHUB_REPO = 'WillDev12/FlashBuddy';  // e.g. 'yourname/flashdeck'

// ── helpers ──────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function downloadPage(release) {
  const { tag_name, name, published_at, body, html_url, assets } = release;
  const date = new Date(published_at).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
  });
  const asset = assets.find(a => a.name.endsWith('.html'));
  const dlLinks = asset
    ? `<a class="dl-btn" href="${esc(asset.browser_download_url)}" download>
        <span>Download ${esc(tag_name)}</span>
        <span class="size">${(asset.size / 1024).toFixed(0)} KB</span>
      </a>`
    : `<a class="dl-btn" href="${esc(html_url)}" download>Download ${esc(tag_name)}.html</a>`;
  const notes = body
    ? `<pre class="notes">${esc(body.trim())}</pre>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>FlashBuddy — Download</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f0f2f8;color:#1a1a2e;
         display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #dde2f0;border-radius:14px;
          padding:40px;max-width:500px;width:100%;box-shadow:0 4px 20px rgba(0,0,0,.08)}
    .label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
           color:#8891b0;margin-bottom:10px}
    h1{font-size:30px;font-weight:700;margin-bottom:4px}
    .date{font-size:13px;color:#8891b0;margin-bottom:28px}
    .dl-btn{display:flex;align-items:center;justify-content:space-between;
            padding:13px 18px;background:#1a1a2e;color:#fff;text-decoration:none;
            border-radius:8px;font-weight:600;font-size:14px;margin-bottom:8px;
            transition:background .15s}
    .dl-btn:hover{background:#2d2d4e}
    .size{font-size:12px;opacity:.55;font-family:monospace;font-weight:400}
    .notes{font-size:12px;color:#555;background:#f7f8fc;border:1px solid #e4e8f4;
           border-radius:6px;padding:14px;margin-top:20px;white-space:pre-wrap;
           word-break:break-word;max-height:180px;overflow-y:auto;line-height:1.6}
    .gh-link{display:block;text-align:center;margin-top:18px;font-size:13px;
             color:#8891b0;text-decoration:none}
    .gh-link:hover{color:#555}
  </style>
</head>
<body>
  <div class="card">
    <div class="label">FlashBuddy</div>
    <h1>${esc(tag_name)}</h1>
    <div class="date">Released ${date}</div>
    ${dlLinks}
    ${notes}
    <a class="gh-link" href="https://github.com/${esc(GITHUB_REPO)}" target="_blank" rel="noopener">View on GitHub →</a>
  </div>
</body>
</html>`;
}

function errorPage(msg) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>FlashBuddy — Download</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,sans-serif;background:#f0f2f8;
         display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#fff;border:1px solid #dde2f0;border-radius:14px;
          padding:40px;max-width:400px;text-align:center}
    h1{font-size:18px;margin-bottom:10px}
    p{color:#666;font-size:13px;line-height:1.5}
  </style>
</head>
<body>
  <div class="card">
    <h1>Download unavailable</h1>
    <p>${esc(msg)}</p>
  </div>
</body>
</html>`;
}
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

  // Server-Sent Events
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (type, payload = {}) => {
    res.write(`data: ${JSON.stringify({ type, ...payload })}\n\n`);
  };

  send('log', { msg: 'Connection established' });

  let browser;
  try {
    send('log', { msg: 'Launching browser…' });
    browser = await launchBrowser();

    send('log', { msg: 'Navigating to Quizlet…' });
    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    } catch (e) {
      if (!e.message.includes('timeout')) throw e;
    }

    // Wait for JS to settle, then dismiss consent banners
    await new Promise(r => setTimeout(r, 2000));
    await page.evaluate(() => {
      for (const sel of [
        '[data-testid="cookie-banner-accept"]',
        'button[aria-label*="Accept"]',
        'button[aria-label*="accept"]',
        '[class*="CookieBanner"] button',
        '[id*="cookie"] button',
        '[class*="consent"] button',
      ]) {
        document.querySelector(sel)?.click();
      }
    });
    await new Promise(r => setTimeout(r, 1000));

    send('log', { msg: 'Waiting for cards to appear…' });

    const CARD_SELECTORS = [
      '[aria-label="Term"]',
      '.SetPageTerm-side',
      '[class*="TermText"]',
      '[data-testid*="term-card"]',
    ];

    let foundSelector = null;
    for (const sel of CARD_SELECTORS) {
      try {
        await page.waitForSelector(sel, { timeout: 15000 });
        foundSelector = sel;
        break;
      } catch (_) {}
    }

    if (!foundSelector) {
      const title = await page.title();
      send('error', { msg: `Cards not found. Page title: "${title}". Quizlet may require login or changed its HTML.` });
      return res.end();
    }

    send('log', { msg: 'Scraping…' });

    const seen = new Map();

    function collectPage() {
      return page.evaluate((sel) => {
        return Array.from(document.querySelectorAll(sel)).map(item => {
          const sides = item.querySelectorAll('[data-testid="set-page-term-card-side"]');
          const term = sides[0]?.querySelector('.TermText')?.textContent?.trim()
            ?? item.querySelector('.TermText')?.textContent?.trim()
            ?? item.textContent?.trim()
            ?? '';
          const def  = sides[1]?.querySelector('.TermText')?.textContent?.trim() ?? '';
          return { term, def };
        }).filter(c => c.term && c.def);
      }, foundSelector);
    }

    let stable = 0;
    let lastReported = 0;

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

    // Final pass
    (await collectPage()).forEach(c => { if (!seen.has(c.term)) seen.set(c.term, c); });

    const cards = [...seen.values()];
    console.log(`Collected ${cards.length} cards`);

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
  if (!GITHUB_REPO) {
    return res.status(500).send(errorPage('Set GITHUB_REPO in scraper/server.js first.'));
  }
  try {
    const apiRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
      { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'FlashBuddy' } }
    );
    if (apiRes.status === 404) return res.status(404).send(errorPage('No releases found for this repo.'));
    if (!apiRes.ok)            return res.status(502).send(errorPage(`GitHub API returned ${apiRes.status}.`));
    res.send(downloadPage(await apiRes.json()));
  } catch (err) {
    res.status(502).send(errorPage(`Could not reach GitHub: ${err.message}`));
  }
});

app.listen(PORT, () => {
  console.log(`FlashBuddy scraper listening on http://localhost:${PORT}`);
});

module.exports = app;

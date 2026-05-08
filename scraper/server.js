const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { marked } = require('marked');

const app  = express();
const PORT = 3000;
const GITHUB_REPO = 'WillDev12/FlashBuddy';
const DOCS_DIR    = path.join(__dirname, '../docs');

// ── helpers ──────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shell(css) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='4' y='15' width='24' height='14' rx='2' fill='%2393c5fd' stroke='%2393c5fd' stroke-width='1.5'/%3E%3Ctext x='16' y='23' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='24' text-anchor='middle' fill='%232563EB' stroke='black' stroke-width='1.5' paint-order='stroke fill'%3EF%3C/text%3E%3C/svg%3E">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,sans-serif;background:#f0f2f8;color:#1a1a2e;padding:40px 24px}
.wrap{max-width:720px;margin:0 auto}
.back{display:inline-block;margin-bottom:24px;font-size:13px;color:#8891b0;text-decoration:none}
.back:hover{color:#555}
.card{background:#fff;border:1px solid #dde2f0;border-radius:14px;padding:40px;
      box-shadow:0 4px 20px rgba(0,0,0,.08)}
${css ?? ''}
</style></head><body><div class="wrap">`;
}
const shellEnd = `</div></body></html>`;

function downloadPage(release) {
  const { tag_name, published_at, body, html_url, assets } = release;
  const date = new Date(published_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });

  const standaloneAsset = assets.find(a => a.name.endsWith('.html'));
  const zipAsset        = assets.find(a => a.name.endsWith('.zip'));

  const dlBtn = (href, label, sub, dl = true) =>
    `<a class="dl-btn" href="${esc(href)}"${dl ? ' download' : ''} target="_blank" rel="noopener">
      <span>${esc(label)}</span><span class="sub">${esc(sub)}</span></a>`;

  const links = [
    standaloneAsset
      ? dlBtn(standaloneAsset.browser_download_url, `Download ${tag_name} — Standalone`,
              `${(standaloneAsset.size/1024).toFixed(0)} KB · No scraper required`)
      : dlBtn(html_url, `Download ${tag_name}`, 'GitHub release page', false),
    zipAsset
      ? dlBtn(zipAsset.browser_download_url, `Download ${tag_name} — Scraper Included`,
              `${(zipAsset.size/1024).toFixed(0)} KB · Includes local scraper for Quizlet URL import`)
      : '',
  ].join('\n');

  const notes = body ? `<pre class="notes">${esc(body.trim())}</pre>` : '';

  return shell(`
    .label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8891b0;margin-bottom:10px}
    h1{font-size:30px;font-weight:700;margin-bottom:4px}
    .date{font-size:13px;color:#8891b0;margin-bottom:28px}
    .dl-btn{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;
            background:#1a1a2e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;
            font-size:14px;margin-bottom:8px;transition:background .15s}
    .dl-btn:hover{background:#2d2d4e}
    .sub{font-size:12px;opacity:.55;font-family:monospace;font-weight:400;text-align:right;max-width:55%}
    .notes{font-size:12px;color:#555;background:#f7f8fc;border:1px solid #e4e8f4;border-radius:6px;
           padding:14px;margin-top:20px;white-space:pre-wrap;word-break:break-word;
           max-height:180px;overflow-y:auto;line-height:1.6}
    .gh-link{display:block;text-align:center;margin-top:18px;font-size:13px;color:#8891b0;text-decoration:none}
    .gh-link:hover{color:#555}
    .docs-link{display:block;text-align:center;margin-top:10px;font-size:13px;color:#8891b0;text-decoration:none}
    .docs-link:hover{color:#555}
  `) + `
  <div class="card">
    <div class="label">FlashBuddy</div>
    <h1>${esc(tag_name)}</h1>
    <div class="date">Released ${date}</div>
    ${links}
    ${notes}
    <div style="display: flex; gap: 0.2rem">
    <a class="gh-link" href="https://github.com/${esc(GITHUB_REPO)}" target="_blank" rel="noopener">View on GitHub →</a>
    <a class="docs-link" href="/docs">How to Use →</a>
    </div>
  </div>` + shellEnd;
}

function errorPage(msg) {
  return shell() + `<div class="card" style="text-align:center">
    <h1 style="font-size:18px;margin-bottom:10px">Unavailable</h1>
    <p style="color:#666;font-size:13px;line-height:1.5">${esc(msg)}</p>
  </div>` + shellEnd;
}

function docsIndexPage(files) {
  const items = files.map(f => {
    const slug = f.replace(/\.md$/, '');
    const title = slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    return `<a class="doc-item" href="/docs/${esc(slug)}">${esc(title)}</a>`;
  }).join('');
  return shell(`
    h1{font-size:28px;font-weight:700;margin-bottom:6px}
    .sub{font-size:14px;color:#8891b0;margin-bottom:28px}
    .doc-item{display:block;padding:14px 18px;background:#fff;border:1px solid #dde2f0;
              border-radius:8px;margin-bottom:8px;text-decoration:none;color:#1a1a2e;
              font-weight:600;font-size:15px;transition:border-color .15s}
    .doc-item:hover{border-color:#a0a8d0}
    .home{display:block;text-align:center;margin-top:18px;font-size:13px;color:#8891b0;text-decoration:none}
    .home:hover{color:#555}
  `) + `
  <h1>FlashBuddy Docs</h1>
  <p class="sub">How to navigate the app and use more advanced features.<br>Start by clicking on an article!</p>
  ${items}
  <a class="home" href="/download">← Back to Download</a>` + shellEnd;
}

function docsPage(title, mdContent) {
  return shell(`
    h1{font-size:28px;font-weight:700;margin-bottom:20px}
    h2{font-size:20px;font-weight:600;margin:28px 0 12px}
    h3{font-size:16px;font-weight:600;margin:20px 0 8px}
    p{font-size:15px;line-height:1.7;margin-bottom:14px;color:#333}
    pre{background:#f7f8fc;border:1px solid #e4e8f4;border-radius:6px;padding:14px;
        margin-bottom:14px;overflow-x:auto}
    code{font-family:monospace;font-size:13px;background:#f0f2f8;padding:2px 5px;border-radius:3px}
    pre code{background:none;padding:0}
    ol,ul{margin:0 0 14px 24px}
    li{font-size:15px;line-height:1.7;margin-bottom:4px}
    a.back{display:inline-block;margin-bottom:24px;font-size:13px;color:#8891b0;text-decoration:none}
    a.back:hover{color:#555}
    strong{font-weight:600}
  `) + `
  <a class="back" href="/docs">← Docs</a>
  <div class="card">${marked.parse(mdContent)}</div>` + shellEnd;
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

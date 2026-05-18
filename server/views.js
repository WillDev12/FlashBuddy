const { marked } = require('marked');
const fs   = require('fs');
const path = require('path');

const FAVICON_B64 = fs.readFileSync(path.join(__dirname, 'favicon.png')).toString('base64');


const GITHUB_REPO = 'WillDev12/FlashBuddy';

// ── helpers ──────────────────────────────────
function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function shell(css, title = 'FlashBuddy') {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${esc(title)}</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="icon" type="image/png" href="data:image/png;base64,${FAVICON_B64}">
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

function releaseCard(label, release, assetFilter, assetSub) {
  const dlBtn = (href, btnLabel, sub, dl = true) =>
    `<a class="dl-btn" href="${esc(href)}"${dl ? ' download' : ''} target="_blank" rel="noopener">
      <span>${esc(btnLabel)}</span><span class="sub">${esc(sub)}</span></a>`;

  if (!release) {
    return `<div class="rel-card">
      <div class="label">${esc(label)}</div>
      <p class="no-release">No release published yet.</p>
    </div>`;
  }

  const { tag_name, published_at, body, html_url, assets } = release;
  const date  = new Date(published_at).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  const asset = assets.find(assetFilter);
  const link  = asset
    ? dlBtn(asset.browser_download_url, `Download ${tag_name}`, `${(asset.size/1024).toFixed(0)} KB · ${assetSub}`)
    : dlBtn(html_url, `Download ${tag_name}`, 'GitHub release page', false);
  const notes = body ? `<pre class="notes">${esc(body.trim())}</pre>` : '';

  return `<div class="rel-card">
    <div class="label">${esc(label)}</div>
    <h2>${esc(tag_name)}</h2>
    <div class="date">Released ${date}</div>
    ${link}
    ${notes}
  </div>`;
}

function downloadPage(appRelease, extRelease) {
  return shell(`
    h2{font-size:24px;font-weight:700;margin-bottom:4px}
    .label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#8891b0;margin-bottom:8px}
    .date{font-size:13px;color:#8891b0;margin-bottom:20px}
    .rel-card{background:#fff;border:1px solid #dde2f0;border-radius:14px;padding:32px;
              box-shadow:0 4px 20px rgba(0,0,0,.08);margin-bottom:20px}
    .dl-btn{display:flex;align-items:center;justify-content:space-between;padding:13px 18px;
            background:#1a1a2e;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;
            font-size:14px;margin-bottom:8px;transition:background .15s}
    .dl-btn:hover{background:#2d2d4e}
    .sub{font-size:12px;opacity:.55;font-family:monospace;font-weight:400;text-align:right;max-width:55%}
    .notes{font-size:12px;color:#555;background:#f7f8fc;border:1px solid #e4e8f4;border-radius:6px;
           padding:14px;margin-top:16px;white-space:pre-wrap;word-break:break-word;
           max-height:180px;overflow-y:auto;line-height:1.6}
    .no-release{font-size:13px;color:#8891b0;margin:0}
    .bottom-links{display:flex;justify-content:center;align-items:center;gap:1.5rem;margin-top:4px}
    .gh-link,.docs-link{font-size:13px;color:#8891b0;text-decoration:none}
    .gh-link:hover,.docs-link:hover{color:#555}
  `, 'FlashBuddy - Download') +
  releaseCard('FlashBuddy',        appRelease, a => a.name.endsWith('.html'), 'Standalone · no setup required') +
  releaseCard('FlashBuddy Extras', extRelease, a => a.name.endsWith('.zip'),  'Chrome extension · install manually') +
  `<div class="bottom-links">
    <a class="gh-link" href="https://github.com/${esc(GITHUB_REPO)}" target="_blank" rel="noopener">View on GitHub →</a>
    <a href="https://github.com/${esc(GITHUB_REPO)}" target="_blank" rel="noopener"><img src="https://img.shields.io/github/stars/${esc(GITHUB_REPO)}?style=social" alt="GitHub stars" style="vertical-align:middle"></a>
    <a class="docs-link" href="/docs">How to Use →</a>
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
  `, 'FlashBuddy Docs') + `
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
  `, 'FlashBuddy Docs') + `
  <a class="back" href="/docs">← Docs</a>
  <div class="card">${marked.parse(mdContent)}</div>` + shellEnd;
}

module.exports = { esc, shell, shellEnd, downloadPage, errorPage, docsIndexPage, docsPage };

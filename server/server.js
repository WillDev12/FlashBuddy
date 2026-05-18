const express = require('express');
const path    = require('path');
const fs      = require('fs');
const { esc, downloadPage, errorPage, docsIndexPage, docsPage } = require('./views');

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

app.get('/', (req, res) => res.redirect('/download'));

app.get('/download', async (req, res) => {
  try {
    const apiRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/releases?per_page=20`,
      { headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'FlashBuddy' } }
    );
    if (!apiRes.ok) return res.status(502).send(errorPage(`GitHub API returned ${apiRes.status}.`));
    const releases   = await apiRes.json();
    const appRelease = releases.find(r => /^v\d/.test(r.tag_name)) ?? null;
    const extRelease = releases.find(r => /^ext-v/.test(r.tag_name)) ?? null;
    if (!appRelease && !extRelease) return res.status(404).send(errorPage('No releases found.'));
    res.send(downloadPage(appRelease, extRelease));
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
  console.log(`FlashBuddy server listening on http://localhost:${PORT}`)
);

module.exports = app;

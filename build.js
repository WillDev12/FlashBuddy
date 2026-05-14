#!/usr/bin/env node
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');
const { minify: terser } = require('terser');

const SRC        = path.join(__dirname, 'src');
const SCRAPER    = path.join(__dirname, 'scraper');
const DIST       = path.join(__dirname, 'dist');
const { version: APP_VERSION } = require('./package.json');

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function minify(html) {
  return html
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_, open, css, close) =>
      open + minifyCss(css) + close)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .replace(/>\s+</g, '><')
    .trim();
}

function readDir(dir) {
  return fs.readdirSync(dir)
    .filter(f => !f.startsWith('.'))
    .sort()
    .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))
    .join('\n\n');
}

const FAVICON_B64 = fs.readFileSync(path.join(__dirname, 'scraper', 'favicon.png')).toString('base64');

async function buildHtml(scraperUrl) {
  const css = readDir(path.join(SRC, 'css'));
  let js    = readDir(path.join(SRC, 'js'));
  js = js
    .replace(/const APP_VERSION = .*;/, `const APP_VERSION = '${APP_VERSION}';`)
    .replace(
      /const SCRAPER_URL = .*;/,
      scraperUrl === null
        ? 'const SCRAPER_URL = null;'
        : `const SCRAPER_URL = '${scraperUrl}';`
    );
  const { code } = await terser(js, { compress: true, mangle: true });
  let out = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  out = out
    .replace('{{FAVICON_B64}}', FAVICON_B64)
    .replace('<!-- CSS -->', css)
    .replace('<!-- JS -->', code);
  return minify(out);
}

function zip(outPath, fn) {
  return new Promise((resolve, reject) => {
    const output  = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    fn(archive);
    archive.finalize();
  });
}

async function build() {
  const t = new Date().toLocaleTimeString();

  // ── Dev build (index.html) ──
  const devHtml = await buildHtml('http://localhost:3000');
  fs.writeFileSync(path.join(__dirname, 'index.html'), devHtml);
  console.log(`[${t}] Built → index.html (${(devHtml.length / 1024).toFixed(1)} KB)`);

  // ── Standalone ──
  const standaloneDir = path.join(DIST, 'standalone');
  fs.mkdirSync(standaloneDir, { recursive: true });
  const standaloneHtml = await buildHtml(null);
  const standaloneOut  = path.join(standaloneDir, 'FlashBuddy-standalone.html');
  fs.writeFileSync(standaloneOut, standaloneHtml);
  console.log(`[${t}] Built → dist/standalone/FlashBuddy-standalone.html (${(standaloneHtml.length / 1024).toFixed(1)} KB)`);

  // ── URL Import ──
  const scraperDir = path.join(DIST, 'url-import');
  fs.mkdirSync(scraperDir, { recursive: true });
  const scraperHtml = await buildHtml('http://localhost:3000');
  const zipOut      = path.join(scraperDir, 'FlashBuddy-url-import.zip');

  await zip(zipOut, archive => {
    // Main app
    archive.append(scraperHtml, { name: 'FlashBuddy.html' });
    // Start scripts and README at root (alongside FlashBuddy.html)
    for (const file of ['start.sh', 'start.bat', 'README.txt']) {
      const p = path.join(SCRAPER, file);
      if (fs.existsSync(p)) archive.file(p, { name: file });
    }
    // Scraper server files in ./scraper/
    for (const file of ['server.js', 'views.js', 'favicon.png', 'package.json']) {
      const p = path.join(SCRAPER, file);
      if (fs.existsSync(p)) archive.file(p, { name: `scraper/${file}` });
    }
  });

  const zipSize = (fs.statSync(zipOut).size / 1024).toFixed(1);
  console.log(`[${t}] Built → dist/url-import/FlashBuddy-url-import.zip (${zipSize} KB)`);
}

build().catch(e => { console.error('Build error:', e.message); process.exit(1); });

if (process.argv.includes('--watch')) {
  console.log('Watching src/ for changes…');
  fs.watch(SRC, { recursive: true }, (_, filename) => {
    if (filename && !filename.endsWith('~') && !filename.endsWith('.swp')) {
      console.log(`  changed: ${filename}`);
      build().catch(e => console.error('Build error:', e.message));
    }
  });
}

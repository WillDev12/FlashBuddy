#!/usr/bin/env node
const fs       = require('fs');
const path     = require('path');
const archiver = require('archiver');
const { minify: terser } = require('terser');

const SRC        = path.join(__dirname, 'src');
const SERVER     = path.join(__dirname, 'server');
const EXTENSION  = path.join(__dirname, 'extension');
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

const FAVICON_B64 = fs.readFileSync(path.join(SERVER, 'favicon.png')).toString('base64');

async function buildHtml() {
  const css = readDir(path.join(SRC, 'css'));
  let js    = readDir(path.join(SRC, 'js'));
  js = js.replace(/const APP_VERSION = .*;/, `const APP_VERSION = '${APP_VERSION}';`);
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
  const html = await buildHtml();
  fs.writeFileSync(path.join(__dirname, 'index.html'), html);
  console.log(`[${t}] Built → index.html (${(html.length / 1024).toFixed(1)} KB)`);

  // ── Standalone ──
  const standaloneDir = path.join(DIST, 'standalone');
  fs.mkdirSync(standaloneDir, { recursive: true });
  const standaloneOut = path.join(standaloneDir, 'FlashBuddy-standalone.html');
  fs.writeFileSync(standaloneOut, html);
  console.log(`[${t}] Built → dist/standalone/FlashBuddy-standalone.html (${(html.length / 1024).toFixed(1)} KB)`);

  // ── Extension zip ──
  const extDist = path.join(DIST, 'extension');
  fs.mkdirSync(extDist, { recursive: true });
  const extZip = path.join(extDist, 'FlashBuddy-extension.zip');
  await zip(extZip, archive => {
    archive.directory(EXTENSION, false);
    archive.file(path.join(SERVER, 'favicon.png'), { name: 'icon.png' });
  });
  const extSize = (fs.statSync(extZip).size / 1024).toFixed(1);
  console.log(`[${t}] Built → dist/extension/FlashBuddy-extension.zip (${extSize} KB)`);

  // ── Extension dev (unpacked) ──
  const extDev = path.join(EXTENSION, 'dev');
  fs.rmSync(extDev, { recursive: true, force: true });
  fs.mkdirSync(extDev, { recursive: true });
  for (const file of fs.readdirSync(EXTENSION).filter(f => f !== 'dev')) {
    fs.copyFileSync(path.join(EXTENSION, file), path.join(extDev, file));
  }
  fs.copyFileSync(path.join(SERVER, 'favicon.png'), path.join(extDev, 'icon.png'));
  console.log(`[${t}] Built → extension/dev/ (unpacked)`);
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

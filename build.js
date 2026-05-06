#!/usr/bin/env node
const fs   = require('fs');
const path = require('path');

const SRC = path.join(__dirname, 'src');
const OUT = path.join(__dirname, 'index.html');

function minify(html) {
  return html
    // Strip CSS block comments inside <style>
    .replace(/(<style[^>]*>)([\s\S]*?)(<\/style>)/g, (_, open, css, close) =>
      open + css.replace(/\/\*[\s\S]*?\*\//g, '') + close)
    // Strip HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Collapse runs of spaces/tabs to one space
    .replace(/[ \t]{2,}/g, ' ')
    // Drop blank lines
    .replace(/\n\s*\n+/g, '\n')
    // Remove whitespace between tags
    .replace(/>\s+</g, '><')
    .trim();
}

function build() {
  const read = dir =>
    fs.readdirSync(dir)
      .filter(f => !f.startsWith('.'))
      .sort()
      .map(f => fs.readFileSync(path.join(dir, f), 'utf8'))
      .join('\n\n');

  const css = read(path.join(SRC, 'css'));
  const js  = read(path.join(SRC, 'js'));

  let out = fs.readFileSync(path.join(SRC, 'template.html'), 'utf8');
  out = out.replace('<!-- CSS -->', css);
  out = out.replace('<!-- JS -->',  js);
  out = minify(out);

  fs.writeFileSync(OUT, out);
  console.log(`[${new Date().toLocaleTimeString()}] Built → index.html (${(out.length / 1024).toFixed(1)} KB)`);
}

build();

if (process.argv.includes('--watch')) {
  console.log('Watching src/ for changes…');
  fs.watch(SRC, { recursive: true }, (_, filename) => {
    if (filename && !filename.endsWith('~') && !filename.endsWith('.swp')) {
      console.log(`  changed: ${filename}`);
      try { build(); } catch (e) { console.error('Build error:', e.message); }
    }
  });
}

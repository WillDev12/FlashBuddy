# Contributing to FlashBuddy

## Development setup

```bash
git clone https://github.com/WillDev12/FlashBuddy.git
cd FlashBuddy
npm install
npm run watch   # rebuilds on every file change
```

Open `index.html` in a browser. The watch script rebuilds automatically — just refresh.

## Project structure

```
src/
  css/          # CSS files, concatenated in filename order
  js/           # JS files, concatenated in filename order
  template.html # HTML shell; <!-- CSS --> and <!-- JS --> are replaced at build time
build.js        # Build script — concatenates, minifies, inlines everything
```

The build output is a single self-contained `index.html` (and a copy at `dist/standalone/FlashBuddy-standalone.html`).

## Making changes

- **CSS**: edit the relevant file in `src/css/`. Variables are in `01-variables-base.css`.
- **JS**: edit the relevant file in `src/js/`. State lives in `01-state.js`.
- **HTML structure**: edit `src/template.html`.

## Submitting a pull request

1. Fork the repo and create a branch from `main`.
2. Make your changes and run `npm run build` to verify the build succeeds.
3. Open a pull request with a clear description of what changed and why.

## Releasing (maintainers only)

1. Bump `APP_VERSION` in `src/js/01-state.js` and `version` in `package.json`.
2. Update `CHANGELOG.md`.
3. Run `npm run build` to verify.
4. Push a tag (`git tag vX.Y.Z && git push origin vX.Y.Z`).
5. The release workflow attaches the standalone HTML automatically.

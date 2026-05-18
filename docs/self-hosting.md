# Self-Hosting FlashBuddy

The FlashBuddy download and docs pages are powered by a small Node.js/Express server (`server/`). The official instance runs at [flashbuddy.vercel.app](https://flashbuddy.vercel.app), but you can host your own copy on any platform that runs Node.js.

## Prerequisites

- [Node.js](https://nodejs.org) v18 or later
- [Git](https://git-scm.com)
- A GitHub fork of [WillDev12/FlashBuddy](https://github.com/WillDev12/FlashBuddy) (optional — only needed if you want the download page to list your own releases)

## Running Locally

1. Clone the repo:
   ```bash
   git clone https://github.com/WillDev12/FlashBuddy.git
   cd FlashBuddy
   ```

2. Install root dependencies (builds the app) and server dependencies:
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

3. Start the server:
   ```bash
   npm run server
   ```

4. Open `http://localhost:3000` in your browser.

To use a different port, set the `PORT` environment variable:

```bash
PORT=8080 npm run server
```

## Deploying to Vercel

Vercel is the easiest option — the repo already includes a `vercel.json`.

1. Install the Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. From the repo root, run:
   ```bash
   vercel
   ```

3. Follow the prompts. No environment variables are required — the server reads the GitHub API anonymously.

4. To deploy to production:
   ```bash
   vercel --prod
   ```

If you forked the repo and want the download page to show your own releases, update the `GITHUB_REPO` constant in `server/server.js` to point to your fork before deploying.

## Deploying to Railway

1. Create a new project at [railway.app](https://railway.app) and link your GitHub repo.
2. Set the **root directory** to `server/`.
3. Set the **start command** to `node server.js`.
4. Railway will assign a public URL automatically.

## Deploying to Render

1. Create a new **Web Service** at [render.com](https://render.com) and link your GitHub repo.
2. Set **Root Directory** to `server`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `node server.js`.
5. Choose the free instance type and deploy.

## Configuration

The server has no required environment variables. Optional settings:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Port the server listens on |

The `GITHUB_REPO` constant in `server/server.js` controls which GitHub repository the download page fetches releases from. Change it if you're hosting a fork.

## Routes

| Route | Description |
|-------|-------------|
| `/download` | Download page — fetches latest releases from GitHub and shows download links |
| `/docs` | Docs index — lists all `.md` files in the `docs/` folder |
| `/docs/:name` | Renders `docs/<name>.md` as an HTML page |

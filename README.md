# LibWatch

![LibWatch — dashboard showing tracked NPM packages and GitHub repositories](./assets/LibWatch.png)
![LibWatch — expandable detail panel with 30-day sparkline analytics](./assets/LibWatch2.png)

> Live deployment: **https://libwatch.vercel.app** | Latest release: [v2.0.0](https://github.com/Nierowheezy/LibWatch/releases/latest)

LibWatch is a library intelligence platform for software developers. It serves two audiences from a single codebase:

- **Humans** — a high-density monitoring dashboard that tracks release activity, last-updated dates, modification tags, and activity velocities across NPM packages and GitHub repositories.
- **AI agents** — a REST API (and planned MCP server) that delivers current library metadata and documentation to coding tools, so agents write code against real version data instead of stale training snapshots.

---

## Table of Contents

- [What LibWatch does](#what-libwatch-does)
- [Use cases](#use-cases)
- [Key features](#key-features)
- [Technology stack](#technology-stack)
- [Architecture](#architecture)
- [Folder structure](#folder-structure)
- [API reference](#api-reference)
- [Data and caching behavior](#data-and-caching-behavior)
- [Environment variables](#environment-variables)
- [Local development](#local-development)
- [Production build](#production-build)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [Changelog and releases](#changelog-and-releases)
- [License](#license)

---

## What LibWatch does

LibWatch pulls live data from two sources developers watch most:

1. **NPM packages** — latest version, last publish date, weekly download count, license, description, and repository size for any package on the npm registry.
2. **GitHub repositories** — latest commit message, author, commit timestamp, star count, fork count, open issues, license, and subscriber count for any public repository.

The dashboard refreshes automatically on a countdown-driven schedule, caches results for 30 seconds to stay polite to upstream APIs, and visualizes release and commit density with 30-day sparklines so you can spot activity velocity at a glance.

All tracked entries are stored in your browser's `localStorage`, so nothing is sent to a third-party database.

---

## Use cases

**Dependency health checks.** Before building on a library, check its last publish date. A package that hasn't been updated in 18 months signals risk — LibWatch makes that visible instantly.

**Activity velocity monitoring.** The 30-day sparklines show whether a project is accelerating, stable, or slowing down. Useful when deciding whether to adopt, upgrade, or migrate away from a dependency.

**Release watch.** Keep a pinned list of the frameworks and tools your project depends on. The auto-sync countdown polls them on your configured schedule, so you know the moment a new version ships.

**AI-agent context.** Live metadata plus full documentation are served to AI coding tools through a REST API and a native MCP tool server (`/api/mcp`). Tools like Cursor and Claude Code can resolve library names, fetch current documentation, and generate code against real version data instead of stale training snapshots.

**Open-source project monitoring.** Track your own repos or upstream projects you care about. Stars, forks, issues, and subscriber counts update on every sync cycle.

---

## Key features

- **High-contrast dark aesthetic** — deep-space slate palettes with dynamic accent colors (cyan, emerald, violet, orange, rose) providing distinctive visual feedback.
- **Micro-conversational transitions** — staggered layout entry animations.
- **Auto-sync countdown clock** — active, automated time dials that poll library versions and repository commit pacing continuously; pause and resume with a single click.
- **Resource inspector** — a monospace, YAML-formatted detail panel with **Metadata / Docs / Raw** tabs, inline markdown documentation, and direct endpoint querying.
- **In-panel documentation** — README and CHANGELOG content rendered inline (markdown support via `react-markdown`), fetched and cached upstream.
- **30-day sparkline analytics** — area curves visualizing release frequency and commit density over time.
- **Manual priority sort** — drag-and-drop handles to re-order tracked libraries and establish custom priorities.
- **Global keyboard hotkeys** — configurable in workspace settings: trigger a manual check (`S` by default) or focus the search form (`/` by default).
- **High-density table layout** — sortable columns with expandable lines for quick inspection.
- **Open REST API** — five public endpoints serve live metadata, documentation, and search results to any consumer, including AI coding tools.
- **MCP tool server** — a Model Context Protocol endpoint (`POST /api/mcp`) exposing `resolve-library-id` and `query-docs` for AI coding agents.

---

## Technology stack

| Layer     | Technology                                   |
| --------- | -------------------------------------------- |
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4   |
| Charts    | Recharts                                     |
| Animation | Motion (Framer Motion successor)             |
| Icons     | Lucide React                                 |
| Backend   | Node.js, Express 4                           |
| Hosting   | Vercel (serverless function + static output) |

---

## Architecture

LibWatch is a full-stack application served from a single Express server in two modes:

- **Development** — `server.ts` boots Vite middleware alongside the Express API, giving you HMR and the `/api/*` routes together on one port.
- **Production** — the frontend is pre-built by Vite and served statically, while the Express API runs as a serverless function (`api/index.ts`) on Vercel.

The Express app itself lives in `app.ts` (`createApp()`), which is shared by:

- `server.ts` — the local long-running server (adds the Vite dev middleware and `app.listen`).
- `api/index.ts` — the Vercel serverless wrapper (lazily builds the app once per instance and forwards each request).

Request flow:

```
Browser (React SPA)
      |
      v
https://libwatch.vercel.app/
      |
      +-- /  or  /assets/*  -------> Static files (Vite build output)
      +-- /api/npm-update          +--> Vercel serverless function
          /api/github-update               |
                                           v
                                   Upstream APIs
                           (registry.npmjs.org, api.npmjs.org,
                            api.github.com)
```

---

## Folder structure

```
.
+-- api/
|   +-- index.ts                 # Vercel serverless entry (wraps createApp)
+-- assets/                      # Screenshots used in this README
+-- dist/                        # Build output (generated)
+-- server/                      # Shared backend layer
|   +-- cache.ts                 # Generic in-memory cache helpers
|   +-- registry.ts              # Docs + library resolution (npm/GitHub)
|   +-- mcp.ts                   # MCP JSON-RPC handler (tools/list + tools/call)
+-- src/
|   +-- types.ts                 # TypeScript type declarations
|   +-- utils.ts                 # Date formatting & trend data generators
|   +-- main.tsx                 # React application entry
|   +-- App.tsx                  # Main coordinating React component
|   +-- components/
|       +-- theme.ts             # Visual accent/theme presets
|       +-- Tooltip.tsx          # Custom React Portal tooltip
|       +-- Header.tsx           # Title, countdown clock, sync control
|       +-- StatsOverview.tsx    # High-level dashboard stat cards
|       +-- AddLibraryForm.tsx   # Package/repo tracking selector + toasts
|       +-- SettingsDrawer.tsx   # Sliders, keybinds, tone chimes, accents
|       +-- LibraryTable.tsx     # Sortable columns, drag handles, sparklines
|       +-- SidebarInspector.tsx # Metadata/Docs/Raw resource inspector
+-- app.ts                       # Express app factory (API routes + static)
+-- server.ts                    # Local dev/prod server entry
+-- vercel.json                  # Vercel build & routing config
+-- BUILDPLAN.md                 # Project plan and build roadmap
+-- CONTRIBUTING.md              # Contribution guidelines
+-- CHANGELOG.md                 # Release history
+-- LICENSE                      # MIT License
+-- package.json
+-- tsconfig.json
+-- vite.config.ts
```

---

## API reference

### `GET /api/npm-update?package=<name>`

Fetches release metadata for an NPM package.

| Query param | Type   | Required | Description                  |
| ----------- | ------ | -------- | ---------------------------- |
| `package`   | string | yes      | NPM package name, e.g. `react` |

Example:

```bash
curl "https://libwatch.vercel.app/api/npm-update?package=express"
```

```json
{
  "name": "express",
  "type": "npm",
  "lastUpdated": "2026-08-15T20:58:49.104Z",
  "latestVersion": "5.2.1",
  "description": "Fast, unopinionated, minimalist web framework",
  "homepage": "https://expressjs.com/",
  "downloads": 71992983,
  "license": "MIT",
  "size": 12,
  "openIssues": 23,
  "stars": 511,
  "source": "live"
}
```

> Note: For NPM packages, `stars` and `openIssues` are hash-based estimates derived from the package name, not real GitHub values. They exist for visual parity in the dashboard and should not be treated as accurate metrics.

### `GET /api/github-update?repo=<owner/repo>`

Fetches release and commit metadata for a GitHub repository.

| Query param | Type   | Required | Description                          |
| ----------- | ------ | -------- | ------------------------------------ |
| `repo`      | string | yes      | Repository in `owner/repo` format    |

Example:

```bash
curl "https://libwatch.vercel.app/api/github-update?repo=vercel/next.js"
```

```json
{
  "name": "vercel/next.js",
  "type": "github",
  "lastUpdated": "2026-09-11T11:46:40Z",
  "commitMessage": "[ci] Show full logs under GitHub Actions debug logging (#98501)",
  "authorName": "Sebastian \"Sebbie\" Silbermann",
  "homepage": "https://github.com/vercel/next.js",
  "stars": 142234,
  "forks": 31905,
  "openIssues": 3340,
  "subscribers": 8678,
  "license": "MIT",
  "size": 1,
  "description": "The React Framework",
  "source": "live"
}
```

> The `size` field for GitHub repos is reported in KB by the GitHub API.

### `GET /api/library-docs?library=<name>`

Fetches documentation content (README and CHANGELOG) for a library. Accepts either an npm package name or a GitHub repository in `owner/repo` format. Content is cached for 5 minutes.

| Query param | Type   | Required | Description                                     |
| ----------- | ------ | -------- | ----------------------------------------------- |
| `library`   | string | yes      | npm package name or `owner/repo`                |

Example:

```bash
curl "https://libwatch.vercel.app/api/library-docs?library=express"
```

```json
{
  "library": "express",
  "version": "5.2.1",
  "readme": "# Express\n\nFast, unopinionated...",
  "changelog": "History\n=======\n\n2025-07-08, ...",
  "documentation": [
    { "type": "readme", "title": "README", "url": "https://expressjs.com/" },
    { "type": "changelog", "title": "CHANGELOG", "url": "https://github.com/expressjs/express" }
  ],
  "source": "npm",
  "fetchedAt": "2026-09-13T12:00:00Z"
}
```

When the npm registry entry omits its `readme` field, LibWatch falls back to the package's GitHub repository (`README.md`, `Readme.md`, `readme.md`, or `README.markdown`). Changelog discovery scans `CHANGELOG.md` and `History.md`.

### `GET /api/library-resolve?q=<query>&limit=<n>`

Searches for libraries matching a natural-language query, ranked across the npm registry and GitHub repositories. Results are cached for 60 seconds.

| Query param | Type   | Required | Description                         |
| ----------- | ------ | -------- | ----------------------------------- |
| `q`         | string | yes      | Natural-language search query       |
| `limit`     | number | no       | Max results (1-20, default 8)       |

Example:

```bash
curl "https://libwatch.vercel.app/api/library-resolve?q=react%20form%20validation"
```

```json
{
  "query": "react form validation",
  "limit": 3,
  "totalResults": 3,
  "results": [
    { "id": "react-hook-form", "name": "react-hook-form", "source": "npm", "description": "Performant forms with easy validation", "score": 0.95 },
    { "id": "formik", "name": "formik", "source": "npm", "description": "Build forms in React, without tears", "score": 0.87 }
  ]
}
```

### `POST /api/mcp` — MCP server (tool server)

LibWatch exposes a Model Context Protocol **tool server** over Streamable HTTP for AI coding agents (Cursor, Claude Code, Codex, etc.):

| Tool                  | Purpose                                                    |
| --------------------- | ---------------------------------------------------------- |
| `resolve-library-id`  | Resolves a natural-language query into ranked library IDs  |
| `query-docs`          | Fetches current README + CHANGELOG for a specific library  |

Configure an agent with the URL `https://libwatch.vercel.app/api/mcp`. Example (Claude Code / `~/.claude.json` or `.mcp.json`):

```json
{
  "mcpServers": {
    "libwatch": { "url": "https://libwatch.vercel.app/api/mcp" }
  }
}
```

The endpoint is a stateless JSON-RPC implementation (initialize / tools/list / tools/call / ping / notifications) that reuses the same shared registry layer as the REST API.

---

## Data and caching behavior

- **Metadata endpoints** (`/api/npm-update`, `/api/github-update`) cache in-memory for **30 seconds**.
- **Docs endpoint** (`/api/library-docs`) caches in-memory for **5 minutes**.
- **Search endpoint** (`/api/library-resolve`) caches in-memory for **60 seconds**.
- Responses include a `source` field: `"live"` when fetched fresh from upstream, `"cache"` when returned from the in-memory cache.
- The GitHub routes send a `User-Agent` header (required by GitHub) and automatically attach an auth token when `GITHUB_TOKEN` is set, which dramatically raises the API rate limit.

---

## Environment variables

| Variable       | Required | Default | Description                                                    |
| -------------- | -------- | ------- | -------------------------------------------------------------- |
| `PORT`         | no       | `3000`  | HTTP port for the local Express server                         |
| `NODE_ENV`     | no       | --      | `production` disables the Vite dev middleware                  |
| `GITHUB_TOKEN` | no       | --      | GitHub Personal Access Token; lifts the GitHub API rate limit  |

Create a `.env` file for local development:

```env
PORT=3000
NODE_ENV=development
# GITHUB_TOKEN=ghp_xxx
```

---

## Local development

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (Express + Vite with HMR)
npm run dev
# -> http://localhost:3000

# 3. Lint / type-check
npm run lint
```

## Production build

```bash
npm run build
npm start
```

`npm run build` internally runs:

```bash
vite build                                  # builds the React frontend -> dist/
esbuild server.ts --bundle --format=esm     # bundles the API server -> dist/server.mjs
```

---

## Deployment

### Vercel (recommended)

The repository ships with `vercel.json`, which:

- Builds both frontend and API (`npm run build`).
- Serves the Vite output in `dist/` as static assets.
- Routes `/api/*` to the Express serverless function.

Deploy with:

```bash
npm i -g vercel        # if needed
vercel login
vercel deploy --prod
```

On the Vercel Dashboard, add a `GITHUB_TOKEN` environment variable to the production environment to raise the GitHub API rate limit. Optionally connect the GitHub repository and enable **Auto Deploy** so every push to `main` ships automatically.

Live: **https://libwatch.vercel.app**

### Any Node host (self-hosted)

The app runs as a plain Node server, so it also works on Render, Railway, Fly.io, or any box with Node 20+:

```bash
npm install
npm run build
PORT=3000 NODE_ENV=production npm start
```

---

## Roadmap

### Shipped (v1.x + v2.0)

**v1.0 — Monitoring dashboard + REST metadata API**

- High-density monitoring dashboard for NPM packages and GitHub repositories.
- REST API serving live metadata (`/api/npm-update`, `/api/github-update`).
- 30-second in-memory caching with `source: live | cache` signaling.
- 30-day sparkline analytics, auto-sync countdown clock, drag-and-drop priority sorting, configurable keyboard hotkeys, YAML resource inspector.
- Browser `localStorage` persistence for tracked entries.
- Deployed on Vercel as a serverless function plus static frontend.

**v2.0 — Documentation + agent intelligence layer**

- **Documentation panel** — a "Docs" tab (plus a "Raw" JSON tab) in the resource inspector renders README and CHANGELOG content inline with markdown styling.
- **Documentation API** — `/api/library-docs` returns README/CHANGELOG for any npm package or GitHub repo; `/api/library-resolve` ranks libraries from a natural-language query.
- **MCP tool server** — `POST /api/mcp` exposes `resolve-library-id` and `query-docs` for AI coding agents (Cursor, Claude Code, Codex, Copilot, etc.). Serve current docs to agents so they code against real metadata, not stale training snapshots.

### Planned (v3.0 and beyond)

- **Official doc site integration.** For major frameworks (React, Next.js, Express, Vue, etc.), fetch and serve documentation from official sources — going beyond README files to cover API references and guides.
- **Deep search across tracked libraries.** Semantic search over every library's fetched documentation.
- **Team workspaces / shared tracking**, database persistence beyond `localStorage`, and webhook/email notifications for new releases.

For the detailed build plan, implementation phases, and file-level changes, see [BUILDPLAN.md](./BUILDPLAN.md).

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md) for setup instructions, code style guidelines, and the PR workflow.

---

## Changelog and releases

All notable changes are documented in [CHANGELOG.md](./CHANGELOG.md), and stable snapshots are published as [GitHub Releases](https://github.com/Nierowheezy/LibWatch/releases).

---

## License

[MIT](./LICENSE) -- Copyright (c) 2026 Nierowheezy (Olabode Olaniyi David)

Built for high-productivity library monitoring. All data is stored inside local browser storage (`localStorage`), guaranteeing immediate privacy.

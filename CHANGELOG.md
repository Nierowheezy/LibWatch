# Changelog

All notable changes to **LibWatch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2026-09-13

### Added

- **Documentation API**
  - `GET /api/library-docs?library=<name>` — returns the latest README and CHANGELOG for any npm package or GitHub repository (`owner/repo`), with upstream source links. Content is cached for five minutes.
  - `GET /api/library-resolve?q=<query>&limit=<n>` — resolves a natural-language query into ranked library matches across the npm registry and GitHub repositories (results cached for 60 seconds).
- **Documentation panel in the dashboard.** The resource inspector now has three tabs: Metadata (existing YAML-style detail view), Docs (inline markdown-rendered README + CHANGELOG), and Raw (exact JSON payload).
- **MCP server** at `POST /api/mcp` — a stateless Streamable-HTTP JSON-RPC endpoint exposing two tools for AI coding agents:
  - `resolve-library-id` — finds the right library from a natural-language query.
  - `query-docs` — fetches current documentation for a specific library.
  Compact JSON-RPC implementation (initialize / tools/list / tools/call / ping / notifications) with permissive CORS. Reuses the same shared registry layer as the REST API.
- Shared backend registry layer (`server/cache.ts`, `server/registry.ts`, `server/mcp.ts`) so REST routes and the MCP server stay in sync.

### Changed

- README fallback for npm packages: when the npm registry entry omits the `readme` field, LibWatch now fetches it from the package's GitHub repository (handles `README.md`, `Readme.md`, `readme.md`, and `README.markdown`).
- Changelog discovery now scans `CHANGELOG.md`, `CHANGELOG.MD`, `changelog.md`, and `History.md`.
- Frontend dependency additions: `react-markdown`, `remark-gfm`.
- In-memory cache helpers extracted into `server/cache.ts` and reused across all endpoints.

## [1.0.1] - 2026-09-11

### Added

- MIT License file.
- `CONTRIBUTING.md` — setup, code style, and PR workflow guidelines.
- `BUILDPLAN.md` — full project plan and build roadmap covering v1.0 through v2.0.
- Comprehensive README covering use cases, architecture, API reference, roadmap, and deployment guide.

### Changed

- `package.json`: corrected project name to `libwatch`, set version to `1.0.1`, added `license: "MIT"` field.

### Improved

- Added honest note to README API reference that NPM `stars` and `openIssues` are hash-based estimates.
- README now documents the planned v2.0 roadmap: documentation panel, documentation API, MCP server, and official doc site integration.

## [1.0.0] - 2026-09-11

### Added

- Initial public release of LibWatch.
- High-density monitoring dashboard for NPM packages and GitHub repositories.
- Express + React full-stack architecture (single shared app, `app.ts`).
- Serverless deployment on Vercel (`api/index.ts` + `vercel.json`), live at https://libwatch.vercel.app.
- `GET /api/npm-update?package=<name>` — latest version, last publish date, weekly downloads, license, description, and size for any NPM package.
- `GET /api/github-update?repo=<owner/repo>` — latest commit message/author/timestamp, stars, forks, open issues, subscribers, license, and size for any GitHub repo.
- 30-second in-memory response caching with `source: "live" | "cache"` signaling.
- Optional `GITHUB_TOKEN` support to lift the GitHub API rate limit.
- 30-day sparkline analytics for release/commit density.
- Auto-sync countdown clock with pause/resume controls.
- Manual priority sorting via drag-and-drop handles.
- Global keyboard hotkeys (`S` to check, `/` to search).
- Resource inspector panel with YAML-formatted details and direct endpoint querying.
- Local browser `localStorage` persistence for tracked entries.

### Changed

- `server.ts` refactored into a thin local entry point; the shared Express app now lives in `app.ts`.
- Production server bundle switched from CommonJS to ESM (`dist/server.mjs`) to fix `import.meta` support.
- `PORT` is now configurable via the `PORT` environment variable (default `3000`).

### Fixed

- Static frontend and `/api/*` routes now coexist correctly under Vercel routing.
- Removed a Vite/Rollup dependency from the serverless function bundle that caused runtime failures.
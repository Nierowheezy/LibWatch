# Changelog

All notable changes to **LibWatch** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
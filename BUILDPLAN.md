# LibWatch — Build Plan & Project Roadmap

This document captures the full scope of LibWatch: what exists today, what is planned, and how each phase builds toward the vision of a library intelligence platform serving both human developers and AI coding agents.

---

## Project vision

**LibWatch** is a library intelligence platform. It serves two audiences from a single codebase:

- **Humans** — a high-density monitoring dashboard that tracks release activity, last-updated dates, modification tags, and activity velocities across NPM packages and GitHub repositories.
- **AI agents** — a REST API and planned MCP server that delivers current library metadata and documentation to coding tools, so agents write code against real version data instead of stale training snapshots.

The long-term goal: any developer or AI tool should be able to resolve a library name, fetch its current documentation, and understand its health — all from one platform.

---

## Current status: v2.0 (shipped)

**Deployed at:** https://libwatch.vercel.app
**Live since:** September 2026

### What exists today

| Component | Status | Details |
|---|---|---|
| Dashboard (React SPA) | Shipped | High-density table with sortable columns, expandable detail rows, drag-and-drop priority handles |
| Auto-sync countdown clock | Shipped | Configurable timer with pause/resume toggle |
| 30-day sparkline analytics | Shipped | Recharts-based area curves for NPM download and GitHub commit activity |
| Resource inspector | Shipped | Monospace YAML panel with **Metadata / Docs / Raw** tabs |
| Documentation panel | Shipped | Inline markdown-rendered README + CHANGELOG (`react-markdown` + `remark-gfm`) |
| Global keyboard hotkeys | Shipped | Configurable: `S` for manual sync, `/` to focus search |
| NPM package tracking | Shipped | `/api/npm-update` — latest version, publish date, downloads, license, repo size, description |
| GitHub repository tracking | Shipped | `/api/github-update` — latest commit, author, stars, forks, open issues, subscribers, license |
| Documentation API | Shipped | `/api/library-docs` — README + CHANGELOG for npm packages or GitHub repos |
| Library resolution API | Shipped | `/api/library-resolve` — ranked search across npm and GitHub |
| MCP tool server | Shipped | `POST /api/mcp` — `resolve-library-id` + `query-docs` for AI coding agents |
| In-memory caching | Shipped | 30s metadata / 60s search / 5-min docs TTL, `source: live | cache` signaling |
| localStorage persistence | Shipped | All tracked entries stored in browser; no backend database |
| Vercel deployment | Shipped | Serverless API function + static frontend, auto-deploy from `main` |
| Configuration settings | Shipped | Accent colors, time scales, keybinds, volume sliders, tone chimes |
| Toast notifications | Shipped | Lightweight in-app event signals |

### Tech stack (v1.0)

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4 |
| Charts | Recharts |
| Animation | Motion (Framer Motion successor) |
| Icons | Lucide React |
| Backend | Node.js, Express 4 |
| Hosting | Vercel (serverless function + static output) |
| License | MIT |

### API endpoints

| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/npm-update` | GET | `package=<name>` | Release metadata for an NPM package |
| `/api/github-update` | GET | `repo=<owner/repo>` | Release + commit metadata for a GitHub repo |
| `/api/library-docs` | GET | `library=<name>` | README + CHANGELOG for an npm package or `owner/repo` |
| `/api/library-resolve` | GET | `q=<query>, limit=<n>` | Ranked library search across npm and GitHub |
| `/api/mcp` | POST | JSON-RPC | MCP tool server (`resolve-library-id`, `query-docs`) |

### Architecture (v2.0)

```
Browser (React SPA)   /   AI agents (MCP clients)
      |                          |
      v                          v
https://libwatch.vercel.app/    POST /api/mcp
      |
      +-- /  or  /assets/*  ----> Static files (Vite build output)
      +-- /api/npm-update      +--> Vercel serverless function
          /api/github-update  |
          /api/library-docs   |
          /api/library-resolve|
          /api/mcp             |
                               v
                       upstream feeds
         (registry.npmjs.org, api.npmjs.org, api.github.com,
          raw.githubusercontent.com)
```

- `app.ts` — Express app factory (`createApp()`), shared by local server and Vercel serverless.
- `server/cache.ts` — generic in-memory cache helpers (per-key TTL).
- `server/registry.ts` — shared docs + library-resolution logic (npm + GitHub), used by REST and MCP.
- `server/mcp.ts` — stateless Streamable-HTTP JSON-RPC handler for the MCP protocol.
- `server.ts` — Local dev/prod server entry. Adds Vite middleware in dev mode, calls `app.listen()`.
- `api/index.ts` — Vercel serverless entry point. Wraps `createApp()`, lazily builds once per instance.

### Project files (v2.0)

```
api/index.ts          Vercel serverless function entry
app.ts                Express app factory (shared)
server.ts             Local dev/prod server entry
server/cache.ts       In-memory cache helpers
server/registry.ts    Docs + resolution providers (npm/GitHub)
server/mcp.ts         MCP JSON-RPC handler
vercel.json           Vercel build + routing config
src/                  React frontend (components, types, utils)
src/components/       SidebarInspector (Metadata/Docs/Raw), LibraryTable, etc.
dist/                 Build output (generated)
```

### Known limitations (v2.0)

- **NPM stars/issues are estimates.** The npm registry does not expose star counts. LibWatch derives them from a hash of the package name for visual parity. They are not real GitHub metrics.
- **NPM downloads may be zero.** The stats endpoint can return stale zeros for some packages.
- **GitHub rate limits.** Without a `GITHUB_TOKEN`, the API rate limit is 60 req/hr per IP. With a token it rises to 5,000/hr.
- **Docs rely on README + CHANGELOG files.** Official framework doc sites (API references, guides) are not yet integrated.
- **MCP is stateless JSON-RPC over HTTP.** Streaming/SSE and resource/prompt capabilities are not exposed; the tools surface is the supported scope.
- **No persistent database.** All tracking data lives in browser `localStorage` only.

---

## Shipped: v2.0 — Documentation + Agent Intelligence Layer

The documentation layer that turns LibWatch into a platform serving both human developers and AI coding agents shipped in v2.0. Phases 1-3 below are **complete**.

### Phase 1: Documentation API — SHIPPED

#### `GET /api/library-docs?library=<name>&version=<version>`

Returns documentation content for a specific library (version param accepted, latest used by default).

**Response schema:**

```json
{
  "library": "react",
  "version": "19.1.0",
  "readme": "# React\n\nA JavaScript library for building user interfaces...",
  "changelog": "## 19.1.0\n\n...",
  "documentation": [
    { "type": "readme", "title": "README", "url": "https://..." },
    { "type": "changelog", "title": "CHANGELOG", "url": "https://..." }
  ],
  "source": "npm",
  "fetchedAt": "2026-09-11T12:00:00Z"
}
```

**Implementation notes:**
- NPM: fetch `https://registry.npmjs.org/<name>` — parse `readme` field + `dist-tags.latest` for version resolution. Falls back to the package's GitHub repo when the registry entry omits `readme`.
- GitHub: fetch `https://raw.githubusercontent.com/<owner>/<repo>/HEAD/README(.md|.markdown)` and `CHANGELOG.md` / `History.md`.
- Cache documentation content for 5 minutes (`DOCS_CACHE_TTL_MS = 300000`).
- Rate-limit awareness: GitHub raw content does not require auth for public repos but counts toward the same 5k/hr limit.

#### `GET /api/library-resolve?q=<query>&limit=<n>`

Searches for libraries matching a natural-language query.

**Response schema:**

```json
{
  "query": "react form validation",
  "results": [
    { "id": "react-hook-form", "name": "react-hook-form", "source": "npm", "description": "Performant forms with easy validation", "score": 0.95 },
    { "id": "formik", "name": "formik", "source": "npm", "description": "Build forms in React, without tears", "score": 0.87 }
  ],
  "totalResults": 2,
  "source": "npm"
}
```

**Implementation notes:**
- NPM: `https://registry.npmjs.org/-/v1/search?text=<query>&size=<limit>` (official search API).
- GitHub: `https://api.github.com/search/repositories?q=<query>&per_page=<limit>`.
- Merge and rank by relevance score.
- Cache search results for 60 seconds.

### Phase 2: Documentation Panel in Dashboard — SHIPPED

The resource inspector now has three tabs.

| File | Change |
|---|---|
| `src/components/SidebarInspector.tsx` | Tab bar: Metadata / Docs / Raw. Docs fetches `/api/library-docs` on tab open and renders markdown inline. |
| `src/types.ts` | Added `LibraryDocs`, `LibraryDocSource` types. |
| `package.json` | Added `react-markdown` + `remark-gfm`. |

**UX:**
- `Metadata` (default) — the existing YAML-format detail view.
- `Docs` — loading skeleton while fetching, then styled README + CHANGELOG with syntax-safe markdown rendering. Graceful empty state with upstream source links.
- `Raw` — exact JSON payload of the tracked library.
- Per-library docs are memoized client-side so switching back is instant.

### Phase 3: MCP Server — SHIPPED

An MCP-compatible server that exposes LibWatch's documentation capabilities as tools for AI coding agents.

**Endpoint:** `POST /api/mcp` (served from the existing `app.ts`; no separate function)

**MCP tools exposed:**

| Tool | Description | Input | Output |
|---|---|---|---|
| `resolve-library-id` | Finds the right library from a natural-language query | `{ query: string, limit?: number }` | `{ totalResults, results: [{ id, name, source, description, score }] }` |
| `query-docs` | Fetches current documentation for a specific library | `{ library: string }` | `{ readme, changelog, documentation[], source }` |

**Implementation notes:**
- Stateless Streamable-HTTP JSON-RPC (initialize / tools/list / tools/call / ping / notifications) — serverless-friendly, no long-lived sessions or SSE required.
- Reuses the same shared `server/registry.ts` layer as the REST API, so behavior stays in sync.
- Protocol versions `2024-11-05`, `2025-03-26`, `2025-06-18` are supported.
- Notification requests return HTTP 202 with no body; non-POST returns 405.

**Agent installation examples:**

```json
{
  "mcpServers": {
    "libwatch": { "url": "https://libwatch.vercel.app/api/mcp" }
  }
}
```

### Phase 4: Official Doc Site Integration — PLANNED (v3.0+)

For major frameworks, fetch and serve documentation beyond README files.

**Target libraries (initial list):**

- React: `react.dev` docs
- Next.js: `nextjs.org/docs`
- Express: `expressjs.com` guides
- Vue: `vuejs.org` docs
- Svelte: `svelte.dev` docs

**Approach:**
- Maintain a registry of known doc sources per library in a JSON file (`server/doc-sources.json`).
- For registered libraries, fetch structured documentation pages (not just README).
- Expose through both the REST API (`/api/library-docs`) and MCP server (`query-docs`).

**This is a long-term goal.** The README-only approach (Phases 1-2) covers the majority of the npm ecosystem. Official doc site integration adds depth for the most-used frameworks.

---

## Build phases summary

| Phase | Milestone | Effort | Status |
|---|---|---|---|
| v1.0 | Dashboard + REST API | Complete | Shipped |
| v2.0 Phase 1 | `/api/library-docs` + `/api/library-resolve` | Medium | Shipped |
| v2.0 Phase 2 | Documentation panel in dashboard | Medium | Shipped |
| v2.0 Phase 3 | MCP server | Medium | Shipped |
| v2.0 Phase 4 | Official doc site integration | Large | Planned (v3.0+) |
| v3.0 | Doc-site integration + deeper agent features | Large | Planned |

---

## Implementation details

### New files created (v2.0)

| File | Purpose |
|---|---|
| `server/cache.ts` | Generic in-memory cache helpers (per-key TTL) |
| `server/registry.ts` | Docs + library-resolution providers shared by REST and MCP |
| `server/mcp.ts` | Stateless Streamable-HTTP JSON-RPC handler for the MCP protocol |

### Files modified (v2.0)

| File | Changes |
|---|---|
| `app.ts` | Added `/api/library-docs`, `/api/library-resolve`, `POST /api/mcp` routes + permissive CORS middleware; refactored caching onto `server/cache.ts` |
| `src/components/SidebarInspector.tsx` | Added Metadata / Docs / Raw tabs with inline markdown rendering |
| `src/types.ts` | Added `LibraryDocs`, `LibraryDocSource` types |
| `package.json` | Added `react-markdown`, `remark-gfm`; version bumped to `2.0.0` |

### New dependencies (v2.0)

| Package | Purpose | Status |
|---|---|---|
| `@modelcontextprotocol/sdk` | MCP server implementation | Not used — stateless JSON-RPC implemented directly for serverless-friendliness |
| `react-markdown` | Client-side markdown rendering in docs tab | Added |
| `remark-gfm` | GitHub-flavored markdown support | Added |
| `rehype-highlight` | Syntax highlighting in code blocks | Not added (deferred; docs panel renders plain markdown) |

### Environment variable notes

- `DOCS_CACHE_TTL_MS` — documentation cache TTL (defaults to `300000` ms / 5 min).
- `MCP_ENABLED` — toggle for the MCP endpoint (not implemented; endpoint is always enabled).

---

## Long-term vision

| Goal | Status | Notes |
|---|---|---|
| Human-facing monitoring dashboard | Shipped (v1.0) | Core product |
| REST API for metadata | Shipped (v1.0) | Two endpoints |
| Documentation content API | Shipped (v2.0) | `/api/library-docs` |
| Library resolution API | Shipped (v2.0) | `/api/library-resolve` |
| Documentation panel in dashboard | Shipped (v2.0) | Metadata / Docs / Raw tabs |
| MCP server for AI agents | Shipped (v2.0) | `resolve-library-id`, `query-docs` |
| Official doc site integration | Planned (v3.0+) | Phase 4, long-term |
| Search across all tracked libraries | Not started | Future consideration |
| Team workspaces / shared tracking | Not started | Future consideration |
| Database persistence (beyond localStorage) | Not started | Future consideration |
| Webhook notifications for new releases | Not started | Future consideration |

---

## Version history

| Version | Date | Summary |
|---|---|---|
| v1.0.0 | 2026-09-11 | Initial release: dashboard + REST API |
| v1.0.1 | 2026-09-11 | Documentation, license, contributing guide, build plan |
| v2.0.0 | 2026-09-13 | Documentation API, docs panel, MCP server, library resolution |

---

*This document is the living source of truth for the LibWatch project plan. Update it as implementation progresses.*

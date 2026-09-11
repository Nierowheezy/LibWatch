# LibWatch — Build Plan & Project Roadmap

This document captures the full scope of LibWatch: what exists today, what is planned, and how each phase builds toward the vision of a library intelligence platform serving both human developers and AI coding agents.

---

## Project vision

**LibWatch** is a library intelligence platform. It serves two audiences from a single codebase:

- **Humans** — a high-density monitoring dashboard that tracks release activity, last-updated dates, modification tags, and activity velocities across NPM packages and GitHub repositories.
- **AI agents** — a REST API and planned MCP server that delivers current library metadata and documentation to coding tools, so agents write code against real version data instead of stale training snapshots.

The long-term goal: any developer or AI tool should be able to resolve a library name, fetch its current documentation, and understand its health — all from one platform.

---

## Current status: v1.0 (shipped)

**Deployed at:** https://libwatch.vercel.app
**Live since:** September 2026

### What exists today

| Component | Status | Details |
|---|---|---|
| Dashboard (React SPA) | Shipped | High-density table with sortable columns, expandable detail rows, drag-and-drop priority handles |
| Auto-sync countdown clock | Shipped | Configurable timer with pause/resume toggle |
| 30-day sparkline analytics | Shipped | Recharts-based area curves for NPM download and GitHub commit activity |
| Resource inspector | Shipped | Monospace YAML-format detail panel with documentation open triggers |
| Global keyboard hotkeys | Shipped | Configurable: `S` for manual sync, `/` to focus search |
| NPM package tracking | Shipped | `/api/npm-update` — latest version, publish date, downloads, license, repo size, description |
| GitHub repository tracking | Shipped | `/api/github-update` — latest commit, author, stars, forks, open issues, subscribers, license |
| In-memory caching | Shipped | 30-second TTL per endpoint, `source: live | cache` signaling |
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

### API endpoints (v1.0)

| Endpoint | Method | Query Params | Description |
|---|---|---|---|
| `/api/npm-update` | GET | `package=<name>` | Release metadata for an NPM package |
| `/api/github-update` | GET | `repo=<owner/repo>` | Release + commit metadata for a GitHub repo |

### Architecture (v1.0)

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

- `app.ts` — Express app factory (`createApp()`), shared by local server and Vercel serverless.
- `server.ts` — Local dev/prod server entry. Adds Vite middleware in dev mode, calls `app.listen()`.
- `api/index.ts` — Vercel serverless entry point. Wraps `createApp()`, lazily builds once per instance.

### Project files (v1.0)

```
api/index.ts          Vercel serverless function entry
app.ts                Express app factory (shared)
server.ts             Local dev/prod server entry
vercel.json           Vercel build + routing config
src/                  React frontend (components, types, utils)
src/components/       UI components: SidebarInspector, LibraryTable, etc.
dist/                 Build output (generated)
```

### Known limitations (v1.0)

- **NPM stars/issues are estimates.** The npm registry does not expose star counts. LibWatch derives them from a hash of the package name for visual parity. They are not real GitHub metrics.
- **NPM downloads may be zero.** The stats endpoint can return stale zeros for some packages.
- **GitHub rate limits.** Without a `GITHUB_TOKEN`, the API rate limit is 60 req/hr per IP. With a token it rises to 5,000/hr.
- **No documentation content.** The inspector shows metadata only — README, CHANGELOG, and API docs are not yet fetched.
- **No AI agent integration.** The API is human-facing JSON; there is no MCP server or structured documentation endpoint.
- **No persistent database.** All tracking data lives in browser `localStorage` only.

---

## Planned: v2.0 — Documentation + Agent Intelligence Layer

The next major release transforms LibWatch from a metadata dashboard into a documentation platform that serves both human developers and AI coding agents.

### Overview

| Feature | Audience | Status |
|---|---|---|
| Documentation panel in dashboard | Humans | Planned |
| `/api/library-docs` endpoint | Both | Planned |
| `/api/library-resolve` endpoint | Both | Planned |
| MCP server (2 tools) | AI agents | Planned |
| Official doc site integration | Both | Planned |

### Phase 1: Documentation API

Two new endpoints that add documentation content to LibWatch's API surface.

#### `GET /api/library-docs?library=<name>&version=<version>`

Returns documentation content for a specific library.

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
- NPM: fetch from `https://registry.npmjs.org/<name>` — parse `readme` field + dist-tags for version resolution.
- GitHub: fetch `https://raw.githubusercontent.com/<owner>/<repo>/main/README.md` and `CHANGELOG.md`.
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

### Phase 2: Documentation Panel in Dashboard

A new "Docs" tab in the SidebarInspector that renders documentation content inline.

**Changes to existing files:**

| File | Change |
|---|---|
| `src/components/SidebarInspector.tsx` | Add tab bar: Metadata / Docs / Raw. Fetch from `/api/library-docs` on tab switch. Render markdown as formatted HTML. |
| `src/App.tsx` | Add `docsData` state. Pass to SidebarInspector. |
| `src/types.ts` | Add `LibraryDocs`, `LibraryResolveResult` types. |
| `src/utils.ts` | Add `fetchLibraryDocs()`, `resolveLibrary()` utility functions. |

**New dependencies (if needed):**

- `marked` or `markdown-it` for server-side markdown rendering (if rendering in the API), or `react-markdown` for client-side rendering in the panel.

**UX:**
- Tabs: `Metadata` (default, current inspector) | `Docs` (new) | `Raw` (raw JSON).
- Docs tab shows a loading skeleton while fetching, then renders README with syntax highlighting.
- Falls back gracefully if docs are unavailable (shows "No documentation available" state).
- "Open in browser" link to the upstream README URL.

### Phase 3: MCP Server

An MCP-compatible server that exposes LibWatch's documentation capabilities as tools for AI coding agents.

**New file:** `api/mcp.ts` (Vercel serverless function at `/api/mcp`)

**MCP tools exposed:**

| Tool | Description | Input | Output |
|---|---|---|---|
| `resolve-library-id` | Finds the right library from a natural-language query | `{ query: string, limit?: number }` | `{ results: [{ id, name, source, description, score }] }` |
| `query-docs` | Fetches current documentation for a specific library | `{ library: string, version?: string, docTypes?: string[] }` | `{ readme, changelog, documentation[], source }` |

**Implementation notes:**
- Use the MCP TypeScript SDK (`@modelcontextprotocol/sdk`).
- HTTP transport (Streamable HTTP) so agents connect via URL, not local stdio.
- The MCP server reuses the same caching layer as the REST API (import from `app.ts` utilities).
- Deployed as a separate Vercel serverless function or as an additional route in the existing `app.ts`.

**Agent installation examples:**

```json
{
  "mcpServers": {
    "libwatch": {
      "url": "https://libwatch.vercel.app/api/mcp"
    }
  }
}
```

This lets tools like Cursor, Claude Code, Codex, and Copilot:
1. Resolve "what's the best React form library" → ranked results.
2. Fetch current docs for `react-hook-form` → README + CHANGELOG + examples.
3. Generate code against real version data instead of hallucinated APIs.

### Phase 4: Official Doc Site Integration

For major frameworks, fetch and serve documentation beyond README files.

**Target libraries (initial list):**

- React: `react.dev` docs
- Next.js: `nextjs.org/docs`
- Express: `expressjs.com` guides
- Vue: `vuejs.org` docs
- Svelte: `svelte.dev` docs

**Approach:**
- Maintain a registry of known doc sources per library in a JSON file (`src/doc-sources.json`).
- For registered libraries, fetch structured documentation pages (not just README).
- Expose through both the REST API (`/api/library-docs`) and MCP server (`query-docs`).

**This is a long-term goal.** The README-only approach (Phases 1-2) covers the majority of the npm ecosystem. Official doc site integration adds depth for the most-used frameworks.

---

## Build phases summary

| Phase | Milestone | Effort | Depends on |
|---|---|---|---|
| v1.0 | Dashboard + REST API | Complete | -- |
| v2.0 Phase 1 | `/api/library-docs` + `/api/library-resolve` | Medium | v1.0 (done) |
| v2.0 Phase 2 | Documentation panel in dashboard | Medium | Phase 1 |
| v2.0 Phase 3 | MCP server | Medium | Phase 1 |
| v2.0 Phase 4 | Official doc site integration | Large | Phases 1-2 |
| v2.0 | Documentation panel + MCP server release | Medium | Phases 1-3 |

---

## Implementation details

### New files to create (v2.0)

| File | Purpose |
|---|---|
| `api/mcp.ts` | MCP server entry point (Vercel serverless) |
| `src/doc-sources.json` | Registry of known doc sources per library |
| `src/types.ts` (update) | New types: `LibraryDocs`, `LibraryResolveResult`, `McpToolResult` |

### Files to modify (v2.0)

| File | Changes |
|---|---|
| `app.ts` | Add `/api/library-docs` and `/api/library-resolve` routes |
| `src/components/SidebarInspector.tsx` | Add Docs tab with markdown rendering |
| `src/App.tsx` | Add docs-related state management |
| `src/utils.ts` | Add documentation fetching utilities |
| `vercel.json` | Add route for `/api/mcp` if separate function |

### New dependencies (v2.0)

| Package | Purpose | Required? |
|---|---|---|
| `@modelcontextprotocol/sdk` | MCP server implementation | Yes (for Phase 3) |
| `react-markdown` | Client-side markdown rendering in docs tab | Yes (for Phase 2) |
| `remark-gfm` | GitHub-flavored markdown support | Optional |
| `rehype-highlight` | Syntax highlighting in code blocks | Optional |

### Environment variables (v2.0 additions)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DOCS_CACHE_TTL_MS` | no | `300000` (5 min) | Documentation cache TTL |
| `MCP_ENABLED` | no | `true` | Toggle MCP server endpoint |

---

## Long-term vision

| Goal | Status | Notes |
|---|---|---|
| Human-facing monitoring dashboard | Shipped (v1.0) | Core product |
| REST API for metadata | Shipped (v1.0) | Two endpoints |
| Documentation content API | Planned (v2.0) | Phase 1 |
| Documentation panel in dashboard | Planned (v2.0) | Phase 2 |
| MCP server for AI agents | Planned (v2.0) | Phase 3 |
| Official doc site integration | Planned (v2.0) | Phase 4, long-term |
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

---

*This document is the living source of truth for the LibWatch project plan. Update it as implementation progresses.*

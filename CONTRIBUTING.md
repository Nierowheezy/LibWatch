# Contributing to LibWatch

Thanks for your interest in contributing. LibWatch is an open-source library intelligence platform, and contributions of all kinds are welcome.

---

## Getting started

### Prerequisites

- Node.js 20+
- npm 9+

### Local development

```bash
# Clone the repository
git clone https://github.com/Nierowheezy/LibWatch.git
cd LibWatch

# Install dependencies
npm install

# Start the dev server (Express + Vite with HMR)
npm run dev
# → http://localhost:3000
```

The dev server runs both the React frontend (with hot reload) and the Express API on the same port. API requests to `/api/*` are proxied through the Vite dev server.

---

## Making changes

### Code style

- TypeScript throughout — no `any` types unless unavoidable.
- React functional components only (no class components).
- Tailwind CSS for styling — match the existing dark, terminal-aesthetic palette.
- Lucide React for icons — check existing components before adding new icon imports.
- Motion (Framer Motion) for animations — keep transitions subtle and staggered.

### Commit conventions

Use clear, descriptive commit messages. Prefix with a short scope when helpful:

```
feat: add library-docs API endpoint
fix: correct NPM download stat parsing
docs: update README roadmap section
chore: bump dependencies
```

### Branching

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feat/my-new-feature
   ```
2. Make your changes and commit.
3. Push to your fork and open a Pull Request against `main`.

---

## Linting and building

```bash
# Type-check
npm run lint

# Production build (Vite frontend + esbuild server bundle)
npm run build
```

Both must pass before opening a PR. The CI will catch regressions.

---

## Project structure overview

| Path | Purpose |
|---|---|
| `app.ts` | Express app factory — API routes + static serving. Shared by local server and Vercel serverless. |
| `server.ts` | Local dev/prod server entry. Adds Vite middleware in dev mode. |
| `api/index.ts` | Vercel serverless entry point. Wraps `createApp()`. |
| `server/cache.ts` | Generic in-memory cache helpers (per-key TTL). |
| `server/registry.ts` | Docs + library-resolution providers (npm + GitHub), shared by REST and MCP. |
| `server/mcp.ts` | Streamable-HTTP JSON-RPC handler for the MCP tool server. |
| `src/` | React frontend (components, types, utils). |
| `vercel.json` | Vercel build + routing config. |

If you're adding a new API route, add it in `app.ts` inside `createApp()`, and where it tabs into docs/search logic, extend `server/registry.ts`. If you're adding a new React component, place it in `src/components/`.

---

## Reporting bugs

Open an issue at [github.com/Nierowheezy/LibWatch/issues](https://github.com/Nierowheezy/LibWatch/issues) with:

- A clear title and description.
- Steps to reproduce.
- Expected vs actual behavior.
- Browser and OS details.

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).

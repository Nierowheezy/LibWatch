import { cacheGet, cacheSet } from "./cache.js";

export interface DocSource {
  type: string;
  title: string;
  url: string;
}

export interface LibraryDocs {
  library: string;
  version?: string;
  readme: string | null;
  changelog: string | null;
  documentation: DocSource[];
  source: "npm" | "github";
  fetchedAt: string;
}

export interface ResolveResult {
  id: string;
  name: string;
  source: "npm" | "github";
  description: string;
  score: number;
  version?: string;
}

const DOCS_CACHE_TTL_MS = 5 * 60 * 1000;
const RESOLVE_CACHE_TTL_MS = 60 * 1000;

const GH_RAW = "https://raw.githubusercontent.com";
const GH_API = "https://api.github.com";

function githubHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    "User-Agent": "LibraryUpdateTracker/1.0.0",
    Accept: "application/vnd.github.v3+json",
    ...extra,
  };
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `token ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

function isGitHubLibrary(library: string): boolean {
  return library.includes("/");
}

async function tryFetchText(url: string, headers: Record<string, string> = {}): Promise<string | null> {
  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    return text.length ? text : null;
  } catch {
    return null;
  }
}

function extractRepoSlug(repoUrl: string | null | undefined): string | null {
  if (!repoUrl) return null;
  const match = repoUrl.match(/github\.com[:/]([^/]+)\/([^/\s#]+)/i);
  if (!match) return null;
  return `${match[1]}/${match[2].replace(/\.git$/i, "")}`;
}

const CHANGELOG_CANDIDATES = ["CHANGELOG.md", "CHANGELOG.MD", "changelog.md", "History.md"];
const README_CANDIDATES = ["README.md", "Readme.md", "readme.md", "README.markdown"];

async function fetchFirstCandidate(base: string, candidates: string[], headers: Record<string, string>): Promise<string | null> {
  for (const file of candidates) {
    const text = await tryFetchText(`${base}/${file}`, headers);
    if (text) return text;
  }
  return null;
}

async function fetchNpmDocs(library: string): Promise<LibraryDocs> {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(library)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`NPM Registry responded with status ${res.status}`);
  const data = await res.json();

  const version = data["dist-tags"]?.latest || undefined;
  const slug = extractRepoSlug(data.repository?.url);
  const headers = githubHeaders();

  let readme =
    typeof data.readme === "string" && data.readme.trim()
      ? data.readme.trim()
      : null;

  // Fall back to the GitHub-hosted README when the registry entry omits one
  if (!readme && slug) {
    const [owner, repo] = slug.split("/");
    readme = await fetchFirstCandidate(`${GH_RAW}/${owner}/${repo}/HEAD`, README_CANDIDATES, headers);
  }

  const homepage =
    data.homepage ||
    data.links?.homepage ||
    `https://www.npmjs.com/package/${encodeURIComponent(library)}`;
  const documentation: DocSource[] = [
    { type: "readme", title: "README", url: homepage },
  ];

  let changelog: string | null = null;
  if (slug) {
    const [owner, repo] = slug.split("/");
    changelog = await fetchFirstCandidate(`${GH_RAW}/${owner}/${repo}/HEAD`, CHANGELOG_CANDIDATES, headers);
    documentation.push({ type: "changelog", title: "CHANGELOG", url: `https://github.com/${slug}` });
  }

  return { library, version, readme, changelog, documentation, source: "npm", fetchedAt: new Date().toISOString() };
}

async function fetchGitHubDocs(library: string): Promise<LibraryDocs> {
  const parts = library.includes("/") ? library.split("/") : [library, library];
  const [owner, repo] = parts;
  const headers = githubHeaders();

  const readme = await fetchFirstCandidate(`${GH_RAW}/${owner}/${repo}/HEAD`, README_CANDIDATES, headers);

  let changelog: string | null = null;
  changelog = await fetchFirstCandidate(`${GH_RAW}/${owner}/${repo}/HEAD`, CHANGELOG_CANDIDATES, headers);

  const githubUrl = `https://github.com/${owner}/${repo}`;
  const documentation: DocSource[] = [
    { type: "readme", title: "README", url: githubUrl },
    { type: "changelog", title: "CHANGELOG", url: `${githubUrl}/blob/HEAD/CHANGELOG.md` },
  ];

  return { library, readme, changelog, documentation, source: "github", fetchedAt: new Date().toISOString() };
}

export async function fetchLibraryDocs(library: string): Promise<LibraryDocs> {
  const key = `docs:${library}`;
  const cached = cacheGet<LibraryDocs>(key, DOCS_CACHE_TTL_MS);
  if (cached) return cached;
  const docs = isGitHubLibrary(library) ? await fetchGitHubDocs(library) : await fetchNpmDocs(library);
  cacheSet(key, docs);
  return docs;
}

export async function resolveLibrary(query: string, limit = 8): Promise<ResolveResult[]> {
  const q = query.trim();
  if (!q) return [];
  const lim = Math.max(1, Math.min(20, Math.floor(limit) || 8));

  const cacheKey = `resolve:${q}:${lim}`;
  const cached = cacheGet<ResolveResult[]>(cacheKey, RESOLVE_CACHE_TTL_MS);
  if (cached) return cached;

  const results: ResolveResult[] = [];

  // npm registry search
  try {
    const npmRes = await fetch(
      `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(q)}&size=${lim}`
    );
    if (npmRes.ok) {
      const data = await npmRes.json();
      for (const hit of data.objects || []) {
        const pkg = hit.package || {};
        results.push({
          id: pkg.name,
          name: pkg.name,
          source: "npm",
          description: pkg.description || "",
          score: hit.score?.final ?? 0,
          version: pkg.version,
        });
      }
    }
  } catch { /* non-fatal */ }

  // GitHub repository search
  try {
    const ghRes = await fetch(
      `${GH_API}/search/repositories?q=${encodeURIComponent(q)}&per_page=${lim}`,
      { headers: githubHeaders() }
    );
    if (ghRes.ok) {
      const data = await ghRes.json();
      for (const item of data.items || []) {
        results.push({
          id: item.full_name,
          name: item.full_name,
          source: "github",
          description: item.description || "",
          score: Math.min((item.stargazers_count ?? 0) / 25000, 1),
        });
      }
    }
  } catch { /* non-fatal */ }

  results.sort((a, b) => b.score - a.score);
  const final = results.slice(0, lim);
  cacheSet(cacheKey, final);
  return final;
}

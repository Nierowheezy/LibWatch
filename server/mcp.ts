import { fetchLibraryDocs, resolveLibrary } from "./registry.js";

interface McpResult {
  jsonrpc: "2.0";
  id: number | string | null;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

const SUPPORTED_PROTOCOL_VERSIONS = ["2024-11-05", "2025-03-26", "2025-06-18"];

const TOOLS = [
  {
    name: "resolve-library-id",
    description:
      "Finds the correct library from a natural-language query across the npm registry and GitHub repositories. Returns ranked matches with identifiers, ecosystems, descriptions, and scores.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Natural-language library search query, e.g. 'react form validation'",
        },
        limit: {
          type: "number",
          description: "Maximum number of results to return (1-20, default 8)",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "query-docs",
    description:
      "Fetches current documentation (README and CHANGELOG) for a specific library from npm or GitHub. Use the identifier returned by 'resolve-library-id'.",
    inputSchema: {
      type: "object",
      properties: {
        library: {
          type: "string",
          description:
            "NPM package name (e.g. 'react') or GitHub repository in owner/repo format (e.g. 'facebook/react')",
        },
      },
      required: ["library"],
    },
  },
];

function rpcResult(
  id: number | string | null,
  result: unknown
): McpResult {
  return { jsonrpc: "2.0", id, result };
}

function rpcError(
  id: number | string | null,
  code: number,
  message: string
): McpResult {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

function toolError(
  id: number | string | null,
  message: string
): McpResult {
  return rpcResult(id, {
    content: [{ type: "text", text: JSON.stringify({ error: message }) }],
    isError: true,
  });
}

export async function handleMcpJsonRpc(body: unknown): Promise<McpResult | null> {
  // JSON-RPC notifications (no id) — e.g. "notifications/initialized"
  if (body && typeof body === "object" && (body as any).id === undefined) {
    return null;
  }

  if (!body || typeof body !== "object" || (body as any).jsonrpc !== "2.0" || typeof (body as any).method !== "string") {
    return rpcError((body as any)?.id ?? null, -32600, "Invalid Request");
  }

  const { id, method, params } = body as {
    id?: number | string | null;
    method: string;
    params?: Record<string, unknown>;
  };

  switch (method) {
    case "initialize": {
      const requested = String((params?.protocolVersion as string) || "");
      const protocolVersion = SUPPORTED_PROTOCOL_VERSIONS.includes(requested)
        ? requested
        : "2025-06-18";
      return rpcResult(id ?? null, {
        protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: "libwatch-mcp", version: "2.0.0" },
      });
    }

    case "notifications/initialized":
    case "notifications/cancelled":
      return null;

    case "ping":
      return rpcResult(id ?? null, {});

    case "tools/list":
      return rpcResult(id ?? null, { tools: TOOLS });

    case "tools/call": {
      const toolName = params?.name as string;
      const args = (params?.arguments as Record<string, unknown>) ?? {};

      if (toolName === "resolve-library-id") {
        const results = await resolveLibrary(
          String(args.query ?? ""),
          Number(args.limit ?? 8)
        );
        return rpcResult(id ?? null, {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                { query: args.query, totalResults: results.length, results },
                null,
                2
              ),
            },
          ],
          isError: false,
        });
      }

      if (toolName === "query-docs") {
        const library = String(args.library ?? "");
        if (!library) return toolError(id ?? null, "library parameter is required");
        const docs = await fetchLibraryDocs(library);
        return rpcResult(id ?? null, {
          content: [{ type: "text", text: JSON.stringify(docs, null, 2) }],
          isError: false,
        });
      }

      return toolError(id ?? null, `Unknown tool: ${toolName}`);
    }

    default:
      return rpcError(id ?? null, -32601, `Method not found: ${method}`);
  }
}

import { NextResponse } from "next/server";

// Stateless JSON-RPC MCP endpoint. Challenges are kept only in each visitor's browser (localStorage), so the server
// has no list to expose: it lists no tools and rejects every tool call rather than inventing data.

type RpcRequest = { id?: number | string | null; method?: string; params?: { name?: string } };

class RpcError extends Error {
  constructor(readonly code: number, message: string) {
    super(message);
  }
}

export async function POST(request: Request) {
  let id: RpcRequest["id"] = null;
  try {
    const body = (await request.json()) as RpcRequest;
    id = body.id ?? null;
    let result: unknown;
    switch (body.method) {
      case "initialize":
        result = {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "Challenges", version: "1.0.0" },
        };
        break;
      case "tools/list":
        result = { tools: [] };
        break;
      case "tools/call":
        throw new RpcError(-32602, `Unknown tool: ${String(body.params?.name)}`);
      default:
        throw new RpcError(-32601, `Unknown method: ${String(body.method)}`);
    }
    return NextResponse.json({ jsonrpc: "2.0", id, result });
  } catch (error) {
    const code = error instanceof RpcError ? error.code : -32700;
    const message = error instanceof RpcError ? error.message : "Parse error";
    return NextResponse.json({ jsonrpc: "2.0", id, error: { code, message } }, { status: 400 });
  }
}

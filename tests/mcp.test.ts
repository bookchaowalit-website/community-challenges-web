import { describe, expect, it } from "vitest";
import { POST } from "@/app/api/mcp/route";

function rpc(body: unknown) {
  return POST(new Request("http://localhost/api/mcp", { method: "POST", body: JSON.stringify(body) }));
}

describe("MCP route", () => {
  it("echoes the JSON-RPC request id on initialize", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 7, method: "initialize" })).json();
    expect(body.id).toBe(7);
    expect(body.result.serverInfo.name).toBe("Challenges");
  });

  it("lists no tools: challenges live only in the visitor's browser", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: "a", method: "tools/list" })).json();
    expect(body).toEqual({ jsonrpc: "2.0", id: "a", result: { tools: [] } });
  });

  it("rejects any tool call instead of pretending to run it", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_data" } })).json();
    expect(body.error.code).toBe(-32602);
    expect(body.id).toBe(3);
    expect(body.result).toBeUndefined();
  });

  it("rejects an unknown method", async () => {
    const body = await (await rpc({ jsonrpc: "2.0", id: 4, method: "resources/list" })).json();
    expect(body.error.code).toBe(-32601);
  });

  it("answers a parse error for a body that is not JSON", async () => {
    const body = await (await POST(new Request("http://localhost/api/mcp", { method: "POST", body: "{" }))).json();
    expect(body.error.code).toBe(-32700);
    expect(body.id).toBeNull();
  });
});

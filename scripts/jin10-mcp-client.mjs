#!/usr/bin/env node

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// 自动加载 .env 文件
const __dirname = dirname(fileURLToPath(import.meta.url));
try {
  const envContent = readFileSync(resolve(__dirname, "..", ".env"), "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let value = trimmed.slice(eqIdx + 1).trim();
    // 去除引号包裹
    if ((value.startsWith("'") && value.endsWith("'")) || (value.startsWith('"') && value.endsWith('"'))) {
      value = value.slice(1, -1);
    }
    if (value && value !== "在此填写你的 Bearer Token") {
      process.env[key] = value;
    }
  }
} catch {
  // .env 文件不存在或读取失败，忽略
}

const DEFAULT_SERVER_URL = "https://mcp.jin10.com/mcp";
const DEFAULT_PROTOCOL_VERSION = "2025-11-25";

function parseArgs(argv) {
  const result = {
    action: "demo",
    serverUrl: process.env.JIN10_MCP_SERVER_URL || DEFAULT_SERVER_URL,
    token: process.env.JIN10_BEARER_TOKEN || "",
    protocolVersion: process.env.JIN10_MCP_PROTOCOL_VERSION || DEFAULT_PROTOCOL_VERSION,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--token") result.token = argv[++i] || "";
    else if (arg === "--server-url") result.serverUrl = argv[++i] || result.serverUrl;
    else if (arg === "--protocol-version") result.protocolVersion = argv[++i] || result.protocolVersion;
    else if (arg === "demo") result.action = "demo";
    else if (arg === "quote") {
      result.action = "quote";
      result.code = argv[++i];
    } else if (arg === "kline") {
      result.action = "kline";
      result.code = argv[++i];
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) result.count = Number(argv[++i]);
    } else if (arg === "flash") {
      result.action = "flash";
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) result.cursor = argv[++i];
    } else if (arg === "search-flash") {
      result.action = "search-flash";
      result.keyword = argv[++i];
    } else if (arg === "news") {
      result.action = "news";
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) result.cursor = argv[++i];
    } else if (arg === "search-news") {
      result.action = "search-news";
      result.keyword = argv[++i];
      if (argv[i + 1] && !argv[i + 1].startsWith("--")) result.cursor = argv[++i];
    } else if (arg === "article") {
      result.action = "article";
      result.id = argv[++i];
    } else if (arg === "calendar") {
      result.action = "calendar";
    } else if (arg === "codes") {
      result.action = "codes";
    }
  }

  return result;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function extractSseJson(text) {
  const lines = text.split(/\r?\n/);
  const payloads = [];
  let eventName = "";
  let dataLines = [];

  function flush() {
    if (!dataLines.length) return;
    const raw = dataLines.join("\n");
    payloads.push({
      event: eventName || "message",
      data: JSON.parse(raw),
    });
    eventName = "";
    dataLines = [];
  }

  for (const line of lines) {
    if (line === "") {
      flush();
      continue;
    }
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
  }
  flush();

  assert(payloads.length > 0, "未从 SSE 响应中解析到消息");
  return payloads;
}

class Jin10McpClient {
  constructor({ serverUrl, token, protocolVersion }) {
    this.serverUrl = serverUrl;
    this.token = token;
    this.protocolVersion = protocolVersion;
    this.sessionId = null;
    this.requestId = 0;
  }

  buildHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.token}`,
    };
    if (this.sessionId) headers["Mcp-Session-Id"] = this.sessionId;
    return headers;
  }

  nextId() {
    this.requestId += 1;
    return this.requestId;
  }

  async postRpc(body, { expectResponse = true } = {}) {
    let response;
    let lastError;

    for (let attempt = 1; attempt <= 2; attempt += 1) {
      try {
        response = await fetch(this.serverUrl, {
          method: "POST",
          headers: this.buildHeaders(),
          body: JSON.stringify(body),
        });
        lastError = null;
        break;
      } catch (error) {
        lastError = error;
        if (attempt === 2) throw error;
      }
    }

    if (!response) {
      throw lastError || new Error("请求失败");
    }

    const maybeSessionId = response.headers.get("mcp-session-id");
    if (maybeSessionId) this.sessionId = maybeSessionId;

    if (!expectResponse) {
      if (!response.ok && response.status !== 202) {
        throw new Error(`请求失败: HTTP ${response.status}`);
      }
      return null;
    }

    const text = await response.text();
    if (!response.ok) {
      throw new Error(`请求失败: HTTP ${response.status}\n${text}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/event-stream")) {
      throw new Error(`非预期响应类型: ${contentType}`);
    }

    const events = extractSseJson(text);
    const message = events.find((event) => event.event === "message");
    assert(message, "未收到 message 事件");

    const rpc = message.data;
    if (rpc.error) {
      throw new Error(`JSON-RPC 错误 ${rpc.error.code}: ${rpc.error.message}`);
    }
    return rpc.result;
  }

  async initialize() {
    return this.postRpc({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "initialize",
      params: {
        protocolVersion: this.protocolVersion,
        capabilities: {},
        clientInfo: {
          name: "jin10-mcp-client",
          version: "1.0.0",
        },
      },
    });
  }

  async notifyInitialized() {
    return this.postRpc(
      {
        jsonrpc: "2.0",
        method: "notifications/initialized",
        params: {},
      },
      { expectResponse: false },
    );
  }

  async listTools() {
    return this.postRpc({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "tools/list",
      params: {},
    });
  }

  async listResources() {
    return this.postRpc({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "resources/list",
      params: {},
    });
  }

  async readResource(uri) {
    return this.postRpc({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "resources/read",
      params: { uri },
    });
  }

  async callTool(name, args) {
    const result = await this.postRpc({
      jsonrpc: "2.0",
      id: this.nextId(),
      method: "tools/call",
      params: {
        name,
        arguments: args,
      },
    });

    if (result?.isError) {
      throw new Error(`工具业务错误: ${JSON.stringify(result.structuredContent || result.content || result)}`);
    }
    return result;
  }

  async connect() {
    const initializeResult = await this.initialize();
    await this.notifyInitialized();
    return initializeResult;
  }
}

function parseJsonText(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function pickPrimaryData(result) {
  if (result?.structuredContent !== undefined) return result.structuredContent;
  if (Array.isArray(result?.content)) {
    for (const item of result.content) {
      if (item.type === "text" && typeof item.text === "string") {
        const parsed = parseJsonText(item.text);
        if (parsed !== null) return parsed;
      }
    }
  }
  return result;
}

async function runAction(client, args) {
  switch (args.action) {
    case "quote":
      assert(args.code, "quote 需要提供 code");
      return pickPrimaryData(await client.callTool("get_quote", { code: args.code }));
    case "kline":
      assert(args.code, "kline 需要提供 code");
      return pickPrimaryData(
        await client.callTool(
          "get_kline",
          args.count ? { code: args.code, count: args.count } : { code: args.code },
        ),
      );
    case "flash":
      return pickPrimaryData(
        await client.callTool("list_flash", args.cursor ? { cursor: args.cursor } : {}),
      );
    case "search-flash":
      assert(args.keyword, "search-flash 需要提供 keyword");
      return pickPrimaryData(await client.callTool("search_flash", { keyword: args.keyword }));
    case "news":
      return pickPrimaryData(
        await client.callTool("list_news", args.cursor ? { cursor: args.cursor } : {}),
      );
    case "search-news":
      assert(args.keyword, "search-news 需要提供 keyword");
      return pickPrimaryData(
        await client.callTool(
          "search_news",
          args.cursor ? { keyword: args.keyword, cursor: args.cursor } : { keyword: args.keyword },
        ),
      );
    case "article":
      assert(args.id, "article 需要提供 id");
      return pickPrimaryData(await client.callTool("get_news", { id: args.id }));
    case "calendar":
      return pickPrimaryData(await client.callTool("list_calendar", {}));
    case "codes": {
      const resource = await client.readResource("quote://codes");
      const first = resource.contents?.[0];
      return parseJsonText(first?.text || "") || resource;
    }
    case "demo":
    default: {
      const initializeResult = await client.connect();
      const tools = await client.listTools();
      const resources = await client.listResources();
      const codes = await client.readResource("quote://codes");
      const quote = await client.callTool("get_quote", { code: "XAUUSD" });

      return {
        initialize: initializeResult,
        tools: {
          total: tools.tools?.length || 0,
          names: (tools.tools || []).map((tool) => tool.name),
        },
        resources: {
          total: resources.resources?.length || 0,
          uris: (resources.resources || []).map((resource) => resource.uri),
        },
        codes: parseJsonText(codes.contents?.[0]?.text || ""),
        quote: pickPrimaryData(quote),
      };
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  assert(args.token, "请通过 --token 或环境变量 JIN10_BEARER_TOKEN 提供 Bearer Token");

  const client = new Jin10McpClient(args);
  if (args.action !== "demo") {
    await client.connect();
  }

  const result = await runAction(client, args);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

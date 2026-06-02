# Jin10 MCP Client

[English](README.en.md) | [中文](README.md)

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) client for Jin10 financial data services, providing real-time quotes, K-line charts, flash news, article search, and economic calendar.

## Quick Start

### 1. Get a Token

Register at [Jin10](https://www.jin10.com/) and apply for an API Token in your account settings.

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and paste your Bearer Token
```

### 3. Run

```bash
# Connection test (initialize + discover capabilities + gold quote)
node scripts/jin10-mcp-client.mjs demo

# Query gold price
node scripts/jin10-mcp-client.mjs quote XAUUSD

# Search flash news
node scripts/jin10-mcp-client.mjs search-flash Fed
```

> The script loads `.env` automatically — no manual `export` needed.

## Supported Commands

| Command | Description | Example |
|---------|-------------|---------|
| `demo` | Connection test — shows init info, available tools, and gold quote | `node scripts/jin10-mcp-client.mjs demo` |
| `codes` | List all supported instrument codes | `node scripts/jin10-mcp-client.mjs codes` |
| `quote <code>` | Get real-time quote for an instrument | `node scripts/jin10-mcp-client.mjs quote XAUUSD` |
| `kline <code> [count]` | Get K-line data | `node scripts/jin10-mcp-client.mjs kline XAUUSD 5` |
| `flash [cursor]` | Fetch latest flash news stream (paginated) | `node scripts/jin10-mcp-client.mjs flash` |
| `search-flash <keyword>` | Search flash news by keyword | `node scripts/jin10-mcp-client.mjs search-flash gold` |
| `news [cursor]` | Fetch latest articles stream (paginated) | `node scripts/jin10-mcp-client.mjs news` |
| `search-news <keyword> [cursor]` | Search articles by keyword | `node scripts/jin10-mcp-client.mjs search-news Fed` |
| `article <id>` | Get article details by ID | `node scripts/jin10-mcp-client.mjs article 220830` |
| `calendar` | Get economic calendar | `node scripts/jin10-mcp-client.mjs calendar` |

## CLI Options

All commands support the following global flags:

| Flag | Description |
|------|-------------|
| `--token <token>` | Manually provide Bearer Token (overrides `.env`) |
| `--server-url <url>` | Custom MCP server URL |
| `--protocol-version <version>` | Custom MCP protocol version |

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `JIN10_BEARER_TOKEN` | Yes | Jin10 MCP service Bearer Token |
| `JIN10_MCP_SERVER_URL` | No | MCP server URL, default `https://mcp.jin10.com/mcp` |
| `JIN10_MCP_PROTOCOL_VERSION` | No | Protocol version, default `2025-11-25` |

## MCP Protocol Flow

1. `initialize` — Client handshake
2. `notifications/initialized` — Notify server that initialization is complete
3. `tools/list` — Discover available tools
4. `resources/list` — Discover available resources
5. `tools/call` — Call a specific tool (e.g. `get_quote`, `list_flash`)
6. `resources/read` — Read a resource (e.g. `quote://codes`)

## Pagination

Flash news and articles support cursor-based pagination:

```bash
# First page
node scripts/jin10-mcp-client.mjs flash

# Response includes next_cursor for the next page
node scripts/jin10-mcp-client.mjs flash <next_cursor>
```

## License

MIT

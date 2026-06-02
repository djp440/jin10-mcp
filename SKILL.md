---
name: jin10-mcp
description: 通过标准 MCP 流程接入金十财经数据服务，查询行情、K线、快讯、资讯与财经日历。Use when 用户提到金十、Jin10、财经数据、MCP、Bearer Token、行情报价、K线、快讯、资讯搜索、财经日历，或需要按 initialize/initialized/tools-list/resources-list/tools-call 的标准协议访问该服务。
---

# Jin10 MCP

## Quick Start

优先使用随 skill 附带的脚本：

```bash
export JIN10_BEARER_TOKEN='你的 Bearer Token'
node scripts/jin10-mcp-client.mjs demo
node scripts/jin10-mcp-client.mjs quote XAUUSD
node scripts/jin10-mcp-client.mjs search-news 美联储
```

默认服务地址：

- `https://mcp.jin10.com/mcp`

默认协议版本：

- `2025-11-25`

## Workflow

1. 先走标准 MCP 握手：`initialize` -> `notifications/initialized`
2. 再做能力发现：`tools/list` 和 `resources/list`
3. 查询品种前，优先读 `quote://codes` 确认 code
4. 调用工具时优先读取 `result.structuredContent`
5. `result.content` 只作为文本兜底，不作为主解析来源
6. 分页统一使用 `cursor`，并读取 `data.next_cursor` / `data.has_more`
7. 若返回 `isError=true`，按业务错误处理；若返回 JSON-RPC `error`，按协议错误处理

## Common Mappings

- 某个品种报价：`codes` -> `quote <code>`
- 某个品种最近 K 线：`codes` -> `kline <code> [count]`
- 最新快讯流：`flash [cursor]`
- 某主题快讯：`search-flash <keyword>`
- 最新资讯流：`news [cursor]`
- 某主题资讯：`search-news <keyword> [cursor]`
- 单篇文章详情：`article <id>`
- 财经日历：`calendar`

## Supported Commands

- `demo`
- `codes`
- `quote <code>`
- `kline <code> [count]`
- `flash [cursor]`
- `search-flash <keyword>`
- `news [cursor]`
- `search-news <keyword> [cursor]`
- `article <id>`
- `calendar`

更多例子见 [EXAMPLES.md](EXAMPLES.md)。

---
name: jin10-mcp
description: Agent Skill for Jin10 MCP. Use this skill when users need Jin10 financial market data via MCP, including quotes, K-line data, flash news, article search, and economic calendar. 通过标准 MCP 流程接入金十财经数据服务，查询行情、K线、快讯、资讯与财经日历。适用于用户提到金十、Jin10、财经数据、MCP、Bearer Token、行情报价、K线、快讯、资讯搜索或财经日历等场景。
license: MIT
language: zh-CN
keywords:
  - jin10
  - mcp
  - finance
  - market-data
  - trading
  - agent-skill
  - skillsmp
---

# Jin10 MCP

## What This Skill Does

该 Skill 提供基于 MCP（Model Context Protocol）的金十财经数据访问能力，包括：

- 实时报价（Quote）
- K线数据（Kline）
- 财经快讯（Flash News）
- 财经资讯搜索（News Search）
- 财经日历（Economic Calendar）
- MCP 标准协议工作流示例

适用于量化、交易、金融 Agent、研究助手等场景。

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

## Usage Guidance

推荐优先通过 MCP 标准能力发现流程访问服务，而不是硬编码工具名。

建议：

- 先调用 `tools/list`
- 再动态选择工具
- 优先解析 `structuredContent`
- 对分页接口统一处理 `cursor`

## Related Files

- `README.md` — 项目说明
- `EXAMPLES.md` — 使用示例
- `scripts/jin10-mcp-client.mjs` — MCP 客户端脚本

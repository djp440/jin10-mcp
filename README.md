# Jin10 MCP Client

[English](README.en.md) | [中文](README.md)

基于 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) 的金十财经数据客户端，提供行情报价、K线、快讯、资讯搜索和财经日历等能力。

## 快速开始

### 1. 获取 Token

前往 [金十数据](https://www.jin10.com/) 注册账号后，在个人中心申请 API Token。

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env，填入你的 Bearer Token
```

### 3. 运行

```bash
# 连接测试（初始化 + 能力发现 + 黄金报价）
node scripts/jin10-mcp-client.mjs demo

# 查询黄金报价
node scripts/jin10-mcp-client.mjs quote XAUUSD

# 搜索快讯
node scripts/jin10-mcp-client.mjs search-flash 美联储
```

> 脚本启动时会自动读取 `.env` 文件，无需手动 `export` 环境变量。

## 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `demo` | 连接测试，展示初始化信息、可用工具和黄金报价 | `node scripts/jin10-mcp-client.mjs demo` |
| `codes` | 列出所有支持的品种代码 | `node scripts/jin10-mcp-client.mjs codes` |
| `quote <code>` | 查询品种实时报价 | `node scripts/jin10-mcp-client.mjs quote XAUUSD` |
| `kline <code> [count]` | 查询 K 线数据 | `node scripts/jin10-mcp-client.mjs kline XAUUSD 5` |
| `flash [cursor]` | 获取最新快讯流（支持分页） | `node scripts/jin10-mcp-client.mjs flash` |
| `search-flash <keyword>` | 按关键词搜索快讯 | `node scripts/jin10-mcp-client.mjs search-flash 黄金` |
| `news [cursor]` | 获取最新资讯流（支持分页） | `node scripts/jin10-mcp-client.mjs news` |
| `search-news <keyword> [cursor]` | 按关键词搜索资讯 | `node scripts/jin10-mcp-client.mjs search-news 美联储` |
| `article <id>` | 获取单篇文章详情 | `node scripts/jin10-mcp-client.mjs article 220830` |
| `calendar` | 获取财经日历 | `node scripts/jin10-mcp-client.mjs calendar` |

## 命令行参数

所有命令均支持以下全局选项：

| 参数 | 说明 |
|------|------|
| `--token <token>` | 手动指定 Bearer Token（优先级高于 `.env`） |
| `--server-url <url>` | 自定义 MCP 服务地址 |
| `--protocol-version <version>` | 自定义 MCP 协议版本 |

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `JIN10_BEARER_TOKEN` | 是 | 金十 MCP 服务 Bearer Token |
| `JIN10_MCP_SERVER_URL` | 否 | MCP 服务地址，默认 `https://mcp.jin10.com/mcp` |
| `JIN10_MCP_PROTOCOL_VERSION` | 否 | 协议版本，默认 `2025-11-25` |

## MCP 协议流程

1. `initialize` — 客户端握手
2. `notifications/initialized` — 通知服务端初始化完成
3. `tools/list` — 获取可用工具列表
4. `resources/list` — 获取可用资源列表
5. `tools/call` — 调用具体工具（如 `get_quote`、`list_flash`）
6. `resources/read` — 读取资源（如 `quote://codes`）

## 分页

快讯和资讯接口支持游标分页：

```bash
# 第一页
node scripts/jin10-mcp-client.mjs flash

# 返回中包含 next_cursor，用于翻页
node scripts/jin10-mcp-client.mjs flash <next_cursor>
```

## 许可证

MIT

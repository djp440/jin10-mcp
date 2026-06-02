# Examples

## 读取支持的品种代码

```bash
export JIN10_BEARER_TOKEN='你的 Bearer Token'
node scripts/jin10-mcp-client.mjs codes
```

## 获取现货黄金报价

```bash
node scripts/jin10-mcp-client.mjs quote XAUUSD
```

## 获取最近 5 根分钟 K 线

```bash
node scripts/jin10-mcp-client.mjs kline XAUUSD 5
```

## 获取最新快讯第一页

```bash
node scripts/jin10-mcp-client.mjs flash
```

如果返回：

```json
{
  "data": {
    "next_cursor": "1779952529539",
    "has_more": true
  }
}
```

继续翻页：

```bash
node scripts/jin10-mcp-client.mjs flash 1779952529539
```

## 搜索黄金相关快讯

```bash
node scripts/jin10-mcp-client.mjs search-flash 黄金
```

## 搜索美联储相关文章

```bash
node scripts/jin10-mcp-client.mjs search-news 美联储
```

## 获取文章详情

```bash
node scripts/jin10-mcp-client.mjs article 220830
```

## 获取本周财经日历

```bash
node scripts/jin10-mcp-client.mjs calendar
```

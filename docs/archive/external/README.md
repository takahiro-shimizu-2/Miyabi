# External Context Directory

**Purpose**: コンテキストを外部から取り入れる必要がある際に使用するツール群とデータ格納場所

このディレクトリは、Miyabiシステムが外部のコンテキスト（ドキュメント、API、データソース等）を取り込むためのインターフェースを提供します。

---

## 📁 ディレクトリ構造

```
external/
├── README.md                      # このファイル
├── context-engineering-mcp/       # MCP Server for Context Engineering
├── docs/                          # 外部ドキュメント格納
├── data/                          # 外部データソース格納
├── tools/                         # 外部コンテキスト取得ツール
└── scripts/                       # 外部連携スクリプト
```

---

## 🔧 使用例

### 1. 外部ドキュメントの取り込み

**ユースケース**: API仕様書、技術ドキュメント、ビジネスレポート等を取り込む

```bash
# ドキュメントを格納
cp /path/to/external/docs/api-spec.yaml external/docs/

# Agent経由で参照
miyabi agent --type IssueAgent --context external/docs/api-spec.yaml
```

**対応形式**:
- Markdown (`.md`)
- YAML/JSON (`.yaml`, `.json`)
- PDF (`.pdf`)
- テキスト (`.txt`)

### 2. 外部データソースの統合

**ユースケース**: データベース、API、Webhook等からリアルタイムデータを取得

```typescript
// external/tools/api-fetcher.ts
import { ExternalContextTool } from '@miyabi/coding-agents';

const apiContext = await ExternalContextTool.fetch({
  source: 'https://api.example.com/data',
  type: 'rest-api',
  auth: process.env.API_KEY,
});

// Agentに渡す
await agent.execute(task, { externalContext: apiContext });
```

### 3. MCP Server経由のコンテキスト取得

**ユースケース**: Model Context Protocol (MCP) Serverから構造化されたコンテキストを取得

```bash
# MCP Server起動
cd external/context-engineering-mcp
npm start

# Claude Code経由でコンテキスト取得
# .claude/claude_desktop_config.json に設定済み
```

---

## 🛠️ ツール一覧

### 組み込みツール

| ツール名 | 説明 | 使用方法 |
|---------|------|---------|
| `ExternalContextTool` | 汎用外部コンテキスト取得 | TypeScript API |
| `DocumentLoader` | ドキュメントローダー | `external/docs/` 配下を自動検索 |
| `APIFetcher` | REST API呼び出し | URL + 認証情報を指定 |
| `WebhookReceiver` | Webhook受信 | ポート指定で起動 |

### カスタムツール

**ツール作成方法**:

```typescript
// external/tools/custom-fetcher.ts
import { ExternalContextTool } from '@miyabi/coding-agents';

export class CustomFetcher extends ExternalContextTool {
  async fetch(params: FetchParams): Promise<Context> {
    // カスタムロジック実装
    const data = await this.fetchFromSource(params.source);
    return this.parseContext(data);
  }
}
```

**登録**:

```typescript
// agents/coordinator/coordinator-agent.ts
import { CustomFetcher } from '../external/tools/custom-fetcher';

coordinator.registerExternalTool('custom-fetcher', new CustomFetcher());
```

---

## 🔗 統合ガイド

### Agent統合

**CoordinatorAgent**: 外部コンテキストを自動的に検出し、Task分解時に反映

```typescript
// CoordinatorAgent内部
const externalDocs = await this.loadExternalContext('docs/');
const enrichedTask = this.enrichWithContext(task, externalDocs);
```

**CodeGenAgent**: 外部APIスペックを参照してコード生成

```typescript
// CodeGenAgent内部
const apiSpec = await this.loadExternalContext('docs/api-spec.yaml');
const generatedCode = await this.generateWithSpec(apiSpec);
```

### MCP Server統合

**Context Engineering MCP** (`external/context-engineering-mcp/`):

- **機能**: Claude Codeから直接外部コンテキストを検索・取得
- **プロトコル**: Model Context Protocol (MCP)
- **設定**: `.claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "context-engineering": {
      "command": "node",
      "args": ["/Users/shunsuke/Dev/Autonomous-Operations/external/context-engineering-mcp/index.js"]
    }
  }
}
```

---

## 📊 データ格納規則

### 1. ドキュメント (`docs/`)

**命名規則**: `{category}-{name}.{ext}`

```
docs/
├── api-github-rest-spec.yaml         # GitHub REST API仕様
├── design-entity-relation-model.md   # Entity-Relationモデル
├── guide-label-system.md             # Label System Guide
└── report-market-analysis-2025.pdf   # 市場調査レポート
```

### 2. データ (`data/`)

**命名規則**: `{source}-{date}.{ext}`

```
data/
├── analytics-2025-10-14.json         # Google Analytics データ
├── github-issues-2025-10.csv         # GitHub Issues エクスポート
└── marketplace-usage-2025-q3.json    # Marketplace使用状況
```

### 3. スクリプト (`scripts/`)

**命名規則**: `{action}-{target}.ts`

```
scripts/
├── fetch-github-issues.ts            # GitHub Issues取得
├── sync-marketplace-data.ts          # Marketplace同期
└── export-analytics.ts               # Analytics エクスポート
```

---

## 🔐 セキュリティ

### 認証情報管理

**環境変数を使用** (`.env`):

```bash
# external/.env.example
EXTERNAL_API_KEY=xxx
EXTERNAL_DB_URL=postgresql://...
EXTERNAL_WEBHOOK_SECRET=yyy
```

**git管理対象外**:

```gitignore
# .gitignore
external/.env
external/data/*.csv
external/data/*.json
```

### アクセス制御

- 外部APIトークンは環境変数のみ
- データファイルは`.gitignore`で除外
- MCP Serverは`localhost`のみアクセス可

---

## 📚 関連ドキュメント

- **[ENTITY_RELATION_MODEL.md](../docs/ENTITY_RELATION_MODEL.md)** - Entity定義と関係性
- **[TEMPLATE_MASTER_INDEX.md](../docs/TEMPLATE_MASTER_INDEX.md)** - テンプレート統合
- **[AGENT_SDK_LABEL_INTEGRATION.md](../docs/AGENT_SDK_LABEL_INTEGRATION.md)** - Agent SDK連携
- **[Context Engineering MCP README](./context-engineering-mcp/README.md)** - MCP Server詳細

---

## 🚀 クイックスタート

### Step 1: ドキュメント配置

```bash
# 外部ドキュメントをコピー
cp /path/to/external-doc.md external/docs/
```

### Step 2: Agent実行時に参照

```bash
# CoordinatorAgentが自動的に検出
npm run agents:parallel:exec -- --issues=270 --external-context=external/docs/
```

### Step 3: カスタムツール作成（オプション）

```bash
# 新規ツール作成
npx tsx scripts/create-external-tool.ts --name custom-fetcher

# 生成されたファイルを編集
vim external/tools/custom-fetcher.ts
```

---

## 🔄 更新履歴

| 日付 | 変更内容 | 担当 |
|------|---------|------|
| 2025-10-14 | 初版作成 - ディレクトリ構造定義 | Claude Code |

---

**このディレクトリは、Miyabiシステムと外部世界の橋渡しとなる重要なインターフェースです。**

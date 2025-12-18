# 🎯 Miyabi Skills

Miyabiプロジェクトで使用可能なスキル集です。各スキルは特定のタスクを効率的に実行するためのベストプラクティスとガイドラインを提供します。

## 📚 スキル一覧

### 🔧 開発スキル

| スキル | 説明 | トリガー |
|--------|------|----------|
| [typescript-development](./typescript-development.md) | TypeScript開発のベストプラクティス | `typescript`, `ts`, `型` |
| [mcp-server-development](./mcp-server-development.md) | MCP Server開発ガイド | `mcp`, `server`, `tool` |
| [tdd-workflow](./tdd-workflow.md) | テスト駆動開発ワークフロー | `tdd`, `test`, `vitest` |
| [debugging](./debugging.md) | デバッグ・トラブルシューティング | `debug`, `error`, `fix` |

### 📝 ワークフロースキル

| スキル | 説明 | トリガー |
|--------|------|----------|
| [issue-driven-development](./issue-driven-development.md) | Issue駆動開発 | `issue`, `idd` |
| [git-workflow](./git-workflow.md) | Gitワークフロー・コンベンション | `git`, `branch`, `commit` |
| [code-review](./code-review.md) | コードレビューガイド | `review`, `pr` |
| [documentation](./documentation.md) | ドキュメント生成 | `docs`, `readme` |

### 🔒 品質・セキュリティスキル

| スキル | 説明 | トリガー |
|--------|------|----------|
| [security-audit](./security-audit.md) | セキュリティ監査 | `security`, `audit` |
| [performance](./performance.md) | パフォーマンス最適化 | `performance`, `optimize` |
| [ci-cd](./ci-cd.md) | CI/CDパイプライン | `ci`, `cd`, `deploy` |

### 💼 ビジネススキル

| スキル | 説明 | トリガー |
|--------|------|----------|
| [product-planning](./product-planning.md) | プロダクト企画 | `product`, `mvp` |
| [market-research](./market-research.md) | 市場調査 | `market`, `research` |
| [content-creation](./content-creation.md) | コンテンツ作成 | `content`, `blog`, `sns` |

## 🚀 使い方

### Claude Code内で使用

```bash
# スキルを参照して実行
claude "TypeScript開発のベストプラクティスに従ってAPIを実装して"

# 特定のスキルを明示的に使用
claude "TDDワークフローで新機能を実装して"
```

### Miyabi Agent連携

```bash
# つくるん (CodeGenAgent) + スキル
npx miyabi --agent codegen --skill typescript-development

# めだまん (ReviewAgent) + スキル
npx miyabi --agent review --skill code-review
```

## 📁 ディレクトリ構造

```
.claude/skills/
├── README.md                      # このファイル
├── typescript-development.md      # TypeScript開発
├── mcp-server-development.md      # MCP Server開発
├── tdd-workflow.md                # TDD
├── debugging.md                   # デバッグ
├── issue-driven-development.md    # Issue駆動開発
├── git-workflow.md                # Gitワークフロー
├── code-review.md                 # コードレビュー
├── documentation.md               # ドキュメント
├── security-audit.md              # セキュリティ
├── performance.md                 # パフォーマンス
├── ci-cd.md                       # CI/CD
├── product-planning.md            # プロダクト企画
├── market-research.md             # 市場調査
└── content-creation.md            # コンテンツ作成
```

## 🔗 関連リンク

- [Agentドキュメント](../agents/README.md)
- [コマンド一覧](../commands/)
- [フック一覧](../hooks/)

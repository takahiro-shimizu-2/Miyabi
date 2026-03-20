[![Built by 合同会社みやび](https://img.shields.io/badge/Built%20by-合同会社みやび-blue?style=flat-square&logo=github)](https://miyabi-ai.jp)

<div align="center">

# 🌸 Miyabi

[![npm version](https://img.shields.io/npm/v/miyabi.svg)](https://www.npmjs.com/package/miyabi)
[![MCP Bundle](https://img.shields.io/npm/v/miyabi-mcp-bundle.svg?label=mcp-bundle)](https://www.npmjs.com/package/miyabi-mcp-bundle)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](LICENSE)

### Issue を書く。コードが完成する。
*Write an Issue. Code is completed.*

```bash
npx miyabi
```

</div>

---

## 魔法の瞬間 / The Magic

```
📝 Issue を書く        →    🤖 AI が実装        →    ✅ PR が届く
   Write an Issue            AI implements            PR arrives
```

**10-15分で完了。** *Done in 10-15 minutes.*

---

## パッケージ / Packages

| Package | npm | Description |
|---------|-----|-------------|
| [miyabi](https://www.npmjs.com/package/miyabi) | [![npm](https://img.shields.io/npm/v/miyabi.svg)](https://www.npmjs.com/package/miyabi) | CLI - 22コマンドの自律型開発フレームワーク |
| [miyabi-mcp-bundle](https://www.npmjs.com/package/miyabi-mcp-bundle) | [![npm](https://img.shields.io/npm/v/miyabi-mcp-bundle.svg)](https://www.npmjs.com/package/miyabi-mcp-bundle) | MCP Server - 172+ tools for Claude Desktop/Code |
| @miyabi/agent-sdk | v0.1.0 | Agent SDK - 7つのCoding Agent TypeScript実装 |
| @agentic-os/core | v0.1.0 | Core - エージェントシステム基盤 |

### モノレポ構成 / Monorepo Structure

```
packages/
├── cli/                  # Miyabi CLI (npx miyabi)
├── mcp-bundle/           # MCP Server (172+ tools)
├── miyabi-agent-sdk/     # Agent SDK (7 Coding Agents)
├── core/                 # @agentic-os/core
├── coding-agents/        # Coding Agent implementations
├── business-agents/      # Business Agent definitions
├── shared-utils/         # Cross-package utilities
├── context-engineering/  # Context engineering tools
├── github-projects/      # GitHub Projects V2 integration
├── task-manager/         # Task management
├── doc-generator/        # Documentation generator
└── miyabi-web/           # Web dashboard
```

---

## 今すぐ試す / Quick Start

```bash
# CLI
npx miyabi

# ステータス確認
npx miyabi status --json
npx miyabi doctor --json

# 全自動サイクル
npx miyabi cycle          # Issue → 実装 → テスト → PR
npx miyabi auto           # Water Spider 全自動モード

# ショートカット
npx miyabi fix 123        # バグ修正 (Issue #123)
npx miyabi build 123      # 機能追加 (Issue #123)
npx miyabi ship           # 本番デプロイ

# リリース管理
npx miyabi release list   # リリース一覧
npx miyabi release announce  # X/Discord 自動通知

# MCP Server (Claude Desktop/Code)
npm install -g miyabi-mcp-bundle
```

---

## CLI コマンド一覧 / CLI Commands

### コアコマンド / Core Commands

| Command | Description |
|---------|-------------|
| `miyabi status` | プロジェクト状態確認 (Issue/PR/Agent) |
| `miyabi doctor` | システム診断 (git/node/npm/GitHub) |
| `miyabi health` | クイックヘルスチェック (バージョン/OS情報) |
| `miyabi init <name>` | 新規プロジェクト作成 (53ラベル + 26 Actions) |
| `miyabi install` | 既存プロジェクトにMiyabi追加 |
| `miyabi setup` | セットアップガイド (トークン/設定ファイル) |
| `miyabi onboard` | 初回オンボーディングウィザード |
| `miyabi auth` | GitHub OAuth 認証 (login/logout/status) |
| `miyabi config` | 設定管理 (get/set/list) |

### 開発コマンド / Development Commands

| Command | Description |
|---------|-------------|
| `miyabi agent` | エージェント実行 (coordinator/codegen/review/pr/deploy) |
| `miyabi run` | 統一実行 (codegen/review/deploy/full-cycle) |
| `miyabi fix <issue>` | バグ修正ショートカット |
| `miyabi build <issue>` | 機能追加ショートカット |
| `miyabi ship` | 本番デプロイショートカット |
| `miyabi auto` | Water Spider 全自動モード |
| `miyabi omega` | Omega 6段階パイプライン |
| `miyabi cycle` | Issue → 実装 → テスト → PR 全自動サイクル |
| `miyabi sprint` | スプリント計画 + Issue一括作成 |
| `miyabi pipeline` | コマンド合成 (pipe/AND/OR/parallel) |

### ツールコマンド / Tool Commands

| Command | Description |
|---------|-------------|
| `miyabi release` | リリース管理 + X/Discord 自動通知 |
| `miyabi voice` | 音声駆動モード (VoiceBox/Google Home) |
| `miyabi skills` | Agent Skill管理 (list/health/sync) |
| `miyabi todos` | TODO/FIXME 自動検出 → Issue化 |
| `miyabi dashboard` | ダッシュボード管理 |
| `miyabi docs` | ドキュメント自動生成 |

---

## エージェントシステム / Agent System

### Coding Agents (7)

| Agent | Role | Quality Gate |
|-------|------|-------------|
| **CoordinatorAgent** | タスク分解・DAG構築 | 統括 |
| **IssueAgent** | Issue分析・53ラベル自動分類 | 分析 |
| **CodeGenAgent** | コード生成 (Claude Sonnet 4) | 実行 |
| **ReviewAgent** | コード品質 (100点満点, 80点以上で通過) | 実行 |
| **TestAgent** | テスト実行・カバレッジ | 実行 |
| **PRAgent** | PR作成 (Conventional Commits) | 実行 |
| **DeploymentAgent** | CI/CD自動化 | 実行 |

### Business Agents (14)

マーケティング・セールス・コンテンツ・分析の14エージェント。

### 品質ゲート / Quality Gate

```
CodeGenAgent → ReviewAgent (スコア80+?) → [Yes] → PRAgent
                    ↓ [No]
              最大3回リトライ → 閾値未満なら人間にエスカレーション
```

---

## GitHub as Operating System

Miyabi は GitHub をOSとして活用します:

| GitHub Feature | OS Role |
|---------------|---------|
| **Issues** | タスクキュー |
| **Labels** | 状態マシン (53ラベル × 10カテゴリ) |
| **Projects V2** | カンバンボード / データレイヤー |
| **Actions** | 実行エンジン (24ワークフロー) |
| **Webhooks** | イベントバス |

### 状態フロー / State Flow

```
pending → analyzing → implementing → reviewing → done
```

---

## 主な機能 / Key Features

### Agent Skill Bus (110+ Skills)

Agent Skill Busと統合されたスキルベース拡張システム。
code-reviewer, test-generator, commit-helper等のスキルをバス経由で動的にロード・実行。

```bash
npx miyabi skills list    # 110+ スキル一覧
npx miyabi skills health  # ヘルススコア確認
```

### GNI (GitNexus Impact Analysis)

コード変更前に依存関係・テストカバレッジ・他パッケージへの波及を自動分析。

### X/Discord 自動通知

`miyabi release announce` でリリース情報をX (Twitter) API v2経由で自動投稿。

### 分散クラスター実行

最大6台のマシン (MacBook + Windows + Mac mini×3) でタスクを分散実行。
SSH/Tailscaleネットワーク経由でディスパッチ。

---

## 開発 / Development

```bash
# ルートレベル
npm test                  # vitest
npm run build             # TypeScript compile
npm run lint              # ESLint
npm run typecheck         # TypeScript type check
npm run verify:all        # lint + typecheck + test + security

# CLI パッケージ
cd packages/cli
npm run dev               # tsx (development)
npm run build             # tsc + fix-esm-imports
npm test                  # vitest

# MCP Bundle
cd packages/mcp-bundle
npm run dev               # tsx hot reload
npm test                  # vitest
```

---

## もっと詳しく / Learn More

- 📖 [CLI ドキュメント](./packages/cli/README.md)
- 🔧 [MCP Bundle ドキュメント](./packages/mcp-bundle/README.md)
- 🤖 [Agent SDK](./packages/miyabi-agent-sdk/README.md)
- 💬 [Discord コミュニティ](https://discord.gg/ZpY9sxfYNm)
- 🐛 [Issue 報告](https://github.com/ShunsukeHayashi/Miyabi/issues)
- 💖 [スポンサー](https://github.com/sponsors/ShunsukeHayashi)

---

## 必要なもの / Requirements

- Node.js 18+
- GitHub アカウント + `GITHUB_TOKEN`

---

## ライセンス / License

[Apache 2.0](LICENSE) - Copyright (c) 2025-2026 Shunsuke Hayashi / 合同会社みやび

---

<div align="center">
<sub>Powered by Claude AI | Built with Miyabi Agent Society</sub>
</div>

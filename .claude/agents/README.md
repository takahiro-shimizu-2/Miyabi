# Agent Documentation Structure

このディレクトリには、Miyabiプロジェクトで使用される各Agentの仕様書と実行プロンプトが格納されています。

## 🎮 キャラクター名システム

**小中学生でも分かる！親しみやすいAgent名**

全21個のAgentには、技術的な名前（CoordinatorAgent等）の代わりに、覚えやすいキャラクター名が付いています。

### キャラクター図鑑・ガイド

- **[AGENT_CHARACTERS.md](AGENT_CHARACTERS.md)** - 全21キャラの詳細図鑑（ポケモン図鑑風）
  - 各キャラの役割、できること、オフィスでの立ち位置
  - 会話形式の「実際の動き」セクション
  - 並列実行ルールの明示

- **[USAGE_GUIDE_SIMPLE.md](USAGE_GUIDE_SIMPLE.md)** - かんたん使い方ガイド
  - キャラクター早見表（4色分類）
  - 実際の使用例（3パターン）
  - FAQ（よくある質問）

- **[agent-name-mapping.json](agent-name-mapping.json)** - 技術名⇔キャラ名マッピング（JSON）
  - プログラムからの参照用
  - 色分けルール定義
  - 並列実行ルール

- **[PERFORMANCE_METRICS.md](PERFORMANCE_METRICS.md)** - パフォーマンス指標ドキュメント
  - 全21Agentのメトリクス定義
  - ベンチマーク基準値
  - SLA（Service Level Agreement）定義

### 色分けルール

| 色 | 意味 | キャラ数 | 並列実行 | 例 |
|---|------|---------|---------|---|
| 🔴 **リーダー** | 指示を出す、全体を見る | 2 | ❌ | しきるん, あきんどさん |
| 🟢 **実行役** | 実際に作業する、動く | 12 | ✅ | つくるん, めだまん, かくちゃん |
| 🔵 **分析役** | 調べる、考える | 5 | ✅ | みつけるん, しらべるん, かぞえるん |
| 🟡 **サポート役** | 手伝う、つなぐ | 3 | ⚠️ | まとめるん, はこぶん, つなぐん |

### 使用例

```
# 従来の方法（技術名）
「CoordinatorAgentでIssue #270を処理」

# 新方式（キャラクター名・推奨）
「しきるん で Issue #270 を処理」
「つくるん と めだまん を並列実行して」
```

**詳細**: [CHARACTER_NAMING_SYSTEM.md](../../docs/CHARACTER_NAMING_SYSTEM.md) - 完全実装レポート

---

## ディレクトリ構造

```
.claude/agents/
├── specs/                  # Agent仕様書（役割・権限・エスカレーション条件）
│   ├── coding/            # コーディング・開発運用系Agent（7個）
│   │   ├── README.md
│   │   ├── coordinator-agent.md
│   │   ├── codegen-agent.md
│   │   ├── review-agent.md
│   │   ├── deployment-agent.md
│   │   ├── pr-agent.md
│   │   ├── issue-agent.md
│   │   └── hooks-integration.md
│   │
│   └── business/          # ビジネス・経営戦略系Agent（14個）
│       ├── README.md
│       ├── ai-entrepreneur-agent.md
│       ├── product-concept-agent.md
│       ├── product-design-agent.md
│       ├── funnel-design-agent.md
│       ├── persona-agent.md
│       ├── self-analysis-agent.md
│       ├── market-research-agent.md
│       ├── marketing-agent.md
│       ├── content-creation-agent.md
│       ├── sns-strategy-agent.md
│       ├── youtube-agent.md
│       ├── sales-agent.md
│       ├── crm-agent.md
│       └── analytics-agent.md
│
└── prompts/               # Worktree実行プロンプト（Claude Code用）
    ├── coding/            # コーディング系プロンプト（6個）
    │   ├── README.md
    │   ├── coordinator-agent-prompt.md
    │   ├── codegen-agent-prompt.md
    │   ├── review-agent-prompt.md
    │   ├── deployment-agent-prompt.md
    │   ├── pr-agent-prompt.md
    │   └── issue-agent-prompt.md
    │
    └── business/          # ビジネス系プロンプト（将来追加予定）
        └── README.md
```

## Agent体系（全21個）

### 🔧 Coding Agents（7個）

**開発運用・自動化を担当するAgent群**

| Agent | 権限 | 役割 | 仕様書 | プロンプト |
|-------|------|------|--------|-----------|
| CoordinatorAgent | 🔴統括 | タスク統括・DAG構築 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| CodeGenAgent | 🔵実行 | AI駆動コード生成 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| ReviewAgent | 🔵実行 | コード品質判定 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| IssueAgent | 🟢分析 | Issue分析・Label管理 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| PRAgent | 🔵実行 | Pull Request作成 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| DeploymentAgent | 🔵実行 | CI/CDデプロイ自動化 | [specs/coding/](specs/coding/) | [prompts/coding/](prompts/coding/) |
| Hooks Integration | - | Agent実行Hook統合 | [specs/coding/](specs/coding/) | - |

### 💼 Business Agents（14個）

**ビジネス戦略・マーケティング・営業を担当するAgent群**

#### 🎯 戦略・企画系（6個）

| Agent | 権限 | 役割 | 仕様書 |
|-------|------|------|--------|
| AIEntrepreneurAgent | 🔴統括 | ビジネスプラン作成（8フェーズ） | [specs/business/](specs/business/) |
| ProductConceptAgent | 🔵実行 | MVP設計・プロダクトロードマップ | [specs/business/](specs/business/) |
| ProductDesignAgent | 🔵実行 | UI/UX設計・デザインシステム | [specs/business/](specs/business/) |
| FunnelDesignAgent | 🔵実行 | カスタマージャーニー・ファネル最適化 | [specs/business/](specs/business/) |
| PersonaAgent | 🟢分析 | ペルソナ作成・ユーザーインサイト | [specs/business/](specs/business/) |
| SelfAnalysisAgent | 🟢分析 | SWOT分析・キャリアプランニング | [specs/business/](specs/business/) |

#### 📢 マーケティング系（5個）

| Agent | 権限 | 役割 | 仕様書 |
|-------|------|------|--------|
| MarketResearchAgent | 🟢分析 | 市場調査・競合分析 | [specs/business/](specs/business/) |
| MarketingAgent | 🔵実行 | マーケティング施策立案 | [specs/business/](specs/business/) |
| ContentCreationAgent | 🔵実行 | ブログ・SNS・プレスリリース生成 | [specs/business/](specs/business/) |
| SNSStrategyAgent | 🔵実行 | SNS投稿計画・エンゲージメント最適化 | [specs/business/](specs/business/) |
| YouTubeAgent | 🔵実行 | 動画企画・台本作成・SEO最適化 | [specs/business/](specs/business/) |

#### 💼 営業・顧客管理系（3個）

| Agent | 権限 | 役割 | 仕様書 |
|-------|------|------|--------|
| SalesAgent | 🔵実行 | 営業戦略立案・リード管理 | [specs/business/](specs/business/) |
| CRMAgent | 🔵実行 | 顧客データ管理・LTV最大化 | [specs/business/](specs/business/) |
| AnalyticsAgent | 🟢分析 | データ分析・レポート生成 | [specs/business/](specs/business/) |

## ファイルの種類

### 1. Agent仕様書 (`specs/`)

各Agentの**アーキテクチャドキュメント**です。以下の情報を含みます：

- **役割**: Agentの責務範囲
- **権限レベル**: 🔴統括権限 / 🔵実行権限 / 🟢分析権限
- **エスカレーション条件**: どのような場合に誰にエスカレーションするか
- **成功条件**: 何をもって成功とするか
- **技術仕様**: 使用するアルゴリズム・API・モデル
- **メトリクス**: 実行時間・成功率などのKPI

#### 例: `specs/coding/codegen-agent.md`

```markdown
---
name: CodeGenAgent
description: AI駆動コード生成Agent - Claude Sonnet 4による自動コード生成
authority: 🔵実行権限
escalation: TechLead (アーキテクチャ問題時)
---

## 役割
GitHub Issueの内容を解析し、Claude Sonnet 4 APIを使用して必要なコード実装を自動生成します。

## 責任範囲
- Issue内容の理解と要件抽出
- TypeScriptコード自動生成（Strict mode準拠）
- ユニットテスト自動生成（Vitest）
...
```

### 2. 実行プロンプト (`prompts/`)

**Git Worktree内でClaude Codeが実行する際の具体的な手順書**です。以下の情報を含みます：

- **Task情報のテンプレート**: `{{TASK_ID}}`, `{{ISSUE_NUMBER}}` などの変数
- **実行手順**: ステップバイステップの作業手順
- **実装例**: 具体的なTypeScriptコード例
- **テスト作成手順**: Vitestテストの書き方
- **Success Criteria**: 完了条件のチェックリスト
- **トラブルシューティング**: よくある問題と解決方法
- **Output Format**: JSON形式の結果レポート

#### 例: `prompts/coding/codegen-agent-prompt.md`

```markdown
# CodeGenAgent Worktree Execution Prompt

あなたはWorktree内で実行されている**CodeGenAgent**です。
このWorktreeは`{{WORKTREE_PATH}}`に配置されており、`{{BRANCH_NAME}}`ブランチで作業しています。

## Task情報
- **Task ID**: {{TASK_ID}}
- **Issue Number**: {{ISSUE_NUMBER}}
...

## 実行手順

### 1. 要件分析（5分）
...

### 2. コード設計（10分）
...
```

## 使い分け

| ファイルタイプ | 対象読者 | 目的 | いつ読む？ |
|------------|---------|------|-----------|
| **specs/coding/** | 人間（開発者・アーキテクト） | コーディング系Agentの設計を理解する | アーキテクチャレビュー時 |
| **specs/business/** | 人間（経営者・PM・マーケター） | ビジネス系Agentの設計を理解する | ビジネス戦略立案時 |
| **prompts/coding/** | Claude Code（AI実行環境） | Worktree内で開発作業を実行する | Git Worktree並列実行時 |
| **prompts/business/** | Claude Code（AI実行環境） | Worktree内でビジネス分析を実行する | ビジネスAgent実行時（将来） |

## 権限レベル

| レベル | マーク | 説明 | 該当Agent |
|--------|--------|------|-----------|
| 統括権限 | 🔴 | タスク分解・Agent割り当て・リソース配分を決定可能 | CoordinatorAgent, AIEntrepreneurAgent |
| 実行権限 | 🔵 | 直接的な実装・デプロイ・PR作成・施策実行を可能 | CodeGen, Review, PR, Deployment, ProductDesign, Marketing, Content, SNS, YouTube, Sales, CRM |
| 分析権限 | 🟢 | Issue分析・Label付与・市場調査・データ分析を実行可能 | IssueAgent, MarketResearch, Persona, SelfAnalysis, Analytics |

## Worktree実行フロー

### Coding Agent実行フロー

```
┌─────────────────────────────────────────────────────────┐
│ 1. IssueAgent: Issue分析 → Label付与                      │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 2. CoordinatorAgent: Task分解 → DAG構築 → Worktree作成    │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┼──────┐
        │      │      │
        ▼      ▼      ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│ CodeGen  │ │ Review   │ │ Deploy   │
│ (並行)   │ │ (並行)   │ │ (順次)   │
└─────┬────┘ └─────┬────┘ └─────┬────┘
      │            │            │
      └────────────┼────────────┘
                   │
                   ▼
           ┌───────────────┐
           │ PRAgent: PR作成│
           └───────────────┘
```

### Business Agent実行フロー

```
┌─────────────────────────────────────────────────────────┐
│ AIEntrepreneurAgent: ビジネスプラン作成（8フェーズ）       │
│  1. 市場分析 → 2. 競合分析 → 3. 顧客分析 → 4. 価値提案    │
│  5. 収益モデル → 6. マーケティング → 7. チーム → 8. 資金  │
└──────────────┬──────────────────────────────────────────┘
               │
        ┌──────┼──────┬──────┐
        │      │      │      │
        ▼      ▼      ▼      ▼
  ┌─────────┐ ┌─────────┐ ┌─────────┐
  │ Product │ │ Market  │ │ Sales   │
  │ Design  │ │ Research│ │ Strategy│
  └────┬────┘ └────┬────┘ └────┬────┘
       │           │           │
       └───────────┼───────────┘
                   │
                   ▼
           ┌───────────────┐
           │ Content       │
           │ Creation      │
           └───────────────┘
```

## 実行コマンド例

### Coding Agent実行

```bash
# 単一Issue実行
npm run agents:parallel:exec -- --issues=270 --concurrency=2

# 複数Issue並行実行
npm run agents:parallel:exec -- --issues=270,240,276 --concurrency=3

# Worktree構成
.worktrees/
├── issue-270/  # CoordinatorAgent実行
├── issue-271/  # CodeGenAgent実行
└── issue-272/  # ReviewAgent実行
```

### Business Agent実行（将来）

```bash
# AIアントレプレナーAgent実行
npm run agents:entrepreneur -- --issue 2

# 特定フェーズのみ実行
npm run agents:entrepreneur -- --issue 2 --phase market-analysis

# 複数ビジネスAgent並行実行
npm run agents:parallel:exec -- --issues=2,3,4 --concurrency=2 --agent-category=business
```

## Agent Verification（検証スクリプト）

**すべてのAgent実装は、lint・typecheck・testの3つの検証をパスする必要があります。**

### 検証コマンド

```bash
# すべてのAgentを検証
npm run agents:verify

# 詳細出力モード
npm run agents:verify:verbose

# 最初のエラーで停止
npm run agents:verify:bail

# 特定のAgentのみ検証
npm run agents:verify -- --agent codegen
```

### 検証項目

| 検証項目 | コマンド | 説明 |
|---------|---------|------|
| **ESLint** | `npx eslint agents/**/*.ts` | コードスタイル・ベストプラクティスチェック |
| **TypeScript** | `npx tsc --noEmit` | 型安全性チェック |
| **Tests** | `npx vitest run` | ユニットテスト実行 |

### 検証結果の見方

```
📦 Verifying codegenAgent...
  🔍 Running ESLint on codegen...
  ✅ ESLint passed
  🔍 Running TypeScript type check...
  ✅ Type check passed
  🔍 Running tests for codegen...
  ✅ Tests passed

============================================================
📊 Agent Verification Summary

✅ PASS codegen  ✓ lint | ✓ type | ✓ test
✅ PASS review   ✓ lint | ✓ type | ✓ test
❌ FAIL deploy   ✓ lint | ✗ type | ✓ test
       └─ Type error: Property 'url' does not exist...

============================================================
Total: 2 passed, 1 failed
============================================================
```

### Auto-Loop Pattern（Nacho's Approach）

**OpenAI Dev Day で紹介されたNacho's Auto-Loopパターンを統合しています。**

#### 概要

Auto-Loopは、ReviewAgentと/reviewコマンドを組み合わせて、自動的に品質基準（閾値80点）に到達するまでコード改善を繰り返します。

#### 実行フロー

```
┌─────────────────────────────────────────────────────────┐
│ 1. CodeGenAgent: コード実装                              │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────────────────┐
│ 2. ReviewAgent: 品質チェック（100点満点）                 │
│    - ESLint + TypeScript + Security                      │
│    - スコア < 80点 → 不合格                               │
└──────────────┬──────────────────────────────────────────┘
               │
               ▼
         ┌─────────┐
         │ Score?  │
         └────┬────┘
              │
      ┌───────┼───────┐
      │               │
  [< 80]          [≥ 80]
      │               │
      ▼               ▼
┌──────────┐    ┌──────────┐
│ /review  │    │ PR作成   │
│ 改善要求 │    │ 完了     │
└────┬─────┘    └──────────┘
     │
     │ (Auto-Loop)
     └──────┐
            │
            ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CodeGenAgent: 修正実装                                │
└──────────────────────────────────────────────────────────┘
            │
            │ (最大3回まで繰り返し)
            │
            └─────→ 2. ReviewAgent へ戻る
```

#### /review コマンドとの統合

```bash
# インタラクティブレビュー（Claude Code内で実行）
/review

# 自動修正モード
/review --auto-fix

# 閾値変更（デフォルト: 80）
/review --threshold 90

# 最大反復回数（デフォルト: 3）
/review --max-iterations 5
```

#### 実装詳細

- **ReviewAgent**: `agents/review/review-agent.ts:215-227`
  - 並列実行（ESLint + TypeScript + Security）
  - 品質スコアリング（100点満点）
  - 80点以上で `quality:good` Label自動付与

- **/review コマンド**: `.claude/commands/review.md:208-227`
  - インタラクティブUX（continue/pls fix/skip）
  - Auto-fix Safety Rules
  - ReviewAgent統合コード

- **Snapshot Testing**: `tests/ReviewAgent.test.ts`
  - JSON構造検証（Vitest Snapshot）
  - 動的フィールド除外（timestamp, duration等）
  - Escalation Error Handling

#### 成功条件

✅ **Agentがパスすべき基準:**
- ESLint: 0 warnings, 0 errors
- TypeScript: 型エラーなし
- Tests: 全テストパス
- Quality Score: 80点以上

❌ **エスカレーション条件:**
- Critical Security Issues検出時
- 3回の反復でも80点に到達できない場合
- ビルドエラー・実行エラー発生時

#### 参照

- **OpenAI Dev Day**: Nacho's Auto-Loop Pattern, Feler's 7-hour Session, Daniel's Review Loop
- **Issue #98**: OpenAI Dev Day開発手法の統合実装
- **実装PR**: #98のPhase 1, 2, 3（Snapshot Testing, Plans.md, /review）

## 新しいAgentの追加

新しいAgentを追加する場合は、以下の2つのファイルを作成してください：

### 1. Agent仕様書

**場所**: `specs/coding/` または `specs/business/`

```markdown
---
name: YourAgent
description: Agent description
authority: 🔵実行権限
escalation: TechLead
---

## 役割
...

## 責任範囲
...

## 実行権限
...

## 成功条件
...

## エスカレーション条件
...
```

### 2. 実行プロンプト

**場所**: `prompts/coding/` または `prompts/business/`

```markdown
# YourAgent Worktree Execution Prompt

あなたはWorktree内で実行されている**YourAgent**です。

## Task情報
- **Task ID**: {{TASK_ID}}
...

## 実行手順

### 1. [フェーズ1]（推定時間）
...

## Success Criteria
✅ 完了条件のチェックリスト

## Output Format
```json
{
  "agentType": "YourAgent",
  "status": "completed",
  "result": {...}
}
```
```

## カテゴリー別ドキュメント

### Coding Agents
- **仕様書**: [specs/coding/README.md](specs/coding/README.md)
- **プロンプト**: [prompts/coding/README.md](prompts/coding/README.md)

### Business Agents
- **仕様書**: [specs/business/README.md](specs/business/README.md)
- **プロンプト**: [prompts/business/README.md](prompts/business/README.md)（将来追加予定）

## 参照

- [CLAUDE.md](../../CLAUDE.md) - プロジェクト全体の設定
- [PERFORMANCE_METRICS.md](PERFORMANCE_METRICS.md) - パフォーマンス指標・SLA定義
- [AGENT_OPERATIONS_MANUAL.md](../../docs/AGENT_OPERATIONS_MANUAL.md) - Agent運用マニュアル
- [LABEL_SYSTEM_GUIDE.md](../../docs/LABEL_SYSTEM_GUIDE.md) - 53ラベル体系
- [SAAS_BUSINESS_MODEL.md](../../docs/SAAS_BUSINESS_MODEL.md) - SaaS事業化戦略
- [MARKET_ANALYSIS_2025.md](../../docs/MARKET_ANALYSIS_2025.md) - 市場調査レポート

---

🤖 Agent Documentation - 21 Agents (Coding: 7 | Business: 14)

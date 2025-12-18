# Command Pipeline Guide

複数のClaude Codeコマンドをパイプライン形式で連鎖実行するためのガイドです。

## 目次

1. [概要](#概要)
2. [コマンド一覧](#コマンド一覧)
3. [コマンド依存グラフ](#コマンド依存グラフ)
4. [入出力定義](#入出力定義)
5. [パイプライン構文](#パイプライン構文)
6. [定義済みパイプライン](#定義済みパイプライン)
7. [エラーハンドリング](#エラーハンドリング)
8. [使用例](#使用例)

---

## 概要

### パイプラインとは

コマンドパイプラインは、複数のコマンドを連鎖的に実行し、前のコマンドの出力を次のコマンドの入力として渡す仕組みです。

```
/create-issue → /agent-run → /review → /deploy
```

### メリット

- **効率化**: 複数コマンドを1回の実行で連続処理
- **標準化**: ワークフローをテンプレート化
- **ミス削減**: 手動実行の介在を最小化
- **トレーサビリティ**: パイプライン全体のログを一元管理

---

## コマンド一覧

| コマンド | 説明 | カテゴリ |
|---------|------|---------|
| `/create-issue` | Issue作成 | 📥 入力 |
| `/agent-run` | Agent自動実行 | 🔄 処理 |
| `/review` | コードレビュー | 🔍 検証 |
| `/test` | テスト実行 | 🧪 検証 |
| `/security-scan` | セキュリティスキャン | 🔒 検証 |
| `/deploy` | デプロイ実行 | 🚀 出力 |
| `/verify` | システム検証 | ✅ 検証 |
| `/generate-docs` | ドキュメント生成 | 📝 出力 |
| `/miyabi-auto` | 自動化モード | 🤖 自動 |
| `/miyabi-todos` | TODO検出・Issue化 | 📋 管理 |

---

## コマンド依存グラフ

### 基本フロー

```mermaid
graph TD
    subgraph "📥 入力フェーズ"
        A[/create-issue]
        B[/miyabi-todos]
    end

    subgraph "🔄 処理フェーズ"
        C[/agent-run]
    end

    subgraph "🔍 検証フェーズ"
        D[/review]
        E[/test]
        F[/security-scan]
        G[/verify]
    end

    subgraph "🚀 出力フェーズ"
        H[/deploy]
        I[/generate-docs]
    end

    A --> C
    B --> C
    C --> D
    C --> E
    C --> F
    D --> H
    E --> H
    F --> H
    G --> H
    C --> I
    H --> G
```

### 詳細フロー（品質ゲート付き）

```mermaid
graph TD
    A[/create-issue] --> B[/agent-run]
    B --> C[/review]
    C --> D{Score ≥ 80?}
    D -->|Yes| E[/test]
    D -->|No| F[Fix Issues]
    F --> C
    E --> G{Tests Pass?}
    G -->|Yes| H[/security-scan]
    G -->|No| I[Fix Tests]
    I --> E
    H --> J{Vulnerabilities?}
    J -->|No| K[/deploy --staging]
    J -->|Yes| L[Fix Security]
    L --> H
    K --> M[/verify]
    M --> N{Health OK?}
    N -->|Yes| O[/deploy --production]
    N -->|No| P[/rollback]
```

---

## 入出力定義

### `/create-issue`

**入力**:
```typescript
interface CreateIssueInput {
  title: string;           // Issue タイトル
  type: IssueType;         // feature | bug | refactor | docs | performance | security | test
  requirements: string[];  // 要件リスト
  techStack?: string;      // 技術スタック（任意）
  constraints?: string;    // 制約事項（任意）
  autoExecute?: boolean;   // Agent自動実行フラグ
  priority?: Priority;     // high | medium | low
}
```

**出力**:
```typescript
interface CreateIssueOutput {
  issueNumber: number;     // 作成されたIssue番号
  issueUrl: string;        // Issue URL
  labels: string[];        // 付与されたラベル
}
```

### `/agent-run`

**入力**:
```typescript
interface AgentRunInput {
  issueNumber?: number;    // 単一Issue番号
  issueNumbers?: number[]; // 複数Issue番号
  concurrency?: number;    // 並行実行数（デフォルト: 2）
  dryRun?: boolean;        // ドライランフラグ
}
```

**出力**:
```typescript
interface AgentRunOutput {
  issueNumber: number;
  status: 'completed' | 'failed' | 'partial';
  prNumber?: number;       // 作成されたPR番号
  prUrl?: string;          // PR URL
  qualityScore?: number;   // 品質スコア（0-100）
  errors?: string[];       // エラーメッセージ
}
```

### `/review`

**入力**:
```typescript
interface ReviewInput {
  target?: string;         // レビュー対象（デフォルト: 現在のブランチ）
  threshold?: number;      // 合格閾値（デフォルト: 80）
  maxIterations?: number;  // 最大反復回数（デフォルト: 10）
  autoFix?: boolean;       // 自動修正フラグ
}
```

**出力**:
```typescript
interface ReviewOutput {
  score: number;           // 品質スコア（0-100）
  passed: boolean;         // 合格フラグ
  checks: {
    typeSafety: CheckResult;
    codeQuality: CheckResult;
    testCoverage: CheckResult;
    security: CheckResult;
    documentation: CheckResult;
    bestPractices: CheckResult;
  };
  suggestions: string[];   // 改善提案
  iterations: number;      // 実行回数
}
```

### `/test`

**入力**:
```typescript
interface TestInput {
  target?: string;         // テスト対象（デフォルト: 全テスト）
  coverage?: boolean;      // カバレッジ計測フラグ
  watch?: boolean;         // Watchモード
}
```

**出力**:
```typescript
interface TestOutput {
  passed: boolean;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  coverage?: {
    lines: number;
    branches: number;
    functions: number;
    statements: number;
  };
  failures?: TestFailure[];
}
```

### `/security-scan`

**入力**:
```typescript
interface SecurityScanInput {
  target?: string;         // スキャン対象
  severity?: Severity;     // 最小重要度フィルタ
}
```

**出力**:
```typescript
interface SecurityScanOutput {
  passed: boolean;
  vulnerabilities: Vulnerability[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}
```

### `/deploy`

**入力**:
```typescript
interface DeployInput {
  environment: 'staging' | 'production';
  skipTests?: boolean;     // テストスキップ（非推奨）
  force?: boolean;         // 強制デプロイ
}
```

**出力**:
```typescript
interface DeployOutput {
  success: boolean;
  environment: string;
  url: string;             // デプロイ先URL
  version: string;         // デプロイバージョン
  healthCheck: boolean;    // ヘルスチェック結果
  rollbackAvailable: boolean;
}
```

### `/verify`

**入力**:
```typescript
interface VerifyInput {
  checks?: string[];       // 実行するチェック項目
}
```

**出力**:
```typescript
interface VerifyOutput {
  passed: boolean;
  checks: {
    environment: CheckResult;
    dependencies: CheckResult;
    build: CheckResult;
    tests: CheckResult;
    types: CheckResult;
  };
}
```

---

## パイプライン構文

### 基本構文

```bash
# パイプ形式（順次実行）
/command1 | /command2 | /command3

# AND形式（前のコマンドが成功した場合のみ実行）
/command1 && /command2 && /command3

# OR形式（前のコマンドが失敗した場合に実行）
/command1 || /fallback

# 複合形式
/command1 && /command2 || /fallback
```

### パラメータ渡し

```bash
# 明示的パラメータ
/create-issue --title "Feature X" | /agent-run | /review --threshold 90

# コンテキスト自動引き継ぎ
/create-issue | /agent-run   # issueNumberが自動的に引き継がれる

# 出力参照
/agent-run --issue 123 | /review --target $PR_NUMBER
```

### 条件分岐

```bash
# 品質スコアによる分岐
/review | if $SCORE >= 80 then /deploy --staging else /fix-issues

# 簡略記法
/review && /deploy --staging || /notify-failure
```

### 並列実行

```bash
# 複数コマンド並列実行
/test & /security-scan & /review

# 並列実行後に結合
(/test & /security-scan) && /deploy
```

---

## 定義済みパイプライン

### `/full-cycle` - フルサイクル実行

Issue作成からデプロイまでの完全なサイクル。

```bash
# 定義
/full-cycle <issue-number> [--env staging|production]

# 展開後
/agent-run --issue <issue-number>
  && /review --threshold 80
  && /test --coverage
  && /security-scan
  && /deploy --<env>
  && /verify
```

### `/quick-deploy` - クイックデプロイ

テスト済みコードの迅速なデプロイ。

```bash
# 定義
/quick-deploy [--env staging|production]

# 展開後
/verify && /deploy --<env>
```

### `/quality-gate` - 品質ゲート

PR前の品質チェック。

```bash
# 定義
/quality-gate

# 展開後
/review && /test --coverage && /security-scan
```

### `/auto-fix` - 自動修正サイクル

品質基準を満たすまで自動修正を繰り返す。

```bash
# 定義
/auto-fix [--max-iterations 5]

# 展開後（疑似コード）
while score < 80 && iterations < max:
  /review --auto-fix
  iterations++
```

---

## エラーハンドリング

### エラータイプ

| エラーコード | 説明 | 回復可能 |
|-------------|------|---------|
| `PIPELINE_PARSE_ERROR` | パイプライン構文エラー | Yes |
| `COMMAND_NOT_FOUND` | 不明なコマンド | Yes |
| `DEPENDENCY_FAILED` | 依存コマンド失敗 | Partial |
| `QUALITY_GATE_FAILED` | 品質基準未達 | Yes |
| `DEPLOYMENT_FAILED` | デプロイ失敗 | Yes |
| `TIMEOUT` | タイムアウト | Yes |
| `FATAL_ERROR` | 致命的エラー | No |

### リトライポリシー

```typescript
interface RetryPolicy {
  maxRetries: number;      // 最大リトライ回数（デフォルト: 3）
  backoff: 'linear' | 'exponential';  // バックオフ戦略
  initialDelay: number;    // 初期遅延（ms）
  maxDelay: number;        // 最大遅延（ms）
  retryableErrors: string[];  // リトライ可能なエラーコード
}
```

### ロールバック

```bash
# デプロイ失敗時の自動ロールバック
/deploy --staging || /rollback

# 手動ロールバック
/rollback --version <previous-version>
```

### 中断と再開

```bash
# パイプライン中断
Ctrl+C または /pipeline:abort

# 中断点から再開
/pipeline:resume --checkpoint <checkpoint-id>

# チェックポイント一覧
/pipeline:checkpoints
```

---

## 使用例

### 例1: 新機能開発サイクル

```bash
# Issue作成から本番デプロイまで
/create-issue --title "ユーザー認証機能" --type feature \
  | /agent-run \
  | /review --threshold 85 \
  | /test --coverage \
  | /security-scan \
  | /deploy --staging \
  | /verify \
  && /deploy --production
```

### 例2: バグ修正の迅速対応

```bash
# 既存Issueの修正とデプロイ
/agent-run --issue 123 \
  && /review --auto-fix \
  && /quick-deploy --env staging
```

### 例3: PR前品質チェック

```bash
# マージ前の品質ゲート
/quality-gate && echo "Ready for PR" || echo "Fix required"
```

### 例4: 複数Issue一括処理

```bash
# 3つのIssueを並行処理
/agent-run --issues 123,124,125 --concurrency 3 \
  | /review \
  | /test
```

### 例5: 自動修正ループ

```bash
# 品質スコア80点以上になるまで自動修正
/auto-fix --max-iterations 5
```

---

## コマンドペア互換性マトリクス

パイプライン接続可能なコマンドペアの一覧。

| 前コマンド | 後コマンド | 互換性 | 備考 |
|-----------|-----------|--------|------|
| `/create-issue` | `/agent-run` | ✅ | issueNumber引き継ぎ |
| `/agent-run` | `/review` | ✅ | prNumber引き継ぎ |
| `/agent-run` | `/test` | ✅ | 対象ファイル引き継ぎ |
| `/review` | `/deploy` | ✅ | スコア≥80で実行 |
| `/review` | `/test` | ✅ | - |
| `/test` | `/deploy` | ✅ | テストパス時のみ |
| `/test` | `/security-scan` | ✅ | - |
| `/security-scan` | `/deploy` | ✅ | 脆弱性なし時のみ |
| `/deploy` | `/verify` | ✅ | 環境情報引き継ぎ |
| `/verify` | `/deploy` | ✅ | 検証パス時のみ |
| `/miyabi-todos` | `/agent-run` | ✅ | Issue番号リスト引き継ぎ |

---

## パイプラインコンテキスト

パイプライン実行中に共有されるコンテキスト情報。

```typescript
interface PipelineContext {
  // 識別情報
  pipelineId: string;
  startedAt: Date;

  // Issue情報
  issueNumber?: number;
  issueNumbers?: number[];

  // PR情報
  prNumber?: number;
  prUrl?: string;

  // 品質情報
  qualityScore?: number;
  testsPassed?: boolean;
  coveragePercent?: number;

  // デプロイ情報
  deploymentUrl?: string;
  deploymentVersion?: string;
  environment?: string;

  // エラー情報
  errors: PipelineError[];
  warnings: string[];

  // チェックポイント
  checkpoints: Checkpoint[];
  currentStep: number;
  totalSteps: number;
}
```

---

## 関連ドキュメント

- [Agent仕様書](../agents/specs/) - 各Agentの詳細仕様
- [パフォーマンスメトリクス](../agents/PERFORMANCE_METRICS.md) - 実行時間・成功率基準
- [ラベルシステム](../../docs/LABEL_SYSTEM_GUIDE.md) - Issue/PRラベル体系

---

**Issue**: #144
**最終更新**: 2025-12-19
**バージョン**: 1.0.0

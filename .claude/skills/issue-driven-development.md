---
name: issue-driven-development
description: Issue駆動開発（IDD）のワークフロー。GitHub Issueを起点とした開発プロセス。
triggers: ["issue", "idd", "github", "タスク"]
---

# 📋 Issue駆動開発スキル

## 概要

Issue駆動開発（Issue-Driven Development）は、GitHub Issueを起点として開発を進める手法。Miyabiフレームワークの中核となるワークフロー。

## ワークフロー

```
┌──────────────────────────────────────────────────────────┐
│  1. Issue作成                                            │
│     └─ 要件・目的を明確に記述                             │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  2. Issue分析（IssueAgent / みつけるん）                  │
│     └─ ラベル付与・複雑度判定・依存関係分析                │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  3. タスク分解（CoordinatorAgent / しきるん）             │
│     └─ サブタスク作成・DAG構築・担当Agent割り当て          │
└──────────────┬───────────────────────────────────────────┘
               │
        ┌──────┴──────┬──────────┐
        ▼             ▼          ▼
┌────────────┐ ┌────────────┐ ┌────────────┐
│ CodeGen    │ │ Test       │ │ Docs       │
│ (並列実行)  │ │ (並列実行)  │ │ (並列実行)  │
└─────┬──────┘ └─────┬──────┘ └─────┬──────┘
      │              │              │
      └──────────────┼──────────────┘
                     │
                     ▼
┌──────────────────────────────────────────────────────────┐
│  4. レビュー（ReviewAgent / めだまん）                    │
│     └─ 品質チェック・80点以上で合格                       │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  5. PR作成（PRAgent）                                    │
│     └─ 自動PR作成・Issue紐付け                           │
└──────────────┬───────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────┐
│  6. マージ & Issue Close                                 │
│     └─ メインブランチへマージ・Issueを自動Close           │
└──────────────────────────────────────────────────────────┘
```

## Issue テンプレート

### 機能追加 (Feature)

```markdown
---
name: 機能追加
about: 新しい機能を提案する
labels: enhancement, status:backlog
---

## 概要
<!-- 何を実現したいか簡潔に -->

## 背景・目的
<!-- なぜこの機能が必要か -->

## 要件
<!-- 具体的な要件をリストで -->
- [ ] 要件1
- [ ] 要件2
- [ ] 要件3

## 受け入れ条件
<!-- 完了の定義 -->
- [ ] ユニットテストが通る
- [ ] ドキュメントが更新されている
- [ ] レビューが完了している

## 技術的メモ
<!-- 実装に関するヒントや制約 -->

## 参考資料
<!-- 関連Issue、ドキュメント、デザインなど -->
```

### バグ報告 (Bug)

```markdown
---
name: バグ報告
about: 問題を報告する
labels: bug, status:backlog
---

## 概要
<!-- バグの簡潔な説明 -->

## 再現手順
1. 
2. 
3. 

## 期待される動作
<!-- 本来どうなるべきか -->

## 実際の動作
<!-- 実際に何が起こったか -->

## 環境
- OS: 
- Node.js: 
- npm/pnpm: 
- バージョン: 

## スクリーンショット / ログ
<!-- あれば添付 -->

## 追加情報
<!-- 関連する情報 -->
```

### 改善 (Improvement)

```markdown
---
name: 改善提案
about: 既存機能の改善を提案する
labels: improvement, status:backlog
---

## 現状
<!-- 現在の動作・状態 -->

## 提案
<!-- どう改善したいか -->

## メリット
<!-- 改善によって得られる効果 -->

## 実装方針
<!-- 技術的なアプローチ -->
```

## ラベル体系

### ステータスラベル

| ラベル | 説明 | 色 |
|--------|------|-----|
| `status:backlog` | バックログ | #E0E0E0 |
| `status:ready` | 着手可能 | #0E8A16 |
| `status:in-progress` | 作業中 | #FBCA04 |
| `status:review` | レビュー中 | #1D76DB |
| `status:blocked` | ブロック中 | #B60205 |
| `status:done` | 完了 | #0E8A16 |

### 種類ラベル

| ラベル | 説明 |
|--------|------|
| `bug` | バグ修正 |
| `enhancement` | 新機能 |
| `improvement` | 改善 |
| `documentation` | ドキュメント |
| `refactor` | リファクタリング |
| `test` | テスト追加 |
| `security` | セキュリティ |

### 優先度ラベル

| ラベル | 説明 |
|--------|------|
| `priority:critical` | 最優先（即座に対応） |
| `priority:high` | 高優先 |
| `priority:medium` | 中優先 |
| `priority:low` | 低優先 |

### 複雑度ラベル

| ラベル | 見積もり | 説明 |
|--------|----------|------|
| `complexity:trivial` | ~1時間 | 簡単な修正 |
| `complexity:small` | ~4時間 | 小規模な変更 |
| `complexity:medium` | ~1日 | 中規模な変更 |
| `complexity:large` | ~3日 | 大規模な変更 |
| `complexity:epic` | ~1週間+ | エピック級 |

## Miyabi CLIでの実行

### 基本的な実行

```bash
# Issue番号を指定して実行
npx miyabi --issue 123

# 複数Issueを並列実行
npx miyabi --issues 123,124,125 --concurrency 3

# ドライラン（実行前確認）
npx miyabi --issue 123 --dry-run
```

### 設定ファイル

```yaml
# .miyabi.yml
repository: owner/repo
concurrency: 2
agents:
  codegen:
    enabled: true
    model: claude-sonnet-4-20250514
  review:
    enabled: true
    threshold: 80
labels:
  auto_assign: true
  complexity_analysis: true
```

## Issue分析の自動化

### IssueAgent の動作

```typescript
// Issue分析結果の例
interface IssueAnalysis {
  issueNumber: number;
  title: string;
  type: 'bug' | 'enhancement' | 'improvement' | 'documentation';
  complexity: 'trivial' | 'small' | 'medium' | 'large' | 'epic';
  estimatedHours: number;
  suggestedLabels: string[];
  dependencies: number[]; // 依存するIssue番号
  subtasks: SubTask[];
  assignedAgents: string[];
}

interface SubTask {
  title: string;
  description: string;
  agent: string;
  order: number;
  dependencies: string[];
}
```

### 自動ラベル付与ルール

```typescript
// 複雑度判定ロジック
function analyzeComplexity(issue: Issue): Complexity {
  const factors = {
    bodyLength: issue.body.length,
    checklistItems: countChecklistItems(issue.body),
    mentionedFiles: countMentionedFiles(issue.body),
    hasDesignDoc: /design|設計|architecture/.test(issue.body),
    hasMigration: /migration|移行|breaking/.test(issue.body),
  };

  if (factors.hasMigration || factors.checklistItems > 10) {
    return 'epic';
  }
  if (factors.hasDesignDoc || factors.checklistItems > 5) {
    return 'large';
  }
  if (factors.checklistItems > 2 || factors.bodyLength > 1000) {
    return 'medium';
  }
  if (factors.bodyLength > 200) {
    return 'small';
  }
  return 'trivial';
}
```

## ブランチ戦略

### 命名規則

```
{type}/{issue-number}-{short-description}

例:
- feature/123-add-user-auth
- fix/456-login-error
- docs/789-update-readme
- refactor/101-cleanup-utils
```

### 自動ブランチ作成

```bash
# Miyabiが自動作成するブランチ
git checkout -b feature/123-implement-oauth

# Worktree並列実行時
.worktrees/
├── issue-123/  # feature/123-xxx
├── issue-124/  # fix/124-xxx
└── issue-125/  # docs/125-xxx
```

## コミットメッセージ

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]

Refs: #<issue-number>
```

### タイプ一覧

| Type | 説明 |
|------|------|
| `feat` | 新機能 |
| `fix` | バグ修正 |
| `docs` | ドキュメント |
| `style` | フォーマット（コードの意味に影響しない） |
| `refactor` | リファクタリング |
| `perf` | パフォーマンス改善 |
| `test` | テスト追加・修正 |
| `chore` | ビルド・ツール変更 |
| `ci` | CI設定変更 |

### 例

```
feat(auth): add OAuth2 login support

- Add Google OAuth provider
- Add GitHub OAuth provider
- Add session management

Refs: #123
```

## PR自動作成

### PRテンプレート

```markdown
## 概要
<!-- このPRで何を解決するか -->

Closes #{{ISSUE_NUMBER}}

## 変更内容
<!-- 主な変更点 -->
- 変更1
- 変更2

## テスト
<!-- どのようにテストしたか -->
- [ ] ユニットテスト追加
- [ ] 手動テスト実施

## チェックリスト
- [ ] コードレビュー準備完了
- [ ] テストが通っている
- [ ] ドキュメント更新済み
- [ ] Breaking Changeなし（あれば記載）

## スクリーンショット
<!-- UIに変更がある場合 -->
```

## メトリクス

### 追跡すべき指標

| 指標 | 説明 | 目標 |
|------|------|------|
| Lead Time | Issue作成〜Close | < 3日 |
| Cycle Time | 作業開始〜Complete | < 1日 |
| First Response | Issue作成〜最初の反応 | < 4時間 |
| Review Time | PR作成〜承認 | < 4時間 |
| Throughput | 週あたりClose Issue数 | 継続的に増加 |

## チェックリスト

### Issue作成時

- [ ] タイトルが明確で簡潔
- [ ] 背景・目的が記載されている
- [ ] 受け入れ条件が明確
- [ ] 適切なラベルが付与されている
- [ ] 関連Issueへのリンクがある

### Issue完了時

- [ ] すべての受け入れ条件を満たしている
- [ ] テストが追加されている
- [ ] ドキュメントが更新されている
- [ ] PRがマージされている
- [ ] Issue番号がコミットメッセージに含まれている

## 参照

- [GitHub Issues Best Practices](https://docs.github.com/en/issues)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Miyabi Documentation](https://github.com/ShunsukeHayashi/Miyabi)

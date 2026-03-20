# 【技術解説】Claude Skillsの作り方 - Miyabi v0.19.0

## Claude Codeをさらに便利にする「スキル」システム

こんにちは、Miyabi開発者の林です。

今回は、Miyabi v0.19.0で導入した**Claude Skills**の技術的な仕組みを解説します。

---

## Claude Skillsとは？

Skillsは、Claude Codeで使える**再利用可能なワークフロー**です。

普通にClaude Codeを使うと：

```
毎回同じ指示を出す必要がある
「コードレビューして。セキュリティと品質を見て。100点満点で評価して...」
```

Skillsを使うと：

```
「レビューして」
→ 事前定義されたワークフローが自動実行
```

---

## Skillsのディレクトリ構造

```
.claude/skills/
├── skill-name/
│   └── SKILL.md       ← メインファイル
└── README.md
```

### SKILL.mdの書き方

```markdown
---
name: code-reviewer
description: Review code for best practices. Use when reviewing code or PRs.
allowed-tools: Bash, Read, Write, Grep, Glob
---

# Code Reviewer

## Triggers

| Trigger | Examples |
|---------|----------|
| Review | "review this code", "コードレビュー" |

## Instructions

1. Read the target files
2. Check for security issues
3. Score quality (100 points)
4. Output JSON report
```

---

## フロントマター仕様

```yaml
---
name: skill-name          # 必須: スキル名（英語、ケバブケース）
description: ...          # 必須: 説明 + トリガー条件
allowed-tools: ...        # 任意: 使用許可ツール
---
```

### 禁止ワード

以下はスキル名に使えません：
- `claude` (商標)
- `anthropic` (会社名)
- `mcp` (プロトコル名)

```
❌ claude-helper
❌ anthropic-tools
✅ code-reviewer
✅ autonomous-coding-agent
```

---

## トリガーの書き方

トリガーは「このスキルがいつ起動するか」を定義します。

```markdown
## Triggers

| Trigger | Examples |
|---------|----------|
| レビュー依頼 | "review this", "レビューして" |
| 品質チェック | "check quality", "品質確認" |
```

**ポイント:**
- 日本語と英語の両方を書く
- 曖昧な表現は避ける
- 具体的なフレーズを使う

---

## 7つの公式Skills

### 1. code-reviewer

```markdown
---
name: code-reviewer
description: Review code for best practices, bugs, security issues.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- 正確性チェック（30点）
- セキュリティチェック（25点）
- パフォーマンスチェック（20点）
- 保守性チェック（15点）
- テストチェック（10点）

合計100点満点で評価。

---

### 2. commit-helper

```markdown
---
name: commit-helper
description: Generate Conventional Commits messages.
allowed-tools: Bash, Read, Grep
---
```

**機能:**
- `git diff`を分析
- Conventional Commits形式で生成
- 日本語/英語対応

---

### 3. test-generator

```markdown
---
name: test-generator
description: Generate unit tests for code.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- Vitest/Jest対応
- エッジケース生成
- モック自動生成

---

### 4. doc-generator

```markdown
---
name: doc-generator
description: Generate documentation from code.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- JSDoc生成
- README生成
- APIリファレンス生成

---

### 5. refactor-helper

```markdown
---
name: refactor-helper
description: Guide safe code refactoring.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- 段階的なリファクタリング計画
- テスト保護
- 破壊的変更の検出

---

### 6. skill-creator

```markdown
---
name: skill-creator
description: Create new Claude Skills.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- スキル作成ウィザード
- テンプレート生成
- フロントマター検証

---

### 7. autonomous-coding-agent

```markdown
---
name: autonomous-coding-agent
description: Build autonomous coding agents with CLI integration.
allowed-tools: Bash, Read, Write, Grep, Glob
---
```

**機能:**
- Claude Code CLI統合
- マルチセッション管理
- CI/CDパイプライン統合

---

## カスタムスキルの作り方

### ステップ1: ディレクトリ作成

```bash
mkdir -p .claude/skills/my-skill
```

### ステップ2: SKILL.md作成

```markdown
---
name: my-skill
description: My custom skill. Use when X.
allowed-tools: Bash, Read, Write
---

# My Skill

## Triggers

| Trigger | Examples |
|---------|----------|
| カテゴリ | "example 1", "例1" |

## Instructions

1. ステップ1
2. ステップ2
```

### ステップ3: テスト

```bash
claude "example 1"
# → my-skillが起動するか確認
```

---

## ベストプラクティス

### 1. 単一責任

1つのスキル = 1つの明確な目的

```
✅ code-reviewer: コードレビュー専用
❌ code-reviewer-and-test-generator: 2つの機能を混ぜない
```

### 2. 具体的なトリガー

```
✅ "when building Docker containers"
❌ "when needed"
```

### 3. 出力フォーマット定義

```json
{
  "score": 85,
  "issues": [...],
  "suggestions": [...]
}
```

---

## まとめ

Claude Skillsは、Claude Codeを**さらに便利にする仕組み**です。

1. SKILL.mdを書く
2. トリガーを定義する
3. 使うだけ

ぜひカスタムスキルを作ってみてください！

---

## リンク

- **Skills Guide**: https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/SKILLS_GUIDE.md
- **公式Skills**: https://github.com/ShunsukeHayashi/Miyabi/tree/main/.claude/skills

---

#プログラミング #ClaudeCode #AI #開発効率化 #自動化

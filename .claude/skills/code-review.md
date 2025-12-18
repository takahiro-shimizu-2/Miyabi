---
name: code-review
description: コードレビューのベストプラクティス。レビューポイント、フィードバック方法、自動レビュー。
triggers: ["review", "pr", "レビュー", "pull request"]
---

# 👀 コードレビュースキル

## 概要

効果的なコードレビューを行うためのガイドライン。ReviewAgent（めだまん）の動作原理とベストプラクティス。

## レビュー観点

### 1. 正確性 (Correctness)

```typescript
// ❌ バグ: off-by-one error
for (let i = 0; i <= array.length; i++) {
  console.log(array[i]); // undefined at last iteration
}

// ✅ 正しい
for (let i = 0; i < array.length; i++) {
  console.log(array[i]);
}
```

**チェックポイント:**
- [ ] ロジックが正しいか
- [ ] エッジケースが考慮されているか
- [ ] エラーハンドリングが適切か
- [ ] null/undefined チェックがあるか

### 2. セキュリティ (Security)

```typescript
// ❌ SQLインジェクション脆弱性
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ パラメータ化クエリ
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);
```

**チェックポイント:**
- [ ] 入力値バリデーション
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] 認証・認可チェック
- [ ] シークレットがハードコードされていない

### 3. パフォーマンス (Performance)

```typescript
// ❌ N+1クエリ問題
const users = await db.query('SELECT * FROM users');
for (const user of users) {
  const orders = await db.query(
    'SELECT * FROM orders WHERE user_id = $1',
    [user.id]
  );
}

// ✅ JOINまたはバッチクエリ
const usersWithOrders = await db.query(`
  SELECT u.*, o.*
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
`);
```

**チェックポイント:**
- [ ] N+1クエリがない
- [ ] 不要なループがない
- [ ] メモリリークがない
- [ ] 適切なキャッシュ

### 4. 可読性 (Readability)

```typescript
// ❌ 読みにくい
const r = u.filter(x => x.a > 18 && x.s === 'active').map(x => x.n);

// ✅ 読みやすい
const activeAdultNames = users
  .filter(user => user.age > 18 && user.status === 'active')
  .map(user => user.name);
```

**チェックポイント:**
- [ ] 変数名が明確
- [ ] 関数が単一責任
- [ ] コメントが適切（なぜ、を説明）
- [ ] 複雑なロジックが分解されている

### 5. 保守性 (Maintainability)

```typescript
// ❌ マジックナンバー
if (status === 1) { /* ... */ }
if (timeout > 30000) { /* ... */ }

// ✅ 定数化
const STATUS = {
  ACTIVE: 1,
  INACTIVE: 2,
} as const;

const TIMEOUT_MS = 30000;

if (status === STATUS.ACTIVE) { /* ... */ }
if (timeout > TIMEOUT_MS) { /* ... */ }
```

**チェックポイント:**
- [ ] DRY原則（重複がない）
- [ ] マジックナンバーがない
- [ ] 適切な抽象化
- [ ] テストが書きやすい構造

## レビューコメントの書き方

### Conventional Comments

```
<label>: <subject>

[discussion]
```

**ラベル:**

| Label | 説明 | 例 |
|-------|------|-----|
| `praise:` | 良い点を褒める | `praise: Great use of TypeScript generics!` |
| `nitpick:` | 細かい指摘（ブロックしない） | `nitpick: Could use const instead of let here` |
| `suggestion:` | 提案 | `suggestion: Consider using a Map for O(1) lookup` |
| `issue:` | 問題点（修正必須） | `issue: This will throw on null input` |
| `question:` | 質問 | `question: Why did we choose this approach?` |
| `thought:` | 考え・アイデア | `thought: We might want to add caching later` |
| `chore:` | 雑務的な指摘 | `chore: Please run prettier` |

### 良いレビューコメント例

```markdown
# ❌ Bad
これは間違っている

# ✅ Good
issue: この条件だと `user` が null の場合にエラーになります。

```typescript
// 現在のコード
if (user.isActive) { ... }

// 提案
if (user?.isActive) { ... }
```

関連: 他の箇所でも同様のチェックが必要かもしれません。
```

```markdown
# ❌ Bad
もっとよくできる

# ✅ Good
suggestion: このループは `reduce` で書くとより宣言的になります。

```typescript
// 現在
let total = 0;
for (const item of items) {
  total += item.price;
}

// 提案
const total = items.reduce((sum, item) => sum + item.price, 0);
```

どちらでも動作しますが、関数型スタイルの方が他のコードと一貫性があります。
```

## 自動レビュー（ReviewAgent）

### スコアリング基準

```typescript
interface ReviewScore {
  total: number;        // 0-100
  breakdown: {
    lint: number;       // 0-25 (ESLint)
    typecheck: number;  // 0-25 (TypeScript)
    security: number;   // 0-25 (セキュリティ)
    coverage: number;   // 0-25 (テストカバレッジ)
  };
  passed: boolean;      // total >= 80
}
```

### 自動チェック項目

```yaml
# ReviewAgent 設定
review:
  threshold: 80
  checks:
    - name: eslint
      weight: 25
      command: npx eslint --format json
      
    - name: typecheck
      weight: 25
      command: npx tsc --noEmit
      
    - name: security
      weight: 25
      command: npm audit --json
      
    - name: coverage
      weight: 25
      command: npx vitest run --coverage --reporter=json
      min_coverage: 80
```

### /review コマンド

```bash
# インタラクティブレビュー
/review

# 自動修正モード
/review --auto-fix

# 閾値変更
/review --threshold 90

# 特定ファイルのみ
/review --files src/auth/**
```

## PRレビューテンプレート

### レビュアー用チェックリスト

```markdown
## レビューチェックリスト

### 機能
- [ ] 要件を満たしている
- [ ] エッジケースが考慮されている
- [ ] エラーハンドリングが適切

### コード品質
- [ ] 読みやすく理解しやすい
- [ ] 重複がない（DRY）
- [ ] 適切な抽象化レベル

### セキュリティ
- [ ] 入力値バリデーション
- [ ] 認証・認可チェック
- [ ] センシティブデータの適切な取り扱い

### テスト
- [ ] ユニットテストが追加されている
- [ ] エッジケースがテストされている
- [ ] テストが通っている

### ドキュメント
- [ ] コードコメントが適切
- [ ] READMEが更新されている（必要な場合）
- [ ] APIドキュメントが更新されている（必要な場合）
```

## レビュープロセス

### 推奨フロー

```
1. 自動チェック実行
   └─ CI/CD (lint, test, build)

2. セルフレビュー
   └─ 作成者が自分でチェック

3. AIレビュー (ReviewAgent)
   └─ 80点以上で次へ

4. 人間レビュー
   └─ 1-2人のApproval

5. マージ
   └─ Squash merge
```

### レビュー時間の目安

| PRサイズ | 変更行数 | レビュー時間 |
|----------|----------|--------------|
| XS | ~50行 | ~15分 |
| S | ~200行 | ~30分 |
| M | ~500行 | ~1時間 |
| L | ~1000行 | ~2時間 |
| XL | 1000行+ | 分割推奨 |

## レビューの心得

### レビュアーとして

1. **建設的に** - 批判ではなく改善提案
2. **具体的に** - 問題点と解決策を明示
3. **迅速に** - 24時間以内にレスポンス
4. **敬意を持って** - 人ではなくコードをレビュー

### レビュイーとして

1. **オープンに** - フィードバックを受け入れる
2. **説明する** - 意図を明確に伝える
3. **感謝する** - 時間を割いてくれたことに感謝
4. **学ぶ** - レビューを成長の機会に

## チェックリスト

### PR作成前

- [ ] セルフレビュー完了
- [ ] テストが通っている
- [ ] Lintエラーがない
- [ ] 不要なコードが残っていない
- [ ] コミットメッセージが適切

### レビュー時

- [ ] 要件を満たしているか確認
- [ ] コード品質をチェック
- [ ] セキュリティリスクを確認
- [ ] テストの妥当性を確認
- [ ] 建設的なフィードバックを提供

## 参照

- [Google Engineering Practices](https://google.github.io/eng-practices/review/)
- [Conventional Comments](https://conventionalcomments.org/)
- [The Standard of Code Review](https://google.github.io/eng-practices/review/reviewer/standard.html)

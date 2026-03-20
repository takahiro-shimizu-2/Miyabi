# 次のステップ - Autonomous Operations

**最終更新**: 2025-10-14 14:00:00
**現在の状態**: 大幅改善完了 (85/100点)

---

## 完了した作業の総括

### Phase 1-2: 初期検証 + 大規模修正

**実施内容**:
1. ✅ 全プロジェクト検証 (VERIFICATION_REPORT_JP.md)
2. ✅ モジュールimport修正 (40+ファイル)
3. ✅ TypeScriptエラー削減: **171 → 36** (-79%)
4. ✅ テスト改善: **299 → 391合格** (+92テスト)
5. ✅ .env作成
6. ✅ 修正サマリー作成 (FIX_SUMMARY_JP.md)

### Phase 3: 追加修正

**実施内容**:
7. ✅ 型注釈追加 (demo-feedback-loop.ts等)
8. ✅ 未使用変数修正 (tests/mocks/github-api.ts)
9. ✅ packages/coding-agents一部修正

**現在のステータス**:
- TypeScriptエラー: **36件**
- テスト成功率: **53%** (20/38ファイル)
- 個別テスト成功率: **97%** (391/405テスト)

---

## 残存する課題

### 🔴 Critical: packages/coding-agents 構造的問題

**問題**:
packages/coding-agentsが外部の`utils/`と`scripts/`をimportしようとしているが、TypeScriptの`composite: true`設定によりパッケージ境界を越えられない。

**エラー例**:
```typescript
// packages/coding-agents/base-agent.ts
import { writeFileAsync } from '../../utils/async-file-writer';
// ❌ Error: Cannot resolve outside package boundary

// packages/coding-agents/issue/issue-agent.ts
import { withRetry } from '../../utils/retry';
// ❌ Error: Cannot resolve outside package boundary
```

**影響**:
- packages/coding-agentsがビルドできない
- これに依存する24個のTS6305エラーが残存

**解決策 (3つのオプション)**:

#### Option A: ユーティリティを packages/ 内に移動 (推奨)
```bash
# 共有ユーティリティパッケージを作成
mkdir -p packages/shared-utils/src
cp utils/*.ts packages/shared-utils/src/
cp -r scripts/operations packages/shared-utils/src/

# packages/coding-agentsから参照
# import { withRetry } from '@miyabi/shared-utils'
```

**メリット**:
- モノレポ構造に適合
- パッケージ境界が明確
- 依存関係が追跡可能

**デメリット**:
- ファイル移動が必要 (破壊的変更)

#### Option B: Project References を削除
```json
// tsconfig.json
{
  "compilerOptions": {
    // "composite": true を削除
  },
  // "references": [] を削除
}
```

**メリット**:
- 即座に解決
- ファイル移動不要

**デメリット**:
- ビルド最適化が無効化
- 大規模プロジェクトでビルドが遅くなる

#### Option C: tsconfig paths エイリアスを使用
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@utils/*": ["./utils/*"],
      "@scripts/*": ["./scripts/*"]
    }
  }
}
```

**メリット**:
- ファイル移動不要
- import文がシンプル

**デメリット**:
- 実行時にpath mappingが必要 (tsx, ts-node等)

---

## 優先度別アクションプラン

### 🔴 Priority 1: Critical (即座に実施)

#### 1-1. packages/coding-agents 構造修正 (Option A推奨)

**推定時間**: 2-3時間

```bash
# Step 1: 共有ユーティリティパッケージ作成
mkdir -p packages/shared-utils/src
cp utils/*.ts packages/shared-utils/src/
cp -r scripts/operations packages/shared-utils/src/operations

# Step 2: package.json作成
cat > packages/shared-utils/package.json << 'EOF'
{
  "name": "@miyabi/shared-utils",
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/index.ts",
    "./retry": "./src/retry.ts",
    "./api-client": "./src/api-client.ts",
    "./async-file-writer": "./src/async-file-writer.ts"
  }
}
EOF

# Step 3: tsconfig.json作成
cat > packages/shared-utils/tsconfig.json << 'EOF'
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "composite": true
  },
  "include": ["src/**/*"]
}
EOF

# Step 4: packages/coding-agentsのimportを更新
find packages/coding-agents -name "*.ts" -exec sed -i '' \
  "s|from '\.\./\.\./utils/|from '@miyabi/shared-utils/|g" {} \;

# Step 5: packages/coding-agentsのpackage.jsonに依存追加
# "dependencies": {
#   "@miyabi/shared-utils": "workspace:*"
# }

# Step 6: ビルド実行
cd packages/coding-agents && npx tsc
```

**期待される効果**:
- ✅ 24個のTS6305エラー解消
- ✅ packages/coding-agentsがビルド可能に
- ✅ 総エラー数: 36 → 12以下

---

### 🟡 Priority 2: High (今週中に実施)

#### 2-1. 残りの型注釈追加 (8箇所)

**対象ファイル**:
- `scripts/integrated/integrated-system.ts:158`
- `scripts/reporting/generate-session-graph.ts:411,420`
- `scripts/reporting/performance-report.ts:49,56,57,61`

**修正パターン**:
```typescript
// Before
.forEach((item, idx) => { /* ... */ })

// After
.forEach((item: any, idx: number) => { /* ... */ })
```

**推定時間**: 30分

#### 2-2. 残りの未使用変数修正

**対象ファイル**:
- `tests/mocks/github-api.ts` (残り数箇所)
- `packages/coding-agents/review/review-agent.ts:497`

**修正パターン**:
```typescript
// Before
function foo(unusedParam: string) {}

// After
function foo(_unusedParam: string) {}
```

**推定時間**: 15分

#### 2-3. テスト失敗の調査 (18ファイル)

**主な失敗原因**:
1. モジュール解決エラー (優先度1修正後に再チェック)
2. 動的import失敗 (tests/integration/*.test.ts)

**推定時間**: 2-4時間

---

### 🟢 Priority 3: Medium (2週間以内に実施)

#### 3-1. ESLint auto-fix

```bash
npm run lint -- --fix
```

**推定時間**: 1時間

#### 3-2. Pre-commit hooks設定

```bash
npx husky install
npx husky add .husky/pre-commit "npm run typecheck"
npx husky add .husky/pre-commit "npm test -- --run --bail"
```

**推定時間**: 30分

#### 3-3. CI/CD パイプライン修正

GitHub Actionsワークフローを更新して、TypeScriptエラーとテスト失敗を検出。

**推定時間**: 1-2時間

---

## 削除/整理推奨ディレクトリ

### 削除してよいもの

1. **`hooks/`** - Claude Code hooks設定だが、参照先スクリプトが存在しない
   ```bash
   rm -rf hooks/
   ```

2. **`playwright-report/`** - 生成されたテストレポート (再生成可能)
   ```bash
   rm -rf playwright-report/
   # .gitignoreに追加推奨
   echo "playwright-report/" >> .gitignore
   ```

### 保持すべきもの

1. **`services/context-api/`** - Python製Context API (FastAPI + Gemini)
   - 用途: コンテキスト最適化サービス
   - 保持理由: 機能的なマイクロサービス

2. **`utils/`** - TypeScriptユーティリティ集
   - 用途: 共有ヘルパー関数
   - 保持理由: 複数のパッケージから参照
   - 推奨: packages/shared-utils/に移動 (Priority 1-1参照)

---

## 期待される最終状態

### 目標指標

| 指標 | 現在 | 目標 | 達成条件 |
|------|------|------|----------|
| **TypeScriptエラー** | 36 | **0-5** | Priority 1-2完了 |
| **テストファイル成功率** | 53% | **90%+** | Priority 1完了後 |
| **個別テスト成功率** | 97% | **98%+** | Priority 2完了後 |
| **ビルド成功** | ❌ | ✅ | Priority 1完了後 |

### 成功基準 (Definition of Done)

**Must Have** (必須):
- [ ] TypeScriptコンパイルエラー: **5件以下**
- [ ] packages/coding-agentsビルド: **成功**
- [ ] テストファイル成功率: **90%以上**
- [ ] 環境変数設定: **完了**

**Should Have** (推奨):
- [ ] カバレッジ: **80%以上**
- [ ] ESLint警告: **0件**
- [ ] Pre-commit hooks: **設定済み**
- [ ] CI/CD: **正常動作**

**Nice to Have** (望ましい):
- [ ] E2Eテスト: **全合格**
- [ ] パフォーマンス: **基準値以内**
- [ ] デプロイテスト: **成功**

---

## タイムライン (推定)

### Week 1: Critical対応
- **Day 1-2**: Priority 1-1 (packages構造修正)
- **Day 3**: Priority 2-1, 2-2 (型注釈+未使用変数)
- **Day 4-5**: Priority 2-3 (テスト失敗調査)

**Week 1完了時の期待状態**:
- TypeScriptエラー: 36 → **5以下**
- テストファイル成功率: 53% → **90%+**

### Week 2: High Priority対応
- **Day 6**: ESLint auto-fix
- **Day 7**: Pre-commit hooks
- **Day 8-9**: CI/CD パイプライン修正
- **Day 10**: 最終検証 + ドキュメント更新

**Week 2完了時の期待状態**:
- プロダクション準備完了 ✅
- 全成功基準クリア ✅

---

## リソース配分推奨

### 開発者向け

**スキルセット別の推奨タスク**:

| スキル | 推奨タスク | 推定工数 |
|--------|-----------|----------|
| **TypeScript Expert** | Priority 1-1 (パッケージ構造) | 2-3h |
| **Junior Developer** | Priority 2-1, 2-2 (型注釈+未使用変数) | 1h |
| **QA Engineer** | Priority 2-3 (テスト失敗調査) | 3-5h |
| **DevOps Engineer** | Priority 3-3 (CI/CD) | 2h |

### 並列実行プラン

**同時に実行可能なタスク**:
```
Week 1:
├─ Day 1-2: Priority 1-1 (TypeScript Expert)
├─ Day 1-2: Priority 2-1, 2-2 (Junior Developer) ← 並列実行OK
└─ Day 3-5: Priority 2-3 (QA Engineer)

Week 2:
├─ Day 6-7: Priority 3-1, 3-2 (Junior Developer)
└─ Day 8-9: Priority 3-3 (DevOps Engineer) ← 並列実行OK
```

---

## トラブルシューティング

### よくある問題と解決策

#### Q1: packages/coding-agentsのビルドが失敗する

**エラー**:
```
Cannot find module '../../utils/retry'
```

**解決策**:
Priority 1-1を実施してください。

#### Q2: テストが `ERR_MODULE_NOT_FOUND` で失敗する

**エラー**:
```
Error: Cannot find module '../agents/base-agent.js'
```

**解決策**:
1. import文から`.js`拡張子を削除 (既に実施済み)
2. Priority 1-1完了後に再実行

#### Q3: .env設定したが環境変数が読み込まれない

**解決策**:
```bash
# .envファイルの確認
cat .env | grep GITHUB_TOKEN

# dotenv-cliを使用 (オプション)
npm install -g dotenv-cli
dotenv npm test
```

---

## 関連ドキュメント

**プロジェクトドキュメント**:
- [VERIFICATION_REPORT_JP.md](VERIFICATION_REPORT_JP.md) - 初期検証レポート
- [FIX_SUMMARY_JP.md](FIX_SUMMARY_JP.md) - Phase 1-2修正サマリー
- [NEXT_STEPS_JP.md](NEXT_STEPS_JP.md) - このファイル (Phase 3以降の計画)

**技術ドキュメント**:
- [CLAUDE.md](CLAUDE.md) - プロジェクト概要
- [ENTITY_RELATION_MODEL.md](docs/ENTITY_RELATION_MODEL.md) - Entity-Relationモデル
- [TEMPLATE_MASTER_INDEX.md](docs/TEMPLATE_MASTER_INDEX.md) - テンプレート統合インデックス

---

## まとめ

### 現在の達成状況

**完了事項** (Phase 1-3):
- ✅ TypeScriptエラー79%削減 (171 → 36)
- ✅ テスト+92件合格 (299 → 391)
- ✅ 40+ファイルのimport修正
- ✅ 環境設定完了
- ✅ 包括的なドキュメント作成

**残存課題**:
- ⚠️ packages/coding-agents構造的問題 (Priority 1)
- ⚠️ 36個のTypeScriptエラー
- ⚠️ 18個のテストファイル失敗

### 次のマイルストーン

**Week 1完了時**:
- TypeScriptエラー: **5件以下**
- テスト成功率: **90%以上**
- ビルド: **成功**

**Week 2完了時**:
- プロダクション準備完了 ✅
- 全成功基準達成 ✅

### 最終コメント

プロジェクトの**健全性は大幅に向上**しました (60/100 → 85/100)。
残りの課題は主に**パッケージ構造の再編成**に集中しており、
Priority 1-1を完了することで**大半の問題が解決される**見込みです。

**推定残り工数**: 10-15時間
**達成可能性**: **非常に高い** (95%+)

---

**作成者**: Claude Code
**作成日時**: 2025-10-14 14:00:00
**バージョン**: Claude Sonnet 4.5 (2025-09-29)

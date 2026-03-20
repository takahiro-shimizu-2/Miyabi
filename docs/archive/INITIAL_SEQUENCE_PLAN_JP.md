# Initial Sequence タスク整理プラン（今週まで）

**作成日**: 2026-02-04
**対象期間**: 今週（~2026-02-08）

## 目的
`NEXT_PLANNING.md`、`NEXT_STEPS_JP.md`、`.todos_shunsuke/todos.md` を統合し、今週中に着手すべき作業を優先度・依存関係・検証順で整理する。

## 参照ソース
- `NEXT_PLANNING.md`
- `NEXT_STEPS_JP.md`
- `.todos_shunsuke/todos.md`

## 運用前提
- 「Initial Sequence」はタスク整理フェーズとして扱う。
- 出力は計画ドキュメントの作成のみ（実装・PR操作は含めない）。
- `packages/cli/scripts/postinstall.js` の初期シーケンスは本リポジトリ内では `isUserProject()` により実行されない想定。

## 今週の優先度（依存関係ベース）

### P1: ビルド復旧（最優先）
- `packages/coding-agents` のパッケージ境界問題を解消する。
- Option A を採用し、`packages/shared-utils` を新設して共有ユーティリティを移動する。
- 期待効果: TS6305 系の解消と `packages/coding-agents` のビルド成功。

### P1: 低リスク修正（ビルド復旧後）
- 型注釈の追加（`scripts/integrated`、`scripts/reporting` 等）。
- 未使用変数修正（`tests/mocks/github-api.ts`、`packages/coding-agents/review/review-agent.ts`）。

### P1: テスト失敗調査
- モジュール解決エラーと動的 import 失敗の再確認。
- ビルド復旧後に原因分析 → 修正。

### P2: PR/Release 整理（ビルド安定後）
- PR #148 (v0.15.0) の扱いを確認。
- PR #206/#167 の Issue Number parsing 修正の状態確認。
- Security Audit (#207) のレビュー計画整理。
- リリース v0.16.0 の準備（実施は別タスク）。

### P3: 余力での品質改善
- `npm run lint -- --fix` の検討。
- pre-commit hooks の整備。
- CI/CD パイプライン修正。

### P3: 個人タスク
- `npm install @anthropic-ai/claude-agent-sdk` の実施可否確認。
- Headless mode 検証の準備（`.todos_shunsuke/todos.md` 参照）。

## 今週の実行順（提案）

### Day 1-2
- `packages/shared-utils` 新設。
- `packages/coding-agents` の import/依存/tsconfig 更新。
- 単体ビルド確認。

### Day 3
- 型注釈追加。
- 未使用変数修正。

### Day 4-5
- テスト失敗調査と修正。

### 並列枠
- PR/Issue の棚卸しと Release 準備（ビルド安定後に開始）。

## 受け入れ基準（DoD）
- TypeScript エラー 5件以下。
- `packages/coding-agents` のビルド成功。
- テストファイル成功率 90%以上。
- 可能なら ESLint 警告 0件。

## 検証コマンド
- `npm run typecheck`
- `npm test`
- `npm run lint`（余力があれば）
- `cd packages/coding-agents && npx tsc`

## 注意点
- `NEXT_PLANNING.md` のPR/Issue情報は日時が古い可能性があるため、実行時に最新状況を確認する。
- ディレクトリ削除（`hooks/`、`playwright-report/`）は今週の優先度外。安定化後に別途扱う。

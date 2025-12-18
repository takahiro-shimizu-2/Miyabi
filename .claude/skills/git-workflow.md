---
name: git-workflow
description: Gitワークフローとコンベンション。ブランチ戦略、コミット規則、マージ戦略。
triggers: ["git", "branch", "commit", "merge"]
---

# 🌿 Gitワークフロースキル

## 概要

効率的なGitワークフローとチーム開発のためのベストプラクティス。

## ブランチ戦略

### GitHub Flow (推奨)

```
main ─────●─────●─────●─────●─────●─────●───▶
           \           /     \         /
feature/A   ●────●────●       \       /
                               \     /
feature/B                       ●───●
```

**シンプルなルール:**
1. `main`は常にデプロイ可能
2. 新機能・修正は`main`からブランチを切る
3. PRでレビュー後マージ
4. マージ後すぐにデプロイ

### ブランチ命名規則

```
{type}/{issue-number}-{short-description}

Types:
- feature/  : 新機能
- fix/      : バグ修正
- hotfix/   : 緊急修正
- docs/     : ドキュメント
- refactor/ : リファクタリング
- test/     : テスト追加
- chore/    : その他

例:
- feature/123-user-authentication
- fix/456-login-button-disabled
- hotfix/789-security-patch
- docs/101-api-documentation
```

## コミット規則

### Conventional Commits

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type一覧

| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能 | `feat(auth): add JWT authentication` |
| `fix` | バグ修正 | `fix(api): handle null response` |
| `docs` | ドキュメント | `docs(readme): add installation guide` |
| `style` | フォーマット | `style: fix indentation` |
| `refactor` | リファクタリング | `refactor(utils): simplify date parsing` |
| `perf` | パフォーマンス | `perf(query): add database index` |
| `test` | テスト | `test(auth): add login tests` |
| `build` | ビルド | `build: update webpack config` |
| `ci` | CI/CD | `ci: add GitHub Actions workflow` |
| `chore` | その他 | `chore: update dependencies` |
| `revert` | リバート | `revert: feat(auth): add JWT` |

### コミットメッセージ例

```bash
# 良い例
feat(user): add email verification

- Add verification email sending
- Add verification token generation
- Add verification endpoint

Refs: #123

# 悪い例
fix bug          # 何を直したか不明
update           # 具体性がない
WIP              # 未完成でコミット
```

### Commitizen (対話式コミット)

```bash
npm install -g commitizen cz-conventional-changelog

# プロジェクト設定
echo '{ "path": "cz-conventional-changelog" }' > ~/.czrc

# 使用
git cz
# または
cz
```

## 日常的なGit操作

### ブランチ作成・切り替え

```bash
# 新しいブランチを作成して切り替え
git checkout -b feature/123-new-feature

# または (Git 2.23+)
git switch -c feature/123-new-feature

# リモートブランチをトラッキング
git checkout -b feature/123 origin/feature/123
```

### 変更のステージング

```bash
# 全ファイルをステージ
git add .

# 特定ファイル
git add src/index.ts

# 対話的にステージ (hunk単位)
git add -p

# 変更を確認
git diff --staged
```

### コミット

```bash
# 通常コミット
git commit -m "feat(auth): add login endpoint"

# エディタで詳細メッセージ
git commit

# 直前のコミットを修正
git commit --amend

# 空コミット (CI トリガー用など)
git commit --allow-empty -m "ci: trigger build"
```

### プッシュ

```bash
# 現在のブランチをプッシュ
git push origin HEAD

# 新しいブランチをプッシュ（アップストリーム設定）
git push -u origin feature/123-new-feature

# 強制プッシュ (rebase後など) ※注意
git push --force-with-lease
```

## マージ戦略

### Squash Merge (推奨)

```bash
# PRをSquash Merge
# 複数コミットを1つにまとめてマージ
git merge --squash feature/123
git commit -m "feat(auth): add authentication (#123)"
```

**メリット:**
- mainのコミット履歴がきれい
- 1 Issue = 1 Commit

### Rebase Merge

```bash
# feature ブランチを main にリベース
git checkout feature/123
git rebase main

# コンフリクト解決後
git rebase --continue

# リベース中止
git rebase --abort
```

### 通常Merge

```bash
git checkout main
git merge feature/123 --no-ff
```

## コンフリクト解決

### 基本的な解決手順

```bash
# 1. mainの最新を取得
git checkout main
git pull origin main

# 2. featureブランチで作業
git checkout feature/123
git rebase main

# 3. コンフリクトが発生したら
# ファイルを編集して解決

# 4. 解決をステージ
git add <resolved-files>

# 5. リベース続行
git rebase --continue

# 6. プッシュ
git push --force-with-lease
```

### コンフリクトマーカー

```
<<<<<<< HEAD
現在のブランチの内容
=======
マージしようとしているブランチの内容
>>>>>>> feature/123
```

## Stash (一時保存)

```bash
# 変更を一時保存
git stash

# メッセージ付きで保存
git stash push -m "WIP: user feature"

# stash 一覧
git stash list

# 最新の stash を復元
git stash pop

# 特定の stash を復元
git stash apply stash@{2}

# stash を削除
git stash drop stash@{0}

# 全 stash をクリア
git stash clear
```

## 履歴操作

### Interactive Rebase

```bash
# 直近5コミットを編集
git rebase -i HEAD~5

# エディタで操作を選択
pick abc1234 First commit
squash def5678 Second commit   # 前のコミットと統合
reword ghi9012 Third commit    # メッセージ変更
drop jkl3456 Fourth commit     # 削除
```

### Cherry Pick

```bash
# 特定のコミットを現在のブランチに適用
git cherry-pick abc1234

# 複数コミット
git cherry-pick abc1234 def5678

# コンフリクト時
git cherry-pick --continue
git cherry-pick --abort
```

### Reset

```bash
# ステージング解除 (変更は保持)
git reset HEAD

# 直前のコミットを取り消し (変更は保持)
git reset --soft HEAD~1

# 直前のコミットを取り消し (変更も削除)
git reset --hard HEAD~1  # ⚠️ 注意

# 特定のコミットまで戻る
git reset --hard abc1234  # ⚠️ 注意
```

## Git Worktree

```bash
# Worktree 作成
git worktree add ../issue-123 -b feature/123

# Worktree 一覧
git worktree list

# Worktree 削除
git worktree remove ../issue-123

# 強制削除
git worktree remove --force ../issue-123
```

## Git Hooks

### pre-commit

```bash
#!/bin/sh
# .git/hooks/pre-commit

# ESLint
npm run lint

# TypeScript check
npm run typecheck

# テスト
npm run test:staged
```

### commit-msg

```bash
#!/bin/sh
# .git/hooks/commit-msg

# Conventional Commits チェック
commit_msg=$(cat "$1")
pattern="^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?: .{1,50}"

if ! echo "$commit_msg" | grep -qE "$pattern"; then
  echo "Error: Commit message must follow Conventional Commits format"
  exit 1
fi
```

### Husky (Hook管理)

```bash
npm install -D husky lint-staged

npx husky init

# pre-commit hook
echo "npx lint-staged" > .husky/pre-commit
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

## Git エイリアス

### おすすめ設定

```bash
git config --global alias.co checkout
git config --global alias.br branch
git config --global alias.ci commit
git config --global alias.st status
git config --global alias.unstage 'reset HEAD --'
git config --global alias.last 'log -1 HEAD'
git config --global alias.visual '!gitk'
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"
```

## トラブルシューティング

### よくある問題

```bash
# 間違えてコミットした
git reset --soft HEAD~1

# 間違えてプッシュした (未共有ブランチ)
git push --force-with-lease

# ブランチを間違えてマージした
git reset --hard ORIG_HEAD

# 削除したファイルを復元
git checkout HEAD -- path/to/file

# 全変更を破棄
git checkout -- .
git clean -fd
```

## チェックリスト

### コミット前

- [ ] 変更内容を確認 (`git diff`)
- [ ] 不要なファイルが含まれていない
- [ ] テストが通る
- [ ] Lintエラーがない
- [ ] コミットメッセージがConventional Commits形式

### PR作成前

- [ ] mainから最新を取り込んでいる
- [ ] コンフリクトが解決されている
- [ ] 不要なコミットがSquashされている
- [ ] CI/CDが通っている

## 参照

- [Git Documentation](https://git-scm.com/doc)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [GitHub Flow](https://docs.github.com/en/get-started/quickstart/github-flow)

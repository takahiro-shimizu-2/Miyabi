# 【Miyabi v0.19.0】7つのClaude Skillsで開発が劇的に変わる

## Issueを書くだけ。あとはAIが全部やる。

こんにちは、Miyabi開発者の林です。

本日、**Miyabi v0.19.0**をリリースしました。今回の目玉は**7つのClaude Skills**です。

---

## そもそもMiyabiとは？

```
📝 Issue を書く → 🤖 AI が実装 → ✅ PR が届く
```

たった10-15分で、Issueがコードになります。

Miyabiは「自律型開発フレームワーク」です。GitHub Issueを書くだけで、AIがコードを書き、テストを作り、PRを出してくれます。

---

## v0.19.0の新機能

### 1. 7つのClaude Skills

「スキル」とは、Claude Codeで使える再利用可能なワークフローです。

| スキル名 | できること |
|---------|-----------|
| `code-reviewer` | コードレビュー（100点満点評価） |
| `commit-helper` | コミットメッセージ自動生成 |
| `test-generator` | テスト自動生成 |
| `doc-generator` | ドキュメント自動生成 |
| `refactor-helper` | リファクタリング支援 |
| `skill-creator` | カスタムスキル作成 |
| `autonomous-coding-agent` | 自律コーディング |

### 使い方

Claude Codeで話しかけるだけ：

```
「このコードをレビューして」
→ code-reviewer が自動起動

「テストを書いて」
→ test-generator が自動起動

「コミットして」
→ commit-helper が自動起動
```

**日本語でOK**です。

---

### 2. Windows対応

ついにWindowsでも完全動作します。

- PowerShell / cmd.exe 対応
- 改行コード自動変換
- クロスプラットフォーム設計

WindowsユーザーもMiyabiを使えるようになりました。

---

### 3. 依存関係の大幅更新

最新のパッケージに対応しました：

- `@anthropic-ai/sdk` 0.71.2
- `@octokit/rest` 21.1.1
- `vitest` 3.2.4

---

## インストール方法

```bash
npm install -g miyabi
```

たった1行です。

---

## 5分でできる初期設定

### ステップ1: インストール

```bash
npm install -g miyabi
```

### ステップ2: プロジェクト作成

```bash
npx miyabi init my-project
```

### ステップ3: Issueを書く

GitHubでIssueを作成するだけ。

あとはMiyabiが自動で：
- ✅ コードを生成
- ✅ テストを作成
- ✅ PRを出す

---

## なぜMiyabiを作ったのか

開発には「繰り返し作業」が多すぎます：

- PRを出すたびにレビュー依頼
- コミットメッセージを毎回考える
- テストを手動で書く
- ドキュメントを更新する

これらを**全部AIに任せたい**。

Miyabiはその願いを実現します。

---

## 今後の予定

- **v0.20.0**: より多くのSkills
- **v0.21.0**: チーム開発対応
- **v1.0.0**: 本番リリース

---

## リンク

- **npm**: https://www.npmjs.com/package/miyabi
- **GitHub**: https://github.com/ShunsukeHayashi/Miyabi
- **Discord**: https://discord.gg/Urx8547abS

---

## まとめ

Miyabi v0.19.0で、開発がさらに楽になりました。

```bash
npm install -g miyabi
npx miyabi
```

ぜひ試してみてください。

質問があればDiscordへ！

---

#プログラミング #AI #開発効率化 #Claude #GitHub #自動化

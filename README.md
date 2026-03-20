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

---

## 魔法の瞬間 / The Magic

```
📝 Issue を書く        →    🤖 AI が実装        →    ✅ PR が届く
   Write an Issue            AI implements            PR arrives
```

**10-15分で完了。** *Done in 10-15 minutes.*

---

## パッケージ / Packages

| Package | Version | Description |
|---------|---------|-------------|
| [miyabi](https://www.npmjs.com/package/miyabi) | v0.20.3 | CLI - 自律型開発フレームワーク |
| [miyabi-mcp-bundle](https://www.npmjs.com/package/miyabi-mcp-bundle) | v3.7.1 | MCP Server - 172+ tools |

---

## 今すぐ試す / Quick Start

```bash
# CLI
npx miyabi

# 新コマンド (v0.20.x)
npx miyabi cycle          # Issue → 実装 → PR の全自動サイクル
npx miyabi release        # セマンティックリリース + X/Discord通知
npx miyabi voice          # 音声駆動モード（Voice-First操作）
npx miyabi skills         # Agent Skillの一覧・管理

# MCP Server (Claude Desktop/Code)
npm install -g miyabi-mcp-bundle
```

---

## v0.20.x 新機能 / What's New in v0.20.x

### 🚀 新CLIコマンド / New CLI Commands

| Command | Description |
|---------|-------------|
| `miyabi cycle` | Issue作成から実装・テスト・PRまでを一気通貫で実行 |
| `miyabi release` | バージョニング・CHANGELOG生成・X/Discord自動投稿 |
| `miyabi voice` | 音声入力による開発操作（VoiceBox/Google Home連携） |
| `miyabi skills` | Agent Skill Busに登録されたSkillの管理・実行 |

### 🧠 Agent Skill Bus 統合

Miyabi CLIがAgent Skill Busと統合され、スキルベースの拡張が可能になりました。
各スキル（code-reviewer, test-generator, commit-helper等）はバスを通じて
動的にロード・実行されます。`miyabi skills` で利用可能なスキルを確認できます。

### 🔍 GNI（GitNexus Impact Analysis）統合

コード変更前にGitNexus Impact Analysisを自動実行し、変更の影響範囲を可視化します。
依存関係の破壊、テストカバレッジへの影響、他パッケージへの波及を事前に検出し、
安全なコード変更をサポートします。

### 🖥️ 6台クラスター分散実行

macbook・Windows・Mac mini×2 等、最大6台のマシンで開発タスクを分散実行できます。
SSH/Tailscaleネットワーク経由で各ノードにタスクをディスパッチし、
並列ビルド・テスト・デプロイを実現します。

---

## v0.19.0 の機能 / v0.19.0 Features

- 🎯 **7 Claude Skills** - code-reviewer, commit-helper, test-generator...
- 🪟 **Windows対応** - Cross-platform support
- 📦 **依存関係更新** - @anthropic-ai/sdk 0.71, @octokit/rest 21

---

## もっと詳しく / Learn More

- 📖 [CLI ドキュメント](./packages/cli/README.md)
- 🔧 [MCP Bundle ドキュメント](./packages/mcp-bundle/README.md)
- 💬 [Discord コミュニティ](https://discord.gg/ZpY9sxfYNm)
- 🐛 [Issue 報告](https://github.com/ShunsukeHayashi/Miyabi/issues)

---

## 必要なもの / Requirements

- Node.js 18+
- GitHub アカウント / GitHub account

---

## ライセンス / License

[Apache 2.0](LICENSE) - Copyright (c) 2025 Shunsuke Hayashi

---

<sub>🤖 Powered by Claude AI</sub>

</div>

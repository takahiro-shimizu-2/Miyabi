# Miyabi Master Plan — 仕様書 v1.0

**最終更新: 2026-03-20**
**オーナー: 林駿甫 (Shunsuke Hayashi)**
**組織: 合同会社みやび (LLC Miyabi)**

---

## 1. ゴール

> 「npx miyabi」を唯一のエントリーポイントとし、全プロダクトを1つの統合プロダクト群として運用する。
> Voice-First × Agent-Driven × Self-Improving の世界で唯一のフレームワークを完成させる。

### 完了条件
- [ ] `npx miyabi cycle` でフィードバックループが回る
- [ ] `npx miyabi voice` で音声制御が起動する
- [ ] `npx miyabi release` でリリース→Xアナウンスが自動化される
- [ ] 全スキルのヘルススコアが0.7以上
- [ ] 6台のクラスター全てが統一コンテキストで協調動作する

---

## 2. プロダクトアーキテクチャ

### 2.1 コアプロダクト

| プロダクト | npm | バージョン | 言語 | 役割 |
|-----------|-----|-----------|------|------|
| **Miyabi CLI** | `miyabi` | v0.19.0 | TypeScript | 統一エントリーポイント。17サブコマンド。モノレポ13パッケージ |
| **Agent Skill Bus** | `agent-skill-bus` | v1.1.0 | JavaScript | 品質ループエンジン。依存ゼロ。JSONL駆動 |
| **Miyabi MCP Bundle** | `miyabi-mcp-bundle` | v3.7.1 | TypeScript | 172+ MCPツール統合サーバー |
| **GitNexus** | `gitnexus-stable` | - | Python/JS | コード知識グラフ。リポジトリ横断インパクト分析 |
| **ARIA LDD+ADD** | - | v2 | XML/Shell/PS1 | コーディング品質保証。8フェーズ構造化ループ(計画→実行→監査→コミット) |

### 2.2 サービスプロダクト

| プロダクト | リポジトリ | 言語 | 役割 |
|-----------|-----------|------|------|
| **voice-os** | voice-os | Python | 音声パイプライン。TurnDetector v2.1.0 |
| **miyabi-yomiage** | miyabi-yomiage | TypeScript | Discord Voice Channel TTS (VOICEVOX) |
| **miyabi-voice** | miyabi-voice | Python | ウェイクワード音声アシスタント (Whisper+EdgeTTS+Google Home) |
| **miyabi-discord** | miyabi-discord | Shell | コミュニティ運営。14体AIエージェント。50人定員制 |
| **miyabi-claude-plugins** | miyabi-claude-plugins | Shell | 25+ Agents, 22 Skills, 50+ Commands |
| **MiyabiDash** | MiyabiDash | Swift | iOS Dashboard (Widget, Dynamic Island, Siri) |
| **KOTOWARI** | KOTOWARI | TypeScript | AIコース生成 (Next.js + Gemini) |
| **kaisha-setup-kit** | kaisha-setup-kit | - | AI法人設立ツールキット |

### 2.3 依存関係グラフ

```
npx miyabi (統一CLI)
│
├── agent-skill-bus ←──── Self-Improving Loop
│   ├── Prompt Request Bus (DAGタスクキュー)
│   ├── Self-Improving Skills (品質自動改善)
│   └── Knowledge Watcher (変更検知)
│
├── miyabi-mcp-bundle ←── context_engineering_MCP
│
├── GitNexus (gitnexus-stable)
│   └── gitnexus-stable-ops (運用ツールキット)
│
├── ARIA LDD+ADD (品質保証ループ)
│   ├── 8フェーズ: 状態読込→計画→実行→テスト→監査→コミット→ログ→次ループ
│   ├── CKO品質エンジン (blocker/major/minor)
│   ├── Secret Scan (pre-commit)
│   └── project_memory/ (state, logs, audit, learnings)
│
├── voice-os ←── miyabi-voice (統合予定)
│   └── miyabi-yomiage
│
├── miyabi-discord
│   └── PPAL (メンバーシップ)
│
├── miyabi-claude-plugins ←── skills-market (統合予定)
│
├── MiyabiDash
├── KOTOWARI
└── kaisha-setup-kit
```

---

## 3. インフラストラクチャ

### 3.1 分散クラスター（6台）

| Host | ホスト名 | 役割 | CPU | RAM | ディスク | OpenClaw | ツール |
|------|---------|------|-----|-----|---------|----------|--------|
| **macbook** | MacBook Pro | オーケストレーター | 10C | 24GB | 926GB(5%) | Node v2026.3.11 | Claude/Codex/gh/npm |
| **mainmini** | shuhayas001 | ワーカー1(重処理) | 12C | **48GB** | 460GB(7%) | Node v2026.3.2 | Claude/Codex/gh |
| **macmini2** | shuhayas002 | ワーカー2 | 10C | 16GB | 228GB(31%) | Node v2026.3.2 | Claude/Codex/gh |
| **mini3** | 003noMac-mini | ワーカー3 | 10C | 16GB | 228GB(11%) | Node (CLIなし) | **要セットアップ** |
| **Windows AAI** | AAI | **Gateway** | - | - | - | Gateway v2026.3.11 | 要確認 |
| **Pixel 9 Pro XL** | localhost | 指令端末 | - | - | - | なし | Claude v2.1.80 |

**合計: 42コア / 104GB RAM / 1.8TB ストレージ**

### 3.2 ネットワーク

| サービス | エンドポイント | 状態 |
|---------|--------------|------|
| OpenClaw Gateway | `wss://aai.tailba4b9d.ts.net:443` | LIVE |
| OpenClaw Dashboard | `http://192.168.0.34:18789/` | LIVE |
| VOICEVOX | `http://localhost:50021` (macbook) | v0.25.0 |
| Google Home (寝室) | Chromecast | OK |
| Google Home (オフィス) | Chromecast | OK |
| Tailscale | 全マシン接続 | OK |

### 3.3 OpenClawエージェント（10体）

| Agent ID | 役割 | Heartbeat |
|----------|------|-----------|
| main | メインエージェント | 1h |
| android-dev | Android開発 | disabled |
| ctx-eng | コンテキストエンジニアリング | disabled |
| github-hook | GitHub連携 | disabled |
| guardian | セキュリティ監視 | disabled |
| kotowari-dev | KOTOWARI開発 | disabled |
| sns-analytics | SNS分析 | disabled |
| sns-creator | SNSコンテンツ作成 | disabled |
| sns-engagement | SNSエンゲージメント | disabled |
| sns-strategist | SNS戦略 | disabled |

### 3.4 Cron（macbook）

| 頻度 | スクリプト | 役割 |
|------|-----------|------|
| */5 (→*/1予定) | gate-watcher | Discord ゲート通過チェック |
| */5 (→*/1予定) | member-watcher | Discord 新規メンバー検出 |
| */3 | discord-router | Discord メッセージルーティング |
| 毎時 | gateway-monitor | OpenClaw Gateway監視 |
| 毎日09:03 | daily-automation | 日次自動化 |
| 毎週月 | engagement | エンゲージメント施策 |
| 毎日08:30 | backup | データバックアップ |
| 毎日03:00 | gitnexus-reindex | GitNexus再インデックス |
| 毎日17:00 | health-pipeline | Oura健康データ収集 |

---

## 4. 前提条件と欠落事項

### 4.1 ブロッカー（要オーナー操作）
1. **macbook npm未ログイン** → `npm login` をmacbookターミナルで実行
2. **macbook crontab変更不可** → `bash /tmp/fix-cron-169.sh` をmacbookターミナルで実行

### 4.2 要セットアップ
3. **mini3にツール未インストール** → Node.js, Claude Code, gh CLIのインストール
4. **OpenClaw CLIバージョン不一致** → mainmini/macmini2を2026.3.11に更新

### 4.3 認証情報
- GitHub: `GITHUB_TOKEN` (macbook tokens.conf)
- Twitter/X: OAuth token (macbook `~/.twitter_oauth_token.json`)
- Discord Bot: `DISCORD_BOT_TOKEN` (macbook tokens.conf)

---

## 5. マスタープラン（マイルストーン）

### Milestone 1: 基盤リリース整備（〜2026-03-23）
- [#175] agent-skill-bus v1.2.0 GitHub Release
- [#176] miyabi-yomiage v1.0.0 Release
- [#177] crontab 5分→1分修正
- [ ] voice-os v2.1.0 Release
- [ ] Miyabi rootバージョン同期

### Milestone 2: コンソリデーション（〜2026-03-27）
- [ ] miyabi-voice → voice-osに統合
- [ ] skills-market → miyabi-claude-pluginsに統合
- [ ] 重複リポのアーカイブ判断

### Milestone 3: CLI統合（〜2026-04-03）
- [ ] Miyabi CLI `cycle` サブコマンド追加
- [ ] Miyabi CLI `voice` サブコマンド追加
- [ ] Miyabi CLI `release` サブコマンド追加
- [ ] agent-skill-busをdependencyに追加
- [ ] Miyabi v0.20.0 リリース

### Milestone 4: 品質パイプライン（〜2026-04-10）
- [ ] 致命的スキル3件修正
- [ ] CI未設定リポにGitHub Actions追加
- [ ] 自動リリースCI構築
- [ ] MiyabiDash統合

**カンバンボード**: https://github.com/users/ShunsukeHayashi/projects/4

---

## 6. 操作コマンド一覧

### どの端末からでも使えるコマンド

```bash
# タスク管理
~/bin/tasks list          # 全オープンIssue
~/bin/tasks p0            # P0/P1のみ
~/bin/tasks view <N>      # Issue詳細

# フィードバックループ
~/bin/cycle full          # CHECK→DISPATCH→HEALTH→RECORD→REPORT
~/bin/cycle check         # 状態検知のみ
~/bin/cycle status        # JSON状態表示

# OpenClawエージェント
ssh macbook "openclaw status"
ssh macbook "openclaw agent -m 'メッセージ' --agent main"

# Skill Bus
ssh macbook "cd ~/dev/HAYASHI_SHUNSUKE && npx agent-skill-bus stats"
ssh macbook "cd ~/dev/HAYASHI_SHUNSUKE && npx agent-skill-bus flagged"
ssh macbook "cd ~/dev/HAYASHI_SHUNSUKE && npx agent-skill-bus health"

# Miyabi CLI
ssh macbook "cd ~/dev/HAYASHI_SHUNSUKE && npx miyabi status --json"
ssh macbook "cd ~/dev/HAYASHI_SHUNSUKE && npx miyabi doctor"

# 音声出力
~/bin/announce 'メッセージ'
~/bin/announce 'メッセージ' --both 寝室

# リリースアナウンス
~/bin/release-announce ShunsukeHayashi/<repo>
```

---

## 7. エージェント行動規範

1. **この仕様書を唯一の真実のソースとする**
2. タスク実行前にマスタープランの該当Milestoneを確認する
3. agent-skill-busのロック機構で競合を防止する
4. タスク完了後は `npx agent-skill-bus record-run` で記録する
5. 全変更がゴール（npx miyabi統一）に向かっているか自問する
6. 重要な完了・エラーは `~/bin/announce` で音声通知する
7. OpenClawの設定変更は禁止（読み取り・メッセージ送信のみ）
8. リリースはオーナー確認後に実行する
9. `.env`, credentials, secrets は絶対にコミットしない
10. 分散実行時はmainmini(48GB)に重い処理を割り当てる

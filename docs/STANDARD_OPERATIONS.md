# Miyabi Standard Operations Guide
## 標準オペレーションマニュアル v1.0

**発行日**: 2026-03-20
**対象**: 全エージェント・全端末
**オーナー**: 林駿甫 (Shunsuke Hayashi)

---

## 1. 日次オペレーション（毎日やること）

### 1.1 セッション開始時
```bash
# 1. フルサイクル実行（全システム状態確認）
npx miyabi cycle check

# 2. P0/P1タスク確認
~/bin/tasks p0

# 3. GNIインデックス確認
cd ~/dev/HAYASHI_SHUNSUKE && ~/.local/bin/gitnexus-stable status
cd ~/dev/Miyabi && ~/.local/bin/gitnexus-stable status
```

### 1.2 開発作業時
```bash
# 1. 変更前: GNI影響分析（必須）
~/.local/bin/gitnexus-stable impact <変更対象シンボル>

# 2. ブランチ作成
git checkout -b feat/<機能名>

# 3. 実装

# 4. 変更後: GNI再インデックス
~/.local/bin/gitnexus-stable analyze

# 5. コミット → PR → マージ
git add <ファイル>
git commit -m "feat: 内容"
git push -u origin feat/<機能名>
gh pr create --title "タイトル" --body "内容"

# 6. Skill Busに記録
npx agent-skill-bus record-run --agent <agent> --skill <skill> --task "<task>" --result success --score 0.9
```

### 1.3 リリース時
```bash
# 1. バージョンバンプ
npm version patch  # or minor / major

# 2. タグ作成 → pushで自動CIが走る
git tag v0.21.0
git push origin v0.21.0
# → auto-release.yml が自動実行:
#    npm publish → GitHub Release → X Announce

# 3. 手動の場合
npx miyabi release list        # 現在のリリース確認
~/bin/release-announce ShunsukeHayashi/Miyabi  # Xアナウンス
```

### 1.4 セッション終了時
```bash
# 1. 全リポのgit status確認
~/bin/cycle check

# 2. 未コミット変更があればコミット

# 3. 音声報告
~/bin/announce "セッション終了。全リポクリーン。"
```

---

## 2. コマンド一覧

### 2.1 Miyabi CLI（npx miyabi）
| コマンド | 用途 |
|---------|------|
| `npx miyabi cycle check` | システム状態確認 |
| `npx miyabi cycle full` | フルフィードバックループ |
| `npx miyabi release list` | 全プロダクトリリース一覧 |
| `npx miyabi release announce <repo>` | Xアナウンス |
| `npx miyabi voice status` | 音声システム状態 |
| `npx miyabi skills list` | スキル一覧（90件） |
| `npx miyabi skills health` | スキルヘルスチェック |
| `npx miyabi status --json` | プロジェクト状態 |
| `npx miyabi doctor` | システム診断 |
| `npx miyabi auto` | Water Spider全自動モード |
| `npx miyabi agent run <name>` | Agent実行 |

### 2.2 Pixel端末コマンド（~/bin/）
| コマンド | 用途 |
|---------|------|
| `~/bin/cycle full` | フルサイクル実行 |
| `~/bin/cycle check` | 状態チェック |
| `~/bin/cycle distributed 300` | 分散マルチエージェント |
| `~/bin/tasks list` | GitHub Issues一覧 |
| `~/bin/tasks p0` | P0/P1タスクのみ |
| `~/bin/tasks add "タイトル"` | 新規Issue作成 |
| `~/bin/announce "メッセージ"` | 音声出力 |
| `~/bin/release-announce <repo>` | リリースXアナウンス |

### 2.3 GNI（GitNexus Impact Analysis）
| コマンド | 用途 |
|---------|------|
| `gitnexus-stable status` | インデックス状態 |
| `gitnexus-stable analyze` | 再インデックス |
| `gitnexus-stable impact <target>` | 影響分析 |
| `gitnexus-stable context <symbol>` | 360度ビュー |
| `gitnexus-stable query "<query>"` | ナレッジ検索 |
| `gitnexus-stable list` | インデックス済みリポ一覧 |

### 2.4 Agent Skill Bus
| コマンド | 用途 |
|---------|------|
| `npx agent-skill-bus stats` | キュー統計 |
| `npx agent-skill-bus dispatch` | 次タスク取得 |
| `npx agent-skill-bus health` | スキルヘルス |
| `npx agent-skill-bus flagged` | 問題スキル一覧 |
| `npx agent-skill-bus enqueue ...` | タスクキューに追加 |
| `npx agent-skill-bus record-run ...` | 実行結果記録 |

### 2.5 OpenClaw
| コマンド | 用途 |
|---------|------|
| `openclaw status` | Gateway/Node状態 |
| `openclaw agent -m "msg" --agent main` | エージェントにメッセージ |

---

## 3. フィードバックループ

```
┌─────────────────────────────────────────────────────┐
│           Miyabi フィードバックループ                  │
│                                                     │
│  CHECK ──→ DISPATCH ──→ EXECUTE ──→ RECORD ──→ REPORT │
│    │                                          │     │
│    └──────── Self-Improving Skills ←──────────┘     │
│                                                     │
│  1. CHECK: SSH接続・OpenClaw・スキル品質・キュー      │
│  2. DISPATCH: DAG依存解決・優先度ルーティング         │
│  3. EXECUTE: 各マシンで並列実行                      │
│  4. RECORD: agent-skill-busに結果記録               │
│  5. REPORT: Google Home音声報告                     │
└─────────────────────────────────────────────────────┘
```

---

## 4. インフラ構成

| マシン | 役割 | スペック |
|--------|------|---------|
| macbook | オーケストレーター | 10C/24GB/926GB |
| mainmini | ワーカー1（重処理） | 12C/48GB/460GB |
| macmini2 | ワーカー2 | 10C/16GB/228GB |
| mini3 | ワーカー3 | 10C/16GB/228GB |
| Windows AAI | OpenClaw Gateway | - |
| Pixel 9 Pro XL | 指令端末（Voice-First） | - |

---

## 5. Issue管理ルール

| リポジトリ | 対象 |
|-----------|------|
| **Miyabi** | コード変更を伴うプロダクト開発タスク |
| **HAYASHI_SHUNSUKE** | オペレーション・ビジネス・インフラ・個人タスク |

---

## 6. リリースフロー

```
コード変更 → PR → Review → Merge
    ↓
git tag vX.Y.Z && git push origin vX.Y.Z
    ↓
auto-release.yml が自動実行
    ↓
npm publish → GitHub Release → X Announce
    ↓
npx miyabi release list で確認
```

---

## 7. 音声制御

```bash
# Google Home + VoiceBox 同時出力
~/bin/announce "メッセージ"

# デバイス指定
~/bin/announce "メッセージ" --both 寝室
~/bin/announce "メッセージ" --voicebox

# VOICEVOX設定
# macbook localhost:50021 で稼働中
```

---

## 8. トラブルシューティング

| 症状 | 対処 |
|------|------|
| SSH接続失敗 | `ssh -o ConnectTimeout=20 <host> "echo OK"` で再テスト |
| GNIインデックスstale | `gitnexus-stable analyze` で再構築 |
| スキルflagged | `npx agent-skill-bus record-run` でスコア更新 |
| OpenClaw障害 | `openclaw status` で確認、Gateway再起動は要確認 |
| npm publish失敗 | `npm whoami` でログイン確認、`--ignore-scripts` で再試行 |
| crontab変更不可 | osascript経由: `osascript -e tell app Terminal to do script ...` |

---

**このドキュメントはMiyabiマスタースペック (docs/MASTER_SPEC.md) と併せて参照すること。**

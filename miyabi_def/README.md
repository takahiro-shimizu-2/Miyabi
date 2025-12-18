# Miyabi Definition System

**Version**: 1.0.0
**Format**: Jinja2 + YAML
**Generated**: 2025-10-31

## 概要

Miyabiプロジェクトの完全な定義を、構造化されたYAMLフォーマットで提供します。Jinja2テンプレートシステムを使用することで、モジュール化・保守性・拡張性を実現しています。

### Phase 1 (Foundation) - ✅ Complete

**Foundation Variable Files** (4,290 lines):
- `entities.yaml` (1,420 lines) - 14 Core Entities (E1-E14)
- `relations.yaml` (1,350 lines) - 39 Relations (R1-R39) with N1/N2/N3 notation
- `labels.yaml` (840 lines) - 57 Labels across 11 categories
- `workflows.yaml` (680 lines) - 5 Core Workflows (W1-W5) with 38 stages

**Foundation Templates** (4 files):
- `entities.yaml.j2` (287 lines) - Handles both dict and list attributes
- `relations.yaml.j2` (185 lines) - Comprehensive relation rendering
- `labels.yaml.j2` (180 lines) - All 11 label categories
- `workflows.yaml.j2` (130 lines) - Full workflow specifications

**Generated Outputs** (8 files, 152KB total):
- Successfully generating all foundation files with correct structure
- YAML validation passed for all files
- Entity/Relation/Label/Workflow counts match source data

## ディレクトリ構造

```
miyabi_def/
├── INDEX.yaml              # マスターインデックス
├── README.md               # このファイル
├── generate.py             # YAML生成スクリプト
│
├── variables/              # 変数定義ファイル (15 files)
│   ├── global.yaml         # グローバル変数
│   ├── world_definition.yaml  # 🌍 World Space定義 (W) ⭐ NEW
│   ├── step_back_question_method.yaml  # 📚 Step-back Question Method (SWML) ⭐ NEW
│   ├── entities.yaml       # 14 Entities定義
│   ├── relations.yaml      # 39 Relations定義
│   ├── labels.yaml         # 57 Labels定義
│   ├── workflows.yaml      # 5 Workflows定義
│   ├── agents.yaml         # 21 Agents定義
│   ├── crates.yaml         # 15 Crates定義
│   ├── skills.yaml         # 18 Skills定義
│   ├── universal_execution.yaml  # Ω-System定義
│   ├── autonomous_operation_protocol.yaml  # 自律運用プロトコル
│   ├── pr_merge_rules.yaml  # PRマージルール
│   ├── naming_conventions.yaml  # 命名規則
│   └── tool_description_rules.yaml  # ツール表示ルール
│
├── templates/              # Jinja2テンプレート (11 files)
│   ├── base.yaml.j2        # ベーステンプレート
│   ├── world_definition.yaml.j2  # 🌍 World Space テンプレート ⭐ NEW
│   ├── step_back_question_method.yaml.j2  # 📚 Step-back Method テンプレート ⭐ NEW
│   ├── entities.yaml.j2    # Entities定義テンプレート
│   ├── relations.yaml.j2   # Relations定義テンプレート
│   ├── labels.yaml.j2      # Labels定義テンプレート
│   ├── workflows.yaml.j2   # Workflows定義テンプレート
│   ├── agents.yaml.j2      # Agents定義テンプレート
│   ├── crates.yaml.j2      # Crates定義テンプレート
│   ├── skills.yaml.j2      # Skills定義テンプレート
│   └── universal_task_execution.yaml.j2  # Ω-System テンプレート
│
├── generated/              # 生成されたYAMLファイル (11 files, 191KB)
│   ├── world_definition.yaml  # 🌍 World Space完全定義 (21KB) ⭐ NEW
│   ├── step_back_question_method.yaml  # 📚 Step-back Method完全定義 (18KB) ⭐ NEW
│   ├── entities.yaml       # 14 Entities完全定義 (39KB)
│   ├── relations.yaml      # 39 Relations完全定義 (25KB)
│   ├── labels.yaml         # 57 Labels完全定義 (14KB)
│   ├── workflows.yaml      # 5 Workflows完全定義 (13KB)
│   ├── agents.yaml         # 21 Agents完全定義 (9.4KB)
│   ├── crates.yaml         # 15 Crates完全定義 (6.3KB)
│   ├── skills.yaml         # 18 Skills完全定義 (7.6KB)
│   ├── universal_task_execution.yaml  # Ω-System (21KB)
│   └── agent_execution_maximization.yaml  # Agent実行最大化 (23KB)
│
└── .venv/                  # Python仮想環境 (gitignored)
```

## 使い方

### 1. セットアップ

```bash
cd miyabi_def

# Python仮想環境を作成
python3 -m venv .venv
source .venv/bin/activate

# 依存関係をインストール
pip install pyyaml jinja2
```

### 2. 定義ファイルの生成

```bash
# 全ての定義ファイルを生成
python generate.py

# 利用可能なテンプレート一覧
python generate.py --list-templates

# 利用可能な変数ファイル一覧
python generate.py --list-variables

# Intent を用いた動的生成
python generate.py --intent intents/sample-product-intent.yaml
```

#### Intent 駆動生成について

- Intent ファイル（YAML）にプロジェクト目的や生成対象テンプレートを記述すると、  
  `generate.py` が自動的にテンプレート順序と変数を決定し、成果物を出力します。
- Intent のスキーマは `intent-schema.yaml`、例は `intents/sample-product-intent.yaml` を参照。
- 詳細な手順は `../docs/miyabi-def-automation.md` にまとめています。

### 3. 生成されたファイルの確認

```bash
# 生成されたファイルを確認
ls -lh generated/

# エージェント定義を表示
cat generated/agents.yaml

# Crate定義を表示
cat generated/crates.yaml

# スキル定義を表示
cat generated/skills.yaml
```

## コンポーネント

### Variables (変数定義)

#### `variables/global.yaml`
プロジェクト全体で共有されるグローバル変数
- プロジェクト名・バージョン
- リポジトリURL
- Rustツールチェーン情報
- 各種カウント（crates数、agents数等）

#### `variables/world_definition.yaml` 🌍 ⭐ NEW
**World Space (W)** の完全定義 - Ω-Systemの実行環境
- **§1-2: Temporal (時間次元)** - タイムゾーン、制約、ホライズン
- **§3: Spatial (空間次元)** - 物理・デジタル・抽象空間
- **§4: Contextual (文脈次元)** - ドメイン、ユーザー、システム、技術スタック
- **§5: Resources (リソース次元)** - 計算・人的・情報・財務リソース
- **§6: Environmental (環境次元)** - システム負荷、依存関係、制約、外部環境
- **§7-13: 状態管理・Ω統合・進化・ガバナンス・可観測性・拡張性・ロードマップ**

**数学的表現**: `Ψ(W) = ∫[t₀→t₁] ∇(s, c, r, e) dt`

この定義により、Ω-System (`Ω: I × W → R`) の **World (W)** が機械可読な形で記述されます。

#### `variables/step_back_question_method.yaml` 📚 ⭐ NEW
**Step-back Question Method** の完全数式化 - SWML (Shunsuke's World Model Logic)
- **数学的定義**: `F(Goal, Q) = ∫_{A}^{Z} f(step, Q) d(step) = Result`
- **26ステッププロセス (A to Z)**: 分析→分解→明確化→...→収束
- **Step-back Questions**: 本質を問う質問の集合 (Why/What if/How系)
- **品質メトリクス**: Step-back効果により品質が1.5~2倍向上
- **実装マッピング**: Rust型・関数への完全マッピング

**記号の意味**:
- `F` (大文字): Goal Achievement Function - ゴール全体達成関数
- `f` (小文字): Step Execution Function - 個別ステップ実行関数
- `Q`: Set of Step-back Questions - ステップバック質問の集合
- `[A, Z]`: 26-step process range - A(Analyze)からZ(Zero-in)までの26ステップ

**詳細**: `STEP_BACK_QUESTION_METHOD_CORRECTED.md` (論理的に厳密な修正版)

#### `variables/entities.yaml`
14個のCore Entity定義 (E1-E14)
- Issue, Task, Agent, PR, Label, QualityReport, Command, Escalation, Deployment, LDDLog, DAG, Worktree, DiscordCommunity, SubIssue
- 各Entityに完全な属性・型・実装情報

#### `variables/relations.yaml` ✨ NEW
39個のRelation定義 (R1-R39)
- N1 (1:1), N2 (1:N), N3 (N:N) cardinality notation
- 実装メソッド、トリガー条件、アルゴリズム詳細

#### `variables/labels.yaml` ✨ NEW
57個のLabel定義 (11カテゴリ)
- STATE (8), AGENT (6), PRIORITY (4), TYPE (7), SEVERITY (4), PHASE (5), SPECIAL (7), TRIGGER (4), QUALITY (4), COMMUNITY (4), HIERARCHY (4)
- 自動化ルール、状態遷移フロー

#### `variables/workflows.yaml` ✨ NEW
5個のWorkflow定義 (W1-W5, 38ステージ)
- Issue Creation & Triage → Task Decomposition → Code Implementation → Code Review → Deployment
- 各ステージの詳細、期間、ハンドラー、意思決定ポイント

#### `variables/agents.yaml`
21個のエージェント定義
- **Coding Agents (7)**: CoordinatorAgent, CodeGenAgent, ReviewAgent, IssueAgent, PRAgent, DeploymentAgent, RefresherAgent
- **Business Agents (14)**: 戦略企画系6個、マーケティング系5個、営業CRM系3個

#### `variables/crates.yaml`
15個のCrate定義
- **Core (3)**: miyabi-cli, miyabi-core, miyabi-types
- **Agents (2)**: miyabi-agents, miyabi-agent-business
- **Integrations (5)**: miyabi-github, miyabi-llm, miyabi-knowledge, miyabi-voice-guide, miyabi-mcp-server
- **Utilities (4)**: miyabi-worktree, miyabi-pty-manager, miyabi-tui, miyabi-web-api
- **Frontend (3)**: miyabi-desktop, miyabi-dashboard, miyabi-web

#### `variables/skills.yaml`
18個のスキル定義
- **Development (5)**: rust-development, debugging-troubleshooting, dependency-management, performance-analysis, security-audit
- **Operations (5)**: agent-execution, git-workflow, documentation-generation, issue-analysis, project-setup
- **Business (5)**: business-strategy-planning, content-marketing-strategy, market-research-analysis, sales-crm-management, growth-analytics-dashboard
- **Specialized (3)**: voicevox, lark-integration, knowledge-search

### Templates (Jinja2テンプレート)

#### `templates/base.yaml.j2`
全てのテンプレートの基底クラス
- メタデータブロック
- コンテンツブロック
- フッターブロック

#### `templates/agents.yaml.j2`
エージェント定義を生成するテンプレート
- `base.yaml.j2`を継承
- `agents.*`変数を使用

#### `templates/crates.yaml.j2`
Crate定義を生成するテンプレート
- `base.yaml.j2`を継承
- `crates.*`変数を使用

#### `templates/skills.yaml.j2`
スキル定義を生成するテンプレート
- `base.yaml.j2`を継承
- `skills.*`変数を使用

### Generator (生成スクリプト)

`generate.py` - Python3スクリプト
- Jinja2テンプレートエンジンを使用
- 全ての変数ファイルを読み込み
- テンプレートをレンダリング
- `generated/`ディレクトリに出力

## Jinja2フォーマットの利点

### 1. モジュール化
変数とテンプレートが分離されているため、更新が容易
```yaml
# variables/global.yaml
global:
  project:
    version: "0.1.2"  # ここだけ変更すれば全ファイルに反映
```

### 2. 再利用性
ベーステンプレートを全ての定義が継承
```jinja2
{% extends "base.yaml.j2" %}
```

### 3. 保守性
変数を一度変更すれば、全ファイルを再生成可能
```bash
python generate.py
```

### 4. 型安全性
YAML構造により、一貫したデータ型を保証

### 5. バージョン管理
変数ファイルと生成ファイルを分離して管理

### 6. 自動化
CI/CDパイプラインに統合可能

## 統計情報

- **変数ファイル**: 4個
- **テンプレートファイル**: 4個
- **生成ファイル**: 3個
- **合計サイズ**: 22,267 bytes

### エージェント
- **合計**: 21個
  - Coding: 7個
  - Business: 14個

### Crates
- **合計**: 15個
  - 5カテゴリに分類

### スキル
- **合計**: 18個
  - 4カテゴリに分類

## 今後の拡張予定

1. **architecture.yaml** - システムアーキテクチャ定義
2. **entity_relation.yaml** - エンティティ関係モデル (14 entities, 39 relations)
3. **labels.yaml** - 57ラベルシステム定義
4. **workflows.yaml** - GitHub Actionsワークフロー定義
5. **configuration.yaml** - `.miyabi.yml`と環境設定

## ユースケース

1. **ドキュメント生成** - 自動的に最新のドキュメントを生成
2. **プロジェクト分析** - 構造化データとして分析
3. **CI/CD統合** - パイプラインでの自動検証
4. **オンボーディング** - 新規開発者への説明資料
5. **API生成** - スキーマからAPIを自動生成
6. **スキーマ検証** - YAMLスキーマによる検証

## Miyabiプロジェクトとの統合

- **プロジェクトパス**: `/Users/shunsuke/Dev/miyabi-private/miyabi_def/`
- **統合**: Miyabiコアプロジェクトの一部
- **目的**: 構造化された機械可読なプロジェクト定義の提供

## メンテナンス

### 変数の更新

1. 該当する変数ファイルを編集
   ```bash
   vim variables/agents.yaml
   ```

2. 定義ファイルを再生成
   ```bash
   python generate.py
   ```

3. 変更を確認
   ```bash
   git diff generated/
   ```

### 新しいテンプレートの追加

1. 新しい変数ファイルを作成
   ```bash
   vim variables/new_component.yaml
   ```

2. 新しいテンプレートを作成
   ```bash
   vim templates/new_component.yaml.j2
   ```

3. ベーステンプレートを継承
   ```jinja2
   {% extends "base.yaml.j2" %}
   {% block content %}
   # Your content here
   {% endblock %}
   ```

4. 生成
   ```bash
   python generate.py
   ```

## ライセンス

Apache-2.0

## 作成者

Miyabi Team

---

**Last Updated**: 2025-10-31
**Version**: 1.0.0

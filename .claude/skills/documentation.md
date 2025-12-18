---
name: documentation
description: ドキュメント作成のベストプラクティス。README、API仕様、技術文書。
triggers: ["docs", "readme", "ドキュメント", "documentation"]
---

# 📝 ドキュメントスキル

## 概要

効果的なドキュメント作成のガイドライン。読み手に価値を提供する文書を作成する。

## ドキュメントの種類

| 種類 | 目的 | 読者 |
|------|------|------|
| README | プロジェクト紹介 | 全員 |
| Getting Started | 導入ガイド | 新規ユーザー |
| API Reference | API仕様 | 開発者 |
| Architecture | 設計文書 | 開発者・アーキテクト |
| Contributing | 貢献ガイド | コントリビューター |
| Changelog | 変更履歴 | 全員 |

## README テンプレート

```markdown
# プロジェクト名

[![npm version](https://badge.fury.io/js/package-name.svg)](https://www.npmjs.com/package/package-name)
[![CI](https://github.com/owner/repo/workflows/CI/badge.svg)](https://github.com/owner/repo/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

一言で何をするプロジェクトか説明。

## ✨ 特徴

- 🚀 特徴1の説明
- 💡 特徴2の説明
- 🔒 特徴3の説明

## 📦 インストール

\`\`\`bash
npm install package-name
\`\`\`

## 🚀 クイックスタート

\`\`\`typescript
import { Something } from 'package-name';

const result = Something.doSomething();
console.log(result);
\`\`\`

## 📖 ドキュメント

詳細なドキュメントは [こちら](./docs) を参照してください。

- [Getting Started](./docs/getting-started.md)
- [API Reference](./docs/api.md)
- [Examples](./examples)

## 🤝 貢献

貢献を歓迎します！[CONTRIBUTING.md](./CONTRIBUTING.md) をご覧ください。

## 📄 ライセンス

MIT License - 詳細は [LICENSE](./LICENSE) を参照
```

## API ドキュメント

### TSDoc コメント

```typescript
/**
 * ユーザーを作成します。
 *
 * @param data - ユーザー作成に必要なデータ
 * @returns 作成されたユーザー
 * @throws {ValidationError} データが不正な場合
 * @throws {ConflictError} メールアドレスが既に存在する場合
 *
 * @example
 * ```typescript
 * const user = await createUser({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 * });
 * console.log(user.id);
 * ```
 *
 * @see {@link updateUser} ユーザー更新
 * @since 1.0.0
 */
async function createUser(data: CreateUserInput): Promise<User> {
  // implementation
}

/**
 * ユーザー作成の入力データ
 */
interface CreateUserInput {
  /** ユーザー名（1-100文字） */
  name: string;
  /** メールアドレス */
  email: string;
  /** 年齢（オプション） */
  age?: number;
}
```

### OpenAPI 仕様

```yaml
# openapi.yaml
openapi: 3.0.3
info:
  title: My API
  version: 1.0.0
  description: API description

servers:
  - url: https://api.example.com/v1
    description: Production

paths:
  /users:
    post:
      summary: Create a user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserInput'
      responses:
        '201':
          description: User created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '400':
          description: Validation error
        '409':
          description: Email already exists

components:
  schemas:
    User:
      type: object
      required:
        - id
        - name
        - email
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        email:
          type: string
          format: email
        age:
          type: integer
          minimum: 0

    CreateUserInput:
      type: object
      required:
        - name
        - email
      properties:
        name:
          type: string
          minLength: 1
          maxLength: 100
        email:
          type: string
          format: email
        age:
          type: integer
          minimum: 0
```

## アーキテクチャドキュメント

### ADR (Architecture Decision Record)

```markdown
# ADR-001: データベースの選択

## ステータス
承認済み

## コンテキスト
ユーザーデータを永続化するデータベースを選択する必要がある。
要件：
- 高い読み取りスループット
- スキーマの柔軟性
- 水平スケーラビリティ

## 決定
PostgreSQLを使用する。

## 理由
- JSONB型でスキーマレスなデータも格納可能
- 読み取りレプリカによるスケーラビリティ
- チームに経験者が多い
- 豊富なエコシステム

## 代替案
- MongoDB: スキーマレスだが、トランザクション管理が複雑
- MySQL: JSONB相当の機能が弱い
- DynamoDB: 学習コストが高い

## 影響
- マイグレーションツールにPrismaを採用
- ローカル開発環境にDockerを使用
- バックアップ戦略を定義する必要あり

## 日付
2025-01-15
```

### システム図

```markdown
## システムアーキテクチャ

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Web App   │  │ Mobile App  │  │   CLI       │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
└─────────┼────────────────┼────────────────┼─────────────────┘
          │                │                │
          └────────────────┼────────────────┘
                           │ HTTPS
┌──────────────────────────┼──────────────────────────────────┐
│                   API Gateway (Kong)                        │
└──────────────────────────┼──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
┌───────▼───────┐  ┌───────▼───────┐  ┌───────▼───────┐
│  Auth Service │  │  User Service │  │ Order Service │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                     Data Layer                              │
├──────────────────────────┼──────────────────────────────────┤
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐         │
│  │   Redis     │  │ PostgreSQL  │  │    S3       │         │
│  │  (Cache)    │  │    (DB)     │  │  (Storage)  │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────────────────────┘
\`\`\`
```

## Changelog

### Keep a Changelog 形式

```markdown
# Changelog

このプロジェクトのすべての重要な変更を記録します。
フォーマットは [Keep a Changelog](https://keepachangelog.com/) に基づいています。

## [Unreleased]

### Added
- 新機能の説明

### Changed
- 変更の説明

### Deprecated
- 非推奨になった機能

### Removed
- 削除された機能

### Fixed
- バグ修正

### Security
- セキュリティ修正

## [1.0.0] - 2025-01-15

### Added
- 初期リリース
- ユーザー認証機能
- REST API実装

### Security
- JWT認証を実装

[Unreleased]: https://github.com/owner/repo/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/owner/repo/releases/tag/v1.0.0
```

## Contributing ガイド

```markdown
# 貢献ガイド

プロジェクトへの貢献をありがとうございます！

## 開発環境のセットアップ

\`\`\`bash
# リポジトリをクローン
git clone https://github.com/owner/repo.git
cd repo

# 依存関係をインストール
npm install

# 開発サーバーを起動
npm run dev

# テストを実行
npm test
\`\`\`

## 開発フロー

1. **Issue を確認**: 取り組むIssueを選ぶか、新しいIssueを作成
2. **ブランチを作成**: \`feature/123-description\`
3. **変更を実装**: テストを書きながら実装
4. **コミット**: Conventional Commits形式で
5. **PR を作成**: テンプレートに従って記述

## コーディング規約

- ESLint/Prettier の設定に従う
- TypeScript strict mode
- テストカバレッジ 80% 以上

## コミットメッセージ

Conventional Commits形式を使用:

\`\`\`
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
\`\`\`

## プルリクエスト

- 1つのPRは1つの目的
- セルフレビューを実施
- テストが通っていることを確認
- レビュアーを指定

## 質問・議論

- [Discussions](https://github.com/owner/repo/discussions) で質問
- [Discord](https://discord.gg/xxx) でチャット
```

## ドキュメント生成ツール

### TypeDoc

```bash
npm install -D typedoc

# 設定ファイル
# typedoc.json
{
  "entryPoints": ["src/index.ts"],
  "out": "docs/api",
  "plugin": ["typedoc-plugin-markdown"],
  "excludePrivate": true,
  "excludeProtected": true
}

# 生成
npx typedoc
```

### VitePress

```bash
npm install -D vitepress

# 初期化
npx vitepress init

# 開発サーバー
npx vitepress dev docs

# ビルド
npx vitepress build docs
```

## 書き方のコツ

### 読者を意識

```markdown
# ❌ 読者を考慮していない
データをJSONに変換してAPIにPOSTする

# ✅ 読者を考慮
ユーザー情報を登録するには、以下のように
JSON形式でデータを送信します：

\`\`\`bash
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John", "email": "john@example.com"}'
\`\`\`
```

### 例を示す

```markdown
# ❌ 例がない
認証にはBearerトークンを使用します。

# ✅ 例がある
認証にはBearerトークンを使用します：

\`\`\`bash
curl https://api.example.com/users \
  -H "Authorization: Bearer YOUR_TOKEN"
\`\`\`
```

## チェックリスト

### README

- [ ] プロジェクトの目的が明確
- [ ] インストール方法がある
- [ ] 基本的な使用例がある
- [ ] ライセンスが明記されている

### API ドキュメント

- [ ] 全エンドポイントが記載
- [ ] リクエスト/レスポンス例がある
- [ ] エラーケースが説明されている
- [ ] 認証方法が説明されている

### コードコメント

- [ ] 公開APIにTSDocがある
- [ ] 「なぜ」が説明されている
- [ ] 例が含まれている
- [ ] 古いコメントが更新されている

## 参照

- [Google Developer Documentation Style Guide](https://developers.google.com/style)
- [Write the Docs](https://www.writethedocs.org/)
- [TSDoc](https://tsdoc.org/)
- [Keep a Changelog](https://keepachangelog.com/)

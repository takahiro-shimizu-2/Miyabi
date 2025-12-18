---
name: ci-cd
description: CI/CDパイプラインの構築と運用。自動テスト、ビルド、デプロイ。
triggers: ["ci", "cd", "deploy", "github actions", "デプロイ"]
---

# 🚀 CI/CD スキル

## 概要

継続的インテグレーション（CI）と継続的デリバリー（CD）のベストプラクティス。

## CI/CD パイプライン構成

```
┌──────────────────────────────────────────────────────────────┐
│                        CI Pipeline                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Push/PR ─► Lint ─► Test ─► Build ─► Security Scan          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                        CD Pipeline                           │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  main merge ─► Build ─► Deploy Staging ─► E2E Test           │
│                              │                               │
│                              ▼                               │
│                       Deploy Production                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## GitHub Actions

### 基本的なCI設定

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck

  test:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm test -- --coverage
      
      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  build:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - uses: actions/upload-artifact@v4
        with:
          name: build
          path: dist/
```

### デプロイワークフロー

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      environment:
        description: 'Deploy environment'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production

jobs:
  deploy-staging:
    runs-on: ubuntu-latest
    environment: staging
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Staging
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          npm run deploy:staging

  e2e-test:
    runs-on: ubuntu-latest
    needs: deploy-staging
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run E2E Tests
        env:
          BASE_URL: ${{ vars.STAGING_URL }}
        run: npm run test:e2e

  deploy-production:
    runs-on: ubuntu-latest
    needs: e2e-test
    if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'production'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run build
      
      - name: Deploy to Production
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
        run: |
          npm run deploy:production
```

### リリース自動化

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    tags:
      - 'v*'

permissions:
  contents: write
  packages: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          registry-url: 'https://registry.npmjs.org'
      
      - run: npm ci
      - run: npm run build
      - run: npm test
      
      - name: Publish to npm
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
      
      - name: Generate Changelog
        id: changelog
        uses: metcalfc/changelog-generator@v4
        with:
          myToken: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          body: ${{ steps.changelog.outputs.changelog }}
          files: |
            dist/*
```

## Docker

### マルチステージビルド

```dockerfile
# Dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# セキュリティ: 非rootユーザー
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://postgres:password@db:5432/app
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=app

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## 環境管理

### Environments

```yaml
# GitHub Environments設定
# Settings > Environments

staging:
  - DEPLOY_TOKEN (secret)
  - API_URL (variable)
  - Required reviewers: none
  - Wait timer: 0

production:
  - DEPLOY_TOKEN (secret)
  - API_URL (variable)
  - Required reviewers: 2
  - Wait timer: 30 minutes
```

### Secrets管理

```yaml
# 使用例
steps:
  - name: Deploy
    env:
      API_KEY: ${{ secrets.API_KEY }}
      DATABASE_URL: ${{ secrets.DATABASE_URL }}
    run: ./deploy.sh

# 動的シークレット
- name: Get secrets from Vault
  uses: hashicorp/vault-action@v2
  with:
    url: ${{ secrets.VAULT_ADDR }}
    token: ${{ secrets.VAULT_TOKEN }}
    secrets: |
      secret/data/app api_key | API_KEY
```

## 品質ゲート

### ブランチ保護

```yaml
# 設定: Settings > Branches > Branch protection rules

main:
  - Require pull request reviews: 1
  - Require status checks:
    - lint
    - test
    - build
  - Require conversation resolution
  - Require signed commits
  - Include administrators
```

### PR チェック

```yaml
# .github/workflows/pr-check.yml
name: PR Check

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  size-label:
    runs-on: ubuntu-latest
    steps:
      - uses: codelytv/pr-size-labeler@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          xs_label: 'size/XS'
          xs_max_size: '50'
          s_label: 'size/S'
          s_max_size: '200'
          m_label: 'size/M'
          m_max_size: '500'
          l_label: 'size/L'
          l_max_size: '1000'
          xl_label: 'size/XL'

  conventional-commits:
    runs-on: ubuntu-latest
    steps:
      - uses: amannn/action-semantic-pull-request@v5
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## モニタリング

### デプロイ通知

```yaml
- name: Notify Slack
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author,action,eventName,ref,workflow
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### デプロイ追跡

```yaml
- name: Create deployment
  uses: chrnorm/deployment-action@v2
  id: deployment
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    environment: production

- name: Deploy
  run: ./deploy.sh

- name: Update deployment status
  uses: chrnorm/deployment-status@v2
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    deployment-id: ${{ steps.deployment.outputs.deployment_id }}
    state: ${{ job.status }}
```

## ロールバック

### 手動ロールバック

```yaml
# .github/workflows/rollback.yml
name: Rollback

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version to rollback to'
        required: true
      environment:
        description: 'Environment'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  rollback:
    runs-on: ubuntu-latest
    environment: ${{ github.event.inputs.environment }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.inputs.version }}
      
      - name: Deploy previous version
        run: ./deploy.sh
```

## チェックリスト

### CI設定

- [ ] Lintが設定されている
- [ ] テストが自動実行される
- [ ] ビルドが検証される
- [ ] セキュリティスキャンがある

### CD設定

- [ ] ステージング環境がある
- [ ] 本番デプロイに承認が必要
- [ ] ロールバック手順がある
- [ ] デプロイ通知がある

### セキュリティ

- [ ] Secretsが適切に管理されている
- [ ] 最小権限の原則に従っている
- [ ] 依存関係が監査されている

## 参照

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Documentation](https://docs.docker.com/)
- [GitOps](https://www.gitops.tech/)

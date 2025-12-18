---
name: security-audit
description: セキュリティ監査とベストプラクティス。脆弱性の特定と対策。
triggers: ["security", "audit", "脆弱性", "セキュリティ"]
---

# 🔒 セキュリティ監査スキル

## 概要

アプリケーションのセキュリティを確保するための監査手法とベストプラクティス。

## セキュリティチェックリスト

### 入力バリデーション

```typescript
// ✅ Zodでバリデーション
import { z } from 'zod';

const UserInputSchema = z.object({
  email: z.string().email().max(255),
  name: z.string().min(1).max(100).regex(/^[a-zA-Z\s]+$/),
  age: z.number().int().positive().max(150),
});

function validateInput(data: unknown) {
  return UserInputSchema.parse(data);
}
```

### SQLインジェクション対策

```typescript
// ❌ 脆弱
const query = `SELECT * FROM users WHERE id = '${userId}'`;

// ✅ パラメータ化クエリ
const query = 'SELECT * FROM users WHERE id = $1';
await db.query(query, [userId]);

// ✅ ORMを使用
const user = await prisma.user.findUnique({
  where: { id: userId },
});
```

### XSS対策

```typescript
// ❌ 脆弱
element.innerHTML = userInput;

// ✅ テキストとして挿入
element.textContent = userInput;

// ✅ DOMPurifyでサニタイズ
import DOMPurify from 'dompurify';
element.innerHTML = DOMPurify.sanitize(userInput);

// ✅ React/Vueは自動エスケープ
<div>{userInput}</div>
```

### 認証・認可

```typescript
// JWT検証
import jwt from 'jsonwebtoken';

function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
  } catch (error) {
    throw new UnauthorizedError('Invalid token');
  }
}

// 認可チェック
async function authorize(userId: string, resource: string, action: string) {
  const permissions = await getPermissions(userId);
  if (!permissions.includes(`${resource}:${action}`)) {
    throw new ForbiddenError('Access denied');
  }
}
```

### パスワード管理

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

// パスワードハッシュ化
async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// パスワード検証
async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// パスワード強度チェック
function isStrongPassword(password: string): boolean {
  const minLength = 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return (
    password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecial
  );
}
```

## 依存関係の監査

### npm audit

```bash
# 脆弱性チェック
npm audit

# 自動修正
npm audit fix

# 詳細レポート
npm audit --json > audit-report.json
```

### Snyk

```bash
# インストール
npm install -g snyk

# 認証
snyk auth

# テスト
snyk test

# モニタリング
snyk monitor
```

## セキュリティヘッダー

### Helmet.js

```typescript
import helmet from 'helmet';
import express from 'express';

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
}));
```

### 推奨ヘッダー

| ヘッダー | 値 | 目的 |
|---------|-----|------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | HTTPS強制 |
| `X-Content-Type-Options` | `nosniff` | MIME-sniffing防止 |
| `X-Frame-Options` | `DENY` | クリックジャッキング防止 |
| `X-XSS-Protection` | `1; mode=block` | XSS防止 |
| `Content-Security-Policy` | (設定による) | XSS/インジェクション防止 |

## シークレット管理

### 環境変数

```typescript
// ❌ ハードコード
const apiKey = 'sk-1234567890abcdef';

// ✅ 環境変数
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is required');
}

// ✅ 型安全な環境変数
import { z } from 'zod';

const EnvSchema = z.object({
  API_KEY: z.string().min(1),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

const env = EnvSchema.parse(process.env);
```

### .gitignore

```gitignore
# 環境変数
.env
.env.local
.env.*.local

# シークレット
*.pem
*.key
secrets/

# IDE
.idea/
.vscode/settings.json

# 依存関係
node_modules/
```

## レート制限

```typescript
import rateLimit from 'express-rate-limit';

// 一般的なレート制限
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 100リクエストまで
  message: 'Too many requests, please try again later.',
});

// ログイン用の厳格なレート制限
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 5, // 5回まで
  message: 'Too many login attempts, please try again later.',
});

app.use('/api/', generalLimiter);
app.use('/api/login', loginLimiter);
```

## CORS設定

```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://example.com', 'https://app.example.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400, // 24時間
}));
```

## ログとモニタリング

```typescript
// セキュリティイベントのログ
interface SecurityEvent {
  type: 'auth_failure' | 'permission_denied' | 'suspicious_activity';
  userId?: string;
  ip: string;
  userAgent: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

function logSecurityEvent(event: SecurityEvent) {
  console.log(JSON.stringify({
    level: 'security',
    ...event,
  }));
  
  // アラートが必要な場合
  if (event.type === 'suspicious_activity') {
    alertSecurityTeam(event);
  }
}
```

## セキュリティテスト

### OWASP ZAP

```bash
# Docker で実行
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://example.com
```

### セキュリティテストコード

```typescript
import { describe, it, expect } from 'vitest';

describe('Security', () => {
  describe('Input Validation', () => {
    it('should reject SQL injection attempts', async () => {
      const maliciousInput = "'; DROP TABLE users; --";
      
      await expect(
        api.createUser({ name: maliciousInput, email: 'test@test.com' })
      ).rejects.toThrow('Validation error');
    });
    
    it('should reject XSS attempts', async () => {
      const maliciousInput = '<script>alert("xss")</script>';
      
      const result = await api.createUser({
        name: maliciousInput,
        email: 'test@test.com',
      });
      
      expect(result.name).not.toContain('<script>');
    });
  });
  
  describe('Authentication', () => {
    it('should reject invalid tokens', async () => {
      await expect(
        api.getProfile({ authorization: 'Bearer invalid-token' })
      ).rejects.toThrow('Unauthorized');
    });
    
    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();
      
      await expect(
        api.getProfile({ authorization: `Bearer ${expiredToken}` })
      ).rejects.toThrow('Token expired');
    });
  });
});
```

## セキュリティ監査チェックリスト

### 認証・認可

- [ ] パスワードはハッシュ化されている
- [ ] JWTは適切に検証されている
- [ ] セッションは適切にタイムアウトする
- [ ] MFA/2FAが利用可能

### データ保護

- [ ] 通信はHTTPS
- [ ] 機密データは暗号化
- [ ] PII（個人情報）は適切に扱われている
- [ ] ログに機密情報が含まれていない

### 入力検証

- [ ] すべての入力がバリデーションされている
- [ ] SQLインジェクション対策
- [ ] XSS対策
- [ ] パストラバーサル対策

### 依存関係

- [ ] 定期的にnpm audit実行
- [ ] 既知の脆弱性がない
- [ ] 不要な依存関係を削除

### インフラ

- [ ] ファイアウォール設定
- [ ] 不要なポートが閉じている
- [ ] 最新のセキュリティパッチ適用

## 参照

- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

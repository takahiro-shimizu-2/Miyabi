---
name: typescript-development
description: TypeScript開発のベストプラクティス。型安全性、モジュール設計、エラーハンドリングなどを網羅。
triggers: ["typescript", "ts", "型", "type"]
---

# 🔷 TypeScript開発スキル

## 概要

TypeScriptプロジェクトの開発において、型安全性を最大限に活用し、保守性の高いコードを書くためのガイドライン。

## 基本設定

### tsconfig.json 推奨設定

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 型定義のベストプラクティス

### 1. 明示的な型定義

```typescript
// ❌ Bad: 暗黙の any
function process(data) {
  return data.value;
}

// ✅ Good: 明示的な型
interface DataInput {
  value: string;
  metadata?: Record<string, unknown>;
}

function process(data: DataInput): string {
  return data.value;
}
```

### 2. Union Types と Type Guards

```typescript
// 型定義
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };

// Type Guard
function isSuccess<T>(result: Result<T>): result is { success: true; data: T } {
  return result.success === true;
}

// 使用例
function handleResult<T>(result: Result<T>): T | null {
  if (isSuccess(result)) {
    return result.data;
  }
  console.error(result.error);
  return null;
}
```

### 3. Branded Types（型安全なID）

```typescript
// Brand型定義
type Brand<K, T> = K & { __brand: T };

type UserId = Brand<string, 'UserId'>;
type OrderId = Brand<string, 'OrderId'>;

// ファクトリ関数
function createUserId(id: string): UserId {
  return id as UserId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// 使用例（型安全）
function getUser(id: UserId): User { /* ... */ }
function getOrder(id: OrderId): Order { /* ... */ }

const userId = createUserId('user-123');
const orderId = createOrderId('order-456');

getUser(userId);   // ✅ OK
getUser(orderId);  // ❌ Type Error!
```

### 4. Zod によるランタイムバリデーション

```typescript
import { z } from 'zod';

// スキーマ定義
const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']),
  createdAt: z.coerce.date(),
});

// 型推論
type User = z.infer<typeof UserSchema>;

// バリデーション関数
function validateUser(input: unknown): User {
  return UserSchema.parse(input);
}

// Safe Parse（エラーをthrowしない）
function safeValidateUser(input: unknown): Result<User> {
  const result = UserSchema.safeParse(input);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: new Error(result.error.message) };
}
```

## エラーハンドリング

### カスタムエラークラス

```typescript
// ベースエラー
abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly statusCode: number;
  
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
  
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      name: this.name,
    };
  }
}

// 具体的なエラー
class NotFoundError extends AppError {
  readonly code = 'NOT_FOUND';
  readonly statusCode = 404;
}

class ValidationError extends AppError {
  readonly code = 'VALIDATION_ERROR';
  readonly statusCode = 400;
  
  constructor(
    message: string,
    public readonly fields: Record<string, string[]>,
    cause?: Error
  ) {
    super(message, cause);
  }
}

class UnauthorizedError extends AppError {
  readonly code = 'UNAUTHORIZED';
  readonly statusCode = 401;
}
```

### Result型パターン

```typescript
// Result型
type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

// ユーティリティ関数
const Ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const Err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// 使用例
async function fetchUser(id: string): Promise<Result<User, AppError>> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      if (response.status === 404) {
        return Err(new NotFoundError(`User ${id} not found`));
      }
      return Err(new AppError(`HTTP Error: ${response.status}`));
    }
    const data = await response.json();
    return Ok(validateUser(data));
  } catch (error) {
    return Err(new AppError('Network error', error as Error));
  }
}

// 呼び出し側
const result = await fetchUser('123');
if (result.ok) {
  console.log(result.value.name);
} else {
  console.error(result.error.code, result.error.message);
}
```

## 非同期処理

### Promise ユーティリティ

```typescript
// タイムアウト付きPromise
function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  message = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(message)), ms)
    ),
  ]);
}

// リトライ付き実行
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    delay?: number;
    backoff?: number;
  } = {}
): Promise<T> {
  const { maxAttempts = 3, delay = 1000, backoff = 2 } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxAttempts) {
        await new Promise(r => setTimeout(r, delay * Math.pow(backoff, attempt - 1)));
      }
    }
  }
  
  throw lastError;
}

// 並列実行（制限付き）
async function parallelLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  const executing: Promise<void>[] = [];
  
  for (const item of items) {
    const p = fn(item).then(result => {
      results.push(result);
    });
    executing.push(p);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(
        executing.findIndex(p => p === undefined),
        1
      );
    }
  }
  
  await Promise.all(executing);
  return results;
}
```

## モジュール設計

### バレルエクスポート

```typescript
// src/services/index.ts
export { UserService } from './user.service';
export { OrderService } from './order.service';
export type { ServiceOptions } from './types';

// 使用側
import { UserService, OrderService } from '@/services';
```

### 依存性注入パターン

```typescript
// インターフェース定義
interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error): void;
}

interface Database {
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
}

// サービス実装
class UserService {
  constructor(
    private readonly db: Database,
    private readonly logger: Logger
  ) {}
  
  async findById(id: string): Promise<User | null> {
    this.logger.info('Finding user', { id });
    const [user] = await this.db.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return user ?? null;
  }
}

// ファクトリ関数
function createUserService(deps: {
  db: Database;
  logger: Logger;
}): UserService {
  return new UserService(deps.db, deps.logger);
}
```

## テスト

### Vitest設定

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.d.ts'],
    },
  },
});
```

### テスト例

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('UserService', () => {
  let service: UserService;
  let mockDb: Database;
  let mockLogger: Logger;
  
  beforeEach(() => {
    mockDb = {
      query: vi.fn(),
    };
    mockLogger = {
      info: vi.fn(),
      error: vi.fn(),
    };
    service = new UserService(mockDb, mockLogger);
  });
  
  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = { id: '1', name: 'Test' };
      vi.mocked(mockDb.query).mockResolvedValue([mockUser]);
      
      const result = await service.findById('1');
      
      expect(result).toEqual(mockUser);
      expect(mockLogger.info).toHaveBeenCalledWith('Finding user', { id: '1' });
    });
    
    it('should return null when not found', async () => {
      vi.mocked(mockDb.query).mockResolvedValue([]);
      
      const result = await service.findById('999');
      
      expect(result).toBeNull();
    });
  });
});
```

## チェックリスト

### コードレビュー時の確認項目

- [ ] `strict: true` が有効になっている
- [ ] `any` 型が使われていない（やむを得ない場合は `unknown` を使用）
- [ ] 関数の戻り値型が明示されている
- [ ] エラーハンドリングが適切に行われている
- [ ] 非同期処理のエラーがcatchされている
- [ ] Zodなどでランタイムバリデーションが行われている
- [ ] テストカバレッジが80%以上
- [ ] 型定義がexportされている（ライブラリの場合）

## 参照

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Total TypeScript](https://www.totaltypescript.com/)
- [Zod Documentation](https://zod.dev/)

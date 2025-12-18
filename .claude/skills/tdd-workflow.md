---
name: tdd-workflow
description: テスト駆動開発（TDD）のワークフロー。Red-Green-Refactorサイクルとテスト設計パターン。
triggers: ["tdd", "test", "vitest", "テスト"]
---

# 🧪 TDDワークフロースキル

## 概要

テスト駆動開発（Test-Driven Development）の実践ガイド。品質の高いコードを効率的に開発する。

## TDDサイクル

```
    ┌─────────────────────────────────────────┐
    │                                         │
    │   🔴 RED: 失敗するテストを書く           │
    │         ↓                               │
    │   🟢 GREEN: テストを通す最小限のコード    │
    │         ↓                               │
    │   🔵 REFACTOR: コードを改善              │
    │         ↓                               │
    │      (繰り返し)                          │
    │                                         │
    └─────────────────────────────────────────┘
```

## Vitest セットアップ

### インストール

```bash
npm install -D vitest @vitest/coverage-v8 @vitest/ui
```

### 設定ファイル

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.{test,spec}.{js,ts}'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/types/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
    testTimeout: 10000,
    hookTimeout: 10000,
  },
});
```

### package.json スクリプト

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## TDD 実践例

### Step 1: 🔴 RED - 失敗するテストを書く

```typescript
// src/calculator.test.ts
import { describe, it, expect } from 'vitest';
import { Calculator } from './calculator';

describe('Calculator', () => {
  describe('add', () => {
    it('should add two positive numbers', () => {
      const calc = new Calculator();
      expect(calc.add(2, 3)).toBe(5);
    });

    it('should add negative numbers', () => {
      const calc = new Calculator();
      expect(calc.add(-1, -2)).toBe(-3);
    });

    it('should add zero', () => {
      const calc = new Calculator();
      expect(calc.add(5, 0)).toBe(5);
    });
  });
});
```

この時点で実行すると失敗する（Calculatorクラスが存在しない）。

### Step 2: 🟢 GREEN - 最小限の実装

```typescript
// src/calculator.ts
export class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
```

### Step 3: 🔵 REFACTOR - 改善

```typescript
// src/calculator.ts
export class Calculator {
  add(...numbers: number[]): number {
    return numbers.reduce((sum, n) => sum + n, 0);
  }
}

// テストも更新
describe('add', () => {
  it('should add multiple numbers', () => {
    const calc = new Calculator();
    expect(calc.add(1, 2, 3, 4)).toBe(10);
  });
});
```

## テストパターン

### AAA パターン (Arrange-Act-Assert)

```typescript
it('should create user with valid data', async () => {
  // Arrange: テストデータを準備
  const userData = {
    name: 'John Doe',
    email: 'john@example.com',
  };
  const userService = new UserService(mockDb);

  // Act: テスト対象のメソッドを実行
  const user = await userService.create(userData);

  // Assert: 結果を検証
  expect(user.id).toBeDefined();
  expect(user.name).toBe('John Doe');
  expect(user.email).toBe('john@example.com');
});
```

### Given-When-Then パターン

```typescript
describe('Shopping Cart', () => {
  describe('when adding items', () => {
    it('given empty cart, then item count should be 1', () => {
      // Given
      const cart = new ShoppingCart();
      const item = { id: '1', name: 'Book', price: 1000 };

      // When
      cart.addItem(item);

      // Then
      expect(cart.itemCount).toBe(1);
    });
  });
});
```

### パラメータ化テスト

```typescript
import { describe, it, expect } from 'vitest';

describe('isValidEmail', () => {
  it.each([
    ['test@example.com', true],
    ['user.name@domain.co.jp', true],
    ['invalid-email', false],
    ['@nodomain.com', false],
    ['noat.com', false],
  ])('should validate "%s" as %s', (email, expected) => {
    expect(isValidEmail(email)).toBe(expected);
  });
});
```

## モック・スタブ・スパイ

### vi.fn() - 関数モック

```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('UserService', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  it('should fetch user data', async () => {
    const mockUser = { id: '1', name: 'John' };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });

    const service = new UserService();
    const user = await service.getUser('1');

    expect(user).toEqual(mockUser);
    expect(mockFetch).toHaveBeenCalledWith('/api/users/1');
  });
});
```

### vi.spyOn() - メソッドスパイ

```typescript
it('should call logger on error', async () => {
  const logger = new Logger();
  const logSpy = vi.spyOn(logger, 'error');
  
  const service = new UserService(logger);
  
  await service.handleError(new Error('Test error'));
  
  expect(logSpy).toHaveBeenCalledWith('Test error');
  logSpy.mockRestore();
});
```

### vi.mock() - モジュールモック

```typescript
// モジュール全体をモック
vi.mock('./database', () => ({
  Database: vi.fn().mockImplementation(() => ({
    query: vi.fn().mockResolvedValue([]),
    connect: vi.fn().mockResolvedValue(true),
  })),
}));

// テスト内で
import { Database } from './database';

it('should use mocked database', async () => {
  const db = new Database();
  const results = await db.query('SELECT * FROM users');
  expect(results).toEqual([]);
});
```

## 非同期テスト

### Promise テスト

```typescript
it('should resolve with data', async () => {
  const result = await fetchData();
  expect(result).toBeDefined();
});

it('should reject with error', async () => {
  await expect(fetchInvalidData()).rejects.toThrow('Not found');
});
```

### タイマーテスト

```typescript
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should debounce function calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 1000);

    debounced();
    debounced();
    debounced();

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

## スナップショットテスト

```typescript
import { describe, it, expect } from 'vitest';

describe('Component', () => {
  it('should match snapshot', () => {
    const output = generateHTML({
      title: 'Hello',
      content: 'World',
    });

    expect(output).toMatchSnapshot();
  });

  it('should match inline snapshot', () => {
    const result = formatUser({ name: 'John', age: 30 });

    expect(result).toMatchInlineSnapshot(`
      {
        "displayName": "John",
        "isAdult": true,
      }
    `);
  });
});
```

## テストカバレッジ

### カバレッジレポート確認

```bash
# カバレッジ実行
npm run test:coverage

# HTMLレポート
open coverage/index.html
```

### カバレッジ除外

```typescript
// vitest.config.ts
coverage: {
  exclude: [
    'src/types/**',           // 型定義
    'src/**/*.d.ts',          // 宣言ファイル
    'src/index.ts',           // エントリポイント
    'src/**/__mocks__/**',    // モック
  ],
}
```

## テスト構成ベストプラクティス

### ディレクトリ構造

```
src/
├── services/
│   ├── user.service.ts
│   ├── user.service.test.ts      # コロケーション
│   └── __mocks__/
│       └── user.service.ts
├── utils/
│   ├── validation.ts
│   └── validation.test.ts
└── __tests__/                     # 統合テスト
    └── integration/
        └── api.test.ts
```

### テスト命名規則

```typescript
// 機能を説明する命名
describe('UserService', () => {
  describe('createUser', () => {
    it('should create a new user with valid data', () => {});
    it('should throw ValidationError when email is invalid', () => {});
    it('should hash password before saving', () => {});
  });
});
```

## チェックリスト

### テスト作成時

- [ ] テストは独立している（他のテストに依存しない）
- [ ] テストは繰り返し実行可能（冪等）
- [ ] 1つのテストは1つのことを検証
- [ ] テスト名が何をテストしているか明確
- [ ] AAA/Given-When-Thenパターンに従っている

### TDDサイクル

- [ ] 🔴 先にテストを書いた
- [ ] 🔴 テストが失敗することを確認した
- [ ] 🟢 最小限のコードで通した
- [ ] 🔵 リファクタリングした
- [ ] 🔵 テストが依然通ることを確認した

## 参照

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [TDD by Example - Kent Beck](https://www.amazon.com/Test-Driven-Development-Kent-Beck/dp/0321146530)

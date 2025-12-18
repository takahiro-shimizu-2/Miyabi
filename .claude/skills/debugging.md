---
name: debugging
description: デバッグとトラブルシューティングのテクニック。問題の特定から解決まで。
triggers: ["debug", "error", "fix", "バグ", "エラー"]
---

# 🔍 デバッグスキル

## 概要

効率的なデバッグとトラブルシューティングの手法。問題を素早く特定し解決する。

## デバッグの基本プロセス

```
┌─────────────────────────────────────────┐
│  1. 問題の再現                          │
│     └─ 確実に再現できる手順を特定        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  2. 問題の切り分け                      │
│     └─ どこで問題が発生しているか特定    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  3. 仮説を立てる                        │
│     └─ 原因の候補を挙げる               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  4. 仮説を検証                          │
│     └─ ログ、ブレークポイント、テスト    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  5. 修正と確認                          │
│     └─ 修正後、問題が解決したか確認      │
└─────────────────────────────────────────┘
```

## console デバッグ

### 基本的な console メソッド

```typescript
// 通常のログ
console.log('Value:', value);

// 警告
console.warn('This is deprecated');

// エラー
console.error('Critical error:', error);

// オブジェクトを見やすく表示
console.dir(object, { depth: null });

// テーブル形式で表示
console.table([
  { name: 'Alice', age: 30 },
  { name: 'Bob', age: 25 },
]);

// グループ化
console.group('User Operations');
console.log('Fetching user...');
console.log('User fetched');
console.groupEnd();

// 時間計測
console.time('operation');
await someOperation();
console.timeEnd('operation'); // operation: 123.456ms

// スタックトレース
console.trace('How did we get here?');

// 条件付きログ
console.assert(value > 0, 'Value must be positive');
```

### カスタムロガー

```typescript
const logger = {
  debug: (message: string, ...args: unknown[]) => {
    if (process.env.DEBUG) {
      console.log(`[DEBUG] ${new Date().toISOString()} ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: unknown[]) => {
    console.log(`[INFO] ${new Date().toISOString()} ${message}`, ...args);
  },
  
  warn: (message: string, ...args: unknown[]) => {
    console.warn(`[WARN] ${new Date().toISOString()} ${message}`, ...args);
  },
  
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${new Date().toISOString()} ${message}`);
    if (error) {
      console.error(error.stack);
    }
  },
};
```

## Node.js デバッガ

### VS Code デバッグ設定

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Current File",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/tsx",
      "args": ["${file}"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Debug Tests",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--run", "--reporter=verbose"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Attach to Process",
      "type": "node",
      "request": "attach",
      "port": 9229
    }
  ]
}
```

### inspect モード

```bash
# デバッガ付きで実行
node --inspect src/index.js

# ブレークポイントで停止
node --inspect-brk src/index.js

# tsx での実行
npx tsx --inspect src/index.ts
```

### debugger 文

```typescript
function complexFunction(data: unknown) {
  const processed = preProcess(data);
  
  debugger; // ここで停止
  
  const result = transform(processed);
  return result;
}
```

## エラーハンドリング

### Error オブジェクトの活用

```typescript
class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// 使用例
try {
  await riskyOperation();
} catch (error) {
  if (error instanceof AppError) {
    logger.error(`${error.code}: ${error.message}`, error);
    logger.debug('Context:', error.context);
  } else if (error instanceof Error) {
    logger.error('Unexpected error:', error);
    logger.debug('Stack:', error.stack);
  }
}
```

### async/await のエラー処理

```typescript
// 個別のtry-catch
async function fetchUser(id: string) {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new AppError('Failed to fetch user', 'FETCH_ERROR', { id, status: response.status });
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('Network error', 'NETWORK_ERROR', { originalError: error });
  }
}

// Result型パターン
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };

async function safeFetchUser(id: string): Promise<Result<User>> {
  try {
    const user = await fetchUser(id);
    return { ok: true, value: user };
  } catch (error) {
    return { ok: false, error: error as Error };
  }
}
```

## 問題パターンと解決策

### 1. 非同期処理の問題

```typescript
// ❌ 問題: awaitの付け忘れ
async function getUsers() {
  const users = fetchUsers(); // Promise<User[]> が返る
  console.log(users.length);  // undefined
}

// ✅ 解決
async function getUsers() {
  const users = await fetchUsers();
  console.log(users.length);
}
```

### 2. this のバインディング

```typescript
// ❌ 問題
class UserService {
  private apiUrl = '/api';
  
  fetchUser(id: string) {
    return fetch(`${this.apiUrl}/users/${id}`); // this が undefined になりうる
  }
}

const service = new UserService();
const handler = service.fetchUser;
handler('123'); // Error: Cannot read property 'apiUrl' of undefined

// ✅ 解決1: アロー関数
class UserService {
  private apiUrl = '/api';
  
  fetchUser = (id: string) => {
    return fetch(`${this.apiUrl}/users/${id}`);
  };
}

// ✅ 解決2: bind
const handler = service.fetchUser.bind(service);
```

### 3. クロージャの問題

```typescript
// ❌ 問題
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 全部 3
}

// ✅ 解決1: let を使う
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 100); // 0, 1, 2
}

// ✅ 解決2: IIFE
for (var i = 0; i < 3; i++) {
  ((j) => {
    setTimeout(() => console.log(j), 100);
  })(i);
}
```

### 4. 型の問題

```typescript
// ❌ 問題: 型アサーションの濫用
const user = JSON.parse(data) as User; // 実際はUserじゃないかも

// ✅ 解決: ランタイムバリデーション
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
});

function parseUser(data: unknown): User {
  return UserSchema.parse(data);
}
```

## ネットワークデバッグ

### fetch のデバッグ

```typescript
// リクエスト/レスポンスログ
async function debugFetch(url: string, options?: RequestInit) {
  console.log('→ Request:', { url, ...options });
  
  const start = Date.now();
  try {
    const response = await fetch(url, options);
    const duration = Date.now() - start;
    
    console.log('← Response:', {
      status: response.status,
      statusText: response.statusText,
      duration: `${duration}ms`,
      headers: Object.fromEntries(response.headers),
    });
    
    return response;
  } catch (error) {
    console.error('✗ Request failed:', error);
    throw error;
  }
}
```

### curl コマンド

```bash
# 基本的なGET
curl -v https://api.example.com/users

# POST with JSON
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"test"}' \
  https://api.example.com/users

# レスポンスヘッダのみ
curl -I https://api.example.com/users

# タイムアウト設定
curl --connect-timeout 5 --max-time 10 https://api.example.com/users
```

## メモリデバッグ

### ヒープスナップショット

```typescript
// メモリ使用量の確認
const used = process.memoryUsage();
console.log({
  rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
  heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
  heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
  external: `${Math.round(used.external / 1024 / 1024)} MB`,
});
```

### メモリリークの検出

```typescript
// 定期的にメモリ使用量をログ
setInterval(() => {
  const used = process.memoryUsage();
  logger.debug('Memory:', {
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
  });
}, 30000);
```

## デバッグツール

### Node.js 組み込み

| ツール | 用途 |
|--------|------|
| `--inspect` | Chrome DevTools でデバッグ |
| `--prof` | V8 プロファイラ |
| `--trace-warnings` | 警告の詳細表示 |
| `--trace-deprecation` | 非推奨の詳細表示 |

### npm パッケージ

| パッケージ | 用途 |
|------------|------|
| `debug` | 条件付きデバッグログ |
| `why-is-node-running` | プロセスが終了しない原因を特定 |
| `clinic` | パフォーマンス診断 |
| `0x` | フレームグラフ生成 |

## チェックリスト

### デバッグ開始前

- [ ] 問題を確実に再現できる
- [ ] エラーメッセージを確認した
- [ ] 最近の変更を確認した
- [ ] 関連するログを収集した

### デバッグ中

- [ ] 仮説を立てて検証している
- [ ] 二分探索で範囲を絞っている
- [ ] 一度に1つの変数だけ変更している
- [ ] 変更を記録している

### 修正後

- [ ] 問題が解決したことを確認
- [ ] 回帰テストを追加
- [ ] 根本原因を理解した
- [ ] 同様の問題がないか確認

## 参照

- [Node.js Debugging Guide](https://nodejs.org/en/docs/guides/debugging-getting-started/)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

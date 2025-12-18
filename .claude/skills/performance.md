---
name: performance
description: パフォーマンス最適化のテクニック。計測、分析、改善。
triggers: ["performance", "optimize", "速度", "パフォーマンス"]
---

# ⚡ パフォーマンススキル

## 概要

アプリケーションのパフォーマンスを計測・分析・改善するためのガイドライン。

## 計測の原則

```
「推測するな、計測せよ」 - Rob Pike

1. ベースラインを計測
2. ボトルネックを特定
3. 改善を実施
4. 効果を計測
5. 繰り返し
```

## Node.js パフォーマンス計測

### console.time

```typescript
console.time('operation');
await someOperation();
console.timeEnd('operation'); // operation: 123.456ms
```

### Performance API

```typescript
import { performance, PerformanceObserver } from 'perf_hooks';

// マーキング
performance.mark('start');
await someOperation();
performance.mark('end');

// 計測
performance.measure('operation', 'start', 'end');

// 結果取得
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    console.log(`${entry.name}: ${entry.duration}ms`);
  });
});
observer.observe({ entryTypes: ['measure'] });
```

### カスタムメトリクス

```typescript
class PerformanceTracker {
  private metrics: Map<string, number[]> = new Map();

  track<T>(name: string, fn: () => T): T {
    const start = performance.now();
    const result = fn();
    const duration = performance.now() - start;
    
    const values = this.metrics.get(name) || [];
    values.push(duration);
    this.metrics.set(name, values);
    
    return result;
  }

  async trackAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const duration = performance.now() - start;
    
    const values = this.metrics.get(name) || [];
    values.push(duration);
    this.metrics.set(name, values);
    
    return result;
  }

  getStats(name: string) {
    const values = this.metrics.get(name) || [];
    if (values.length === 0) return null;
    
    const sorted = [...values].sort((a, b) => a - b);
    return {
      count: values.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}
```

## データベース最適化

### N+1クエリ問題

```typescript
// ❌ N+1問題
const users = await db.user.findMany();
for (const user of users) {
  const orders = await db.order.findMany({
    where: { userId: user.id },
  });
  user.orders = orders;
}

// ✅ Eager Loading
const users = await db.user.findMany({
  include: { orders: true },
});

// ✅ DataLoader (GraphQL)
const orderLoader = new DataLoader(async (userIds) => {
  const orders = await db.order.findMany({
    where: { userId: { in: userIds } },
  });
  return userIds.map(id => orders.filter(o => o.userId === id));
});
```

### インデックス

```sql
-- 頻繁に検索されるカラムにインデックス
CREATE INDEX idx_users_email ON users(email);

-- 複合インデックス
CREATE INDEX idx_orders_user_date ON orders(user_id, created_at);

-- 部分インデックス
CREATE INDEX idx_active_users ON users(email) WHERE status = 'active';
```

### クエリ最適化

```typescript
// ❌ 全件取得
const allUsers = await db.user.findMany();
const activeUsers = allUsers.filter(u => u.status === 'active');

// ✅ DBでフィルタ
const activeUsers = await db.user.findMany({
  where: { status: 'active' },
});

// ❌ 不要なカラム取得
const users = await db.user.findMany();
const emails = users.map(u => u.email);

// ✅ 必要なカラムのみ
const users = await db.user.findMany({
  select: { email: true },
});
```

## キャッシング

### インメモリキャッシュ

```typescript
class SimpleCache<T> {
  private cache = new Map<string, { value: T; expiry: number }>();

  set(key: string, value: T, ttlMs: number): void {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return undefined;
    }
    
    return entry.value;
  }

  async getOrSet(key: string, fn: () => Promise<T>, ttlMs: number): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    
    const value = await fn();
    this.set(key, value, ttlMs);
    return value;
  }
}
```

### Redis キャッシュ

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

async function getCached<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }
  
  const value = await fn();
  await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  return value;
}

// 使用例
const user = await getCached(
  `user:${userId}`,
  () => db.user.findUnique({ where: { id: userId } }),
  3600 // 1時間
);
```

## 非同期処理の最適化

### Promise.all

```typescript
// ❌ 順次実行
const user = await fetchUser(id);
const orders = await fetchOrders(id);
const preferences = await fetchPreferences(id);

// ✅ 並列実行
const [user, orders, preferences] = await Promise.all([
  fetchUser(id),
  fetchOrders(id),
  fetchPreferences(id),
]);
```

### バッチ処理

```typescript
// ❌ 1件ずつ処理
for (const item of items) {
  await processItem(item);
}

// ✅ バッチ処理
const BATCH_SIZE = 100;
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(processItem));
}
```

### ストリーム処理

```typescript
import { createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Transform } from 'stream';

// 大きなファイルをストリーム処理
const transform = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    const processed = processChunk(chunk);
    callback(null, processed);
  },
});

await pipeline(
  createReadStream('large-file.json'),
  transform,
  createWriteStream('output.json')
);
```

## メモリ最適化

### メモリ使用量監視

```typescript
function logMemoryUsage() {
  const used = process.memoryUsage();
  console.log({
    rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
    heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
    heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
    external: `${Math.round(used.external / 1024 / 1024)} MB`,
  });
}

// 定期的に監視
setInterval(logMemoryUsage, 30000);
```

### メモリリーク防止

```typescript
// ❌ グローバルな配列に追加し続ける
const logs: string[] = [];
function log(message: string) {
  logs.push(message); // メモリリーク
}

// ✅ サイズ制限
class BoundedArray<T> {
  private items: T[] = [];
  
  constructor(private maxSize: number) {}
  
  push(item: T) {
    this.items.push(item);
    if (this.items.length > this.maxSize) {
      this.items.shift();
    }
  }
}

// ❌ イベントリスナーの解除忘れ
element.addEventListener('click', handler);
// 解除されない...

// ✅ クリーンアップ
element.addEventListener('click', handler);
// 後で
element.removeEventListener('click', handler);
```

## プロファイリング

### Node.js プロファイラ

```bash
# CPU プロファイリング
node --prof app.js
node --prof-process isolate-*.log > profile.txt

# ヒープスナップショット
node --inspect app.js
# Chrome DevTools で Memory タブを使用
```

### 0x フレームグラフ

```bash
npm install -g 0x

0x app.js
# フレームグラフが生成される
```

### clinic.js

```bash
npm install -g clinic

# パフォーマンス診断
clinic doctor -- node app.js

# フレームグラフ
clinic flame -- node app.js

# イベントループ遅延
clinic bubbleprof -- node app.js
```

## ベンチマーク

### vitest-bench

```typescript
import { bench, describe } from 'vitest';

describe('Array methods', () => {
  const array = Array.from({ length: 1000 }, (_, i) => i);

  bench('for loop', () => {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
      sum += array[i];
    }
  });

  bench('forEach', () => {
    let sum = 0;
    array.forEach(n => { sum += n; });
  });

  bench('reduce', () => {
    array.reduce((sum, n) => sum + n, 0);
  });
});
```

## パフォーマンス目標

### Web Vitals

| メトリクス | 良好 | 改善が必要 | 悪い |
|------------|------|------------|------|
| LCP (Largest Contentful Paint) | ≤2.5s | ≤4s | >4s |
| FID (First Input Delay) | ≤100ms | ≤300ms | >300ms |
| CLS (Cumulative Layout Shift) | ≤0.1 | ≤0.25 | >0.25 |

### API レスポンス

| エンドポイント | 目標 |
|----------------|------|
| 認証 | <200ms |
| 読み取り（キャッシュあり） | <50ms |
| 読み取り（DBアクセス） | <200ms |
| 書き込み | <500ms |

## チェックリスト

### 計測

- [ ] ベースラインを記録した
- [ ] ボトルネックを特定した
- [ ] パフォーマンスバジェットを設定した

### データベース

- [ ] 適切なインデックスがある
- [ ] N+1クエリがない
- [ ] 必要なカラムのみ取得している

### キャッシング

- [ ] 頻繁にアクセスされるデータをキャッシュ
- [ ] 適切なTTLを設定
- [ ] キャッシュ無効化戦略がある

### 非同期処理

- [ ] 並列実行可能な処理はPromise.allを使用
- [ ] 大量データはバッチ/ストリーム処理

## 参照

- [Node.js Performance Best Practices](https://nodejs.org/en/docs/guides/dont-block-the-event-loop/)
- [web.dev Performance](https://web.dev/performance/)
- [clinic.js](https://clinicjs.org/)

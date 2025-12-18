---
name: mcp-server-development
description: MCP (Model Context Protocol) Server開発ガイド。ツール定義、リソース、プロンプト作成のベストプラクティス。
triggers: ["mcp", "server", "tool", "protocol"]
---

# 🔌 MCP Server開発スキル

## 概要

Model Context Protocol (MCP) Serverを開発するためのガイドライン。Claude DesktopやAIエージェントと連携するツールを作成する。

## アーキテクチャ

```
┌─────────────────┐     MCP Protocol     ┌────────────────────┐
│   MCP Client    │◄───────────────────►│   MCP Server       │
│ (Claude Desktop)│     JSON-RPC 2.0     │  (Your Tools)      │
└─────────────────┘                      └────────┬───────────┘
                                                  │
                                         ┌────────▼───────────┐
                                         │   External APIs    │
                                         │   File System      │
                                         │   Databases        │
                                         └────────────────────┘
```

## プロジェクトセットアップ

### 1. 初期化

```bash
mkdir my-mcp-server
cd my-mcp-server
npm init -y
npm install @modelcontextprotocol/sdk zod
npm install -D typescript @types/node vitest
```

### 2. package.json

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "main": "dist/index.js",
  "bin": {
    "my-mcp-server": "dist/index.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js",
    "test": "vitest"
  }
}
```

### 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*"]
}
```

## 基本実装

### サーバー雛形

```typescript
// src/index.ts
#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

// サーバー作成
const server = new McpServer({
  name: 'my-mcp-server',
  version: '1.0.0',
});

// ツール定義
server.tool(
  'hello',
  'Say hello to someone',
  {
    name: z.string().describe('Name of the person to greet'),
  },
  async ({ name }) => {
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}! 👋`,
        },
      ],
    };
  }
);

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server started');
}

main().catch(console.error);
```

## ツール開発

### 基本的なツール

```typescript
// シンプルなツール
server.tool(
  'get_weather',
  'Get weather information for a city',
  {
    city: z.string().describe('City name'),
    units: z.enum(['celsius', 'fahrenheit']).default('celsius'),
  },
  async ({ city, units }) => {
    // 外部API呼び出し
    const weather = await fetchWeather(city, units);
    
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(weather, null, 2),
        },
      ],
    };
  }
);
```

### 複雑なパラメータ

```typescript
// オブジェクト型パラメータ
const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  dueDate: z.string().datetime().optional(),
  tags: z.array(z.string()).default([]),
  assignee: z.object({
    id: z.string(),
    name: z.string(),
  }).optional(),
});

server.tool(
  'create_task',
  'Create a new task',
  CreateTaskSchema.shape,
  async (params) => {
    const validated = CreateTaskSchema.parse(params);
    const task = await taskService.create(validated);
    
    return {
      content: [
        {
          type: 'text',
          text: `Task created: ${task.id}`,
        },
      ],
    };
  }
);
```

### エラーハンドリング

```typescript
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

server.tool(
  'get_file',
  'Read a file from the filesystem',
  {
    path: z.string().describe('File path'),
  },
  async ({ path }) => {
    // パストラバーサル防止
    const safePath = sanitizePath(path);
    if (!safePath) {
      throw new McpError(
        ErrorCode.InvalidParams,
        'Invalid file path'
      );
    }
    
    try {
      const content = await fs.readFile(safePath, 'utf-8');
      return {
        content: [{ type: 'text', text: content }],
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new McpError(
          ErrorCode.InvalidParams,
          `File not found: ${path}`
        );
      }
      throw new McpError(
        ErrorCode.InternalError,
        `Failed to read file: ${(error as Error).message}`
      );
    }
  }
);
```

## リソース定義

### 静的リソース

```typescript
// ドキュメントリソース
server.resource(
  'docs',
  'documentation://readme',
  async (uri) => {
    const content = await fs.readFile('README.md', 'utf-8');
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'text/markdown',
          text: content,
        },
      ],
    };
  }
);
```

### 動的リソース

```typescript
// データベースからのリソース
server.resource(
  'user',
  'users://{id}',
  async (uri) => {
    const match = uri.pathname.match(/^\/(\d+)$/);
    if (!match) {
      throw new McpError(ErrorCode.InvalidParams, 'Invalid user ID');
    }
    
    const userId = match[1];
    const user = await db.users.findById(userId);
    
    if (!user) {
      throw new McpError(ErrorCode.InvalidParams, 'User not found');
    }
    
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(user, null, 2),
        },
      ],
    };
  }
);
```

## プロンプト定義

```typescript
// プロンプトテンプレート
server.prompt(
  'code_review',
  'Generate a code review prompt',
  {
    language: z.string().describe('Programming language'),
    code: z.string().describe('Code to review'),
  },
  async ({ language, code }) => {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please review the following ${language} code:

\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Code quality and readability
2. Potential bugs
3. Performance issues
4. Security concerns
5. Best practices`,
          },
        },
      ],
    };
  }
);
```

## セキュリティ

### 入力サニタイズ

```typescript
// パスサニタイズ
function sanitizePath(basePath: string, userPath: string): string | null {
  const resolved = path.resolve(basePath, userPath);
  if (!resolved.startsWith(basePath)) {
    return null; // パストラバーサル攻撃を防止
  }
  return resolved;
}

// シェルコマンドサニタイズ
function sanitizeShellArg(arg: string): string {
  return arg.replace(/[;&|`$(){}[\]<>\\'"]/g, '');
}

// ホスト名検証
function isValidHostname(hostname: string): boolean {
  const pattern = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return pattern.test(hostname);
}
```

### レート制限

```typescript
class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  
  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}
  
  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const windowStart = now - this.windowMs;
    
    const validTimestamps = timestamps.filter(t => t > windowStart);
    
    if (validTimestamps.length >= this.limit) {
      return false;
    }
    
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    return true;
  }
}

const limiter = new RateLimiter(100, 60000); // 100 req/min

server.tool(
  'api_call',
  'Make an API call',
  { endpoint: z.string() },
  async ({ endpoint }, extra) => {
    const clientId = extra.meta?.clientId || 'default';
    
    if (!limiter.isAllowed(clientId)) {
      throw new McpError(
        ErrorCode.InvalidRequest,
        'Rate limit exceeded'
      );
    }
    
    // API呼び出し処理
  }
);
```

## テスト

### ユニットテスト

```typescript
// src/tools/weather.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWeather } from './weather';

describe('getWeather', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });
  
  it('should return weather data', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ temp: 20, condition: 'sunny' }),
    });
    global.fetch = mockFetch;
    
    const result = await getWeather('Tokyo', 'celsius');
    
    expect(result).toEqual({
      city: 'Tokyo',
      temp: 20,
      condition: 'sunny',
      units: 'celsius',
    });
  });
  
  it('should throw on API error', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    });
    global.fetch = mockFetch;
    
    await expect(getWeather('InvalidCity', 'celsius'))
      .rejects.toThrow('City not found');
  });
});
```

### 統合テスト

```typescript
// src/server.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { spawn } from 'child_process';

describe('MCP Server Integration', () => {
  let client: Client;
  let serverProcess: any;
  
  beforeAll(async () => {
    // サーバー起動
    serverProcess = spawn('node', ['dist/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    
    // クライアント接続
    client = new Client({ name: 'test-client', version: '1.0.0' });
    // 接続処理...
  });
  
  afterAll(async () => {
    await client.close();
    serverProcess.kill();
  });
  
  it('should list tools', async () => {
    const tools = await client.listTools();
    expect(tools.tools).toContainEqual(
      expect.objectContaining({ name: 'hello' })
    );
  });
  
  it('should call hello tool', async () => {
    const result = await client.callTool({
      name: 'hello',
      arguments: { name: 'World' },
    });
    
    expect(result.content[0].text).toBe('Hello, World! 👋');
  });
});
```

## Claude Desktop設定

### claude_desktop_config.json

```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/my-mcp-server/dist/index.js"],
      "env": {
        "API_KEY": "your-api-key"
      }
    }
  }
}
```

### npx対応

```json
{
  "mcpServers": {
    "my-server": {
      "command": "npx",
      "args": ["-y", "my-mcp-server"],
      "env": {}
    }
  }
}
```

## ベストプラクティス

### チェックリスト

- [ ] すべてのツールに明確な説明がある
- [ ] パラメータにZodバリデーションがある
- [ ] エラーが適切にハンドリングされている
- [ ] セキュリティサニタイズが実装されている
- [ ] ログ出力がstderrに行われている（stdoutはMCPプロトコル用）
- [ ] 環境変数で設定可能になっている
- [ ] テストカバレッジが80%以上

### 命名規則

| 要素 | 規則 | 例 |
|------|------|-----|
| ツール名 | snake_case | `get_user`, `create_task` |
| パラメータ | camelCase | `userId`, `dueDate` |
| リソースURI | scheme://path | `users://123`, `docs://readme` |

## 参照

- [MCP Specification](https://spec.modelcontextprotocol.io/)
- [MCP SDK Documentation](https://github.com/modelcontextprotocol/sdk)
- [miyabi-mcp-bundle](https://github.com/ShunsukeHayashi/miyabi-mcp-bundle)

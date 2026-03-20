/**
 * Example External Context Fetcher
 *
 * サンプル実装: 外部APIからコンテキストを取得する方法
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * 外部コンテキストの型定義
 */
export interface ExternalContext {
  source: string;
  type: 'document' | 'api' | 'database' | 'webhook';
  content: string;
  metadata: Record<string, unknown>;
  timestamp: string;
}

/**
 * フェッチパラメータ
 */
export interface FetchParams {
  source: string;
  type: 'document' | 'api' | 'database' | 'webhook';
  options?: Record<string, unknown>;
}

/**
 * ExampleFetcher - 外部コンテキスト取得の基本実装
 */
export class ExampleFetcher {
  /**
   * 外部ドキュメントを読み込む
   */
  async fetchDocument(filePath: string): Promise<ExternalContext> {
    try {
      const fullPath = path.resolve(process.cwd(), 'external/docs', filePath);
      const content = await fs.readFile(fullPath, 'utf-8');

      return {
        source: filePath,
        type: 'document',
        content,
        metadata: {
          path: fullPath,
          size: content.length,
          format: path.extname(filePath),
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch document: ${(error as Error).message}`);
    }
  }

  /**
   * 外部APIからデータを取得
   */
  async fetchAPI(url: string, options?: RequestInit): Promise<ExternalContext> {
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const content = await response.text();

      return {
        source: url,
        type: 'api',
        content,
        metadata: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries()),
          contentType: response.headers.get('content-type') || 'unknown',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new Error(`Failed to fetch API: ${(error as Error).message}`);
    }
  }

  /**
   * 汎用フェッチメソッド
   */
  async fetch(params: FetchParams): Promise<ExternalContext> {
    switch (params.type) {
      case 'document':
        return this.fetchDocument(params.source);

      case 'api':
        return this.fetchAPI(params.source, params.options as RequestInit);

      case 'database':
        throw new Error('Database fetching not implemented yet');

      case 'webhook':
        throw new Error('Webhook fetching not implemented yet');

      default:
        throw new Error(`Unsupported type: ${params.type}`);
    }
  }

  /**
   * 複数のソースから同時に取得
   */
  async fetchMultiple(params: FetchParams[]): Promise<ExternalContext[]> {
    const promises = params.map((param) => this.fetch(param));
    return Promise.all(promises);
  }

  /**
   * コンテキストをファイルに保存
   */
  async saveContext(context: ExternalContext, outputPath: string): Promise<void> {
    const fullPath = path.resolve(process.cwd(), 'external/data', outputPath);
    await fs.writeFile(fullPath, JSON.stringify(context, null, 2), 'utf-8');
  }
}

/**
 * 使用例
 */
export async function example() {
  const fetcher = new ExampleFetcher();

  // 例1: ローカルドキュメント読み込み
  const doc = await fetcher.fetchDocument('api-spec.yaml');
  console.log('Document:', doc);

  // 例2: 外部API呼び出し
  const apiData = await fetcher.fetchAPI('https://api.github.com/repos/ShunsukeHayashi/Miyabi');
  console.log('API Data:', apiData);

  // 例3: 複数ソースから同時取得
  const contexts = await fetcher.fetchMultiple([
    { source: 'api-spec.yaml', type: 'document' },
    { source: 'https://api.github.com/users/ShunsukeHayashi', type: 'api' },
  ]);
  console.log('Multiple Contexts:', contexts);

  // 例4: コンテキストを保存
  await fetcher.saveContext(contexts[0], 'api-spec-context.json');
}

// CLIから直接実行
if (import.meta.url === `file://${process.argv[1]}`) {
  example().catch(console.error);
}

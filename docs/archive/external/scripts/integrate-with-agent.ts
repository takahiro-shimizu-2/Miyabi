/**
 * Agent Integration Example
 *
 * 外部コンテキストをAgentに統合する方法のサンプル
 */

import { ExampleFetcher } from '../tools/example-fetcher.js';
// import { CoordinatorAgent } from '../../packages/coding-agents/coordinator/coordinator-agent.js';
// import type { Task } from '../../packages/coding-agents/types/index.js';

/**
 * Agent実行コンテキスト
 */
interface AgentExecutionContext {
  task: {
    id: string;
    title: string;
    description: string;
  };
  externalContext?: {
    source: string;
    content: string;
    type: string;
  }[];
}

/**
 * 外部コンテキストを統合してAgentを実行
 */
export async function executeAgentWithExternalContext(
  taskId: string,
  externalSources: string[]
): Promise<void> {
  console.log(`\n🚀 Starting agent execution with external context...`);
  console.log(`Task ID: ${taskId}`);
  console.log(`External Sources: ${externalSources.join(', ')}\n`);

  // Step 1: 外部コンテキストを取得
  const fetcher = new ExampleFetcher();
  const contexts = await fetcher.fetchMultiple(
    externalSources.map((source) => ({
      source,
      type: source.startsWith('http') ? ('api' as const) : ('document' as const),
    }))
  );

  console.log(`✅ Fetched ${contexts.length} external contexts\n`);

  // Step 2: コンテキストをAgent実行用に整形
  const executionContext: AgentExecutionContext = {
    task: {
      id: taskId,
      title: 'Example Task with External Context',
      description: 'This task includes external context',
    },
    externalContext: contexts.map((ctx) => ({
      source: ctx.source,
      content: ctx.content,
      type: ctx.type,
    })),
  };

  console.log(`📋 Execution Context:`, JSON.stringify(executionContext, null, 2));

  // Step 3: Agent実行（実際のAgent統合は後で実装）
  // const agent = new CoordinatorAgent({...});
  // await agent.execute(executionContext.task, { externalContext: executionContext.externalContext });

  console.log(`\n✅ Agent execution completed with external context integration`);
}

/**
 * 使用例
 */
async function main() {
  // 例1: GitHub API + ローカルドキュメント
  await executeAgentWithExternalContext('task-001', [
    'https://api.github.com/repos/ShunsukeHayashi/Miyabi',
    'api-spec.yaml', // external/docs/api-spec.yaml を想定
  ]);

  // 例2: 複数のドキュメント
  // await executeAgentWithExternalContext('task-002', [
  //   'design-entity-relation-model.md',
  //   'guide-label-system.md',
  // ]);
}

// CLIから直接実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

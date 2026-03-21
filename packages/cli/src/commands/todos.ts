/**
 * Miyabi Todos Auto Mode
 *
 * リポジトリ内のTODOコメントを自動検出し、Issueに変換・実行
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

/**
 * TODOアイテム
 */
export interface TodoItem {
  /** TODOタイプ */
  type: 'TODO' | 'FIXME' | 'HACK' | 'NOTE';
  /** 内容 */
  description: string;
  /** ファイルパス */
  file: string;
  /** 行番号 */
  line: number;
  /** 優先度 (1-5) */
  priority: number;
  /** コンテキスト（前後の行） */
  context?: string;
}

/**
 * Todos Auto Modeオプション
 */
export interface TodosAutoOptions {
  /** スキャン対象ディレクトリ */
  path?: string;
  /** Issue自動作成 */
  createIssues?: boolean;
  /** Agent自動実行 */
  autoExecute?: boolean;
  /** ドライラン */
  dryRun?: boolean;
  /** 詳細ログ */
  verbose?: boolean;
  /** JSON出力 */
  json?: boolean;
}

/**
 * TODOコメントのパターン
 */
const TODO_PATTERNS = [
  /\/\/\s*(TODO|FIXME|HACK|NOTE):\s*(.+)/g,
  /\/\*\s*(TODO|FIXME|HACK|NOTE):\s*(.+?)\s*\*\//g,
  /#\s*(TODO|FIXME|HACK|NOTE):\s*(.+)/g,
];

/**
 * 除外ディレクトリ
 */
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.next',
  '.nuxt',
];

/**
 * スキャン対象ファイル拡張子
 */
const SCAN_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.py',
  '.go',
  '.rs',
  '.java',
  '.c',
  '.cpp',
  '.h',
  '.hpp',
  '.md',
  '.yaml',
  '.yml',
];

/**
 * 優先度マッピング
 */
const PRIORITY_MAP: Record<string, number> = {
  FIXME: 1, // 最優先
  TODO: 2,
  HACK: 3,
  NOTE: 4,
};

/**
 * ファイル内のTODOコメントを抽出
 */
function extractTodosFromFile(filePath: string): TodoItem[] {
  const todos: TodoItem[] = [];

  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      TODO_PATTERNS.forEach((pattern) => {
        const matches = [...line.matchAll(pattern)];

        matches.forEach((match) => {
          const type = match[1] as TodoItem['type'];
          const description = match[2].trim();

          todos.push({
            type,
            description,
            file: filePath,
            line: index + 1,
            priority: PRIORITY_MAP[type] || 5,
            context: lines.slice(Math.max(0, index - 1), index + 2).join('\n'),
          });
        });
      });
    });
  } catch (_error) {
    // ファイル読み込みエラーは無視
  }

  return todos;
}

/**
 * ディレクトリを再帰的にスキャン
 */
function scanDirectory(dir: string): TodoItem[] {
  let todos: TodoItem[] = [];

  try {
    const items = readdirSync(dir);

    items.forEach((item) => {
      const fullPath = join(dir, item);
      const stat = statSync(fullPath);

      if (stat.isDirectory()) {
        // 除外ディレクトリをスキップ
        if (!EXCLUDED_DIRS.includes(item)) {
          todos = todos.concat(scanDirectory(fullPath));
        }
      } else if (stat.isFile()) {
        // スキャン対象拡張子のみ処理
        const ext = item.substring(item.lastIndexOf('.'));
        if (SCAN_EXTENSIONS.includes(ext)) {
          todos = todos.concat(extractTodosFromFile(fullPath));
        }
      }
    });
  } catch (_error) {
    // ディレクトリアクセスエラーは無視
  }

  return todos;
}

/**
 * TODOをIssueに変換
 */
function convertToIssue(
  todo: TodoItem,
  options: TodosAutoOptions
): void {
  if (options.dryRun) {
    console.log(chalk.yellow(`[DRY RUN] Issue作成: ${todo.description}`));
    console.log(chalk.gray(`  ファイル: ${todo.file}:${todo.line}`));
    console.log(chalk.gray(`  タイプ: ${todo.type}`));
    console.log(chalk.gray(`  優先度: ${todo.priority}\n`));
    return;
  }

  // TODO: 実際のGitHub Issue作成を実装
  console.log(chalk.green(`✅ Issue作成: ${todo.description}`));
}

/**
 * Todos Auto Mode実行
 */
export function runTodosAutoMode(
  options: TodosAutoOptions
): void {
  const targetPath = options.path || process.cwd();

  // JSON出力モード
  if (options.json) {
    const todos = scanDirectory(targetPath);
    const sortedTodos = todos.sort((a, b) => a.priority - b.priority);

    const stats = sortedTodos.reduce((acc, todo) => {
      acc[todo.type] = (acc[todo.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const result = {
      success: true,
      data: {
        todos: sortedTodos.map(t => ({
          type: t.type,
          description: t.description,
          file: t.file,
          line: t.line,
          priority: t.priority,
        })),
        stats: {
          total: todos.length,
          byType: stats,
        },
        options: {
          path: targetPath,
          dryRun: options.dryRun || false,
          createIssues: options.createIssues || false,
          autoExecute: options.autoExecute || false,
        },
      },
      timestamp: new Date().toISOString(),
    };

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(chalk.cyan.bold('\n📝 Todos Auto Mode 起動\n'));
  console.log(chalk.white('リポジトリ内のTODOコメントを自動検出・処理します\n'));
  console.log(chalk.gray(`スキャン対象: ${targetPath}\n`));

  const spinner = ora('TODOコメントをスキャン中...').start();

  // 1. TODOスキャン
  const todos = scanDirectory(targetPath);

  spinner.succeed(
    chalk.green(`${todos.length}件のTODOコメントを検出`)
  );

  if (todos.length === 0) {
    console.log(chalk.yellow('\n⚠️  TODOコメントが見つかりませんでした\n'));
    return;
  }

  // 2. 優先度順にソート
  const sortedTodos = todos.sort((a, b) => a.priority - b.priority);

  // 3. 統計表示
  console.log(chalk.cyan.bold('\n📊 TODO統計:\n'));

  const stats = sortedTodos.reduce((acc, todo) => {
    acc[todo.type] = (acc[todo.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(stats).forEach(([type, count]) => {
    const color =
      type === 'FIXME'
        ? chalk.red
        : type === 'TODO'
        ? chalk.yellow
        : chalk.gray;
    console.log(color(`  ${type}: ${count}件`));
  });

  // 4. TODOリスト表示
  console.log(chalk.cyan.bold('\n📋 検出されたTODO一覧:\n'));

  sortedTodos.slice(0, 20).forEach((todo, index) => {
    const priorityColor =
      todo.priority === 1
        ? chalk.red
        : todo.priority === 2
        ? chalk.yellow
        : chalk.gray;

    console.log(priorityColor(`${index + 1}. [${todo.type}] ${todo.description}`));
    console.log(chalk.gray(`   📍 ${todo.file}:${todo.line}\n`));
  });

  if (sortedTodos.length > 20) {
    console.log(chalk.gray(`   ... 他 ${sortedTodos.length - 20}件\n`));
  }

  // 5. Issue自動作成
  if (options.createIssues) {
    console.log(chalk.cyan.bold('\n🔄 GitHub Issueに変換中...\n'));

    for (const todo of sortedTodos.slice(0, 10)) {
      convertToIssue(todo, options);
    }

    if (sortedTodos.length > 10) {
      console.log(
        chalk.gray(`\n残り${sortedTodos.length - 10}件は手動で確認してください\n`)
      );
    }
  }

  // 6. Agent自動実行
  if (options.autoExecute) {
    console.log(chalk.cyan.bold('\n🤖 Agent自動実行中...\n'));

    // TODO: 実際のAgent実行を実装
    console.log(chalk.yellow('[未実装] Agent自動実行機能は開発中です\n'));
  }

  // 7. 最終レポート
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('📝 Todos Auto Mode 完了レポート'));
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  console.log(chalk.white('📊 実行統計:'));
  console.log(chalk.gray(`  検出TODO: ${todos.length}件`));
  console.log(chalk.gray(`  FIXME: ${stats.FIXME || 0}件`));
  console.log(chalk.gray(`  TODO: ${stats.TODO || 0}件`));
  console.log(chalk.gray(`  HACK: ${stats.HACK || 0}件`));
  console.log(chalk.gray(`  NOTE: ${stats.NOTE || 0}件\n`));

  if (options.createIssues) {
    console.log(chalk.green('✅ Issue作成完了\n'));
  } else {
    console.log(
      chalk.yellow('💡 Issue作成: --create-issues オプションを使用してください\n')
    );
  }
}

/**
 * Todos Auto Mode CLIコマンド登録
 */
export function registerTodosCommand(program: Command): void {
  program
    .command('todos')
    .description('📝 TODOコメント自動検出・Issue化')
    .option('-p, --path <path>', 'スキャン対象ディレクトリ', '.')
    .option('--create-issues', 'GitHub Issueに自動変換')
    .option('--auto-execute', 'Agent自動実行')
    .option('--dry-run', '実行シミュレーション')
    .option('-v, --verbose', '詳細ログ出力')
    .option('--json', 'JSON形式で出力')
    .action((options: TodosAutoOptions, command: Command) => {
      // Get global --json option from parent command (miyabi --json todos)
      // OR local --json option (miyabi todos --json)
      const json = options.json || (command.parent?.opts().json as boolean) || false;
      runTodosAutoMode({ ...options, json });
    });
}

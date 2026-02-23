#!/usr/bin/env node

/**
 * Miyabi - 一つのコマンドで全てが完結
 */

import { Command } from 'commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { init } from './commands/init';
import { install } from './commands/install';
import { status } from './commands/status';
import { config } from './commands/config';
import { setup } from './commands/setup';
import { docs } from './commands/docs';
import { doctor } from './commands/doctor';
import { onboard } from './commands/onboard';
import { registerAgentCommand } from './commands/agent';
import { registerAutoModeCommand } from './commands/auto';
import { registerTodosCommand } from './commands/todos';
import { registerAuthCommand } from './commands/auth';
import { registerDashboardCommand } from './commands/dashboard';
import { registerRunCommand } from './commands/run';
import { createOmegaCommand } from './commands/omega';
import { registerPipelineCommand } from './commands/pipeline';
import { registerHealthCommand } from './commands/health';
import { loadConfig, applyConfigToEnvironment } from './config/loader';
import {
  reportIssueToMiyabi,
  gatherEnvironmentInfo,
  gatherProjectContext,
  inferUserIntent,
  type FeedbackContext,
} from './feedback/issue-reporter';
import { isJsonMode, outputError } from './utils/agent-output';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf-8'));

// Load and apply configuration at startup
try {
  const userConfig = loadConfig({ silent: true });
  applyConfigToEnvironment(userConfig);
} catch (error) {
  // Silently fail if config doesn't exist - it's optional
}

/**
 * Detect if running in Claude Code environment
 */
function isClaudeCodeEnvironment(): boolean {
  return (
    process.env.CLAUDE_CODE === 'true' ||
    process.env.ANTHROPIC_CLI === 'true' ||
    process.env.TERM_PROGRAM === 'Claude' ||
    !!process.env.ANTHROPIC_API_KEY
  );
}

/**
 * Check if running in interactive terminal
 */
function isInteractiveTerminal(): boolean {
  return process.stdin.isTTY && process.stdout.isTTY && !isClaudeCodeEnvironment();
}

const program = new Command();

program
  .name('miyabi')
  .description('✨ Miyabi - 一つのコマンドで全てが完結する自律型開発フレームワーク')
  .version(packageJson.version)
  .option('--json', 'Output in JSON format (for AI agents)')
  .option('-y, --yes', 'Auto-confirm all prompts (non-interactive mode)')
  .option('-v, --verbose', 'Verbose output with detailed logs')
  .option('--debug', 'Debug mode with extra detailed logs');

// ============================================================================
// Single Command Interface
// ============================================================================

program
  .action(async () => {
    // Claude Code環境では引数なしの場合にヘルプを表示
    if (isClaudeCodeEnvironment()) {
      console.log(chalk.cyan.bold('\n✨ Miyabi\n'));
      console.log(chalk.gray('一つのコマンドで全てが完結する自律型開発フレームワーク\n'));
      console.log(chalk.yellow('💡 Claude Code環境が検出されました\n'));
      console.log(chalk.white('利用可能なコマンド:\n'));
      console.log(chalk.cyan.bold('主要コマンド (Recommended):'));
      console.log(chalk.cyan('  npx miyabi run') + chalk.gray('                - ワンコマンド実行（推奨）'));
      console.log(chalk.cyan('  npx miyabi fix <issue>') + chalk.gray('        - バグ修正'));
      console.log(chalk.cyan('  npx miyabi build <issue>') + chalk.gray('      - 機能追加'));
      console.log(chalk.cyan('  npx miyabi ship') + chalk.gray('               - デプロイ（承認ゲート付き）'));
      console.log('');
      console.log(chalk.gray('詳細コマンド:'));
      console.log(chalk.gray('  npx miyabi init <project-name>  - 新規プロジェクト作成'));
      console.log(chalk.gray('  npx miyabi install              - 既存プロジェクトに追加'));
      console.log(chalk.gray('  npx miyabi status               - ステータス確認'));
      console.log(chalk.gray('  npx miyabi doctor               - ヘルスチェック・診断\n'));
      console.log(chalk.gray('詳細: npx miyabi --help\n'));
      process.exit(0);
    }

    // 対話モード（通常のターミナル環境）
    if (!isInteractiveTerminal()) {
      // AI agent向けJSON出力
      if (isJsonMode()) {
        outputError(
          'INVALID_COMMAND_OR_NON_INTERACTIVE',
          'Interactive mode not available in non-interactive terminal',
          true,
          'Specify a command directly: miyabi status --json'
        );
        process.exit(1);
      }

      // Steve Jobs風: 初回体験を美しく
      console.log('');
      console.log(chalk.white.bold('  ✨ Miyabi'));
      console.log(chalk.gray('  Beauty in Autonomous Development'));
      console.log('');
      console.log(chalk.white('  One command. That\'s it.'));
      console.log('');
      console.log(chalk.cyan('  miyabi run') + chalk.gray('    - Do everything automatically'));
      console.log(chalk.cyan('  miyabi status') + chalk.gray(' - See what\'s happening'));
      console.log(chalk.cyan('  miyabi doctor') + chalk.gray(' - Check if everything works'));
      console.log('');
      console.log(chalk.gray('  First time? Try: miyabi doctor'));
      console.log('');
      process.exit(0);
    }

    console.log(chalk.cyan.bold('\n✨ Miyabi\n'));
    console.log(chalk.gray('一つのコマンドで全てが完結\n'));

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '何をしますか？',
        choices: [
          { name: '🌸 初めての方（初回セットアップ）', value: 'onboard' },
          { name: '🆕 新しいプロジェクトを作成', value: 'init' },
          { name: '📦 既存プロジェクトに追加', value: 'install' },
          { name: '📊 ステータス確認', value: 'status' },
          { name: '🩺 ヘルスチェック・診断', value: 'doctor' },
          { name: '🎨 ダッシュボード管理', value: 'dashboard' },
          { name: '📚 ドキュメント生成', value: 'docs' },
          { name: '⚙️  設定', value: 'config' },
          { name: '❌ 終了', value: 'exit' },
        ],
      },
    ]);

    if (action === 'exit') {
      console.log(chalk.gray('\n👋 またね！\n'));
      process.exit(0);
    }

    try {
      switch (action) {
        case 'onboard': {
          await onboard({});
          break;
        }

        case 'setup': {
          await setup({});
          break;
        }

        case 'init': {
          const { projectName, isPrivate } = await inquirer.prompt([
            {
              type: 'input',
              name: 'projectName',
              message: 'プロジェクト名:',
              default: 'my-project',
              validate: (input) => {
                if (!input) return 'プロジェクト名を入力してください';
                if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
                  return '英数字、ハイフン、アンダースコアのみ使用可能です';
                }
                return true;
              },
            },
            {
              type: 'confirm',
              name: 'isPrivate',
              message: 'プライベートリポジトリにしますか？',
              default: false,
            },
          ]);

          console.log(chalk.cyan.bold('\n🚀 セットアップ開始...\n'));
          await init(projectName, { private: isPrivate, skipInstall: false });
          break;
        }

        case 'install': {
          const { dryRun } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'dryRun',
              message: 'ドライラン（実際には変更しない）で確認しますか？',
              default: false,
            },
          ]);

          console.log(chalk.cyan.bold('\n🔍 プロジェクト解析中...\n'));
          await install({ dryRun });
          break;
        }

        case 'status': {
          const { watch } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'watch',
              message: 'ウォッチモード（10秒ごとに自動更新）を有効にしますか？',
              default: false,
            },
          ]);

          await status({ watch });
          break;
        }

        case 'docs': {
          const { inputDir, outputFile, watch, training } = await inquirer.prompt([
            {
              type: 'input',
              name: 'inputDir',
              message: 'ソースディレクトリを指定してください:',
              default: './scripts',
            },
            {
              type: 'input',
              name: 'outputFile',
              message: '出力ファイル名を指定してください:',
              default: './docs/API.md',
            },
            {
              type: 'confirm',
              name: 'watch',
              message: 'ウォッチモード（自動更新）を有効にしますか？',
              default: false,
            },
            {
              type: 'confirm',
              name: 'training',
              message: 'トレーニング資料も生成しますか？',
              default: false,
            },
          ]);

          await docs({ input: inputDir, output: outputFile, watch, training });
          break;
        }

        case 'config': {
          await config({});
          break;
        }

        case 'doctor': {
          const { verbose } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'verbose',
              message: '詳細な診断情報を表示しますか？',
              default: false,
            },
          ]);

          await doctor({ verbose });
          break;
        }

        case 'dashboard': {
          const { dashboardAction } = await inquirer.prompt([
            {
              type: 'list',
              name: 'dashboardAction',
              message: 'ダッシュボード操作を選択してください:',
              choices: [
                { name: '🔄 リフレッシュ', value: 'refresh' },
                { name: '📊 状態確認', value: 'status' },
                { name: '🌐 ブラウザで開く', value: 'open' },
              ],
            },
          ]);

          // Import dashboard functions dynamically
          const { registerDashboardCommand } = await import('./commands/dashboard.js');
          const dashboardCmd = new Command('dashboard');
          registerDashboardCommand(dashboardCmd);

          if (dashboardAction === 'refresh') {
            console.log(chalk.cyan.bold('\n🔄 ダッシュボードをリフレッシュ中...\n'));
            await dashboardCmd.parse(['node', 'miyabi', 'dashboard', 'refresh']);
          } else if (dashboardAction === 'status') {
            await dashboardCmd.parse(['node', 'miyabi', 'dashboard', 'status']);
          } else if (dashboardAction === 'open') {
            await dashboardCmd.parse(['node', 'miyabi', 'dashboard', 'open']);
          }
          break;
        }
      }
    } catch (error) {
      console.log(chalk.red.bold('\n❌ エラーが発生しました\n'));

      if (error instanceof Error) {
        console.log(chalk.red(`原因: ${error.message}\n`));

        // 自動Issue起票（一周 - 人の手が必要な問題として報告）
        await handleErrorAndReport(action, error);

        // エラーの種類に応じた対処法を表示
        if (error.message.includes('authentication') || error.message.includes('OAuth')) {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. GitHubの認証をもう一度試してください'));
          console.log(chalk.white('  2. ブラウザでコードを正しく入力したか確認してください'));
          console.log(chalk.white('  3. 必要な権限（repo, workflow）が付与されているか確認してください\n'));
        } else if (error.message.includes('repository') || error.message.includes('repo')) {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. リポジトリ名が既に存在していないか確認してください'));
          console.log(chalk.white('  2. GitHubのアクセス権限を確認してください'));
          console.log(chalk.white('  3. インターネット接続を確認してください\n'));
        } else if (error.message.includes('git') || error.message.includes('Not a git repository')) {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. Gitリポジトリのディレクトリで実行してください'));
          console.log(chalk.white('  2. `git init`でリポジトリを初期化してください'));
          console.log(chalk.white('  3. リモートリポジトリが設定されているか確認してください\n'));
        } else if (error.message.includes('GITHUB_TOKEN')) {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. 環境変数 GITHUB_TOKEN を設定してください'));
          console.log(chalk.white('  2. `export GITHUB_TOKEN=ghp_your_token`'));
          console.log(chalk.white('  3. もしくは miyabi を実行して認証してください\n'));
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. インターネット接続を確認してください'));
          console.log(chalk.white('  2. GitHubのステータスを確認してください: https://www.githubstatus.com'));
          console.log(chalk.white('  3. プロキシ設定を確認してください\n'));
        } else {
          console.log(chalk.yellow('💡 対処法:'));
          console.log(chalk.white('  1. インターネット接続を確認してください'));
          console.log(chalk.white('  2. もう一度実行してみてください'));
          console.log(chalk.white('  3. 問題が続く場合はイシューを作成してください:'));
          console.log(chalk.cyan('     https://github.com/ShunsukeHayashi/Autonomous-Operations/issues\n'));
        }
      } else {
        console.log(chalk.gray('予期しないエラーが発生しました\n'));
      }

      process.exit(1);
    }
  });

// ============================================================================
// Direct Command Interface (for CLI mode)
// ============================================================================

program
  .command('init <project-name>')
  .description('新しいプロジェクトを作成')
  .option('-p, --private', 'プライベートリポジトリとして作成')
  .option('--skip-install', 'npm installをスキップ')
  .option('--json', 'JSON形式で出力')
  .option('-y, --yes', 'すべてのプロンプトを自動承認')
  .action(async (projectName: string, options: { private?: boolean; skipInstall?: boolean; json?: boolean; yes?: boolean }) => {
    await init(projectName, options);
  });

program
  .command('install')
  .description('既存プロジェクトにMiyabiを追加')
  .option('--dry-run', 'ドライラン（実際には変更しない）')
  .option('--non-interactive', '非対話モード（プロンプトをスキップ）')
  .option('-y, --yes', 'すべてのプロンプトを自動承認')
  .option('--json', 'JSON形式で出力')
  .action(async (options: { dryRun?: boolean; nonInteractive?: boolean; yes?: boolean; json?: boolean }) => {
    await install(options);
  });

program
  .command('status')
  .description('プロジェクトの状態を確認')
  .option('-w, --watch', 'ウォッチモード（自動更新）')
  .option('--json', 'JSON形式で出力')
  .action(async (options: { watch?: boolean; json?: boolean }) => {
    await status(options);
  });

program
  .command('docs')
  .description('ドキュメントを生成')
  .option('-i, --input <dir>', 'ソースディレクトリ', './scripts')
  .option('-o, --output <file>', '出力ファイル', './docs/API.md')
  .option('-w, --watch', 'ウォッチモード')
  .option('-t, --training', 'トレーニング資料も生成')
  .option('--json', 'JSON形式で出力')
  .action(async (options: { input?: string; output?: string; watch?: boolean; training?: boolean; json?: boolean }) => {
    await docs(options);
  });

program
  .command('config')
  .description('設定を管理')
  .option('--json', 'JSON形式で出力')
  .action(async (options: { json?: boolean }) => {
    await config(options);
  });

program
  .command('setup')
  .description('セットアップガイドを表示')
  .option('--non-interactive', '非対話モード（プロンプトをスキップ）')
  .option('-y, --yes', 'すべてのプロンプトを自動承認')
  .option('--skip-token', 'トークンセットアップをスキップ')
  .option('--skip-config', '設定をスキップ')
  .option('--json', 'JSON形式で出力')
  .action(async (options: { nonInteractive?: boolean; yes?: boolean; skipToken?: boolean; skipConfig?: boolean; json?: boolean }) => {
    await setup(options);
  });

program
  .command('doctor')
  .description('システムヘルスチェックと診断')
  .option('-v, --verbose', '詳細な診断情報を表示')
  .action(async (options: { verbose?: boolean }, command: Command) => {
    // Get global --json option from parent command
    const json = command.parent?.opts().json || false;
    await doctor({ ...options, json });
  });

program
  .command('onboard')
  .description('初回セットアップウィザード')
  .option('--skip-demo', 'デモプロジェクト作成をスキップ')
  .option('--skip-tour', '機能紹介をスキップ')
  .option('--non-interactive', '非対話モード')
  .option('-y, --yes', 'すべてのプロンプトを自動承認')
  .action(async (options: { skipDemo?: boolean; skipTour?: boolean; nonInteractive?: boolean; yes?: boolean }) => {
    await onboard(options);
  });

// Register agent command
registerAgentCommand(program);

// Register auth command
registerAuthCommand(program);

// Register auto mode command
registerAutoModeCommand(program);

// Register todos command
registerTodosCommand(program);

// Register dashboard command
registerDashboardCommand(program);

// Register run command (simplified execution interface)
registerRunCommand(program);

// Register omega command (Ω-System autonomous execution)
program.addCommand(createOmegaCommand());

// Register pipeline command (command composition)
registerPipelineCommand(program);

// Register health command (quick health check endpoint)
registerHealthCommand(program);

/**
 * Handle error and report to Miyabi repository
 * 一周（人の手が必要な問題）として自動起票
 */
async function handleErrorAndReport(action: string, error: Error): Promise<void> {
  try {
    // Gather context
    const context: FeedbackContext = {
      command: `miyabi ${action}`,
      errorMessage: error.message,
      errorStack: error.stack,
      userIntent: inferUserIntent(`miyabi ${action}`),
      environment: gatherEnvironmentInfo(),
      projectContext: gatherProjectContext(),
    };

    // Try to get GitHub token from environment
    const token = process.env.GITHUB_TOKEN;

    if (token) {
      console.log(chalk.gray('📤 自動的にMiyabiプロジェクトに問題を報告しています...\n'));

      const result = await reportIssueToMiyabi(context, token);

      if (result.created && result.issueUrl) {
        console.log(chalk.green(`✓ 問題を報告しました（一周 - 人の手が必要）: ${result.issueUrl}\n`));
        console.log(chalk.gray('  開発チームが対応します。進捗はGitHub Issueで確認できます。\n'));
      } else if (result.reason === 'Similar issue already exists' && result.issueUrl) {
        console.log(chalk.yellow(`⚠ 類似の問題が既に報告されています: ${result.issueUrl}\n`));
        console.log(chalk.gray('  こちらのIssueで進捗を確認できます。\n'));
      }
    } else {
      console.log(chalk.gray('💡 この問題を自動報告するには GITHUB_TOKEN を設定してください\n'));
    }
  } catch (reportError) {
    // Issue報告自体が失敗しても、元のエラー処理は続行
    console.log(chalk.gray('（自動報告をスキップしました）\n'));
  }
}

// Steve Jobs風: エラーメッセージを美しく
program.configureOutput({
  writeErr: (str) => {
    // Commander.jsのデフォルトエラーを書き換え
    if (str.includes('missing required argument')) {
      const match = str.match(/missing required argument '(.+?)'/);
      const arg = match ? match[1] : 'argument';
      console.log('');
      console.log(chalk.white(`  Oops! I need a ${chalk.cyan(arg)} to continue.`));
      console.log('');
      console.log(chalk.gray(`  Example: miyabi init ${chalk.white('my-awesome-project')}`));
      console.log('');
    } else if (str.includes('unknown command')) {
      const match = str.match(/unknown command '(.+?)'/);
      const cmd = match ? match[1] : 'command';
      console.log('');
      console.log(chalk.white(`  Hmm, I don't know "${chalk.yellow(cmd)}".`));
      console.log('');
      console.log(chalk.gray('  Try one of these:'));
      console.log(chalk.cyan('    miyabi run') + chalk.gray('    - Do everything'));
      console.log(chalk.cyan('    miyabi status') + chalk.gray(' - See what\'s happening'));
      console.log(chalk.cyan('    miyabi doctor') + chalk.gray(' - Check your setup'));
      console.log('');
    } else {
      process.stderr.write(str);
    }
  },
});

program.parse(process.argv);

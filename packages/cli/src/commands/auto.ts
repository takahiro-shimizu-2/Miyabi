/**
 * Miyabi Auto Mode - Water Spider Agent
 *
 * トヨタ生産方式のウォータースパイダーにインスパイアされた全自動モード
 * システム全体を巡回監視し、自律的に判断・実行を継続
 */

import chalk from 'chalk';
import ora from 'ora';
import type { Command } from 'commander';
import { runAgent, type AgentType } from './agent';
import { Octokit } from '@octokit/rest';
import { execCommandSafe } from '../utils/cross-platform';

/**
 * Auto Mode設定
 */
export interface AutoModeOptions {
  /** 監視間隔（秒） */
  interval?: number;
  /** 最大実行時間（分） */
  maxDuration?: number;
  /** 並行実行数 */
  concurrency?: number;
  /** TODOコメント監視 */
  scanTodos?: boolean;
  /** ドライラン */
  dryRun?: boolean;
  /** 詳細ログ */
  verbose?: boolean;
}

/**
 * Agent実行判断結果
 */
export interface Decision {
  /** 実行すべきか */
  shouldExecute: boolean;
  /** 実行するAgent */
  agent?: AgentType;
  /** 対象Issue/PR */
  target?: string;
  /** 理由 */
  reason: string;
  /** 優先度 */
  priority: number;
}

/**
 * Water Spider Agent状態
 */
interface WaterSpiderState {
  /** 開始時刻 */
  startTime: number;
  /** 巡回回数 */
  cycleCount: number;
  /** 実行したAgent数 */
  executedAgents: number;
  /** スキップ数 */
  skippedDecisions: number;
  /** エラー数 */
  errorCount: number;
  /** 停止フラグ */
  shouldStop: boolean;
}

/**
 * GitHubリポジトリ情報を取得
 */
function getGitHubRepo(): { owner: string; repo: string } | null {
  const result = execCommandSafe('git remote get-url origin', { silent: true });

  if (result.success) {
    const match = result.output.match(/github\.com[:/](.+?)\/(.+?)(\.git)?$/);
    if (match) {
      return { owner: match[1], repo: match[2] };
    }
  }

  return null;
}

/**
 * システム状態を監視・分析
 */
async function monitorAndAnalyze(options?: { scanTodos?: boolean }): Promise<Decision> {
  const decisions: Decision[] = [];

  // GitHub認証トークン取得
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return {
      shouldExecute: false,
      reason: 'GITHUB_TOKENが設定されていません',
      priority: 0,
    };
  }

  // リポジトリ情報取得
  const repoInfo = getGitHubRepo();
  if (!repoInfo) {
    return {
      shouldExecute: false,
      reason: 'Gitリポジトリが見つかりません',
      priority: 0,
    };
  }

  const { owner, repo } = repoInfo;
  const octokit = new Octokit({ auth: token });

  try {
    // 未処理のIssue一覧取得
    const { data: issues } = await octokit.issues.listForRepo({
      owner,
      repo,
      state: 'open',
      per_page: 50,
    });

    // 各Issueを分析して優先順位付け
    for (const issue of issues) {
      const labels = issue.labels.map((l) => (typeof l === 'string' ? l : l.name || ''));

      // ブロック状態のIssueはスキップ
      if (labels.some((l) => l.includes('blocked') || l.includes('paused'))) {
        continue;
      }

      // 優先度を計算
      let priority = 5; // デフォルト

      // 緊急度ラベル
      if (labels.some((l) => l.includes('P0') || l.includes('critical'))) {
        priority += 5;
      } else if (labels.some((l) => l.includes('P1') || l.includes('high'))) {
        priority += 3;
      }

      // セキュリティ関連
      if (labels.some((l) => l.includes('security') || l.includes('vulnerability'))) {
        priority += 4;
      }

      // 規模（小さいほど優先）
      if (labels.some((l) => l.includes('size:small') || l.includes('規模-小'))) {
        priority += 2;
      }

      // 状態に応じたAgent判断
      let agent: AgentType = 'issue';
      let reason = '';

      if (labels.some((l) => l.includes('pending')) || !labels.some((l) => l.includes('state:'))) {
        agent = 'issue';
        reason = '新規Issue - 分析・ラベリングが必要';
        priority += 2;
      } else if (labels.some((l) => l.includes('analyzing'))) {
        agent = 'codegen';
        reason = 'Issue分析完了 - コード実装が必要';
        priority += 1;
      } else if (labels.some((l) => l.includes('implementing'))) {
        agent = 'review';
        reason = 'コード実装完了 - レビューが必要';
        priority += 0;
      } else if (labels.some((l) => l.includes('reviewing'))) {
        agent = 'pr';
        reason = 'レビュー完了 - PR作成が必要';
        priority -= 1;
      } else {
        // すでに処理中または完了
        continue;
      }

      decisions.push({
        shouldExecute: true,
        agent,
        target: `#${issue.number}`,
        reason: `${reason} - ${issue.title}`,
        priority,
      });
    }

    // TODOコメント監視 (オプション)
    if (options?.scanTodos && decisions.length === 0) {
      decisions.push({
        shouldExecute: true,
        agent: 'issue',
        target: 'todos',
        reason: 'TODOコメント検出、Issue化必要',
        priority: 6,
      });
    }

  } catch (error) {
    if (error instanceof Error) {
      return {
        shouldExecute: false,
        reason: `GitHub API エラー: ${error.message}`,
        priority: 0,
      };
    }
  }

  // 実行可能なタスクがない場合
  if (decisions.length === 0) {
    return {
      shouldExecute: false,
      reason: '実行可能なタスクなし',
      priority: 0,
    };
  }

  // 最高優先度の判断を返す
  return decisions.sort((a, b) => b.priority - a.priority)[0];
}

/**
 * 判断に基づきAgentを実行
 */
async function executeDecision(
  decision: Decision,
  options: AutoModeOptions
): Promise<boolean> {
  if (!decision.shouldExecute || !decision.agent) {
    return false;
  }

  if (options.dryRun) {
    console.log(chalk.yellow(`[DRY RUN] ${decision.agent}Agent実行: ${decision.target}`));
    console.log(chalk.gray(`  理由: ${decision.reason}\n`));
    return true;
  }

  try {
    // 実際のAgent実行
    const result = await runAgent(decision.agent, {
      issue: decision.target,
      dryRun: options.dryRun,
      verbose: options.verbose,
    });

    if (result.status === 'success') {
      console.log(chalk.green(`✅ ${decision.agent}Agent実行成功: ${decision.target}`));
      if (options.verbose && result.details) {
        console.log(chalk.gray(JSON.stringify(result.details, null, 2)));
      }
      return true;
    } else {
      console.log(chalk.yellow(`⚠️  ${decision.agent}Agent実行失敗: ${result.message}`));
      return false;
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`❌ Agent実行エラー: ${error.message}`));
    }
    return false;
  }
}

/**
 * Water Spider Auto Mode実行
 */
export async function runAutoMode(options: AutoModeOptions): Promise<void> {
  const state: WaterSpiderState = {
    startTime: Date.now(),
    cycleCount: 0,
    executedAgents: 0,
    skippedDecisions: 0,
    errorCount: 0,
    shouldStop: false,
  };

  const interval = (options.interval || 10) * 1000; // 秒→ミリ秒
  const maxDuration = (options.maxDuration || 60) * 60 * 1000; // 分→ミリ秒

  console.log(chalk.cyan.bold('\n🕷️  Water Spider Agent - Auto Mode 起動\n'));
  console.log(chalk.white('システム全体を巡回監視し、自律的に判断・実行を継続します\n'));
  console.log(chalk.gray(`監視間隔: ${options.interval || 10}秒`));
  console.log(chalk.gray(`最大実行時間: ${options.maxDuration || 60}分`));
  console.log(chalk.gray(`並行実行数: ${options.concurrency || 1}\n`));
  console.log(chalk.yellow('停止: Ctrl+C\n'));

  // Ctrl+Cハンドラー
  process.on('SIGINT', () => {
    console.log(chalk.yellow('\n\n⚠️  停止シグナル受信'));
    state.shouldStop = true;
  });

  const spinner = ora('巡回開始...').start();

  while (!state.shouldStop) {
    try {
      state.cycleCount++;
      spinner.text = `巡回 #${state.cycleCount} - 状態分析中...`;

      // 1. 監視・分析
      const decision = await monitorAndAnalyze({ scanTodos: options.scanTodos });

      // 2. 判断
      if (decision.shouldExecute) {
        spinner.succeed(
          chalk.green(
            `巡回 #${state.cycleCount}: ${decision.agent}Agent実行判断 (${decision.target})`
          )
        );
        console.log(chalk.gray(`  理由: ${decision.reason}`));
        console.log(chalk.gray(`  優先度: ${decision.priority}/10\n`));

        // 3. 実行
        const executed = await executeDecision(decision, options);

        if (executed) {
          state.executedAgents++;
        } else {
          state.skippedDecisions++;
        }
      } else {
        spinner.info(chalk.gray(`巡回 #${state.cycleCount}: ${decision.reason}`));
        state.skippedDecisions++;
      }

      // 4. 停止条件チェック
      const elapsed = Date.now() - state.startTime;

      if (elapsed >= maxDuration) {
        spinner.warn(chalk.yellow('最大実行時間に達しました'));
        state.shouldStop = true;
        break;
      }

      if (state.errorCount >= 10) {
        spinner.fail(chalk.red('エラー上限到達'));
        state.shouldStop = true;
        break;
      }

      // 5. 次の巡回まで待機
      if (!state.shouldStop) {
        spinner.start(`次の巡回まで待機... (${interval / 1000}秒)`);
        await new Promise(resolve => setTimeout(resolve, interval));
      }

    } catch (error) {
      state.errorCount++;
      spinner.fail(chalk.red(`巡回 #${state.cycleCount} でエラー発生`));

      if (error instanceof Error) {
        console.error(chalk.red(`エラー: ${error.message}\n`));

        if (options.verbose) {
          console.error(chalk.gray(error.stack));
        }
      }

      if (state.errorCount < 10) {
        spinner.start('エラー後、巡回継続...');
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
  }

  // 最終レポート
  spinner.stop();
  console.log(chalk.cyan.bold('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.cyan.bold('🕷️  Water Spider Auto Mode 終了レポート'));
  console.log(chalk.cyan.bold('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  const duration = Math.floor((Date.now() - state.startTime) / 1000);
  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;

  console.log(chalk.white('📊 実行統計:'));
  console.log(chalk.gray(`  総巡回回数: ${state.cycleCount}回`));
  console.log(chalk.gray(`  Agent実行: ${state.executedAgents}回`));
  console.log(chalk.gray(`  スキップ: ${state.skippedDecisions}回`));
  console.log(chalk.gray(`  エラー: ${state.errorCount}回`));
  console.log(chalk.gray(`  実行時間: ${minutes}分${seconds}秒\n`));

  if (state.executedAgents > 0) {
    console.log(chalk.green('✅ Auto Mode正常終了\n'));
  } else {
    console.log(chalk.yellow('⚠️  実行可能なタスクがありませんでした\n'));
  }
}

/**
 * Auto Mode CLIコマンド登録
 */
export function registerAutoModeCommand(program: Command): void {
  program
    .command('auto')
    .description('🕷️  全自動モード - Water Spider Agent起動')
    .option('-i, --interval <seconds>', '監視間隔（秒）', '10')
    .option('-m, --max-duration <minutes>', '最大実行時間（分）', '60')
    .option('-c, --concurrency <number>', '並行実行数', '1')
    .option('--scan-todos', 'TODOコメント監視を有効化')
    .option('--dry-run', '実行シミュレーション')
    .option('-v, --verbose', '詳細ログ出力')
    .option('--json', 'JSON形式で出力')
    .action(async (options: AutoModeOptions & { json?: boolean }) => {
      await runAutoMode({
        interval: parseInt(options.interval as unknown as string),
        maxDuration: parseInt(options.maxDuration as unknown as string),
        concurrency: parseInt(options.concurrency as unknown as string),
        scanTodos: options.scanTodos,
        dryRun: options.dryRun,
        verbose: options.verbose,
      });
    });
}

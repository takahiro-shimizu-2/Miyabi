/**
 * Automatic Issue Reporter to Miyabi Repository
 *
 * When Miyabi fails to fulfill user's intent, automatically report to:
 * https://github.com/ShunsukeHayashi/Miyabi/issues
 *
 * これは「一周（いっしゅう）」- 人の手が必要な問題として起票される
 */

import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';

const MIYABI_OWNER = 'ShunsukeHayashi';
const MIYABI_REPO = 'Miyabi';

export interface FeedbackContext {
  command: string;           // 実行されたコマンド (e.g., "miyabi init my-project")
  errorMessage: string;      // エラーメッセージ
  errorStack?: string;       // スタックトレース
  userIntent?: string;       // ユーザーの意図（推定）
  environment: {
    nodeVersion: string;
    platform: string;
    miyabiVersion: string;
  };
  projectContext?: {
    hasGit: boolean;
    hasPackageJson: boolean;
    language?: string;
  };
}

export interface IssueReportResult {
  created: boolean;
  issueNumber?: number;
  issueUrl?: string;
  reason?: string;
}

/**
 * Report issue to Miyabi repository
 *
 * 一周（人の手が必要な問題）として自動起票
 */
export async function reportIssueToMiyabi(
  context: FeedbackContext,
  token?: string
): Promise<IssueReportResult> {
  // GitHub tokenがない場合はスキップ
  if (!token) {
    return {
      created: false,
      reason: 'GitHub token not available',
    };
  }

  try {
    const octokit = new Octokit({ auth: token });

    // Issue本文を生成
    const issueBody = generateIssueBody(context);
    const issueTitle = generateIssueTitle(context);

    // 重複チェック（同じエラーが既に報告されているか）
    const existingIssue = await checkDuplicateIssue(octokit, context);
    if (existingIssue) {
      return {
        created: false,
        issueNumber: existingIssue.number,
        issueUrl: existingIssue.html_url,
        reason: 'Similar issue already exists',
      };
    }

    // Issue作成
    const response = await octokit.issues.create({
      owner: MIYABI_OWNER,
      repo: MIYABI_REPO,
      title: issueTitle,
      body: issueBody,
      labels: [
        'type:bug',
        'priority:P2-Medium',
        'state:pending',
        'category:dx',
        'source:auto-reported', // 自動報告であることを示す
        '一周', // 人の手が必要
      ],
    });

    return {
      created: true,
      issueNumber: response.data.number,
      issueUrl: response.data.html_url,
    };
  } catch (error) {
    // Issue作成自体が失敗した場合はローカルログに記録
    saveLocalFeedback(context);

    return {
      created: false,
      reason: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Generate Issue title from context
 */
function generateIssueTitle(context: FeedbackContext): string {
  const command = context.command.replace('miyabi ', '');
  const errorType = extractErrorType(context.errorMessage);

  return `[自動報告] ${command} failed: ${errorType}`;
}

/**
 * Generate Issue body from context
 */
function generateIssueBody(context: FeedbackContext): string {
  const { command, errorMessage, errorStack, userIntent, environment, projectContext } = context;

  return `## 🔴 自動報告：ユーザー意図の実現失敗

このIssueはMiyabiが自動的に作成しました。
ユーザーの意図を実現できなかった問題として「**一周**」（人の手が必要）に分類されます。

---

## ユーザーの意図（推定）

${userIntent || 'ユーザーは以下のコマンドを実行しようとしました'}

\`\`\`bash
${command}
\`\`\`

---

## エラー内容

\`\`\`
${errorMessage}
\`\`\`

${errorStack ? `### スタックトレース\n\`\`\`\n${errorStack}\n\`\`\`\n` : ''}

---

## 実行環境

- **Miyabiバージョン**: ${environment.miyabiVersion}
- **Node.js**: ${environment.nodeVersion}
- **プラットフォーム**: ${environment.platform}

${projectContext ? `
## プロジェクトコンテキスト

- **Git repository**: ${projectContext.hasGit ? '✓' : '✗'}
- **package.json**: ${projectContext.hasPackageJson ? '✓' : '✗'}
- **言語**: ${projectContext.language || 'Unknown'}
` : ''}

---

## 対応が必要な理由

この問題は以下の理由により**一周**（人の手が必要）に分類されます:

1. ✅ ユーザーの意図が明確だが実現できなかった
2. ✅ 自動リカバリーが不可能
3. ✅ フレームワークの改善が必要

## 推奨される対応

- [ ] エラーメッセージをより具体的にする
- [ ] ユーザーガイドに対処法を追加する
- [ ] 自動リカバリー機能を実装する
- [ ] 根本原因を修正する

---

🤖 この Issue は Miyabi v${environment.miyabiVersion} によって自動生成されました
📅 報告日時: ${new Date().toISOString()}
🏷️ ラベル: \`一周\` - 人の手が必要な問題
`;
}

/**
 * Extract error type from error message
 */
function extractErrorType(errorMessage: string): string {
  // Common error patterns
  if (errorMessage.includes('authentication failed')) {
    return 'GitHub認証失敗';
  }
  if (errorMessage.includes('repository creation failed')) {
    return 'リポジトリ作成失敗';
  }
  if (errorMessage.includes('not found')) {
    return 'リソース未発見';
  }
  if (errorMessage.includes('permission denied')) {
    return '権限エラー';
  }
  if (errorMessage.includes('network')) {
    return 'ネットワークエラー';
  }

  // Default: first 50 chars
  return errorMessage.substring(0, 50);
}

/**
 * Check if similar issue already exists
 */
async function checkDuplicateIssue(
  octokit: Octokit,
  context: FeedbackContext
): Promise<{ number: number; html_url: string } | null> {
  const errorType = extractErrorType(context.errorMessage);
  const searchQuery = `repo:${MIYABI_OWNER}/${MIYABI_REPO} is:issue is:open "${errorType}"`;

  try {
    const response = await octokit.search.issuesAndPullRequests({
      q: searchQuery,
      per_page: 5,
    });

    // 類似のIssueが既にある場合
    if (response.data.total_count > 0) {
      const issue = response.data.items[0];
      return {
        number: issue.number,
        html_url: issue.html_url,
      };
    }

    return null;
  } catch (_error) {
    // 検索失敗時はnullを返す（重複チェックをスキップ）
    return null;
  }
}

/**
 * Save feedback locally if Issue creation fails
 */
function saveLocalFeedback(context: FeedbackContext): void {
  const feedbackDir = path.join(process.cwd(), '.miyabi-feedback');
  const feedbackFile = path.join(
    feedbackDir,
    `feedback-${Date.now()}.json`
  );

  try {
    // Create directory if not exists
    if (!fs.existsSync(feedbackDir)) {
      fs.mkdirSync(feedbackDir, { recursive: true });
    }

    // Write feedback
    fs.writeFileSync(
      feedbackFile,
      JSON.stringify(context, null, 2),
      { encoding: 'utf-8', mode: 0o600 }
    );

    console.log(chalk.gray(`\n💾 Feedback saved locally: ${feedbackFile}`));
    console.log(chalk.gray('   You can manually report this to:'));
    console.log(chalk.cyan(`   https://github.com/${MIYABI_OWNER}/${MIYABI_REPO}/issues/new\n`));
  } catch (_error) {
    // Even local save failed, silently ignore
  }
}

/**
 * Gather environment information
 */
export function gatherEnvironmentInfo(): FeedbackContext['environment'] {
  const packageJson = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, '../../package.json'),
      'utf-8'
    )
  );

  return {
    nodeVersion: process.version,
    platform: `${process.platform} ${process.arch}`,
    miyabiVersion: packageJson.version,
  };
}

/**
 * Gather project context
 */
export function gatherProjectContext(): FeedbackContext['projectContext'] {
  const cwd = process.cwd();

  return {
    hasGit: fs.existsSync(path.join(cwd, '.git')),
    hasPackageJson: fs.existsSync(path.join(cwd, 'package.json')),
    language: detectLanguage(cwd),
  };
}

/**
 * Detect project language
 */
function detectLanguage(projectPath: string): string | undefined {
  if (fs.existsSync(path.join(projectPath, 'package.json'))) {
    return 'JavaScript/TypeScript';
  }
  if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) {
    return 'Python';
  }
  if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
    return 'Rust';
  }
  if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
    return 'Go';
  }

  return undefined;
}

/**
 * Infer user intent from command
 */
export function inferUserIntent(command: string): string {
  if (command.includes('miyabi init')) {
    return 'ユーザーは新しいプロジェクトを作成しようとしていました';
  }
  if (command.includes('miyabi install')) {
    return 'ユーザーは既存プロジェクトにMiyabiをインストールしようとしていました';
  }
  if (command.includes('miyabi status')) {
    return 'ユーザーはプロジェクトの状態を確認しようとしていました';
  }
  if (command.includes('miyabi config')) {
    return 'ユーザーは設定を変更しようとしていました';
  }

  return 'ユーザーはMiyabiコマンドを実行しようとしていました';
}

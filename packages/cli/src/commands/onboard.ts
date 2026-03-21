/**
 * Onboarding wizard for first-time users
 * Provides comprehensive guided setup experience
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import open from 'open';
import { doctor } from './doctor';
import { init } from './init';
import { isNonInteractive } from '../utils/interactive';

export interface OnboardOptions {
  skipDemo?: boolean;
  skipTour?: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}

/**
 * Run onboarding wizard
 */
export async function onboard(options: OnboardOptions = {}): Promise<void> {
  const nonInteractiveMode = options.nonInteractive || options.yes || isNonInteractive();

  if (nonInteractiveMode) {
    console.log(chalk.yellow('\n⚠️  Onboarding wizard requires interactive mode\n'));
    console.log(chalk.gray('Please run this command in an interactive terminal'));
    console.log(chalk.gray('Or use: npx miyabi doctor --json\n'));
    process.exit(1);
  }

  // Step 1: Welcome
  displayWelcome();

  const { ready } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'ready',
      message: 'Ready to get started?',
      default: true,
    },
  ]);

  if (!ready) {
    console.log(chalk.gray('\n👋 No problem! Run this anytime: npx miyabi onboard\n'));
    process.exit(0);
  }

  // Step 2: System health check
  console.log(chalk.cyan.bold('\n📋 Step 1/5: System Health Check\n'));
  console.log(chalk.gray('Checking your system setup...\n'));

  const healthStatus = await runHealthCheck();

  if (!healthStatus.isHealthy) {
    const { fixIssues } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'fixIssues',
        message: 'Would you like help fixing these issues?',
        default: true,
      },
    ]);

    if (fixIssues) {
      await guideFixing(healthStatus);
    } else {
      console.log(chalk.yellow('\n⚠️  Some issues remain. You can continue, but features may be limited.\n'));
    }
  } else {
    console.log(chalk.green('\n✓ All systems go! Your environment is ready.\n'));
  }

  // Step 3: What is Miyabi? (30-second intro)
  if (!options.skipTour) {
    const { wantIntro } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'wantIntro',
        message: '📚 Would you like a quick intro to Miyabi? (30 seconds)',
        default: true,
      },
    ]);

    if (wantIntro) {
      displayIntro();
    }
  }

  // Step 4: Create demo project
  if (!options.skipDemo) {
    console.log(chalk.cyan.bold('\n📋 Step 2/5: Demo Project\n'));

    const { createDemo } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createDemo',
        message: '🎨 Create a demo project to see Miyabi in action?',
        default: true,
      },
    ]);

    if (createDemo) {
      await createDemoProject();
    }
  }

  // Step 5: Feature tour
  console.log(chalk.cyan.bold('\n📋 Step 3/5: Features Overview\n'));
  displayFeatures();

  const { exploreFeatures } = await inquirer.prompt([
    {
      type: 'list',
      name: 'exploreFeatures',
      message: 'Which feature interests you most?',
      choices: [
        { name: '🤖 Autonomous Agents - AI does the work', value: 'agents' },
        { name: '🎨 Dashboard - Visual project overview', value: 'dashboard' },
        { name: '🏷️  Label System - Workflow automation', value: 'labels' },
        { name: '📚 Documentation - Learn more', value: 'docs' },
        { name: '➡️  Skip - I\'ll explore later', value: 'skip' },
      ],
    },
  ]);

  if (exploreFeatures !== 'skip') {
    showFeatureDetails(exploreFeatures as string);
  }

  // Step 6: Next steps
  console.log(chalk.cyan.bold('\n📋 Step 4/5: Quick Commands\n'));
  displayQuickCommands();

  // Step 7: Resources
  console.log(chalk.cyan.bold('\n📋 Step 5/5: Resources\n'));
  displayResources();

  const { openDocs } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'openDocs',
      message: 'Open documentation in browser?',
      default: false,
    },
  ]);

  if (openDocs) {
    console.log(chalk.gray('\nOpening documentation...\n'));
    await open('https://github.com/ShunsukeHayashi/Miyabi');
  }

  // Final message
  console.log(chalk.green.bold('\n🎉 Onboarding Complete!\n'));
  console.log(chalk.white('You\'re all set to use Miyabi. Here\'s what to do next:\n'));
  console.log(chalk.cyan('  1. Create a project:') + chalk.gray(' npx miyabi init my-project'));
  console.log(chalk.cyan('  2. Check status:') + chalk.gray('     npx miyabi status'));
  console.log(chalk.cyan('  3. Run diagnostics:') + chalk.gray('  npx miyabi doctor'));
  console.log(chalk.cyan('  4. Get help:') + chalk.gray('         npx miyabi --help\n'));

  console.log(chalk.gray('💡 Tip: Run `npx miyabi doctor` anytime to check your setup\n'));
}

/**
 * Display welcome message
 */
function displayWelcome(): void {
  console.log(chalk.cyan.bold('\n🌸 Welcome to Miyabi!\n'));
  console.log(chalk.white('Miyabi (雅 - Japanese for "elegance") is an autonomous development framework'));
  console.log(chalk.white('that automates your entire workflow with AI agents.\n'));
  console.log(chalk.gray('This wizard will help you get started in ~5 minutes.\n'));
}

/**
 * Run health check and return status
 */
async function runHealthCheck(): Promise<{
  isHealthy: boolean;
  issues: string[];
  warnings: string[];
}> {
  const spinner = ora('Running health checks...').start();

  // Capture doctor output
  const originalLog = console.log;
  const logs: string[] = [];
  console.log = (...args: any[]) => {
    logs.push(args.join(' '));
  };

  try {
    await doctor({ json: false, verbose: false });
    spinner.succeed('Health check complete');
    console.log = originalLog;

    // Parse results (simplified - in real implementation, would use JSON mode)
    const hasErrors = logs.some((log) => log.includes('✗'));
    const hasWarnings = logs.some((log) => log.includes('⚠'));

    return {
      isHealthy: !hasErrors,
      issues: hasErrors ? ['GITHUB_TOKEN not configured'] : [],
      warnings: hasWarnings ? ['Some optional features unavailable'] : [],
    };
  } catch (_error) {
    spinner.fail('Health check failed');
    console.log = originalLog;
    return {
      isHealthy: false,
      issues: ['Health check failed'],
      warnings: [],
    };
  }
}

/**
 * Guide user through fixing issues
 */
async function guideFixing(healthStatus: {
  isHealthy: boolean;
  issues: string[];
  warnings: string[];
}): Promise<void> {
  console.log(chalk.yellow('\n🔧 Let\'s fix these issues:\n'));

  for (const issue of healthStatus.issues) {
    if (issue.includes('GITHUB_TOKEN')) {
      console.log(chalk.white('Issue: GitHub authentication not configured\n'));

      const { authMethod } = await inquirer.prompt([
        {
          type: 'list',
          name: 'authMethod',
          message: 'How would you like to authenticate?',
          choices: [
            { name: '1. GitHub CLI (easiest, recommended)', value: 'gh' },
            { name: '2. Personal Access Token (manual)', value: 'token' },
            { name: '3. Skip for now', value: 'skip' },
          ],
        },
      ]);

      if (authMethod === 'gh') {
        console.log(chalk.cyan('\n📝 GitHub CLI Setup:\n'));
        console.log(chalk.white('1. Install GitHub CLI: https://cli.github.com'));
        console.log(chalk.white('2. Run: gh auth login'));
        console.log(chalk.white('3. Follow the prompts to authenticate\n'));

        const { openGhDocs } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'openGhDocs',
            message: 'Open GitHub CLI installation guide?',
            default: true,
          },
        ]);

        if (openGhDocs) {
          await open('https://cli.github.com');
        }

        console.log(chalk.gray('\nOnce you\'ve set up GitHub CLI, run: npx miyabi onboard\n'));
      } else if (authMethod === 'token') {
        console.log(chalk.cyan('\n📝 Personal Access Token Setup:\n'));
        console.log(chalk.white('1. Go to: https://github.com/settings/tokens/new'));
        console.log(chalk.white('2. Give it a name: "Miyabi CLI"'));
        console.log(chalk.white('3. Select scopes: repo, workflow, project'));
        console.log(chalk.white('4. Click "Generate token"'));
        console.log(chalk.white('5. Copy the token (starts with ghp_)\n'));

        console.log(chalk.cyan('Then set it as an environment variable:\n'));
        console.log(chalk.gray('  export GITHUB_TOKEN=ghp_your_token_here\n'));

        const { openTokenPage } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'openTokenPage',
            message: 'Open token creation page?',
            default: true,
          },
        ]);

        if (openTokenPage) {
          await open('https://github.com/settings/tokens/new');
        }
      }
    }
  }
}

/**
 * Display 30-second intro
 */
function displayIntro(): void {
  console.log(chalk.cyan.bold('\n📚 What is Miyabi?\n'));

  console.log(chalk.white('Miyabi automates your entire development workflow using AI agents:\n'));

  console.log(chalk.green('  🤖 7 Autonomous Agents'));
  console.log(chalk.gray('     CodeGen, Review, Deploy, PR, Issue, Coordinator, Test\n'));

  console.log(chalk.green('  🏷️  53 Smart Labels'));
  console.log(chalk.gray('     State-machine based workflow automation\n'));

  console.log(chalk.green('  🎨 Real-time Dashboard'));
  console.log(chalk.gray('     Visual project overview and metrics\n'));

  console.log(chalk.green('  🔄 GitHub OS Integration'));
  console.log(chalk.gray('     Issues, Actions, Projects V2, Discussions\n'));

  console.log(chalk.white('Example workflow:'));
  console.log(chalk.gray('  1. Create Issue → 2. Agent analyzes → 3. Code generated →'));
  console.log(chalk.gray('  4. Tests run → 5. PR created → 6. Auto-deployed\n'));
}

/**
 * Create demo project
 */
async function createDemoProject(): Promise<void> {
  console.log(chalk.white('\nLet\'s create a demo project to see Miyabi in action!\n'));

  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: 'miyabi-demo',
      validate: (input: string) => {
        if (!input) {return 'Project name is required';}
        if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
          return 'Only letters, numbers, hyphens, and underscores allowed';
        }
        return true;
      },
    },
  ]);

  const { isPrivate } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'isPrivate',
      message: 'Make it private?',
      default: false,
    },
  ]);

  console.log(chalk.cyan('\n🚀 Creating demo project...\n'));

  try {
    await init(projectName as string, { private: isPrivate, skipInstall: false });
    console.log(chalk.green(`\n✓ Demo project created: ${projectName}\n`));
  } catch (error) {
    console.log(chalk.red('\n❌ Failed to create demo project\n'));
    if (error instanceof Error) {
      console.log(chalk.gray(`Error: ${error.message}\n`));
    }
  }
}

/**
 * Display features overview
 */
function displayFeatures(): void {
  console.log(chalk.white('Miyabi includes these powerful features:\n'));

  console.log(chalk.cyan('  🤖 Autonomous Agents') + chalk.gray(' - AI handles coding, review, deployment'));
  console.log(chalk.cyan('  🎨 Dashboard') + chalk.gray('         - Visual project metrics and insights'));
  console.log(chalk.cyan('  🏷️  Label System') + chalk.gray('      - Workflow automation with 53 labels'));
  console.log(chalk.cyan('  📊 Status Tracking') + chalk.gray('   - Real-time project status'));
  console.log(chalk.cyan('  🔄 Auto-Deploy') + chalk.gray('       - Firebase, Vercel, AWS integration'));
  console.log(chalk.cyan('  🩺 Health Checks') + chalk.gray('     - System diagnostics and fixes'));
  console.log(chalk.cyan('  📚 Documentation') + chalk.gray('    - Auto-generated docs\n'));
}

/**
 * Show feature details
 */
function showFeatureDetails(feature: string): void {
  console.log('');

  switch (feature) {
    case 'agents':
      console.log(chalk.cyan.bold('🤖 Autonomous Agents\n'));
      console.log(chalk.white('7 specialized AI agents automate your workflow:\n'));
      console.log(chalk.green('  • CoordinatorAgent') + chalk.gray(' - Orchestrates tasks'));
      console.log(chalk.green('  • CodeGenAgent') + chalk.gray('     - Generates code with Claude Sonnet 4'));
      console.log(chalk.green('  • ReviewAgent') + chalk.gray('      - Quality checks (80+ score required)'));
      console.log(chalk.green('  • IssueAgent') + chalk.gray('       - Smart issue analysis'));
      console.log(chalk.green('  • PRAgent') + chalk.gray('          - Auto PR creation'));
      console.log(chalk.green('  • DeployAgent') + chalk.gray('      - CI/CD automation'));
      console.log(chalk.green('  • TestAgent') + chalk.gray('        - Automated testing\n'));

      console.log(chalk.gray('Usage: npx miyabi agent run codegen --issue=123\n'));
      break;

    case 'dashboard':
      console.log(chalk.cyan.bold('🎨 Dashboard\n'));
      console.log(chalk.white('Visual project overview with:\n'));
      console.log(chalk.green('  • Real-time metrics') + chalk.gray(' - Issue/PR status, agent activity'));
      console.log(chalk.green('  • Workflow stages') + chalk.gray('  - Track progress through pipeline'));
      console.log(chalk.green('  • Agent status') + chalk.gray('     - See what agents are doing'));
      console.log(chalk.green('  • Quality scores') + chalk.gray('   - Code quality tracking\n'));

      console.log(chalk.gray('URL: https://shunsukehayashi.github.io/Miyabi/\n'));
      break;

    case 'labels':
      console.log(chalk.cyan.bold('🏷️  Label System\n'));
      console.log(chalk.white('53 structured labels across 10 categories:\n'));
      console.log(chalk.green('  • STATE') + chalk.gray('    - Lifecycle tracking (pending → done)'));
      console.log(chalk.green('  • TYPE') + chalk.gray('     - Issue classification'));
      console.log(chalk.green('  • PRIORITY') + chalk.gray(' - P0-Critical to P3-Low'));
      console.log(chalk.green('  • AGENT') + chalk.gray('    - Agent assignment'));
      console.log(chalk.green('  • QUALITY') + chalk.gray('  - Code quality scores\n'));

      console.log(chalk.gray('Docs: https://github.com/ShunsukeHayashi/Miyabi/blob/main/docs/LABEL_SYSTEM_GUIDE.md\n'));
      break;

    case 'docs':
      console.log(chalk.cyan.bold('📚 Documentation\n'));
      console.log(chalk.white('Comprehensive documentation available:\n'));
      console.log(chalk.green('  • Setup Guide') + chalk.gray('       - Step-by-step installation'));
      console.log(chalk.green('  • For Non-Programmers') + chalk.gray(' - Beginner-friendly guide'));
      console.log(chalk.green('  • Agent Operations') + chalk.gray('   - How agents work'));
      console.log(chalk.green('  • Label System') + chalk.gray('      - 53-label system guide'));
      console.log(chalk.green('  • API Reference') + chalk.gray('     - Full command reference\n'));

      console.log(chalk.gray('GitHub: https://github.com/ShunsukeHayashi/Miyabi\n'));
      break;
  }
}

/**
 * Display quick commands
 */
function displayQuickCommands(): void {
  console.log(chalk.white('Essential commands to remember:\n'));

  console.log(chalk.cyan('  miyabi init <name>') + chalk.gray('        Create new project'));
  console.log(chalk.cyan('  miyabi install') + chalk.gray('            Add to existing project'));
  console.log(chalk.cyan('  miyabi status') + chalk.gray('             Check project status'));
  console.log(chalk.cyan('  miyabi doctor') + chalk.gray('             System diagnostics'));
  console.log(chalk.cyan('  miyabi agent run <type>') + chalk.gray('   Run specific agent'));
  console.log(chalk.cyan('  miyabi dashboard open') + chalk.gray('     Open dashboard\n'));
}

/**
 * Display resources
 */
function displayResources(): void {
  console.log(chalk.white('Helpful resources:\n'));

  console.log(chalk.green('  📖 Documentation'));
  console.log(chalk.gray('     https://github.com/ShunsukeHayashi/Miyabi\n'));

  console.log(chalk.green('  🎨 Dashboard'));
  console.log(chalk.gray('     https://shunsukehayashi.github.io/Miyabi/\n'));

  console.log(chalk.green('  🐛 Issues & Support'));
  console.log(chalk.gray('     https://github.com/ShunsukeHayashi/Miyabi/issues\n'));

  console.log(chalk.green('  💬 Discussions'));
  console.log(chalk.gray('     https://github.com/ShunsukeHayashi/Miyabi/discussions\n'));
}

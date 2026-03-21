/**
 * Miyabi Auth Command
 *
 * OAuth-based authentication for secure GitHub access
 */

import chalk from 'chalk';
import type { Command } from 'commander';
import { githubOAuth } from '../auth/github-oauth';
import {
  saveCredentials,
  loadCredentials,
  deleteCredentials,
  verifyToken,
} from '../auth/credentials';
import { Octokit } from '@octokit/rest';

/**
 * Login command - OAuth Device Flow
 */
export async function authLogin(): Promise<void> {
  console.log(chalk.cyan.bold('\n🔐 GitHub OAuth Login\n'));

  // Check if already logged in
  const existing = loadCredentials();
  if (existing) {
    console.log(chalk.yellow('You are already logged in.'));
    console.log(chalk.gray('Run `miyabi auth status` to check your authentication.\n'));

    // Ask if user wants to re-authenticate
    // For now, just show message (can add interactive prompt later)
    console.log(chalk.white('To re-authenticate, first run: miyabi auth logout\n'));
    return;
  }

  // Start OAuth flow
  const token = await githubOAuth();

  // Save to credentials file
  saveCredentials(token);

  // Show authenticated user info
  try {
    const octokit = new Octokit({ auth: token });
    const { data: user } = await octokit.users.getAuthenticated();

    console.log(chalk.green.bold('\n✅ Successfully authenticated!\n'));
    console.log(chalk.white(`Logged in as: ${chalk.cyan(user.login)}`));
    console.log(chalk.gray(`User ID: ${user.id}`));
    console.log(chalk.gray(`Profile: ${user.html_url}\n`));

    // Show next steps
    console.log(chalk.cyan.bold('🚀 Next Steps:\n'));
    console.log(chalk.white('  1. Check available agents:'));
    console.log(chalk.gray('     miyabi agent list\n'));
    console.log(chalk.white('  2. Run an agent:'));
    console.log(chalk.gray('     miyabi agent run codegen --issue=123\n'));
    console.log(chalk.white('  3. Check project status:'));
    console.log(chalk.gray('     miyabi status\n'));
  } catch (_error) {
    console.log(chalk.yellow('\n⚠️  Could not fetch user info\n'));
  }
}

/**
 * Logout command - Delete credentials
 */
export function authLogout(): void {
  console.log(chalk.cyan.bold('\n🔓 GitHub Logout\n'));

  const existing = loadCredentials();
  if (!existing) {
    console.log(chalk.yellow('You are not logged in.\n'));
    return;
  }

  deleteCredentials();
  console.log(chalk.green('✅ Successfully logged out.\n'));
}

/**
 * Status command - Check authentication status
 */
export async function authStatus(json = false): Promise<void> {
  // JSON出力モード
  if (json) {
    const result: {
      success: boolean;
      data: {
        authenticated: boolean;
        source?: 'environment' | 'credentials';
        valid?: boolean;
        user?: string;
        userId?: number;
        scopes?: string[];
      };
      timestamp: string;
    } = {
      success: true,
      data: {
        authenticated: false,
      },
      timestamp: new Date().toISOString(),
    };

    // Check environment variable
    const envToken = process.env.GITHUB_TOKEN;
    if (envToken) {
      result.data.source = 'environment';
      result.data.valid = await verifyToken(envToken);
      if (result.data.valid) {
        result.data.authenticated = true;
        try {
          const octokit = new Octokit({ auth: envToken });
          const { data: user } = await octokit.users.getAuthenticated();
          result.data.user = user.login;
          result.data.userId = user.id;
        } catch {
          // User info optional
        }
      }
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    // Check credentials file
    const credentials = loadCredentials();
    if (credentials) {
      result.data.source = 'credentials';
      result.data.valid = await verifyToken(credentials.github_token);
      if (result.data.valid) {
        result.data.authenticated = true;
        try {
          const octokit = new Octokit({ auth: credentials.github_token });
          const { data: user } = await octokit.users.getAuthenticated();
          result.data.user = user.login;
          result.data.userId = user.id;
        } catch {
          // User info optional
        }
      }
    }

    console.log(JSON.stringify(result, null, 2));
    return;
  }

  // Human-readable output
  console.log(chalk.cyan.bold('\n📊 Authentication Status\n'));

  // Check environment variable
  const envToken = process.env.GITHUB_TOKEN;
  if (envToken) {
    console.log(chalk.yellow('⚠️  Using GITHUB_TOKEN from environment variable'));
    console.log(chalk.gray('   (OAuth credentials will be ignored)\n'));

    // Verify environment token
    const isValid = await verifyToken(envToken);
    if (isValid) {
      console.log(chalk.green('✓ Token is valid\n'));
    } else {
      console.log(chalk.red('✗ Token is invalid or expired\n'));
    }
    return;
  }

  // Check credentials file
  const credentials = loadCredentials();
  if (!credentials) {
    console.log(chalk.yellow('Not authenticated.'));
    console.log(chalk.gray('Run `miyabi auth login` to authenticate.\n'));
    return;
  }

  // Verify token
  console.log(chalk.gray('Verifying token...'));
  const isValid = await verifyToken(credentials.github_token);

  if (!isValid) {
    console.log(chalk.red('\n✗ Token is invalid or expired'));
    console.log(chalk.gray('Run `miyabi auth login` to re-authenticate.\n'));
    return;
  }

  // Show authenticated user info
  try {
    const octokit = new Octokit({ auth: credentials.github_token });
    const { data: user } = await octokit.users.getAuthenticated();

    console.log(chalk.green('✓ Authenticated\n'));
    console.log(chalk.white(`User: ${chalk.cyan(user.login)}`));
    console.log(chalk.gray(`ID: ${user.id}`));
    console.log(chalk.gray(`Created: ${credentials.created_at}`));
    console.log(chalk.gray(`Profile: ${user.html_url}\n`));
  } catch (_error) {
    console.log(chalk.yellow('\n⚠️  Could not fetch user info\n'));
  }
}

/**
 * Register auth command
 */
export function registerAuthCommand(program: Command): void {
  const auth = program
    .command('auth')
    .description('🔐 GitHub authentication management');

  auth
    .command('login')
    .description('Login with GitHub OAuth')
    .action(async () => {
      try {
        await authLogin();
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });

  auth
    .command('logout')
    .description('Logout and remove credentials')
    .action(() => {
      try {
        authLogout();
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });

  auth
    .command('status')
    .description('Check authentication status')
    .option('--json', 'JSON output for AI agents')
    .action(async (options: { json?: boolean }, command: Command) => {
      try {
        // Get global --json option from parent command (miyabi --json auth status)
        // OR local --json option (miyabi auth status --json)
        const json = options.json || (command.parent?.parent?.opts().json as boolean) || false;
        await authStatus(json);
      } catch (error) {
        if (error instanceof Error) {
          console.error(chalk.red(`\nError: ${error.message}\n`));
        }
        process.exit(1);
      }
    });
}

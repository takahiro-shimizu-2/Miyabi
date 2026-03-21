/**
 * health command - Quick health check endpoint
 * Returns CLI version, Node.js version, OS info, and timestamp.
 *
 * @see https://github.com/ShunsukeHayashi/Miyabi/issues/263
 */

import chalk from 'chalk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import * as os from 'os';
import type { Command } from 'commander';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface HealthInfo {
  cli_version: string;
  node_version: string;
  os: {
    platform: string;
    release: string;
    arch: string;
    type: string;
  };
  timestamp: string;
}

/**
 * Gather health information
 */
function getHealthInfo(): HealthInfo {
  let cliVersion = 'unknown';
  try {
    const packageJson = JSON.parse(
      readFileSync(join(__dirname, '../../package.json'), 'utf-8')
    );
    cliVersion = packageJson.version;
  } catch {
    // If package.json can't be read, fallback to unknown
  }

  return {
    cli_version: cliVersion,
    node_version: process.version,
    os: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
      type: os.type(),
    },
    timestamp: new Date().toISOString(),
  };
}

/**
 * Execute the health command
 */
export function health(options: { json?: boolean } = {}): void {
  const info = getHealthInfo();

  if (options.json) {
    console.log(JSON.stringify(info, null, 2));
    return;
  }

  console.log(chalk.cyan.bold('\n🌸 Miyabi Health\n'));
  console.log(chalk.white(`  CLI Version : ${chalk.green(info.cli_version)}`));
  console.log(chalk.white(`  Node.js     : ${chalk.green(info.node_version)}`));
  console.log(
    chalk.white(
      `  OS          : ${chalk.green(`${info.os.type} ${info.os.release} (${info.os.platform}/${info.os.arch})`)}`
    )
  );
  console.log(chalk.white(`  Timestamp   : ${chalk.gray(info.timestamp)}`));
  console.log('');
}

/**
 * Register the health command with the CLI program
 */
export function registerHealthCommand(program: Command): void {
  program
    .command('health')
    .description('Quick health check — show CLI version, Node.js, OS, and timestamp')
    .option('--json', 'Output in JSON format')
    .action((options: { json?: boolean }, command: Command) => {
      const json = options.json || (command.parent?.opts().json as boolean) || false;
      health({ json });
    });
}

/**
 * Documentation generation command
 * Generates API documentation from TypeScript/JavaScript code
 */

import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { execCommand } from '../utils/cross-platform.js';

export interface DocsOptions {
  input?: string;
  output?: string;
  watch?: boolean;
  training?: boolean;
}

/**
 * Generate documentation from code
 */
export async function docs(options: DocsOptions): Promise<void> {
  console.log(chalk.cyan.bold('\n📚 ドキュメント生成\n'));

  let inputDir = options.input;
  let outputFile = options.output;
  let watch = options.watch || false;
  let training = options.training || false;

  // Interactive prompts if options not provided
  if (!inputDir || !outputFile) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'inputDir',
        message: 'ソースディレクトリを指定してください:',
        default: './src',
        when: !inputDir,
        validate: (input: string) => {
          if (!fs.existsSync(input)) {
            return 'ディレクトリが存在しません';
          }
          if (!fs.statSync(input).isDirectory()) {
            return 'ディレクトリを指定してください';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'outputFile',
        message: '出力ファイル名を指定してください:',
        default: './docs/API.md',
        when: !outputFile
      },
      {
        type: 'confirm',
        name: 'watch',
        message: 'ウォッチモード（自動更新）を有効にしますか？',
        default: false,
        when: !options.watch
      },
      {
        type: 'confirm',
        name: 'training',
        message: 'トレーニング資料も生成しますか？',
        default: false,
        when: !options.training
      }
    ]);

    inputDir = inputDir || answers.inputDir;
    outputFile = outputFile || answers.outputFile;
    watch = watch || answers.watch;
    training = training || answers.training;
  }

  // Ensure output directory exists
  const outputDir = path.dirname(outputFile!);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const spinner = ora('ドキュメントを生成中...').start();

  try {
    // Check if doc-generator script exists
    const scriptPath = path.resolve(process.cwd(), 'scripts/doc-generator.ts');
    if (!fs.existsSync(scriptPath)) {
      spinner.fail('doc-generator.ts が見つかりません');
      console.log(chalk.yellow('\n💡 ヒント: scripts/doc-generator.ts を作成してください'));
      return;
    }

    // Run doc-generator using tsx
    const watchFlag = watch ? '--watch' : '';
    const command = `npx tsx ${scriptPath} "${inputDir}" "${outputFile}" ${watchFlag}`.trim();

    spinner.text = 'ドキュメントを生成中...';

    if (watch) {
      spinner.succeed('ウォッチモードで起動します...');
      console.log(chalk.gray(`\n👀 ${inputDir} を監視しています...\n`));

      // Run in foreground for watch mode
      execCommand(command, { stdio: 'inherit' });
    } else {
      execCommand(command, { stdio: 'pipe' });
      spinner.succeed('ドキュメント生成完了！');
      console.log(chalk.green(`\n✅ ドキュメントが生成されました: ${outputFile}\n`));
    }

    // Generate training materials if requested
    if (training) {
      const trainingSpinner = ora('トレーニング資料を生成中...').start();

      const trainingScriptPath = path.resolve(process.cwd(), 'scripts/training-material-generator.ts');
      if (!fs.existsSync(trainingScriptPath)) {
        trainingSpinner.warn('training-material-generator.ts が見つかりません');
      } else {
        const trainingOutputDir = path.join(outputDir, 'training');
        const trainingCommand = `npx tsx ${trainingScriptPath} "${inputDir}" "${trainingOutputDir}"`;

        execCommand(trainingCommand, { stdio: 'pipe' });
        trainingSpinner.succeed('トレーニング資料生成完了！');
        console.log(chalk.green(`✅ トレーニング資料: ${trainingOutputDir}\n`));
      }
    }

    // Show next steps
    if (!watch) {
      console.log(chalk.cyan('📖 次のステップ:\n'));
      console.log(chalk.white(`  1. ドキュメントを確認: ${outputFile}`));
      if (training) {
        console.log(chalk.white(`  2. トレーニング資料を確認: ${path.join(outputDir, 'training')}`));
      }
      console.log(chalk.white(`  ${training ? 3 : 2}. ウォッチモードで自動更新: miyabi docs --watch`));
      console.log(chalk.white(`  ${training ? 4 : 3}. ドキュメントをリポジトリにコミット\n`));
    }

  } catch (error) {
    spinner.fail('ドキュメント生成中にエラーが発生しました');

    if (error instanceof Error) {
      console.log(chalk.red(`\n❌ エラー: ${error.message}\n`));

      if (error.message.includes('tsx')) {
        console.log(chalk.yellow('💡 対処法:'));
        console.log(chalk.white('  tsx がインストールされていない可能性があります'));
        console.log(chalk.white('  npm install -g tsx\n'));
      } else if (error.message.includes('typescript')) {
        console.log(chalk.yellow('💡 対処法:'));
        console.log(chalk.white('  typescript がインストールされていない可能性があります'));
        console.log(chalk.white('  npm install typescript\n'));
      }
    }

    throw error;
  }
}

/**
 * Setup wizard for beginners
 * 初心者向けセットアップウィザード
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import open from 'open';
import { config } from './config';
import { confirmOrDefault, isNonInteractive } from '../utils/interactive';

export interface SetupOptions {
  skipToken?: boolean;
  skipConfig?: boolean;
  nonInteractive?: boolean;
  yes?: boolean;
}

export async function setup(options: SetupOptions = {}) {
  console.log(chalk.cyan.bold('\n🌸 Miyabi セットアップウィザード\n'));

  const nonInteractiveMode = options.nonInteractive || options.yes || isNonInteractive();

  if (nonInteractiveMode) {
    console.log(chalk.gray('Non-interactive mode: auto-approving all prompts\n'));
  } else {
    console.log(chalk.gray('初めての方でも安心！一緒に設定していきましょう。\n'));
  }

  // Step 1: Welcome
  const readyToStart = await confirmOrDefault(
    'セットアップを開始しますか？',
    true,
    {
      nonInteractive: options.nonInteractive,
      yes: options.yes,
    }
  );

  if (!readyToStart) {
    console.log(chalk.yellow('\n👋 またいつでも実行してください！\n'));
    return;
  }

  // Step 2: Check GitHub account
  console.log(chalk.cyan('\n📋 ステップ 1/3: GitHubアカウントの確認\n'));

  const hasGitHubAccount = await confirmOrDefault(
    'GitHubアカウントをお持ちですか？',
    true,
    {
      nonInteractive: options.nonInteractive,
      yes: options.yes,
    }
  );

  if (!hasGitHubAccount) {
    if (nonInteractiveMode) {
      console.log(chalk.yellow('\n⚠️  GitHub account is required. In non-interactive mode, assuming account exists.\n'));
    } else {
      console.log(chalk.yellow('\n📝 GitHubアカウントを作成しましょう！\n'));
      console.log(chalk.white('1. ブラウザで https://github.com を開きます'));
      console.log(chalk.white('2. 右上の「Sign up」をクリック'));
      console.log(chalk.white('3. メールアドレスとパスワードを入力'));
      console.log(chalk.white('4. 指示に従って登録完了\n'));

      const shouldOpenBrowser = await confirmOrDefault(
        'ブラウザで https://github.com を開きますか？',
        true,
        {
          nonInteractive: options.nonInteractive,
          yes: options.yes,
        }
      );

      if (shouldOpenBrowser) {
        console.log(chalk.gray('\nブラウザを開いています...\n'));
        await open('https://github.com/signup');
      }

      const accountCreated = await confirmOrDefault(
        'アカウントは作成できましたか？',
        false,
        {
          nonInteractive: options.nonInteractive,
          yes: options.yes,
        }
      );

      if (!accountCreated) {
        console.log(chalk.yellow('\n⏸️  アカウント作成後、もう一度このコマンドを実行してください。\n'));
        return;
      }
    }
  }

  console.log(chalk.green('✓ GitHubアカウントOK!\n'));

  // Step 3: Create GitHub Token
  if (!options.skipToken) {
    console.log(chalk.cyan('\n🔑 ステップ 2/3: GitHubトークンの作成\n'));

    if (nonInteractiveMode) {
      console.log(chalk.gray('Non-interactive mode: Skipping token setup. Use gh CLI or GITHUB_TOKEN env var.\n'));
    } else {
      console.log(chalk.white('GitHubトークンは、Miyabiがあなたの代わりにGitHubを操作するための「許可証」です。'));
      console.log(chalk.white('パスワードよりも安全で、いつでも無効化できます。\n'));
    }

    let hasToken = 'have';

    if (!nonInteractiveMode) {
      const response = await inquirer.prompt([
        {
          type: 'list',
          name: 'hasToken',
          message: 'GitHubトークンをお持ちですか？',
          choices: [
            { name: 'いいえ、これから作成します', value: 'create' },
            { name: 'はい、既に持っています', value: 'have' },
            { name: '作り方が分かりません（詳しく教えて）', value: 'help' },
          ],
        },
      ]);
      hasToken = response.hasToken;
    }

    if (hasToken === 'help') {
      console.log(chalk.cyan('\n📖 GitHubトークンの作り方（超詳しく）\n'));

      console.log(chalk.white('【方法1: 自動で開く（簡単！）】'));
      console.log(chalk.white('  このウィザードがトークン作成ページを自動で開きます\n'));

      console.log(chalk.white('【方法2: 手動で開く】'));
      console.log(chalk.white('  1. https://github.com を開く'));
      console.log(chalk.white('  2. 右上のアイコン → Settings（設定）'));
      console.log(chalk.white('  3. 左下の Developer settings'));
      console.log(chalk.white('  4. Personal access tokens → Tokens (classic)'));
      console.log(chalk.white('  5. Generate new token → Generate new token (classic)\n'));

      const { chooseMethod } = await inquirer.prompt([
        {
          type: 'list',
          name: 'chooseMethod',
          message: 'どちらの方法で作成しますか？',
          choices: [
            { name: '方法1: 自動で開く（おすすめ）', value: 'auto' },
            { name: '方法2: 手動で開く', value: 'manual' },
          ],
        },
      ]);

      if (chooseMethod === 'auto') {
        console.log(chalk.cyan('\n🌐 ブラウザでトークン作成ページを開きます...\n'));
        await open('https://github.com/settings/tokens/new');
      }
    } else if (hasToken === 'create') {
      console.log(chalk.cyan('\n🌐 ブラウザでトークン作成ページを開きます...\n'));
      await open('https://github.com/settings/tokens/new');
    }

    if (hasToken !== 'have') {
      console.log(chalk.yellow('\n📝 トークン作成の手順:\n'));

      console.log(chalk.white('1. Note（メモ）に入力:'));
      console.log(chalk.gray('   「Miyabi用トークン」などと入力\n'));

      console.log(chalk.white('2. Expiration（有効期限）を選択:'));
      console.log(chalk.gray('   「90 days」がおすすめ\n'));

      console.log(chalk.white('3. 以下の権限にチェック✅を入れる:'));
      console.log(chalk.gray('   ✅ repo（リポジトリ）'));
      console.log(chalk.gray('   ✅ workflow（ワークフロー）'));
      console.log(chalk.gray('   ✅ write:packages（パッケージ書き込み）'));
      console.log(chalk.gray('   ✅ delete:packages（パッケージ削除）'));
      console.log(chalk.gray('   ✅ admin:org（組織管理）'));
      console.log(chalk.gray('   ✅ project（プロジェクト）\n'));

      console.log(chalk.white('4. 一番下の「Generate token」（緑ボタン）をクリック\n'));

      console.log(chalk.white('5. 表示されたトークンをコピー:'));
      console.log(chalk.gray('   ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'));
      console.log(chalk.red('   ⚠️  1回しか表示されないので必ずコピー！\n'));

      const { tokenCreated } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'tokenCreated',
          message: 'トークンを作成してコピーしましたか？',
          default: false,
        },
      ]);

      if (!tokenCreated) {
        console.log(chalk.yellow('\n⏸️  トークン作成後、もう一度このコマンドを実行してください。'));
        console.log(chalk.gray('コマンド: npx miyabi setup\n'));
        return;
      }
    }

    console.log(chalk.green('✓ トークン準備OK!\n'));
  }

  // Step 4: Configure
  if (!options.skipConfig) {
    console.log(chalk.cyan('\n⚙️  ステップ 3/3: Miyabiの設定\n'));

    if (nonInteractiveMode) {
      console.log(chalk.gray('Non-interactive mode: Skipping configuration.\n'));
    } else {
      console.log(chalk.white('いくつか質問に答えてください。後で変更できます。\n'));

      // Run config command
      await config({});
    }

    console.log(chalk.green('\n✅ セットアップ完了！\n'));
  }

  // Step 5: Next steps
  console.log(chalk.cyan.bold('🎉 おめでとうございます！\n'));
  console.log(chalk.white('Miyabiのセットアップが完了しました。\n'));

  if (nonInteractiveMode) {
    console.log(chalk.gray('Non-interactive mode: Setup complete. Run `miyabi` to get started.\n'));
    return;
  }

  console.log(chalk.cyan('📚 次は何をする？\n'));

  const { nextAction } = await inquirer.prompt([
    {
      type: 'list',
      name: 'nextAction',
      message: '次のアクションを選んでください:',
      choices: [
        { name: '🆕 新しいプロジェクトを作成する', value: 'init' },
        { name: '📖 使い方を確認する', value: 'guide' },
        { name: '❌ 終了する', value: 'exit' },
      ],
    },
  ]);

  switch (nextAction) {
    case 'init':
      console.log(chalk.cyan('\n🚀 プロジェクト作成を開始します...\n'));
      console.log(chalk.white('次回は以下のコマンドで直接作成できます:'));
      console.log(chalk.gray('  npx miyabi init プロジェクト名\n'));
      // Will continue to main menu
      break;

    case 'guide': {
      console.log(chalk.cyan('\n📖 使い方ガイド\n'));
      console.log(chalk.white('【基本コマンド】'));
      console.log(chalk.gray('  npx miyabi              # メニューを表示'));
      console.log(chalk.gray('  npx miyabi init [名前]  # 新規プロジェクト作成'));
      console.log(chalk.gray('  npx miyabi install      # 既存プロジェクトに追加'));
      console.log(chalk.gray('  npx miyabi status       # ステータス確認'));
      console.log(chalk.gray('  npx miyabi config       # 設定変更\n'));

      console.log(chalk.white('【詳しいガイド】'));
      console.log(chalk.gray('  SETUP_GUIDE.md を参照してください'));
      console.log(chalk.gray('  https://github.com/ShunsukeHayashi/Autonomous-Operations/blob/main/packages/cli/SETUP_GUIDE.md\n'));

      const { openGuide } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'openGuide',
          message: 'ブラウザでガイドを開きますか？',
          default: true,
        },
      ]);

      if (openGuide) {
        await open(
          'https://github.com/ShunsukeHayashi/Autonomous-Operations/blob/main/packages/cli/SETUP_GUIDE.md'
        );
      }
      break;
    }

    case 'exit':
      console.log(chalk.cyan('\n👋 Miyabiへようこそ！\n'));
      console.log(chalk.white('いつでも以下のコマンドで開始できます:'));
      console.log(chalk.gray('  npx miyabi\n'));
      break;
  }

  console.log(chalk.green('💡 ヒント: 困ったときは SETUP_GUIDE.md を参照してください\n'));
}

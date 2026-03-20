/**
 * release command - GitHub Release management and X announcement
 */

import chalk from "chalk";
import { Command } from "commander";
import { execSync } from "child_process";
import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || e.message || "";
  }
}

/**
 * X API v2 でツイートを投稿する
 */
async function postToX(text: string): Promise<{ id: string; text: string }> {
  const tokenPath = join(homedir(), ".twitter_oauth_token.json");
  let token: string;
  try {
    const tokenData = JSON.parse(readFileSync(tokenPath, "utf-8"));
    token = tokenData.access_token;
    if (!token) throw new Error("access_token not found");
  } catch (e: any) {
    throw new Error(
      `X OAuth token not found at ${tokenPath}: ${e.message}\n` +
      "Run: npx miyabi auth x  (or manually create the token file)"
    );
  }

  const response = await fetch("https://api.x.com/2/tweets", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`X API error (${response.status}): ${body}`);
  }

  const result = await response.json() as { data: { id: string; text: string } };
  return result.data;
}

function buildTweetText(repoShort: string, release: { tagName: string; name?: string; url: string }): string {
  const lines = [
    `${repoShort} ${release.tagName} released!`,
    "",
    release.name && release.name !== release.tagName ? release.name : null,
    "",
    release.url,
    "",
    "#OpenSource #AI #Miyabi",
  ].filter((l): l is string => l !== null);

  return lines.join("\n").trim();
}

async function releaseList(options: { json?: boolean }): Promise<void> {
  const repos = [
    "ShunsukeHayashi/Miyabi",
    "ShunsukeHayashi/agent-skill-bus",
    "ShunsukeHayashi/miyabi-mcp-bundle",
    "ShunsukeHayashi/gitnexus-stable-ops",
    "ShunsukeHayashi/miyabi-yomiage",
    "ShunsukeHayashi/miyabi-claude-plugins",
  ];

  if (options.json) {
    const results: Record<string, any> = {};
    for (const repo of repos) {
      try {
        results[repo] = JSON.parse(run("gh release view --repo " + repo + " --json tagName,publishedAt"));
      } catch { results[repo] = null; }
    }
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log(chalk.cyan.bold("\n\uD83D\uDCE6 Miyabi Product Releases\n"));
  for (const repo of repos) {
    const name = repo.split("/").pop();
    try {
      const r = JSON.parse(run("gh release view --repo " + repo + " --json tagName,publishedAt"));
      console.log(chalk.white("  " + chalk.green("\u2713") + " " + name + ": " + r.tagName + " (" + (r.publishedAt?.substring(0, 10) || "?") + ")"));
    } catch {
      console.log(chalk.white("  " + chalk.red("\u2717") + " " + name + ": no release"));
    }
  }
  console.log("");
}

async function releaseView(repo: string, options: { json?: boolean }): Promise<void> {
  const result = run("gh release view --repo " + repo + " --json tagName,name,publishedAt,url");
  if (options.json) { console.log(result); return; }
  console.log(chalk.cyan.bold("\n\uD83D\uDCE6 Latest Release \u2014 " + repo + "\n"));
  try {
    const r = JSON.parse(result);
    console.log(chalk.white("  Tag:       " + chalk.green(r.tagName)));
    console.log(chalk.white("  Name:      " + r.name));
    console.log(chalk.white("  Published: " + r.publishedAt));
    console.log(chalk.white("  URL:       " + chalk.blue(r.url)));
  } catch { console.log(chalk.yellow("  " + result)); }
  console.log("");
}

async function releaseAnnounce(
  repo: string,
  options: { post?: boolean; json?: boolean }
): Promise<void> {
  const releaseJson = run("gh release view --repo " + repo + " --json tagName,name,url");
  let release: { tagName: string; name?: string; url: string };
  try {
    release = JSON.parse(releaseJson);
  } catch {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: "Could not read release info for " + repo }));
    } else {
      console.log(chalk.red("  \u2717 Could not read release info"));
    }
    return;
  }

  const repoShort = repo.split("/").pop() || repo;
  const tweetText = buildTweetText(repoShort, release);

  if (!options.post) {
    // Dry-run (default)
    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        dryRun: true,
        repo,
        release: { tag: release.tagName, url: release.url },
        tweet: tweetText,
      }, null, 2));
    } else {
      console.log(chalk.cyan.bold("\n\uD83D\uDCE2 Release Announce Preview \u2014 " + repo + "\n"));
      console.log(chalk.white("  Tweet text:"));
      for (const line of tweetText.split("\n")) {
        console.log(chalk.white("    " + line));
      }
      console.log("");
      console.log(chalk.yellow("  (dry-run) Use --post to actually post to X"));
      console.log("");
    }
    return;
  }

  // Post to X
  if (!options.json) {
    console.log(chalk.cyan.bold("\n\uD83D\uDCE2 Posting Release to X \u2014 " + repo + "\n"));
  }

  try {
    const result = await postToX(tweetText);
    const tweetUrl = `https://x.com/i/status/${result.id}`;

    if (options.json) {
      console.log(JSON.stringify({
        success: true,
        dryRun: false,
        repo,
        release: { tag: release.tagName, url: release.url },
        tweet: { id: result.id, text: result.text, url: tweetUrl },
      }, null, 2));
    } else {
      console.log(chalk.green("  \u2713 Posted to X!"));
      console.log(chalk.white("  Tweet ID: " + result.id));
      console.log(chalk.white("  URL:      " + chalk.blue(tweetUrl)));
      console.log("");
    }
  } catch (e: any) {
    if (options.json) {
      console.log(JSON.stringify({ success: false, error: e.message }));
    } else {
      console.log(chalk.red("  \u2717 Failed to post: " + e.message));
      console.log("");
    }
  }
}

export function registerReleaseCommand(program: Command): void {
  const release = program
    .command("release")
    .description("\uD83D\uDCE6 Release management \u2014 view, list, announce releases");

  release.command("list").description("List latest releases")
    .action(async (_options: unknown, command: Command) => {
      const json = command.parent?.parent?.opts().json || false;
      await releaseList({ json });
    });

  release.command("view <repo>").description("View latest release")
    .action(async (repo: string, _options: unknown, command: Command) => {
      const json = command.parent?.parent?.opts().json || false;
      await releaseView(repo, { json });
    });

  release.command("announce <repo>").description("Announce release on X (dry-run by default)")
    .option("--post", "Actually post to X (default is dry-run)")
    .action(async (repo: string, options: { post?: boolean }, command: Command) => {
      const json = command.parent?.parent?.opts().json || false;
      await releaseAnnounce(repo, { ...options, json });
    });

  release.action(async () => { await releaseList({}); });
}

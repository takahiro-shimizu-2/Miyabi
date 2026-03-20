/**
 * release command - GitHub Release management and X announcement
 */

import chalk from "chalk";
import { Command } from "commander";
import { execSync } from "child_process";

function run(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", timeout: 30000 }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || e.message || "";
  }
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

async function releaseAnnounce(repo: string): Promise<void> {
  console.log(chalk.cyan.bold("\n\uD83D\uDCE2 Announcing Release \u2014 " + repo + "\n"));
  const releaseJson = run("gh release view --repo " + repo + " --json tagName,name,url");
  try {
    const r = JSON.parse(releaseJson);
    const repoShort = repo.split("/").pop() || repo;
    const text = repoShort + " " + r.tagName + " released! " + r.url + " #OpenSource #AI";
    console.log(chalk.white("  Tweet: " + text));
    console.log(chalk.green("  \u2713 Ready to post (use release-announce script for actual posting)"));
  } catch { console.log(chalk.red("  \u2717 Could not read release info")); }
  console.log("");
}

export function registerReleaseCommand(program: Command): void {
  const release = program
    .command("release")
    .description("\uD83D\uDCE6 Release management \u2014 view, list, announce releases");

  release.command("list").description("List latest releases").option("--json", "JSON output")
    .action(async (options) => { await releaseList(options); });

  release.command("view <repo>").description("View latest release").option("--json", "JSON output")
    .action(async (repo, options) => { await releaseView(repo, options); });

  release.command("announce <repo>").description("Announce on X")
    .action(async (repo) => { await releaseAnnounce(repo); });

  release.action(async () => { await releaseList({}); });
}

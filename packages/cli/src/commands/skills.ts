/**
 * skills command - Manage Claude Code skills
 * list / health / sync
 */

import chalk from "chalk";
import { Command } from "commander";
import { execSync } from "child_process";
import { readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

const SKILLS_DIR = join(homedir(), ".claude", "skills");

const SYNC_TARGETS = ["macbook", "mainmini", "macmini2", "windows"];
const SYNC_SKILLS = ["miyabi-master", "openclaw-agents"];

function getSkillDirs(): string[] {
  if (!existsSync(SKILLS_DIR)) return [];
  return readdirSync(SKILLS_DIR).filter((name) => {
    const fullPath = join(SKILLS_DIR, name);
    return statSync(fullPath).isDirectory();
  });
}

function runBus(subcommand: string): string {
  try {
    return execSync(`npx agent-skill-bus ${subcommand}`, {
      encoding: "utf-8",
      timeout: 30000,
      cwd: process.cwd(),
    }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || "";
  }
}

async function skillsList(options: { json?: boolean }): Promise<void> {
  const skills = getSkillDirs();

  if (options.json) {
    console.log(JSON.stringify({ dir: SKILLS_DIR, count: skills.length, skills }, null, 2));
    return;
  }

  console.log(chalk.cyan.bold("\n📦 Miyabi Skills — LIST\n"));
  console.log(chalk.gray(`  Directory: ${SKILLS_DIR}`));
  console.log(chalk.white(`  Total: ${chalk.green(String(skills.length))} skills\n`));

  for (const skill of skills) {
    const fullPath = join(SKILLS_DIR, skill);
    const hasIndex = existsSync(join(fullPath, "_index.md"));
    const icon = hasIndex ? chalk.green("●") : chalk.gray("○");
    console.log(`  ${icon} ${skill}`);
  }
  console.log("");
}

async function skillsHealth(options: { json?: boolean }): Promise<void> {
  const flagged = runBus("flagged");

  if (options.json) {
    console.log(flagged || JSON.stringify({ count: 0, skills: [] }));
    return;
  }

  console.log(chalk.cyan.bold("\n🩺 Miyabi Skills — HEALTH\n"));

  try {
    const f = JSON.parse(flagged);
    const count = f.count || 0;
    if (count === 0) {
      console.log(chalk.green("  All skills healthy. No flagged items.\n"));
      return;
    }
    console.log(chalk.yellow(`  Flagged: ${count} skill(s)\n`));
    for (const skill of f.skills || []) {
      const icon = skill.consecutiveFails > 0 ? chalk.red("✗") : chalk.yellow("⚠");
      console.log(
        `  ${icon} ${chalk.white(skill.name)}  score=${chalk.yellow(String(skill.avgScore))}  fails=${chalk.red(String(skill.consecutiveFails || 0))}`
      );
    }
  } catch {
    if (flagged) {
      console.log(chalk.white(`  ${flagged}`));
    } else {
      console.log(chalk.green("  Agent Skill Bus not available or no flagged skills.\n"));
    }
  }
  console.log("");
}

async function skillsSync(options: { json?: boolean; dry?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold("\n🔄 Miyabi Skills — SYNC\n"));
  console.log(chalk.gray(`  Syncing: ${SYNC_SKILLS.join(", ")}`));
  console.log(chalk.gray(`  Targets: ${SYNC_TARGETS.join(", ")}\n`));

  const results: Record<string, Record<string, string>> = {};

  for (const target of SYNC_TARGETS) {
    results[target] = {};
    for (const skill of SYNC_SKILLS) {
      const src = join(SKILLS_DIR, skill);
      if (!existsSync(src)) {
        results[target][skill] = "skip (not found locally)";
        console.log(chalk.yellow(`  ⏭ ${skill} → ${target}: source not found, skipping`));
        continue;
      }

      if (options.dry) {
        results[target][skill] = "dry-run";
        console.log(chalk.gray(`  [dry] ${skill} → ${target}`));
        continue;
      }

      try {
        execSync(
          `rsync -az --delete "${src}/" "${target}:~/.claude/skills/${skill}/"`,
          { encoding: "utf-8", timeout: 60000 }
        );
        results[target][skill] = "ok";
        console.log(chalk.green(`  ✓ ${skill} → ${target}`));
      } catch (e: any) {
        results[target][skill] = `error: ${e.message?.split("\n")[0] || "unknown"}`;
        console.log(chalk.red(`  ✗ ${skill} → ${target}: ${e.message?.split("\n")[0]}`));
      }
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ results }, null, 2));
  }
  console.log("");
}

export function registerSkillsCommand(program: Command): void {
  const skills = program
    .command("skills")
    .description("📦 Manage Claude Code skills — list / health / sync");

  skills
    .command("list")
    .description("List all skills in ~/.claude/skills/")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      await skillsList(options);
    });

  skills
    .command("health")
    .description("Show flagged skills from Agent Skill Bus")
    .option("--json", "Output in JSON format")
    .action(async (options) => {
      await skillsHealth(options);
    });

  skills
    .command("sync")
    .description("Sync miyabi-master and openclaw-agents to all machines")
    .option("--json", "Output in JSON format")
    .option("--dry", "Dry run (show what would be synced)")
    .action(async (options) => {
      await skillsSync(options);
    });

  // Default: list
  skills.action(async () => {
    await skillsList({});
  });
}

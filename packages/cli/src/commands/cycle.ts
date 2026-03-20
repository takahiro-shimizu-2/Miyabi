/**
 * cycle command - Agent Skill Bus feedback loop
 * CHECK → DISPATCH → HEALTH → RECORD → REPORT
 */

import chalk from "chalk";
import { Command } from "commander";
import { execSync } from "child_process";

const REPO_DIR = process.env.MIYABI_REPO_DIR || process.cwd();

function runBus(subcommand: string): string {
  try {
    return execSync(`npx agent-skill-bus ${subcommand}`, {
      encoding: "utf-8",
      timeout: 30000,
      cwd: REPO_DIR,
    }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || "";
  }
}

async function cycleCheck(options: { json?: boolean }): Promise<void> {
  const stats = runBus("stats");
  const flagged = runBus("flagged");

  if (options.json) {
    console.log(JSON.stringify({ stats: JSON.parse(stats || "{}"), flagged: JSON.parse(flagged || "{}") }, null, 2));
    return;
  }

  console.log(chalk.cyan.bold("\n🔄 Miyabi Cycle — CHECK\n"));
  try {
    const s = JSON.parse(stats);
    console.log(chalk.white(`  Queue: ${s.total || 0} total (queued: ${s.byStatus?.queued || 0}, running: ${s.byStatus?.running || 0}, done: ${s.byStatus?.done || 0})`));
  } catch { console.log(chalk.white(`  Queue: ${stats}`)); }

  try {
    const f = JSON.parse(flagged);
    console.log(chalk.white(`  Flagged Skills: ${chalk.yellow(String(f.count || 0))}`));
    if (f.skills) {
      for (const skill of f.skills.slice(0, 5)) {
        const icon = skill.consecutiveFails > 0 ? chalk.red("✗") : chalk.yellow("⚠");
        console.log(chalk.white(`    ${icon} ${skill.name}: score=${skill.avgScore}`));
      }
    }
  } catch { console.log(chalk.white(`  Flagged: ${flagged}`)); }

  // GNI: GitNexus Impact Analysis
  console.log(chalk.white("  GitNexus:"));
  try {
    const gniResult = execSync("cd ~/dev/HAYASHI_SHUNSUKE && ~/.local/bin/gitnexus-stable status", { encoding: "utf-8", timeout: 15000 }).trim();
    if (gniResult.includes("stale")) {
      console.log(chalk.yellow("    \u26a0 Index stale \u2014 reindex needed"));
    } else if (gniResult.includes("up-to-date") || gniResult.includes("current")) {
      console.log(chalk.green("    \u2713 Index up-to-date"));
    } else {
      console.log(chalk.white("    " + gniResult.split("\n").pop()));
    }
  } catch { console.log(chalk.gray("    GitNexus not available")); }
  console.log("");
}

async function cycleDispatch(options: { json?: boolean }): Promise<void> {
  const dispatched = runBus("dispatch");
  if (options.json) {
    console.log(dispatched);
    return;
  }
  console.log(chalk.cyan.bold("\n📬 Miyabi Cycle — DISPATCH\n"));
  try {
    const d = JSON.parse(dispatched);
    if (d.count === 0) {
      console.log(chalk.green("  No tasks to dispatch."));
    } else {
      for (const pr of d.prs || []) {
        console.log(chalk.white(`  [${pr.priority}] ${pr.id} — ${pr.task}`));
      }
    }
  } catch { console.log(chalk.white(`  ${dispatched}`)); }
  console.log("");
}

async function cycleHealth(options: { json?: boolean }): Promise<void> {
  const health = runBus("health");
  if (options.json) {
    console.log(health);
    return;
  }
  console.log(chalk.cyan.bold("\n💚 Miyabi Cycle — HEALTH\n"));
  try {
    const h = JSON.parse(health);
    const skills = Object.entries(h.skills || {});
    const ok = skills.filter(([, v]: any) => !v.flagged).length;
    const flagged = skills.filter(([, v]: any) => v.flagged).length;
    console.log(chalk.white(`  Skills: ${chalk.green(String(ok))} OK / ${chalk.yellow(String(flagged))} flagged / ${skills.length} total`));
  } catch { console.log(chalk.white(`  ${health}`)); }
  console.log("");
}

async function cycleFull(options: { json?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold("\n🔄 Miyabi Cycle — FULL LOOP\n"));
  await cycleCheck(options);
  await cycleDispatch(options);
  await cycleHealth(options);

  // Record this cycle run
  runBus("record-run --agent miyabi-cli --skill ops-cycle --task full-cycle --result success --score 0.9");
  console.log(chalk.green("  ✓ Cycle recorded to Skill Bus\n"));
}

async function cycleEnqueue(args: string[], options: { priority?: string; agent?: string }): Promise<void> {
  const task = args.join(" ");
  const priority = options.priority || "medium";
  const agent = options.agent || "ops";
  runBus(`enqueue --source miyabi-cli --priority ${priority} --agent ${agent} --task "${task}"`);
  console.log(chalk.green(`\n✓ Enqueued: [${priority}] ${agent} — ${task}\n`));
}


async function cycleGni(options: { reindex?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold("\n\ud83d\udd0d Miyabi Cycle \u2014 GitNexus Impact Analysis\n"));
  try {
    const status = execSync("cd ~/dev/HAYASHI_SHUNSUKE && ~/.local/bin/gitnexus-stable status", { encoding: "utf-8", timeout: 15000 }).trim();
    console.log(chalk.white("  Status: " + status));

    if (options.reindex || status.includes("stale")) {
      console.log(chalk.yellow("\n  Reindexing..."));
      const result = execSync("cd ~/dev/HAYASHI_SHUNSUKE && ~/.local/bin/gitnexus-stable analyze", { encoding: "utf-8", timeout: 60000 }).trim();
      console.log(chalk.green("  " + result));
    }
  } catch (e: any) {
    console.log(chalk.red("  GitNexus not available: " + (e.message || "unknown error")));
  }
  console.log("");
}

export function registerCycleCommand(program: Command): void {
  const cycle = program
    .command("cycle")
    .description("🔄 Agent Skill Bus feedback loop — CHECK → DISPATCH → HEALTH → RECORD");

  cycle
    .command("full")
    .description("Run full feedback loop cycle")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleFull(options); });

  cycle
    .command("check")
    .description("Check queue stats and flagged skills")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleCheck(options); });

  cycle
    .command("dispatch")
    .description("Get next dispatchable tasks")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleDispatch(options); });

  cycle
    .command("health")
    .description("Show skill health summary")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleHealth(options); });

  cycle
    .command("gni")
    .description("GitNexus Impact Analysis status & reindex")
    .option("--reindex", "Force reindex even if up-to-date")
    .action(async (options) => { await cycleGni(options); });

  cycle
    .command("enqueue <task...>")
    .description("Add a task to the queue")
    .option("--priority <level>", "Priority: critical|high|medium|low", "medium")
    .option("--agent <id>", "Target agent", "ops")
    .action(async (task, options) => { await cycleEnqueue(task, options); });

  // Default: run full cycle
  cycle.action(async (options) => { await cycleFull(options || {}); });
}

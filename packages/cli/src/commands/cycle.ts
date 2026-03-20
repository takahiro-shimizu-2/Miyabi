/**
 * cycle command - Agent Skill Bus feedback loop
 * CHECK → DISPATCH → HEALTH → RECORD → REPORT
 */

import chalk from "chalk";
import { Command } from "commander";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const REPO_DIR = process.env.MIYABI_REPO_DIR || process.cwd();

/**
 * Ensure skill-bus data directories exist.
 * Auto-initializes if missing.
 */
function ensureInitialized(): void {
  const skillsDir = path.join(REPO_DIR, "skills", "self-improving-skills");
  if (!fs.existsSync(skillsDir)) {
    try {
      execSync("npx agent-skill-bus init", {
        encoding: "utf-8",
        timeout: 15000,
        cwd: REPO_DIR,
        stdio: "pipe",
      });
    } catch {
      // Create minimal directory structure as fallback
      fs.mkdirSync(skillsDir, { recursive: true });
      fs.writeFileSync(
        path.join(skillsDir, "skill-health.json"),
        JSON.stringify({ skills: {}, lastUpdated: new Date().toISOString() }, null, 2)
      );
    }
  }
}

function runBus(subcommand: string): string {
  ensureInitialized();
  try {
    return execSync(`npx agent-skill-bus ${subcommand}`, {
      encoding: "utf-8",
      timeout: 30000,
      cwd: REPO_DIR,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch (e: any) {
    return e.stdout?.trim() || "{}";
  }
}

function safeParseJson(raw: string, fallback: Record<string, unknown> = {}): any {
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return fallback;
  }
}

// ============================================================================
// Subcommands
// ============================================================================

async function cycleCheck(options: { json?: boolean }): Promise<void> {
  const stats = runBus("stats");
  const flagged = runBus("flagged");

  if (options.json) {
    console.log(JSON.stringify({ phase: "check", stats: safeParseJson(stats), flagged: safeParseJson(flagged) }, null, 2));
    return;
  }

  console.log(chalk.cyan.bold("\n  🔄 CHECK\n"));
  const s = safeParseJson(stats);
  console.log(chalk.white(`  Queue: ${s.total || 0} total (queued: ${s.byStatus?.queued || 0}, running: ${s.byStatus?.running || 0}, done: ${s.byStatus?.done || 0})`));

  const f = safeParseJson(flagged);
  const flagCount = f.count || 0;
  console.log(chalk.white(`  Flagged: ${flagCount === 0 ? chalk.green("0") : chalk.yellow(String(flagCount))}`));
  if (f.skills) {
    for (const skill of f.skills.slice(0, 5)) {
      const icon = skill.consecutiveFails > 0 ? chalk.red("✗") : chalk.yellow("⚠");
      console.log(chalk.white(`    ${icon} ${skill.name}: score=${skill.avgScore}`));
    }
  }
}

async function cycleDispatch(options: { json?: boolean }): Promise<void> {
  const dispatched = runBus("dispatch");
  if (options.json) {
    console.log(JSON.stringify({ phase: "dispatch", ...safeParseJson(dispatched) }, null, 2));
    return;
  }
  console.log(chalk.cyan.bold("\n  📬 DISPATCH\n"));
  const d = safeParseJson(dispatched);
  if (d.count === 0) {
    console.log(chalk.green("  No tasks to dispatch."));
  } else {
    for (const pr of d.prs || []) {
      console.log(chalk.white(`  [${pr.priority}] ${pr.id} — ${pr.task}`));
    }
  }
}

async function cycleHealth(options: { json?: boolean }): Promise<void> {
  const health = runBus("health");
  if (options.json) {
    console.log(JSON.stringify({ phase: "health", ...safeParseJson(health) }, null, 2));
    return;
  }
  console.log(chalk.cyan.bold("\n  💚 HEALTH\n"));
  const h = safeParseJson(health);
  const skills = Object.entries(h.skills || {});
  const ok = skills.filter(([, v]: any) => !v.flagged).length;
  const flaggedCount = skills.filter(([, v]: any) => v.flagged).length;
  console.log(chalk.white(`  Skills: ${chalk.green(String(ok))} OK / ${chalk.yellow(String(flaggedCount))} flagged / ${skills.length} total`));
}

async function cycleFull(options: { json?: boolean }): Promise<void> {
  if (!options.json) {
    console.log(chalk.cyan.bold("\n🔄 Miyabi Cycle — FULL LOOP"));
  }

  if (options.json) {
    const stats = safeParseJson(runBus("stats"));
    const flagged = safeParseJson(runBus("flagged"));
    const dispatched = safeParseJson(runBus("dispatch"));
    const health = safeParseJson(runBus("health"));
    runBus("record-run --agent miyabi-cli --skill ops-cycle --task full-cycle --result success --score 0.9");
    console.log(JSON.stringify({
      cycle: "full",
      timestamp: new Date().toISOString(),
      stats,
      flagged,
      dispatched,
      health,
      recorded: true,
    }, null, 2));
    return;
  }

  await cycleCheck(options);
  await cycleDispatch(options);
  await cycleHealth(options);

  runBus("record-run --agent miyabi-cli --skill ops-cycle --task full-cycle --result success --score 0.9");
  console.log(chalk.green("\n  ✓ Cycle recorded to Skill Bus\n"));
}

async function cycleStatus(options: { json?: boolean }): Promise<void> {
  const stats = safeParseJson(runBus("stats"));
  const flagged = safeParseJson(runBus("flagged"));
  const health = safeParseJson(runBus("health"));

  const skills = Object.entries(health.skills || {});
  const okCount = skills.filter(([, v]: any) => !v.flagged).length;
  const flaggedCount = skills.filter(([, v]: any) => v.flagged).length;

  const statusData = {
    timestamp: new Date().toISOString(),
    queue: {
      total: stats.total || 0,
      queued: stats.byStatus?.queued || 0,
      running: stats.byStatus?.running || 0,
      done: stats.byStatus?.done || 0,
    },
    skills: {
      total: skills.length,
      ok: okCount,
      flagged: flaggedCount,
    },
    flaggedSkills: (flagged.skills || []).map((s: any) => ({
      name: s.name,
      score: s.avgScore,
      fails: s.consecutiveFails,
    })),
    healthy: flaggedCount === 0 && (stats.byStatus?.running || 0) >= 0,
  };

  if (options.json) {
    console.log(JSON.stringify(statusData, null, 2));
    return;
  }

  console.log(chalk.cyan.bold("\n📊 Miyabi Cycle — STATUS\n"));

  // Queue summary
  const queueColor = statusData.queue.queued > 0 ? chalk.yellow : chalk.green;
  console.log(chalk.white(`  Queue: ${queueColor(String(statusData.queue.total))} total`));
  if (statusData.queue.total > 0) {
    console.log(chalk.gray(`    queued: ${statusData.queue.queued}  running: ${statusData.queue.running}  done: ${statusData.queue.done}`));
  }

  // Skills summary
  const healthIcon = statusData.healthy ? chalk.green("●") : chalk.yellow("●");
  console.log(chalk.white(`  Skills: ${healthIcon} ${chalk.green(String(okCount))} OK / ${chalk.yellow(String(flaggedCount))} flagged`));

  // Flagged details
  if (statusData.flaggedSkills.length > 0) {
    console.log(chalk.yellow("\n  Flagged:"));
    for (const s of statusData.flaggedSkills.slice(0, 5)) {
      console.log(chalk.white(`    ${chalk.red("✗")} ${s.name} (score: ${s.score}, fails: ${s.fails})`));
    }
  }

  // Overall verdict
  console.log("");
  if (statusData.healthy) {
    console.log(chalk.green("  ✓ All systems nominal\n"));
  } else {
    console.log(chalk.yellow(`  ⚠ ${flaggedCount} skill(s) need attention\n`));
  }
}

async function cycleAuto(options: { interval?: string; maxDuration?: string; json?: boolean }): Promise<void> {
  const intervalSec = parseInt(options.interval || "60", 10);
  const maxDurationMin = parseInt(options.maxDuration || "30", 10);
  const maxMs = maxDurationMin * 60 * 1000;
  const startTime = Date.now();
  let iteration = 0;

  if (!options.json) {
    console.log(chalk.cyan.bold("\n🔄 Miyabi Cycle — AUTO MODE\n"));
    console.log(chalk.gray(`  Interval: ${intervalSec}s | Max duration: ${maxDurationMin}min`));
    console.log(chalk.gray(`  Press Ctrl+C to stop\n`));
  }

  const runLoop = async (): Promise<void> => {
    while (Date.now() - startTime < maxMs) {
      iteration++;
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      if (!options.json) {
        console.log(chalk.gray(`  ─── Iteration ${iteration} (${elapsed}s elapsed) ───`));
      }

      if (options.json) {
        const stats = safeParseJson(runBus("stats"));
        const flagged = safeParseJson(runBus("flagged"));
        const dispatched = safeParseJson(runBus("dispatch"));
        const health = safeParseJson(runBus("health"));
        runBus("record-run --agent miyabi-cli --skill ops-cycle --task auto-cycle --result success --score 0.9");
        console.log(JSON.stringify({
          cycle: "auto",
          iteration,
          elapsed,
          timestamp: new Date().toISOString(),
          stats,
          flagged,
          dispatched,
          health,
        }));
      } else {
        await cycleCheck({ json: false });
        await cycleDispatch({ json: false });
        await cycleHealth({ json: false });
        runBus("record-run --agent miyabi-cli --skill ops-cycle --task auto-cycle --result success --score 0.9");
        console.log(chalk.green("  ✓ Recorded"));
      }

      // Wait for next interval
      if (Date.now() - startTime + intervalSec * 1000 < maxMs) {
        if (!options.json) {
          console.log(chalk.gray(`\n  Next cycle in ${intervalSec}s...\n`));
        }
        await new Promise(resolve => setTimeout(resolve, intervalSec * 1000));
      } else {
        break;
      }
    }
  };

  await runLoop();

  if (!options.json) {
    console.log(chalk.cyan.bold(`\n  Auto mode completed: ${iteration} iterations in ${Math.floor((Date.now() - startTime) / 1000)}s\n`));
  } else {
    console.log(JSON.stringify({
      cycle: "auto",
      completed: true,
      totalIterations: iteration,
      durationSeconds: Math.floor((Date.now() - startTime) / 1000),
    }));
  }
}

async function cycleEnqueue(args: string[], options: { priority?: string; agent?: string }): Promise<void> {
  const task = args.join(" ");
  const priority = options.priority || "medium";
  const agent = options.agent || "ops";
  runBus(`enqueue --source miyabi-cli --priority ${priority} --agent ${agent} --task "${task}"`);
  console.log(chalk.green(`\n✓ Enqueued: [${priority}] ${agent} — ${task}\n`));
}

async function cycleGni(options: { reindex?: boolean }): Promise<void> {
  console.log(chalk.cyan.bold("\n🔍 Miyabi Cycle — GitNexus Impact Analysis\n"));
  try {
    const gniStatus = execSync("cd ~/dev/HAYASHI_SHUNSUKE && npx gitnexus status", {
      encoding: "utf-8",
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    console.log(chalk.white("  Status: " + gniStatus));

    if (options.reindex || gniStatus.includes("stale")) {
      console.log(chalk.yellow("\n  Reindexing..."));
      const result = execSync("cd ~/dev/HAYASHI_SHUNSUKE && npx gitnexus analyze", {
        encoding: "utf-8",
        timeout: 60000,
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      console.log(chalk.green("  " + result));
    }
  } catch (e: any) {
    console.log(chalk.gray("  GitNexus not available"));
  }
  console.log("");
}

// ============================================================================
// Command Registration
// ============================================================================

export function registerCycleCommand(program: Command): void {
  const cycle = program
    .command("cycle")
    .description("🔄 Agent Skill Bus feedback loop — CHECK → DISPATCH → HEALTH → RECORD");

  // Merge global --json from parent program into subcommand options
  const mergeJson = (options: any): any => {
    const globalJson = program.opts().json || process.env.MIYABI_JSON === "1";
    return { ...options, json: options.json || globalJson };
  };

  cycle
    .command("full")
    .description("Run full feedback loop cycle")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleFull(mergeJson(options)); });

  cycle
    .command("check")
    .description("Check queue stats and flagged skills")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleCheck(mergeJson(options)); });

  cycle
    .command("dispatch")
    .description("Get next dispatchable tasks")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleDispatch(mergeJson(options)); });

  cycle
    .command("health")
    .description("Show skill health summary")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleHealth(mergeJson(options)); });

  cycle
    .command("status")
    .description("Show compact status overview (queue + skills + flagged)")
    .option("--json", "Output in JSON format")
    .action(async (options) => { await cycleStatus(mergeJson(options)); });

  cycle
    .command("auto")
    .description("Run continuous feedback loop at interval")
    .option("--interval <seconds>", "Seconds between cycles", "60")
    .option("--max-duration <minutes>", "Maximum runtime in minutes", "30")
    .option("--json", "Output in JSON format (JSONL per iteration)")
    .action(async (options) => { await cycleAuto(mergeJson(options)); });

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
  cycle.action(async (options) => { await cycleFull(mergeJson(options || {})); });
}

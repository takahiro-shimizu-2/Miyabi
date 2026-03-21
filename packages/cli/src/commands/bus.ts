/**
 * bus — Agent Skill Bus native API (11 subcommands)
 * Integrated from miyabi-hub — uses agent-skill-bus SDK directly
 */
import type { Command } from "commander";
import chalk from "chalk";
import { resolve } from "node:path";
import { existsSync, mkdirSync } from "node:fs";

/** ASB data directory (queue) */
function getQueueDir(): string {
  const base = process.env.MIYABI_REPO_DIR || process.cwd();
  return resolve(base, ".skill-bus", "queue");
}

/** ASB data directory (monitor) */
function getMonitorDir(): string {
  const base = process.env.MIYABI_REPO_DIR || process.cwd();
  return resolve(base, ".skill-bus", "monitor");
}

/** Dynamic import of agent-skill-bus */
async function loadBus() {
  try {
    return await import("agent-skill-bus");
  } catch {
    console.error(chalk.red("✗ agent-skill-bus package not found. Run: npm install agent-skill-bus"));
    process.exit(1);
  }
}

export function registerBusCommand(program: Command): void {
  const bus = program
    .command("bus")
    .description("📡 Agent Skill Bus — task queue, locks, health monitoring (native API)");

  bus.command("init")
    .description("Initialize ASB data directory")
    .action(() => {
      const base = process.env.MIYABI_REPO_DIR || process.cwd();
      const baseDir = resolve(base, ".skill-bus");
      for (const sub of ["queue", "monitor", "watcher"]) {
        const dir = resolve(baseDir, sub);
        if (!existsSync(dir)) {mkdirSync(dir, { recursive: true });}
      }
      console.log(chalk.green(`✓ ASB data directory initialized: ${baseDir}`));
    });

  bus.command("enqueue")
    .description("Add a task to the queue")
    .argument("<task>", "Task description")
    .option("-a, --agent <agent>", "Target agent", "general")
    .option("-s, --source <source>", "Request source", "miyabi-cli")
    .option("-p, --priority <priority>", "Priority (critical/high/medium/low)", "medium")
    .option("--deps <ids>", "Comma-separated dependency PR IDs")
    .option("--files <paths>", "Comma-separated affected file paths")
    .option("--skills <names>", "Comma-separated affected skill names")
    .option("--json", "Output as JSON")
    .action(async (task, opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      const pr = queue.enqueue({
        source: opts.source,
        agent: opts.agent,
        task,
        priority: opts.priority as "critical" | "high" | "medium" | "low",
        dependsOn: opts.deps ? opts.deps.split(",") : [],
        affectedFiles: opts.files ? opts.files.split(",") : [],
        affectedSkills: opts.skills ? opts.skills.split(",") : [],
      });
      if (pr) {
        if (opts.json) {
          console.log(JSON.stringify(pr, null, 2));
        } else {
          console.log(chalk.green(`✓ Enqueued: ${pr.id}`));
          console.log(`  Agent: ${pr.agent} | Priority: ${pr.priority} | Task: ${pr.task}`);
        }
      } else {
        console.log("Duplicate task detected — not enqueued.");
      }
    });

  bus.command("dispatch")
    .description("Get next dispatchable tasks")
    .option("-n, --count <n>", "Max tasks to return", "5")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      const tasks = queue.getDispatchable(parseInt(opts.count as string, 10));

      if (opts.json) {
        console.log(JSON.stringify(tasks, null, 2));
        return;
      }

      if (tasks.length === 0) {
        console.log("No dispatchable tasks.");
        return;
      }
      console.log(chalk.bold(`\n=== Dispatchable (${tasks.length}) ===\n`));
      for (const t of tasks) {
        console.log(`  [${t.id}] ${t.task} (agent: ${t.agent}, priority: ${t.priority})`);
      }
    });

  bus.command("stats")
    .description("Queue statistics")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      const stats = queue.stats();
      if (opts.json) {
        console.log(JSON.stringify(stats, null, 2));
      } else {
        console.log(chalk.bold("\n=== Queue Stats ===\n"));
        console.log(`  Total:        ${stats.total}`);
        console.log(`  Active Locks: ${stats.activeLocks}`);
        for (const [status, count] of Object.entries(stats.byStatus)) {
          console.log(`  ${status}: ${count}`);
        }
      }
    });

  bus.command("start")
    .description("Start execution of a task (acquire locks)")
    .argument("<id>", "PR ID")
    .option("--json", "Output as JSON")
    .action(async (id, opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      const pr = queue.startExecution(id as string);
      if (opts.json) {
        console.log(JSON.stringify(pr, null, 2));
      } else {
        console.log(chalk.green(`✓ Started: ${pr.id} → status: ${pr.status}`));
      }
    });

  bus.command("complete")
    .description("Mark a task as completed")
    .argument("<id>", "PR ID")
    .option("-r, --result <result>", "Completion message", "done")
    .action(async (id, opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      queue.complete(id as string, opts.result as string);
      console.log(chalk.green(`✓ Completed: ${id as string}`));
    });

  bus.command("fail")
    .description("Mark a task as failed")
    .argument("<id>", "PR ID")
    .option("-r, --reason <reason>", "Failure reason", "unknown error")
    .action(async (id, opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      queue.fail(id as string, opts.reason as string);
      console.log(chalk.red(`✗ Failed: ${id as string} — ${opts.reason as string}`));
    });

  bus.command("locks")
    .description("Show active file locks")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const asb = await loadBus();
      const queue = new asb.PromptRequestQueue(getQueueDir());
      const locks = queue.readLocks();

      if (opts.json) {
        console.log(JSON.stringify(locks, null, 2));
        return;
      }

      if (locks.length === 0) {
        console.log("No active locks.");
        return;
      }
      for (const lock of locks) {
        console.log(`  [${lock.prId}] agent: ${lock.agent} | files: ${lock.files.join(", ")} | since: ${lock.lockedAt}`);
      }
    });

  bus.command("health")
    .description("Skill health monitoring")
    .option("--flagged", "Show only flagged skills")
    .option("--update", "Recompute and persist health metrics")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const asb = await loadBus();
      const monitor = new asb.SkillMonitor(getMonitorDir());

      if (opts.update) {
        const state = monitor.updateHealth();
        console.log(chalk.green(`✓ Health updated: ${state.lastUpdated}`));
        if (opts.json) {console.log(JSON.stringify(state, null, 2));}
        return;
      }

      if (opts.flagged) {
        const flagged = monitor.getFlagged();
        if (opts.json) {
          console.log(JSON.stringify(flagged, null, 2));
          return;
        }
        if (flagged.length === 0) {
          console.log(chalk.green("✓ No flagged skills."));
        } else {
          console.log(chalk.bold(`\n=== Flagged Skills (${flagged.length}) ===\n`));
          for (const f of flagged) {
            console.log(`  ⚠ ${f.name}: avgScore=${f.avgScore.toFixed(2)} trend=${f.trend} fails=${f.consecutiveFails}`);
          }
        }
        return;
      }

      const state = monitor.readHealth();
      if (opts.json) {
        console.log(JSON.stringify(state, null, 2));
        return;
      }
      const skills = Object.entries(state.skills);
      if (skills.length === 0) {
        console.log("No health data. Run: miyabi bus health --update");
        return;
      }
      console.log(chalk.bold(`\n=== Skill Health (${state.lastUpdated}) ===\n`));
      for (const [name, h] of skills) {
        const flag = (h as any).flagged ? " ⚠" : "";
        console.log(`  ${name}: avg=${(h as any).avgScore.toFixed(2)} trend=${(h as any).trend} runs=${(h as any).runs}${flag}`);
      }
    });

  bus.command("drift")
    .description("Detect skill score drift (week-over-week)")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      const asb = await loadBus();
      const monitor = new asb.SkillMonitor(getMonitorDir());
      const drifts = monitor.detectDrift();

      if (opts.json) {
        console.log(JSON.stringify(drifts, null, 2));
        return;
      }

      if (drifts.length === 0) {
        console.log(chalk.green("✓ No score drift detected."));
        return;
      }
      console.log(chalk.bold(`\n=== Score Drift (${drifts.length} skills) ===\n`));
      for (const d of drifts) {
        console.log(`  ⚠ ${d.name}: ${d.lastWeekAvg.toFixed(2)} → ${d.thisWeekAvg.toFixed(2)} (drop: ${d.drop.toFixed(2)})`);
      }
    });

  bus.command("record-run")
    .description("Record a skill execution result")
    .argument("<skill>", "Skill name")
    .option("-a, --agent <agent>", "Agent name", "miyabi-cli")
    .option("-t, --task <task>", "Task description", "manual run")
    .option("-r, --result <result>", "success or fail", "success")
    .option("-s, --score <score>", "Quality score 0-1", "1.0")
    .option("--json", "Output as JSON")
    .action(async (skill, opts) => {
      const asb = await loadBus();
      const monitor = new asb.SkillMonitor(getMonitorDir());
      const run = monitor.recordRun({
        agent: opts.agent,
        skill,
        task: opts.task,
        result: opts.result,
        score: parseFloat(opts.score as string),
      });
      if (opts.json) {
        console.log(JSON.stringify(run, null, 2));
      } else {
        console.log(chalk.green(`✓ Recorded: ${run.skill} → ${run.result} (score: ${run.score})`));
      }
    });
}

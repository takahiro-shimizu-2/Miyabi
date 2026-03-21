/**
 * task — Task management via task-sync.sh (Master Data: tasks.json)
 * Integrated from miyabi-hub
 */
import type { Command } from "commander";
import chalk from "chalk";
import { getTaskSyncPath } from "../utils/hub-paths.js";
import { runScript, scriptExists } from "../utils/shell-bridge.js";

function ensureTaskSync(): string {
  const taskSyncPath = getTaskSyncPath();
  if (!scriptExists(taskSyncPath)) {
    console.error(chalk.red(`✗ task-sync.sh not found: ${taskSyncPath}`));
    console.error(chalk.gray("  Set HAYASHI_ROOT environment variable or check AGENT/task-sync.sh"));
    process.exit(1);
  }
  return taskSyncPath;
}

function runTaskSync(args: string[]): void {
  const taskSyncPath = ensureTaskSync();
  try {
    const output = runScript(taskSyncPath, args, { timeout: 15_000 });
    console.log(output);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(chalk.red(`✗ ${message}`));
    process.exit(1);
  }
}

export function registerTaskCommand(program: Command): void {
  const task = program
    .command("task")
    .description("📋 Task management — list, add, complete tasks (GTD sync)");

  task.command("list")
    .description("List tasks")
    .option("-s, --status <status>", "Filter by status (pending, in_progress, done)")
    .option("-p, --priority <priority>", "Filter by priority (critical, high, medium, low)")
    .action((opts: { status?: string; priority?: string }) => {
      const args: string[] = ["list"];
      if (opts.status) {args.push(opts.status);}
      if (opts.priority) {args.push(opts.priority);}
      runTaskSync(args);
    });

  task.command("add")
    .description("Add a new task")
    .argument("<title>", "Task title")
    .option("-p, --priority <priority>", "Priority level", "medium")
    .option("-d, --due <date>", "Due date (YYYY-MM-DD)")
    .action((title: string, opts: { priority?: string; due?: string }) => {
      const args: string[] = ["add", title, `priority:${opts.priority}`];
      if (opts.due) {args.push(`due:${opts.due}`);}
      runTaskSync(args);
    });

  task.command("done")
    .description("Mark task as completed")
    .argument("<id>", "Task ID")
    .action((id: string) => runTaskSync(["done", id]));

  task.command("critical")
    .description("Show critical/overdue tasks")
    .action(() => runTaskSync(["list", "critical"]));
}

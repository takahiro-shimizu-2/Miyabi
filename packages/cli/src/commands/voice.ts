/**
 * voice command - Voice-First control interface
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

async function voiceAnnounce(message: string, options: { device?: string }): Promise<void> {
  const device = options.device || "office";
  console.log(chalk.cyan.bold("\n\uD83D\uDD0A Voice Announce\n"));
  console.log(chalk.white("  Message: " + message));
  console.log(chalk.white("  Device:  " + device));
  const safe = message.replace(/'/g, "\u2019");
  run("~/.claude/skills/voicebox-narrator/say.sh '" + safe + "' 1");
  console.log(chalk.green("  \u2713 Sent to VoiceBox"));
  console.log("");
}

async function voiceStatus(): Promise<void> {
  console.log(chalk.cyan.bold("\n\uD83C\uDFA4 Voice System Status\n"));
  const vv = run("curl -s http://localhost:50021/version 2>/dev/null");
  console.log(chalk.white("  VOICEVOX: " + (vv ? chalk.green(vv) : chalk.red("NOT RUNNING"))));
  console.log("");
}

export function registerVoiceCommand(program: Command): void {
  const voice = program
    .command("voice")
    .description("\uD83C\uDFA4 Voice-First control \u2014 announce, status");

  voice.command("announce <message>").description("Send voice announcement")
    .option("--device <name>", "Target device", "office")
    .action(async (message, options) => { await voiceAnnounce(message, options); });

  voice.command("status").description("Show voice system status")
    .action(async () => { await voiceStatus(); });

  voice.action(async () => { await voiceStatus(); });
}

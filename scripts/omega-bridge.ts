#!/usr/bin/env npx tsx
/**
 * Omega Bridge - Webhook → Ω-System Bridge
 *
 * Bridges GitHub Webhook events to the Miyabi Ω-System engine,
 * enabling Issue → task decomposition → structured execution plans.
 *
 * Usage:
 *   npx tsx scripts/omega-bridge.ts --issue 271 --repo ShunsukeHayashi/Miyabi
 *
 * Output (JSON to stdout):
 *   {
 *     "success": true,
 *     "issue": { number, title, body, ... },
 *     "intent": { ... },   // SWML IntentSpace
 *     "tasks": [ ... ],     // Decomposed tasks
 *     "omega": {            // Ω-System execution trace (if available)
 *       "stages": [...],
 *       "intermediates": { plan, taskSet, allocation }
 *     }
 *   }
 *
 * On failure, exits with code 1 and outputs:
 *   { "success": false, "error": "...", "fallback": true }
 *
 * @module scripts/omega-bridge
 */

import { execSync } from 'child_process';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// ============================================================================
// CLI Argument Parsing
// ============================================================================

interface BridgeArgs {
  issue: number;
  repo: string;
  verbose: boolean;
  dryRun: boolean;
}

function parseArgs(): BridgeArgs {
  const args = process.argv.slice(2);
  const parsed: Partial<BridgeArgs> = { verbose: false, dryRun: false };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--issue':
        parsed.issue = parseInt(args[++i], 10);
        break;
      case '--repo':
        parsed.repo = args[++i];
        break;
      case '--verbose':
      case '-v':
        parsed.verbose = true;
        break;
      case '--dry-run':
        parsed.dryRun = true;
        break;
      case '--help':
      case '-h':
        console.log(`
Usage: omega-bridge --issue <number> --repo <owner/repo> [options]

Options:
  --issue <number>   GitHub Issue number (required)
  --repo <owner/repo> Repository (required)
  --verbose, -v      Enable debug logging to stderr
  --dry-run          Parse issue only, skip Ω execution
  --help, -h         Show help
`);
        process.exit(0);
    }
  }

  if (!parsed.issue || !parsed.repo) {
    exitWithError('Missing required args: --issue <number> --repo <owner/repo>');
  }

  return parsed as BridgeArgs;
}

// ============================================================================
// Logging (always to stderr to keep stdout clean for JSON)
// ============================================================================

function log(msg: string, verbose = false): void {
  if (verbose) {
    process.stderr.write(`[omega-bridge] ${msg}\n`);
  }
}

function exitWithError(error: string): never {
  const output = JSON.stringify({ success: false, error, fallback: true });
  console.log(output);
  process.exit(1);
}

// ============================================================================
// GitHub Issue Fetcher
// ============================================================================

interface GitHubIssue {
  number: number;
  title: string;
  body: string;
  state: string;
  labels: string[];
  createdAt: string;
  updatedAt: string;
  url: string;
}

function fetchIssue(issueNumber: number, repo: string, verbose: boolean): GitHubIssue {
  log(`Fetching issue #${issueNumber} from ${repo}...`, verbose);

  try {
    const raw = execSync(
      `gh issue view ${issueNumber} --repo ${repo} --json number,title,body,state,labels,createdAt,updatedAt,url`,
      { encoding: 'utf-8', timeout: 30_000 }
    ).trim();

    const data = JSON.parse(raw);

    return {
      number: data.number,
      title: data.title,
      body: data.body || '',
      state: data.state?.toLowerCase() ?? 'open',
      labels: (data.labels || []).map((l: any) => (typeof l === 'string' ? l : l.name)),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      url: data.url,
    };
  } catch (err: any) {
    exitWithError(`Failed to fetch issue #${issueNumber}: ${err.message}`);
  }
}

// ============================================================================
// Lightweight Task Decomposition (no build required)
// ============================================================================

interface DecomposedTask {
  id: string;
  title: string;
  description: string;
  type: 'feature' | 'bug' | 'refactor' | 'docs' | 'test';
  priority: number;
  dependencies: string[];
  isMeta: boolean;
}

/**
 * Parse issue body into structured tasks without requiring compiled packages.
 * This is the fallback when @miyabi/coding-agents isn't built.
 */
function decomposeFromBody(issue: GitHubIssue): DecomposedTask[] {
  const tasks: DecomposedTask[] = [];
  const lines = issue.body.split('\n');
  let taskIndex = 0;
  let currentSection = '';

  for (const line of lines) {
    // Track current section heading
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      currentSection = headingMatch[1].trim().toLowerCase();
      continue;
    }

    // Skip meta sections
    if (['概要', 'overview', '完了条件', 'completion criteria', 'acceptance criteria'].includes(currentSection)) {
      // Extract from completion criteria as test tasks
      if (['完了条件', 'completion criteria', 'acceptance criteria'].includes(currentSection)) {
        const checkboxMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
        if (checkboxMatch) {
          tasks.push({
            id: `task-${issue.number}-verify-${taskIndex}`,
            title: `Verify: ${checkboxMatch[1].trim()}`,
            description: checkboxMatch[1].trim(),
            type: 'test',
            priority: taskIndex,
            dependencies: [],
            isMeta: false,
          });
          taskIndex++;
        }
      }
      continue;
    }

    // Parse checkbox items as tasks
    const checkboxMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
    if (checkboxMatch) {
      const text = checkboxMatch[1].trim();
      tasks.push({
        id: `task-${issue.number}-${taskIndex}`,
        title: text,
        description: text,
        type: inferTaskType(text),
        priority: taskIndex,
        dependencies: taskIndex > 0 ? [`task-${issue.number}-${taskIndex - 1}`] : [],
        isMeta: false,
      });
      taskIndex++;
      continue;
    }

    // Parse numbered items
    const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      const text = numberedMatch[1].trim();
      tasks.push({
        id: `task-${issue.number}-${taskIndex}`,
        title: text,
        description: text,
        type: inferTaskType(text),
        priority: taskIndex,
        dependencies: taskIndex > 0 ? [`task-${issue.number}-${taskIndex - 1}`] : [],
        isMeta: false,
      });
      taskIndex++;
      continue;
    }

    // Parse requirement-style bullet items (from 要件 section)
    if (currentSection === '要件' || currentSection === 'requirements') {
      const bulletMatch = line.match(/^-\s+(.+)$/);
      if (bulletMatch) {
        const text = bulletMatch[1].trim();
        tasks.push({
          id: `task-${issue.number}-${taskIndex}`,
          title: text,
          description: text,
          type: inferTaskType(text),
          priority: taskIndex,
          dependencies: [],
          isMeta: false,
        });
        taskIndex++;
      }
    }
  }

  // If no tasks found, create a single task from the title
  if (tasks.length === 0) {
    tasks.push({
      id: `task-${issue.number}-0`,
      title: issue.title.replace(/^\[auto\]\s*/i, ''),
      description: issue.body,
      type: 'feature',
      priority: 0,
      dependencies: [],
      isMeta: false,
    });
  }

  return tasks;
}

/**
 * Infer task type from text content
 */
function inferTaskType(text: string): 'feature' | 'bug' | 'refactor' | 'docs' | 'test' {
  const lower = text.toLowerCase();
  if (lower.includes('test') || lower.includes('verify') || lower.includes('テスト') || lower.includes('検証')) {
    return 'test';
  }
  if (lower.includes('fix') || lower.includes('bug') || lower.includes('バグ') || lower.includes('修正')) {
    return 'bug';
  }
  if (lower.includes('refactor') || lower.includes('リファクタ') || lower.includes('cleanup')) {
    return 'refactor';
  }
  if (lower.includes('doc') || lower.includes('readme') || lower.includes('ドキュメント')) {
    return 'docs';
  }
  return 'feature';
}

// ============================================================================
// Ω-System Integration (optional, requires built packages)
// ============================================================================

interface OmegaTrace {
  stages: Array<{ name: string; status: string; durationMs: number }>;
  intermediates: {
    plan?: any;
    taskSet?: any;
    allocation?: any;
  };
}

/**
 * Attempt to run the full Ω-System pipeline.
 * Returns null if packages aren't built / available.
 */
async function tryOmegaExecution(
  issue: GitHubIssue,
  verbose: boolean
): Promise<OmegaTrace | null> {
  try {
    log('Attempting Ω-System import...', verbose);

    // Dynamic import - fails gracefully if not built
    const { IssueToIntentAdapter } = await import(
      /* webpackIgnore: true */
      `${PROJECT_ROOT}/packages/coding-agents/omega-system/adapters/issue-to-intent.js`
    );
    const { createWorldFromEnvironment } = await import(
      `${PROJECT_ROOT}/packages/coding-agents/omega-system/adapters/context-to-world.js`
    );
    const { OmegaEngine } = await import(
      `${PROJECT_ROOT}/packages/coding-agents/omega-system/omega-engine.js`
    );

    log('Ω-System modules loaded successfully', verbose);

    // Convert issue to SWML IntentSpace
    const intent = IssueToIntentAdapter.convert({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state as 'open' | 'closed',
      labels: issue.labels,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      url: issue.url,
    });

    // Create world context
    const world = createWorldFromEnvironment();

    // Execute Ω pipeline (understanding + generation + allocation only)
    const engine = new OmegaEngine({
      validateBetweenStages: false,
      stopOnValidationError: false,
      enableLearning: false,
      enableKnowledgePersistence: false,
      maxExecutionTimeMs: 60_000,
    });

    const result = await engine.execute(intent, world);

    if (result.success) {
      log('Ω-System execution succeeded', verbose);
      return {
        stages: result.trace.stages.map((s: any) => ({
          name: s.stage,
          status: s.status,
          durationMs: s.durationMs,
        })),
        intermediates: {
          plan: result.trace.intermediates?.plan,
          taskSet: result.trace.intermediates?.taskSet,
          allocation: result.trace.intermediates?.allocation,
        },
      };
    }

    log(`Ω-System execution failed: ${result.error}`, verbose);
    return null;
  } catch (err: any) {
    log(`Ω-System not available: ${err.message}`, verbose);
    return null;
  }
}

// ============================================================================
// IntentSpace Generation (lightweight, always available)
// ============================================================================

interface LightweightIntent {
  intentId: string;
  goals: Array<{
    id: string;
    type: 'primary' | 'secondary';
    description: string;
    priority: string;
  }>;
  preferences: {
    qualityVsSpeed: string;
    automation: string;
  };
  modality: {
    primary: string;
    language: string;
  };
}

function buildLightweightIntent(issue: GitHubIssue): LightweightIntent {
  const goals: LightweightIntent['goals'] = [];
  const lines = issue.body.split('\n');
  let goalIndex = 0;

  for (const line of lines) {
    const checkboxMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
    if (checkboxMatch) {
      goals.push({
        id: `goal-${issue.number}-${goalIndex++}`,
        type: goalIndex === 1 ? 'primary' : 'secondary',
        description: checkboxMatch[1].trim(),
        priority: 'medium',
      });
    }

    const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      goals.push({
        id: `goal-${issue.number}-${goalIndex++}`,
        type: goalIndex === 1 ? 'primary' : 'secondary',
        description: numberedMatch[1].trim(),
        priority: 'medium',
      });
    }
  }

  if (goals.length === 0) {
    goals.push({
      id: `goal-${issue.number}-0`,
      type: 'primary',
      description: issue.title.replace(/^\[auto\]\s*/i, ''),
      priority: 'medium',
    });
  }

  const hasAutoLabel = issue.labels.some(l => l.includes('auto'));
  const hasUrgent = issue.labels.some(l => l.includes('urgent') || l.includes('P0') || l.includes('Critical'));

  return {
    intentId: `intent-issue-${issue.number}`,
    goals,
    preferences: {
      qualityVsSpeed: hasUrgent ? 'speed' : 'balanced',
      automation: hasAutoLabel ? 'full-auto' : 'semi-auto',
    },
    modality: {
      primary: 'code',
      language: 'typescript',
    },
  };
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main(): Promise<void> {
  const args = parseArgs();

  log(`omega-bridge starting: issue=#${args.issue} repo=${args.repo}`, args.verbose);

  // Step 1: Fetch the issue
  const issue = fetchIssue(args.issue, args.repo, args.verbose);
  log(`Fetched: "${issue.title}" (${issue.state})`, args.verbose);

  // Step 2: Build lightweight intent (always works)
  const intent = buildLightweightIntent(issue);
  log(`Intent: ${intent.goals.length} goals extracted`, args.verbose);

  // Step 3: Decompose tasks from body
  const tasks = decomposeFromBody(issue);
  log(`Tasks: ${tasks.length} tasks decomposed`, args.verbose);

  // Step 4: Try Ω-System (optional, may not be available)
  let omega: OmegaTrace | null = null;
  if (!args.dryRun) {
    omega = await tryOmegaExecution(issue, args.verbose);
  }

  // Step 5: Output result
  const result = {
    success: true,
    issue: {
      number: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels,
      url: issue.url,
    },
    intent,
    tasks: tasks.filter(t => !t.isMeta),
    omega: omega ?? {
      stages: [],
      intermediates: {},
      note: 'Ω-System packages not built. Using lightweight decomposition.',
    },
    metadata: {
      bridge: 'omega-bridge',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      omegaAvailable: omega !== null,
    },
  };

  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  exitWithError(`Unexpected error: ${err.message}`);
});

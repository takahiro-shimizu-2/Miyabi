# Repository Guidelines

## Project Structure & Module Organization
- `packages/` contains the workspace packages (CLI, coding agents, business agents, SDKs, MCP bundle, etc.).
- `scripts/` holds operational automation and tooling entry points (most `npm run` commands call into here).
- `services/` includes service backends such as the context API.
- `tests/` contains repo-wide tests; some packages also keep tests under `packages/**/tests`.
- `docs/`, `assets/`, `templates/`, and `miyabi_def/` store documentation, media, and system templates.
- `mcp-servers/`, `workflow-automation/`, and `database/` support MCP integrations, workflow agents, and data.

## Build, Test, and Development Commands
- `npm install` installs workspace dependencies.
- `npm start` runs the main agentic workflow (`scripts/operations/agentic.ts`).
- `npm run build` compiles TypeScript with `tsc`.
- `npm test` runs the Vitest suite; `npm run test:e2e` runs Playwright.
- `npm run lint` and `npm run typecheck` enforce ESLint + TypeScript checks.
- `npm run verify:all` runs lint, typecheck, tests, and security scan.

## Coding Style & Naming Conventions
- TypeScript strict mode is required; avoid `any` and return types should be explicit.
- ESLint must pass with 0 errors; follow existing formatting in each file.
- Naming: classes and interfaces use `PascalCase`, functions use `camelCase`, constants use `UPPER_SNAKE_CASE`.
- Private methods may use an underscore prefix (e.g., `_internalMethod`).

## Testing Guidelines
- Frameworks: Vitest for unit/integration tests, Playwright for end-to-end.
- Coverage targets: 80% minimum overall; 100% for critical paths; test error handling.
- Test files typically live in `tests/` or `packages/**/tests` and follow `*.test.ts`.

## Commit & Pull Request Guidelines
- Commit messages follow Conventional Commits (`feat(scope): description`).
- Include the Claude Code attribution lines shown in `CONTRIBUTING.md` when applicable.
- Before PR: run `npm test` and `npm run typecheck`, update docs and types as needed.
- PRs should include a summary, test results, and checklist; squash merge is the default.

## Agent-Specific Instructions
- This repo uses Log-Driven Development: create a daily log under `.ai/logs/YYYY-MM-DD.md` and record intent, plan, implementation, and verification.
- Update the memory bank (`@memory-bank.mdc`) after completing work.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Miyabi** (6035 symbols, 15045 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## When Debugging

1. `gitnexus_query({query: "<error or symptom>"})` — find execution flows related to the issue
2. `gitnexus_context({name: "<suspect function>"})` — see all callers, callees, and process participation
3. `READ gitnexus://repo/Miyabi/process/{processName}` — trace the full execution flow step by step
4. For regressions: `gitnexus_detect_changes({scope: "compare", base_ref: "main"})` — see what your branch changed

## When Refactoring

- **Renaming**: MUST use `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` first. Review the preview — graph edits are safe, text_search edits need manual review. Then run with `dry_run: false`.
- **Extracting/Splitting**: MUST run `gitnexus_context({name: "target"})` to see all incoming/outgoing refs, then `gitnexus_impact({target: "target", direction: "upstream"})` to find all external callers before moving code.
- After any refactor: run `gitnexus_detect_changes({scope: "all"})` to verify only expected files changed.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Tools Quick Reference

| Tool | When to use | Command |
|------|-------------|---------|
| `query` | Find code by concept | `gitnexus_query({query: "auth validation"})` |
| `context` | 360-degree view of one symbol | `gitnexus_context({name: "validateUser"})` |
| `impact` | Blast radius before editing | `gitnexus_impact({target: "X", direction: "upstream"})` |
| `detect_changes` | Pre-commit scope check | `gitnexus_detect_changes({scope: "staged"})` |
| `rename` | Safe multi-file rename | `gitnexus_rename({symbol_name: "old", new_name: "new", dry_run: true})` |
| `cypher` | Custom graph queries | `gitnexus_cypher({query: "MATCH ..."})` |

## Impact Risk Levels

| Depth | Meaning | Action |
|-------|---------|--------|
| d=1 | WILL BREAK — direct callers/importers | MUST update these |
| d=2 | LIKELY AFFECTED — indirect deps | Should test |
| d=3 | MAY NEED TESTING — transitive | Test if critical path |

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/Miyabi/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Miyabi/clusters` | All functional areas |
| `gitnexus://repo/Miyabi/processes` | All execution flows |
| `gitnexus://repo/Miyabi/process/{name}` | Step-by-step execution trace |

## Self-Check Before Finishing

Before completing any code modification task, verify:
1. `gitnexus_impact` was run for all modified symbols
2. No HIGH/CRITICAL risk warnings were ignored
3. `gitnexus_detect_changes()` confirms changes match expected scope
4. All d=1 (WILL BREAK) dependents were updated

## Keeping the Index Fresh

After committing code changes, the GitNexus index becomes stale. Re-run analyze to update it:

```bash
npx gitnexus analyze
```

If the index previously included embeddings, preserve them by adding `--embeddings`:

```bash
npx gitnexus analyze --embeddings
```

To check whether embeddings exist, inspect `.gitnexus/meta.json` — the `stats.embeddings` field shows the count (0 means no embeddings). **Running analyze without `--embeddings` will delete any previously generated embeddings.**

> Claude Code users: A PostToolUse hook handles this automatically after `git commit` and `git merge`.

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

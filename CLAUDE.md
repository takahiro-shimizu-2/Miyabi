# Miyabi

**One command. Everything automated.**

## What is Miyabi?

Autonomous AI development platform. Issue to Deploy, fully automated.

```bash
npx miyabi init my-project   # Create new project
npx miyabi status            # Check status
npx miyabi auto              # Start autonomous mode
```

## Architecture

```
Issue → Agent → Code → Review → PR → Deploy
```

**21 Agents** (7 Coding + 14 Business):
- Coding: Coordinator, CodeGen, Review, Issue, PR, Deployment, Test
- Business: Marketing, Sales, Analytics, CRM, etc.

**GitHub as OS**:
- Issues = Task Queue
- Labels = State Machine (53 labels)
- Actions = Execution Engine
- Projects V2 = Data Layer

## Key Files

| File | Purpose |
|------|---------|
| `.claude/commands/*.md` | Slash commands |
| `.claude/agents/specs/` | Agent specifications |
| `.claude/agents/prompts/` | Execution prompts |
| `.claude/skills/*.md` | Reusable skills |
| `.claude/hooks/*.sh` | Event hooks |

## Quick Reference

**State Flow**:
```
pending → analyzing → implementing → reviewing → done
```

**Commands**:
- `/agent-run` - Execute agent on issue
- `/deploy` - Deploy to production
- `/security-scan` - Security audit
- `/verify` - System health check

**Labels** (10 categories):
- STATE: pending, analyzing, implementing, done
- AGENT: coordinator, codegen, review, deploy
- PRIORITY: P0-Critical to P3-Low
- TYPE: feature, bug, docs, refactor

## Development

```bash
# Environment
export GITHUB_TOKEN=ghp_xxx

# Test
npm test

# Build
npm run build
```

**Rules**:
- TypeScript strict mode
- ESM format
- Conventional Commits
- 80%+ test coverage

## Links

- **npm**: [miyabi](https://npmjs.com/package/miyabi), [miyabi-mcp-bundle](https://npmjs.com/package/miyabi-mcp-bundle)
- **GitHub**: [ShunsukeHayashi/Miyabi](https://github.com/ShunsukeHayashi/Miyabi)
- **Docs**: `.claude/QUICK_START.md`, `docs/ENTITY_RELATION_MODEL.md`

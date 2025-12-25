# .claude/ - Claude Code Configuration

## Quick Start

- **New users**: [QUICK_START.md](QUICK_START.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

## Directory Structure

```
.claude/
├── agents/                 # 21 Agent definitions
│   ├── specs/coding/      # 7 Coding Agent specs
│   ├── specs/business/    # 14 Business Agent specs
│   └── prompts/           # Execution prompts
├── commands/              # Slash commands (project-specific)
├── docs/                  # Additional documentation
├── hooks/                 # Event hooks
├── mcp-servers/           # MCP server implementations
├── monitoring/            # Dashboard configuration
├── prompts/               # Shared prompts and protocols
└── skills/                # Reusable skills (8 executable + 13 guides)
```

## Agents (21)

**Coding (7)**: Coordinator, CodeGen, Review, Issue, PR, Deployment, Test
**Business (14)**: Marketing, Sales, Analytics, CRM, Persona, etc.

## Commands

| Command | Purpose |
|---------|---------|
| `/agent-run` | Execute agent on issue |
| `/create-issue` | Create GitHub issue interactively |
| `/deploy` | Deploy to production |
| `/generate-docs` | Generate documentation |
| `/miyabi-auto` | Start autonomous mode |
| `/miyabi-todos` | Detect and create issues from TODOs |
| `/review` | Comprehensive code review |
| `/security-scan` | Security vulnerability scan |
| `/test` | Run tests |
| `/verify` | System health check |

## Hooks

| Hook | Purpose |
|------|---------|
| `auto-format.sh` | ESLint/Prettier |
| `validate-typescript.sh` | Type check |
| `log-commands.sh` | Command logging |
| `agent-event.sh` | Dashboard events |

## MCP Servers

- `miyabi-integration.js` - Miyabi CLI
- `github-enhanced.cjs` - GitHub API
- `project-context.cjs` - Project info
- `ide-integration.cjs` - VS Code/Jupyter

## Usage

```bash
# Setup
cp .claude/settings.example.json .claude/settings.local.json
export GITHUB_TOKEN=ghp_xxx

# Commands in Claude Code
/test
/agent-run
/deploy
```

## Related Docs

- [CLAUDE.md](../CLAUDE.md) - Project context
- [docs/ENTITY_RELATION_MODEL.md](../docs/ENTITY_RELATION_MODEL.md)
- [docs/LABEL_SYSTEM_GUIDE.md](../docs/LABEL_SYSTEM_GUIDE.md)

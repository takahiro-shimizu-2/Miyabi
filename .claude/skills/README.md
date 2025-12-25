# Miyabi Skills

Reusable skills for Claude Code in the Miyabi project.

## Formats

1. **Directory format** (recommended): `skill-name/SKILL.md` - Executable skills with frontmatter
2. **Guide format**: `skill-name.md` - Knowledge guides and best practices

## Executable Skills

| Skill | Purpose | Triggers |
|-------|---------|----------|
| [ccg](./ccg/) | AI Course Content Generator | "ccg", "create course", "/ccg" |
| [code-reviewer](./code-reviewer/) | Code review with quality scoring | "review", "check PR" |
| [commit-helper](./commit-helper/) | Conventional Commits generator | "commit", "コミット" |
| [refactor-helper](./refactor-helper/) | Safe code refactoring | "refactor", "リファクタ" |
| [test-generator](./test-generator/) | Unit test generation | "write tests", "テスト" |
| [doc-generator](./doc-generator/) | Documentation generation | "document", "ドキュメント" |
| [skill-creator](./skill-creator/) | Create new Claude skills | "create skill", "スキル作成" |
| [autonomous-coding-agent](./autonomous-coding-agent/) | Autonomous development workflows | "自律コーディング" |

## Knowledge Guides

### Development

| Guide | Purpose |
|-------|---------|
| [typescript-development](./typescript-development.md) | TypeScript best practices |
| [mcp-server-development](./mcp-server-development.md) | MCP server development |
| [tdd-workflow](./tdd-workflow.md) | Test-driven development |
| [debugging](./debugging.md) | Debugging techniques |

### Workflow

| Guide | Purpose |
|-------|---------|
| [issue-driven-development](./issue-driven-development.md) | Issue-based workflow |
| [git-workflow](./git-workflow.md) | Git conventions |
| [code-review](./code-review.md) | Code review guide |
| [documentation](./documentation.md) | Documentation practices |

### Quality

| Guide | Purpose |
|-------|---------|
| [security-audit](./security-audit.md) | Security auditing |
| [performance](./performance.md) | Performance optimization |
| [ci-cd](./ci-cd.md) | CI/CD pipelines |

### Business

| Guide | Purpose |
|-------|---------|
| [product-planning](./product-planning.md) | Product planning |
| [market-research](./market-research.md) | Market research |

## Usage

### In Claude Code

```bash
# Skills auto-activate based on triggers
claude "review this code"        # Activates code-reviewer
claude "write tests for this"    # Activates test-generator
claude "commit changes"          # Activates commit-helper
```

### With Miyabi CLI

```bash
npx miyabi --skill code-reviewer
npx miyabi --skill test-generator
```

## Creating New Skills

Use the skill-creator skill:

```
claude "create a skill for [your workflow]"
```

Or manually:

```bash
mkdir -p .claude/skills/my-skill
# Create .claude/skills/my-skill/SKILL.md with proper frontmatter
```

See [skill-creator](./skill-creator/) for the full template.

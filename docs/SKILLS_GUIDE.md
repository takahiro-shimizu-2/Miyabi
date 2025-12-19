# Miyabi Skills Guide

**Version:** 0.19.0

Claude Skills are reusable workflow templates that integrate with Claude Code. Miyabi provides 7 pre-built skills optimized for development workflows.

---

## Quick Start

Skills auto-activate in Claude Code based on triggers:

```bash
# Review code
claude "review this PR"

# Generate tests
claude "write tests for src/utils.ts"

# Create commit message
claude "commit these changes"
```

---

## Available Skills

### 1. code-reviewer

**Purpose:** Comprehensive code review with quality scoring

**Triggers:**
- "review this code"
- "check this PR"
- "コードレビューして"

**Features:**
- 100-point quality scoring
- Security vulnerability detection
- Performance analysis
- Maintainability assessment

**Output:**
```json
{
  "score": 85,
  "issues": [...],
  "suggestions": [...]
}
```

---

### 2. commit-helper

**Purpose:** Generate Conventional Commits messages

**Triggers:**
- "commit these changes"
- "create commit message"
- "コミット"

**Features:**
- Analyzes staged changes
- Follows Conventional Commits spec
- Supports all commit types (feat, fix, chore, etc.)

**Output:**
```
feat(auth): add OAuth2 login support

- Add Google OAuth provider
- Implement token refresh logic
- Add session management
```

---

### 3. test-generator

**Purpose:** Generate unit tests

**Triggers:**
- "write tests for this"
- "generate tests"
- "テスト作成"

**Features:**
- Vitest/Jest compatible
- Edge case coverage
- Mock generation
- Snapshot testing support

---

### 4. doc-generator

**Purpose:** Generate documentation

**Triggers:**
- "document this code"
- "generate docs"
- "ドキュメント作成"

**Features:**
- JSDoc comments
- README generation
- API reference
- Markdown formatting

---

### 5. refactor-helper

**Purpose:** Safe code refactoring

**Triggers:**
- "refactor this"
- "improve code quality"
- "リファクタ"

**Features:**
- Step-by-step refactoring plan
- Test preservation
- Type safety maintenance
- Breaking change detection

---

### 6. skill-creator

**Purpose:** Create custom skills

**Triggers:**
- "create a skill for X"
- "スキル作成"

**Features:**
- Interactive skill wizard
- SKILL.md template generation
- Trigger pattern suggestions

---

### 7. autonomous-coding-agent

**Purpose:** CLI integration for autonomous workflows

**Triggers:**
- "autonomous coding"
- "自律コーディング"

**Features:**
- Claude Code CLI integration
- Multi-session management
- CI/CD pipeline integration

---

## Skill Format

### Directory Structure

```
.claude/skills/skill-name/
├── SKILL.md          # Required: Main instruction file
├── COORDINATION.md   # Optional: Cross-skill coordination
├── resources/        # Optional: Reference documents
│   └── examples.md
└── scripts/          # Optional: Helper scripts
    └── helper.sh
```

### SKILL.md Template

```markdown
---
name: my-skill
description: Description. Use when X, Y, Z.
allowed-tools: Bash, Read, Write, Grep, Glob
---

# My Skill

## Triggers

| Trigger | Examples |
|---------|----------|
| Category | "example 1", "example 2" |

## Instructions

1. Step one
2. Step two

## Output Format

...
```

---

## Creating Custom Skills

Use the skill-creator skill:

```bash
claude "create a skill for database migrations"
```

Or manually:

```bash
mkdir -p .claude/skills/my-skill
# Create SKILL.md with proper frontmatter
```

---

## Best Practices

### 1. Single Responsibility
Each skill should do one thing well.

### 2. Clear Triggers
Use specific, unambiguous trigger phrases.

### 3. Bilingual Support
Include both English and Japanese triggers.

### 4. Output Format
Define clear, structured output formats.

---

## Forbidden Words

These words cannot be used in skill names:
- `claude` (trademark)
- `anthropic` (company name)
- `mcp` (protocol name)

---

## Links

- [Skills README](./.claude/skills/README.md)
- [skill-creator SKILL.md](./.claude/skills/skill-creator/SKILL.md)

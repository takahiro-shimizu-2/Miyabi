<div align="center">

# 🌸 Miyabi

**The agentic development framework that turns GitHub Issues into production code.**

[![npm version](https://img.shields.io/npm/v/miyabi.svg?style=flat-square)](https://www.npmjs.com/package/miyabi)
[![npm downloads](https://img.shields.io/npm/dm/miyabi.svg?style=flat-square)](https://www.npmjs.com/package/miyabi)
[![MCP Bundle](https://img.shields.io/npm/v/miyabi-mcp-bundle.svg?label=mcp-bundle&style=flat-square)](https://www.npmjs.com/package/miyabi-mcp-bundle)
[![GitHub stars](https://img.shields.io/github/stars/ShunsukeHayashi/Miyabi?style=flat-square)](https://github.com/ShunsukeHayashi/Miyabi/stargazers)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg?style=flat-square)](LICENSE)
[![Follow @The_AGI_WAY](https://img.shields.io/twitter/follow/The_AGI_WAY?style=flat-square&logo=x&label=Follow)](https://x.com/The_AGI_WAY)

```bash
npx miyabi
```

**Issue to PR in 10-15 minutes. Zero human coding required.**

[Quick Start](#quick-start) | [Why Miyabi?](#why-miyabi) | [CLI Commands](#cli-commands) | [Discord](https://discord.gg/ZpY9sxfYNm)

</div>

---

## The Magic

```
📝 Write an Issue    →    🤖 7 AI Agents collaborate    →    ✅ PR arrives
```

Miyabi orchestrates 7 specialized coding agents that autonomously analyze, implement, review, test, and create pull requests — all triggered by a single GitHub Issue.

---

## Why Miyabi?

| Feature | Miyabi | CrewAI | AutoGen | LangGraph |
|---------|--------|--------|---------|-----------|
| **Issue → PR automation** | Built-in | Manual setup | Manual setup | Manual setup |
| **GitHub-native (Issues as task queue)** | 53 labels + 16 workflows | No | No | No |
| **MCP tools (172+ bundled)** | Built-in bundle | Via adapter | Via extension | Via adapter |
| **Agent Skill Bus (110+ skills)** | Built-in | No | No | No |
| **Code intelligence (GitNexus)** | Built-in | No | No | No |
| **Quality gate (auto-review + retry)** | Score 80+ or escalate | Manual | Manual | Manual |
| **Distributed cluster execution** | Up to 5 machines | No | No | No |
| **Zero-config quick start** | `npx miyabi` | pip install + config | pip install + config | pip install + config |
| **Language** | TypeScript | Python | Python | Python |

**Miyabi treats GitHub as an operating system** — Issues are the task queue, Labels are the state machine, Actions are the execution engine, and Webhooks are the event bus.

---

## Ecosystem

Miyabi is a full-stack agentic framework. These are its core subsystems:

```
┌─────────────────────────────────────────────────────────────────┐
│                        🌸 Miyabi                                │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Miyabi CLI   │  │ Agent SDK    │  │ MCP Bundle            │  │
│  │ 25 commands  │  │ 7 coding +   │  │ 172+ tools for        │  │
│  │ npx miyabi   │  │ 14 business  │  │ Claude Desktop/Code   │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ Agent Skill  │  │ GitNexus     │  │ GitHub as OS          │  │
│  │ Bus          │  │ Code Intel   │  │ 53 labels × 16        │  │
│  │ 110+ skills  │  │ Impact       │  │ workflows             │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

| Component | Repository | Stars |
|-----------|-----------|-------|
| **Agent Skill Bus** | [ShunsukeHayashi/agent-skill-bus](https://github.com/ShunsukeHayashi/agent-skill-bus) | ![Stars](https://img.shields.io/github/stars/ShunsukeHayashi/agent-skill-bus?style=flat-square) |
| **GitNexus** | [ShunsukeHayashi/gitnexus-stable-ops](https://github.com/ShunsukeHayashi/gitnexus-stable-ops) | ![Stars](https://img.shields.io/github/stars/ShunsukeHayashi/gitnexus-stable-ops?style=flat-square) |
| **MCP Bundle** | Included in monorepo | [![npm](https://img.shields.io/npm/v/miyabi-mcp-bundle.svg?style=flat-square)](https://www.npmjs.com/package/miyabi-mcp-bundle) |

---

## Quick Start

```bash
# Install and run
npx miyabi

# Check system status
npx miyabi status --json
npx miyabi doctor --json

# Full automation: Issue → Code → Test → PR
npx miyabi cycle

# Shortcuts
npx miyabi fix 123        # Fix bug (Issue #123)
npx miyabi build 123      # Add feature (Issue #123)
npx miyabi ship           # Deploy to production

# MCP Server for Claude Desktop/Code
npm install -g miyabi-mcp-bundle
```

---

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [miyabi](https://www.npmjs.com/package/miyabi) | [![npm](https://img.shields.io/npm/v/miyabi.svg?style=flat-square)](https://www.npmjs.com/package/miyabi) | CLI - 25-command autonomous development framework |
| [miyabi-mcp-bundle](https://www.npmjs.com/package/miyabi-mcp-bundle) | [![npm](https://img.shields.io/npm/v/miyabi-mcp-bundle.svg?style=flat-square)](https://www.npmjs.com/package/miyabi-mcp-bundle) | MCP Server - 172+ tools for Claude Desktop/Code |
| @miyabi/agent-sdk | v0.1.0 | Agent SDK - 7 Coding Agents in TypeScript |
| @agentic-os/core | v0.1.0 | Core - Agent system foundation |

### Monorepo Structure

```
packages/
├── cli/                  # Miyabi CLI (npx miyabi)
├── mcp-bundle/           # MCP Server (172+ tools)
├── miyabi-agent-sdk/     # Agent SDK (7 Coding Agents)
├── core/                 # @agentic-os/core
├── coding-agents/        # Coding Agent implementations
├── business-agents/      # Business Agent definitions
├── shared-utils/         # Cross-package utilities
├── context-engineering/  # Context engineering tools
├── github-projects/      # GitHub Projects V2 integration
├── task-manager/         # Task management
├── doc-generator/        # Documentation generator
└── miyabi-web/           # Web dashboard
```

---

## CLI Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `miyabi status` | Project status (Issues/PRs/Agents) |
| `miyabi doctor` | System diagnostics (git/node/npm/GitHub) |
| `miyabi health` | Quick health check |
| `miyabi init <name>` | New project (53 labels + 16 workflows) |
| `miyabi install` | Add Miyabi to existing project |
| `miyabi setup` | Setup guide (tokens/config) |
| `miyabi onboard` | First-time onboarding wizard |
| `miyabi auth` | GitHub OAuth (login/logout/status) |
| `miyabi config` | Settings (get/set/list) |

### Development Commands

| Command | Description |
|---------|-------------|
| `miyabi agent` | Run agent (coordinator/codegen/review/pr/deploy) |
| `miyabi run` | Unified runner (codegen/review/deploy/full-cycle) |
| `miyabi fix <issue>` | Bug fix shortcut |
| `miyabi build <issue>` | Feature build shortcut |
| `miyabi ship` | Production deploy shortcut |
| `miyabi auto` | Water Spider full-auto mode |
| `miyabi omega` | Omega 6-stage pipeline |
| `miyabi cycle` | Issue → Code → Test → PR automation |
| `miyabi sprint` | Sprint planning + batch Issue creation |
| `miyabi pipeline` | Command composition (pipe/AND/OR/parallel) |

### Tool Commands

| Command | Description |
|---------|-------------|
| `miyabi release` | Release management + X/Discord auto-notify |
| `miyabi voice` | Voice-driven mode (VoiceBox/Google Home) |
| `miyabi skills` | Agent Skill management (list/health/sync) |
| `miyabi todos` | Auto-detect TODO/FIXME → create Issues |
| `miyabi dashboard` | Dashboard management |
| `miyabi docs` | Auto-generate documentation |

---

## Agent System

### 7 Coding Agents

| Agent | Role | Quality Gate |
|-------|------|-------------|
| **CoordinatorAgent** | Task decomposition + DAG | Orchestrator |
| **IssueAgent** | Issue analysis + 53-label classification | Analysis |
| **CodeGenAgent** | Code generation (Claude Sonnet 4) | Execution |
| **ReviewAgent** | Code quality (100-point scale, 80+ to pass) | Execution |
| **TestAgent** | Test execution + coverage | Execution |
| **PRAgent** | PR creation (Conventional Commits) | Execution |
| **DeploymentAgent** | CI/CD automation | Execution |

### 14 Business Agents (Planned)

Marketing, Sales, Content, and Analytics agents for end-to-end business automation. Currently in design phase.

### Quality Gate

```
CodeGenAgent → ReviewAgent (score 80+?) → [Yes] → PRAgent
                    ↓ [No]
              Retry up to 3x → Below threshold → Escalate to human
```

---

## GitHub as Operating System

| GitHub Feature | OS Role |
|---------------|---------|
| **Issues** | Task queue |
| **Labels** | State machine (53 labels x 10 categories) |
| **Projects V2** | Kanban board / data layer |
| **Actions** | Execution engine (16 workflows) |
| **Webhooks** | Event bus |

```
pending → analyzing → implementing → reviewing → done
```

---

## Key Features

### Agent Skill Bus (110+ Skills)

Dynamically load and execute skills via the bus — code-reviewer, test-generator, commit-helper, and 107 more.

```bash
npx miyabi skills list    # List 110+ skills
npx miyabi skills health  # Health score
```

> **[agent-skill-bus](https://github.com/ShunsukeHayashi/agent-skill-bus)** is the standalone skill engine that powers Miyabi's extensibility.

### GitNexus Code Intelligence

Automatic dependency analysis, test coverage mapping, and cross-package impact assessment before any code change.

> **[gitnexus-stable-ops](https://github.com/ShunsukeHayashi/gitnexus-stable-ops)** provides the code intelligence backbone.

### Distributed Cluster Execution

Run tasks across up to 5 machines (MacBook + Windows + Mac mini x3) via SSH/Tailscale network dispatch.

### X/Discord Auto-Notification

`miyabi release announce` auto-posts release info via X (Twitter) API v2 and Discord webhooks.

---

## Development

```bash
# Root level
npm test                  # vitest
npm run build             # TypeScript compile
npm run lint              # ESLint
npm run typecheck         # TypeScript type check
npm run verify:all        # lint + typecheck + test + security

# CLI package
cd packages/cli
npm run dev               # tsx (development)
npm run build             # tsc + fix-esm-imports
npm test                  # vitest

# MCP Bundle
cd packages/mcp-bundle
npm run dev               # tsx hot reload
npm test                  # vitest
```

---

## Requirements

- Node.js 18+
- GitHub account + `GITHUB_TOKEN`

---

## Learn More

- [CLI Documentation](./packages/cli/README.md)
- [MCP Bundle Documentation](./packages/mcp-bundle/README.md)
- [Agent SDK](./packages/miyabi-agent-sdk/README.md)
- [Discord Community](https://discord.gg/ZpY9sxfYNm)
- [Report Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)
- [Sponsor](https://github.com/sponsors/ShunsukeHayashi)

---

## Like Miyabi?

If Miyabi helps your development workflow, consider:

- **[Give it a Star](https://github.com/ShunsukeHayashi/Miyabi)** to help others discover it
- **[Follow @The_AGI_WAY](https://x.com/The_AGI_WAY)** for updates and AI development insights
- **[Join Discord](https://discord.gg/ZpY9sxfYNm)** to connect with the community
- **[Sponsor](https://github.com/sponsors/ShunsukeHayashi)** to support continued development

---

## License

[Apache 2.0](LICENSE) - Copyright (c) 2025-2026 Shunsuke Hayashi / 合同会社みやび

<div align="center">
<sub>Built with Miyabi Agent Society | Powered by Claude AI</sub>
</div>

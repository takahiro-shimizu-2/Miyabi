<div align="center">

# Miyabi MCP Bundle

**The Ultimate MCP Server for Claude Code & AI CLI Agents**

[![npm version](https://img.shields.io/npm/v/miyabi-mcp-bundle?style=flat-square&logo=npm)](https://www.npmjs.com/package/miyabi-mcp-bundle)
[![npm downloads](https://img.shields.io/npm/dm/miyabi-mcp-bundle?style=flat-square)](https://www.npmjs.com/package/miyabi-mcp-bundle)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

**172+ MCP Tools** | **Enterprise Security** | **Zero Config**

[Installation](#installation) | [Quick Start](#quick-start) | [Tools](#tools) | [Configuration](#configuration)

</div>

---

## Target Users

- **Claude Code** (Anthropic's official CLI)
- **OpenAI Codex CLI**
- AI Agent developers building LLM-powered tools

## Features

- **172+ MCP Tools** across 21 categories
- **Enterprise-grade Security**: Input sanitization, path traversal protection
- **Intelligent Caching**: Built-in LRU cache with TTL support
- **Cross-Platform**: macOS, Linux, Windows support
- **Zero Configuration**: Works instantly out of the box

---

## Installation

```bash
# npm
npm install -g miyabi-mcp-bundle

# Run setup wizard
miyabi-mcp init
```

---

## Quick Start

### Claude Code Configuration

Add to `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "miyabi": {
      "command": "npx",
      "args": ["-y", "miyabi-mcp-bundle"],
      "env": {
        "MIYABI_REPO_PATH": "/path/to/your/repo",
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

### Claude Desktop Configuration

**Config File Locations:**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "miyabi": {
      "command": "npx",
      "args": ["-y", "miyabi-mcp-bundle"],
      "env": {
        "MIYABI_REPO_PATH": "/path/to/your/repo",
        "GITHUB_TOKEN": "ghp_your_token"
      }
    }
  }
}
```

---

## Tools

### Categories (21)

| Category | Tools | Description |
|----------|-------|-------------|
| **Git** | 12 | Repository operations |
| **GitHub** | 15 | Issues, PRs, Labels, Milestones |
| **System** | 8 | CPU, Memory, Disk monitoring |
| **Process** | 8 | Process management |
| **Network** | 8 | Network diagnostics |
| **File** | 6 | File watching & stats |
| **Log** | 6 | Log aggregation |
| **Tmux** | 11 | Session management |
| **Docker** | 12 | Container management |
| **Kubernetes** | 10 | K8s operations |
| **Claude** | 8 | Claude Code integration |
| **Database** | 6 | SQLite, PostgreSQL, MySQL |
| **Time** | 4 | Time utilities |
| **Calculator** | 4 | Math operations |
| **MCP** | 4 | Tool discovery |
| **Health** | 4 | System health checks |

### Example Usage

```
"Show git status"
"List open GitHub issues"
"Check system resources"
"Show Docker containers"
"Search logs for errors"
```

---

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MIYABI_REPO_PATH` | `cwd()` | Git repository path |
| `MIYABI_LOG_DIR` | Same as repo | Log directory |
| `MIYABI_WATCH_DIR` | Same as repo | File watch directory |
| `GITHUB_TOKEN` | - | GitHub Personal Access Token |
| `GITHUB_DEFAULT_OWNER` | - | Default repo owner |
| `GITHUB_DEFAULT_REPO` | - | Default repo name |

### CLI Commands

```bash
miyabi-mcp init     # Setup wizard
miyabi-mcp doctor   # Diagnose issues
miyabi-mcp info     # System information
miyabi-mcp          # Start server
```

---

## Security

- Input sanitization for all user inputs
- Path traversal protection
- Symlink attack prevention
- Command injection prevention
- Secure defaults

---

## Development

```bash
# Clone from monorepo
git clone https://github.com/ShunsukeHayashi/Miyabi.git
cd Miyabi/packages/mcp-bundle

# Install dependencies
pnpm install

# Development
pnpm run dev

# Build
pnpm run build

# Test
pnpm test
```

---

## License

MIT - See [LICENSE](LICENSE)

---

## Links

- [GitHub Repository](https://github.com/ShunsukeHayashi/Miyabi/tree/main/packages/mcp-bundle)
- [npm Package](https://www.npmjs.com/package/miyabi-mcp-bundle)
- [Report Issues](https://github.com/ShunsukeHayashi/Miyabi/issues)

---

<div align="center">

**Part of the [Miyabi Framework](https://github.com/ShunsukeHayashi/Miyabi)**

Made with love by [Shunsuke Hayashi](https://github.com/ShunsukeHayashi)

[@The_AGI_WAY](https://x.com/The_AGI_WAY) | [note.ambitiousai.co.jp](https://note.ambitiousai.co.jp/)

</div>

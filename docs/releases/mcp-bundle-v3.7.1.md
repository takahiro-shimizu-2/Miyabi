# Miyabi MCP Bundle v3.7.1 Release Notes

**Release Date:** 2025-12-19

---

## Highlights

### Dependencies Updated

Major dependency updates for improved stability and compatibility:

| Package | Before | After |
|---------|--------|-------|
| `@modelcontextprotocol/sdk` | 1.0.4 | 1.20.0 |
| `@octokit/rest` | 20.0.2 | 21.1.1 |
| `@typescript-eslint/*` | 6.x | 8.50.0 |
| `vitest` | 1.0.0 | 3.2.4 |
| `@types/node` | 20.x | 22.15.0 |
| `typescript` | 5.3.3 | 5.8.3 |

---

## Installation

```bash
# New installation
npm install -g miyabi-mcp-bundle@3.7.1

# Upgrade
npm update -g miyabi-mcp-bundle
```

---

## Configuration

### Claude Code

```json
{
  "mcpServers": {
    "miyabi": {
      "command": "npx",
      "args": ["-y", "miyabi-mcp-bundle@3.7.1"],
      "env": {
        "MIYABI_REPO_PATH": "/path/to/repo",
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

### Claude Desktop

Add to your Claude Desktop config file:
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/claude/claude_desktop_config.json`

---

## Tool Categories (21)

| Category | Tools | Description |
|----------|-------|-------------|
| Git | 12 | Repository operations |
| GitHub | 15 | Issues, PRs, Labels |
| System | 8 | CPU, Memory, Disk |
| Process | 8 | Process management |
| Network | 8 | Network diagnostics |
| File | 6 | File watching |
| Log | 6 | Log aggregation |
| Tmux | 11 | Session management |
| Docker | 12 | Container management |
| Kubernetes | 10 | K8s operations |
| Claude | 8 | Claude Code integration |
| Database | 6 | SQLite, PostgreSQL, MySQL |
| Time | 4 | Time utilities |
| Calculator | 4 | Math operations |
| MCP | 4 | Tool discovery |
| Health | 4 | System health checks |
| Spec-Kit | 6 | GitHub spec-kit |
| Compose | 4 | Docker Compose |
| Think | 3 | Sequential thinking |
| Generator | 4 | UUID, random, hash |

**Total: 172+ tools**

---

## Breaking Changes

None. This is a dependency-only update.

---

## Links

- **npm:** https://www.npmjs.com/package/miyabi-mcp-bundle
- **GitHub:** https://github.com/ShunsukeHayashi/Miyabi/tree/main/packages/mcp-bundle

# Miyabi Scripts

Utility scripts for Miyabi operations and integrations.

## omega-bridge.ts

**Webhook → Ω-System Bridge**

Bridges GitHub Webhook events to the Miyabi Ω-System engine. Called by OpenClaw's webhook handler during `[auto]` issue processing.

### Usage

```bash
npx tsx scripts/omega-bridge.ts --issue <number> --repo <owner/repo> [options]
```

### Options

| Flag | Description |
|------|-------------|
| `--issue <number>` | GitHub Issue number (required) |
| `--repo <owner/repo>` | Repository full name (required) |
| `--verbose`, `-v` | Enable debug logging to stderr |
| `--dry-run` | Parse issue only, skip Ω execution |
| `--help`, `-h` | Show help |

### Output

JSON to stdout:

```json
{
  "success": true,
  "issue": { "number": 271, "title": "...", "body": "...", ... },
  "intent": { "intentId": "intent-issue-271", "goals": [...], ... },
  "tasks": [
    { "id": "task-271-0", "title": "...", "type": "feature", ... }
  ],
  "omega": {
    "stages": [...],
    "intermediates": { "plan": ..., "taskSet": ..., "allocation": ... }
  },
  "metadata": { "bridge": "omega-bridge", "omegaAvailable": true/false }
}
```

### Architecture

```
GitHub Webhook → OpenClaw Hook Session → omega-bridge.ts
                                              │
                                    ┌─────────┴─────────┐
                                    │                    │
                              Ω-System Available?   Lightweight Mode
                                    │                    │
                              Full pipeline         Body parsing
                              (6 transforms)        (regex-based)
                                    │                    │
                                    └────────┬───────────┘
                                             │
                                        JSON output
                                      (tasks + intent)
```

### Fallback Behavior

1. **Ω-System available** (packages built): Runs full 6-stage pipeline (θ₁→θ₆)
2. **Ω-System unavailable**: Falls back to lightweight body parsing that extracts:
   - Checkbox items (`- [ ]` / `- [x]`)
   - Numbered items (`1.` / `1)`)
   - Bullet items from 要件/Requirements sections
   - Completion criteria as test-type tasks

### Integration with OpenClaw

The omega-bridge is called from OpenClaw's webhook `messageTemplate` during Phase A of the auto-implement sequence:

```
exec("npx tsx .../scripts/omega-bridge.ts --issue {{issue.number}} --repo {{repository.full_name}}")
```

If it fails, the hook session falls back to implementing directly from the issue description.

# Miyabi Next Planning

**Date**: 2025-12-16
**Current Version**: miyabi@0.14.0, miyabi-mcp-bundle@3.6.1

---

## Current State Analysis

### Completed Today
- TUI Dashboard implementation
- Human-in-the-loop approval gates
- Simplified CLI commands (`run`, `fix`, `build`, `ship`)
- Steve Jobs-style UX improvements
- miyabi-mcp-bundle@3.6.1 published to npm

### Open PRs (13)
| Priority | PR | Title | Action |
|----------|-----|-------|--------|
| **HIGH** | #148 | Release v0.15.0 - HeroUIAgent & UIUXAgent | Merge |
| Medium | #206, #167 | Issue number parsing fixes | Review & Merge |
| Low | #199, #198, #163, #162, #161, #160, #159, #132, #129, #126 | Dependabot updates | Batch merge |

### Open Issues (10)
| Priority | Issue | Title | Effort |
|----------|-------|-------|--------|
| **P0** | #216-220 | Ω-System Phase 1-5 | Large |
| **P1** | #222 | Cursor CLI + Linear MCP | Medium |
| **P1** | #221 | Codemaps integration | Medium |
| P0 | #214 | PostgreSQL database layer | Medium |
| - | #207 | Security Audit Report | Review |

---

## Strategic Plan

### Phase 1: Immediate (Today)
**Goal**: Clean up PRs and release new version

1. **Merge PR #148** (v0.15.0)
   - HeroUIAgent & UIUXAgent integration
   - Already reviewed, ready to merge

2. **Release miyabi@0.16.0**
   - Include today's CLI improvements (TUI, HITL, run command)
   - Bump version and publish to npm

3. **Batch merge Dependabot PRs**
   - #199, #198, #163, #162, #161, #160, #159

### Phase 2: This Week
**Goal**: Core infrastructure improvements

1. **Ω-System Phase 1** (Issue #216)
   - miyabi_def integration
   - SWML/Ω-System foundation
   - Est: 30 minutes

2. **Issue Number Parsing** (PR #206, #167)
   - Fix NaN errors with "#" prefix
   - Merge and close related issues

3. **Security Audit Review** (Issue #207)
   - Review findings
   - Create fix issues if needed

### Phase 3: Next Week
**Goal**: Advanced features

1. **Ω-System Phase 2-5** (Issues #217-220)
   - TypeScript types update
   - Execution engine
   - Agent integration
   - Testing & documentation

2. **Integration Features**
   - Cursor CLI + Linear MCP (#222)
   - Codemaps integration (#221)

3. **Database Layer** (Issue #214)
   - PostgreSQL implementation
   - Replace mock data

---

## Release Plan

### v0.16.0 (Today)
```
feat(cli): TUI Dashboard for agent status
feat(cli): Human-in-the-loop approval gates
feat(cli): Simplified commands (run, fix, build, ship)
feat(cli): Character names for agents
```

### v0.17.0 (This Week)
```
feat(omega): Ω-System Phase 1 integration
fix(cli): Issue number parsing with # prefix
chore(deps): Dependency updates
```

### v0.18.0 (Next Week)
```
feat(omega): Ω-System Phase 2-5
feat(integrations): Cursor CLI + Linear MCP
feat(integrations): Codemaps
```

---

## Action Items

### Immediate Actions
- [ ] Merge PR #148 (v0.15.0 release)
- [ ] Bump CLI version to 0.16.0
- [ ] Publish miyabi@0.16.0 to npm
- [ ] Batch merge dependabot PRs

### This Week
- [ ] Implement Ω-System Phase 1 (#216)
- [ ] Merge issue parsing PRs (#206, #167)
- [ ] Review security audit (#207)

### Blockers
- None identified

---

## Metrics

### Package Stats
| Package | Version | Downloads |
|---------|---------|-----------|
| miyabi | 0.14.0 | ~500/week |
| miyabi-mcp-bundle | 3.6.1 | ~100/week |

### Repository Stats
- Stars: Growing
- Open Issues: 10
- Open PRs: 13

---

## Notes

- Steve Jobs evaluation implemented successfully
- Focus on simplicity and user experience
- Maintain backward compatibility
- Continue AI-first design philosophy

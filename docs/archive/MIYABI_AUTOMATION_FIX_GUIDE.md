# Miyabi Automation Fix Guide

**Issue #156 Resolution**: Fix for Miyabi automation not working in thanka project

## Root Causes Identified

### 1. @miyabi Mention Detection Missing
**Problem**: The `autonomous-agent.yml` workflow only checked for `/agent` commands, not `@miyabi` mentions.

**Solution**: Updated workflow to support both `/agent` and `@miyabi` triggers.

**Changed in**: `/packages/cli/templates/workflows/autonomous-agent.yml:53`

```diff
- if echo "$COMMENT" | grep -q "^/agent"; then
+ if echo "$COMMENT" | grep -Eq "^/agent|@miyabi"; then
```

### 2. Workflows Not Deployed to GitHub
**Problem**: Workflow files must be pushed to GitHub via the GitHub API, not just exist locally.

**Solution**: Run `npx miyabi install` in the target repository to deploy workflows.

**How it works**: The `deployWorkflows()` function in `/packages/cli/src/setup/workflows.ts` uses the GitHub API to create/update files in `.github/workflows/` directory.

## Fix Instructions

### Step 1: Update Miyabi CLI Package

```bash
# Navigate to miyabi-public repository
cd /Users/a003/dev/miyabi-public

# Build the updated CLI
cd packages/cli
npm run build

# Update version (if needed)
npm version patch

# Publish to npm (or use locally)
npm publish
# OR for local testing: npm link
```

### Step 2: Clone or Navigate to Target Repository

```bash
# If thanka repository doesn't exist locally
git clone https://github.com/thanka392/thanka.git
cd thanka

# OR if it exists but you don't have access
# Contact the repository owner to run these steps
```

### Step 3: Install/Reinstall Miyabi

```bash
# Set GitHub token (required)
export GITHUB_TOKEN=ghp_xxxxx  # Replace with your token

# Run miyabi install (non-interactive mode)
npx miyabi@latest install --yes --non-interactive

# OR if using local version
npx /Users/a003/dev/miyabi-public/packages/cli install --yes --non-interactive
```

This will:
- ✅ Authenticate with GitHub
- ✅ Deploy all 14 workflow files to `.github/workflows/`
- ✅ Create/update 53 labels
- ✅ Setup Projects V2 integration
- ✅ Create Claude Code configuration

### Step 4: Verify Workflows Are Deployed

```bash
# Check workflows via GitHub CLI
gh workflow list

# Expected output should include:
# Autonomous Agent Execution  active  autonomous-agent.yml
# Issue Opened - Auto Label   active  issue-opened.yml
# ... (12+ more workflows)
```

### Step 5: Test @miyabi Mentions

```bash
# Create a test issue
gh issue create --title "Test @miyabi automation" --body "Testing mention detection"

# Add a comment with @miyabi mention
gh issue comment <issue-number> --body "@miyabi please implement this feature"

# Check if workflow was triggered
gh run list --workflow autonomous-agent.yml --limit 1
```

## Required GitHub Token Permissions

The `GITHUB_TOKEN` must have the following scopes:

- ✅ `repo` (Full control of private repositories)
- ✅ `workflow` (Update GitHub Action workflows)
- ✅ `admin:org` (Full control of orgs and teams) - for label management

Generate token at: https://github.com/settings/tokens

## Troubleshooting

### Workflow Still Not Appearing

**Check 1**: Verify workflows were actually deployed
```bash
# List files in .github/workflows/ on GitHub
gh api repos/thanka392/thanka/contents/.github/workflows

# Should return list of YAML files including autonomous-agent.yml
```

**Check 2**: Verify workflow file is valid YAML
```bash
# Download workflow file
gh api repos/thanka392/thanka/contents/.github/workflows/autonomous-agent.yml \
  --jq '.content' | base64 -d > check-workflow.yml

# Validate YAML syntax
yamllint check-workflow.yml
# OR
python3 -c "import yaml; yaml.safe_load(open('check-workflow.yml'))"
```

**Check 3**: Check GitHub Actions is enabled
- Navigate to: `https://github.com/thanka392/thanka/settings/actions`
- Ensure "Allow all actions and reusable workflows" is selected

### @miyabi Mentions Not Triggering

**Check 1**: Verify workflow has `issue_comment` trigger
```yaml
on:
  issue_comment:
    types: [created]
```

**Check 2**: Check workflow run history
```bash
# View recent workflow runs
gh run list --workflow autonomous-agent.yml --limit 10

# View specific run details
gh run view <run-id> --log
```

**Check 3**: Verify required secrets are set
```bash
# Check if ANTHROPIC_API_KEY is set
gh secret list

# If missing, add it
gh secret set ANTHROPIC_API_KEY --body "sk-ant-xxxxx"
```

### Manual Workflow Execution

```bash
# Trigger workflow manually for testing
gh workflow run autonomous-agent.yml --field issue_number=<issue-number>

# Check execution status
gh run list --workflow autonomous-agent.yml --limit 1
gh run view <run-id> --log
```

## Expected Behavior After Fix

### 1. Workflow Appears in List
```bash
$ gh workflow list
# Output includes:
Autonomous Agent Execution  active  autonomous-agent.yml
```

### 2. @miyabi Mention Triggers Workflow
```
User comments: "@miyabi please implement this"
  ↓
GitHub Actions: autonomous-agent.yml triggered
  ↓
CoordinatorAgent: Analyzes issue, creates tasks
  ↓
CodeGenAgent: Generates code
  ↓
ReviewAgent: Reviews code (80+ score)
  ↓
PRAgent: Creates Pull Request
```

### 3. Manual Execution Works
```bash
$ npx miyabi agent run codegen --issue 10
# Successfully executes because CLI works directly
```

## Additional Configuration

### Enable Workflow Notifications

Add to `.github/workflows/autonomous-agent.yml` (optional):

```yaml
# Add notification step at the end
- name: Notify on Slack/Discord
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    text: 'Miyabi Agent execution for issue #${{ needs.check-trigger.outputs.issue_number }}'
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Adjust Concurrency Limits

Edit `autonomous-agent.yml:111`:

```yaml
# For low-resource repositories
--concurrency 1

# For high-resource repositories
--concurrency 5
```

## Testing Checklist

- [ ] `npx miyabi install` completes successfully
- [ ] `gh workflow list` shows `autonomous-agent.yml`
- [ ] Create test issue and comment with `@miyabi`
- [ ] Check `gh run list` shows workflow execution
- [ ] Verify workflow creates PR after execution
- [ ] Check workflow logs for errors: `gh run view <run-id> --log`
- [ ] Verify `ANTHROPIC_API_KEY` secret is set
- [ ] Test manual execution: `npx miyabi agent run codegen --issue <N>`

## Reference Files

- **Workflow Template**: `/packages/cli/templates/workflows/autonomous-agent.yml`
- **Install Command**: `/packages/cli/src/commands/install.ts`
- **Deploy Function**: `/packages/cli/src/setup/workflows.ts`
- **Issue**: https://github.com/ShunsukeHayashi/Miyabi/issues/156

## Support

If issues persist after following this guide:

1. Check GitHub Actions logs: `gh run view <run-id> --log`
2. Verify token permissions: https://github.com/settings/tokens
3. Open issue at: https://github.com/ShunsukeHayashi/Miyabi/issues
4. Include workflow run ID and error logs

---

**Last Updated**: 2025-10-21
**Fix Version**: Miyabi CLI v0.13.1+
**Issue**: #156

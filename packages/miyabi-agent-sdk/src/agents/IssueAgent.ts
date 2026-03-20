/**
 * IssueAgent - Issue分析 Agent
 *
 * 3モード実行:
 * 1. ClaudeCodeClient (claude -p) — $0 ローカル実行
 * 2. AnthropicClient (API直接)  — 有料
 * 3. Mock (キーワードベース)     — フォールバック
 */
import { AnthropicClient } from "../clients/AnthropicClient.js";
import { ClaudeCodeClient } from "../clients/ClaudeCodeClient.js";
import { GitHubClient } from "../clients/GitHubClient.js";

export interface IssueInput {
  issueNumber: number;
  owner: string;
  repository: string;
  useRealAPI?: boolean;
  anthropicClient?: AnthropicClient;
  claudeCodeClient?: ClaudeCodeClient;
  githubClient?: GitHubClient;
}

export interface IssueOutput {
  success: boolean;
  data?: {
    number: number;
    title: string;
    body: string | null;
    labels: string[];
    complexity: string;
    priority: string;
    type: string;
    tokensUsed?: { input: number; output: number };
    cost?: number;
  };
  error?: string;
}

interface IssueAgentConfig {
  githubToken?: string;
  anthropicApiKey?: string;
  useClaudeCode?: boolean;
}

export class IssueAgent {
  private anthropicClient?: AnthropicClient;
  private claudeCodeClient?: ClaudeCodeClient;
  private githubClient?: GitHubClient;

  constructor(config?: IssueAgentConfig) {
    if (config) {
      if (config.useClaudeCode) {
        this.claudeCodeClient = new ClaudeCodeClient();
      } else if (config.anthropicApiKey) {
        this.anthropicClient = new AnthropicClient(config.anthropicApiKey);
      }
      if (config.githubToken) {
        this.githubClient = new GitHubClient(config.githubToken);
      }
    }
  }

  async analyze(input: IssueInput): Promise<IssueOutput> {
    try {
      const githubClient = input.githubClient || this.githubClient;
      const anthropicClient = input.anthropicClient || this.anthropicClient;
      const claudeCodeClient = input.claudeCodeClient || this.claudeCodeClient;
      const useRealAPI =
        input.useRealAPI !== false &&
        !!(githubClient || anthropicClient || claudeCodeClient);

      // 1. Issue取得
      const issue = await this.fetchIssue(input, githubClient);

      // 2. Claude分析
      const analysis = await this.analyzeWithClaude(
        { ...issue, number: issue.number },
        anthropicClient,
        claudeCodeClient,
        useRealAPI
      );

      // 3. ラベル付与
      if (useRealAPI && githubClient) {
        await this.applyLabels(input, analysis.labels, githubClient);
      }

      return {
        success: true,
        data: {
          number: issue.number,
          title: issue.title,
          body: issue.body,
          labels: analysis.labels,
          complexity: analysis.complexity,
          priority: analysis.priority,
          type: analysis.type,
          tokensUsed: analysis.tokensUsed,
          cost: analysis.cost,
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async fetchIssue(
    input: IssueInput,
    githubClient?: GitHubClient
  ): Promise<{ number: number; title: string; body: string | null }> {
    if (githubClient) {
      const issue = await githubClient.getIssue(
        input.owner,
        input.repository,
        input.issueNumber
      );
      return {
        number: issue.number,
        title: issue.title,
        body: issue.body,
      };
    }
    return {
      number: input.issueNumber,
      title: `Mock Issue #${input.issueNumber}`,
      body: "Mock issue body for testing",
    };
  }

  private async analyzeWithClaude(
    issue: { title: string; body: string | null; number: number },
    anthropicClient?: AnthropicClient,
    claudeCodeClient?: ClaudeCodeClient,
    useRealAPI?: boolean
  ): Promise<{
    labels: string[];
    complexity: string;
    priority: string;
    type: string;
    tokensUsed?: { input: number; output: number };
    cost?: number;
  }> {
    if (useRealAPI && claudeCodeClient) {
      const result = await claudeCodeClient.analyzeIssue({
        title: issue.title,
        body: issue.body || "",
        number: issue.number || 0,
      });
      return {
        labels: result.labels,
        complexity: result.complexity,
        priority: result.priority,
        type: result.type,
        tokensUsed: { input: 0, output: 0 },
        cost: 0,
      };
    }

    if (useRealAPI && anthropicClient) {
      const result = await anthropicClient.analyzeIssue(
        issue.title,
        issue.body || ""
      );
      const cost = anthropicClient.calculateCost(result.tokensUsed);
      return {
        labels: result.labels,
        complexity: result.complexity,
        priority: result.priority,
        type: result.type,
        tokensUsed: result.tokensUsed,
        cost,
      };
    }

    // Mock: キーワードベース分析
    const analysis = this.keywordBasedAnalysis(issue);
    return { ...analysis, tokensUsed: undefined, cost: undefined };
  }

  private keywordBasedAnalysis(issue: {
    title: string;
    body: string | null;
  }): {
    labels: string[];
    complexity: string;
    priority: string;
    type: string;
  } {
    const text = `${issue.title} ${issue.body || ""}`.toLowerCase();

    let type = "feature";
    if (text.includes("bug") || text.includes("error") || text.includes("fix"))
      type = "bug";
    else if (text.includes("refactor") || text.includes("cleanup"))
      type = "refactor";
    else if (text.includes("docs") || text.includes("documentation"))
      type = "docs";
    else if (text.includes("test")) type = "test";
    else if (
      text.includes("chore") ||
      text.includes("deps") ||
      text.includes("dependency")
    )
      type = "chore";

    let priority = "P2";
    if (
      text.includes("critical") ||
      text.includes("urgent") ||
      text.includes("security")
    )
      priority = "P0";
    else if (text.includes("high") || text.includes("important"))
      priority = "P1";
    else if (text.includes("low") || text.includes("nice-to-have"))
      priority = "P3";

    let complexity = "medium";
    if (
      text.includes("simple") ||
      text.includes("quick") ||
      text.includes("typo")
    )
      complexity = "small";
    else if (
      text.includes("large") ||
      text.includes("major") ||
      text.includes("refactor")
    )
      complexity = "large";
    else if (
      text.includes("rewrite") ||
      text.includes("migration") ||
      text.includes("breaking")
    )
      complexity = "xlarge";

    const priorityLabel: Record<string, string> = {
      P0: "Critical",
      P1: "High",
      P2: "Medium",
      P3: "Low",
    };
    const labels = [
      `type:${type}`,
      `priority:${priority}-${priorityLabel[priority]}`,
      `complexity:${complexity}`,
    ];

    if (text.includes("rust")) labels.push("tech:rust");
    if (text.includes("typescript") || text.includes("ts"))
      labels.push("tech:typescript");
    if (text.includes("python") || text.includes("py"))
      labels.push("tech:python");
    if (text.includes("cli")) labels.push("area:cli");
    if (text.includes("mcp")) labels.push("area:mcp");
    if (text.includes("sdk")) labels.push("area:sdk");

    return { labels, complexity, priority, type };
  }

  private async applyLabels(
    input: IssueInput,
    labels: string[],
    githubClient: GitHubClient
  ): Promise<void> {
    await githubClient.addLabels(
      input.owner,
      input.repository,
      input.issueNumber,
      labels
    );
  }
}

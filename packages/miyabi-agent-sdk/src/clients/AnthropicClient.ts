/**
 * AnthropicClient - Claude Sonnet 4 API ラッパー
 *
 * Anthropic SDK を直接使用した有料 API 呼び出し。
 * ClaudeCodeClient が使えない環境（CI/CD、cron等）で使用する。
 */
import Anthropic from "@anthropic-ai/sdk";

export class AnthropicClient {
  private client: Anthropic;
  private model = "claude-sonnet-4-20250514";

  constructor(apiKey?: string) {
    const key = apiKey || process.env.ANTHROPIC_API_KEY;
    if (!key) {
      throw new Error(
        "ANTHROPIC_API_KEY is required. Set it as environment variable or pass to constructor."
      );
    }
    this.client = new Anthropic({ apiKey: key });
  }

  /**
   * GitHub Issue を Claude Sonnet 4 で分析
   */
  async analyzeIssue(
    title: string,
    body: string
  ): Promise<{
    type: string;
    complexity: string;
    priority: string;
    labels: string[];
    tokensUsed: { input: number; output: number };
  }> {
    const prompt = this.buildIssueAnalysisPrompt(title, body);
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude API");
    }

    const result = this.parseJSON(content.text);
    return {
      ...result,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Claude Sonnet 4 でコード生成
   */
  async generateCode(
    requirements: string,
    context: string,
    language = "typescript"
  ): Promise<{
    files: Array<{
      path: string;
      content: string;
      action: "create" | "modify" | "delete";
    }>;
    tests: Array<{
      path: string;
      content: string;
      action: "create" | "modify" | "delete";
    }>;
    qualityScore: number;
    tokensUsed: { input: number; output: number };
  }> {
    const prompt = this.buildCodeGenPrompt(requirements, context, language);
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 32768,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude API");
    }

    const result = this.parseJSON(content.text);
    return {
      ...result,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * Claude Sonnet 4 でコードレビュー
   */
  async reviewCode(
    files: Array<{ path: string; content: string }>,
    standards?: { minQualityScore: number; requireTests: boolean; securityScan: boolean }
  ): Promise<{
    qualityScore: number;
    passed: boolean;
    issues: Array<{
      severity: string;
      file: string;
      line?: number;
      message: string;
    }>;
    suggestions: string[];
    tokensUsed: { input: number; output: number };
  }> {
    const prompt = this.buildReviewPrompt(files, standards);
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude API");
    }

    const result = this.parseJSON(content.text);
    return {
      ...result,
      tokensUsed: {
        input: response.usage.input_tokens,
        output: response.usage.output_tokens,
      },
    };
  }

  /**
   * API コスト計算 (USD)
   *
   * Claude Sonnet 4 pricing:
   * - Input: $3 / 1M tokens
   * - Output: $15 / 1M tokens
   */
  calculateCost(tokensUsed: { input: number; output: number }): number {
    const inputCost = (tokensUsed.input / 1_000_000) * 3.0;
    const outputCost = (tokensUsed.output / 1_000_000) * 15.0;
    return inputCost + outputCost;
  }

  private buildIssueAnalysisPrompt(title: string, body: string): string {
    return `以下のGitHub Issueを解析し、適切なラベル、複雑度、優先度、種類を判定してください。

# Issue情報
Title: ${title}
Body: ${body || "(本文なし)"}

# 出力形式（JSON）
{
  "labels": ["type:bug", "priority:P1-High", "complexity:medium"],
  "complexity": "small|medium|large|xlarge",
  "priority": "P0|P1|P2|P3",
  "type": "bug|feature|refactor|docs|test|chore",
  "reasoning": "判定理由を簡潔に説明"
}

**重要**: 必ずJSON形式で回答してください。JSON以外のテキストは含めないでください。`;
  }

  private buildCodeGenPrompt(
    requirements: string,
    context: string,
    language: string
  ): string {
    return `以下の要件に基づいて、${language}のコードを生成してください。

# 要件
${requirements}

# コンテキスト（既存コード・関連ファイル）
${context}

# 出力形式（JSON）
{
  "files": [
    {
      "path": "src/example.ts",
      "content": "// コード内容（完全なコード）",
      "action": "create|modify|delete"
    }
  ],
  "tests": [
    {
      "path": "src/example.test.ts",
      "content": "// テストコード",
      "action": "create|modify|delete"
    }
  ],
  "qualityScore": 85
}

**重要**: 必ずJSON形式で回答してください。JSON以外のテキストは含めないでください。`;
  }

  private buildReviewPrompt(
    files: Array<{ path: string; content: string }>,
    standards?: { minQualityScore: number; requireTests: boolean; securityScan: boolean }
  ): string {
    const filesContent = files
      .map((f) => `## ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    return `以下のコードをレビューしてください。

# コード
${filesContent}

# 品質基準
- 最低品質スコア: ${standards?.minQualityScore ?? 80}
- テスト必須: ${standards?.requireTests !== false ? "はい" : "いいえ"}
- セキュリティスキャン: ${standards?.securityScan !== false ? "はい" : "いいえ"}

# 出力形式（JSON）
{
  "qualityScore": 85,
  "passed": true,
  "issues": [
    {
      "severity": "error|warning|info",
      "file": "src/example.ts",
      "line": 42,
      "message": "問題の詳細説明"
    }
  ],
  "suggestions": ["改善提案1", "改善提案2"]
}

**重要**: 必ずJSON形式で回答してください。JSON以外のテキストは含めないでください。`;
  }

  private parseJSON(text: string): any {
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1].trim()); } catch { /* next */ }
    }

    jsonMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1].trim()); } catch { /* next */ }
    }

    jsonMatch = text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try { return JSON.parse(jsonMatch[1].trim()); } catch { /* next */ }
    }

    try {
      return JSON.parse(text.trim());
    } catch (error) {
      throw new Error(
        `Failed to parse Claude response as JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

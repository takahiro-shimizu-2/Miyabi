/**
 * Claude Code Client
 *
 * Claude Code CLI を使用したローカル実行クライアント。
 * Anthropic API を直接呼ばず、サブスク内で $0 で動作する。
 *
 * 修正履歴:
 * - Issue #320: codex exec → claude -p に修正
 */
import { spawn } from "child_process";

export interface ClaudeCodeResponse {
  content: string;
  tokensUsed?: {
    input: number;
    output: number;
  };
  cost?: number;
}

export class ClaudeCodeClient {
  private claudeCommand: string;

  constructor(claudeCommand = "claude") {
    this.claudeCommand = claudeCommand;
  }

  /**
   * Claude Code CLI でプロンプトを実行
   *
   * `claude -p "prompt"` で非対話的に実行し、stdout を返す。
   * shell: false でシェルインジェクションを防止。
   */
  async executePrompt(
    prompt: string,
    options?: { timeout?: number; workingDir?: string }
  ): Promise<ClaudeCodeResponse> {
    return new Promise((resolve, reject) => {
      // claude -p でプロンプトを stdin から渡す（--print mode）
      const args = ["-p", prompt];
      const proc = spawn(this.claudeCommand, args, {
        cwd: options?.workingDir || process.cwd(),
        shell: false, // セキュリティ: shell injection 防止
      });

      let stdout = "";
      let stderr = "";

      proc.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });

      proc.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });

      const timeoutId = options?.timeout
        ? setTimeout(() => {
            proc.kill();
            reject(
              new Error(
                `Claude Code execution timed out after ${options.timeout}ms`
              )
            );
          }, options.timeout)
        : null;

      proc.on("close", (code: number | null) => {
        if (timeoutId) clearTimeout(timeoutId);

        if (code === 0) {
          resolve({
            content: stdout.trim(),
            tokensUsed: {
              input: Math.floor(prompt.length / 4),
              output: Math.floor(stdout.length / 4),
            },
            cost: 0, // サブスク内なので無料
          });
        } else {
          reject(
            new Error(
              `Claude Code failed with exit code ${code}\nStderr: ${stderr}`
            )
          );
        }
      });

      proc.on("error", (error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(new Error(`Failed to spawn Claude Code: ${error.message}`));
      });
    });
  }

  /**
   * GitHub Issue を分析
   */
  async analyzeIssue(issueData: {
    title: string;
    body: string;
    number: number;
  }): Promise<{
    type: string;
    complexity: string;
    priority: string;
    relatedFiles: string[];
    labels: string[];
  }> {
    const prompt = `Analyze this GitHub issue and return ONLY a JSON object (no markdown code blocks):

Issue #${issueData.number}: ${issueData.title}

${issueData.body}

Return JSON format:
{
  "type": "bug|feature|refactor|docs|test",
  "complexity": "small|medium|large|xlarge",
  "priority": "P0|P1|P2|P3",
  "relatedFiles": ["file1.ts", "file2.ts"],
  "labels": ["type:bug", "priority:P2-Medium"]
}`;

    const response = await this.executePrompt(prompt, { timeout: 60000 });
    return this.parseJSON(response.content);
  }

  /**
   * コードを生成
   */
  async generateCode(requirements: {
    taskId: string;
    requirements: string;
    context: string;
    language: string;
  }): Promise<{
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
  }> {
    const prompt = `Generate code for this task. Return ONLY a JSON object (no markdown code blocks):

Task: ${requirements.requirements}

Context: ${requirements.context}

Language: ${requirements.language}

Return JSON format:
{
  "files": [
    {
      "path": "src/example.ts",
      "content": "...",
      "action": "create"
    }
  ],
  "tests": [
    {
      "path": "src/example.test.ts",
      "content": "...",
      "action": "create"
    }
  ],
  "qualityScore": 95
}`;

    const response = await this.executePrompt(prompt, { timeout: 120000 });
    return this.parseJSON(response.content);
  }

  /**
   * コードをレビュー
   */
  async reviewCode(
    files: Array<{ path: string; content: string }>
  ): Promise<{
    qualityScore: number;
    passed: boolean;
    issues: Array<{
      severity: string;
      message: string;
      file?: string;
      line?: number;
    }>;
    suggestions: string[];
  }> {
    const filesStr = files
      .map((f) => `File: ${f.path}\n\`\`\`\n${f.content}\n\`\`\``)
      .join("\n\n");

    const prompt = `Review this code and return ONLY a JSON object (no markdown code blocks):

${filesStr}

Return JSON format:
{
  "qualityScore": 85,
  "passed": true,
  "issues": [
    {
      "severity": "warning",
      "message": "Consider adding error handling",
      "file": "src/example.ts",
      "line": 42
    }
  ],
  "suggestions": ["Add more test cases", "Improve documentation"]
}`;

    const response = await this.executePrompt(prompt, { timeout: 90000 });
    return this.parseJSON(response.content);
  }

  /**
   * JSON パース（複数パターン対応）
   */
  private parseJSON(text: string): any {
    // Pattern 1: ```json ... ```
    let jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // next
      }
    }

    // Pattern 2: ``` ... ```
    jsonMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // next
      }
    }

    // Pattern 3: { ... }
    jsonMatch = text.match(/(\{[\s\S]*\})/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // next
      }
    }

    // Pattern 4: raw text
    try {
      return JSON.parse(text.trim());
    } catch (error) {
      throw new Error(
        `Failed to parse Claude response as JSON: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}

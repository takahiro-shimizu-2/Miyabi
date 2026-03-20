/**
 * TestAgent - テスト実行 Agent
 *
 * テストコマンド実行 → カバレッジ計測 → 失敗レポート生成
 */

export interface TestInput {
  repository: string;
  branch: string;
  language?: string;
  testCommand?: string;
}

export interface TestOutput {
  success: boolean;
  data?: {
    success: boolean;
    coverage: number;
    duration: number;
    failures: Array<{
      testName: string;
      error: string;
      file?: string;
      line?: number;
    }>;
    totalTests: number;
    passedTests: number;
    failedTests: number;
  };
  error?: string;
}

export class TestAgent {
  private coverageThreshold = 80;
  private timeoutThreshold = 300000; // 5分

  async run(input: TestInput): Promise<TestOutput> {
    try {
      const startTime = Date.now();

      // 1. テストコマンド決定
      const testCommand = this.resolveTestCommand(
        input.testCommand,
        input.language || "typescript"
      );

      // 2. テスト実行
      const testResult = await this.executeTests(
        input.repository,
        input.branch,
        testCommand
      );

      // 3. カバレッジ計測
      const coverage = await this.measureCoverage(
        input.repository,
        input.branch,
        input.language || "typescript"
      );

      // 4. 実行時間計算
      const duration = Date.now() - startTime;

      // 5. タイムアウトチェック
      if (duration > this.timeoutThreshold) {
        console.warn(
          `[TestAgent] Tests took ${duration}ms, exceeding threshold of ${this.timeoutThreshold}ms`
        );
      }

      // 6. カバレッジ閾値チェック
      const coverageMet = coverage >= this.coverageThreshold;

      return {
        success: true,
        data: {
          success: testResult.success && coverageMet,
          coverage,
          duration,
          failures: testResult.failures,
          totalTests: testResult.totalTests,
          passedTests: testResult.passedTests,
          failedTests: testResult.failedTests,
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

  private resolveTestCommand(
    customCommand?: string,
    language = "typescript"
  ): string {
    if (customCommand) return customCommand;
    const defaultCommands: Record<string, string> = {
      typescript: "pnpm test",
      rust: "cargo test",
      python: "pytest",
      go: "go test ./...",
    };
    return defaultCommands[language] || "pnpm test";
  }

  private async executeTests(
    _repository: string,
    _branch: string,
    _testCommand: string
  ): Promise<{
    success: boolean;
    totalTests: number;
    passedTests: number;
    failedTests: number;
    failures: Array<{
      testName: string;
      error: string;
      file?: string;
      line?: number;
    }>;
  }> {
    // Mock implementation
    // TODO: child_process.exec() でテスト実行
    const totalTests = 50;
    const failedTests = Math.random() > 0.8 ? Math.floor(Math.random() * 5) : 0;
    const passedTests = totalTests - failedTests;
    const failures: Array<{
      testName: string;
      error: string;
      file?: string;
      line?: number;
    }> = [];

    for (let i = 0; i < failedTests; i++) {
      failures.push({
        testName: `test-${i + 1}`,
        error: "Mock error: Test failed with assertion error",
        file: `src/test-${i + 1}.test.ts`,
        line: Math.floor(Math.random() * 100) + 1,
      });
    }

    return { success: failedTests === 0, totalTests, passedTests, failedTests, failures };
  }

  private async measureCoverage(
    _repository: string,
    _branch: string,
    _language: string
  ): Promise<number> {
    // Mock implementation
    // TODO: vitest --coverage / cargo tarpaulin で実測
    return 85;
  }

  generateSummaryReport(result: TestOutput["data"]): string {
    if (!result) return "No test results available";
    const successRate = (result.passedTests / result.totalTests) * 100;
    const coverageStatus =
      result.coverage >= this.coverageThreshold ? "PASSED" : "BELOW THRESHOLD";
    const failureReport =
      result.failures.length === 0
        ? "All tests passed!"
        : result.failures
            .map(
              (f, i) =>
                `${i + 1}. ${f.testName} - ${f.file || "unknown"}${f.line ? `:${f.line}` : ""}: ${f.error}`
            )
            .join("\n");

    return `# Test Summary
- Total Tests: ${result.totalTests}
- Passed: ${result.passedTests} (${successRate.toFixed(1)}%)
- Failed: ${result.failedTests}
- Duration: ${(result.duration / 1000).toFixed(2)}s
- Coverage: ${result.coverage.toFixed(1)}% (${coverageStatus})
- Success: ${result.success ? "YES" : "NO"}

${failureReport}`;
  }
}

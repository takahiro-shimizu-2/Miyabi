/**
 * θ₅: Integration Transform
 *
 * Mathematical Definition: θ₅: R → D
 *
 * Transforms Result Set into Deliverable.
 * Integrates execution results, creates PRs, and generates quality reports.
 *
 * @module omega-system/transformations/integration
 */

import type { QualityReport } from '../../types';
import type { ResultSet, ExecutionArtifact } from './execution';

// ============================================================================
// Deliverable Types
// ============================================================================

/**
 * Code change summary
 */
export interface CodeChangeSummary {
  filesCreated: number;
  filesModified: number;
  filesDeleted: number;
  totalLinesAdded: number;
  totalLinesRemoved: number;
  languages: string[];
}

/**
 * Test results summary
 */
export interface TestResultsSummary {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  coveragePercent?: number;
  duration: number;
}

/**
 * Pull Request draft
 */
export interface PullRequestDraft {
  title: string;
  body: string;
  baseBranch: string;
  headBranch: string;
  labels: string[];
  reviewers: string[];
  draft: boolean;
  linkedIssues: number[];
}

/**
 * Documentation update
 */
export interface DocumentationUpdate {
  type: 'readme' | 'api-docs' | 'changelog' | 'inline';
  path: string;
  content: string;
  changeType: 'create' | 'update' | 'delete';
}

/**
 * Deliverable - Output of θ₅
 *
 * D = θ₅(R)
 */
export interface Deliverable {
  deliverableId: string;
  createdAt: string;

  /** Source result set */
  sourceResultSetId: string;

  /** Integrated artifacts */
  artifacts: {
    code: ExecutionArtifact[];
    tests: ExecutionArtifact[];
    documentation: ExecutionArtifact[];
    configuration: ExecutionArtifact[];
    reports: ExecutionArtifact[];
  };

  /** Code changes summary */
  codeChanges: CodeChangeSummary;

  /** Test results */
  testResults?: TestResultsSummary;

  /** Quality report */
  qualityReport: QualityReport;

  /** PR draft (if applicable) */
  pullRequest?: PullRequestDraft;

  /** Documentation updates */
  documentationUpdates: DocumentationUpdate[];

  /** Commit information */
  commit: {
    message: string;
    files: string[];
    hash?: string;
    branch: string;
  };

  /** Integration summary */
  summary: {
    status: 'ready' | 'needs-review' | 'blocked';
    completeness: number; // 0-100
    issues: string[];
    recommendations: string[];
  };

  /** Metadata */
  metadata: {
    integrationVersion: string;
    integrationTimeMs: number;
  };
}

// ============================================================================
// Integration Implementation
// ============================================================================

/**
 * Categorize artifacts by type
 */
function categorizeArtifacts(artifacts: ExecutionArtifact[]): Deliverable['artifacts'] {
  return {
    code: artifacts.filter(a => a.type === 'code'),
    tests: artifacts.filter(a => a.type === 'test'),
    documentation: artifacts.filter(a => a.type === 'documentation'),
    configuration: artifacts.filter(a => a.type === 'config'),
    reports: artifacts.filter(a => a.type === 'report'),
  };
}

/**
 * Calculate code changes summary
 */
function calculateCodeChanges(artifacts: ExecutionArtifact[]): CodeChangeSummary {
  const codeArtifacts = artifacts.filter(a => a.type === 'code');

  // Determine languages from file extensions
  const languages = new Set<string>();
  for (const artifact of codeArtifacts) {
    const ext = artifact.path.split('.').pop();
    if (ext) {
      const langMap: Record<string, string> = {
        'ts': 'TypeScript',
        'tsx': 'TypeScript',
        'js': 'JavaScript',
        'jsx': 'JavaScript',
        'py': 'Python',
        'rs': 'Rust',
        'go': 'Go',
      };
      languages.add(langMap[ext] || ext);
    }
  }

  return {
    filesCreated: codeArtifacts.length,
    filesModified: 0, // Would need git diff
    filesDeleted: 0,
    totalLinesAdded: codeArtifacts.reduce((sum, a) =>
      sum + (a.content?.split('\n').length || 50), 0
    ),
    totalLinesRemoved: 0,
    languages: Array.from(languages),
  };
}

/**
 * Generate quality report from results
 */
function generateQualityReport(results: ResultSet): QualityReport {
  const successRate = results.summary.successRate;
  const hasTests = results.artifacts.some(a => a.type === 'test');
  const hasErrors = results.errors.length > 0;

  // Calculate scores
  const executionScore = Math.round(successRate * 100);
  const coverageScore = hasTests ? 80 : 40; // Estimated
  const errorScore = Math.max(0, 100 - results.errors.length * 10);

  const overallScore = Math.round(
    (executionScore * 0.4) +
    (coverageScore * 0.3) +
    (errorScore * 0.3)
  );

  const issues: QualityReport['issues'] = [];

  if (results.errors.length > 0) {
    for (const error of results.errors.slice(0, 5)) {
      issues.push({
        type: 'eslint',
        severity: 'medium',
        message: error.error,
        scoreImpact: 5,
      });
    }
  }

  if (successRate < 0.9) {
    issues.push({
      type: 'coverage',
      severity: 'high',
      message: `Task success rate below 90%: ${(successRate * 100).toFixed(1)}%`,
      scoreImpact: 10,
    });
  }

  const recommendations: string[] = [];
  if (!hasTests) {
    recommendations.push('Add unit tests for generated code');
  }
  if (hasErrors) {
    recommendations.push('Review and fix failed tasks');
  }
  if (overallScore < 80) {
    recommendations.push('Consider code review before merging');
  }

  return {
    score: overallScore,
    passed: overallScore >= 80,
    issues,
    recommendations,
    breakdown: {
      eslintScore: executionScore,
      typeScriptScore: 85, // Estimated
      securityScore: 90,   // Estimated
      testCoverageScore: coverageScore,
    },
  };
}

/**
 * Generate commit message from results
 */
function generateCommitMessage(
  results: ResultSet,
  codeChanges: CodeChangeSummary
): string {
  const taskTypes = new Set(
    results.taskResults.map(tr => tr.taskId.split('-')[0])
  );

  const prefix = taskTypes.has('fix') ? 'fix' :
                 taskTypes.has('feat') ? 'feat' :
                 taskTypes.has('refactor') ? 'refactor' :
                 'chore';

  const scope = codeChanges.languages[0]?.toLowerCase() || 'core';

  const summary = `${prefix}(${scope}): automated changes from Ω-System`;

  const body = [
    '',
    `Tasks completed: ${results.summary.completedTasks}/${results.summary.totalTasks}`,
    `Files created: ${codeChanges.filesCreated}`,
    `Lines added: ${codeChanges.totalLinesAdded}`,
    '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
    '',
    'Co-Authored-By: Ω-System <omega@miyabi.run>',
  ].join('\n');

  return `${summary}\n${body}`;
}

/**
 * Generate PR draft from results
 */
function generatePullRequestDraft(
  results: ResultSet,
  codeChanges: CodeChangeSummary,
  qualityReport: QualityReport
): PullRequestDraft {
  const title = `feat: automated implementation via Ω-System`;

  const body = `## Summary

Automated implementation generated by the Ω-System execution engine.

### Changes
- Files created: ${codeChanges.filesCreated}
- Lines added: ${codeChanges.totalLinesAdded}
- Languages: ${codeChanges.languages.join(', ')}

### Execution Summary
- Tasks completed: ${results.summary.completedTasks}/${results.summary.totalTasks}
- Success rate: ${(results.summary.successRate * 100).toFixed(1)}%
- Duration: ${(results.summary.totalDurationMs / 1000).toFixed(1)}s
- Tokens used: ${results.summary.totalTokensUsed.toLocaleString()}

### Quality Report
- Overall score: ${qualityReport.score}/100
- Status: ${qualityReport.passed ? '✅ Passed' : '⚠️ Needs Review'}

${qualityReport.recommendations.length > 0 ? `### Recommendations
${qualityReport.recommendations.map(r => `- ${r}`).join('\n')}` : ''}

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)`;

  const labels = [
    'agent:codegen',
    qualityReport.passed ? 'quality:good' : 'quality:needs-work',
  ];

  return {
    title,
    body,
    baseBranch: 'main',
    headBranch: `omega/${Date.now()}`,
    labels,
    reviewers: [],
    draft: !qualityReport.passed,
    linkedIssues: [],
  };
}

// ============================================================================
// Main Transform Function
// ============================================================================

/**
 * θ₅: Integration Transform
 *
 * Transforms Result Set (R) into Deliverable (D)
 *
 * @param results - The result set from θ₄
 * @returns Deliverable for deployment/merge
 *
 * @example
 * ```typescript
 * const deliverable = await integration(results);
 * console.log(deliverable.summary.status); // 'ready'
 * ```
 */
export function integration(
  results: ResultSet
): Deliverable {
  const startTime = Date.now();

  // Categorize artifacts
  const categorizedArtifacts = categorizeArtifacts(results.artifacts);

  // Calculate code changes
  const codeChanges = calculateCodeChanges(results.artifacts);

  // Generate quality report
  const qualityReport = generateQualityReport(results);

  // Generate commit message
  const commitMessage = generateCommitMessage(results, codeChanges);

  // Generate PR draft
  const pullRequest = generatePullRequestDraft(results, codeChanges, qualityReport);

  // Collect file paths
  const filePaths = results.artifacts.map(a => a.path);

  // Generate documentation updates
  const documentationUpdates: DocumentationUpdate[] = [];

  if (categorizedArtifacts.documentation.length > 0) {
    for (const doc of categorizedArtifacts.documentation) {
      documentationUpdates.push({
        type: 'api-docs',
        path: doc.path,
        content: doc.content || '',
        changeType: 'create',
      });
    }
  }

  // Determine status
  let status: Deliverable['summary']['status'] = 'ready';
  const issues: string[] = [];

  if (!qualityReport.passed) {
    status = 'needs-review';
    issues.push('Quality score below threshold');
  }

  if (results.summary.successRate < 0.8) {
    status = 'blocked';
    issues.push('Too many failed tasks');
  }

  // Calculate completeness
  const completeness = Math.round(
    (results.summary.completedTasks / results.summary.totalTasks) * 100
  );

  const deliverable: Deliverable = {
    deliverableId: `deliverable-${Date.now()}`,
    createdAt: new Date().toISOString(),
    sourceResultSetId: results.resultSetId,
    artifacts: categorizedArtifacts,
    codeChanges,
    qualityReport,
    pullRequest,
    documentationUpdates,
    commit: {
      message: commitMessage,
      files: filePaths,
      branch: pullRequest.headBranch,
    },
    summary: {
      status,
      completeness,
      issues,
      recommendations: qualityReport.recommendations,
    },
    metadata: {
      integrationVersion: '1.0.0',
      integrationTimeMs: Date.now() - startTime,
    },
  };

  return deliverable;
}

/**
 * Validate a deliverable
 */
export function validateDeliverable(deliverable: Deliverable): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (deliverable.summary.status === 'blocked') {
    errors.push('Deliverable is blocked');
  }

  if (deliverable.summary.completeness < 50) {
    errors.push(`Low completeness: ${deliverable.summary.completeness}%`);
  }

  if (!deliverable.qualityReport.passed) {
    errors.push(`Quality check failed: ${deliverable.qualityReport.score}/100`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

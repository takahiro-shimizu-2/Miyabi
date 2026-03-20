/**
 * Miyabi Agent SDK
 *
 * SDK for building and running autonomous agents in the Miyabi ecosystem.
 *
 * @packageDocumentation
 */

// Export types
export type {
  AgentContext,
  AgentConfig,
  AgentResult,
  AgentMetrics,
  AgentArtifact,
  AgentError,
  AgentTask,
  GitHubIssue,
  GitHubPullRequest,
  DeploymentConfig,
  DeploymentResult,
  HealthCheckConfig,
  RetryConfig,
  EscalationConfig,
} from './types';

// Export base agent class
export { AgentBase } from './agent-base';

// Export legacy GitHub client (fetch-based, {owner, repo, token} constructor)
export { GitHubClient as LegacyGitHubClient } from './github-client';
export type { GitHubClientOptions } from './github-client';

// Export utilities
export { createAgentContext, validateContext } from './utils';

// Export retry configuration
export {
  withRetry,
  shouldRetry,
  createRetryOptions,
  calculateBackoff,
  DEFAULT_RETRY_CONFIG,
  RETRYABLE_ERROR_CODES,
  NON_RETRYABLE_ERROR_CODES,
} from './retry-config';
export type { GitHubRetryConfig } from './retry-config';

// ─── Clients (Octokit-based, used by agents) ───
export {
  ClaudeCodeClient,
  AnthropicClient,
  GitHubClient,
} from './clients/index.js';
export type {
  ClaudeCodeResponse,
  GitHubIssueData,
  GitHubFile,
  PullRequestInfo,
} from './clients/index.js';

// ─── Agents ───
export {
  CoordinatorAgent,
  IssueAgent,
  CodeGenAgent,
  ReviewAgent,
  PRAgent,
  TestAgent,
} from './agents/index.js';
export type {
  CoordinatorInput,
  CoordinatorOutput,
  IssueInput,
  IssueOutput,
  CodeGenInput,
  CodeGenOutput,
  ReviewInput,
  ReviewOutput,
  PRInput,
  PROutput,
  TestInput,
  TestOutput,
} from './agents/index.js';

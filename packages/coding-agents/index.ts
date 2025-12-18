/**
 * @miyabi/coding-agents
 *
 * Main entry point for Coding Agents package
 */

// Core Agent System
export * from './base-agent';
export * from './agent-factory';
export * from './agent-registry';
export * from './agent-analyzer';
export * from './dynamic-agent';
export * from './dynamic-tool-creator';
export * from './tool-factory';

// Specialized Agents
export * from './coordinator/coordinator-agent';
export * from './codegen/codegen-agent';
export * from './review/review-agent';
export * from './deployment/deployment-agent';
export * from './issue/issue-agent';
export * from './pr/pr-agent';

// Types
export * from './types/index';

// Ω-System: Autonomous Execution Engine
export {
  // Main engine
  OmegaEngine,
  omega,
  omegaWithoutLearning,
  omegaStrict,
  type OmegaEngineConfig,
  type OmegaResult,
  type ExecutionTrace,
  type PipelineStage,
  type PipelineState,
  // Adapters
  IssueToIntentAdapter,
  issueToIntent,
  ContextToWorldAdapter,
  contextToWorld,
  createWorldFromEnvironment,
  DeliverableToReportAdapter,
  deliverableToReport,
  summarizeReport,
  OmegaAgentAdapter,
  createOmegaAdapter,
  executeWithOmega,
  type ExecutionContext,
  type AgentExecutionRequest,
  type AgentExecutionResponse,
} from './omega-system/index';

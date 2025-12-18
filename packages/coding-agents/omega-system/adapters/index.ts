/**
 * Ω-System Adapters
 *
 * Bridge between existing Agent system and Ω-System.
 * Provides converters for Issue → IntentSpace, Context → WorldSpace, etc.
 *
 * @module omega-system/adapters
 */

// Issue to Intent adapter
export { IssueToIntentAdapter, issueToIntent } from './issue-to-intent';

// Context to World adapter
export {
  ContextToWorldAdapter,
  contextToWorld,
  createWorldFromEnvironment,
} from './context-to-world';
export type { ExecutionContext } from './context-to-world';

// Deliverable to Report adapter
export {
  DeliverableToReportAdapter,
  deliverableToReport,
  summarizeReport,
} from './deliverable-to-report';
export type { ExecutionReport } from './deliverable-to-report';

// Main Ω-Agent adapter
export {
  OmegaAgentAdapter,
  createOmegaAdapter,
  executeWithOmega,
} from './omega-agent-adapter';
export type {
  AgentExecutionRequest,
  AgentExecutionResponse,
} from './omega-agent-adapter';

/**
 * Type declarations for @miyabi/coding-agents
 * Prevents tsc from resolving into the coding-agents source directory
 * which is outside CLI's rootDir.
 */
declare module "@miyabi/coding-agents" {
  export class OmegaAgentAdapter {
    constructor(options?: {
      enableLearning?: boolean;
      maxExecutionTimeMs?: number;
    });
    execute(intent: unknown): Promise<unknown>;
  }
  export const CoordinatorAgent: unknown;
  export const CodeGenAgent: unknown;
  export const ReviewAgent: unknown;
  export const IssueAgent: unknown;
  export const PRAgent: unknown;
  export const DeploymentAgent: unknown;
}

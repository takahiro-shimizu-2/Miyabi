/**
 * Task Manager - Configuration Types
 */

import type { TaskState } from './task.js';

/**
 * LLM provider configuration
 */
export interface LLMConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  apiKey: string;
  maxTokens: number;
  temperature: number;
  timeout?: number;
}

/**
 * GitHub configuration for sync
 */
export interface GitHubConfig {
  owner: string;
  repo: string;
  token: string;
  projectNumber?: number;
}

/**
 * Label mapping for state sync
 */
export interface LabelMapping {
  stateToLabel: Record<TaskState, string>;
  labelPrefixToField: Record<string, string>;
}

/**
 * Projects V2 field mapping
 */
export interface FieldMapping {
  taskFieldToProjectField: Record<string, string>;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  github: GitHubConfig;
  labelMapping: LabelMapping;
  fieldMapping: FieldMapping;
  syncOptions: {
    bidirectional: boolean;
    conflictResolution: 'local-wins' | 'github-wins' | 'manual';
    syncIntervalMs: number;
    webhookEnabled: boolean;
  };
}

/**
 * Retry configuration
 */
export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  maxBackoffMs: number;
}

/**
 * Execution configuration
 */
export interface ExecutionConfig {
  maxConcurrency: number;
  worktreeBasePath: string;
  timeoutMinutes: number;
  retryConfig: RetryConfig;
}

/**
 * State persistence configuration
 */
export interface StateConfig {
  persistenceEnabled: boolean;
  persistenceDir: string;
  snapshotIntervalMs: number;
}

/**
 * Logging configuration
 */
export interface LoggingConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  outputDir: string;
  includeTimestamps: boolean;
}

/**
 * Complete Task Manager configuration
 */
export interface TaskManagerConfig {
  llm: LLMConfig;
  sync: SyncConfig;
  execution: ExecutionConfig;
  state: StateConfig;
  logging: LoggingConfig;
}

/**
 * Default label mapping following the 53-label system
 */
export const DEFAULT_LABEL_MAPPING: LabelMapping = {
  stateToLabel: {
    'draft': 'state:draft',
    'pending': 'state:pending',
    'analyzing': 'state:analyzing',
    'implementing': 'state:implementing',
    'reviewing': 'state:reviewing',
    'deploying': 'state:deploying',
    'done': 'state:done',
    'blocked': 'state:blocked',
    'failed': 'state:failed',
    'cancelled': 'state:cancelled',
  },
  labelPrefixToField: {
    'state:': 'currentState',
    'type:': 'type',
    'priority:': 'priority',
    'agent:': 'assignedAgent',
  },
};

/**
 * Default field mapping for Projects V2
 */
export const DEFAULT_FIELD_MAPPING: FieldMapping = {
  taskFieldToProjectField: {
    'currentState': 'Status',
    'assignedAgent': 'Agent',
    'estimatedDuration': 'Duration',
    'priority': 'Priority',
  },
};

/**
 * Create default configuration with required fields
 */
export function createDefaultConfig(
  required: {
    llm: { apiKey: string };
    sync: { github: { owner: string; repo: string; token: string } };
  },
  overrides?: Partial<TaskManagerConfig>
): TaskManagerConfig {
  const defaults: TaskManagerConfig = {
    llm: {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      apiKey: required.llm.apiKey,
      maxTokens: 4096,
      temperature: 0.3,
      timeout: 60000,
    },
    sync: {
      github: {
        owner: required.sync.github.owner,
        repo: required.sync.github.repo,
        token: required.sync.github.token,
      },
      labelMapping: DEFAULT_LABEL_MAPPING,
      fieldMapping: DEFAULT_FIELD_MAPPING,
      syncOptions: {
        bidirectional: true,
        conflictResolution: 'local-wins',
        syncIntervalMs: 30000,
        webhookEnabled: false,
      },
    },
    execution: {
      maxConcurrency: 5,
      worktreeBasePath: '.worktrees',
      timeoutMinutes: 30,
      retryConfig: {
        maxRetries: 3,
        backoffMs: 1000,
        maxBackoffMs: 30000,
      },
    },
    state: {
      persistenceEnabled: true,
      persistenceDir: '.miyabi/task-manager',
      snapshotIntervalMs: 60000,
    },
    logging: {
      level: 'info',
      outputDir: '.miyabi/logs',
      includeTimestamps: true,
    },
  };

  if (!overrides) {
    return defaults;
  }

  // Deep merge overrides
  return {
    llm: { ...defaults.llm, ...overrides.llm },
    sync: {
      ...defaults.sync,
      ...overrides.sync,
      github: { ...defaults.sync.github, ...overrides.sync?.github },
      syncOptions: { ...defaults.sync.syncOptions, ...overrides.sync?.syncOptions },
    },
    execution: {
      ...defaults.execution,
      ...overrides.execution,
      retryConfig: { ...defaults.execution.retryConfig, ...overrides.execution?.retryConfig },
    },
    state: { ...defaults.state, ...overrides.state },
    logging: { ...defaults.logging, ...overrides.logging },
  };
}

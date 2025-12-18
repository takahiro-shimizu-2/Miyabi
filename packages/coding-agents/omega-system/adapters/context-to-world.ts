/**
 * Context to World Space Adapter
 *
 * Converts execution context to SWML WorldSpace.
 * Maps environment, resources, and constraints to W(t, s, c, r, e).
 *
 * @module omega-system/adapters/context-to-world
 */

import type { WorldSpace } from '../../types/world';

/**
 * Execution context from existing agent system
 */
export interface ExecutionContext {
  /** Project root path */
  projectRoot: string;

  /** Repository info */
  repository?: {
    owner: string;
    name: string;
    branch: string;
    defaultBranch: string;
  };

  /** Git info */
  git?: {
    currentBranch: string;
    hasUncommittedChanges: boolean;
    lastCommitHash?: string;
  };

  /** Runtime environment */
  environment?: {
    nodeVersion: string;
    platform: string;
    arch: string;
    cpuCount: number;
    totalMemory: number;
    freeMemory: number;
  };

  /** Project configuration */
  config?: {
    language: string;
    framework?: string;
    testRunner?: string;
    buildTool?: string;
    packageManager?: string;
  };

  /** Available tools */
  tools?: string[];

  /** Active constraints */
  constraints?: {
    maxConcurrency?: number;
    timeoutMs?: number;
    memoryLimitMb?: number;
    requiresReview?: boolean;
    allowedBranches?: string[];
  };

  /** Timestamp */
  timestamp?: string;
}

/**
 * Default execution context
 */
const DEFAULT_CONTEXT: ExecutionContext = {
  projectRoot: process.cwd(),
  environment: {
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuCount: 4,
    totalMemory: 8192,
    freeMemory: 4096,
  },
  config: {
    language: 'typescript',
  },
  tools: ['git', 'npm', 'tsc'],
  constraints: {
    maxConcurrency: 3,
    timeoutMs: 300000,
    requiresReview: true,
  },
};

/**
 * Detect project type from config
 */
function detectProjectType(config?: ExecutionContext['config']): string {
  if (!config) return 'typescript';

  const framework = config.framework?.toLowerCase();
  if (framework) {
    if (framework.includes('next')) return 'nextjs';
    if (framework.includes('react')) return 'react';
    if (framework.includes('vue')) return 'vue';
    if (framework.includes('angular')) return 'angular';
    if (framework.includes('express')) return 'express';
    if (framework.includes('nest')) return 'nestjs';
  }

  return config.language || 'typescript';
}

/**
 * Infer architecture patterns from config
 */
function inferArchitecturePatterns(config?: ExecutionContext['config']): string[] {
  const patterns: string[] = ['modular'];

  if (!config) return patterns;

  if (config.framework) {
    patterns.push('framework-based');
  }

  if (config.testRunner) {
    patterns.push('test-driven');
    patterns.push('code-review');
  }

  return patterns;
}

/**
 * Check if current time is a workday
 */
function isWorkday(): boolean {
  const day = new Date().getDay();
  return day !== 0 && day !== 6; // Not Sunday or Saturday
}

/**
 * Get current timezone
 */
function getCurrentTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

/**
 * Context to World Space Adapter
 */
export class ContextToWorldAdapter {
  /**
   * Convert ExecutionContext to WorldSpace
   */
  static convert(context: Partial<ExecutionContext> = {}): WorldSpace {
    const ctx = { ...DEFAULT_CONTEXT, ...context };
    const env = ctx.environment || DEFAULT_CONTEXT.environment!;
    const constraints = ctx.constraints || DEFAULT_CONTEXT.constraints!;
    const repo = ctx.repository;
    const currentTimestamp = ctx.timestamp || new Date().toISOString();
    const timezone = getCurrentTimezone();

    return {
      metadata: {
        worldId: `world-${Date.now()}`,
        worldName: repo ? `${repo.owner}/${repo.name}` : 'local-project',
        worldVersion: '1.0.0',
        formatVersion: '1.0.0',
        createdAt: currentTimestamp,
        lastUpdated: currentTimestamp,
        maintainer: repo?.owner || 'local',
        license: 'MIT',
      },
      temporal: {
        currentTime: {
          format: 'ISO 8601',
          timezone,
          example: currentTimestamp,
        },
        horizon: {
          projectDuration: '6 months',
          sprintDuration: '2 weeks',
          taskTimeout: `${constraints.timeoutMs || 300000}ms`,
          maxExecutionTime: constraints.timeoutMs || 300000,
        },
        constraints: {
          businessHours: isWorkday() ? '09:00-18:00' : 'N/A',
          maintenanceWindow: 'Sunday 02:00-06:00',
          deploymentWindow: 'Weekdays 10:00-17:00',
        },
        timezones: {
          primary: timezone,
          secondary: ['UTC'],
        },
      },
      spatial: {
        physical: {
          location: 'local',
          datacenter: 'N/A',
          edgeLocations: [],
        },
        digital: {
          repository: {
            primary: repo ? `https://github.com/${repo.owner}/${repo.name}` : ctx.projectRoot,
            public: repo ? `https://github.com/${repo.owner}/${repo.name}` : undefined,
          },
          deployment: {
            production: 'https://production.example.com',
            staging: 'https://staging.example.com',
          },
          api: {},
        },
        abstract: {
          conceptualLayers: {
            layer0Definition: 'miyabi_def/',
            layer1Integration: '.claude/',
            layer2Implementation: 'packages/',
            layer3Data: '.miyabi/',
            layer4Documentation: 'docs/',
            layer5Configuration: 'config/',
            layer6Testing: 'tests/',
            layer7Deployment: 'deployment/',
            layer8External: 'integrations/',
          },
          mathematicalSpaces: {
            intentSpace: 'I = {goals, preferences, objectives, modality}',
            worldSpace: 'W = {temporal, spatial, contextual, resources, environmental}',
            resultSpace: 'R = {artifacts, metadata, quality_metrics}',
            taskSpace: 'T = {function, input, output, dependencies, constraints}',
          },
        },
      },
      contextual: {
        domain: {
          primary: detectProjectType(ctx.config),
          subDomains: ctx.config?.framework ? [ctx.config.framework] : [],
        },
        user: {
          types: ['developer', 'agent'],
          personas: [
            {
              name: 'Developer',
              description: 'Software developer using the system',
              needs: ['code generation', 'review', 'deployment'],
            },
          ],
        },
        system: {
          projectType: detectProjectType(ctx.config),
          architecture: {
            primary: 'modular',
            patterns: inferArchitecturePatterns(ctx.config),
          },
          techStack: {
            backend: {
              primary: ctx.config?.language || 'typescript',
              frameworks: ctx.config?.framework ? [ctx.config.framework] : [],
            },
            frontend: {
              primary: 'typescript',
              frameworks: [],
            },
            infrastructure: {
              cloud: 'GitHub',
              database: 'N/A',
            },
            ai: {
              llms: ['Claude'],
              tools: ctx.tools || [],
            },
          },
        },
      },
      resources: {
        computational: {
          cpu: {
            available: env.cpuCount,
            allocated: 0,
            maxUtilization: 80,
          },
          memory: {
            available: env.freeMemory,
            allocated: 0,
            maxUtilization: 80,
          },
        },
        human: {
          developers: 1,
          reviewers: ['auto-reviewer'],
          escalationTargets: {},
        },
        information: {
          documentation: ['README.md', 'CLAUDE.md'],
          codebase: {
            totalFiles: 100,
            languages: [ctx.config?.language || 'typescript'],
          },
        },
        financial: {
          budget: {
            monthly: 1000,
            currency: 'USD',
          },
          apiCosts: {
            currentSpend: 0,
            limit: 100,
            warningThreshold: 80,
          },
        },
      },
      environmental: {
        load: {
          cpuUtilization: Math.round((1 - (env.freeMemory / env.totalMemory)) * 100),
          memoryUtilization: Math.round((1 - (env.freeMemory / env.totalMemory)) * 100),
          networkLatency: 50,
          queueDepth: 0,
        },
        dependencies: {
          apis: [],
          services: [],
        },
        constraints: {
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 100000,
          },
          concurrency: {
            maxWorkers: constraints.maxConcurrency ?? 3,
            maxWorktrees: (constraints.maxConcurrency ?? 3) * 2,
          },
          security: {
            requiresReview: constraints.requiresReview ?? true,
            allowedOperations: ['read', 'write', 'execute'],
          },
        },
        external: {
          networkStatus: 'online',
          maintenanceMode: false,
          featureFlags: {},
        },
      },
    };
  }
}

/**
 * Convenience function
 */
export function contextToWorld(context: Partial<ExecutionContext> = {}): WorldSpace {
  return ContextToWorldAdapter.convert(context);
}

/**
 * Create WorldSpace from current environment
 */
export function createWorldFromEnvironment(): WorldSpace {
  const context: ExecutionContext = {
    projectRoot: process.cwd(),
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      cpuCount: 4,
      totalMemory: 8192,
      freeMemory: 4096,
    },
    timestamp: new Date().toISOString(),
  };

  return contextToWorld(context);
}

/**
 * Task State Machine
 * Manages valid state transitions for tasks
 */

import type { TaskState, TaskStateTransition, ManagedTask } from '../types/index.js';

/**
 * State transition rule
 */
export interface StateTransitionRule {
  from: TaskState;
  to: TaskState;
  conditions?: string[];
  sideEffects?: string[];
}

/**
 * Transition result
 */
export interface TransitionResult {
  valid: boolean;
  from: TaskState;
  to: TaskState;
  rule?: StateTransitionRule;
  error?: string;
}

/**
 * All valid state transitions
 */
const STATE_TRANSITION_RULES: StateTransitionRule[] = [
  // From draft
  { from: 'draft', to: 'pending', conditions: ['has_title', 'has_description'] },
  { from: 'draft', to: 'cancelled' },

  // From pending
  { from: 'pending', to: 'analyzing' },
  { from: 'pending', to: 'implementing', conditions: ['skip_analysis'] },
  { from: 'pending', to: 'blocked', conditions: ['dependency_blocked'] },
  { from: 'pending', to: 'cancelled' },

  // From analyzing
  { from: 'analyzing', to: 'implementing' },
  { from: 'analyzing', to: 'pending', conditions: ['needs_revision'] },
  { from: 'analyzing', to: 'blocked', conditions: ['dependency_blocked'] },
  { from: 'analyzing', to: 'failed', conditions: ['analysis_failed'] },
  { from: 'analyzing', to: 'cancelled' },

  // From implementing
  { from: 'implementing', to: 'reviewing', sideEffects: ['create_pr_draft'] },
  { from: 'implementing', to: 'blocked', conditions: ['dependency_blocked'] },
  { from: 'implementing', to: 'failed', conditions: ['implementation_failed'] },
  { from: 'implementing', to: 'cancelled' },

  // From reviewing
  { from: 'reviewing', to: 'implementing', conditions: ['needs_revision'] },
  { from: 'reviewing', to: 'deploying', conditions: ['review_approved', 'requires_deployment'] },
  { from: 'reviewing', to: 'done', conditions: ['review_approved', 'no_deployment'] },
  { from: 'reviewing', to: 'failed', conditions: ['review_rejected'] },
  { from: 'reviewing', to: 'cancelled' },

  // From deploying
  { from: 'deploying', to: 'done', sideEffects: ['close_issue', 'merge_pr'] },
  { from: 'deploying', to: 'failed', conditions: ['deployment_failed'] },
  { from: 'deploying', to: 'cancelled' },

  // From blocked
  { from: 'blocked', to: 'pending', conditions: ['dependency_resolved'] },
  { from: 'blocked', to: 'cancelled' },

  // From failed
  { from: 'failed', to: 'pending', conditions: ['retry_approved'] },
  { from: 'failed', to: 'cancelled' },

  // From done (terminal, but can be reopened)
  { from: 'done', to: 'pending', conditions: ['reopen_requested'] },

  // From cancelled (terminal, but can be reopened)
  { from: 'cancelled', to: 'draft', conditions: ['reopen_requested'] },
];

/**
 * Task State Machine
 */
export class TaskStateMachine {
  private rules: Map<TaskState, StateTransitionRule[]>;

  constructor() {
    this.rules = new Map();

    // Index rules by 'from' state for efficient lookup
    for (const rule of STATE_TRANSITION_RULES) {
      const existing = this.rules.get(rule.from) || [];
      existing.push(rule);
      this.rules.set(rule.from, existing);
    }
  }

  /**
   * Check if a transition is valid
   */
  canTransition(from: TaskState, to: TaskState): boolean {
    const rules = this.rules.get(from) || [];
    return rules.some((r) => r.to === to);
  }

  /**
   * Get all valid transitions from a state
   */
  getValidTransitions(from: TaskState): TaskState[] {
    const rules = this.rules.get(from) || [];
    return rules.map((r) => r.to);
  }

  /**
   * Get the transition rule for a specific transition
   */
  getTransitionRule(from: TaskState, to: TaskState): StateTransitionRule | undefined {
    const rules = this.rules.get(from) || [];
    return rules.find((r) => r.to === to);
  }

  /**
   * Attempt a state transition
   */
  transition(from: TaskState, to: TaskState): TransitionResult {
    if (!this.canTransition(from, to)) {
      return {
        valid: false,
        from,
        to,
        error: `Invalid transition: ${from} -> ${to}. Valid transitions: ${this.getValidTransitions(from).join(', ')}`,
      };
    }

    const rule = this.getTransitionRule(from, to);
    return {
      valid: true,
      from,
      to,
      rule,
    };
  }

  /**
   * Apply a transition to a task
   */
  applyTransition(
    task: ManagedTask,
    to: TaskState,
    triggeredBy: TaskStateTransition['triggeredBy'],
    reason?: string
  ): TransitionResult & { task?: ManagedTask } {
    const result = this.transition(task.currentState, to);

    if (!result.valid) {
      return result;
    }

    // Create updated task with new state
    const now = new Date().toISOString();
    const transition: TaskStateTransition = {
      from: task.currentState,
      to,
      timestamp: now,
      triggeredBy,
      reason,
    };

    const updatedTask: ManagedTask = {
      ...task,
      currentState: to,
      stateHistory: [...task.stateHistory, transition],
    };

    // Set timestamps for terminal states
    if (to === 'implementing' && !updatedTask.startedAt) {
      updatedTask.startedAt = now;
    }

    if (to === 'done' || to === 'cancelled' || to === 'failed') {
      updatedTask.completedAt = now;
    }

    return {
      ...result,
      task: updatedTask,
    };
  }

  /**
   * Check if a state is terminal (no outgoing transitions normally)
   */
  isTerminalState(state: TaskState): boolean {
    return state === 'done' || state === 'cancelled';
  }

  /**
   * Check if a state indicates failure
   */
  isFailedState(state: TaskState): boolean {
    return state === 'failed';
  }

  /**
   * Check if a state indicates blocking
   */
  isBlockedState(state: TaskState): boolean {
    return state === 'blocked';
  }

  /**
   * Check if a state is active (work in progress)
   */
  isActiveState(state: TaskState): boolean {
    return ['analyzing', 'implementing', 'reviewing', 'deploying'].includes(state);
  }

  /**
   * Get the next logical state based on typical workflow
   */
  getNextLogicalState(from: TaskState): TaskState | null {
    const workflow: Record<TaskState, TaskState | null> = {
      'draft': 'pending',
      'pending': 'analyzing',
      'analyzing': 'implementing',
      'implementing': 'reviewing',
      'reviewing': 'done',
      'deploying': 'done',
      'blocked': 'pending',
      'failed': 'pending',
      'done': null,
      'cancelled': null,
    };

    return workflow[from] ?? null;
  }

  /**
   * Get all states
   */
  getAllStates(): TaskState[] {
    return [
      'draft',
      'pending',
      'analyzing',
      'implementing',
      'reviewing',
      'deploying',
      'done',
      'blocked',
      'failed',
      'cancelled',
    ];
  }

  /**
   * Get state category
   */
  getStateCategory(state: TaskState): 'initial' | 'active' | 'review' | 'terminal' | 'error' {
    if (state === 'draft' || state === 'pending') return 'initial';
    if (state === 'analyzing' || state === 'implementing') return 'active';
    if (state === 'reviewing' || state === 'deploying') return 'review';
    if (state === 'done' || state === 'cancelled') return 'terminal';
    return 'error';
  }
}

// Export singleton instance
export const taskStateMachine = new TaskStateMachine();

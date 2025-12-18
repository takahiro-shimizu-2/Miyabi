/**
 * Issue to Intent Space Adapter
 *
 * Converts GitHub Issue to SWML IntentSpace.
 * Maps Issue structure to the 4-dimensional Intent Space I(g, p, o, m).
 *
 * @module omega-system/adapters/issue-to-intent
 */

import type { Issue } from '../../types';
import type {
  IntentSpace,
  Goal,
  GoalPriority,
  GoalType,
  FunctionalRequirement,
  NonFunctionalRequirement,
  Constraint,
} from '../../types/intent';

/**
 * Label to priority mapping
 */
const PRIORITY_MAP: Record<string, GoalPriority> = {
  'priority:P0-Critical': 'critical',
  'priority:P1-High': 'high',
  'priority:P2-Medium': 'medium',
  'priority:P3-Low': 'low',
  'P0': 'critical',
  'P1': 'high',
  'P2': 'medium',
  'P3': 'low',
};

/**
 * Extract goals from Issue body
 */
function extractGoals(issue: Issue): Goal[] {
  const goals: Goal[] = [];
  const lines = issue.body.split('\n');
  let goalIndex = 0;

  for (const line of lines) {
    // Match checkbox tasks: - [ ] or - [x]
    const checkboxMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
    if (checkboxMatch) {
      goals.push(createGoal(checkboxMatch[1], goalIndex++, issue, 'secondary'));
      continue;
    }

    // Match numbered tasks: 1. Task
    const numberedMatch = line.match(/^\d+[.)]\s+(.+)$/);
    if (numberedMatch) {
      goals.push(createGoal(numberedMatch[1], goalIndex++, issue, 'secondary'));
      continue;
    }

    // Match heading tasks: ## Task
    const headingMatch = line.match(/^##\s+(.+)$/);
    if (headingMatch) {
      goals.push(createGoal(headingMatch[1], goalIndex++, issue, 'secondary'));
      continue;
    }
  }

  // If no goals found, create from title as primary goal
  if (goals.length === 0) {
    goals.push(createGoal(issue.title, 0, issue, 'primary'));
  } else {
    // First goal is primary
    goals[0].type = 'primary';
  }

  return goals;
}

/**
 * Create Goal from text
 */
function createGoal(
  text: string,
  index: number,
  issue: Issue,
  type: GoalType
): Goal {
  const priority = determinePriority(issue.labels);

  return {
    id: `goal-${issue.number}-${index}`,
    type,
    description: text.trim(),
    priority,
    measurable: true,
    successCriteria: extractSuccessCriteria(text, issue.body),
  };
}

/**
 * Determine priority from labels
 */
function determinePriority(labels: string[]): GoalPriority {
  for (const label of labels) {
    const priority = PRIORITY_MAP[label];
    if (priority) return priority;
  }
  return 'medium';
}

/**
 * Extract success criteria from text and body
 */
function extractSuccessCriteria(_text: string, body: string): string[] {
  const criteria: string[] = [];

  // Look for acceptance criteria section
  const acMatch = body.match(/## Acceptance Criteria\n([\s\S]*?)(?=##|$)/i);
  if (acMatch) {
    const acLines = acMatch[1].split('\n');
    for (const line of acLines) {
      const criteriaMatch = line.match(/^-\s*\[[ x]\]\s+(.+)$/i);
      if (criteriaMatch) {
        criteria.push(criteriaMatch[1].trim());
      }
    }
  }

  // Default criteria based on type
  if (criteria.length === 0) {
    criteria.push('Implementation complete');
    criteria.push('Tests pass');
    criteria.push('No TypeScript errors');
  }

  return criteria;
}

/**
 * Determine quality vs speed bias from labels
 */
function determineQualityBias(labels: string[]): 'quality' | 'speed' | 'balanced' {
  if (labels.some(l => l.includes('urgent') || l.includes('hotfix'))) {
    return 'speed';
  }
  if (labels.some(l => l.includes('security') || l.includes('critical'))) {
    return 'quality';
  }
  return 'balanced';
}

/**
 * Determine automation level from labels
 */
function determineAutomationLevel(labels: string[]): 'full-auto' | 'semi-auto' | 'manual' {
  if (labels.some(l => l.includes('auto') || l.includes('agent'))) {
    return 'full-auto';
  }
  if (labels.some(l => l.includes('review-required'))) {
    return 'semi-auto';
  }
  return 'semi-auto';
}

/**
 * Issue to Intent Space Adapter
 */
export class IssueToIntentAdapter {
  /**
   * Convert Issue to IntentSpace
   */
  static convert(issue: Issue): IntentSpace {
    const goals = extractGoals(issue);
    const primaryGoal = goals[0];
    const supportingGoals = goals.slice(1, 4);
    const secondaryGoals = goals.slice(4);

    const qualityBias = determineQualityBias(issue.labels);
    const automationLevel = determineAutomationLevel(issue.labels);

    // Create functional requirements from goals
    const functionalReqs: FunctionalRequirement[] = goals.map((g, i) => ({
      id: `func-req-${i}`,
      description: g.description,
      priority: g.priority,
      acceptanceCriteria: g.successCriteria || [],
      testable: true,
    }));

    // Non-functional requirements
    const nonFunctionalReqs: NonFunctionalRequirement[] = [
      {
        id: 'nfr-quality',
        category: 'maintainability',
        description: 'Code passes all tests',
        metric: 'test-pass-rate',
        target: '100%',
      },
      {
        id: 'nfr-types',
        category: 'maintainability',
        description: 'No TypeScript errors',
        metric: 'type-error-count',
        target: 0,
      },
    ];

    // Constraints from security labels
    const constraints: Constraint[] = issue.labels.includes('security')
      ? [{
          id: 'constraint-security',
          type: 'technical',
          description: 'Security review required',
          impact: 'blocking',
        }]
      : [];

    return {
      metadata: {
        intentId: `intent-issue-${issue.number}`,
        source: 'system',
        createdAt: new Date().toISOString(),
        confidence: 0.85,
        version: 1,
      },
      goals: {
        primary: {
          main: primaryGoal,
          supporting: supportingGoals,
        },
        secondary: {
          goals: secondaryGoals,
          priorityOrder: secondaryGoals.map(g => g.id),
        },
        implicit: {
          inferred: [],
          confidence: 0.8,
          source: 'issue-analysis',
        },
        allGoals: goals,
      },
      preferences: {
        qualityVsSpeed: {
          bias: qualityBias,
          qualityThreshold: qualityBias === 'quality' ? 90 : 70,
          speedMultiplier: qualityBias === 'speed' ? 1.5 : 1.0,
          allowDegradation: qualityBias === 'speed',
        },
        costVsPerformance: {
          bias: 'balanced',
          performanceFloor: 70,
          elasticity: 1.0,
        },
        automationVsControl: {
          bias: automationLevel,
          approvalRequired: automationLevel === 'semi-auto'
            ? ['review', 'deploy']
            : ['deploy'],
          autoApproveThreshold: 80,
        },
        risk: {
          tolerance: qualityBias === 'quality' ? 'risk-averse' : 'moderate',
          maxRiskScore: qualityBias === 'quality' ? 30 : 50,
          requiresReviewAbove: 40,
        },
        customTradeOffs: [],
      },
      objectives: {
        functional: functionalReqs,
        nonFunctional: nonFunctionalReqs,
        quality: [
          {
            id: 'qual-code',
            aspect: 'code-quality',
            description: 'Code meets quality standards',
            minimumScore: 70,
            targetScore: 90,
            mandatory: true,
          },
        ],
        constraints,
      },
      modality: {
        primary: 'code',
        secondary: ['text'],
        code: {
          language: 'typescript',
          style: 'documented',
          includeTests: true,
          includeTypes: true,
        },
        text: {
          format: 'markdown',
          language: 'en',
          tone: 'technical',
        },
      },
    };
  }
}

/**
 * Convenience function
 */
export function issueToIntent(issue: Issue): IntentSpace {
  return IssueToIntentAdapter.convert(issue);
}

/**
 * Intent Space Type Definitions (SWML-compliant)
 *
 * Mathematical Definition: I(g, p, o, m) → Objective
 *
 * The Intent Space captures user intentions and requirements,
 * defined by 4 dimensions that together specify the desired outcome.
 *
 * @module types/intent
 * @see miyabi_def/generated/entities.yaml
 */

// ============================================================================
// Goals Dimension (g) - 目標次元
// ============================================================================

/**
 * Goal priority levels
 */
export type GoalPriority = 'critical' | 'high' | 'medium' | 'low';

/**
 * Goal type classification
 */
export type GoalType = 'primary' | 'secondary' | 'implicit' | 'derived';

/**
 * Individual goal definition
 */
export interface Goal {
  id: string;
  type: GoalType;
  description: string;
  priority: GoalPriority;
  measurable: boolean;
  successCriteria?: string[];
  dependencies?: string[]; // other goal IDs
  deadline?: string;       // ISO 8601
}

/**
 * Primary goals - explicit main objectives
 */
export interface PrimaryGoals {
  main: Goal;
  supporting: Goal[];
}

/**
 * Secondary goals - nice-to-have objectives
 */
export interface SecondaryGoals {
  goals: Goal[];
  priorityOrder: string[]; // goal IDs in priority order
}

/**
 * Implicit goals - inferred from context
 */
export interface ImplicitGoals {
  inferred: Goal[];
  confidence: number; // 0-1, confidence in inference
  source: string;     // what triggered the inference
}

/**
 * Goals Dimension - what needs to be achieved
 */
export interface GoalsDimension {
  primary: PrimaryGoals;
  secondary: SecondaryGoals;
  implicit: ImplicitGoals;
  allGoals: Goal[];
}

// ============================================================================
// Preferences Dimension (p) - 選好次元
// ============================================================================

/**
 * Trade-off specification
 */
export interface TradeOff {
  dimension1: string;
  dimension2: string;
  preference: number; // -1 to 1, negative favors dimension1
  reason?: string;
}

/**
 * Quality vs Speed preference
 */
export interface QualitySpeedPreference {
  bias: 'quality' | 'balanced' | 'speed';
  qualityThreshold: number;  // minimum acceptable quality (0-100)
  speedMultiplier: number;   // 1.0 = normal, 2.0 = twice as fast
  allowDegradation: boolean; // can quality be sacrificed for speed
}

/**
 * Cost vs Performance preference
 */
export interface CostPerformancePreference {
  bias: 'cost' | 'balanced' | 'performance';
  budgetLimit?: number;      // max cost allowed
  performanceFloor: number;  // minimum acceptable performance
  elasticity: number;        // how much extra to pay for improvement
}

/**
 * Automation vs Control preference
 */
export interface AutomationControlPreference {
  bias: 'full-auto' | 'semi-auto' | 'manual';
  approvalRequired: string[]; // operations requiring approval
  autoApproveThreshold: number; // quality score for auto-approval
}

/**
 * Risk tolerance levels
 */
export interface RiskPreference {
  tolerance: 'risk-averse' | 'moderate' | 'risk-tolerant';
  maxRiskScore: number;      // 0-100
  requiresReviewAbove: number; // risk score threshold for review
}

/**
 * Preferences Dimension - how to make trade-offs
 */
export interface PreferencesDimension {
  qualityVsSpeed: QualitySpeedPreference;
  costVsPerformance: CostPerformancePreference;
  automationVsControl: AutomationControlPreference;
  risk: RiskPreference;
  customTradeOffs: TradeOff[];
}

// ============================================================================
// Objectives Dimension (o) - 目的次元
// ============================================================================

/**
 * Functional requirement
 */
export interface FunctionalRequirement {
  id: string;
  description: string;
  priority: GoalPriority;
  acceptanceCriteria: string[];
  testable: boolean;
  implemented?: boolean;
}

/**
 * Non-functional requirement
 */
export interface NonFunctionalRequirement {
  id: string;
  category: 'performance' | 'security' | 'reliability' | 'scalability' | 'maintainability' | 'usability';
  description: string;
  metric: string;
  target: number | string;
  current?: number | string;
}

/**
 * Quality requirement
 */
export interface QualityRequirement {
  id: string;
  aspect: 'code-quality' | 'test-coverage' | 'documentation' | 'accessibility' | 'compliance';
  description: string;
  minimumScore: number;  // 0-100
  targetScore: number;   // 0-100
  mandatory: boolean;
}

/**
 * Constraint definition
 */
export interface Constraint {
  id: string;
  type: 'technical' | 'business' | 'regulatory' | 'resource';
  description: string;
  impact: 'blocking' | 'limiting' | 'advisory';
  workaround?: string;
}

/**
 * Objectives Dimension - specific requirements to satisfy
 */
export interface ObjectivesDimension {
  functional: FunctionalRequirement[];
  nonFunctional: NonFunctionalRequirement[];
  quality: QualityRequirement[];
  constraints: Constraint[];
}

// ============================================================================
// Modality Dimension (m) - 様式次元
// ============================================================================

/**
 * Output modality types
 */
export type OutputModality = 'text' | 'code' | 'visual' | 'data' | 'audio' | 'mixed';

/**
 * Code output specification
 */
export interface CodeModality {
  language: string;
  framework?: string;
  style: 'verbose' | 'concise' | 'documented';
  includeTests: boolean;
  includeTypes: boolean;
  targetVersion?: string;
}

/**
 * Text output specification
 */
export interface TextModality {
  format: 'markdown' | 'plain' | 'html' | 'json' | 'yaml';
  language: string; // natural language (en, ja, etc.)
  tone: 'formal' | 'casual' | 'technical';
  maxLength?: number;
}

/**
 * Visual output specification
 */
export interface VisualModality {
  format: 'diagram' | 'chart' | 'image' | 'ui-mockup';
  tool?: string; // PlantUML, Mermaid, etc.
  style?: string;
  resolution?: string;
}

/**
 * Data output specification
 */
export interface DataModality {
  format: 'json' | 'yaml' | 'csv' | 'sql' | 'binary';
  schema?: string; // reference to schema
  validation: boolean;
  compression?: string;
}

/**
 * Modality Dimension - how outputs should be formatted
 */
export interface ModalityDimension {
  primary: OutputModality;
  secondary?: OutputModality[];
  code?: CodeModality;
  text?: TextModality;
  visual?: VisualModality;
  data?: DataModality;
}

// ============================================================================
// Intent Space - Complete Definition
// ============================================================================

/**
 * Intent metadata
 */
export interface IntentMetadata {
  intentId: string;
  source: 'user' | 'system' | 'agent' | 'inferred';
  createdAt: string;
  expiresAt?: string;
  confidence: number; // 0-1
  version: number;
}

/**
 * Intent Space - Complete intention specification
 *
 * Mathematical representation: I(g, p, o, m) → Objective
 *
 * @example
 * ```typescript
 * const intent: IntentSpace = {
 *   metadata: { intentId: 'int-123', source: 'user', ... },
 *   goals: { primary: { main: {...}, supporting: [...] }, ... },
 *   preferences: { qualityVsSpeed: { bias: 'quality', ... }, ... },
 *   objectives: { functional: [...], nonFunctional: [...], ... },
 *   modality: { primary: 'code', code: { language: 'typescript', ... } }
 * };
 * ```
 */
export interface IntentSpace {
  /** Intent metadata */
  metadata: IntentMetadata;

  /** g: Goals Dimension - 目標次元 */
  goals: GoalsDimension;

  /** p: Preferences Dimension - 選好次元 */
  preferences: PreferencesDimension;

  /** o: Objectives Dimension - 目的次元 */
  objectives: ObjectivesDimension;

  /** m: Modality Dimension - 様式次元 */
  modality: ModalityDimension;
}

// ============================================================================
// Intent Processing
// ============================================================================

/**
 * Intent validation result
 */
export interface IntentValidation {
  valid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  suggestions: string[];
}

/**
 * Intent refinement suggestion
 */
export interface IntentRefinement {
  original: Partial<IntentSpace>;
  refined: Partial<IntentSpace>;
  reason: string;
  confidence: number;
}

/**
 * Validate an intent specification
 */
export type IntentValidator = (intent: IntentSpace) => IntentValidation;

/**
 * Refine an intent based on context
 */
export type IntentRefiner = (
  intent: IntentSpace,
  context: Record<string, unknown>
) => IntentRefinement;

/**
 * Parse natural language into intent
 */
export type IntentParser = (
  naturalLanguage: string,
  context?: Record<string, unknown>
) => Promise<IntentSpace>;

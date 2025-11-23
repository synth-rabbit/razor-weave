/**
 * Routing Configuration - Default routing configuration for the Smart Router.
 *
 * Defines handler agents and escalation targets for different rejection types.
 */

import type { RejectionType } from './rejection-tracker.js';

/**
 * Handler agent identifiers for processing rejections
 */
export const HANDLER_AGENTS = {
  /** Handles style-related rejections (voice, tone, formatting) */
  STYLE_EDITOR: 'style-editor',
  /** Handles mechanics rejections (grammar, spelling, punctuation) */
  MECHANICS_REVIEWER: 'mechanics-reviewer',
  /** Handles clarity rejections (unclear instructions, ambiguous text) */
  CLARITY_EDITOR: 'clarity-editor',
  /** Handles scope rejections (out of scope content, missing requirements) */
  SCOPE_REVIEWER: 'scope-reviewer',
  /** Generic handler for unknown rejection types */
  GENERIC_HANDLER: 'generic-handler',
} as const;

/**
 * Escalation target identifiers
 */
export const ESCALATION_TARGETS = {
  /** Human reviewer for critical issues requiring human judgment */
  HUMAN_REVIEWER: 'human-reviewer',
  /** Senior editor for complex issues needing expert attention */
  SENIOR_EDITOR: 'senior-editor',
  /** Default escalation target */
  DEFAULT: 'human-reviewer',
} as const;

/**
 * Type for handler agent values
 */
export type HandlerAgent = (typeof HANDLER_AGENTS)[keyof typeof HANDLER_AGENTS];

/**
 * Type for escalation target values
 */
export type EscalationTarget = (typeof ESCALATION_TARGETS)[keyof typeof ESCALATION_TARGETS];

/**
 * Configuration for routing a specific rejection type
 */
export interface RouteConfig {
  /** The rejection type this route handles */
  rejectionType: RejectionType;
  /** The handler agent to route to */
  handlerAgent: string;
  /** Maximum retries before escalation */
  maxRetries: number;
  /** Target for escalation when max retries exceeded */
  escalationTarget: string;
}

/**
 * Default maximum retries before escalation
 */
export const DEFAULT_MAX_RETRIES = 3;

/**
 * Default routing configuration mapping rejection types to handlers
 */
export const DEFAULT_ROUTE_CONFIG: RouteConfig[] = [
  {
    rejectionType: 'style',
    handlerAgent: HANDLER_AGENTS.STYLE_EDITOR,
    maxRetries: DEFAULT_MAX_RETRIES,
    escalationTarget: ESCALATION_TARGETS.SENIOR_EDITOR,
  },
  {
    rejectionType: 'mechanics',
    handlerAgent: HANDLER_AGENTS.MECHANICS_REVIEWER,
    maxRetries: DEFAULT_MAX_RETRIES,
    escalationTarget: ESCALATION_TARGETS.HUMAN_REVIEWER,
  },
  {
    rejectionType: 'clarity',
    handlerAgent: HANDLER_AGENTS.CLARITY_EDITOR,
    maxRetries: DEFAULT_MAX_RETRIES,
    escalationTarget: ESCALATION_TARGETS.SENIOR_EDITOR,
  },
  {
    rejectionType: 'scope',
    handlerAgent: HANDLER_AGENTS.SCOPE_REVIEWER,
    maxRetries: DEFAULT_MAX_RETRIES,
    escalationTarget: ESCALATION_TARGETS.HUMAN_REVIEWER,
  },
];

/**
 * Get the default route config for a specific rejection type
 * @param type - The rejection type
 * @returns The route config or undefined if not found
 */
export function getDefaultRouteForType(type: RejectionType): RouteConfig | undefined {
  return DEFAULT_ROUTE_CONFIG.find((config) => config.rejectionType === type);
}

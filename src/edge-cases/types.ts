/**
 * Types for edge case and error scenario test generation
 */

/**
 * Categories of edge cases to test
 */
export type EdgeCaseCategory =
  | 'null-undefined'
  | 'empty-values'
  | 'boundary-values'
  | 'invalid-types'
  | 'async-errors'
  | 'numeric-edge-cases'
  | 'string-edge-cases'
  | 'array-edge-cases'
  | 'object-edge-cases';

/**
 * Edge case definition with input and expected behavior
 */
export interface EdgeCase {
  /** Unique identifier for the edge case */
  id: string;
  /** Category of edge case */
  category: EdgeCaseCategory;
  /** Human-readable description */
  description: string;
  /** Test input value (as string for code generation) */
  input: string;
  /** Expected behavior description */
  expectedBehavior: 'throw' | 'return-null' | 'return-empty' | 'return-default' | 'return-safe' | 'validate-type';
  /** Expected error type if throwing */
  expectedErrorType?: string;
  /** Whether this edge case was detected from code analysis */
  autoDetected: boolean;
}

/**
 * Error scenario for async operations
 */
export interface AsyncErrorScenario {
  /** Unique identifier */
  id: string;
  /** Type of async error scenario */
  type: 'timeout' | 'network-error' | 'rejection' | 'cancellation' | 'race-condition';
  /** Description of the scenario */
  description: string;
  /** Code to set up the error condition */
  setupCode: string;
  /** Code to verify error handling */
  verifyCode: string;
}

/**
 * Potential error condition detected in source code
 */
export interface DetectedErrorCondition {
  /** Location in code */
  location: {
    line: number;
    column: number;
    functionName?: string;
  };
  /** Type of error condition */
  conditionType:
    | 'division-by-zero-risk'
    | 'null-dereference-risk'
    | 'type-coercion-risk'
    | 'array-access-risk'
    | 'async-rejection-risk'
    | 'throw-expression'
    | 'try-catch-block'
    | 'promise-chain-risk';
  /** Severity level */
  severity: 'low' | 'medium' | 'high' | 'critical';
  /** Description of the detected condition */
  description: string;
  /** Suggested test approach */
  suggestedTest: string;
}

/**
 * Boundary value for numeric types
 */
export interface BoundaryValue {
  /** Value category */
  category: 'min' | 'max' | 'zero' | 'negative-max' | 'positive-max' | 'epsilon';
  /** The actual value */
  value: number;
  /** Description */
  description: string;
}

/**
 * Assertion pattern for meaningful assertions beyond equality
 */
export type AssertionPattern =
  | 'toBe'
  | 'toEqual'
  | 'toBeNull'
  | 'toBeUndefined'
  | 'toBeDefined'
  | 'toBeTruthy'
  | 'toBeFalsy'
  | 'toBeGreaterThan'
  | 'toBeLessThan'
  | 'toBeGreaterThanOrEqual'
  | 'toBeLessThanOrEqual'
  | 'toBeCloseTo'
  | 'toContain'
  | 'toHaveLength'
  | 'toHaveProperty'
  | 'toMatch'
  | 'toMatchObject'
  | 'toThrow'
  | 'toThrowError'
  | 'rejects'
  | 'resolves'
  | 'toMatchSnapshot'
  | 'toBeInstanceOf';

/**
 * Enhanced assertion with description
 */
export interface MeaningfulAssertion {
  /** The assertion pattern to use */
  pattern: AssertionPattern;
  /** Expected value or expression */
  expected?: string;
  /** Human-readable description for the assertion */
  description: string;
}

/**
 * Edge case test case metadata
 */
export interface EdgeCaseTestCase {
  /** Test case name */
  name: string;
  /** Category of edge case */
  category: EdgeCaseCategory;
  /** Target function/class name */
  targetName: string;
  /** Is this for a method (vs function) */
  isMethod: boolean;
  /** The edge case being tested */
  edgeCase: EdgeCase;
  /** Assertions to include */
  assertions: MeaningfulAssertion[];
  /** Whether this is an async test */
  isAsync: boolean;
  /** Whether this test expects an error */
  expectsError: boolean;
}

/**
 * Options for edge case generation
 */
export interface EdgeCaseGenerationOptions {
  /** Include null/undefined tests */
  includeNullUndefined: boolean;
  /** Include empty value tests */
  includeEmptyValues: boolean;
  /** Include boundary value tests */
  includeBoundaryValues: boolean;
  /** Include invalid type tests */
  includeInvalidTypes: boolean;
  /** Include async error scenarios */
  includeAsyncErrors: boolean;
  /** Generate meaningful assertions */
  includeMeaningfulAssertions: boolean;
  /** Detect error conditions from code */
  detectErrorConditions: boolean;
  /** Maximum edge cases per parameter */
  maxEdgeCasesPerParam?: number;
}

/**
 * Default options for edge case generation
 */
export const DEFAULT_EDGE_CASE_OPTIONS: EdgeCaseGenerationOptions = {
  includeNullUndefined: true,
  includeEmptyValues: true,
  includeBoundaryValues: true,
  includeInvalidTypes: true,
  includeAsyncErrors: true,
  includeMeaningfulAssertions: true,
  detectErrorConditions: true,
  maxEdgeCasesPerParam: 5,
};

/**
 * Standard boundary values for numbers
 */
export const NUMBER_BOUNDARY_VALUES: BoundaryValue[] = [
  { category: 'zero', value: 0, description: 'Zero value' },
  { category: 'positive-max', value: Number.MAX_SAFE_INTEGER, description: 'Maximum safe integer' },
  { category: 'negative-max', value: -Number.MAX_SAFE_INTEGER, description: 'Minimum safe integer' },
  { category: 'epsilon', value: Number.EPSILON, description: 'Machine epsilon' },
  { category: 'min', value: Number.MIN_VALUE, description: 'Smallest positive value' },
  { category: 'max', value: Number.MAX_VALUE, description: 'Maximum value' },
];

/**
 * Common error patterns for detection
 */
export const ERROR_PATTERN_INDICATORS = [
  'throw new Error',
  'throw new TypeError',
  'throw new RangeError',
  'throw new ReferenceError',
  '.catch(',
  'try {',
  '} catch (',
  'Promise.reject',
  'Promise.resolve',
  'await fetch',
  'fetch(',
  '.then(',
  '/ 0',
  'array[',
  'obj.',
  'if (!',
  'if (',
  '=== null',
  '!== null',
  'typeof',
  'instanceof',
];

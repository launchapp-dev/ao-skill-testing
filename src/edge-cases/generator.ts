/**
 * Generates test code from edge case definitions
 * Produces meaningful assertions beyond simple equality checks
 */

import type {
  EdgeCase,
  EdgeCaseCategory,
  EdgeCaseTestCase,
  MeaningfulAssertion,
  AssertionPattern,
  AsyncErrorScenario,
} from './types.js';

import type {
  AnalyzedModule,
  AnalyzedFunction,
  AnalyzedClass,
} from '../types.js';

import {
  EdgeCaseGenerator,
  ErrorConditionDetector,
} from './detector.js';

export type { EdgeCase, EdgeCaseCategory, EdgeCaseTestCase, MeaningfulAssertion, AssertionPattern, AsyncErrorScenario };

/**
 * Maps edge case category to appropriate assertions
 */
const CATEGORY_ASSERTIONS: Record<EdgeCaseCategory, AssertionPattern[]> = {
  'null-undefined': ['toBeNull', 'toBeUndefined', 'toThrow', 'toBeDefined'],
  'empty-values': ['toHaveLength', 'toEqual', 'toBe', 'toContain'],
  'boundary-values': ['toBe', 'toBeGreaterThan', 'toBeLessThan', 'toBeCloseTo'],
  'invalid-types': ['toThrow', 'toBe', 'toEqual', 'toThrowError'],
  'async-errors': ['rejects', 'toThrow', 'resolves'],
  'numeric-edge-cases': ['toBe', 'toBeCloseTo', 'toBeGreaterThan', 'toBeLessThan'],
  'string-edge-cases': ['toBe', 'toContain', 'toMatch', 'toHaveLength'],
  'array-edge-cases': ['toHaveLength', 'toContain', 'toEqual', 'toBeUndefined'],
  'object-edge-cases': ['toEqual', 'toMatchObject', 'toHaveProperty', 'toBeDefined'],
};

/**
 * Maps expected behavior to the most appropriate assertion
 */
function getBestAssertion(
  category: EdgeCaseCategory,
  expectedBehavior: EdgeCase['expectedBehavior']
): AssertionPattern {
  // Override based on expected behavior
  switch (expectedBehavior) {
    case 'throw':
      return 'toThrow';
    case 'return-null':
      return 'toBeNull';
    case 'return-empty':
      return 'toHaveLength';
    case 'return-default':
      return 'toBeDefined';
    case 'return-safe':
      return 'toBeDefined';
    case 'validate-type':
      return category === 'invalid-types' ? 'toThrow' : 'toBeDefined';
    default:
      return CATEGORY_ASSERTIONS[category][0] || 'toBeDefined';
  }
}

/**
 * Generate assertion with meaningful message
 */
function generateAssertion(
  pattern: AssertionPattern,
  value: string,
  expected?: string
): { code: string; description: string } {
  switch (pattern) {
    case 'toBe':
      return {
        code: `expect(result).toBe(${expected || value});`,
        description: `expect result to be ${expected || value}`,
      };
    case 'toEqual':
      return {
        code: `expect(result).toEqual(${expected || value});`,
        description: `expect result to equal ${expected || value}`,
      };
    case 'toBeNull':
      return {
        code: 'expect(result).toBeNull();',
        description: 'expect result to be null',
      };
    case 'toBeUndefined':
      return {
        code: 'expect(result).toBeUndefined();',
        description: 'expect result to be undefined',
      };
    case 'toBeDefined':
      return {
        code: 'expect(result).toBeDefined();',
        description: 'expect result to be defined',
      };
    case 'toBeTruthy':
      return {
        code: 'expect(result).toBeTruthy();',
        description: 'expect result to be truthy',
      };
    case 'toBeFalsy':
      return {
        code: 'expect(result).toBeFalsy();',
        description: 'expect result to be falsy',
      };
    case 'toBeGreaterThan':
      return {
        code: `expect(result).toBeGreaterThan(${expected || 0});`,
        description: `expect result to be greater than ${expected || 0}`,
      };
    case 'toBeLessThan':
      return {
        code: `expect(result).toBeLessThan(${expected || 0});`,
        description: `expect result to be less than ${expected || 0}`,
      };
    case 'toBeGreaterThanOrEqual':
      return {
        code: `expect(result).toBeGreaterThanOrEqual(${expected || 0});`,
        description: `expect result to be >= ${expected || 0}`,
      };
    case 'toBeLessThanOrEqual':
      return {
        code: `expect(result).toBeLessThanOrEqual(${expected || 0});`,
        description: `expect result to be <= ${expected || 0}`,
      };
    case 'toContain':
      return {
        code: `expect(result).toContain(${expected || 'value'});`,
        description: `expect result to contain ${expected || 'value'}`,
      };
    case 'toHaveLength':
      return {
        code: `expect(result).toHaveLength(${expected || 0});`,
        description: `expect result to have length ${expected || 0}`,
      };
    case 'toMatchObject':
      return {
        code: `expect(result).toMatchObject(${expected || '{}'});`,
        description: `expect result to match object ${expected || '{}'}`,
      };
    case 'toThrow':
      return {
        code: 'expect(() => result).toThrow();',
        description: 'expect function to throw',
      };
    case 'toThrowError':
      return {
        code: `expect(() => result).toThrowError(${expected || 'Error'});`,
        description: `expect function to throw ${expected || 'Error'}`,
      };
    case 'rejects':
      return {
        code: 'await expect(result).rejects.toThrow();',
        description: 'expect promise to reject',
      };
    case 'resolves':
      return {
        code: 'await expect(result).resolves.toBeDefined();',
        description: 'expect promise to resolve',
      };
    case 'toMatchSnapshot':
      return {
        code: 'expect(result).toMatchSnapshot();',
        description: 'expect result to match snapshot',
      };
    case 'toBeInstanceOf':
      return {
        code: `expect(result).toBeInstanceOf(${expected || 'Object'});`,
        description: `expect result to be instance of ${expected || 'Object'}`,
      };
    default:
      return {
        code: 'expect(result).toBeDefined();',
        description: 'expect result to be defined',
      };
  }
}

/**
 * Options for edge case test generation
 */
export interface EdgeCaseTestGeneratorOptions {
  /** Test framework to use */
  framework: 'vitest' | 'jest';
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
  /** Test file suffix */
  testSuffix: string;
  /** Test directory */
  testDirectory: string;
  /** Maximum edge cases per parameter */
  maxEdgeCasesPerParam: number;
}

const DEFAULT_OPTIONS: EdgeCaseTestGeneratorOptions = {
  framework: 'vitest',
  includeNullUndefined: true,
  includeEmptyValues: true,
  includeBoundaryValues: true,
  includeInvalidTypes: true,
  includeAsyncErrors: true,
  includeMeaningfulAssertions: true,
  detectErrorConditions: true,
  testSuffix: '.test',
  testDirectory: '__tests__/edge-cases',
  maxEdgeCasesPerParam: 5,
};

/**
 * Generates test code from edge cases with meaningful assertions
 */
export class EdgeCaseTestGenerator {
  private options: EdgeCaseTestGeneratorOptions;
  private edgeCaseGenerator: EdgeCaseGenerator;
  private errorDetector: ErrorConditionDetector;

  constructor(options: Partial<EdgeCaseTestGeneratorOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.edgeCaseGenerator = new EdgeCaseGenerator({
      includeNullUndefined: this.options.includeNullUndefined,
      includeEmptyValues: this.options.includeEmptyValues,
      includeBoundaryValues: this.options.includeBoundaryValues,
      includeInvalidTypes: this.options.includeInvalidTypes,
      includeAsyncErrors: this.options.includeAsyncErrors,
      includeMeaningfulAssertions: this.options.includeMeaningfulAssertions,
      detectErrorConditions: this.options.detectErrorConditions,
      maxEdgeCasesPerParam: this.options.maxEdgeCasesPerParam,
    });
    this.errorDetector = new ErrorConditionDetector();
  }

  /**
   * Generate edge case tests for a module
   */
  generate(module: AnalyzedModule): GeneratedEdgeCaseTests {
    const edgeCases = this.edgeCaseGenerator.generate(module);
    const testCases = this.createTestCases(module, edgeCases);

    // Group by category for organized output
    const groupedTests = this.groupByCategory(testCases);

    // Generate test file content
    const testFile = this.generateTestFile(module, groupedTests);

    return {
      edgeCases,
      testCases,
      testFile,
      errorConditions: this.errorDetector.detect(module),
    };
  }

  /**
   * Create structured test cases from edge cases
   */
  private createTestCases(
    module: AnalyzedModule,
    edgeCases: EdgeCase[]
  ): EdgeCaseTestCase[] {
    const testCases: EdgeCaseTestCase[] = [];

    edgeCases.forEach(edgeCase => {
      // Find the target function/class from edge case ID
      const match = edgeCase.id.match(/^([a-zA-Z0-9_]+)-/);
      if (match) {
        const targetName = match[1];
        const func = module.functions.find(f => f.name === targetName);
        const cls = module.classes.find(c => c.name === targetName);

        if (func) {
          testCases.push(this.createFunctionTestCase(func, edgeCase, false));
        } else if (cls) {
          const method = cls.methods.find(m => edgeCase.id.includes(m.name));
          if (method) {
            testCases.push(this.createMethodTestCase(cls, method, edgeCase));
          }
        }
      }
    });

    return testCases;
  }

  /**
   * Create a test case for a function
   */
  private createFunctionTestCase(
    func: AnalyzedFunction,
    edgeCase: EdgeCase,
    _isMethod: boolean
  ): EdgeCaseTestCase {
    const assertions = this.generateAssertions(edgeCase);
    const expectsError = edgeCase.expectedBehavior === 'throw';

    return {
      name: `${func.name} - ${edgeCase.description}`,
      category: edgeCase.category,
      targetName: func.name,
      isMethod: false,
      edgeCase,
      assertions,
      isAsync: func.isAsync || edgeCase.category === 'async-errors',
      expectsError,
    };
  }

  /**
   * Create a test case for a class method
   */
  private createMethodTestCase(
    cls: AnalyzedClass,
    method: AnalyzedFunction,
    edgeCase: EdgeCase
  ): EdgeCaseTestCase {
    const assertions = this.generateAssertions(edgeCase);
    const expectsError = edgeCase.expectedBehavior === 'throw';

    return {
      name: `${cls.name}.${method.name} - ${edgeCase.description}`,
      category: edgeCase.category,
      targetName: `${cls.name}.${method.name}`,
      isMethod: true,
      edgeCase,
      assertions,
      isAsync: method.isAsync || edgeCase.category === 'async-errors',
      expectsError,
    };
  }

  /**
   * Generate meaningful assertions for an edge case
   */
  private generateAssertions(edgeCase: EdgeCase): MeaningfulAssertion[] {
    const assertions: MeaningfulAssertion[] = [];
    const bestPattern = getBestAssertion(edgeCase.category, edgeCase.expectedBehavior);

    // Primary assertion
    const { code: _, description } = generateAssertion(bestPattern, edgeCase.input);
    assertions.push({
      pattern: bestPattern,
      expected: edgeCase.expectedErrorType,
      description,
    });

    // Add supplementary assertions for better coverage
    switch (edgeCase.category) {
      case 'null-undefined':
        if (edgeCase.expectedBehavior !== 'throw') {
          assertions.push({
            pattern: 'toBeDefined',
            description: 'result should be defined',
          });
        }
        break;

      case 'empty-values':
        assertions.push({
          pattern: 'toBeDefined',
          description: 'result should be defined even for empty inputs',
        });
        break;

      case 'boundary-values':
        // Add range validation for numeric boundaries
        if (edgeCase.input === '0') {
          assertions.push({
            pattern: 'toBeLessThanOrEqual',
            expected: '1',
            description: 'zero should be less than or equal to 1',
          });
        }
        break;

      case 'async-errors':
        assertions.push({
          pattern: edgeCase.expectedBehavior === 'throw' ? 'rejects' : 'resolves',
          description: edgeCase.expectedBehavior === 'throw'
            ? 'should reject on error'
            : 'should resolve on success',
        });
        break;
    }

    return assertions;
  }

  /**
   * Group test cases by category
   */
  private groupByCategory(
    testCases: EdgeCaseTestCase[]
  ): Map<EdgeCaseCategory, EdgeCaseTestCase[]> {
    const grouped = new Map<EdgeCaseCategory, EdgeCaseTestCase[]>();

    testCases.forEach(tc => {
      const existing = grouped.get(tc.category) || [];
      existing.push(tc);
      grouped.set(tc.category, existing);
    });

    return grouped;
  }

  /**
   * Generate the complete test file content
   */
  private generateTestFile(
    module: AnalyzedModule,
    groupedTests: Map<EdgeCaseCategory, EdgeCaseTestCase[]>
  ): string {
    const lines: string[] = [];
    const framework = this.options.framework;
    const testImport = framework === 'vitest' ? "import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';" : "import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';";

    // Header
    lines.push('/**');
    lines.push(' * Edge case and error scenario tests');
    lines.push(' * Generated by ao-skill-testing');
    lines.push(` * Framework: ${framework}`);
    lines.push(` * Generated: ${new Date().toISOString()}`);
    lines.push(' */');
    lines.push('');
    lines.push(testImport);

    // Import source
    const importPath = this.getImportPath(module.filePath);
    const exports = module.exports.map(e => e.name).filter(n => n);
    if (exports.length > 0) {
      lines.push(`import { ${exports.join(', ')} } from '${importPath}';`);
    }
    lines.push('');

    // Generate describe blocks for each category
    groupedTests.forEach((cases, category) => {
      lines.push(`describe('${this.formatCategoryName(category)}', () => {`);
      lines.push('');

      cases.forEach(tc => {
        lines.push(this.generateTestCase(tc));
        lines.push('');
      });

      lines.push('});');
      lines.push('');
    });

    return lines.join('\n');
  }

  /**
   * Generate a single test case
   */
  private generateTestCase(tc: EdgeCaseTestCase): string {
    const lines: string[] = [];
    const indent = '  ';
    const asyncKeyword = tc.isAsync ? 'async ' : '';

    // Test name
    lines.push(`${indent}describe('${tc.targetName}', () => {`);
    lines.push('');

    // Build arguments based on edge case
    const args = this.buildTestArguments(tc);
    const callExpression = tc.isMethod
      ? `instance.${tc.targetName.split('.').pop()}(${args})`
      : `${tc.targetName}(${args})`;

    // Create the test
    if (tc.isAsync) {
      lines.push(`${indent}  ${asyncKeyword}it('${tc.name}', async () => {`);
    } else {
      lines.push(`${indent}  it('${tc.name}', () => {`);
    }

    // Arrange
    if (tc.isMethod) {
      const clsName = tc.targetName.split('.')[0];
      lines.push(`${indent}    const instance = new ${clsName}(${this.getDefaultConstructorArgs(clsName)});`);
    }

    // Act
    if (tc.expectsError) {
      if (tc.isAsync) {
        lines.push(`${indent}    await expect(${callExpression}).rejects.toThrow();`);
      } else {
        lines.push(`${indent}    expect(() => ${callExpression}).toThrow();`);
      }
    } else {
      if (tc.isAsync) {
        lines.push(`${indent}    const result = await ${callExpression};`);
      } else {
        lines.push(`${indent}    const result = ${callExpression};`);
      }

      // Assert with meaningful assertions
      tc.assertions.forEach(assertion => {
        const { code } = generateAssertion(assertion.pattern, tc.edgeCase.input, assertion.expected);
        lines.push(`${indent}    ${code}`);
      });
    }

    lines.push(`${indent}  });`);

    // Add cleanup for async tests
    if (tc.category === 'async-errors') {
      lines.push('');
      lines.push(`${indent}  afterEach(() => {`);
      lines.push(`${indent}    jest.restoreAllMocks();`);
      lines.push(`${indent}  });`);
    }

    lines.push(`${indent}});`);

    return lines.join('\n');
  }

  /**
   * Build test arguments from edge case input
   */
  private buildTestArguments(tc: EdgeCaseTestCase): string {
    const edgeCase = tc.edgeCase;
    const paramMatch = edgeCase.id.match(/-([a-zA-Z0-9_]+)$/);
    const paramName = paramMatch ? paramMatch[1] : null;

    // Generate default arguments for all parameters
    // For the edge case parameter, use the edge case input
    if (paramName) {
      // Find parameter position and build args
      return edgeCase.input;
    }

    return edgeCase.input;
  }

  /**
   * Get default constructor arguments for a class
   */
  private getDefaultConstructorArgs(className: string): string {
    return 'undefined';
  }

  /**
   * Format category name for describe block
   */
  private formatCategoryName(category: EdgeCaseCategory): string {
    const names: Record<EdgeCaseCategory, string> = {
      'null-undefined': 'Null and Undefined Inputs',
      'empty-values': 'Empty Values',
      'boundary-values': 'Boundary Values',
      'invalid-types': 'Invalid Types',
      'async-errors': 'Async Error Scenarios',
      'numeric-edge-cases': 'Numeric Edge Cases',
      'string-edge-cases': 'String Edge Cases',
      'array-edge-cases': 'Array Edge Cases',
      'object-edge-cases': 'Object Edge Cases',
    };
    return names[category] || category;
  }

  /**
   * Get import path from source file path
   */
  private getImportPath(sourcePath: string): string {
    return sourcePath.replace(/\.(ts|js)$/, '');
  }
}

/**
 * Result of edge case test generation
 */
export interface GeneratedEdgeCaseTests {
  /** All generated edge cases */
  edgeCases: EdgeCase[];
  /** Structured test cases */
  testCases: EdgeCaseTestCase[];
  /** Generated test file content */
  testFile: string;
  /** Detected error conditions */
  errorConditions: import('./types.js').DetectedErrorCondition[];
}

/**
 * Generate async error scenarios for a function
 */
export function generateAsyncErrorScenarios(func: AnalyzedFunction): AsyncErrorScenario[] {
  const scenarios: AsyncErrorScenario[] = [];

  if (!func.isAsync) return scenarios;

  // Timeout scenario
  scenarios.push({
    id: `${func.name}-timeout`,
    type: 'timeout',
    description: `Test ${func.name} with timeout handling`,
    setupCode: `jest.useFakeTimers();
const promise = ${func.name}(${func.parameters.map(() => 'undefined').join(', ')});`,
    verifyCode: `await expect(promise).resolves.toBeDefined();
jest.useRealTimers();`,
  });

  // Network error scenario
  scenarios.push({
    id: `${func.name}-network-error`,
    type: 'network-error',
    description: `Test ${func.name} with network error`,
    setupCode: `global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));`,
    verifyCode: `await expect(${func.name}(${func.parameters.map(() => 'undefined').join(', ')})).rejects.toThrow();`,
  });

  // Rejection scenario
  scenarios.push({
    id: `${func.name}-rejection`,
    type: 'rejection',
    description: `Test ${func.name} with promise rejection`,
    setupCode: `const originalImpl = jest.fn();
originalImpl.mockRejectedValue(new Error('Test rejection'));`,
    verifyCode: `await expect(${func.name}(${func.parameters.map(() => 'undefined').join(', ')})).rejects.toThrow();`,
  });

  return scenarios;
}

/**
 * Export edge case generator for direct use
 */
export { EdgeCaseGenerator, ErrorConditionDetector } from './detector.js';

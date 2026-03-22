/**
 * Analyzes source code to detect potential error conditions
 * and generate edge case scenarios
 */

import type {
  AnalyzedModule,
  AnalyzedFunction,
  AnalyzedClass,
} from '../types.js';
import type {
  EdgeCase,
  EdgeCaseCategory,
  DetectedErrorCondition,
  EdgeCaseGenerationOptions,
} from './types.js';
import {
  NUMBER_BOUNDARY_VALUES as BOUNDARY_VALUES,
  ERROR_PATTERN_INDICATORS,
} from './types.js';

/**
 * Detects potential error conditions in source code
 */
export class ErrorConditionDetector {
  /**
   * Analyze a module for potential error conditions
   */
  detect(module: AnalyzedModule): DetectedErrorCondition[] {
    const conditions: DetectedErrorCondition[] = [];

    // Check functions
    module.functions.forEach(func => {
      conditions.push(...this.detectInFunction(func, module));
    });

    // Check class methods
    module.classes.forEach(cls => {
      cls.methods.forEach(method => {
        conditions.push(...this.detectInFunction(method, module, cls.name));
      });
    });

    return conditions;
  }

  /**
   * Detect error conditions in a function
   */
  private detectInFunction(
    func: AnalyzedFunction,
    module: AnalyzedModule,
    className?: string
  ): DetectedErrorCondition[] {
    const conditions: DetectedErrorCondition[] = [];
    const body = func.body;
    const location = {
      line: func.lineNumber,
      column: 0,
      functionName: className ? `${className}.${func.name}` : func.name,
    };

    // Check for division operations (potential division by zero)
    if (body.includes('/') || body.includes('%')) {
      const paramNames = func.parameters.map(p => p.name);
      if (paramNames.some(p => body.includes(p))) {
        conditions.push({
          location,
          conditionType: 'division-by-zero-risk',
          severity: 'medium',
          description: 'Potential division or modulo operation may receive zero value',
          suggestedTest: 'Test with zero and negative zero values',
        });
      }
    }

    // Check for null/undefined access patterns
    if (body.includes('?.') || body.includes('!.')) {
      conditions.push({
        location,
        conditionType: 'null-dereference-risk',
        severity: 'high',
        description: 'Optional chaining or non-null assertion used - risk of null/undefined',
        suggestedTest: 'Test with null and undefined inputs',
      });
    }

    // Check for array access
    if (body.includes('[') && body.includes(']')) {
      conditions.push({
        location,
        conditionType: 'array-access-risk',
        severity: 'medium',
        description: 'Array indexing may cause out-of-bounds access',
        suggestedTest: 'Test with empty arrays and out-of-bounds indices',
      });
    }

    // Check for type coercion patterns
    if (
      body.includes('==') ||
      body.includes('!=') ||
      body.includes('Number(') ||
      body.includes('String(') ||
      body.includes('Boolean(')
    ) {
      conditions.push({
        location,
        conditionType: 'type-coercion-risk',
        severity: 'low',
        description: 'Type coercion may cause unexpected behavior',
        suggestedTest: 'Test with various types including null, undefined, empty strings',
      });
    }

    // Check for async/rejection patterns
    if (func.isAsync || body.includes('Promise')) {
      conditions.push({
        location,
        conditionType: 'async-rejection-risk',
        severity: 'high',
        description: 'Async function may throw or reject unexpectedly',
        suggestedTest: 'Test async rejection scenarios and timeout handling',
      });
    }

    // Check for throw expressions
    if (body.includes('throw')) {
      conditions.push({
        location,
        conditionType: 'throw-expression',
        severity: 'critical',
        description: 'Function explicitly throws errors',
        suggestedTest: 'Test all throw paths with correct error types',
      });
    }

    // Check for try-catch blocks
    if (body.includes('try') || body.includes('catch')) {
      conditions.push({
        location,
        conditionType: 'try-catch-block',
        severity: 'medium',
        description: 'Error handling with try-catch may fail or miss edge cases',
        suggestedTest: 'Test error scenarios and verify catch block behavior',
      });
    }

    // Check for promise chains
    if (body.includes('.then') || body.includes('.catch') || body.includes('.finally')) {
      conditions.push({
        location,
        conditionType: 'promise-chain-risk',
        severity: 'medium',
        description: 'Promise chain may have unhandled rejection paths',
        suggestedTest: 'Test promise rejection and chain error propagation',
      });
    }

    return conditions;
  }

  /**
   * Detect specific error patterns in code
   */
  detectPatterns(code: string): DetectedErrorCondition[] {
    const conditions: DetectedErrorCondition[] = [];

    ERROR_PATTERN_INDICATORS.forEach(pattern => {
      let index = 0;
      while ((index = code.indexOf(pattern, index)) !== -1) {
        const lines = code.substring(0, index).split('\n');
        conditions.push({
          location: {
            line: lines.length,
            column: (lines[lines.length - 1]?.length || 0),
          },
          conditionType: this.categorizePattern(pattern),
          severity: this.estimateSeverity(pattern),
          description: `Found pattern: ${pattern}`,
          suggestedTest: this.suggestTest(pattern),
        });
        index += pattern.length;
      }
    });

    return conditions;
  }

  /**
   * Categorize error pattern type
   */
  private categorizePattern(pattern: string): DetectedErrorCondition['conditionType'] {
    if (pattern.includes('throw new Error')) return 'throw-expression';
    if (pattern.includes('catch')) return 'try-catch-block';
    if (pattern.includes('Promise.reject') || pattern.includes('.catch(')) return 'async-rejection-risk';
    if (pattern.includes('fetch')) return 'async-rejection-risk';
    if (pattern.includes('/ 0')) return 'division-by-zero-risk';
    if (pattern.includes('array[') || pattern.includes('[')) return 'array-access-risk';
    return 'throw-expression';
  }

  /**
   * Estimate severity based on pattern
   */
  private estimateSeverity(pattern: string): DetectedErrorCondition['severity'] {
    if (pattern.includes('throw new Error') || pattern.includes('throw new TypeError')) {
      return 'critical';
    }
    if (pattern.includes('catch') || pattern.includes('Promise')) {
      return 'medium';
    }
    if (pattern.includes('/ 0')) {
      return 'high';
    }
    return 'low';
  }

  /**
   * Suggest test approach based on pattern
   */
  private suggestTest(pattern: string): string {
    if (pattern.includes('throw')) return 'Verify correct error type and message';
    if (pattern.includes('catch')) return 'Test error propagation and handling';
    if (pattern.includes('Promise')) return 'Test rejection and timeout scenarios';
    if (pattern.includes('/ 0')) return 'Test with zero and negative values';
    return 'Add appropriate edge case test';
  }
}

/**
 * Generates edge cases based on function signatures and detected conditions
 */
export class EdgeCaseGenerator {
  private options: EdgeCaseGenerationOptions;
  private detector: ErrorConditionDetector;

  constructor(options: Partial<EdgeCaseGenerationOptions> = {}) {
    this.options = {
      includeNullUndefined: true,
      includeEmptyValues: true,
      includeBoundaryValues: true,
      includeInvalidTypes: true,
      includeAsyncErrors: true,
      includeMeaningfulAssertions: true,
      detectErrorConditions: true,
      maxEdgeCasesPerParam: 5,
      ...options,
    };
    this.detector = new ErrorConditionDetector();
  }

  /**
   * Generate edge cases for a module
   */
  generate(module: AnalyzedModule): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    // Detect error conditions from code analysis
    if (this.options.detectErrorConditions) {
      const detectedConditions = this.detector.detect(module);
      edgeCases.push(...this.conditionsToEdgeCases(detectedConditions));
    }

    // Generate edge cases for functions
    module.functions.filter(f => f.isExported).forEach(func => {
      edgeCases.push(...this.generateForFunction(func));
    });

    // Generate edge cases for classes
    module.classes.filter(c => c.isExported).forEach(cls => {
      cls.methods.forEach(method => {
        edgeCases.push(...this.generateForMethod(cls, method));
      });
    });

    return this.deduplicateEdgeCases(edgeCases);
  }

  /**
   * Convert detected conditions to edge cases
   */
  private conditionsToEdgeCases(conditions: DetectedErrorCondition[]): EdgeCase[] {
    return conditions.map(condition => ({
      id: `detected-${condition.conditionType}-${condition.location.line}`,
      category: this.conditionTypeToCategory(condition.conditionType),
      description: condition.description,
      input: this.suggestInput(condition),
      expectedBehavior: condition.conditionType.includes('throw') ? 'throw' : 'return-safe',
      expectedErrorType: condition.conditionType.includes('throw') ? 'Error' : undefined,
      autoDetected: true,
    }));
  }

  /**
   * Map condition type to edge case category
   */
  private conditionTypeToCategory(
    type: DetectedErrorCondition['conditionType']
  ): EdgeCaseCategory {
    switch (type) {
      case 'null-dereference-risk':
      case 'array-access-risk':
        return 'null-undefined';
      case 'division-by-zero-risk':
        return 'numeric-edge-cases';
      case 'type-coercion-risk':
        return 'invalid-types';
      case 'async-rejection-risk':
      case 'promise-chain-risk':
        return 'async-errors';
      default:
        return 'null-undefined';
    }
  }

  /**
   * Suggest input for condition
   */
  private suggestInput(condition: DetectedErrorCondition): string {
    switch (condition.conditionType) {
      case 'division-by-zero-risk':
        return '0';
      case 'null-dereference-risk':
        return 'null';
      case 'array-access-risk':
        return '[]';
      case 'type-coercion-risk':
        return 'undefined';
      case 'async-rejection-risk':
        return 'Promise.reject(new Error("test"))';
      default:
        return 'null';
    }
  }

  /**
   * Generate edge cases for a function
   */
  generateForFunction(func: AnalyzedFunction): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];

    func.parameters.forEach(param => {
      edgeCases.push(...this.generateForParameter(func.name, param));
    });

    return edgeCases;
  }

  /**
   * Generate edge cases for a class method
   */
  generateForMethod(cls: AnalyzedClass, method: AnalyzedFunction): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];
    const targetName = `${cls.name}.${method.name}`;

    method.parameters.forEach(param => {
      edgeCases.push(...this.generateForParameter(targetName, param));
    });

    return edgeCases;
  }

  /**
   * Generate edge cases for a single parameter
   */
  private generateForParameter(
    funcName: string,
    param: { name: string; type?: string; optional: boolean }
  ): EdgeCase[] {
    const edgeCases: EdgeCase[] = [];
    const type = param.type || 'unknown';
    const baseId = `${funcName}-${param.name}`;

    // Null/undefined edge cases
    if (this.options.includeNullUndefined) {
      if (!param.optional) {
        edgeCases.push({
          id: `${baseId}-null`,
          category: 'null-undefined',
          description: `Test ${funcName} with null ${param.name}`,
          input: 'null',
          expectedBehavior: type.includes('null') || type.includes('undefined') ? 'return-null' : 'throw',
          autoDetected: false,
        });
      }

      edgeCases.push({
        id: `${baseId}-undefined`,
        category: 'null-undefined',
        description: `Test ${funcName} with undefined ${param.name}`,
        input: 'undefined',
        expectedBehavior: type.includes('undefined') || param.optional ? 'return-default' : 'throw',
        autoDetected: false,
      });
    }

    // Empty value edge cases
    if (this.options.includeEmptyValues) {
      if (type.includes('string')) {
        edgeCases.push({
          id: `${baseId}-empty-string`,
          category: 'empty-values',
          description: `Test ${funcName} with empty string`,
          input: "''",
          expectedBehavior: 'return-safe',
          autoDetected: false,
        });
      }

      if (type.includes('array') || type.includes('Array')) {
        edgeCases.push({
          id: `${baseId}-empty-array`,
          category: 'empty-values',
          description: `Test ${funcName} with empty array`,
          input: '[]',
          expectedBehavior: 'return-empty',
          autoDetected: false,
        });
      }

      if (type.includes('object') && !type.includes('{}')) {
        edgeCases.push({
          id: `${baseId}-empty-object`,
          category: 'empty-values',
          description: `Test ${funcName} with empty object`,
          input: '{}',
          expectedBehavior: 'return-safe',
          autoDetected: false,
        });
      }
    }

    // Boundary value edge cases
    if (this.options.includeBoundaryValues && type.includes('number')) {
      BOUNDARY_VALUES.forEach(bv => {
        edgeCases.push({
          id: `${baseId}-boundary-${bv.category}`,
          category: 'numeric-edge-cases',
          description: `Test ${funcName} with boundary value: ${bv.description}`,
          input: String(bv.value),
          expectedBehavior: bv.category === 'zero' ? 'return-safe' : 'validate-type',
          autoDetected: false,
        });
      });
    }

    // Invalid type edge cases
    if (this.options.includeInvalidTypes) {
      if (type.includes('string')) {
        edgeCases.push({
          id: `${baseId}-invalid-string-type`,
          category: 'invalid-types',
          description: `Test ${funcName} with non-string value for ${param.name}`,
          input: '123',
          expectedBehavior: 'validate-type',
          autoDetected: false,
        });
      }

      if (type.includes('number')) {
        edgeCases.push({
          id: `${baseId}-invalid-number-type`,
          category: 'invalid-types',
          description: `Test ${funcName} with non-number value for ${param.name}`,
          input: '"not a number"',
          expectedBehavior: 'validate-type',
          autoDetected: false,
        });
      }

      if (type.includes('boolean')) {
        edgeCases.push({
          id: `${baseId}-invalid-boolean-type`,
          category: 'invalid-types',
          description: `Test ${funcName} with non-boolean value for ${param.name}`,
          input: '"true"',
          expectedBehavior: 'validate-type',
          autoDetected: false,
        });
      }
    }

    // String-specific edge cases
    if (this.options.includeBoundaryValues && type.includes('string')) {
      edgeCases.push(
        {
          id: `${baseId}-whitespace`,
          category: 'string-edge-cases',
          description: `Test ${funcName} with whitespace-only string`,
          input: "'   '",
          expectedBehavior: 'return-safe',
          autoDetected: false,
        },
        {
          id: `${baseId}-unicode`,
          category: 'string-edge-cases',
          description: `Test ${funcName} with unicode characters`,
          input: "'🎉🔥💻'",
          expectedBehavior: 'return-safe',
          autoDetected: false,
        },
        {
          id: `${baseId}-special-chars`,
          category: 'string-edge-cases',
          description: `Test ${funcName} with special characters`,
          input: "'<>\\'\\\"&'",
          expectedBehavior: 'return-safe',
          autoDetected: false,
        }
      );
    }

    // Array-specific edge cases
    if (this.options.includeBoundaryValues && (type.includes('array') || type.includes('[]'))) {
      edgeCases.push(
        {
          id: `${baseId}-large-array`,
          category: 'array-edge-cases',
          description: `Test ${funcName} with large array`,
          input: 'new Array(10000)',
          expectedBehavior: 'return-safe',
          autoDetected: false,
        },
        {
          id: `${baseId}-sparse-array`,
          category: 'array-edge-cases',
          description: `Test ${funcName} with sparse array`,
          input: 'Array(5).fill(undefined)',
          expectedBehavior: 'return-safe',
          autoDetected: false,
        }
      );
    }

    // Object edge cases
    if (this.options.includeBoundaryValues && type.includes('object')) {
      edgeCases.push(
        {
          id: `${baseId}-nested-object`,
          category: 'object-edge-cases',
          description: `Test ${funcName} with deeply nested object`,
          input: '{ a: { b: { c: { d: {} } } } }',
          expectedBehavior: 'return-safe',
          autoDetected: false,
        },
        {
          id: `${baseId}-circular-object`,
          category: 'object-edge-cases',
          description: `Test ${funcName} with circular reference`,
          input: '(const o = {}; o.self = o; o)',
          expectedBehavior: 'return-safe',
          autoDetected: false,
        }
      );
    }

    // Limit edge cases per parameter
    return edgeCases.slice(0, this.options.maxEdgeCasesPerParam);
  }

  /**
   * Remove duplicate edge cases
   */
  private deduplicateEdgeCases(edgeCases: EdgeCase[]): EdgeCase[] {
    const seen = new Set<string>();
    return edgeCases.filter(ec => {
      const key = `${ec.category}-${ec.input}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

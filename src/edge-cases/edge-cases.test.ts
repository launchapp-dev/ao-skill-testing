/**
 * Tests for edge case detection and generation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  EdgeCaseGenerator,
  ErrorConditionDetector,
  EdgeCaseTestGenerator,
  type EdgeCase,
  type EdgeCaseCategory,
  type DetectedErrorCondition,
} from '../index.js';
import type { AnalyzedModule } from '../types.js';

// Mock dependencies
vi.mock('ts-morph', () => {
  const actual = vi.importActual('ts-morph');
  return {
    ...actual,
    Project: vi.fn().mockImplementation(() => ({
      createSourceFile: vi.fn(),
    })),
  };
});

describe('ErrorConditionDetector', () => {
  let detector: ErrorConditionDetector;

  beforeEach(() => {
    detector = new ErrorConditionDetector();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('detect', () => {
    it('should detect division by zero risk', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'divide',
            parameters: [{ name: 'a', type: 'number', optional: false }],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return a / 0;',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'division-by-zero-risk',
          severity: 'medium',
        })
      );
    });

    it('should detect null dereference risk with optional chaining', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'getNested',
            parameters: [{ name: 'obj', type: 'object', optional: false }],
            returnType: 'any',
            isAsync: false,
            isExported: true,
            body: 'return obj?.nested?.value;',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'null-dereference-risk',
          severity: 'high',
        })
      );
    });

    it('should detect async rejection risk', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'fetchData',
            parameters: [],
            returnType: 'Promise<string>',
            isAsync: true,
            isExported: true,
            body: 'return fetch(url);',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'async-rejection-risk',
          severity: 'high',
        })
      );
    });

    it('should detect throw expressions', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'validate',
            parameters: [{ name: 'value', type: 'string', optional: false }],
            returnType: 'void',
            isAsync: false,
            isExported: true,
            body: 'if (!value) throw new Error("Invalid");',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'throw-expression',
          severity: 'critical',
        })
      );
    });

    it('should detect try-catch blocks', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'safeParse',
            parameters: [{ name: 'json', type: 'string', optional: false }],
            returnType: 'object',
            isAsync: false,
            isExported: true,
            body: 'try { return JSON.parse(json); } catch (e) { return {}; }',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'try-catch-block',
          severity: 'medium',
        })
      );
    });

    it('should detect type coercion patterns', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'coerceValue',
            parameters: [{ name: 'val', type: 'any', optional: false }],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return Number(val);',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'type-coercion-risk',
          severity: 'low',
        })
      );
    });

    it('should detect promise chain risks', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'chainedFetch',
            parameters: [{ name: 'url', type: 'string', optional: false }],
            returnType: 'Promise<any>',
            isAsync: false,
            isExported: true,
            body: 'return fetch(url).then(r => r.json()).catch(e => null);',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const conditions = detector.detect(module);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'promise-chain-risk',
          severity: 'medium',
        })
      );
    });
  });

  describe('detectPatterns', () => {
    it('should detect throw patterns in code', () => {
      const code = `
        function test() {
          throw new Error('test');
        }
      `;

      const conditions = detector.detectPatterns(code);

      expect(conditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'throw-expression',
          severity: 'critical',
        })
      );
    });

    it('should detect multiple patterns in code', () => {
      const code = `
        async function test() {
          try {
            await fetch('/api').then(r => r.json());
          } catch (e) {
            throw new Error('Failed');
          }
        }
      `;

      const conditions = detector.detectPatterns(code);

      expect(conditions.length).toBeGreaterThan(0);
      expect(conditions.some(c => c.conditionType === 'throw-expression')).toBe(true);
    });
  });
});

describe('EdgeCaseGenerator', () => {
  let generator: EdgeCaseGenerator;

  beforeEach(() => {
    generator = new EdgeCaseGenerator({
      includeNullUndefined: true,
      includeEmptyValues: true,
      includeBoundaryValues: true,
      includeInvalidTypes: true,
      includeAsyncErrors: true,
      includeMeaningfulAssertions: true,
      detectErrorConditions: true,
      maxEdgeCasesPerParam: 5,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('generate', () => {
    it('should generate null/undefined edge cases', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'processValue',
            parameters: [{ name: 'value', type: 'string', optional: false }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      expect(edgeCases.some(ec => ec.category === 'null-undefined')).toBe(true);
      expect(edgeCases.some(ec => ec.id.includes('null'))).toBe(true);
      expect(edgeCases.some(ec => ec.id.includes('undefined'))).toBe(true);
    });

    it('should generate empty value edge cases for strings', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'formatString',
            parameters: [{ name: 'input', type: 'string', optional: false }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      expect(edgeCases.some(ec => ec.category === 'empty-values')).toBe(true);
      expect(edgeCases.some(ec => ec.id.includes('empty-string'))).toBe(true);
    });

    it('should generate boundary value edge cases for numbers', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'calculate',
            parameters: [{ name: 'num', type: 'number', optional: false }],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      // Should generate numeric edge cases for number type
      expect(edgeCases.some(ec => ec.category === 'numeric-edge-cases' || ec.category === 'boundary-values')).toBe(true);
      expect(edgeCases.some(ec => ec.input === '0')).toBe(true);
    });

    it('should generate edge cases for various types', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'validateNumber',
            parameters: [{ name: 'num', type: 'number', optional: false }],
            returnType: 'boolean',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      // Should have edge cases generated for the number parameter
      expect(edgeCases.length).toBeGreaterThan(0);
    });

    it('should deduplicate edge cases', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'testFunc',
            parameters: [
              { name: 'a', type: 'string', optional: false },
              { name: 'b', type: 'string', optional: false },
            ],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      // Check no duplicates based on category and input
      const uniqueKeys = new Set(
        edgeCases.map(ec => `${ec.category}-${ec.input}`)
      );

      expect(edgeCases.length).toBe(uniqueKeys.size);
    });

    it('should respect maxEdgeCasesPerParam limit', () => {
      const limitedGenerator = new EdgeCaseGenerator({
        maxEdgeCasesPerParam: 2,
        includeNullUndefined: true,
        includeEmptyValues: true,
        includeBoundaryValues: true,
        includeInvalidTypes: true,
        includeAsyncErrors: false,
        includeMeaningfulAssertions: false,
        detectErrorConditions: false,
      });

      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'testFunc',
            parameters: [{ name: 'param', type: 'string', optional: false }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = limitedGenerator.generate(module);

      // Should be limited to maxEdgeCasesPerParam per parameter
      expect(edgeCases.length).toBeLessThanOrEqual(2);
    });
  });

  describe('edge case behavior expectations', () => {
    it('should have edge cases with expected behaviors defined', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'nullableFunc',
            parameters: [{ name: 'input', type: 'string | null', optional: true }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      // Should have edge cases with defined expectedBehavior
      expect(edgeCases.length).toBeGreaterThan(0);
      edgeCases.forEach(ec => {
        expect(ec.expectedBehavior).toBeDefined();
        expect(['throw', 'return-null', 'return-empty', 'return-default', 'return-safe', 'validate-type']).toContain(ec.expectedBehavior);
      });
    });

    it('should mark auto-detected cases appropriately', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'riskyFunc',
            parameters: [{ name: 'x', type: 'number', optional: false }],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return x / y;', // Reference to undefined y
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [],
        imports: [],
      };

      const edgeCases = generator.generate(module);

      // Should have some auto-detected edge cases from code analysis
      expect(edgeCases.some(ec => ec.autoDetected === true)).toBe(true);
    });
  });
});

describe('EdgeCaseTestGenerator', () => {
  let testGenerator: EdgeCaseTestGenerator;

  beforeEach(() => {
    testGenerator = new EdgeCaseTestGenerator({
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
    });
  });

  describe('generate', () => {
    it('should generate test file content', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'processInput',
            parameters: [{ name: 'value', type: 'string', optional: false }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: 'return value.trim();',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'processInput', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.testFile).toBeDefined();
      expect(result.testFile).toContain("import { describe, it, expect");
      expect(result.testFile).toContain("describe('Null and Undefined Inputs'");
      expect(result.testFile).toContain("describe('Empty Values'");
      expect(result.edgeCases.length).toBeGreaterThan(0);
      expect(result.testCases.length).toBeGreaterThan(0);
    });

    it('should include meaningful assertions in generated tests', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'findItem',
            parameters: [{ name: 'arr', type: 'array', optional: false }],
            returnType: 'any',
            isAsync: false,
            isExported: true,
            body: 'return arr[0];',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'findItem', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      // Should have meaningful assertions like toHaveLength, toBeDefined, etc.
      expect(result.testFile).toContain('.toHaveLength');
      expect(result.testFile).toContain('.toBeDefined');
    });

    it('should include async error scenarios for async functions', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'fetchData',
            parameters: [{ name: 'url', type: 'string', optional: false }],
            returnType: 'Promise<any>',
            isAsync: true,
            isExported: true,
            body: 'return fetch(url);',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'fetchData', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.errorConditions.length).toBeGreaterThan(0);
      expect(result.errorConditions.some(ec => ec.conditionType === 'async-rejection-risk')).toBe(true);
    });

    it('should detect error conditions from code analysis', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'divide',
            parameters: [
              { name: 'a', type: 'number', optional: false },
              { name: 'b', type: 'number', optional: false },
            ],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'if (b === 0) throw new Error("Division by zero"); return a / b;',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'divide', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.errorConditions).toContainEqual(
        expect.objectContaining({
          conditionType: 'throw-expression',
          severity: 'critical',
        })
      );
    });

    it('should generate tests for functions', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'processInput',
            parameters: [{ name: 'value', type: 'string', optional: false }],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: 'return value.trim();',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'processInput', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.testFile).toBeDefined();
      expect(result.testFile).toContain("import { describe, it, expect");
      expect(result.edgeCases.length).toBeGreaterThan(0);
      expect(result.testCases.length).toBeGreaterThan(0);
    });

    it('should group tests by category', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'testFunc',
            parameters: [
              { name: 'str', type: 'string', optional: false },
              { name: 'num', type: 'number', optional: false },
              { name: 'arr', type: 'array', optional: false },
            ],
            returnType: 'any',
            isAsync: false,
            isExported: true,
            body: '',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'testFunc', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.testFile).toContain("describe('Null and Undefined Inputs'");
      expect(result.testFile).toContain("describe('Empty Values'");
      expect(result.testFile).toContain("describe('Numeric Edge Cases'");
    });
  });

  describe('assertion generation', () => {
    it('should include meaningful assertions in generated tests', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'findItem',
            parameters: [{ name: 'arr', type: 'array', optional: false }],
            returnType: 'any',
            isAsync: false,
            isExported: true,
            body: 'return arr[0];',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'findItem', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      // Should have meaningful assertions like toHaveLength, toBeDefined, etc.
      expect(result.testFile).toContain('.toHaveLength');
      expect(result.testFile).toContain('.toBeDefined');
    });

    it('should generate test cases with assertions', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'nullableOp',
            parameters: [{ name: 'input', type: 'string | null', optional: true }],
            returnType: 'string | null',
            isAsync: false,
            isExported: true,
            body: 'return input;',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'nullableOp', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      // Check that test cases include assertions
      expect(result.testCases.length).toBeGreaterThan(0);
      result.testCases.forEach(tc => {
        expect(tc.assertions).toBeDefined();
        expect(tc.assertions.length).toBeGreaterThan(0);
      });
    });

    it('should use toHaveLength for empty array tests', () => {
      const module: AnalyzedModule = {
        filePath: 'test.ts',
        functions: [
          {
            name: 'filterItems',
            parameters: [{ name: 'items', type: 'array', optional: false }],
            returnType: 'array',
            isAsync: false,
            isExported: true,
            body: 'return items.filter(i => i);',
            lineNumber: 1,
          },
        ],
        classes: [],
        exports: [{ name: 'filterItems', type: 'function', kind: 'function' }],
        imports: [],
      };

      const result = testGenerator.generate(module);

      expect(result.testFile).toContain('.toHaveLength');
    });
  });
});

describe('Edge case categories', () => {
  it('should generate edge cases across multiple categories', () => {
    const categories: EdgeCaseCategory[] = [
      'null-undefined',
      'empty-values',
      'boundary-values',
      'invalid-types',
      'async-errors',
      'numeric-edge-cases',
      'string-edge-cases',
      'array-edge-cases',
      'object-edge-cases',
    ];

    const generator = new EdgeCaseGenerator({
      includeNullUndefined: true,
      includeEmptyValues: true,
      includeBoundaryValues: true,
      includeInvalidTypes: true,
      includeAsyncErrors: true,
      includeMeaningfulAssertions: true,
      detectErrorConditions: true,
      maxEdgeCasesPerParam: 10,
    });

    const module: AnalyzedModule = {
      filePath: 'test.ts',
      functions: [
        {
          name: 'fullTest',
          parameters: [
            { name: 'str', type: 'string', optional: false },
            { name: 'num', type: 'number', optional: false },
            { name: 'arr', type: 'array', optional: false },
            { name: 'obj', type: 'object', optional: false },
          ],
          returnType: 'any',
          isAsync: true,
          isExported: true,
          body: 'return Promise.resolve(null);',
          lineNumber: 1,
        },
      ],
      classes: [],
      exports: [],
      imports: [],
    };

    const edgeCases = generator.generate(module);
    const foundCategories = new Set(edgeCases.map(ec => ec.category));

    // At least some categories should be covered
    expect(edgeCases.length).toBeGreaterThan(0);
    
    // Each category should be represented if the generator is working
    const coveredCategories = categories.filter(c => foundCategories.has(c));
    expect(coveredCategories.length).toBeGreaterThan(0);
  });
});

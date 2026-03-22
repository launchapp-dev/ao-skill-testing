/**
 * Unit tests for the Vitest Unit Test Generation Agent
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { VitestUnitTestAgent, generateVitestTests } from '../agents/vitest.js';
import type { TestGenerationResult, SourceFile } from '../types.js';

describe('VitestUnitTestAgent', () => {
  let agent: VitestUnitTestAgent;

  beforeEach(() => {
    agent = new VitestUnitTestAgent();
  });

  describe('constructor', () => {
    it('should create agent with default options', () => {
      const config = agent.getConfig();
      expect(config.framework).toBe('vitest');
      expect(config.includeEdgeCases).toBe(true);
      expect(config.includeTypeTests).toBe(true);
      expect(config.includeMocks).toBe(true);
    });

    it('should create agent with custom options', () => {
      const customAgent = new VitestUnitTestAgent({
        includeEdgeCases: false,
        testDirectory: '__tests__'
      });
      const config = customAgent.getConfig();
      expect(config.includeEdgeCases).toBe(false);
      expect(config.testDirectory).toBe('__tests__');
    });
  });

  describe('generateTestsFromCode', () => {
    it('should generate tests for a simple function', () => {
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/math.ts');

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.metadata.framework).toBe('vitest');
      expect(result.metadata.totalTests).toBeGreaterThan(0);
    });

    it('should generate tests for an async function', () => {
      const code = `
        export async function fetchData(url: string): Promise<string> {
          return fetch(url).then(r => r.text());
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/api.ts');

      // The async keyword appears in the test body (await)
      expect(result.tests[0].content).toContain('await');
      // Should have async test case
      expect(result.tests[0].content).toContain('it(');
    });

    it('should analyze and return module structure', () => {
      const code = `
        export function multiply(a: number, b: number): number {
          return a * b;
        }
        
        export const PI = 3.14159;
      `;

      const result = agent.generateTestsFromCode(code, 'src/utils.ts');

      expect(result.analysis.functions.length).toBeGreaterThan(0);
      expect(result.analysis.exports.length).toBeGreaterThan(0);
    });

    it('should generate tests for a class', () => {
      const code = `
        export class Counter {
          private count: number = 0;
          
          increment(): void {
            this.count++;
          }
          
          getCount(): number {
            return this.count;
          }
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/counter.ts');

      expect(result.analysis.classes.length).toBeGreaterThan(0);
      expect(result.analysis.classes[0].name).toBe('Counter');
    });

    it('should include happy-path test cases', () => {
      const code = `
        export function divide(a: number, b: number): number {
          return a / b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/math.ts');

      const happyPathTests = result.tests[0].testCases.filter(
        tc => tc.type === 'happy-path'
      );
      expect(happyPathTests.length).toBeGreaterThan(0);
    });

    it('should include edge case test cases when enabled', () => {
      const code = `
        export function greet(name: string): string {
          return \`Hello, \${name}!\`;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/greeting.ts');

      const edgeCaseTests = result.tests[0].testCases.filter(
        tc => tc.type === 'edge-case'
      );
      expect(edgeCaseTests.length).toBeGreaterThan(0);
    });

    it('should include error scenario test cases', () => {
      const code = `
        export function validate(value: string): boolean {
          return value.length > 0;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/validator.ts');

      const errorTests = result.tests[0].testCases.filter(
        tc => tc.type === 'error-scenario'
      );
      expect(errorTests.length).toBeGreaterThan(0);
    });

    it('should include type-check test cases when enabled', () => {
      const code = `
        export function getString(): string {
          return 'hello';
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/string.ts');

      const typeTests = result.tests[0].testCases.filter(
        tc => tc.type === 'type-check'
      );
      expect(typeTests.length).toBeGreaterThan(0);
    });

    it('should generate valid TypeScript test file content', () => {
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/math.ts');

      const content = result.tests[0].content;
      expect(content).toContain("import { describe, it, expect");
      expect(content).toContain("describe('");
      expect(content).toContain("it('");
      expect(content).toContain("expect(");
    });
  });

  describe('generateTestOutput', () => {
    it('should return detailed test output with analysis', () => {
      const code = `
        export function calculate(x: number): number {
          return x * 2;
        }
      `;

      const output = agent.generateTestOutput({
        path: 'src/calc.ts',
        content: code,
        language: 'typescript'
      });

      expect(output.testPath).toBeDefined();
      expect(output.testCases.length).toBeGreaterThan(0);
      expect(output.analysis.functionsFound).toBe(1);
      expect(output.analysis.testsGenerated).toBeGreaterThan(0);
    });
  });

  describe('updateConfig', () => {
    it('should update agent configuration', () => {
      agent.updateConfig({
        testDirectory: 'custom-tests',
        testSuffix: '.spec'
      });

      const config = agent.getConfig();
      expect(config.testDirectory).toBe('custom-tests');
      expect(config.testSuffix).toBe('.spec');
    });

    it('should regenerate generator with new config', () => {
      const code = `
        export function test(): void {}
      `;

      agent.updateConfig({ includeEdgeCases: false });
      const resultWithout = agent.generateTestsFromCode(code, 'test.ts');

      agent.updateConfig({ includeEdgeCases: true });
      const resultWith = agent.generateTestsFromCode(code, 'test.ts');

      expect(resultWith.metadata.totalTests).toBeGreaterThanOrEqual(
        resultWithout.metadata.totalTests
      );
    });
  });

  describe('edge case handling', () => {
    it('should handle functions with no parameters', () => {
      const code = `
        export function getDefault(): number {
          return 42;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/default.ts');

      expect(result.tests[0].content).toContain('it(');
      expect(result.tests[0].content).toContain('expect(result)');
    });

    it('should handle functions with optional parameters', () => {
      const code = `
        export function greet(name: string, greeting?: string): string {
          return greeting ? \`\${greeting}, \${name}!\` : \`Hello, \${name}!\`;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/greet.ts');

      expect(result.analysis.functions[0].parameters[1].optional).toBe(true);
    });

    it('should handle functions with default parameters', () => {
      const code = `
        export function createUser(name: string, role: string = 'user'): object {
          return { name, role };
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/user.ts');

      expect(result.analysis.functions[0].parameters[1].defaultValue).toBe("'user'");
    });

    it('should handle multiple exported functions', () => {
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
        
        export function subtract(a: number, b: number): number {
          return a - b;
        }
        
        export function multiply(a: number, b: number): number {
          return a * b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/operations.ts');

      expect(result.analysis.functions.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle class with constructor parameters', () => {
      const code = `
        export class Database {
          constructor(private connectionString: string) {}
          
          connect(): Promise<void> {
            return Promise.resolve();
          }
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/db.ts');

      expect(result.analysis.classes[0].constructorParams.length).toBe(1);
      // The connect method returns Promise but is not declared async
      expect(result.analysis.classes[0].methods[0].isAsync).toBe(false);
    });

    it('should handle empty source code', () => {
      const code = '';

      const result = agent.generateTestsFromCode(code, 'src/empty.ts');

      expect(result.tests.length).toBe(0);
      expect(result.metadata.totalTests).toBe(0);
    });

    it('should handle non-exported functions (ignore them)', () => {
      const code = `
        function privateFunc(): void {
          // This should not be tested
        }
        
        export function publicFunc(): void {
          // This should be tested
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/mixed.ts');

      expect(result.analysis.functions.filter(f => f.isExported).length).toBe(1);
    });
  });

  describe('includeEdgeCases option', () => {
    it('should not generate edge case tests when disabled', () => {
      const edgeAgent = new VitestUnitTestAgent({ includeEdgeCases: false });
      
      const code = `
        export function test(name: string): string {
          return name;
        }
      `;

      const result = edgeAgent.generateTestsFromCode(code, 'test.ts');

      const edgeCaseTests = result.tests[0].testCases.filter(
        tc => tc.type === 'edge-case'
      );
      expect(edgeCaseTests.length).toBe(0);
    });

    it('should generate edge case tests when enabled', () => {
      const edgeAgent = new VitestUnitTestAgent({ includeEdgeCases: true });
      
      const code = `
        export function test(value: string): string {
          return value;
        }
      `;

      const result = edgeAgent.generateTestsFromCode(code, 'test.ts');

      const edgeCaseTests = result.tests[0].testCases.filter(
        tc => tc.type === 'edge-case'
      );
      expect(edgeCaseTests.length).toBeGreaterThan(0);
    });
  });

  describe('includeTypeTests option', () => {
    it('should not generate type tests when disabled', () => {
      const typeAgent = new VitestUnitTestAgent({ includeTypeTests: false });
      
      const code = `
        export function getNumber(): number {
          return 42;
        }
      `;

      const result = typeAgent.generateTestsFromCode(code, 'test.ts');

      const typeTests = result.tests[0].testCases.filter(
        tc => tc.type === 'type-check'
      );
      expect(typeTests.length).toBe(0);
    });

    it('should generate type tests when enabled', () => {
      const typeAgent = new VitestUnitTestAgent({ includeTypeTests: true });
      
      const code = `
        export function getBoolean(): boolean {
          return true;
        }
      `;

      const result = typeAgent.generateTestsFromCode(code, 'test.ts');

      const typeTests = result.tests[0].testCases.filter(
        tc => tc.type === 'type-check'
      );
      expect(typeTests.length).toBeGreaterThan(0);
    });
  });

  describe('test file path generation', () => {
    it('should use custom test directory', () => {
      const customAgent = new VitestUnitTestAgent({ testDirectory: '__tests__' });
      
      const code = `export function test(): void {}`;
      const result = customAgent.generateTestsFromCode(code, 'src/utils.ts');

      expect(result.tests[0].path).toContain('__tests__/');
    });

    it('should use custom test suffix', () => {
      const customAgent = new VitestUnitTestAgent({ testSuffix: '.spec' });
      
      const code = `export function test(): void {}`;
      const result = customAgent.generateTestsFromCode(code, 'src/utils.ts');

      expect(result.tests[0].path).toContain('.spec.ts');
    });
  });

  describe('generateVitestTests convenience function', () => {
    it('should generate tests using convenience function', () => {
      const code = `
        export function sum(numbers: number[]): number {
          return numbers.reduce((a, b) => a + b, 0);
        }
      `;

      const result = generateVitestTests(code, 'src/sum.ts');

      expect(result.metadata.framework).toBe('vitest');
      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should accept custom options via convenience function', () => {
      const code = `export function test(): void {}`;

      const result = generateVitestTests(code, 'test.ts', {
        includeEdgeCases: false
      });

      const edgeCaseTests = result.tests[0]?.testCases.filter(
        tc => tc.type === 'edge-case'
      );
      expect(edgeCaseTests?.length).toBe(0);
    });
  });

  describe('metadata', () => {
    it('should include source file in metadata', () => {
      const code = `export function test(): void {}`;
      const result = agent.generateTestsFromCode(code, 'src/myfile.ts');

      expect(result.metadata.sourceFile).toBe('src/myfile.ts');
    });

    it('should include generation timestamp in metadata', () => {
      const code = `export function test(): void {}`;
      const result = agent.generateTestsFromCode(code, 'test.ts');

      expect(result.metadata.generatedAt).toBeDefined();
      expect(new Date(result.metadata.generatedAt)).toBeInstanceOf(Date);
    });

    it('should count total tests correctly', () => {
      const code = `
        export function func1(): void {}
        export function func2(): void {}
      `;
      const result = agent.generateTestsFromCode(code, 'test.ts');

      expect(result.metadata.totalTests).toBe(result.tests[0].testCases.length);
    });
  });

  describe('import generation', () => {
    it('should generate imports for exported functions', () => {
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/math.ts');

      expect(result.tests[0].content).toContain("import { add }");
      // Import path is relative without ./
      expect(result.tests[0].content).toContain("from 'src/math'");
    });

    it('should generate imports for exported classes', () => {
      const code = `
        export class Calculator {
          add(a: number, b: number): number {
            return a + b;
          }
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/calc.ts');

      expect(result.tests[0].content).toContain("import { Calculator }");
    });

    it('should generate vitest imports', () => {
      const code = `export function test(): void {}`;
      const result = agent.generateTestsFromCode(code, 'test.ts');

      expect(result.tests[0].content).toContain("from 'vitest'");
      expect(result.tests[0].content).toContain('describe');
      expect(result.tests[0].content).toContain('it');
      expect(result.tests[0].content).toContain('expect');
    });
  });

  describe('describe block structure', () => {
    it('should wrap function tests in describe block', () => {
      const code = `
        export function multiply(a: number, b: number): number {
          return a * b;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/math.ts');

      expect(result.tests[0].content).toContain("describe('math', () => {");
      expect(result.tests[0].content).toContain("describe('multiply', () => {");
    });

    it('should wrap class tests in describe block', () => {
      const code = `
        export class Counter {
          private value: number = 0;
          increment(): void { this.value++; }
        }
      `;

      const result = agent.generateTestsFromCode(code, 'src/counter.ts');

      expect(result.tests[0].content).toContain("describe('Counter', () => {");
    });
  });
});

import { describe, it, expect } from 'vitest';
import { TestGenerator } from '../src/test-generator.js';
import type { AnalyzedModule } from '../src/types.js';

describe('TestGenerator', () => {
  describe('generate', () => {
    it('should generate tests for functions', () => {
      const generator = new TestGenerator({ framework: 'vitest' });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/utils.ts',
        functions: [
          {
            name: 'add',
            parameters: [
              { name: 'a', type: 'number', optional: false },
              { name: 'b', type: 'number', optional: false }
            ],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return a + b;',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'add', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].content).toContain("import { describe, it, expect");
      expect(result.tests[0].content).toContain("import { add }");
      expect(result.tests[0].content).toContain("describe('utils'");
      expect(result.tests[0].testCases.length).toBeGreaterThan(0);
    });

    it('should generate tests for classes', () => {
      const generator = new TestGenerator({ framework: 'vitest' });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/calculator.ts',
        functions: [],
        classes: [
          {
            name: 'Calculator',
            constructorParams: [],
            methods: [
              {
                name: 'add',
                parameters: [{ name: 'x', type: 'number', optional: false }],
                returnType: 'number',
                isAsync: false,
                isExported: false,
                body: 'return this.value + x;',
                lineNumber: 5
              }
            ],
            properties: [
              { name: 'value', type: 'number', visibility: 'public' }
            ],
            isExported: true,
            lineNumber: 1
          }
        ],
        exports: [{ name: 'Calculator', kind: 'class' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].content).toContain("import { Calculator }");
      expect(result.tests[0].content).toContain("describe('Calculator'");
      expect(result.tests[0].content).toContain("toBeInstanceOf(Calculator)");
    });

    it('should include async tests for async functions', () => {
      const generator = new TestGenerator({ framework: 'vitest' });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/api.ts',
        functions: [
          {
            name: 'fetchData',
            parameters: [{ name: 'url', type: 'string', optional: false }],
            returnType: 'Promise<string>',
            isAsync: true,
            isExported: true,
            body: 'return fetch(url).then(r => r.text());',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'fetchData', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests[0].content).toContain('async () =>');
      expect(result.tests[0].content).toContain('await fetchData');
    });

    it('should respect includeEdgeCases option', () => {
      const generatorWithEdgeCases = new TestGenerator({ 
        framework: 'vitest',
        includeEdgeCases: true 
      });
      
      const generatorWithoutEdgeCases = new TestGenerator({ 
        framework: 'vitest',
        includeEdgeCases: false 
      });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/utils.ts',
        functions: [
          {
            name: 'divide',
            parameters: [
              { name: 'a', type: 'number', optional: false },
              { name: 'b', type: 'number', optional: false }
            ],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return a / b;',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'divide', kind: 'function' }],
        imports: []
      };

      const resultWithEdgeCases = generatorWithEdgeCases.generate(analysis);
      const resultWithoutEdgeCases = generatorWithoutEdgeCases.generate(analysis);

      const edgeCaseTestsWith = resultWithEdgeCases.tests[0].testCases.filter(
        tc => tc.type === 'edge-case'
      );
      const edgeCaseTestsWithout = resultWithoutEdgeCases.tests[0].testCases.filter(
        tc => tc.type === 'edge-case'
      );

      expect(edgeCaseTestsWith.length).toBeGreaterThan(0);
      expect(edgeCaseTestsWithout.length).toBe(0);
    });

    it('should generate type-check tests when enabled', () => {
      const generator = new TestGenerator({ 
        framework: 'vitest',
        includeTypeTests: true 
      });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/utils.ts',
        functions: [
          {
            name: 'getString',
            parameters: [],
            returnType: 'string',
            isAsync: false,
            isExported: true,
            body: 'return "hello";',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'getString', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const typeTests = result.tests[0].testCases.filter(
        tc => tc.type === 'type-check'
      );
      expect(typeTests.length).toBeGreaterThan(0);
      expect(result.tests[0].content).toContain('typeof result');
    });

    it('should use correct test file paths', () => {
      const generator = new TestGenerator({ 
        framework: 'vitest',
        testDirectory: '__tests__',
        testSuffix: '.spec'
      });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/utils.ts',
        functions: [
          {
            name: 'add',
            parameters: [],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return 0;',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'add', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests[0].path).toContain('__tests__');
      expect(result.tests[0].path).toContain('.spec.ts');
    });

    it('should include metadata in result', () => {
      const generator = new TestGenerator({ framework: 'vitest' });
      
      const analysis: AnalyzedModule = {
        filePath: 'src/utils.ts',
        functions: [
          {
            name: 'add',
            parameters: [],
            returnType: 'number',
            isAsync: false,
            isExported: true,
            body: 'return 0;',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'add', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.metadata.sourceFile).toBe('src/utils.ts');
      expect(result.metadata.framework).toBe('vitest');
      expect(result.metadata.generatedAt).toBeDefined();
      expect(result.metadata.totalTests).toBeGreaterThan(0);
    });
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { JestTestGenerator } from '../jest-test-generator.js';
import type { AnalyzedModule, AnalyzedFunction, AnalyzedClass } from '../types.js';

describe('JestTestGenerator', () => {
  let generator: JestTestGenerator;

  beforeEach(() => {
    generator = new JestTestGenerator({
      includeAutoMocks: true,
      includeSpyOn: true,
      includeMockRestore: true,
      includeSnapshotTests: true,
      includeTimers: true
    });
  });

  describe('constructor', () => {
    it('should initialize with default Jest options', () => {
      const defaultGen = new JestTestGenerator();
      expect(defaultGen).toBeDefined();
    });

    it('should accept custom Jest options', () => {
      const customGen = new JestTestGenerator({
        includeAutoMocks: false,
        includeSnapshotTests: false
      });
      expect(customGen).toBeDefined();
    });
  });

  describe('generate', () => {
    it('should generate basic Jest test structure', () => {
      const analysis: AnalyzedModule = {
        filePath: 'src/example.ts',
        functions: [],
        classes: [],
        exports: [],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result).toBeDefined();
      expect(result.metadata.framework).toBe('jest');
      expect(result.tests).toBeDefined();
    });

    it('should generate tests for exported functions', () => {
      const func: AnalyzedFunction = {
        name: 'addNumbers',
        parameters: [
          { name: 'a', type: 'number', optional: false },
          { name: 'b', type: 'number', optional: false }
        ],
        returnType: 'number',
        isAsync: false,
        isExported: true,
        body: 'return a + b;',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/math.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'addNumbers', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.metadata.totalTests).toBeGreaterThan(0);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest).toBeDefined();
      expect(functionTest?.content).toContain("import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'");
      expect(functionTest?.content).toContain('describe');
      expect(functionTest?.content).toContain('addNumbers');
    });

    it('should generate async tests for async functions', () => {
      const asyncFunc: AnalyzedFunction = {
        name: 'fetchData',
        parameters: [{ name: 'url', type: 'string', optional: false }],
        returnType: 'Promise<any>',
        isAsync: true,
        isExported: true,
        body: 'return fetch(url).then(r => r.json());',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/api.ts',
        functions: [asyncFunc],
        classes: [],
        exports: [{ name: 'fetchData', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('async');
      expect(functionTest?.content).toContain('await');
      expect(functionTest?.content).toContain('fetchData');
    });

    it('should generate tests for classes', () => {
      const cls: AnalyzedClass = {
        name: 'UserService',
        constructorParams: [
          { name: 'repository', type: 'Repository', optional: false }
        ],
        methods: [
          {
            name: 'getUser',
            parameters: [{ name: 'id', type: 'string', optional: false }],
            returnType: 'User',
            isAsync: false,
            isExported: true,
            body: 'return this.repository.find(id);',
            lineNumber: 5
          }
        ],
        properties: [
          { name: 'repository', type: 'Repository', visibility: 'private' }
        ],
        isExported: true,
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/user-service.ts',
        functions: [],
        classes: [cls],
        exports: [{ name: 'UserService', type: 'class', kind: 'class' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const classTest = result.tests.find(t => t.path.includes('UserService'));
      expect(classTest).toBeDefined();
      expect(classTest?.content).toContain('UserService');
      expect(classTest?.content).toContain('new UserService');
      expect(classTest?.content).toContain('getUser');
    });

    it('should generate mock tests for modules with imports', () => {
      const analysis: AnalyzedModule = {
        filePath: 'src/api-client.ts',
        functions: [
          {
            name: 'getData',
            parameters: [],
            returnType: 'Promise<Data>',
            isAsync: true,
            isExported: true,
            body: 'return fetch("/api/data").then(r => r.json());',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'getData', type: 'function', kind: 'function' }],
        imports: [
          {
            source: 'node-fetch',
            specifiers: ['fetch'],
            isDefault: false
          }
        ]
      };

      const result = generator.generate(analysis);

      const mockTest = result.tests.find(t => t.path.includes('mocks'));
      expect(mockTest).toBeDefined();
      expect(mockTest?.content).toContain('jest.mock');
    });

    it('should generate snapshot tests when enabled', () => {
      const analysis: AnalyzedModule = {
        filePath: 'src/component.ts',
        functions: [
          {
            name: 'createComponent',
            parameters: [],
            returnType: 'Component',
            isAsync: false,
            isExported: true,
            body: 'return { type: "div" };',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'createComponent', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const snapshotTest = result.tests.find(t => t.path.includes('snapshot'));
      expect(snapshotTest).toBeDefined();
      expect(snapshotTest?.content).toContain('toMatchSnapshot');
    });
  });

  describe('generateJestConfig', () => {
    it('should generate valid Jest configuration', () => {
      const config = generator.generateJestConfig();

      expect(config).toContain('testEnvironment');
      expect(config).toContain('roots');
      expect(config).toContain('testMatch');
      expect(config).toContain('transform');
      expect(config).toContain('ts-jest');
    });

    it('should accept custom configuration options', () => {
      const config = generator.generateJestConfig({
        testEnvironment: 'jsdom',
        testTimeout: 10000,
        verbose: false
      });

      expect(config).toContain('jsdom');
      expect(config).toContain('10000');
    });

    it('should include coverage configuration', () => {
      const config = generator.generateJestConfig();

      expect(config).toContain('collectCoverageFrom');
      expect(config).toContain('coverageDirectory');
      expect(config).toContain('coverageReporters');
    });
  });

  describe('generateJestSetup', () => {
    it('should generate Jest setup file', () => {
      const setup = generator.generateJestSetup();

      expect(setup).toContain('Jest setup file');
      expect(setup).toContain('expect');
      expect(setup).toContain('jest.mock');
    });

    it('should include custom matchers', () => {
      const setup = generator.generateJestSetup(['toBeCustom']);

      expect(setup).toContain('toBeCustom');
      expect(setup).toContain('expect.extend');
    });
  });

  describe('Jest-specific features', () => {
    it('should include jest.fn() for callback parameters', () => {
      const func: AnalyzedFunction = {
        name: 'processCallback',
        parameters: [
          { name: 'callback', type: 'Function', optional: false }
        ],
        returnType: 'void',
        isAsync: false,
        isExported: true,
        body: 'callback("done");',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/callbacks.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'processCallback', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('jest.fn()');
      expect(functionTest?.content).toContain('callbackMock');
    });

    it('should include jest.spyOn for methods', () => {
      const cls: AnalyzedClass = {
        name: 'Logger',
        constructorParams: [],
        methods: [
          {
            name: 'log',
            parameters: [{ name: 'message', type: 'string', optional: false }],
            returnType: 'void',
            isAsync: false,
            isExported: true,
            body: 'console.log(message);',
            lineNumber: 5
          }
        ],
        properties: [],
        isExported: true,
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/logger.ts',
        functions: [],
        classes: [cls],
        exports: [{ name: 'Logger', type: 'class', kind: 'class' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const classTest = result.tests.find(t => t.path.includes('Logger'));
      expect(classTest?.content).toContain('jest.spyOn');
      expect(classTest?.content).toContain('mockRestore');
    });

    it('should include beforeEach with jest.clearAllMocks', () => {
      const analysis: AnalyzedModule = {
        filePath: 'src/example.ts',
        functions: [
          {
            name: 'example',
            parameters: [],
            returnType: 'void',
            isAsync: false,
            isExported: true,
            body: 'return;',
            lineNumber: 1
          }
        ],
        classes: [],
        exports: [{ name: 'example', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('beforeEach');
      expect(functionTest?.content).toContain('jest.clearAllMocks');
    });

    it('should include Jest-specific matchers', () => {
      const func: AnalyzedFunction = {
        name: 'getItems',
        parameters: [],
        returnType: 'string[]',
        isAsync: false,
        isExported: true,
        body: 'return ["a", "b"];',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/items.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'getItems', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('Jest-specific');
      expect(functionTest?.content).toContain('toHaveLength');
    });

    it('should include timer mocks for async functions with setTimeout', () => {
      const func: AnalyzedFunction = {
        name: 'delayedAction',
        parameters: [],
        returnType: 'Promise<void>',
        isAsync: true,
        isExported: true,
        body: 'return new Promise(resolve => setTimeout(resolve, 1000));',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/timer.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'delayedAction', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('jest.useFakeTimers');
      expect(functionTest?.content).toContain('jest.runAllTimers');
    });
  });

  describe('test case metadata', () => {
    it('should generate correct test case metadata', () => {
      const func: AnalyzedFunction = {
        name: 'calculate',
        parameters: [
          { name: 'a', type: 'number', optional: false },
          { name: 'b', type: 'number', optional: false }
        ],
        returnType: 'number',
        isAsync: false,
        isExported: true,
        body: 'return a + b;',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/calc.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'calculate', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBeGreaterThan(0);
      
      const allTestCases = result.tests.flatMap(t => t.testCases);
      expect(allTestCases.length).toBeGreaterThan(0);
      
      allTestCases.forEach(testCase => {
        expect(testCase.name).toBeDefined();
        expect(testCase.type).toBeDefined();
        expect(['unit', 'integration', 'edge-case', 'type-check']).toContain(testCase.type);
      });
    });
  });

  describe('edge cases', () => {
    it('should handle functions with no parameters', () => {
      const func: AnalyzedFunction = {
        name: 'getTimestamp',
        parameters: [],
        returnType: 'number',
        isAsync: false,
        isExported: true,
        body: 'return Date.now();',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/time.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'getTimestamp', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.metadata.totalTests).toBeGreaterThan(0);
    });

    it('should handle classes with no methods', () => {
      const cls: AnalyzedClass = {
        name: 'EmptyClass',
        constructorParams: [],
        methods: [],
        properties: [],
        isExported: true,
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/empty.ts',
        functions: [],
        classes: [cls],
        exports: [{ name: 'EmptyClass', type: 'class', kind: 'class' }],
        imports: []
      };

      const result = generator.generate(analysis);

      expect(result.tests.length).toBeGreaterThan(0);
    });

    it('should handle optional parameters', () => {
      const func: AnalyzedFunction = {
        name: 'greet',
        parameters: [
          { name: 'name', type: 'string', optional: false },
          { name: 'greeting', type: 'string', optional: true, defaultValue: '"Hello"' }
        ],
        returnType: 'string',
        isAsync: false,
        isExported: true,
        body: 'return `${greeting} ${name}`;',
        lineNumber: 1
      };

      const analysis: AnalyzedModule = {
        filePath: 'src/greet.ts',
        functions: [func],
        classes: [],
        exports: [{ name: 'greet', type: 'function', kind: 'function' }],
        imports: []
      };

      const result = generator.generate(analysis);

      const functionTest = result.tests.find(t => t.path.includes('functions'));
      expect(functionTest?.content).toContain('greet');
      expect(functionTest?.content).toContain('Hello');
    });
  });
});

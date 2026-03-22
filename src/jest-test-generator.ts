import type { 
  AnalyzedModule, 
  AnalyzedFunction, 
  AnalyzedClass,
  TestGenerationOptions,
  GeneratedTest
} from './types.js';
import { TestGenerator } from './test-generator.js';

/**
 * Jest-specific test generator with advanced mocking and assertion capabilities
 */
export class JestTestGenerator extends TestGenerator {
  private jestOptions: JestTestOptions;

  constructor(options: Partial<TestGenerationOptions> & Partial<JestTestOptions> = {}) {
    super({ ...options, framework: 'jest' });
    this.jestOptions = {
      includeAutoMocks: true,
      includeSpyOn: true,
      includeMockRestore: true,
      includeSnapshotTests: false,
      includeTimers: false,
      customMatchers: [],
      ...options
    };
  }

  /**
   * Override generate method to add Jest-specific test generation
   */
  generate(analysis: AnalyzedModule) {
    const result = super.generate(analysis);
    
    // Add Jest-specific tests if mocks are enabled
    if (this.jestOptions.includeAutoMocks && analysis.imports.length > 0) {
      result.tests.push(this.generateMockTests(analysis));
    }

    // Add snapshot tests if enabled
    if (this.jestOptions.includeSnapshotTests) {
      result.tests.push(this.generateSnapshotTests(analysis));
    }

    // Update metadata
    result.metadata.framework = 'jest';
    result.metadata.totalTests = result.tests.reduce(
      (sum, test) => sum + test.testCases.length, 
      0
    );

    return result;
  }

  /**
   * Generate Jest-specific imports
   */
  protected generateImports(analysis: AnalyzedModule): string {
    const lines: string[] = [];
    
    // Jest imports
    lines.push("import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';");
    
    // Source file import
    const importPath = this.getImportPath(analysis.filePath);
    const exports = analysis.exports.map(e => e.name);
    
    if (exports.length > 0) {
      lines.push(`import { ${exports.join(', ')} } from '${importPath}';`);
    }

    // Import types if needed for mocking
    const typeImports = analysis.imports.filter(imp => 
      imp.specifiers.some(spec => analysis.functions.some(f => 
        f.parameters.some(p => p.type?.includes(spec))
      ))
    );

    if (typeImports.length > 0) {
      typeImports.forEach(imp => {
        lines.push(`import * as ${this.getModuleAlias(imp.source)} from '${imp.source}';`);
      });
    }

    return lines.join('\n');
  }

  /**
   * Generate mock tests for module dependencies
   */
  private generateMockTests(analysis: AnalyzedModule): GeneratedTest {
    const testPath = this.getTestPath(analysis.filePath, 'mocks');
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    // Imports
    lines.push(this.generateImports(analysis));
    lines.push('');

    // Mock setup
    lines.push(`describe('${this.getModuleName(analysis.filePath)} - Mocks', () => {`);
    lines.push('');

    // Generate jest.mock() for each import
    analysis.imports.forEach(imp => {
      const moduleAlias = this.getModuleAlias(imp.source);
      
      testCases.push({
        name: `Mock ${imp.source}`,
        type: 'unit',
        targetFunction: 'mock'
      });

      lines.push(`  jest.mock('${imp.source}', () => ({`);
      imp.specifiers.forEach((spec, idx) => {
        const comma = idx < imp.specifiers.length - 1 ? ',' : '';
        lines.push(`    ${spec}: jest.fn()${comma}`);
      });
      lines.push(`  }));`);
      lines.push('');
    });

    // Test that mocks are called
    analysis.functions.filter(f => f.isExported).forEach(func => {
      const dependencies = this.extractDependencies(func, analysis.imports);
      
      if (dependencies.length > 0) {
        testCases.push({
          name: `${func.name} - mock verification`,
          type: 'unit',
          targetFunction: func.name
        });

        lines.push(`  describe('${func.name} mocking', () => {`);
        lines.push(`    it('should call dependencies correctly', () => {`);
        
        dependencies.forEach(dep => {
          lines.push(`      const ${dep.alias}Mock = jest.fn();`);
        });
        
        lines.push(`      `);
        lines.push(`      // Call the function`);
        lines.push(`      ${func.name}(${this.generateSampleArguments(func)});`);
        lines.push(`      `);
        lines.push(`      // Verify mock calls`);
        dependencies.forEach(dep => {
          lines.push(`      // expect(${dep.alias}Mock).toHaveBeenCalled();`);
        });
        
        lines.push(`    });`);
        lines.push(`  });`);
        lines.push('');
      }
    });

    lines.push('});');
    lines.push('');

    return {
      path: testPath,
      content: lines.join('\n'),
      testCases
    };
  }

  /**
   * Generate tests with jest.spyOn for method mocking
   */
  protected generateTestsForFunction(func: AnalyzedFunction): { code: string; testCases: GeneratedTest['testCases'] } {
    const baseResult = super.generateTestsForFunction(func);
    const testCases = [...baseResult.testCases];
    const lines: string[] = [];

    lines.push(`  describe('${func.name}', () => {`);
    lines.push(`    beforeEach(() => {`);
    lines.push(`      jest.clearAllMocks();`);
    lines.push(`    });`);
    lines.push('');

    // Add async test
    if (func.isAsync) {
      testCases.push({
        name: `${func.name} - async handling`,
        type: 'unit',
        targetFunction: func.name
      });
      lines.push(`    it('should handle async operations', async () => {`);
      lines.push(`      const result = await ${func.name}(${this.generateSampleArguments(func)});`);
      lines.push(`      expect(result).toBeDefined();`);
      lines.push(`    });`);
      lines.push('');
    }

    // Add spyOn tests if function has dependencies
    if (func.body.includes('console.') || func.body.includes('fetch(')) {
      testCases.push({
        name: `${func.name} - spyOn verification`,
        type: 'unit',
        targetFunction: func.name
      });

      lines.push(`    it('should use spyOn for method calls', () => {`);
      
      if (func.body.includes('console.')) {
        lines.push(`      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();`);
      }
      if (func.body.includes('fetch(')) {
        lines.push(`      const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation(() =>`);
        lines.push(`        Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)`);
        lines.push(`      );`);
      }
      
      lines.push(`      `);
      lines.push(`      ${func.name}(${this.generateSampleArguments(func)});`);
      lines.push(`      `);
      
      if (func.body.includes('console.')) {
        lines.push(`      expect(consoleSpy).toHaveBeenCalled();`);
        lines.push(`      consoleSpy.mockRestore();`);
      }
      if (func.body.includes('fetch(')) {
        lines.push(`      expect(fetchSpy).toHaveBeenCalled();`);
        lines.push(`      fetchSpy.mockRestore();`);
      }
      
      lines.push(`    });`);
      lines.push('');
    }

    // Add mock function tests
    if (this.jestOptions.includeAutoMocks) {
      const callbackParams = func.parameters.filter(p => 
        p.type?.toLowerCase().includes('function') || 
        p.type?.toLowerCase().includes('callback')
      );

      callbackParams.forEach(param => {
        testCases.push({
          name: `${func.name} - mock callback ${param.name}`,
          type: 'unit',
          targetFunction: func.name
        });

        lines.push(`    it('should handle mock callback for ${param.name}', () => {`);
        lines.push(`      const ${param.name}Mock = jest.fn();`);
        lines.push(`      `);
        lines.push(`      ${func.name}(${this.generateMockArguments(func, param.name)});`);
        lines.push(`      `);
        lines.push(`      expect(${param.name}Mock).toHaveBeenCalled();`);
        lines.push(`    });`);
        lines.push('');
      });
    }

    // Add Jest-specific matchers tests
    testCases.push({
      name: `${func.name} - Jest matchers`,
      type: 'unit',
      targetFunction: func.name
    });

    lines.push(`    it('should use Jest-specific matchers', () => {`);
    lines.push(`      const result = ${func.name}(${this.generateSampleArguments(func)});`);
    lines.push(`      `);
    lines.push(`      // Jest-specific assertions`);
    lines.push(`      expect(result).toBeDefined();`);
    
    if (func.returnType?.includes('null') || func.returnType?.includes('undefined')) {
      lines.push(`      expect(result).toBeNull();`);
    }
    
    if (func.returnType?.includes('[]') || func.returnType?.includes('Array')) {
      lines.push(`      expect(result).toHaveLength(expect.any(Number));`);
    }
    
    if (func.returnType?.includes('object')) {
      lines.push(`      expect(result).toMatchObject(expect.any(Object));`);
    }
    
    if (func.isAsync) {
      lines.push(`      expect(result).resolves.toBeDefined();`);
    }
    
    lines.push(`    });`);
    lines.push('');

    // Add timer tests if async and timers enabled
    if (func.isAsync && this.jestOptions.includeTimers && func.body.includes('setTimeout')) {
      testCases.push({
        name: `${func.name} - timer mock`,
        type: 'unit',
        targetFunction: func.name
      });

      lines.push(`    it('should handle timers correctly', () => {`);
      lines.push(`      jest.useFakeTimers();`);
      lines.push(`      `);
      lines.push(`      const promise = ${func.name}(${this.generateSampleArguments(func)});`);
      lines.push(`      `);
      lines.push(`      jest.runAllTimers();`);
      lines.push(`      `);
      lines.push(`      return expect(promise).resolves.toBeDefined();`);
      lines.push(`    });`);
      lines.push('');
    }

    lines.push(`  });`);
    lines.push('');

    return { 
      code: lines.join('\n'), 
      testCases 
    };
  }

  /**
   * Generate class tests with Jest-specific mocking
   */
  protected generateMethodTests(cls: AnalyzedClass, method: AnalyzedFunction): { code: string; testCases: GeneratedTest['testCases'] } {
    const baseResult = super.generateMethodTests(cls, method);
    const lines: string[] = [];
    const testCases = [...baseResult.testCases];

    lines.push(`  describe('${method.name}', () => {`);
    lines.push(`    let instance: ${cls.name};`);
    lines.push('');

    lines.push(`    beforeEach(() => {`);
    lines.push(`      jest.clearAllMocks();`);
    lines.push(`      instance = new ${cls.name}(${this.generateSampleConstructorArgs(cls)});`);
    lines.push(`    });`);
    lines.push('');

    // Add spy tests for class methods
    if (this.jestOptions.includeSpyOn) {
      testCases.push({
        name: `${cls.name}.${method.name} - spyOn`,
        type: 'unit',
        targetClass: cls.name
      });

      lines.push(`    it('should be callable via spyOn', () => {`);
      lines.push(`      const spy = jest.spyOn(instance, '${method.name}' as keyof ${cls.name});`);
      lines.push(`      `);
      lines.push(`      instance.${method.name}(${this.generateSampleArguments(method)});`);
      lines.push(`      `);
      lines.push(`      expect(spy).toHaveBeenCalled();`);
      lines.push(`      spy.mockRestore();`);
      lines.push(`    });`);
      lines.push('');
    }

    // Add mock implementation tests
    testCases.push({
      name: `${cls.name}.${method.name} - mockImplementation`,
      type: 'unit',
      targetClass: cls.name
    });

    lines.push(`    it('should support mock implementations', () => {`);
    lines.push(`      const mockResult = ${this.generateSampleValue(method.returnType)};`);
    lines.push(`      `);
    lines.push(`      jest.spyOn(instance, '${method.name}' as keyof ${cls.name})`);
    lines.push(`        .mockReturnValue(mockResult);`);
    lines.push(`      `);
    lines.push(`      const result = instance.${method.name}(${this.generateSampleArguments(method)});`);
    lines.push(`      `);
    lines.push(`      expect(result).toBe(mockResult);`);
    lines.push(`    });`);
    lines.push('');

    // Add mock restore test
    if (this.jestOptions.includeMockRestore) {
      testCases.push({
        name: `${cls.name}.${method.name} - mockRestore`,
        type: 'unit',
        targetClass: cls.name
      });

      lines.push(`    it('should restore mocks properly', () => {`);
      lines.push(`      const spy = jest.spyOn(instance, '${method.name}' as keyof ${cls.name})`);
      lines.push(`        .mockReturnValue({} as any);`);
      lines.push(`      `);
      lines.push(`      instance.${method.name}(${this.generateSampleArguments(method)});`);
      lines.push(`      `);
      lines.push(`      spy.mockRestore();`);
      lines.push(`      `);
      lines.push(`      // Original implementation should work`);
      lines.push(`      const result = instance.${method.name}(${this.generateSampleArguments(method)});`);
      lines.push(`      expect(result).toBeDefined();`);
      lines.push(`    });`);
      lines.push('');
    }

    lines.push(`  });`);
    lines.push('');

    return { code: lines.join('\n'), testCases };
  }

  /**
   * Generate snapshot tests
   */
  private generateSnapshotTests(analysis: AnalyzedModule): GeneratedTest {
    const testPath = this.getTestPath(analysis.filePath, 'snapshot');
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    lines.push(this.generateImports(analysis));
    lines.push('');

    lines.push(`describe('${this.getModuleName(analysis.filePath)} - Snapshots', () => {`);
    lines.push('');

    // Generate snapshot tests for functions
    analysis.functions.filter(f => f.isExported).forEach(func => {
      testCases.push({
        name: `${func.name} - snapshot`,
        type: 'unit',
        targetFunction: func.name
      });

      lines.push(`  it('${func.name} should match snapshot', () => {`);
      lines.push(`    const result = ${func.name}(${this.generateSampleArguments(func)});`);
      lines.push(`    expect(result).toMatchSnapshot();`);
      lines.push(`  });`);
      lines.push('');
    });

    // Generate snapshot tests for classes
    analysis.classes.filter(c => c.isExported).forEach(cls => {
      testCases.push({
        name: `${cls.name} - snapshot`,
        type: 'unit',
        targetClass: cls.name
      });

      lines.push(`  it('${cls.name} should match snapshot', () => {`);
      lines.push(`    const instance = new ${cls.name}(${this.generateSampleConstructorArgs(cls)});`);
      lines.push(`    expect(instance).toMatchSnapshot();`);
      lines.push(`  });`);
      lines.push('');
    });

    lines.push('});');
    lines.push('');

    return {
      path: testPath,
      content: lines.join('\n'),
      testCases
    };
  }

  /**
   * Generate Jest configuration file
   */
  generateJestConfig(options: JestConfigOptions = {}): string {
    const config = {
      testEnvironment: options.testEnvironment || 'node',
      roots: options.roots || ['<rootDir>/src'],
      testMatch: options.testMatch || [
        '**/__tests__/**/*.test.ts',
        '**/*.spec.ts'
      ],
      transform: options.transform || {
        '^.+\\.tsx?$': 'ts-jest'
      },
      collectCoverageFrom: options.collectCoverageFrom || [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/__tests__/**'
      ],
      coverageDirectory: options.coverageDirectory || 'coverage',
      coverageReporters: options.coverageReporters || ['text', 'lcov', 'html'],
      moduleNameMapper: options.moduleNameMapper || {
        '^(\\.{1,2}/.*)\\.js$': '$1'
      },
      setupFilesAfterEnv: options.setupFilesAfterEnv || [],
      verbose: options.verbose !== false,
      testTimeout: options.testTimeout || 5000,
      ...options.extraConfig
    };

    return `/** @type {import('jest').Config} */
const config = ${JSON.stringify(config, null, 2)};

module.exports = config;
`;
  }

  /**
   * Generate Jest setup file
   */
  generateJestSetup(customMatchers: string[] = []): string {
    const lines: string[] = [];
    
    lines.push(`// Jest setup file`);
    lines.push(`import { expect } from '@jest/globals';`);
    lines.push('');

    // Add custom matchers
    customMatchers.forEach(matcher => {
      lines.push(`expect.extend({`);
      lines.push(`  ${matcher}(received: any, expected: any) {`);
      lines.push(`    const pass = /* custom logic */;`);
      lines.push(`    return {`);
      lines.push(`      pass,`);
      lines.push(`      message: () => \`Expected \${received} \${pass ? 'not ' : ''}to be \${expected}\``);
      lines.push(`    };`);
      lines.push(`  }`);
      lines.push(`});`);
      lines.push('');
    });

    // Add global mocks
    lines.push(`// Global mocks`);
    lines.push(`jest.mock('console', () => ({`);
    lines.push(`  log: jest.fn(),`);
    lines.push(`  error: jest.fn(),`);
    lines.push(`  warn: jest.fn()`);
    lines.push(`}));`);
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Generate mock arguments with jest.fn()
   */
  private generateMockArguments(func: AnalyzedFunction, mockParam: string): string {
    return func.parameters.map(param => {
      if (param.name === mockParam) {
        return `${param.name}Mock`;
      }
      if (param.defaultValue) return param.defaultValue;
      return this.generateSampleValue(param.type);
    }).join(', ');
  }

  /**
   * Extract dependencies from function body
   */
  private extractDependencies(func: AnalyzedFunction, imports: AnalyzedModule['imports']): Array<{ name: string; alias: string }> {
    const dependencies: Array<{ name: string; alias: string }> = [];
    
    imports.forEach(imp => {
      imp.specifiers.forEach(spec => {
        if (func.body.includes(spec)) {
          dependencies.push({
            name: spec,
            alias: this.getModuleAlias(imp.source) + spec
          });
        }
      });
    });

    return dependencies;
  }

  /**
   * Get module alias from import path
   */
  private getModuleAlias(source: string): string {
    return source
      .replace(/[@\/\-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}

/**
 * Jest-specific test options
 */
export interface JestTestOptions {
  /** Include automatic mock generation */
  includeAutoMocks: boolean;
  /** Include jest.spyOn tests */
  includeSpyOn: boolean;
  /** Include mock restore tests */
  includeMockRestore: boolean;
  /** Include snapshot tests */
  includeSnapshotTests: boolean;
  /** Include timer mocks */
  includeTimers: boolean;
  /** Custom matchers to include */
  customMatchers: string[];
}

/**
 * Jest configuration options
 */
export interface JestConfigOptions {
  testEnvironment?: string;
  roots?: string[];
  testMatch?: string[];
  transform?: Record<string, string>;
  collectCoverageFrom?: string[];
  coverageDirectory?: string;
  coverageReporters?: string[];
  moduleNameMapper?: Record<string, string>;
  setupFilesAfterEnv?: string[];
  verbose?: boolean;
  testTimeout?: number;
  extraConfig?: Record<string, any>;
}

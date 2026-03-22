/**
 * Test Generator
 * Generates vitest/jest test files from analyzed source code
 */

import type { 
  AnalyzedModule, 
  AnalyzedFunction, 
  AnalyzedClass, 
  TestGenerationOptions, 
  GeneratedTest,
  TestGenerationResult 
} from './types.js';

/**
 * Generates vitest tests from analyzed source code
 */
export class TestGenerator {
  private options: Required<TestGenerationOptions>;

  constructor(options: Partial<TestGenerationOptions> = {}) {
    this.options = {
      framework: options.framework || 'vitest',
      includeTypeTests: options.includeTypeTests ?? true,
      includeEdgeCases: options.includeEdgeCases ?? true,
      includeMocks: options.includeMocks ?? true,
      testDirectory: options.testDirectory || 'tests',
      testSuffix: options.testSuffix || '.test',
      maxTestsPerFunction: options.maxTestsPerFunction || 10,
    };
  }

  /**
   * Generate tests for an analyzed module
   */
  generate(analysis: AnalyzedModule): TestGenerationResult {
    const tests: GeneratedTest[] = [];

    // Generate tests for exported functions
    if (analysis.functions.length > 0) {
      tests.push(this.generateFunctionTests(analysis));
    }

    // Generate tests for classes
    analysis.classes.forEach(cls => {
      tests.push(this.generateClassTests(analysis, cls));
    });

    const totalTests = tests.reduce((sum, test) => sum + test.testCases.length, 0);

    return {
      tests,
      analysis,
      metadata: {
        sourceFile: analysis.filePath,
        generatedAt: new Date().toISOString(),
        framework: this.options.framework,
        totalTests
      }
    };
  }

  /**
   * Generate tests for functions
   */
  private generateFunctionTests(analysis: AnalyzedModule): GeneratedTest {
    const testPath = this.getTestPath(analysis.filePath, 'functions');
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    // Imports
    lines.push(this.generateImports(analysis));
    lines.push('');

    // Describe block for the module
    const moduleName = this.getModuleName(analysis.filePath);
    lines.push(`describe('${moduleName}', () => {`);
    lines.push('');

    // Generate tests for each function
    analysis.functions.filter(f => f.isExported).forEach(func => {
      const funcTests = this.generateTestsForFunction(func);
      testCases.push(...funcTests.testCases);
      lines.push(funcTests.code);
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
   * Generate tests for a single function
   */
  private generateTestsForFunction(func: AnalyzedFunction): { code: string; testCases: GeneratedTest['testCases'] } {
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    lines.push(`  describe('${func.name}', () => {`);

    // Basic functionality test
    testCases.push({
      name: `${func.name} - basic functionality`,
      type: 'unit',
      targetFunction: func.name
    });
    lines.push(`    it('should work correctly', () => {`);
    lines.push(`      const result = ${func.name}(${this.generateSampleArguments(func)});`);
    lines.push(`      expect(result).toBeDefined();`);
    lines.push(`    });`);
    lines.push('');

    // Type-based tests
    if (this.options.includeTypeTests && func.returnType) {
      testCases.push({
        name: `${func.name} - return type check`,
        type: 'type-check',
        targetFunction: func.name
      });
      lines.push(`    it('should return correct type', () => {`);
      lines.push(`      const result = ${func.name}(${this.generateSampleArguments(func)});`);
      lines.push(`      expect(typeof result).toBe('${this.inferTypeFromTypeScript(func.returnType)}');`);
      lines.push(`    });`);
      lines.push('');
    }

    // Edge case tests
    if (this.options.includeEdgeCases) {
      func.parameters.forEach(param => {
        if (!param.optional) {
          testCases.push({
            name: `${func.name} - edge case with ${param.name}`,
            type: 'edge-case',
            targetFunction: func.name
          });
          lines.push(`    it('should handle edge case for ${param.name}', () => {`);
          lines.push(`      const result = ${func.name}(${this.generateEdgeCaseArguments(func, param.name)});`);
          lines.push(`      expect(result).toBeDefined();`);
          lines.push(`    });`);
          lines.push('');
        }
      });

      // Null/undefined handling
      testCases.push({
        name: `${func.name} - handles null/undefined`,
        type: 'edge-case',
        targetFunction: func.name
      });
      lines.push(`    it('should handle null/undefined inputs gracefully', () => {`);
      lines.push(`      expect(() => ${func.name}(${this.generateNullArguments(func)})).not.toThrow();`);
      lines.push(`    });`);
      lines.push('');
    }

    // Async handling
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

    lines.push(`  });`);
    lines.push('');

    return { code: lines.join('\n'), testCases };
  }

  /**
   * Generate tests for a class
   */
  private generateClassTests(analysis: AnalyzedModule, cls: AnalyzedClass): GeneratedTest {
    const testPath = this.getTestPath(analysis.filePath, cls.name);
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    // Imports
    lines.push(this.generateImports(analysis));
    lines.push('');

    // Describe block for the class
    lines.push(`describe('${cls.name}', () => {`);
    lines.push('');

    // Test instantiation
    testCases.push({
      name: `${cls.name} - instantiation`,
      type: 'unit',
      targetClass: cls.name
    });
    lines.push(`  it('should instantiate correctly', () => {`);
    lines.push(`    const instance = new ${cls.name}(${this.generateSampleConstructorArgs(cls)});`);
    lines.push(`    expect(instance).toBeInstanceOf(${cls.name});`);
    lines.push(`  });`);
    lines.push('');

    // Test methods
    cls.methods.forEach(method => {
      const methodTests = this.generateMethodTests(cls, method);
      testCases.push(...methodTests.testCases);
      lines.push(methodTests.code);
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
   * Generate tests for a class method
   */
  private generateMethodTests(cls: AnalyzedClass, method: AnalyzedFunction): { code: string; testCases: GeneratedTest['testCases'] } {
    const testCases: GeneratedTest['testCases'] = [];
    const lines: string[] = [];

    lines.push(`  describe('${method.name}', () => {`);

    // Basic test
    testCases.push({
      name: `${cls.name}.${method.name} - basic functionality`,
      type: 'unit',
      targetClass: cls.name
    });
    lines.push(`    it('should work correctly', () => {`);
    lines.push(`      const instance = new ${cls.name}(${this.generateSampleConstructorArgs(cls)});`);
    lines.push(`      const result = instance.${method.name}(${this.generateSampleArguments(method)});`);
    lines.push(`      expect(result).toBeDefined();`);
    lines.push(`    });`);
    lines.push('');

    // Async test
    if (method.isAsync) {
      testCases.push({
        name: `${cls.name}.${method.name} - async`,
        type: 'unit',
        targetClass: cls.name
      });
      lines.push(`    it('should handle async operations', async () => {`);
      lines.push(`      const instance = new ${cls.name}(${this.generateSampleConstructorArgs(cls)});`);
      lines.push(`      const result = await instance.${method.name}(${this.generateSampleArguments(method)});`);
      lines.push(`      expect(result).toBeDefined();`);
      lines.push(`    });`);
      lines.push('');
    }

    lines.push(`  });`);
    lines.push('');

    return { code: lines.join('\n'), testCases };
  }

  /**
   * Generate import statements
   */
  private generateImports(analysis: AnalyzedModule): string {
    const lines: string[] = [];
    const framework = this.options.framework;
    
    // Test framework imports
    if (framework === 'vitest') {
      lines.push("import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
    } else {
      lines.push("import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';");
    }

    // Source file import
    const importPath = this.getImportPath(analysis.filePath);
    const exports = analysis.exports.map(e => e.name);
    
    if (exports.length > 0) {
      lines.push(`import { ${exports.join(', ')} } from '${importPath}';`);
    }

    return lines.join('\n');
  }

  /**
   * Generate sample arguments for a function
   */
  private generateSampleArguments(func: AnalyzedFunction): string {
    return func.parameters.map(param => {
      if (param.defaultValue) return param.defaultValue;
      return this.generateSampleValue(param.type);
    }).join(', ');
  }

  /**
   * Generate sample constructor arguments
   */
  private generateSampleConstructorArgs(cls: AnalyzedClass): string {
    return cls.constructorParams.map(param => {
      return this.generateSampleValue(param.type);
    }).join(', ');
  }

  /**
   * Generate edge case arguments
   */
  private generateEdgeCaseArguments(func: AnalyzedFunction, edgeParam: string): string {
    return func.parameters.map(param => {
      if (param.name === edgeParam) {
        return this.generateEdgeCaseValue(param.type);
      }
      return this.generateSampleValue(param.type);
    }).join(', ');
  }

  /**
   * Generate null/undefined arguments
   */
  private generateNullArguments(func: AnalyzedFunction): string {
    return func.parameters.map(() => 'null').join(', ');
  }

  /**
   * Generate a sample value for a type
   */
  private generateSampleValue(type?: string): string {
    if (!type) return 'undefined';
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('string')) return "'test'";
    if (typeLower.includes('number')) return '42';
    if (typeLower.includes('boolean')) return 'true';
    if (typeLower.includes('object') && !typeLower.includes('object}')) return '{}';
    if (typeLower.includes('array')) return '[]';
    if (typeLower.includes('function')) return '() => {}';
    if (typeLower.includes('promise')) return 'Promise.resolve()';
    if (typeLower.includes('date')) return 'new Date()';
    if (typeLower.includes('map')) return 'new Map()';
    if (typeLower.includes('set')) return 'new Set()';
    
    return 'undefined';
  }

  /**
   * Generate an edge case value for a type
   */
  private generateEdgeCaseValue(type?: string): string {
    if (!type) return 'undefined';
    
    const typeLower = type.toLowerCase();
    
    if (typeLower.includes('string')) return "''"; // Empty string
    if (typeLower.includes('number')) return '0'; // Zero
    if (typeLower.includes('boolean')) return 'false'; // False
    if (typeLower.includes('object')) return 'null'; // Null
    if (typeLower.includes('array')) return '[]'; // Empty array
    
    return 'undefined';
  }

  /**
   * Infer JavaScript type from TypeScript type
   */
  private inferTypeFromTypeScript(tsType: string): string {
    const typeLower = tsType.toLowerCase();
    
    if (typeLower.includes('string')) return 'string';
    if (typeLower.includes('number')) return 'number';
    if (typeLower.includes('boolean')) return 'boolean';
    if (typeLower.includes('function')) return 'function';
    if (typeLower.includes('symbol')) return 'symbol';
    if (typeLower.includes('bigint')) return 'bigint';
    
    return 'object';
  }

  /**
   * Get test file path
   */
  private getTestPath(sourcePath: string, suffix: string): string {
    const dir = this.options.testDirectory || 'tests';
    const baseName = sourcePath.split('/').pop()?.replace(/\.(ts|js)$/, '') || 'test';
    const testSuffix = this.options.testSuffix || '.test';
    return `${dir}/${baseName}-${suffix}${testSuffix}.ts`;
  }

  /**
   * Get import path from source file path
   */
  private getImportPath(sourcePath: string): string {
    return sourcePath.replace(/\.(ts|js)$/, '');
  }

  /**
   * Get module name from file path
   */
  private getModuleName(filePath: string): string {
    return filePath.split('/').pop()?.replace(/\.(ts|js)$/, '') || 'module';
  }
}

/**
 * Core types for the test generation skill pack
 */

export interface SourceFile {
  /** Absolute or relative path to the source file */
  path: string;
  /** File content */
  content: string;
  /** Language/framework type */
  language: 'typescript' | 'javascript';
}

export interface AnalyzedFunction {
  /** Function name */
  name: string;
  /** Function parameters */
  parameters: Array<{
    name: string;
    type?: string;
    optional: boolean;
    defaultValue?: string;
  }>;
  /** Return type annotation */
  returnType?: string;
  /** Whether the function is async */
  isAsync: boolean;
  /** Whether the function is exported */
  isExported: boolean;
  /** JSDoc comment if present */
  documentation?: string;
  /** Function body source */
  body: string;
  /** Line number in source file */
  lineNumber: number;
}

export interface AnalyzedClass {
  /** Class name */
  name: string;
  /** Constructor parameters */
  constructorParams: Array<{
    name: string;
    type?: string;
    optional: boolean;
  }>;
  /** Class methods */
  methods: AnalyzedFunction[];
  /** Class properties */
  properties: Array<{
    name: string;
    type?: string;
    visibility: 'public' | 'private' | 'protected';
  }>;
  /** Whether the class is exported */
  isExported: boolean;
  /** Line number in source file */
  lineNumber: number;
}

export interface AnalyzedModule {
  /** Source file path */
  filePath: string;
  /** Exported functions */
  functions: AnalyzedFunction[];
  /** Exported classes */
  classes: AnalyzedClass[];
  /** Exported constants/variables */
  exports: Array<{
    name: string;
    type?: string;
    kind: 'const' | 'let' | 'var' | 'function' | 'class';
  }>;
  /** Import statements */
  imports: Array<{
    source: string;
    specifiers: string[];
    isDefault: boolean;
  }>;
}

export interface TestGenerationOptions {
  /** Test framework to use */
  framework: 'vitest' | 'jest';
  /** Include type-based test generation */
  includeTypeTests: boolean;
  /** Include edge case tests */
  includeEdgeCases: boolean;
  /** Include mock generation */
  includeMocks: boolean;
  /** Custom test directory */
  testDirectory?: string;
  /** Test file name suffix */
  testSuffix?: string;
  /** Maximum tests per function */
  maxTestsPerFunction?: number;
}

export interface GeneratedTest {
  /** Test file path */
  path: string;
  /** Test file content */
  content: string;
  /** Test cases generated */
  testCases: Array<{
    name: string;
    type: 'unit' | 'integration' | 'edge-case' | 'type-check' | 'happy-path' | 'error-scenario';
    targetFunction?: string;
    targetClass?: string;
  }>;
}

export interface TestGenerationResult {
  /** Generated test files */
  tests: GeneratedTest[];
  /** Source analysis results */
  analysis: AnalyzedModule;
  /** Generation metadata */
  metadata: {
    sourceFile: string;
    generatedAt: string;
    framework: string;
    totalTests: number;
  };
}

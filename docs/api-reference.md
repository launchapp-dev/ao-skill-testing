# API Reference

Complete API reference for the ao-skill-testing skill pack.

## Table of Contents

- [Core Exports](#core-exports)
- [SourceAnalyzer](#sourceanalyzer)
- [TestGenerator](#testgenerator)
- [JestTestGenerator](#jesttestgenerator)
- [UnitTestAgent](#unittestagent)
- [Helper Functions](#helper-functions)
- [Type Definitions](#type-definitions)

---

## Core Exports

```typescript
// Main classes
export { SourceAnalyzer } from './source-analyzer.js';
export { TestGenerator } from './test-generator.js';
export { JestTestGenerator } from './jest-test-generator.js';
export { UnitTestAgent } from './index.js';

// Convenience function
export { generateTests } from './index.js';

// Types
export type {
  SourceFile,
  AnalyzedModule,
  AnalyzedFunction,
  AnalyzedClass,
  TestGenerationOptions,
  GeneratedTest,
  TestGenerationResult,
  JestTestOptions,
  JestConfigOptions
} from './types.js';
```

---

## SourceAnalyzer

Analyzes source files to extract testable units.

### Constructor

```typescript
new SourceAnalyzer()
```

Creates a new SourceAnalyzer instance.

### Methods

#### analyze

```typescript
analyze(sourceFile: SourceFile): AnalyzedModule
```

Analyzes a source file and extracts testable units.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `sourceFile` | `SourceFile` | Source file to analyze |

**Returns:** `AnalyzedModule` - Analysis results

**Example:**

```typescript
const analyzer = new SourceAnalyzer();

const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: `
    export function add(a: number, b: number): number {
      return a + b;
    }
  `,
  language: 'typescript'
});

console.log(analysis.functions);
// [{ name: 'add', parameters: [...], returnType: 'number', ... }]
```

---

## TestGenerator

Generates test files from analyzed modules.

### Constructor

```typescript
new TestGenerator(options?: Partial<TestGenerationOptions>)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `options` | `Partial<TestGenerationOptions>` | Generator options |

### Methods

#### generate

```typescript
generate(analysis: AnalyzedModule): TestGenerationResult
```

Generates test files from an analyzed module.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `analysis` | `AnalyzedModule` | Analysis results |

**Returns:** `TestGenerationResult` - Generated tests and metadata

**Example:**

```typescript
const generator = new TestGenerator({
  framework: 'vitest',
  includeEdgeCases: true
});

const result = generator.generate(analysis);

result.tests.forEach(test => {
  console.log(test.path);
  console.log(test.content);
});
```

---

## JestTestGenerator

Jest-specific test generator with advanced mocking capabilities.

### Constructor

```typescript
new JestTestGenerator(options?: Partial<TestGenerationOptions & JestTestOptions>)
```

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `options` | `Partial<TestGenerationOptions & JestTestOptions>` | Generator options |

### Methods

#### generate

```typescript
generate(analysis: AnalyzedModule): TestGenerationResult
```

Generates Jest test files with mocking and spy support.

#### generateJestConfig

```typescript
generateJestConfig(options?: JestConfigOptions): string
```

Generates a Jest configuration file.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `options` | `JestConfigOptions` | Jest configuration options |

**Returns:** `string` - Jest configuration as JavaScript

**Example:**

```typescript
const config = generator.generateJestConfig({
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' },
  coverageDirectory: 'coverage'
});

console.log(config);
// /** @type {import('jest').Config} */
// const config = { ... };
// module.exports = config;
```

#### generateJestSetup

```typescript
generateJestSetup(customMatchers?: string[]): string
```

Generates a Jest setup file.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `customMatchers` | `string[]` | Custom matcher names |

**Returns:** `string` - Jest setup file content

---

## UnitTestAgent

High-level agent class combining analysis and generation.

### Constructor

```typescript
new UnitTestAgent(options?: Partial<TestGenerationOptions>)
```

### Methods

#### generateTests

```typescript
generateTests(sourceFile: SourceFile): TestGenerationResult
```

Generates tests for a source file.

#### generateTestsFromCode

```typescript
generateTestsFromCode(code: string, filePath: string): TestGenerationResult
```

Generates tests from source code string.

#### analyze

```typescript
analyze(sourceFile: SourceFile): AnalyzedModule
```

Analyzes source without generating tests.

---

## Helper Functions

### generateTests

```typescript
generateTests(
  code: string,
  filePath: string,
  options?: Partial<TestGenerationOptions>
): TestGenerationResult
```

Convenience function for quick test generation.

**Parameters:**

| Name | Type | Description |
|------|------|-------------|
| `code` | `string` | Source code content |
| `filePath` | `string` | File path for context |
| `options` | `Partial<TestGenerationOptions>` | Generator options |

**Returns:** `TestGenerationResult` - Generated tests

**Example:**

```typescript
const result = generateTests(`
  export function multiply(a: number, b: number): number {
    return a * b;
  }
`, 'src/math.ts', { framework: 'vitest' });
```

---

## Type Definitions

### SourceFile

```typescript
interface SourceFile {
  /** Absolute or relative path to the source file */
  path: string;
  /** File content */
  content: string;
  /** Language/framework type */
  language: 'typescript' | 'javascript';
}
```

### AnalyzedFunction

```typescript
interface AnalyzedFunction {
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
```

### AnalyzedClass

```typescript
interface AnalyzedClass {
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
```

### AnalyzedModule

```typescript
interface AnalyzedModule {
  /** Source file path */
  filePath: string;
  /** Exported functions */
  functions: AnalyzedFunction[];
  /** Exported classes */
  classes: AnalyzedClass[];
  /** Exported declarations */
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
```

### TestGenerationOptions

```typescript
interface TestGenerationOptions {
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
```

### JestTestOptions

```typescript
interface JestTestOptions {
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
```

### JestConfigOptions

```typescript
interface JestConfigOptions {
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
```

### GeneratedTest

```typescript
interface GeneratedTest {
  /** Test file path */
  path: string;
  /** Test file content */
  content: string;
  /** Test cases generated */
  testCases: Array<{
    name: string;
    type: 'unit' | 'integration' | 'edge-case' | 'type-check';
    targetFunction?: string;
    targetClass?: string;
  }>;
}
```

### TestGenerationResult

```typescript
interface TestGenerationResult {
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
```

---

## Usage Examples

### Complete Pipeline

```typescript
import {
  SourceAnalyzer,
  TestGenerator,
  generateTests
} from 'ao-skill-testing';

// Option 1: One-liner
const result = generateTests(sourceCode, 'src/utils.ts', {
  framework: 'vitest',
  includeEdgeCases: true
});

// Option 2: Step by step
const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'jest' });

const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

const result = generator.generate(analysis);

// Access results
console.log(`Generated ${result.metadata.totalTests} tests`);
result.tests.forEach(test => {
  console.log(`\n=== ${test.path} ===`);
  console.log(test.content);
});
```

### Jest with Configuration

```typescript
import { JestTestGenerator } from 'ao-skill-testing';
import { writeFile } from 'fs/promises';

async function setupJest() {
  const generator = new JestTestGenerator({
    includeAutoMocks: true,
    includeSpyOn: true,
    includeMockRestore: true,
    customMatchers: ['toBeWithinRange']
  });

  // Generate tests
  const result = generator.generate(analysis);

  // Generate configuration
  const config = generator.generateJestConfig({
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    testTimeout: 10000
  });

  // Generate setup
  const setup = generator.generateJestSetup(['toBeWithinRange']);

  // Write files
  await writeFile('jest.config.js', config);
  await writeFile('jest.setup.ts', setup);

  return result;
}
```

### Analysis Only

```typescript
import { SourceAnalyzer } from 'ao-skill-testing';

const analyzer = new SourceAnalyzer();
const analysis = analyzer.analyze({
  path: 'src/user-service.ts',
  content: sourceCode,
  language: 'typescript'
});

// Inspect analysis
console.log('Functions:', analysis.functions.map(f => f.name));
console.log('Classes:', analysis.classes.map(c => c.name));
console.log('Exports:', analysis.exports);
console.log('Imports:', analysis.imports);

// Get function details
analysis.functions.forEach(func => {
  console.log(`\nFunction: ${func.name}`);
  console.log(`  Parameters: ${func.parameters.map(p => p.name).join(', ')}`);
  console.log(`  Return type: ${func.returnType}`);
  console.log(`  Async: ${func.isAsync}`);
  if (func.documentation) {
    console.log(`  Documentation: ${func.documentation}`);
  }
});
```

# ao-skill-testing

A comprehensive AO skill pack for automated test generation. This pack provides agents that read source code and generate comprehensive tests using various testing frameworks.

## Overview

The ao-skill-testing pack provides a complete test generation pipeline with multiple agents:

| Agent | Framework | Description |
|-------|-----------|-------------|
| `ao.testing-agent` | Vitest | General-purpose test generation with TypeScript analysis |
| `ao.jest-test-generator` | Jest | Advanced Jest test generation with mocking, spies, and matchers |

### Supported Test Types

- **Unit Tests**: Basic functionality tests for functions and classes
- **Edge Case Tests**: Boundary conditions, null/undefined handling, empty values
- **Type Check Tests**: TypeScript type validation tests
- **Integration Tests**: Module dependency testing (planned)
- **E2E Tests**: End-to-end test generation (planned)

## Quick Start

### Installation

```bash
npm install ao-skill-testing
```

### Basic Usage

```typescript
import { generateTests } from 'ao-skill-testing';

const sourceCode = `
  export function add(a: number, b: number): number {
    return a + b;
  }
`;

const result = generateTests(sourceCode, 'math.ts', { framework: 'vitest' });
console.log(result.tests[0].content);
```

## Agent Configuration

### Vitest Agent (Default)

The `ao.testing-agent` uses Vitest as the default testing framework.

```typescript
import { UnitTestAgent, SourceAnalyzer, TestGenerator } from 'ao-skill-testing';

const agent = new UnitTestAgent({
  framework: 'vitest',        // 'vitest' | 'jest'
  includeTypeTests: true,      // Generate type-check tests
  includeEdgeCases: true,      // Generate edge case tests
  includeMocks: true,          // Generate mock setup
  testDirectory: 'tests',      // Output directory
  testSuffix: '.test',         // Test file suffix
  maxTestsPerFunction: 10      // Max tests per function
});

// Generate tests from source file
const result = agent.generateTests({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});
```

### Jest Agent

The `ao.jest-test-generator` provides advanced Jest-specific features.

```typescript
import { JestTestGenerator } from 'ao-skill-testing';

const generator = new JestTestGenerator({
  framework: 'jest',
  includeTypeTests: true,
  includeEdgeCases: true,
  includeAutoMocks: true,      // Jest-specific: auto mock dependencies
  includeSpyOn: true,          // Jest-specific: spyOn tests
  includeMockRestore: true,     // Jest-specific: mock restoration
  includeSnapshotTests: false,  // Jest-specific: snapshot tests
  includeTimers: false,         // Jest-specific: timer mocking
  customMatchers: []            // Jest-specific: custom matchers
});
```

### Agent Options Reference

#### TestGenerationOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `framework` | `'vitest' \| 'jest'` | `'vitest'` | Test framework to use |
| `includeTypeTests` | `boolean` | `true` | Include type validation tests |
| `includeEdgeCases` | `boolean` | `true` | Include edge case tests |
| `includeMocks` | `boolean` | `true` | Include mock generation |
| `testDirectory` | `string` | `'tests'` | Output directory |
| `testSuffix` | `string` | `'.test'` | Test file suffix |
| `maxTestsPerFunction` | `number` | `10` | Maximum tests per function |

#### JestTestOptions (Jest-specific)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeAutoMocks` | `boolean` | `true` | Auto-generate `jest.mock()` calls |
| `includeSpyOn` | `boolean` | `true` | Include `jest.spyOn()` tests |
| `includeMockRestore` | `boolean` | `true` | Include mock restoration tests |
| `includeSnapshotTests` | `boolean` | `false` | Include snapshot tests |
| `includeTimers` | `boolean` | `false` | Include timer mocking tests |
| `customMatchers` | `string[]` | `[]` | Custom Jest matchers to add |

## Running the Test Generation Pipeline

### Via API

```typescript
import { UnitTestAgent, SourceAnalyzer, TestGenerator, generateTests } from 'ao-skill-testing';

// Method 1: Using the convenience function
const result = generateTests(sourceCode, 'src/utils.ts', {
  framework: 'vitest',
  includeEdgeCases: true
});

// Method 2: Using the UnitTestAgent class
const agent = new UnitTestAgent({ framework: 'vitest' });
const result = agent.generateTests({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

// Method 3: Step-by-step analysis and generation
const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'vitest' });

const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

const result = generator.generate(analysis);
```

### Via Workflow (AO Daemon)

The skill pack includes predefined workflows for automated test generation:

#### Standard Workflow
```bash
# Run the standard test generation workflow
ao workflow run --workflow ao.testing/standard --task TASK-001
```

#### Quick Fix Workflow
```bash
# Quick single-phase test generation
ao workflow run --workflow ao.testing/quick-fix --task TASK-001
```

#### Jest Generation Workflow
```bash
# Jest-specific test generation
ao workflow run --workflow ao.testing/jest-generate --task TASK-001
```

### Workflow Phases

| Phase | Agent | Description |
|-------|-------|-------------|
| `ao.testing-implement` | `ao.testing-agent` | Analyze source and generate tests |
| `ao.jest-test-implement` | `ao.jest-test-generator` | Generate Jest-specific tests |
| `push-branch` | System | Push changes to branch |
| `create-pr` | System | Create pull request |
| `pr-review` | System | Review pull request |

## Generated Test Structure

For each source file, the generator creates comprehensive test files:

### Function Tests

```typescript
import { describe, it, expect } from 'vitest';
import { add } from '../src/math';

describe('math', () => {
  describe('add', () => {
    it('should work correctly', () => {
      const result = add(42, 42);
      expect(result).toBeDefined();
    });

    it('should return correct type', () => {
      const result = add(42, 42);
      expect(typeof result).toBe('number');
    });

    it('should handle edge case for a', () => {
      const result = add(0, 42);
      expect(result).toBeDefined();
    });
  });
});
```

### Class Tests

```typescript
import { describe, it, expect } from 'vitest';
import { Calculator } from '../src/calculator';

describe('Calculator', () => {
  it('should instantiate correctly', () => {
    const instance = new Calculator();
    expect(instance).toBeInstanceOf(Calculator);
  });

  describe('add', () => {
    it('should work correctly', () => {
      const instance = new Calculator();
      const result = instance.add(1, 2);
      expect(result).toBeDefined();
    });
  });
});
```

### Jest-Specific Features

```typescript
import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { UserService } from '../src/user-service';

describe('UserService', () => {
  let service: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserService();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUser', () => {
    it('should call spy on method', () => {
      const spy = jest.spyOn(service, 'getUser');
      service.getUser('1');
      expect(spy).toHaveBeenCalledWith('1');
      spy.mockRestore();
    });

    it('should use mock implementation', () => {
      jest.spyOn(service, 'getUser')
        .mockResolvedValue({ id: '1', name: 'Test' });
      
      return expect(service.getUser('1')).resolves.toEqual({ id: '1', name: 'Test' });
    });
  });
});
```

## Adding New Language Support

To add support for a new language (e.g., Python with pytest):

### 1. Create a New Generator Class

```typescript
// src/pytest-generator.ts
import type { AnalyzedModule, AnalyzedFunction, AnalyzedClass } from './types.js';
import { SourceAnalyzer } from './source-analyzer.js';

export class PyTestGenerator extends SourceAnalyzer {
  private options: PyTestOptions;

  constructor(options: Partial<PyTestOptions> = {}) {
    super(); // Initialize parent
    this.options = {
      includeTypeHints: true,
      includeDocstringTests: true,
      ...options
    };
  }

  generate(analysis: AnalyzedModule): PyTestResult {
    // Implement Python-specific test generation
    const tests: string[] = [];
    
    // Generate pytest-compatible tests
    tests.push(this.generatePytestImports(analysis));
    tests.push(this.generatePytestFixtures(analysis));
    
    analysis.functions.filter(f => f.isExported).forEach(func => {
      tests.push(this.generatePytestFunctionTests(func));
    });

    return {
      content: tests.join('\n\n'),
      analysis,
      metadata: { framework: 'pytest', generatedAt: new Date().toISOString() }
    };
  }

  private generatePytestImports(analysis: AnalyzedModule): string {
    const imports = ['import pytest'];
    
    if (this.options.includeTypeHints) {
      imports.push('from typing import get_type_hints');
    }
    
    // Source imports
    const moduleName = analysis.filePath.replace(/\.py$/, '').replace(/\//g, '.');
    imports.push(`from ${moduleName} import ${analysis.exports.map(e => e.name).join(', ')}`);
    
    return imports.join('\n');
  }

  private generatePytestFunctionTests(func: AnalyzedFunction): string {
    const lines: string[] = [];
    
    lines.push(`def test_${func.name}_basic():`);
    lines.push(`    """Test basic functionality of ${func.name}""")`);
    lines.push(`    result = ${func.name}(${this.generatePytestArgs(func)})`);
    lines.push(`    assert result is not None`);
    lines.push('');
    
    // Add more test patterns...
    
    return lines.join('\n');
  }
}

export interface PyTestOptions {
  includeTypeHints: boolean;
  includeDocstringTests: boolean;
}
```

### 2. Register the New Generator

```typescript
// src/index.ts
export { PyTestGenerator } from './pytest-generator.js';
export type { PyTestOptions } from './pytest-generator.js';
```

### 3. Add Agent Configuration

Update `runtime/agents.yaml`:

```yaml
agents:
  ao.pytest-test-generator:
    description: "Generate pytest test files for Python projects"
    system_prompt: |
      You are an expert pytest test generation agent...
      # Include comprehensive pytest-specific guidance
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
```

### 4. Update Workflow Configuration

Update `workflows/skill-pack.yaml`:

```yaml
phases:
  ao.pytest-test-implement:
    mode: agent
    agent: ao.pytest-test-generator
    directive: "Generate pytest test files for Python source code."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true

workflows:
  - id: ao.testing/pytest-generate
    name: "Pytest Test Generation"
    description: "Generate pytest test suite for Python projects"
    phases:
      - ao.pytest-test-implement
      - push-branch
      - create-pr
```

## API Reference

### Core Classes

#### SourceAnalyzer

Analyzes source files to extract testable units.

```typescript
import { SourceAnalyzer } from 'ao-skill-testing';

const analyzer = new SourceAnalyzer();

const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});
```

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `analyze(sourceFile)` | `AnalyzedModule` | Parse and analyze a source file |

**Analysis Result Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `filePath` | `string` | Source file path |
| `functions` | `AnalyzedFunction[]` | Exported functions |
| `classes` | `AnalyzedClass[]` | Exported classes |
| `exports` | `Export[]` | All exports |
| `imports` | `Import[]` | Import statements |

#### TestGenerator

Generates test files from analyzed modules.

```typescript
import { TestGenerator } from 'ao-skill-testing';

const generator = new TestGenerator({
  framework: 'vitest',
  includeEdgeCases: true
});

const result = generator.generate(analysis);
```

**Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `generate(analysis)` | `TestGenerationResult` | Generate tests for analyzed module |

#### JestTestGenerator

Extends TestGenerator with Jest-specific features.

```typescript
import { JestTestGenerator } from 'ao-skill-testing';

const generator = new JestTestGenerator({
  includeAutoMocks: true,
  includeSpyOn: true
});

const result = generator.generate(analysis);
```

**Additional Methods:**

| Method | Returns | Description |
|--------|---------|-------------|
| `generate(analysis)` | `TestGenerationResult` | Generate Jest tests |
| `generateJestConfig(options?)` | `string` | Generate jest.config.js |
| `generateJestSetup(customMatchers?)` | `string` | Generate jest.setup.ts |

### Type Definitions

#### SourceFile

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

#### AnalyzedFunction

```typescript
interface AnalyzedFunction {
  name: string;
  parameters: Array<{
    name: string;
    type?: string;
    optional: boolean;
    defaultValue?: string;
  }>;
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  documentation?: string;
  body: string;
  lineNumber: number;
}
```

#### AnalyzedClass

```typescript
interface AnalyzedClass {
  name: string;
  constructorParams: Array<{
    name: string;
    type?: string;
    optional: boolean;
  }>;
  methods: AnalyzedFunction[];
  properties: Array<{
    name: string;
    type?: string;
    visibility: 'public' | 'private' | 'protected';
  }>;
  isExported: boolean;
  lineNumber: number;
}
```

#### GeneratedTest

```typescript
interface GeneratedTest {
  path: string;
  content: string;
  testCases: Array<{
    name: string;
    type: 'unit' | 'integration' | 'edge-case' | 'type-check';
    targetFunction?: string;
    targetClass?: string;
  }>;
}
```

#### TestGenerationResult

```typescript
interface TestGenerationResult {
  tests: GeneratedTest[];
  analysis: AnalyzedModule;
  metadata: {
    sourceFile: string;
    generatedAt: string;
    framework: string;
    totalTests: number;
  };
}
```

## Jest Configuration

### jest.config.js

The `JestTestGenerator` can generate a complete Jest configuration:

```typescript
const generator = new JestTestGenerator();
const config = generator.generateJestConfig({
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  collectCoverageFrom: ['src/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  }
});

// Write to file
import { writeFile } from 'fs/promises';
await writeFile('jest.config.js', config);
```

### jest.setup.ts

Generate a setup file with custom matchers and global mocks:

```typescript
const setup = generator.generateJestSetup([
  'toBeWithinRange',
  'toBeEven'
]);

await writeFile('jest.setup.ts', setup);
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run tests
npm test

# Run tests once
npm run test:run

# Lint
npm run lint
```

## License

MIT

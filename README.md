# ao-skill-testing

AO skill pack for automated test generation. Agents that read source code and generate comprehensive tests.

## Features

- **Source Code Analysis**: Parse TypeScript/JavaScript to extract testable units
- **Test Generation**: Automatically generate vitest tests for functions and classes
- **Type-Aware**: Generate tests based on TypeScript type information
- **Edge Case Detection**: Identify and generate tests for edge cases
- **Class Support**: Generate tests for classes, methods, and properties
- **Async Support**: Proper handling of async functions and methods

## Installation

```bash
npm install ao-skill-testing
```

## Quick Start

```typescript
import { generateTests } from 'ao-skill-testing';

const code = `
  export function add(a: number, b: number): number {
    return a + b;
  }
`;

const result = generateTests(code, 'math.ts');
console.log(result.tests[0].content);
```

## API

### `UnitTestAgent`

Main class for generating tests.

```typescript
import { UnitTestAgent } from 'ao-skill-testing';

const agent = new UnitTestAgent({
  framework: 'vitest',        // 'vitest' | 'jest'
  includeTypeTests: true,     // Generate type-check tests
  includeEdgeCases: true,     // Generate edge case tests
  includeMocks: true,         // Generate mock setup
  testDirectory: 'tests',     // Output directory
  testSuffix: '.test',        // Test file suffix
  maxTestsPerFunction: 10     // Max tests per function
});

// Generate tests from source file
const result = agent.generateTests({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

// Generate tests from code string
const result = agent.generateTestsFromCode(code, 'utils.ts');

// Analyze source without generating tests
const analysis = agent.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});
```

### `generateTests(code, filePath, options?)`

Convenience function for quick test generation.

```typescript
import { generateTests } from 'ao-skill-testing';

const result = generateTests(
  sourceCode,
  'src/utils.ts',
  { framework: 'vitest', includeEdgeCases: true }
);
```

### `SourceAnalyzer`

Analyze source code to extract testable units.

```typescript
import { SourceAnalyzer } from 'ao-skill-testing';

const analyzer = new SourceAnalyzer();
const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

console.log(analysis.functions);  // Exported functions
console.log(analysis.classes);    // Exported classes
console.log(analysis.exports);    // All exports
console.log(analysis.imports);    // Import statements
```

### `TestGenerator`

Generate tests from analyzed modules.

```typescript
import { TestGenerator } from 'ao-skill-testing';

const generator = new TestGenerator({ framework: 'vitest' });
const result = generator.generate(analysis);
```

## Generated Test Structure

For each source file, the generator creates:

1. **Function Tests**: Tests for exported functions
   - Basic functionality test
   - Type-check tests (optional)
   - Edge case tests (optional)
   - Async handling (for async functions)

2. **Class Tests**: Tests for exported classes
   - Instantiation test
   - Method tests
   - Property tests

Example generated test:

```typescript
import { describe, it, expect } from 'vitest';
import { add } from '../src/utils';

describe('utils', () => {
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

## Test Types

Generated tests are categorized by type:

- **unit**: Basic functionality tests
- **edge-case**: Boundary and edge case tests
- **type-check**: Type validation tests
- **integration**: Integration tests (future)

## Supported Frameworks

- **Vitest** (default)
- **Jest** (planned)

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Run tests once
npm run test:run
```

## License

MIT

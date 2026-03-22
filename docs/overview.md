# Overview

The ao-skill-testing skill pack provides automated test generation for TypeScript and JavaScript projects. It uses code analysis to understand your source code and generates comprehensive test suites.

## Key Features

### Source Code Analysis
- Parse TypeScript/JavaScript files using ts-morph
- Extract testable units: functions, classes, methods
- Identify parameters, return types, and dependencies
- Parse JSDoc comments for documentation

### Test Generation
- Generate Vitest tests (default)
- Generate Jest tests with advanced features
- Support for multiple test types:
  - Unit tests
  - Edge case tests
  - Type check tests
  - Integration tests (planned)
  - E2E tests (planned)

### Framework Support
| Framework | Status | Features |
|-----------|--------|----------|
| Vitest | ✅ Stable | Basic test generation |
| Jest | ✅ Stable | Advanced mocking, spies, matchers |
| Pytest | 🔄 Planned | Python support |
| RSpec | 🔄 Planned | Ruby support |

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     AO Daemon                           │
├─────────────────────────────────────────────────────────┤
│  Workflow: ao.testing/standard                         │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────┐   │
│  │implement│→ │push-branch│→ │create-pr│→ │pr-review │   │
│  └─────────┘  └──────────┘  └─────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────┤
│                     Agents                              │
│  ┌─────────────────┐  ┌──────────────────────┐          │
│  │ao.testing-agent │  │ao.jest-test-generator│          │
│  │   (Vitest)      │  │      (Jest)          │          │
│  └────────┬────────┘  └──────────┬───────────┘          │
├───────────┼──────────────────────┼──────────────────────┤
│           │   Source Analysis   │                       │
│  ┌────────▼─────────────────────▼───────────┐           │
│  │            SourceAnalyzer               │           │
│  │  - parseFiles()                         │           │
│  │  - extractFunctions()                   │           │
│  │  - extractClasses()                     │           │
│  │  - extractExports()                     │           │
│  │  - extractImports()                     │           │
│  └────────────────────┬────────────────────┘           │
│                       │                                │
│  ┌────────────────────▼────────────────────┐           │
│  │           TestGenerator                 │           │
│  │  - generateFunctionTests()              │           │
│  │  - generateClassTests()                 │           │
│  │  - generateMockTests()                  │           │
│  └────────────────────┬────────────────────┘           │
└───────────────────────┼─────────────────────────────────┘
                        │
              ┌─────────▼─────────┐
              │  Generated Tests  │
              │  tests/*.test.ts  │
              └───────────────────┘
```

## Installation

### Via npm

```bash
npm install ao-skill-testing
```

### Via AO Pack Installation

```bash
# Install the skill pack from git
ao pack install https://github.com/launchapp-dev/ao-skill-testing
```

### Development Setup

```bash
# Clone the repository
git clone https://github.com/launchapp-dev/ao-skill-testing

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Basic Usage

### JavaScript/TypeScript API

```typescript
import { generateTests } from 'ao-skill-testing';

// Simple usage
const sourceCode = `
  export function add(a: number, b: number): number {
    return a + b;
  }
`;

const result = generateTests(sourceCode, 'math.ts', {
  framework: 'vitest',
  includeEdgeCases: true
});

// Access generated tests
result.tests.forEach(test => {
  console.log(`Test file: ${test.path}`);
  console.log(test.content);
});
```

### Using the Full Pipeline

```typescript
import { SourceAnalyzer, TestGenerator } from 'ao-skill-testing';

const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'vitest' });

// Step 1: Analyze source code
const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

console.log(`Found ${analysis.functions.length} functions`);
console.log(`Found ${analysis.classes.length} classes`);

// Step 2: Generate tests
const result = generator.generate(analysis);

console.log(`Generated ${result.metadata.totalTests} tests`);
```

## Output Structure

For each source file, the generator produces:

```
src/
├── utils.ts
└── tests/
    ├── utils-functions.test.ts
    ├── utils-Calculator.test.ts
    └── utils-mocks.test.ts (Jest only)
```

## Test Types Generated

### 1. Unit Tests
Basic functionality tests for each exported function and class method.

```typescript
it('should work correctly', () => {
  const result = add(1, 2);
  expect(result).toBeDefined();
});
```

### 2. Type Check Tests
Validates that return types match expectations.

```typescript
it('should return correct type', () => {
  const result = add(1, 2);
  expect(typeof result).toBe('number');
});
```

### 3. Edge Case Tests
Tests boundary conditions and special inputs.

```typescript
it('should handle edge case for a', () => {
  const result = add(0, 42);
  expect(result).toBeDefined();
});

it('should handle null/undefined inputs gracefully', () => {
  expect(() => add(null, null)).not.toThrow();
});
```

### 4. Async Tests (for async functions)

```typescript
it('should handle async operations', async () => {
  const result = await fetchData('/api/users');
  expect(result).toBeDefined();
});
```

### 5. Mock Tests (Jest only)

```typescript
beforeEach(() => {
  jest.clearAllMocks();
});

it('should call dependencies correctly', () => {
  const fetchMock = jest.fn();
  fetchData('/api/users');
  expect(fetchMock).toHaveBeenCalled();
});
```

## Supported File Types

| Extension | Language | Support |
|-----------|----------|---------|
| `.ts` | TypeScript | ✅ Full |
| `.tsx` | TypeScript React | ✅ Full |
| `.js` | JavaScript | ✅ Full |
| `.jsx` | JavaScript React | ✅ Full |
| `.py` | Python | 🔄 Planned |
| `.rb` | Ruby | 🔄 Planned |

## Performance

The test generator is designed for efficiency:

- **Parallel Analysis**: Analyzes multiple files concurrently
- **Incremental Generation**: Only regenerates changed tests
- **Memory Efficient**: Uses streaming for large files

Typical performance:
- Single file: < 100ms
- Module (10 files): < 500ms
- Large project (100 files): < 5s

## Next Steps

- Read the [Agents documentation](./agents.md) to understand available agents
- See [Configuration](./configuration.md) for detailed configuration options
- Learn about [Running the Pipeline](./pipeline.md)
- Check [API Reference](./api-reference.md) for complete API documentation
- See [Extending](./extending.md) to add new language support

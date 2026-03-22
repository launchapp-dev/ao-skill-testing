# Configuration

Complete configuration reference for the ao-skill-testing skill pack.

## Configuration Files

### pack.toml

The main skill pack manifest.

```toml
schema = "ao.pack.v1"
id = "ao.testing"
version = "0.1.0"
kind = "skill-pack"
title = "ao-skill-testing"
description = "Generate comprehensive tests (vitest, jest, pytest) from source code analysis"

[ownership]
mode = "community"
author = "launchapp-dev"
repo = "https://github.com/launchapp-dev/ao-skill-testing"

[compatibility]
ao_core = ">=0.2.0"
workflow_schema = "v2"

[workflows]
root = "workflows"
exports = [
  "ao.testing/standard",
  "ao.testing/quick-fix",
  "ao.testing/jest-generate",
]

[runtime]
agent_overlay = "runtime/agents.yaml"

[permissions]
tools = ["ao", "github"]
```

### runtime/agents.yaml

Agent definitions and system prompts.

```yaml
agents:
  ao.testing-agent:
    description: "Generate comprehensive tests (vitest, jest, pytest) from source code analysis"
    system_prompt: |
      [System prompt content...]
    model: kimi-code/kimi-for-coding
    tool: oai-runner
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: false

  ao.jest-test-generator:
    description: "Generate comprehensive Jest test files with advanced mocking, spies, and matchers"
    system_prompt: |
      [System prompt content...]
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
```

### workflows/skill-pack.yaml

Workflow and phase definitions.

```yaml
phases:
  ao.testing-implement:
    mode: agent
    agent: ao.testing-agent
    directive: "Implement the task. Read requirements, write code, commit."
    capabilities:
      mutates_state: true

  ao.jest-test-implement:
    mode: agent
    agent: ao.jest-test-generator
    directive: "Generate comprehensive Jest test files with mocking, spies, and matchers."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true

workflows:
  - id: ao.testing/standard
    name: "ao-skill-testing Standard"
    description: "Plan → Implement → Push → PR"
    phases:
      - ao.testing-implement
      - push-branch
      - create-pr
      - pr-review
```

## API Configuration

### TestGenerationOptions

Base configuration for all test generators.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `framework` | `'vitest' \| 'jest'` | `'vitest'` | Test framework to use |
| `includeTypeTests` | `boolean` | `true` | Generate type-check tests |
| `includeEdgeCases` | `boolean` | `true` | Generate edge case tests |
| `includeMocks` | `boolean` | `true` | Include mock generation |
| `testDirectory` | `string` | `'tests'` | Output directory for tests |
| `testSuffix` | `string` | `'.test'` | Test file suffix |
| `maxTestsPerFunction` | `number` | `10` | Max tests per function |

#### Example

```typescript
import { TestGenerator } from 'ao-skill-testing';

const generator = new TestGenerator({
  framework: 'vitest',
  includeTypeTests: true,
  includeEdgeCases: true,
  includeMocks: false,
  testDirectory: '__tests__',
  testSuffix: '.spec',
  maxTestsPerFunction: 15
});
```

### JestTestOptions

Jest-specific configuration options.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeAutoMocks` | `boolean` | `true` | Auto-generate `jest.mock()` calls |
| `includeSpyOn` | `boolean` | `true` | Include `jest.spyOn()` tests |
| `includeMockRestore` | `boolean` | `true` | Include mock restoration tests |
| `includeSnapshotTests` | `boolean` | `false` | Include snapshot tests |
| `includeTimers` | `boolean` | `false` | Include timer mocking tests |
| `customMatchers` | `string[]` | `[]` | Custom Jest matchers to add |

#### Example

```typescript
import { JestTestGenerator } from 'ao-skill-testing';

const generator = new JestTestGenerator({
  framework: 'jest',
  includeAutoMocks: true,
  includeSpyOn: true,
  includeMockRestore: true,
  includeSnapshotTests: false,
  includeTimers: false,
  customMatchers: ['toBeWithinRange', 'toBeEven']
});
```

### JestConfigOptions

Jest configuration generation options.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `testEnvironment` | `string` | `'node'` | Test environment |
| `roots` | `string[]` | `['<rootDir>/src']` | Root directories |
| `testMatch` | `string[]` | Pattern array | Test file patterns |
| `transform` | `Record<string, string>` | `{ts-jest}` | File transformations |
| `collectCoverageFrom` | `string[]` | Source patterns | Files for coverage |
| `coverageDirectory` | `string` | `'coverage'` | Coverage output dir |
| `coverageReporters` | `string[]` | Standard reporters | Coverage formats |
| `moduleNameMapper` | `Record<string, string>` | Extension mapper | Path aliases |
| `setupFilesAfterEnv` | `string[]` | `[]` | Setup files |
| `verbose` | `boolean` | `true` | Verbose output |
| `testTimeout` | `number` | `5000` | Test timeout (ms) |
| `extraConfig` | `Record<string, any>` | `{}` | Additional config |

#### Example

```typescript
const jestConfig = generator.generateJestConfig({
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }]
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  verbose: true,
  testTimeout: 10000
});
```

## SourceAnalyzer Configuration

The `SourceAnalyzer` class doesn't require configuration options. It creates a fresh project for each analysis.

```typescript
const analyzer = new SourceAnalyzer();

// Analyze multiple files
const analysis1 = analyzer.analyze({
  path: 'src/service.ts',
  content: serviceCode,
  language: 'typescript'
});

const analysis2 = analyzer.analyze({
  path: 'src/utils.ts',
  content: utilsCode,
  language: 'typescript'
});
```

## Environment Variables

Some configuration can be set via environment variables:

| Variable | Type | Description |
|----------|------|-------------|
| `AO_TESTING_FRAMEWORK` | `'vitest' \| 'jest'` | Default framework |
| `AO_TESTING_DIR` | `string` | Default test directory |
| `AO_TESTING_VERBOSE` | `'true' \| 'false'` | Verbose output |

## Configuration Patterns

### Minimal Configuration

```typescript
// Just use defaults
const agent = new UnitTestAgent();
```

### Vitest with Custom Output

```typescript
const generator = new TestGenerator({
  framework: 'vitest',
  testDirectory: '__tests__',
  testSuffix: '.spec'
});
```

### Jest with Full Features

```typescript
const generator = new JestTestGenerator({
  framework: 'jest',
  includeAutoMocks: true,
  includeSpyOn: true,
  includeMockRestore: true,
  includeSnapshotTests: true,
  includeTimers: true,
  customMatchers: ['toBeWithinRange']
});
```

### Co-located Tests

```typescript
// Tests next to source files
const generator = new TestGenerator({
  testDirectory: '.',
  testSuffix: '.test'
});
```

## Workflow Configuration

### Custom Workflow

```yaml
# .ao/workflows/custom.yaml
workflows:
  - id: my-testing-workflow
    name: "My Custom Test Workflow"
    description: "Custom test generation workflow"
    phases:
      - ao.testing-implement
      - push-branch
```

### Phase Overrides

```yaml
phases:
  my-custom-phase:
    mode: agent
    agent: ao.testing-agent
    directive: "Custom directive for this phase"
    capabilities:
      mutates_state: true
```

## TypeScript Configuration

Ensure your `tsconfig.json` supports the test generator:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Next Steps

- [Run the Test Pipeline](./pipeline.md)
- [Extend with New Languages](./extending.md)
- [API Reference](./api-reference.md)

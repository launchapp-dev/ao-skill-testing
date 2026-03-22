# Running the Test Generation Pipeline

This guide covers all methods of running the test generation pipeline.

## Methods Overview

| Method | Use Case | Best For |
|--------|----------|----------|
| API (Node.js) | Programmatic usage | CI/CD, build scripts |
| CLI | Interactive usage | Quick generation |
| Workflow (AO) | Automated pipeline | Full automation |
| Direct Agent | Custom workflows | Advanced control |

## Via Node.js API

### Basic Pipeline

```typescript
import { SourceAnalyzer, TestGenerator, generateTests } from 'ao-skill-testing';

// Method 1: Convenience function
const result = generateTests(sourceCode, 'src/utils.ts', {
  framework: 'vitest',
  includeEdgeCases: true
});

// Method 2: Full pipeline
const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'vitest' });

const analysis = analyzer.analyze({
  path: 'src/utils.ts',
  content: sourceCode,
  language: 'typescript'
});

const result = generator.generate(analysis);
```

### Multi-File Pipeline

```typescript
import { SourceAnalyzer, TestGenerator } from 'ao-skill-testing';
import { readFile, readdir } from 'fs/promises';

const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'vitest' });

async function generateTestsForDirectory(dirPath: string) {
  const files = await readdir(dirPath, { recursive: true });
  const tsFiles = files.filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

  for (const file of tsFiles) {
    const content = await readFile(`${dirPath}/${file}`, 'utf-8');
    
    const analysis = analyzer.analyze({
      path: file,
      content,
      language: 'typescript'
    });

    const result = generator.generate(analysis);
    
    // Write generated tests
    for (const test of result.tests) {
      await writeFile(test.path, test.content);
    }
  }
}
```

### Jest Pipeline

```typescript
import { JestTestGenerator } from 'ao-skill-testing';
import { writeFile } from 'fs/promises';

async function generateJestTests(sourceFile: string, content: string) {
  const generator = new JestTestGenerator({
    includeAutoMocks: true,
    includeSpyOn: true,
    includeMockRestore: true
  });

  // Analyze source
  const analyzer = new SourceAnalyzer();
  const analysis = analyzer.analyze({
    path: sourceFile,
    content,
    language: 'typescript'
  });

  // Generate tests
  const result = generator.generate(analysis);

  // Write tests
  for (const test of result.tests) {
    await writeFile(test.path, test.content);
  }

  // Generate Jest configuration
  const jestConfig = generator.generateJestConfig();
  await writeFile('jest.config.js', jestConfig);

  // Generate setup file
  const setup = generator.generateJestSetup();
  await writeFile('jest.setup.ts', setup);

  return result;
}
```

## Via AO Workflow

### Using the Daemon

The AO daemon manages workflow execution. Start it with:

```bash
# Start the daemon
ao daemon start

# Check status
ao daemon status
```

### Running Workflows

#### Standard Workflow

Complete pipeline with PR review:

```bash
# Via CLI
ao workflow run --workflow ao.testing/standard --task TASK-001

# Via API
ao.workflow.run({
  task_id: "TASK-001",
  workflow_ref: "ao.testing/standard"
});
```

#### Quick Fix Workflow

Fast pipeline without PR review:

```bash
ao workflow run --workflow ao.testing/quick-fix --task TASK-001
```

#### Jest Workflow

Jest-specific test generation:

```bash
ao workflow run --workflow ao.testing/jest-generate --task TASK-001
```

### Workflow Execution Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW EXECUTION                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. TASK STARTED                                             │
│     └─ ao.task.status → "in_progress"                        │
│                                                              │
│  2. IMPLEMENT PHASE                                          │
│     ├─ Load ao.testing-agent                                 │
│     ├─ Read source files                                     │
│     ├─ Analyze code structure                                │
│     ├─ Generate tests                                        │
│     └─ Write test files                                     │
│                                                              │
│  3. PUSH BRANCH PHASE                                        │
│     ├─ git add .                                            │
│     ├─ git commit -m "feat: add tests"                       │
│     ├─ git push origin feature/test-task                     │
│     └─ Create branch if needed                               │
│                                                              │
│  4. CREATE PR PHASE                                          │
│     ├─ Create pull request                                   │
│     ├─ Add reviewers                                        │
│     └─ Set PR metadata                                      │
│                                                              │
│  5. PR REVIEW PHASE (standard only)                         │
│     ├─ Run CI checks                                        │
│     ├─ Verify tests pass                                     │
│     └─ Update PR status                                     │
│                                                              │
│  6. TASK COMPLETED                                           │
│     └─ ao.task.status → "done"                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Monitoring Workflows

```bash
# List running workflows
ao workflow list --status running

# Get workflow details
ao workflow get wf-abc123

# Monitor workflow output
ao output monitor --run-id <run_id>

# Cancel workflow
ao workflow cancel wf-abc123
```

### Queue Management

```bash
# View queue
ao queue list

# Enqueue new workflow
ao queue enqueue --task-id TASK-002 --workflow-ref ao.testing/standard

# Hold queue entry
ao queue hold <subject_id>

# Release held entry
ao queue release <subject_id>
```

## Via Direct Agent Execution

For custom workflows, run agents directly:

```bash
# Via AO agent API
ao.agent.run {
  tool: "claude",
  model: "claude-3-5-sonnet-20241022",
  prompt: "Generate tests for src/utils.ts using Vitest"
}
```

## Pipeline Output

### Generated Files

After pipeline execution:

```
src/
├── utils.ts
└── tests/
    ├── utils-functions.test.ts
    └── utils-UtilsClass.test.ts

jest.config.js (Jest workflow)
jest.setup.ts (Jest workflow)
```

### Test Metadata

The `TestGenerationResult` includes metadata:

```typescript
interface TestGenerationResult {
  tests: GeneratedTest[];
  analysis: AnalyzedModule;
  metadata: {
    sourceFile: string;
    generatedAt: string;        // ISO timestamp
    framework: string;          // 'vitest' | 'jest'
    totalTests: number;         // Total test count
  };
}
```

## Verification

### Run Generated Tests

```bash
# Vitest
npm test
npm run test:run

# Jest
npm test
npm run jest
```

### Check Test Coverage

```bash
# Vitest
npx vitest run --coverage

# Jest
npx jest --coverage
```

### CI/CD Integration

#### GitHub Actions

```yaml
# .github/workflows/test-generation.yml
name: Test Generation

on:
  push:
    branches: [main]
  pull_request:
    types: [opened, synchronize]

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Generate tests
        run: npx ts-node scripts/generate-tests.ts
      
      - name: Run tests
        run: npm test
      
      - name: Create PR
        if: github.event_name == 'push'
        uses: peter-evans/create-pull-request@v4
        with:
          title: "feat: Generated tests"
          commit-message: "feat: add generated tests"
```

#### GitLab CI

```yaml
# .gitlab-ci.yml
generate-tests:
  stage: test
  script:
    - npm install
    - npx ts-node scripts/generate-tests.ts
    - npm test
  artifacts:
    reports:
      coverage: coverage/lcov.info
```

## Error Handling

### Pipeline Errors

```typescript
try {
  const result = generator.generate(analysis);
} catch (error) {
  if (error instanceof AnalysisError) {
    console.error('Analysis failed:', error.message);
  } else if (error instanceof GenerationError) {
    console.error('Test generation failed:', error.message);
  }
}
```

### Retry Logic

```typescript
async function generateWithRetry(
  sourceFile: SourceFile,
  maxRetries = 3
): Promise<TestGenerationResult> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return generator.generate(analysis);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('Max retries exceeded');
}
```

## Best Practices

1. **Incremental Generation**: Only generate tests for changed files
2. **CI Integration**: Run pipeline on every PR
3. **Coverage Thresholds**: Set minimum coverage requirements
4. **Review Generated Tests**: Always review before merging
5. **Maintain Test Files**: Don't auto-regenerate existing tests

## Next Steps

- [API Reference](./api-reference.md)
- [Extending the Pack](./extending.md)

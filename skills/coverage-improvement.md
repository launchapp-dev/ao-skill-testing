# Coverage Improvement Skill

## Overview

This skill pack component defines the coverage improvement agent, phase, and workflow for automated test coverage analysis and improvement based on vitest coverage reports.

## Agent: ao.coverage-improvement-agent

**Purpose**: Parse vitest coverage reports, identify under-tested modules and uncovered code paths, and generate targeted test cases for improved coverage.

### Agent Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.coverage-improvement-agent:
    description: "Analyze vitest coverage reports, identify untested code paths, and generate targeted tests to improve coverage"
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
      code_analysis: true
```

## Phase: ao.coverage-improvement-implement

**Purpose**: Generate targeted tests to improve coverage based on coverage report analysis.

```yaml
# workflows/skill-pack.yaml
phases:
  ao.coverage-improvement-implement:
    mode: agent
    agent: ao.coverage-improvement-agent
    directive: "Parse vitest coverage reports (JSON/LCOV/HTML), identify under-tested modules and uncovered code paths, generate targeted test cases for uncovered lines and branches, and support boundary condition edge case generation..."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true
```

## Coverage Report Formats Supported

| Format | File Extension | Parser |
|--------|---------------|--------|
| JSON | `.json` | Built-in JSON parser |
| LCOV | `.lcov` | Custom line-by-line parser |
| HTML | Directory with `index.html` | HTML scraping |

## Coverage Data Structure

```typescript
interface CoverageReport {
  /** Overall coverage statistics */
  totals: {
    lines: { covered: number; uncovered: number; pct: number };
    statements: { covered: number; uncovered: number; pct: number };
    functions: { covered: number; uncovered: number; pct: number };
    branches: { covered: number; uncovered: number; pct: number };
  };
  /** Per-file coverage data */
  files: FileCoverage[];
}

interface FileCoverage {
  /** File path */
  path: string;
  /** Line coverage data */
  lines: Array<{
    number: number;
    hit: boolean;
  }>;
  /** Branch coverage data */
  branches: Array<{
    line: number;
    type: string;
    taken: boolean;
  }>;
  /** Function coverage data */
  functions: Array<{
    name: string;
    line: number;
    hit: boolean;
  }>;
}
```

## Coverage Improvement Workflow

### 1. Parse Coverage Report

Parse coverage data from vitest output:

```bash
# Generate coverage report
npm run test -- --coverage

# Output locations
# - JSON: coverage/coverage-final.json
# - LCOV: coverage/lcov.info
# - HTML: coverage/lcov-report/index.html
```

### 2. Identify Uncovered Code

Analyze coverage report to find:

| Category | Description | Priority |
|----------|-------------|----------|
| Zero-coverage files | Files with 0% coverage | Critical |
| Low-coverage files | Files below threshold (e.g., <50%) | High |
| Uncovered lines | Lines not executed | High |
| Uncovered branches | Branch conditions not taken | Medium |
| Uncovered functions | Functions never called | Critical |

### 3. Generate Targeted Tests

For each uncovered item, generate:

- **Line coverage**: Tests that execute specific lines
- **Branch coverage**: Tests for both true/false branches
- **Function coverage**: Tests that call specific functions
- **Boundary cases**: Edge conditions for numeric/string inputs

## Generated Test Structure

### Example Output

```typescript
/**
 * Coverage improvement tests for uncovered module
 * Generated based on coverage report analysis
 */

import { describe, it, expect, vi } from 'vitest';
import { moduleUnderTest } from '../module-under-test';

describe('Coverage Improvement: uncovered-module', () => {
  describe('Line Coverage Targets', () => {
    it('should cover line 42 - error handling branch', () => {
      // Target: Uncovered line 42 (error path)
      expect(() => moduleUnderTest.process(undefined))
        .toThrow('Expected valid input');
    });

    it('should cover line 58 - null check branch', () => {
      // Target: Uncovered line 58 (null handling)
      const result = moduleUnderTest.format(null);
      expect(result).toBe('');
    });
  });

  describe('Branch Coverage Targets', () => {
    it('should cover both branches of conditional at line 75', () => {
      // Branch: value > 0 (true)
      expect(moduleUnderTest.classify(5)).toBe('positive');
      
      // Branch: value > 0 (false)
      expect(moduleUnderTest.classify(-5)).toBe('non-positive');
    });

    it('should cover both branches of type check at line 82', () => {
      // Branch: typeof x === 'string' (true)
      expect(moduleUnderTest.transform('hello')).toBe('HELLO');
      
      // Branch: typeof x === 'string' (false)
      expect(moduleUnderTest.transform(123)).toBe(246);
    });
  });

  describe('Function Coverage Targets', () => {
    it('should cover helper function parseConfig', () => {
      // Target: parseConfig function
      const result = moduleUnderTest.parseConfig({ timeout: 5000 });
      expect(result).toMatchObject({ timeout: 5000 });
    });

    it('should cover helper function validateInput', () => {
      // Target: validateInput function
      const result = moduleUnderTest.validateInput('valid-input');
      expect(result).toBe(true);
    });
  });

  describe('Boundary Condition Tests', () => {
    it('should handle empty string boundary', () => {
      // Boundary: empty string edge case
      expect(moduleUnderTest.truncate('')).toBe('');
    });

    it('should handle maximum value boundary', () => {
      // Boundary: MAX_SAFE_INTEGER
      expect(moduleUnderTest.calculate(Number.MAX_SAFE_INTEGER))
        .toBeDefined();
    });

    it('should handle zero boundary', () => {
      // Boundary: zero value
      expect(moduleUnderTest.divide(10, 0)).toBe(Infinity);
    });

    it('should handle negative zero boundary', () => {
      // Boundary: -0 edge case
      expect(moduleUnderTest.isNegative(-0)).toBe(true);
    });

    it('should handle array length boundary', () => {
      // Boundary: empty array
      expect(moduleUnderTest.sum([])).toBe(0);
      
      // Boundary: single element
      expect(moduleUnderTest.sum([1])).toBe(1);
      
      // Boundary: very large array (boundary)
      const largeArray = Array(10000).fill(1);
      expect(moduleUnderTest.sum(largeArray)).toBe(10000);
    });
  });
});
```

## Coverage Improvement Algorithm

### 1. Coverage Report Parsing

```typescript
async function parseCoverageReport(format: 'json' | 'lcov' | 'html'): Promise<CoverageReport> {
  switch (format) {
    case 'json':
      return parseJsonCoverage();
    case 'lcov':
      return parseLcovCoverage();
    case 'html':
      return parseHtmlCoverage();
  }
}
```

### 2. Uncovered Code Identification

```typescript
function identifyUncoveredItems(report: CoverageReport): UncoveredItems {
  return {
    zeroCoverageFiles: report.files.filter(f => f.totals.pct === 0),
    lowCoverageFiles: report.files.filter(f => f.totals.pct < 50),
    uncoveredLines: report.files.flatMap(f => f.lines.filter(l => !l.hit)),
    uncoveredBranches: report.files.flatMap(f => f.branches.filter(b => !b.taken)),
    uncoveredFunctions: report.files.flatMap(f => f.functions.filter(fn => !fn.hit)),
  };
}
```

### 3. Test Generation Strategy

```typescript
function generateTestsForUncovered(
  uncovered: UncoveredItems,
  sourceFiles: Map<string, string>
): GeneratedTest[] {
  const tests: GeneratedTest[] = [];

  // Generate tests for uncovered lines
  for (const line of uncovered.uncoveredLines) {
    tests.push(generateLineCoverageTest(line, sourceFiles.get(line.path)));
  }

  // Generate tests for uncovered branches
  for (const branch of uncovered.uncoveredBranches) {
    tests.push(generateBranchCoverageTest(branch, sourceFiles.get(branch.path)));
  }

  // Generate tests for uncovered functions
  for (const fn of uncovered.uncoveredFunctions) {
    tests.push(generateFunctionCoverageTest(fn, sourceFiles.get(fn.path)));
  }

  return tests;
}
```

## Edge Case Categories for Coverage

| Category | Examples | Coverage Target |
|----------|----------|-----------------|
| Empty values | `""`, `[]`, `{}`, `null`, `undefined` | Lines with null checks |
| Boundary numbers | `0`, `-1`, `MAX`, `MIN` | Numeric comparisons |
| Type boundaries | `NaN`, `Infinity`, `-0` | Type checks |
| String boundaries | `""`, `"a"`, very long strings | String operations |
| Array boundaries | `[]`, `[x]`, very large arrays | Array methods |
| Error conditions | Exception throws | Error handling branches |

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `targetCoverage` | `80` | Target coverage percentage |
| `minFileCoverage` | `50` | Minimum coverage per file |
| `priorityOrder` | `["zero", "low", "uncovered"]` | Test generation order |
| `includeBranches` | `true` | Generate branch coverage tests |
| `includeFunctions` | `true` | Generate function coverage tests |
| `includeBoundary` | `true` | Generate boundary case tests |
| `coverageFormat` | `"json"` | Coverage report format |

## Coverage Thresholds

| Level | Coverage | Action |
|-------|----------|--------|
| Critical | < 10% | Block PR, generate tests immediately |
| Low | 10-50% | Warning, generate tests |
| Medium | 50-80% | Suggestion, generate tests |
| Good | 80-95% | Acceptable, optional improvement |
| Excellent | > 95% | No action needed |

## Usage

### Run the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/coverage-generate --task TASK-001

# With coverage report path
ao workflow run --workflow ao.testing/coverage-generate --task TASK-001 --input '{"coveragePath": "coverage/coverage-final.json"}'
```

### Direct API Usage

```typescript
import { CoverageImprovementAgent, parseCoverageReport } from 'ao-skill-testing';

const agent = new CoverageImprovementAgent({
  targetCoverage: 80,
  minFileCoverage: 50,
  includeBranches: true,
  includeFunctions: true,
  includeBoundary: true,
});

// Parse coverage report
const report = await parseCoverageReport('coverage/coverage-final.json', 'json');

// Identify uncovered code
const uncovered = agent.identifyUncoveredItems(report);

// Generate targeted tests
const tests = await agent.generateTests(uncovered, sourceFiles);

// Run and verify coverage
const updatedReport = await agent.runAndVerify(tests);

console.log(`Coverage improved from ${report.totals.lines.pct}% to ${updatedReport.totals.lines.pct}%`);
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Coverage Improvement
on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Target coverage percentage'
        default: '80'
        
jobs:
  improve-coverage:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run tests with coverage
        run: npm run test -- --coverage
        
      - name: Generate coverage improvement tests
        run: npx ao workflow run --workflow ao.testing/coverage-generate --task ${{ github.event.inputs.task_id }}
        
      - name: Run updated tests
        run: npm run test -- --coverage
        
      - name: Check coverage threshold
        run: npx ao coverage check --min 80
```

## Files

- `runtime/agents.yaml` - Agent configuration
- `workflows/skill-pack.yaml` - Phase and workflow definitions
- `pack.toml` - Pack manifest with exports
- `skills/coverage-improvement.md` - This documentation

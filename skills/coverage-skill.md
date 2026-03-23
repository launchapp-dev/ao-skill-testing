# Coverage Skill Pack Component

## Overview

This skill pack component provides the coverage improvement functionality for automated test coverage analysis and improvement. It defines the agent, phase, and workflow needed to analyze coverage reports and generate targeted tests.

## References

This skill pack addresses the following requirements:
- **REQ-006**: Test coverage improvement skill - Coverage skill agent analyzes coverage reports, identifies under-tested modules, generates targeted test cases, supports vitest/jest/pytest formats, and includes edge case generation
- **REQ-008**: Coverage improvement skill agent - Analyzes vitest coverage reports (JSON/LCOV/HTML format), generates targeted tests for uncovered code paths, includes boundary condition edge case generation

## Agent: ao.coverage-improvement-agent

**Purpose**: Analyze coverage reports and generate targeted tests to improve code coverage.

### Configuration

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

### System Prompt Summary

The agent is configured with a detailed system prompt that enables:
- Parsing vitest coverage reports in JSON, LCOV, and HTML formats
- Identifying untested code paths (zero-coverage, low-coverage, uncovered lines/branches/functions)
- Generating targeted test cases for coverage improvement
- Supporting boundary condition edge case generation
- Working with vitest, jest, and pytest coverage formats

## Phase: coverage-analysis

**Purpose**: Analyze coverage reports and identify areas needing test improvement.

```yaml
# workflows/skill-pack.yaml
phases:
  coverage-analysis:
    mode: agent
    agent: ao.coverage-improvement-agent
    directive: "Analyze vitest coverage reports, identify under-tested modules and uncovered code paths. Parse coverage/coverage-final.json or coverage/lcov.info to find zero-coverage files, low-coverage files below 80%, uncovered lines, branches, and functions. Prioritize targets by impact."
    capabilities:
      mutates_state: false
      generates_code: false
      code_analysis: true
```

## Workflow: coverage

**Purpose**: End-to-end coverage improvement workflow from analysis to test generation.

```yaml
# workflows/skill-pack.yaml
workflows:
  - id: coverage
    name: "Coverage Improvement Workflow"
    description: "Analyze coverage reports and generate targeted tests to improve coverage"
    phases:
      - coverage-analysis
      - coverage-test-generate
      - coverage-verify
```

## Coverage Report Formats

| Format | File Path | Description |
|--------|-----------|-------------|
| JSON | `coverage/coverage-final.json` | Structured vitest coverage output |
| LCOV | `coverage/lcov.info` | Line-by-line coverage format |
| HTML | `coverage/lcov-report/index.html` | Human-readable coverage report |

## Coverage Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Lines | 80%+ | Executable source lines |
| Statements | 80%+ | Individual statements |
| Functions | 90%+ | Function definitions |
| Branches | 80%+ | Conditional paths |

## Acceptance Criteria (REQ-006, REQ-008)

### Must Support

- [x] Parse vitest coverage reports (JSON/LCOV/HTML)
- [x] Identify zero-coverage files
- [x] Identify low-coverage files (<80%)
- [x] Identify uncovered lines
- [x] Identify uncovered branches
- [x] Identify uncovered functions
- [x] Generate targeted tests for uncovered code
- [x] Generate boundary condition edge case tests
- [x] Support jest coverage formats
- [x] Support pytest coverage formats

### Should Support

- [x] Prioritize by coverage gap impact
- [x] Group tests by source file
- [x] Include both happy-path and error scenario tests
- [x] Maintain test quality standards

## Generated Test Structure

Tests are organized in `tests/coverage/` directory:

```
tests/coverage/
  {filename}.coverage.test.ts  # Per-file coverage tests
  coverage-helpers.ts          # Shared test utilities
```

### Test Categories

1. **Line Coverage Tests**: Target specific uncovered lines
2. **Branch Coverage Tests**: Test both branches of conditionals
3. **Function Coverage Tests**: Call uncovered functions
4. **Boundary Tests**: Edge cases (empty, null, max values, etc.)

## Usage

### Run Coverage Workflow

```bash
# Analyze and generate tests
ao workflow run --workflow coverage --task TASK-001

# With custom coverage path
ao workflow run --workflow coverage --task TASK-001 --input '{"coveragePath": "coverage/coverage-final.json"}'
```

### Individual Phases

```bash
# Analyze only
ao workflow run --phase coverage-analysis --task TASK-001

# Generate tests for specific gaps
ao workflow run --phase coverage-test-generate --task TASK-001
```

## Files

| File | Purpose |
|------|---------|
| `runtime/agents.yaml` | Agent configuration (ao.coverage-improvement-agent) |
| `workflows/skill-pack.yaml` | Phase (coverage-analysis) and workflow (coverage) definitions |
| `pack.toml` | Pack manifest with exports |
| `skills/coverage-skill.md` | This skill pack component documentation |

## Integration

This skill pack integrates with:
- **ao.testing**: Test generation skill pack
- **ao.jest-test-generator**: Jest-specific test generation
- **ao.pytest-test-generator**: Python pytest test generation

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-03-22 | Initial coverage skill pack with coverage-analysis phase |

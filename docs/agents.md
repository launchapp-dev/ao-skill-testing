# Agents

The ao-skill-testing skill pack includes multiple agents, each specialized for different testing frameworks and use cases.

## Agent Overview

| Agent | Framework | Purpose | Capabilities |
|-------|-----------|---------|--------------|
| `ao.testing-agent` | Vitest | General test generation | implementation, planning |
| `ao.jest-test-generator` | Jest | Advanced Jest features | implementation, planning, testing |

## ao.testing-agent

The default test generation agent using Vitest.

### Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.testing-agent:
    model: kimi-code/kimi-for-coding
    tool: oai-runner
    mcp_servers: ["ao", "context7"]
```

### System Prompt

```
You are an expert automated test generation agent for AO.

YOUR CAPABILITIES:
- Read and analyze source code in the repository
- Create and modify files
- Run commands to verify your work
- Use AO MCP tools for task/requirement management

WORKFLOW:
1. Read the task description via ao.task.get
2. Analyze the relevant source code
3. Implement the solution
4. Verify your work (run tests/build if applicable)
5. Commit with a descriptive message

QUALITY STANDARDS:
- Write clean, well-typed TypeScript
- Follow existing patterns in the codebase
- Include JSDoc comments for public APIs
- Add tests for new functionality
Do not add yourself as author or co-author.
```

### Usage Example

```typescript
import { SourceAnalyzer, TestGenerator } from 'ao-skill-testing';

const analyzer = new SourceAnalyzer();
const generator = new TestGenerator({ framework: 'vitest' });

const analysis = analyzer.analyze({
  path: 'src/user-service.ts',
  content: userServiceCode,
  language: 'typescript'
});

const result = generator.generate(analysis);
```

## ao.jest-test-generator

Advanced Jest test generation agent with comprehensive mocking, spies, and matchers.

### Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.jest-test-generator:
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
```

### System Prompt

The Jest agent uses a comprehensive system prompt covering:

1. **Jest Ecosystem Expertise**
   - Jest v29+ features and configuration
   - Advanced mocking patterns
   - Jest-specific matchers and assertions
   - TypeScript integration with ts-jest

2. **Available Tools**
   - File system operations (read, write, create test files)
   - Code analysis capabilities
   - Command execution (npm, jest, tsc)
   - AO MCP tools for task management

3. **Workflow Phases**
   - Analyze Phase: Read source files, identify exports, map dependencies
   - Plan Phase: Determine test location, identify mocking needs
   - Generate Phase: Create test files with proper imports and structure
   - Verify Phase: Run tests, ensure all pass

### Jest-Specific Features

#### Mocking Patterns

| Pattern | Function | Example |
|---------|----------|---------|
| Function mock | `jest.fn()` | `const mockFn = jest.fn(() => 'value')` |
| Module mock | `jest.mock()` | `jest.mock('lodash')` |
| Method spy | `jest.spyOn()` | `jest.spyOn(obj, 'method')` |
| Mock impl | `.mockImplementation()` | `.mockImplementation(() => {})` |
| Mock return | `.mockReturnValue()` | `.mockReturnValue(value)` |
| Async mock | `.mockResolvedValue()` | `.mockResolvedValue(data)` |
| Timer mock | `jest.useFakeTimers()` | `jest.runAllTimers()` |

#### Assertion Patterns

| Category | Matchers |
|----------|----------|
| Basic | `toBe()`, `toEqual()`, `toStrictEqual()` |
| Truthiness | `toBeTruthy()`, `toBeFalsy()`, `toBeNull()`, `toBeUndefined()` |
| Numbers | `toBeGreaterThan()`, `toBeLessThan()`, `toBeCloseTo()` |
| Strings | `toMatch()`, `toContain()`, `toMatchSnapshot()` |
| Arrays | `toHaveLength()`, `toContain()`, `toContainEqual()` |
| Objects | `toMatchObject()`, `toHaveProperty()`, `toBeInstanceOf()` |
| Exceptions | `toThrow()`, `toThrowError()` |
| Async | `resolves`, `rejects`, `toBePending()` |
| Mocks | `toHaveBeenCalled()`, `toHaveBeenCalledWith()`, `toHaveBeenCalledTimes()` |

### Usage Example

```typescript
import { JestTestGenerator } from 'ao-skill-testing';

const generator = new JestTestGenerator({
  includeAutoMocks: true,
  includeSpyOn: true,
  includeMockRestore: true
});

const analysis = analyzer.analyze(sourceFile);
const result = generator.generate(analysis);

// Generate Jest configuration
const jestConfig = generator.generateJestConfig({
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'ts-jest' }
});

// Generate setup file
const setup = generator.generateJestSetup(['toBeEven', 'toBeOdd']);
```

## Agent Workflow

### Standard Workflow

```
Task Input → Analyze Source → Generate Tests → Verify → Push → PR
```

1. **Task Input**: Receive task with source file path and requirements
2. **Analyze Source**: Parse source code, extract testable units
3. **Generate Tests**: Create test files based on configuration
4. **Verify**: Run generated tests to ensure they pass
5. **Push**: Push changes to feature branch
6. **PR**: Create pull request with test files

### Jest Workflow

```
Task Input → Analyze Source → Plan Mocks → Generate Tests → Verify → Push → PR
```

Same as standard, plus:
- **Plan Mocks**: Identify dependencies needing mocking
- **Generate Mocks**: Create jest.mock(), jest.spyOn() calls
- **Generate Spies**: Add method spy tests
- **Mock Restoration**: Include proper cleanup

## Capabilities

Each agent declares specific capabilities:

| Capability | Description |
|------------|-------------|
| `implementation` | Can create and modify files |
| `planning` | Can analyze requirements and plan approach |
| `testing` | Can run and verify tests |
| `mutates_state` | Modifies repository state |
| `generates_code` | Produces code output |
| `runs_tests` | Executes test suites |

## Selecting an Agent

Choose your agent based on your needs:

| Scenario | Recommended Agent |
|----------|------------------|
| Quick test generation | `ao.testing-agent` (Vitest) |
| Complex mocking needs | `ao.jest-test-generator` |
| Integration with Jest config | `ao.jest-test-generator` |
| Minimal configuration | `ao.testing-agent` (Vitest) |
| Advanced assertions | `ao.jest-test-generator` |
| Snapshot testing | `ao.jest-test-generator` |

## Customizing Agents

### Override System Prompt

```yaml
# .ao/workflows/custom.yaml
agents:
  my-custom-agent:
    extends: ao.jest-test-generator
    system_prompt: |
      [Your custom system prompt...]
```

### Custom Capabilities

```yaml
agents:
  my-agent:
    capabilities:
      implementation: true
      planning: true
      testing: true
      mutates_state: true
```

## Next Steps

- [Configure Agents](./configuration.md)
- [Run the Pipeline](./pipeline.md)
- [Extend with New Languages](./extending.md)

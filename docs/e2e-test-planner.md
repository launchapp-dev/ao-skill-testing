# E2E Test Planner Agent

The `ao.e2e-test-planner` agent analyzes application source code to identify user flows, event handlers, and business logic. It generates comprehensive E2E test plans in markdown format.

## Overview

| Property | Value |
|----------|-------|
| Agent | `ao.e2e-test-planner` |
| Framework | N/A (Planning/Documentation) |
| Purpose | Generate E2E test plans |
| Capabilities | Planning, Generates Code |

## Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.e2e-test-planner:
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: false
      planning: true
      testing: false
```

## System Prompt Summary

The E2E Test Planner agent uses a comprehensive system prompt covering:

1. **Source Code Analysis**
   - User flow identification
   - Event handler detection
   - Business logic mapping
   - State management analysis

2. **Application Framework Detection**
   - React, Vue, Angular, Next.js
   - Express, FastAPI, Django
   - Mobile frameworks (React Native, Flutter)

3. **Test Plan Generation**
   - Happy path scenarios
   - Error recovery cases
   - Edge case coverage
   - API endpoint documentation

## Workflow Phases

### Discovery Phase
- Read task description via `ao.task.get`
- Identify application entry points
- Determine framework type
- Map project structure

### Source Analysis Phase
Identifies in each source file:

| Category | What it Captures |
|----------|------------------|
| User Flows | Navigation, interactions, data submission |
| Event Handlers | Click, change, submit, keyboard events |
| Business Logic | Calculations, validations, state changes |
| API Calls | Endpoints, request/response patterns |
| Auth Flows | Login, logout, permissions |

### Test Plan Generation Phase

Generates markdown with structured sections:

```markdown
# E2E Test Plan: [Application]

## Overview
- Application Type
- Framework
- Test Scope
- Priority

## User Flows
### [Flow Name]
- Steps
- Happy Path
- Error Cases
- Edge Cases

## Event Handlers
| Event | Trigger | Handler | Coverage |

## Business Logic
### [Logic Name]
- Test Scenarios
- Valid/Invalid Inputs

## API Endpoints
| Endpoint | Method | Auth | Tests |

## Test Coverage Summary
| Feature | Happy | Error | Edge |
|---------|-------|------|------|
```

## Test Categorization

### Happy Path Tests
- Main user flows working correctly
- Standard input/output scenarios
- Typical user behavior sequences
- Successful API calls with valid data
- Normal state transitions

### Error Recovery Tests
| Category | Examples |
|----------|----------|
| Input Validation | Invalid email, wrong format |
| Network | Timeout, offline, rate limiting |
| Authentication | Wrong password, expired session |
| Authorization | Insufficient permissions |
| Data | Duplicate records, constraint violations |
| Service | 500 errors, maintenance mode |

### Edge Case Tests
| Category | Examples |
|----------|----------|
| Empty Values | null, undefined, empty string |
| Boundary | Max length, zero, negative |
| Characters | Unicode, special chars, SQL injection |
| Concurrency | Race conditions, parallel requests |
| State | Browser back, direct URL, cache |
| Scale | Large datasets, many records |

## Priority Levels

| Priority | Description | Coverage Requirement |
|----------|-------------|---------------------|
| P0 | Critical paths (login, checkout) | Mandatory |
| P1 | Important features | High coverage |
| P2 | Nice-to-have features | Standard coverage |

## Usage Example

### Via Workflow (AO Daemon)

```bash
# Run E2E test planning workflow
ao workflow run --workflow ao.testing/e2e-plan --task TASK-001
```

### Via API

```typescript
import { E2ETestPlanner } from 'ao-skill-testing';

const planner = new E2ETestPlanner();

const result = planner.analyze({
  entryPoint: 'src/App.tsx',
  framework: 'react',
  includeAPIs: true,
  includeAuth: true
});

console.log(result.testPlan);
```

## Output Structure

The agent generates `e2e-test-plan.md` with:

1. **Header Section**
   - Application metadata
   - Test scope and priorities

2. **User Flows Section**
   - Named flows with step-by-step descriptions
   - Happy path test scenarios
   - Error case tables
   - Edge case lists

3. **Event Handlers Section**
   - Component-based table
   - Event type categorization
   - Test coverage checkboxes

4. **Business Logic Section**
   - Logic location mapping
   - Input/output scenarios
   - Validation patterns

5. **API Endpoints Section**
   - Endpoint documentation
   - Request/response examples
   - Error response codes

6. **Coverage Summary**
   - Feature matrix
   - Coverage checkboxes
   - Priority indicators

## Workflow Integration

```
Task Input → Discovery → Analysis → Plan Generation → Push → PR
```

| Phase | Agent | Action |
|-------|-------|--------|
| `ao.e2e-test-plan` | `ao.e2e-test-planner` | Analyze source, generate plan |
| `push-branch` | System | Push to branch |
| `create-pr` | System | Create pull request |
| `pr-review` | System | Review changes |

## Quality Standards

- Every user flow MUST have test coverage
- All P0 flows require happy path + error cases + edge cases
- Event handlers categorized by priority (P0/P1/P2)
- API endpoints include success and error responses
- Use consistent naming conventions
- Document prerequisites and dependencies

## Next Steps

- [Configure Agents](./configuration.md)
- [Run the Pipeline](./pipeline.md)
- [Extend with New Languages](./extending.md)
- [API Reference](./api-reference.md)

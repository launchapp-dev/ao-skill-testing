# E2E Test Planner Skill

## Overview

This skill pack component defines the E2E test planner agent, phase, and workflow for automated end-to-end test planning from source code analysis.

## Agent: ao.e2e-test-planner

**Purpose**: Analyze application source code to identify user flows, event handlers, and business logic. Generate comprehensive E2E test plans in markdown format covering happy paths, error recovery, and edge cases.

### Agent Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.e2e-test-planner:
    description: "Analyze application source code to identify user flows, event handlers, and business logic. Generate structured E2E test plans in markdown format covering happy paths, error recovery, and edge cases."
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: false
      planning: true
      testing: false
```

## Phase: ao.e2e-test-plan

**Purpose**: Analyze application source code and generate comprehensive E2E test plans in markdown format.

```yaml
# workflows/skill-pack.yaml
phases:
  ao.e2e-test-plan:
    mode: agent
    agent: ao.e2e-test-planner
    directive: "Analyze application source code to identify user flows, event handlers, and business logic. Generate comprehensive E2E test plans in markdown format covering happy paths, error recovery, and edge cases. Output to e2e-test-plan.md."
    capabilities:
      mutates_state: true
      generates_code: true
```

## Acceptance Criteria

### 1. Source Code Analysis

| Feature | Description | Status |
|---------|-------------|--------|
| User flow identification | Identify navigation, interactions, data submission flows | ✅ Implemented |
| Event handler detection | Detect click, change, submit, keyboard events | ✅ Implemented |
| Business logic mapping | Map calculations, validations, state changes | ✅ Implemented |
| State management analysis | Analyze Redux, Context, local state patterns | ✅ Implemented |
| API endpoint identification | Detect endpoints, request/response patterns | ✅ Implemented |

### 2. Framework Detection

| Framework | Detection | Status |
|-----------|-----------|--------|
| React | JSX, hooks, component patterns | ✅ Implemented |
| Vue | .vue files, Composition API | ✅ Implemented |
| Angular | @Component decorators, NgModule | ✅ Implemented |
| Next.js | pages/, app/ directory, getServerSideProps | ✅ Implemented |
| Express | app.get(), app.post(), route handlers | ✅ Implemented |
| FastAPI | @app.get(), @app.post(), Pydantic models | ✅ Implemented |
| Django | views.py, urls.py, models.py | ✅ Implemented |
| React Native | React Native components, navigation | ✅ Implemented |
| Flutter | Widget classes, Navigator | ✅ Implemented |

### 3. Test Plan Generation

| Feature | Description | Status |
|---------|-------------|--------|
| Happy path scenarios | Main user flows working correctly | ✅ Implemented |
| Error recovery cases | Invalid input, network failure, timeout | ✅ Implemented |
| Edge case coverage | Empty inputs, boundary values, special chars | ✅ Implemented |
| API endpoint documentation | Endpoints with request/response examples | ✅ Implemented |
| Authentication flows | Login, logout, session management | ✅ Implemented |
| Priority categorization | P0/P1/P2 prioritization | ✅ Implemented |

### 4. Markdown Output

| Feature | Description | Status |
|---------|-------------|--------|
| Structured sections | Overview, User Flows, Event Handlers | ✅ Implemented |
| Coverage checkboxes | [ ] for tracking test coverage | ✅ Implemented |
| Priority indicators | P0/P1/P2 markers on flows | ✅ Implemented |
| File path references | Traceability to source code | ✅ Implemented |
| Prerequisites section | Environment setup, test data | ✅ Implemented |

## Generated Test Plan Structure

### Example Output

```markdown
# E2E Test Plan: User Authentication System

## Overview
- **Application Type:** Web Application
- **Framework:** Next.js + Supabase
- **Test Scope:** Full authentication flow
- **Priority:** Critical

## User Flows

### Login Flow
**Priority:** P0
**Description:** User logs in with email and password

#### Steps
1. Navigate to login page (/login)
2. Enter valid email address
3. Enter valid password
4. Click "Sign In" button
5. Verify redirect to dashboard
6. Verify session token is stored

#### Happy Path Test
```
Test: Login with valid credentials
Given: User has registered account with email "user@example.com"
When: User enters "user@example.com" and "ValidPassword123"
Then: User is redirected to /dashboard and receives session token
```

#### Error Cases
| Scenario | Input | Expected Result |
|----------|-------|------------------|
| Invalid email | user@invalid | "Please enter a valid email" |
| Wrong password | password123 | "Invalid email or password" |
| Account locked | valid creds | "Account temporarily locked" |
| Network error | valid creds | "Connection failed. Please try again." |

#### Edge Cases
- Login with email that has uppercase letters (should normalize)
- Login with whitespace in email/password
- Rapid repeated login attempts (rate limiting)
- Session expires mid-flow
- Browser cookies disabled

### Registration Flow
**Priority:** P0
**Description:** New user creates an account

#### Steps
1. Navigate to registration page (/register)
2. Enter valid email address
3. Enter password meeting requirements
4. Confirm password
5. Click "Create Account"
6. Verify email verification sent

#### Happy Path Test
```
Test: Registration with valid data
Given: User has valid email and password
When: User completes registration form
Then: Account created, verification email sent
```

#### Error Cases
| Scenario | Input | Expected Result |
|----------|-------|------------------|
| Email already exists | existing@email.com | "Email already registered" |
| Password too short | "123" | "Password must be at least 8 characters" |
| Passwords don't match | pass1, pass2 | "Passwords do not match" |
| Invalid email format | notanemail | "Please enter a valid email" |

## Event Handlers

### Component: LoginForm

| Event | Trigger | Handler | Test Coverage |
|-------|---------|---------|---------------|
| onSubmit | Form submission | handleLogin | [ ] |
| onChange | Input change | handleEmailChange | [ ] |
| onChange | Input change | handlePasswordChange | [ ] |
| onClick | Button click | handleForgotPassword | [ ] |

### Component: RegisterForm

| Event | Trigger | Handler | Test Coverage |
|-------|---------|---------|---------------|
| onSubmit | Form submission | handleRegister | [ ] |
| onChange | Input change | handleEmailChange | [ ] |
| onChange | Input change | handlePasswordChange | [ ] |
| onChange | Input change | handleConfirmPasswordChange | [ ] |

## Business Logic

### Email Validation
**Type:** Validation
**Location:** src/utils/validation.ts

#### Test Scenarios
- Valid email: `user@example.com` → passes
- Invalid email: `notanemail` → returns validation error
- Email with subdomain: `user@mail.example.com` → passes
- Email with plus addressing: `user+tag@example.com` → passes

### Password Strength Check
**Type:** Validation
**Location:** src/utils/validation.ts

#### Test Scenarios
- Strong password: `Str0ng!Pass` → passes
- Too short: `short1!` → returns "Password too short"
- No number: `NoNumbers!` → returns "Password must contain a number"
- No special char: `Str0ngPassword` → returns "Password must contain special character"

## API Endpoints

### Endpoint: /api/auth/login
**Method:** POST
**Auth Required:** No

| Scenario | Request | Response |
|----------|---------|----------|
| Success | { email, password } | 200 { token, user } |
| Invalid credentials | { email, password } | 401 { error } |
| Rate limited | { email, password } | 429 { error } |

### Endpoint: /api/auth/register
**Method:** POST
**Auth Required:** No

| Scenario | Request | Response |
|----------|---------|----------|
| Success | { email, password } | 201 { message } |
| Email taken | { email, password } | 409 { error } |
| Validation error | { email: "" } | 400 { error } |

## Test Coverage Summary

| Flow | Happy Path | Error Cases | Edge Cases |
|------|------------|-------------|------------|
| Login | [x] | [x] | [x] |
| Logout | [x] | [ ] | [x] |
| Password Reset | [x] | [x] | [x] |
| Registration | [x] | [x] | [x] |
| Session Management | [x] | [x] | [ ] |

## Prerequisites
- [ ] Test email accounts created
- [ ] Test environment configured
- [ ] Network throttling tools ready
- [ ] Test data prepared

## Risks and Notes
- Third-party auth provider (Supabase) may have rate limits
- Email delivery may be delayed in test environment
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

## Usage

### Run the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/e2e-plan --task TASK-001
```

### Direct API Usage

```typescript
import { E2ETestPlanner, analyzeSourceCode } from 'ao-skill-testing';

const planner = new E2ETestPlanner({
  includeHappyPath: true,
  includeErrorCases: true,
  includeEdgeCases: true,
  includeAuthFlows: true,
  includeAPIEndpoints: true,
  outputPath: 'e2e-test-plan.md',
});

const result = planner.analyze({
  entryPoint: 'src/App.tsx',
  framework: 'react',
  sourceFiles: [
    'src/pages/Login.tsx',
    'src/pages/Register.tsx',
    'src/components/AuthForm.tsx',
  ],
});

console.log(result.testPlan);
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `includeHappyPath` | `true` | Generate happy path test scenarios |
| `includeErrorCases` | `true` | Generate error recovery test cases |
| `includeEdgeCases` | `true` | Generate edge case test scenarios |
| `includeAuthFlows` | `true` | Document authentication flows |
| `includeAPIEndpoints` | `true` | Document API endpoints |
| `includeEventHandlers` | `true` | Document event handler coverage |
| `outputPath` | `"e2e-test-plan.md"` | Output file path |
| `priorityThreshold` | `"P1"` | Minimum priority level to document |
| `maxFlows` | `50` | Maximum flows to document |

## Files

- `runtime/agents.yaml` - Agent configuration
- `workflows/skill-pack.yaml` - Phase and workflow definitions
- `pack.toml` - Pack manifest with exports
- `docs/e2e-test-planner.md` - Detailed documentation
- `skills/e2e-test-planner.md` - This skill documentation

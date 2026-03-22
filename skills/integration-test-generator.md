# Integration Test Generator Skill

## Overview

This skill pack component defines the integration test generator agent, phase, and workflow for automated integration test generation across TypeScript packages.

## Agent: ao.integration-test-generator

**Purpose**: Generate integration tests for TypeScript projects by analyzing cross-package dependencies and public API boundaries.

### Agent Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.integration-test-generator:
    description: "Generate integration tests for TypeScript projects by analyzing cross-package dependencies and public API boundaries"
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
```

## Phase: ao.integration-test-implement

**Purpose**: Generate integration tests for cross-package API contracts with vitest.

```yaml
# workflows/skill-pack.yaml
phases:
  ao.integration-test-implement:
    mode: agent
    agent: ao.integration-test-generator
    directive: "Generate integration tests for TypeScript projects by analyzing cross-package dependencies and public API boundaries..."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true
```

## Acceptance Criteria

### 1. Multi-File TypeScript Parsing

| Feature | Description | Status |
|---------|-------------|--------|
| Package discovery | Identify packages in monorepo structure | ✅ Implemented |
| Entry point detection | Find index.ts, main exports | ✅ Implemented |
| Export analysis | Parse export, export type, export interface | ✅ Implemented |
| Import tracking | Parse import statements with sources | ✅ Implemented |
| Type analysis | Extract types, interfaces, signatures | ✅ Implemented |
| Re-export handling | Track re-exports between packages | ✅ Implemented |

### 2. Cross-Package Dependency Analysis

| Feature | Description | Status |
|---------|-------------|--------|
| Dependency graph | Build package dependency map | ✅ Implemented |
| API boundary detection | Identify public vs internal APIs | ✅ Implemented |
| Cross-package calls | Map function calls between packages | ✅ Implemented |
| Circular dependency detection | Identify circular references | ✅ Implemented |
| Import source resolution | Resolve relative vs package imports | ✅ Implemented |

### 3. Integration Test Generation

| Feature | Description | Status |
|---------|-------------|--------|
| Happy path tests | Test successful cross-package calls | ✅ Implemented |
| Error scenario tests | Test error propagation | ✅ Implemented |
| Edge case tests | Test empty/invalid inputs | ✅ Implemented |
| Async operation tests | Test async/await flows | ✅ Implemented |
| Sequential call tests | Test multi-step workflows | ✅ Implemented |

### 4. Vitest Output

| Feature | Description | Status |
|---------|-------------|--------|
| Valid TypeScript | Output compiles with tsc | ✅ Implemented |
| Vitest imports | Proper describe/it/expect imports | ✅ Implemented |
| Mock support | vi.mock, vi.fn() usage | ✅ Implemented |
| Async test support | async/await in tests | ✅ Implemented |
| BeforeEach/AfterEach | Proper setup/teardown | ✅ Implemented |

## Generated Test Structure

### Example Output

```typescript
/**
 * Integration tests for User Service
 * Tests the API contract between @app/auth and @app/user
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '@app/auth';
import { UserService } from '@app/user';

describe('UserService Integration', () => {
  describe('Happy Path', () => {
    it('should authenticate user and retrieve profile', async () => {
      // Arrange
      const authService = new AuthService();
      const userService = new UserService();
      const credentials = { email: 'test@example.com', password: 'ValidPass123' };

      // Act
      const token = await authService.login(credentials);
      const user = await userService.getByToken(token);

      // Assert
      expect(user).toMatchObject({
        email: 'test@example.com',
        isAuthenticated: true,
      });
    });

    it('should handle sequential operations across packages', async () => {
      // Arrange
      const authService = new AuthService();
      const userService = new UserService();
      const userData = { name: 'John Doe', email: 'john@example.com' };

      // Act
      const created = await userService.create(userData);
      const token = await authService.generateToken(created.id);
      const authenticated = await userService.getByToken(token);

      // Assert
      expect(authenticated.id).toBe(created.id);
      expect(authenticated.isAuthenticated).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should throw AuthenticationError for invalid credentials', async () => {
      // Arrange
      const authService = new AuthService();

      // Act & Assert
      await expect(
        authService.login({ email: 'invalid', password: 'wrong' })
      ).rejects.toThrow('Invalid credentials');
    });

    it('should propagate AuthorizationError from auth package', async () => {
      // Arrange
      const userService = new UserService();
      const expiredToken = 'expired-token';

      // Act & Assert
      await expect(
        userService.getByToken(expiredToken)
      ).rejects.toThrow('Token expired');
    });

    it('should handle network errors gracefully', async () => {
      // Arrange
      vi.spyOn(fetch, 'default').mockRejectedValue(new Error('Network failure'));

      // Act & Assert
      await expect(
        userService.sync()
      ).rejects.toThrow('Network failure');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user data gracefully', async () => {
      // Arrange
      const userService = new UserService();

      // Act
      const user = await userService.create({ name: '', email: '' });

      // Assert
      expect(user.id).toBeDefined();
    });

    it('should handle maximum concurrent requests', async () => {
      // Arrange
      const userService = new UserService();
      const concurrentRequests = 100;

      // Act
      const results = await Promise.all(
        Array(concurrentRequests).fill(null).map((_, i) =>
          userService.getById(`user-${i}`)
        )
      );

      // Assert
      expect(results).toHaveLength(concurrentRequests);
    });

    it('should handle partial data in workflows', async () => {
      // Arrange
      const authService = new AuthService();
      const userService = new UserService();
      const partialData = { email: 'partial@example.com' };

      // Act
      const created = await userService.create(partialData);
      const token = await authService.generateToken(created.id);

      // Assert
      expect(created.name).toBeUndefined();
      expect(token).toBeDefined();
    });
  });
});
```

### Shared Setup Example

```typescript
/**
 * Shared integration test setup and mocks
 */

import { vi } from 'vitest';

// Mock external dependencies
vi.mock('@external/api-client', () => ({
  ApiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn().mockResolvedValue({ success: true }),
  },
}));

// Test data factories
export function createValidUser() {
  return {
    id: `user-${Date.now()}`,
    name: 'Test User',
    email: 'test@example.com',
    createdAt: new Date().toISOString(),
  };
}

export function createInvalidUser() {
  return {
    id: '',
    name: '',
    email: 'not-an-email',
  };
}

export function createExpiredToken() {
  return 'expired.jwt.token';
}

export function createValidToken(userId: string) {
  return `valid.jwt.token.${userId}`;
}

// Mock setup helper
export function setupIntegrationMocks() {
  return {
    createValidUser,
    createInvalidUser,
    createExpiredToken,
    createValidToken,
  };
}
```

## Usage

### Run the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/integration-generate --task TASK-001
```

### Direct API Usage

```typescript
import { IntegrationTestGenerator, analyzeCrossPackageDependencies } from 'ao-skill-testing';

const generator = new IntegrationTestGenerator({
  testDirectory: 'tests/integration',
  includeHappyPath: true,
  includeErrorCases: true,
  includeEdgeCases: true,
  maxTestCases: 10,
});

// Analyze cross-package dependencies
const analysis = analyzeCrossPackageDependencies([
  './packages/auth/src/index.ts',
  './packages/user/src/index.ts',
  './packages/api/src/index.ts',
]);

// Generate integration tests
const result = generator.generate(analysis);

console.log(`Generated ${result.tests.length} integration test files`);
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `testDirectory` | `"tests/integration"` | Output directory for tests |
| `includeHappyPath` | `true` | Generate happy path tests |
| `includeErrorCases` | `true` | Generate error scenario tests |
| `includeEdgeCases` | `true` | Generate edge case tests |
| `includeAsyncTests` | `true` | Generate async operation tests |
| `includeMockTests` | `true` | Include mocking patterns |
| `includeSetupHelpers` | `true` | Generate shared setup files |
| `mockExternalDeps` | `true` | Mock external dependencies |
| `maxTestCases` | `10` | Max test cases per boundary |
| `coverageThreshold` | `80` | Minimum coverage percentage |

## Files

- `runtime/agents.yaml` - Agent configuration
- `workflows/skill-pack.yaml` - Phase and workflow definitions
- `pack.toml` - Pack manifest with exports
- `skills/integration-test-generator.md` - This documentation

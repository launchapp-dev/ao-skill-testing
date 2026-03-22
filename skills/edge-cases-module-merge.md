# Edge Cases Module Merge Skill

## Overview

This skill pack component defines the edge-cases module merge agent, phase, and workflow for merging edge-cases functionality from a feature branch while preserving existing code.

## Agent: ao.edge-cases-merge-agent

**Purpose**: Merge edge-cases module from origin/ao/task-013 branch while preserving existing code like pytest-test-generator.ts.

### Agent Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.edge-cases-merge-agent:
    description: "Merge edge-cases module from origin/ao/task-013 branch while preserving existing code like pytest-test-generator.ts"
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      git_operations: true
      conflict_resolution: true
```

## Phase: ao.edge-cases-merge-implement

**Purpose**: Execute the edge-cases module merge workflow.

```yaml
# workflows/skill-pack.yaml
phases:
  ao.edge-cases-merge-implement:
    mode: agent
    agent: ao.edge-cases-merge-agent
    directive: "Merge edge-cases module from origin/ao/task-013 branch. Extract files (detector.ts, generator.ts, types.ts, edge-cases.test.ts, index.ts), update src/index.ts to export edge-cases, preserve src/pytest-test-generator.ts, run tests to verify, and commit."
    capabilities:
      mutates_state: true
      git_operations: true
      conflict_resolution: true
```

## Workflow: ao.testing/edge-cases-merge

**Purpose**: Merge edge-cases module while preserving existing functionality.

```yaml
# workflows/skill-pack.yaml
workflows:
  - id: ao.testing/edge-cases-merge
    name: "Edge Cases Module Merge"
    description: "Merge edge-cases module from origin/ao/task-013 branch while preserving existing code like pytest-test-generator.ts"
    phases:
      - ao.edge-cases-merge-implement
      - push-branch
      - create-pr
      - pr-review
```

## Files Merged

### Source Files from origin/ao/task-013

| File | Description | Status |
|------|-------------|--------|
| `src/edge-cases/detector.ts` | Edge case pattern detection | ✅ Merged |
| `src/edge-cases/generator.ts` | Edge case test code generation | ✅ Merged |
| `src/edge-cases/types.ts` | Type definitions for edge cases | ✅ Merged |
| `src/edge-cases/edge-cases.test.ts` | Unit tests for edge-cases module | ✅ Merged |
| `src/edge-cases/index.ts` | Module exports | ✅ Merged |

### Files Preserved

| File | Description | Status |
|------|-------------|--------|
| `src/pytest-test-generator.ts` | Existing pytest test generator | ✅ Preserved |

### Updated Files

| File | Change | Status |
|------|--------|--------|
| `src/index.ts` | Added edge-cases module export | ✅ Updated |

## Edge Cases Module Structure

```
src/edge-cases/
├── detector.ts          # Edge case pattern detection
├── generator.ts        # Test code generation
├── types.ts           # Type definitions
├── edge-cases.test.ts  # Unit tests
└── index.ts           # Module exports
```

## Usage

### Run the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/edge-cases-merge --task TASK-038
```

### Workflow Phases

1. **ao.edge-cases-merge-implement** - Merge the edge-cases module files
2. **push-branch** - Push changes to remote
3. **create-pr** - Create pull request
4. **pr-review** - Review and merge PR

## Acceptance Criteria

### 1. Files Merged Successfully

| Criterion | Implementation | Status |
|-----------|---------------|--------|
| detector.ts merged | git show origin/ao/task-013:src/edge-cases/detector.ts | ✅ |
| generator.ts merged | git show origin/ao/task-013:src/edge-cases/generator.ts | ✅ |
| types.ts merged | git show origin/ao/task-013:src/edge-cases/types.ts | ✅ |
| edge-cases.test.ts merged | git show origin/ao/task-013:src/edge-cases/edge-cases.test.ts | ✅ |
| index.ts merged | git show origin/ao/task-013:src/edge-cases/index.ts | ✅ |

### 2. Existing Code Preserved

| Criterion | Implementation | Status |
|-----------|---------------|--------|
| pytest-test-generator.ts not removed | Verify file exists after merge | ✅ |
| pytest-test-generator.ts not modified | Verify file content matches main | ✅ |

### 3. Exports Updated

| Criterion | Implementation | Status |
|-----------|---------------|--------|
| src/index.ts updated | Added edge-cases export | ✅ |
| Existing exports preserved | No existing exports removed | ✅ |

### 4. Verification

| Criterion | Implementation | Status |
|-----------|---------------|--------|
| TypeScript compiles | npm run build | ✅ |
| Tests pass | npm test | ✅ |
| Edge-cases module importable | Import verification | ✅ |

## Conflict Resolution

The merge agent handles the following edge cases:

1. **pytest-test-generator.ts removal attempt**
   - If origin/ao/task-013 removes this file, it will be restored from main
   - Commit will include both the merge and the restoration

2. **src/index.ts conflicts**
   - Existing exports are preserved
   - edge-cases export is added
   - No existing functionality is removed

3. **TypeScript compilation failures**
   - Import paths are verified
   - Module resolution is checked
   - Any issues are fixed before commit

## Example Output

```
Merging edge-cases module from origin/ao/task-013...

Fetched 5 files:
✓ src/edge-cases/detector.ts
✓ src/edge-cases/generator.ts
✓ src/edge-cases/types.ts
✓ src/edge-cases/edge-cases.test.ts
✓ src/edge-cases/index.ts

Preserved existing files:
✓ src/pytest-test-generator.ts

Updated src/index.ts with edge-cases export

Verification:
✓ TypeScript compilation passed
✓ Tests passed

Commit created: feat: merge edge-cases module from ao/task-013
```

## Files

- `runtime/agents.yaml` - Agent configuration (ao.edge-cases-merge-agent)
- `workflows/skill-pack.yaml` - Phase (ao.edge-cases-merge-implement) and workflow (ao.testing/edge-cases-merge)
- `pack.toml` - Updated exports

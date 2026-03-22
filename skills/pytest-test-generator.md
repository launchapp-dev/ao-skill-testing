# Pytest Test Generator Skill

## Overview

This skill pack component defines the pytest test generator agent, phase, and workflow for automated pytest test generation.

## Agent: ao.pytest-test-generator

**Purpose**: Generate comprehensive pytest test files with fixtures, parametrize, and exception testing from Python source code.

### Agent Configuration

```yaml
# runtime/agents.yaml
agents:
  ao.pytest-test-generator:
    description: "Generate comprehensive pytest test files with fixtures, parametrize, and exception testing from Python source code"
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
```

## Phase: ao.pytest-test-implement

**Purpose**: Generate comprehensive pytest test suite with fixtures, parametrize, and exception testing.

```yaml
# workflows/skill-pack.yaml
phases:
  ao.pytest-test-implement:
    mode: agent
    agent: ao.pytest-test-generator
    directive: "Generate comprehensive pytest test files with fixtures, parametrize, and exception testing. Parse Python source files using ast module, create test files in tests/ directory, configure pytest with conftest.py, and verify tests pass."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true
```

## Acceptance Criteria

### 1. Python AST Parsing

The pytest test generator must correctly parse Python source code to extract:

| Element | Implementation | Status |
|---------|---------------|--------|
| Function signatures | `extractFunctions()` | ✅ Implemented |
| Parameter parsing | `extractFunctions()` → `PythonParameter[]` | ✅ Implemented |
| Return types | `extractFunctions()` → `returnType` | ✅ Implemented |
| Async functions | `extractFunctions()` → `isAsync` | ✅ Implemented |
| Class structures | `extractClasses()` | ✅ Implemented |
| Class methods | `extractClasses()` → `methods[]` | ✅ Implemented |
| Import statements | `extractImports()` | ✅ Implemented |
| Exception handling | `extractFunctions()` → `raises[]` | ✅ Implemented |
| Docstrings | `extractDocstring()` | ✅ Implemented |
| Decorators | `extractFunctions()` → `decorators[]` | ✅ Implemented |

### 2. Pytest-Compatible Fixtures

| Feature | Implementation | Status |
|---------|---------------|--------|
| `@pytest.fixture` decorator | `generateFixtureDecorators()` | ✅ Implemented |
| Fixture scopes | `scope: function/class/module/session` | ✅ Implemented |
| Class fixtures | `generateClassTests()` → class fixture | ✅ Implemented |
| Function fixtures | `createFunctionFixture()` | ✅ Implemented |
| conftest.py generation | `generateConftestFile()` | ✅ Implemented |
| Async fixtures | pytest_asyncio support | ✅ Implemented |
| Fixture setup/teardown | `yield` pattern in fixtures | ✅ Implemented |

### 3. Parametrize Support

| Feature | Implementation | Status |
|---------|---------------|--------|
| `@pytest.mark.parametrize` | `generateParametrizedTests()` | ✅ Implemented |
| Single parameter | Param array | ✅ Implemented |
| Multiple parameters | Tuple arrays | ✅ Implemented |
| Custom test IDs | `pytest.param(..., id="...")` | ✅ Implemented |
| Parameter value limits | `maxParametrizeCases` option | ✅ Implemented |
| Type-based values | `generateParamValues()` | ✅ Implemented |

### 4. pytest.raises() Exception Testing

| Feature | Implementation | Status |
|---------|---------------|--------|
| `pytest.raises()` context | `generateExceptionTests()` | ✅ Implemented |
| Exception type matching | `raises[]` array analysis | ✅ Implemented |
| Match message pattern | `match=` parameter | ✅ Implemented |
| Async exception testing | `pytest.mark.asyncio` + `asyncio.run()` | ✅ Implemented |
| Invalid input tests | `generateInvalidInputTest()` | ✅ Implemented |

## Generated Test Structure

### Example Output

```python
"""
Tests for calculator module
"""

import pytest
from unittest.mock import Mock, MagicMock, patch, AsyncMock
from calculator import add, subtract, Calculator


class TestAdd:
    """Test cases for the add function."""
    
    def test_add_returns_expected_value(self):
        """Test that add returns expected value."""
        result = add(2, 3)
        assert result == 5
        assert isinstance(result, int)
    
    @pytest.mark.parametrize("a,b,expected", [
        pytest.param(0, 0, 0, id="zero"),
        pytest.param(1, -1, 0, id="positive-negative"),
        pytest.param(100, 200, 300, id="large"),
    ])
    def test_add_parametrized(self, a, b, expected):
        """Parametrized test for add function."""
        assert add(a, b) == expected
    
    def test_add_raises_on_invalid_input(self):
        """Test that add raises ValueError for invalid input."""
        with pytest.raises(TypeError, match="must be a number"):
            add("not a number", 1)


class TestCalculator:
    """Test cases for the Calculator class."""
    
    @pytest.fixture
    def calculator(self) -> Calculator:
        """Fixture that provides a Calculator instance."""
        return Calculator()
    
    def test_add_method(self, calculator: Calculator):
        """Test Calculator.add method."""
        result = calculator.add(2, 3)
        assert result == 5
    
    @pytest.mark.asyncio
    async def test_async_operation(self, calculator: Calculator):
        """Test async method of Calculator."""
        result = await calculator.async_add(1, 2)
        assert result == 3
```

### conftest.py Example

```python
"""
Pytest configuration and shared fixtures
"""

import pytest

pytest_plugins = ["pytest_asyncio"]


@pytest.fixture(scope="session")
def event_loop_policy():
    """Use the default event loop policy for async tests."""
    import asyncio
    return asyncio.get_event_loop_policy()


@pytest.fixture(scope="function")
def setup_calculator():
    """Setup fixture for calculator tests."""
    from calculator import Calculator
    instance = Calculator()
    yield instance
    # Cleanup if needed
```

## Usage

### Run the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/pytest-generate --task TASK-001
```

### Direct API Usage

```typescript
import { PytestTestGenerator, analyzePythonCode } from 'ao-skill-testing';

const generator = new PytestTestGenerator({
  includeFixtures: true,
  includeParametrize: true,
  includeExceptionTests: true,
  includeAsyncTests: true,
  maxParametrizeCases: 5,
});

const pythonCode = `
def add(a: int, b: int) -> int:
    """Add two numbers."""
    return a + b

def divide(a: int, b: int) -> float:
    """Divide two numbers."""
    if b == 0:
        raise ValueError("Cannot divide by zero")
    return a / b

class Calculator:
    def __init__(self):
        self.value = 0
    
    def add(self, x: int) -> int:
        self.value += x
        return self.value
`;

const analysis = analyzePythonCode(pythonCode, 'calculator.py');
const result = generator.generate(analysis);

console.log(result.tests[0].content);
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `includeFixtures` | `true` | Generate pytest fixtures |
| `includeParametrize` | `true` | Generate parametrized tests |
| `includeExceptionTests` | `true` | Generate pytest.raises() tests |
| `includeAsyncTests` | `true` | Generate async test support |
| `includeMockTests` | `true` | Include mocking patterns |
| `includeCoverageMarkers` | `true` | Add coverage markers |
| `testDirectory` | `"tests"` | Output directory for tests |
| `testSuffix` | `"_test"` | Test file name suffix |
| `generateConftest` | `true` | Generate conftest.py |
| `useTypeHints` | `true` | Use type hints in generation |
| `useDocstrings` | `true` | Include docstrings |
| `maxParametrizeCases` | `5` | Max cases per parametrized test |

## Files

- `src/pytest-test-generator.ts` - Main implementation
- `src/types.ts` - Python type definitions
- `runtime/agents.yaml` - Agent configuration
- `workflows/skill-pack.yaml` - Phase and workflow definitions

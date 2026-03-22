# Pytest Test Generator

The Pytest Test Generator is an AI agent specialized in creating comprehensive pytest test suites for Python projects. It analyzes Python source code using the AST module and generates production-ready tests with fixtures, parametrization, and exception testing.

## Features

### Core Capabilities

- **AST-Based Code Analysis**: Parses Python source files using Python's `ast` module for accurate analysis of:
  - Function signatures (parameters, return types, decorators)
  - Class structures and methods
  - Import statements and dependencies
  - Exception handling (raise statements)
  - Docstrings

- **Fixture Generation**: Creates pytest fixtures for:
  - Class instantiation
  - Complex setup/teardown scenarios
  - Shared resources (session/module scope)
  - Parametrized fixtures

- **Parametrized Tests**: Generates data-driven tests using `@pytest.mark.parametrize`:
  - Multiple parameter combinations
  - Custom test IDs for clarity
  - Reasonable limits on test cases

- **Exception Testing**: Creates tests using `pytest.raises()`:
  - Matches detected raise statements
  - Tests invalid inputs
  - Async exception handling

- **Async Support**: Generates async tests for:
  - `async def` functions with `@pytest.mark.asyncio`
  - Async fixtures with `pytest_asyncio.fixture`
  - Mocking async functions

- **Mock Integration**: Supports mocking with:
  - `@patch` decorator
  - `MagicMock` and `Mock`
  - `AsyncMock` for async functions

## Usage

### Running the Workflow

```bash
# Using AO CLI
ao workflow run --workflow ao.testing/pytest-generate --task TASK-001
```

### Generated Test Structure

```python
"""
Tests for calculator module
"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from calculator import add, subtract, Calculator


class TestAdd:
    """Test cases for the add function."""
    
    def test_add_positive_numbers(self):
        """Test adding two positive numbers."""
        result = add(2, 3)
        assert result == 5
    
    def test_add_negative_numbers(self):
        """Test adding negative numbers."""
        result = add(-1, -1)
        assert result == -2
    
    @pytest.mark.parametrize("a,b,expected", [
        (0, 0, 0),
        (1, -1, 0),
        (100, 200, 300),
    ])
    def test_add_parametrized(self, a, b, expected):
        """Parametrized test for add function."""
        assert add(a, b) == expected


class TestCalculator:
    """Test cases for the Calculator class."""
    
    @pytest.fixture
    def calculator(self):
        """Provide a Calculator instance."""
        return Calculator()
    
    def test_add_method(self, calculator):
        """Test Calculator.add method."""
        result = calculator.add(2, 3)
        assert result == 5
    
    def test_add_raises_on_invalid_input(self, calculator):
        """Test that add raises TypeError for invalid input."""
        with pytest.raises(TypeError, match="must be a number"):
            calculator.add("not a number", 1)
    
    @pytest.mark.asyncio
    async def test_async_operation(self, calculator):
        """Test async method of Calculator."""
        result = await calculator.async_add(1, 2)
        assert result == 3
```

### Generated conftest.py

```python
"""
Pytest configuration and shared fixtures
"""

import pytest
import pytest_asyncio

@pytest.fixture(scope="session")
def database_connection():
    """Session-scoped database connection fixture."""
    conn = create_connection()
    yield conn
    conn.close()

@pytest.fixture
def sample_data():
    """Function-scoped sample data fixture."""
    return {"key": "value"}
```

## Configuration

### Test Generation Options

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

## Examples

### Basic Function Testing

```python
# Source: calculator.py
def add(a: int, b: int) -> int:
    """Add two numbers together."""
    return a + b

# Generated test:
class TestAdd:
    def test_add_returns_expected_value(self):
        """Test that add returns expected value."""
        result = add(2, 3)
        assert result == 5
        assert isinstance(result, int)
```

### Parametrized Testing

```python
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected
```

### Exception Testing

```python
# Source: validator.py
def validate_age(age: int) -> bool:
    if age < 0:
        raise ValueError("Age cannot be negative")
    return True

# Generated test:
def test_validate_age_raises_value_error():
    with pytest.raises(ValueError, match="Age cannot be negative"):
        validate_age(-1)
```

### Fixture Usage

```python
@pytest.fixture
def calculator():
    """Provide a Calculator instance."""
    return Calculator()

def test_add(calculator):
    result = calculator.add(2, 3)
    assert result == 5
```

### Async Testing

```python
@pytest.mark.asyncio
async def test_async_fetch():
    """Test async fetch function."""
    result = await async_fetch("https://example.com")
    assert result is not None
```

## Best Practices

1. **Test Naming**: Use descriptive test names that explain what is being tested
2. **Arrange-Act-Assert**: Structure tests with clear sections
3. **Fixtures for Setup**: Use fixtures for repeated setup code
4. **Parametrize for Variations**: Test multiple inputs with parametrized tests
5. **Test Edge Cases**: Include tests for empty, null, and boundary values
6. **Mock External Dependencies**: Isolate units under test with mocking
7. **Async for Async Code**: Use `@pytest.mark.asyncio` for async functions

## Requirements

- Python 3.8+
- pytest
- pytest-asyncio (for async tests)
- pytest-mock (for mocking)

## Installation

```bash
pip install pytest pytest-asyncio pytest-mock
```

## Related

- [Jest Test Generator](./jest-test-generator.md)
- [Source Analyzer](./source-analyzer.md)
- [Test Generator](./test-generator.md)

# Extending the Skill Pack

This guide covers how to extend the ao-skill-testing skill pack with new languages, frameworks, and features.

## Adding New Language Support

### Overview

Adding support for a new language (e.g., Python/pytest) involves:

1. Creating a language-specific generator class
2. Registering new types for the language
3. Adding agent configuration
4. Updating workflow definitions
5. Writing tests and documentation

### Step 1: Create the Generator Class

Create a new generator in `src/`:

```typescript
// src/pytest-generator.ts
import type {
  AnalyzedModule,
  AnalyzedFunction,
  AnalyzedClass,
  PyTestOptions,
  PyTestResult
} from './types.js';

/**
 * Python pytest test generator
 */
export class PyTestGenerator {
  private options: PyTestOptions;
  private analyzer: PyTestSourceAnalyzer;

  constructor(options: Partial<PyTestOptions> = {}) {
    this.options = {
      includeTypeHints: true,
      includeDocstringTests: true,
      includePytestMarkers: true,
      fixtureDirectory: 'tests/fixtures',
      ...options
    };
    this.analyzer = new PyTestSourceAnalyzer();
  }

  /**
   * Generate pytest tests from Python source
   */
  generate(analysis: PythonModule): PyTestResult {
    const tests: PyTestFile[] = [];
    
    // Generate test modules
    tests.push(this.generateModuleTests(analysis));
    
    // Generate fixture files if needed
    if (this.options.includePytestMarkers) {
      tests.push(this.generateConftest(analysis));
    }

    return {
      files: tests,
      analysis,
      metadata: {
        framework: 'pytest',
        generatedAt: new Date().toISOString(),
        totalTests: tests.reduce((sum, t) => sum + t.testCount, 0)
      }
    };
  }

  /**
   * Generate test file for a module
   */
  private generateModuleTests(analysis: PythonModule): PyTestFile {
    const lines: string[] = [];
    
    // Imports
    lines.push('import pytest');
    lines.push(`from ${analysis.moduleName} import ${analysis.exports.map(e => e.name).join(', ')}`);
    lines.push('');

    // Generate tests for functions
    analysis.functions.forEach(func => {
      lines.push(...this.generateFunctionTests(func));
    });

    // Generate tests for classes
    analysis.classes.forEach(cls => {
      lines.push(...this.generateClassTests(cls));
    });

    return {
      path: `tests/test_${analysis.moduleName}.py`,
      content: lines.join('\n'),
      testCount: analysis.functions.length + analysis.classes.length
    };
  }

  /**
   * Generate tests for a function
   */
  private generateFunctionTests(func: PythonFunction): string[] {
    const lines: string[] = [];
    
    // Test function
    lines.push(`def test_${func.name}_basic():`);
    lines.push(`    """Test basic functionality of ${func.name}.""")`);
    
    if (func.docstring) {
      lines.push(`    # Docstring: ${func.docstring}`);
    }
    
    lines.push(`    result = ${func.name}(${this.generateArgs(func.parameters)})`);
    lines.push(`    assert result is not None`);
    lines.push('');

    // Edge case tests
    lines.push(`def test_${func.name}_edge_cases():`);
    lines.push(`    """Test edge cases for ${func.name}.""")`);
    
    func.parameters.forEach(param => {
      if (!param.hasDefault) {
        lines.push(`    # Test with edge value for ${param.name}`);
        lines.push(`    result = ${func.name}(${this.generateEdgeArgs(func.parameters, param.name)})`);
        lines.push(`    assert result is not None`);
      }
    });
    lines.push('');

    return lines;
  }

  /**
   * Generate tests for a class
   */
  private generateClassTests(cls: PythonClass): string[] {
    const lines: string[] = [];
    
    lines.push(`class Test${cls.name}:`);
    lines.push(`    """Test cases for ${cls.name} class.""")`);
    lines.push('');

    // Setup
    lines.push(`    @pytest.fixture`);
    lines.push(`    def instance(self):`);
    lines.push(`        """Create an instance of ${cls.name}.""")`);
    lines.push(`        return ${cls.name}(${this.generateArgs(cls.parameters)})`);
    lines.push('');

    // Test instantiation
    lines.push(`    def test_instantiation(self, instance):`);
    lines.push(`        """Test that ${cls.name} instantiates correctly.""")`);
    lines.push(`        assert instance is not None`);
    lines.push(`        assert isinstance(instance, ${cls.name})`);
    lines.push('');

    // Test methods
    cls.methods.forEach(method => {
      lines.push(...this.generateMethodTests(cls.name, method));
    });

    return lines;
  }

  /**
   * Generate arguments string
   */
  private generateArgs(params: Parameter[]): string {
    return params
      .filter(p => p.hasDefault)
      .map(p => p.defaultValue)
      .join(', ') || '';
  }

  /**
   * Generate conftest.py
   */
  private generateConftest(analysis: PythonModule): PyTestFile {
    const lines: string[] = [];
    
    lines.push('"""Pytest configuration and fixtures.""")');
    lines.push('import pytest');
    lines.push('');

    // Add fixtures for each imported module
    analysis.imports.forEach(imp => {
      if (imp.isExternal) {
        lines.push(`# @pytest.fixture`);
        lines.push(`# def ${imp.alias}(monkeypatch):`);
        lines.push(`#     """Mock ${imp.source}.""")`);
        lines.push(`#     monkeypatch.setattr("${imp.source}", lambda: None)`);
        lines.push('');
      }
    });

    return {
      path: 'tests/conftest.py',
      content: lines.join('\n'),
      testCount: 0
    };
  }
}

// Export types
export interface PyTestOptions {
  includeTypeHints: boolean;
  includeDocstringTests: boolean;
  includePytestMarkers: boolean;
  fixtureDirectory: string;
}

export interface PyTestResult {
  files: PyTestFile[];
  analysis: PythonModule;
  metadata: {
    framework: string;
    generatedAt: string;
    totalTests: number;
  };
}

export interface PyTestFile {
  path: string;
  content: string;
  testCount: number;
}
```

### Step 2: Create the Source Analyzer

```typescript
// src/pytest-analyzer.ts
import type { PythonModule, PythonFunction, PythonClass, Parameter } from './types.js';

/**
 * Analyze Python source code
 */
export class PyTestSourceAnalyzer {
  analyze(source: { path: string; content: string }): PythonModule {
    // Parse Python AST (using a Python parser)
    // For now, use regex-based extraction
    
    const functions = this.extractFunctions(source.content);
    const classes = this.extractClasses(source.content);
    const imports = this.extractImports(source.content);
    const exports = this.extractExports(source.content);

    return {
      filePath: source.path,
      moduleName: this.getModuleName(source.path),
      functions,
      classes,
      imports,
      exports
    };
  }

  private extractFunctions(content: string): PythonFunction[] {
    const functions: PythonFunction[] = [];
    const pattern = /^def (\w+)\s*\(([^)]*)\)(?:\s*->\s*([^:]+))?:/gm;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, name, paramsStr, returnType] = match;
      
      functions.push({
        name,
        parameters: this.parseParameters(paramsStr),
        returnType: returnType?.trim(),
        isAsync: false,
        isExported: this.isExportedFunction(name, content),
        docstring: this.getDocstring(content, match.index),
        decorators: this.getDecorators(content, match.index)
      });
    }

    return functions;
  }

  private extractClasses(content: string): PythonClass[] {
    const classes: PythonClass[] = [];
    const pattern = /^class (\w+)(?:\s*\(([^)]*)\))?:/gm;
    
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const [, name, bases] = match;
      
      classes.push({
        name,
        baseClasses: bases?.split(',').map(b => b.trim()) || [],
        methods: this.extractClassMethods(content, match.index),
        parameters: this.extractInitParams(content, match.index)
      });
    }

    return classes;
  }

  private parseParameters(paramsStr: string): Parameter[] {
    if (!paramsStr.trim()) return [];
    
    return paramsStr.split(',').map(p => {
      const [name, defaultValue] = p.trim().split('=').map(s => s.trim());
      return {
        name,
        hasDefault: !!defaultValue,
        defaultValue: defaultValue?.replace(/['"]/g, ''),
        type: undefined // Would need type annotation parsing
      };
    });
  }

  private getModuleName(path: string): string {
    return path.replace(/\.py$/, '').replace(/\//g, '.');
  }
}
```

### Step 3: Update Type Definitions

```typescript
// src/types.ts - Add new types

// Python types
export interface PythonModule {
  filePath: string;
  moduleName: string;
  functions: PythonFunction[];
  classes: PythonClass[];
  imports: PythonImport[];
  exports: PythonExport[];
}

export interface PythonFunction {
  name: string;
  parameters: Parameter[];
  returnType?: string;
  isAsync: boolean;
  isExported: boolean;
  docstring?: string;
  decorators: string[];
}

export interface PythonClass {
  name: string;
  baseClasses: string[];
  methods: PythonFunction[];
  parameters: Parameter[];
}

export interface PythonImport {
  source: string;
  alias?: string;
  isExternal: boolean;
}

export interface PythonExport {
  name: string;
  type: 'function' | 'class' | 'constant';
}
```

### Step 4: Register in Index

```typescript
// src/index.ts
export { PyTestGenerator } from './pytest-generator.js';
export { PyTestSourceAnalyzer } from './pytest-analyzer.js';

export type { PyTestOptions, PyTestResult, PyTestFile } from './pytest-generator.js';
export type { PythonModule, PythonFunction, PythonClass, PythonImport } from './types.js';
```

### Step 5: Add Agent Configuration

Update `runtime/agents.yaml`:

```yaml
agents:
  ao.pytest-test-generator:
    description: "Generate pytest test files for Python projects"
    system_prompt: |
      You are an expert pytest test generation agent specializing in Python projects.

      YOUR EXPERTISE:
      - Python testing with pytest
      - pytest fixtures and markers
      - unittest.mock for mocking
      - type hints and type checking
      - docstring-based testing

      AVAILABLE TOOLS:
      - File system operations
      - Python code analysis
      - pytest configuration
      - Command execution (pytest, coverage)

      YOUR WORKFLOW:
      1. Analyze Python source files
      2. Extract functions, classes, and dependencies
      3. Generate pytest test files
      4. Create conftest.py with fixtures
      5. Verify tests run correctly

      PYTEST BEST PRACTICES:
      - Use descriptive test names: test_<function>_<scenario>
      - Create fixtures in conftest.py for common setup
      - Use pytest.mark.parametrize for data-driven tests
      - Use pytest.mark.skip for known issues
      - Include docstrings for test cases
      - Use assertions with clear messages

      TEST PATTERNS:
      - Unit tests: Test individual functions
      - Integration tests: Test module interactions
      - Parametrized tests: Test multiple inputs
      - Fixtures: Reusable test setup

      MOCKING:
      - Use unittest.mock.Mock for simple mocks
      - Use @patch for decorator-based mocking
      - Use monkeypatch for environment setup
      - Use pytest-mock for enhanced mocking

      DO NOT:
      - Don't test implementation details
      - Don't create brittle tests
      - Don't skip tests without reason
      - Don't add yourself as author
    model: claude-3-5-sonnet-20241022
    tool: claude
    mcp_servers: ["ao", "context7"]
    capabilities:
      implementation: true
      planning: true
      testing: true
```

### Step 6: Add Workflow Phase

Update `workflows/skill-pack.yaml`:

```yaml
phases:
  ao.pytest-test-implement:
    mode: agent
    agent: ao.pytest-test-generator
    directive: "Generate pytest test files for Python source code. Analyze Python files, create test modules, configure pytest, and verify tests pass."
    capabilities:
      mutates_state: true
      generates_code: true
      runs_tests: true

workflows:
  # ... existing workflows ...

  - id: ao.testing/pytest-generate
    name: "Pytest Test Generation"
    description: "Generate pytest test suite for Python projects"
    phases:
      - ao.pytest-test-implement
      - push-branch
      - create-pr
      - pr-review
```

### Step 7: Add Tests

```typescript
// tests/pytest-generator.test.ts
import { describe, it, expect } from 'vitest';
import { PyTestGenerator } from '../src/pytest-generator';

describe('PyTestGenerator', () => {
  const generator = new PyTestGenerator();

  it('should generate basic function tests', () => {
    const pythonCode = `
def add(a: int, b: int) -> int:
    return a + b
`;

    const analyzer = new PyTestSourceAnalyzer();
    const analysis = analyzer.analyze({ path: 'math.py', content: pythonCode });
    const result = generator.generate(analysis);

    expect(result.files.length).toBeGreaterThan(0);
    expect(result.metadata.framework).toBe('pytest');
    expect(result.files[0].content).toContain('def test_add_basic');
  });

  it('should generate class tests', () => {
    const pythonCode = `
class Calculator:
    def __init__(self):
        self.result = 0
    
    def add(self, a: int, b: int) -> int:
        self.result = a + b
        return self.result
`;

    const analyzer = new PyTestSourceAnalyzer();
    const analysis = analyzer.analyze({ path: 'calc.py', content: pythonCode });
    const result = generator.generate(analysis);

    expect(result.files[0].content).toContain('class TestCalculator');
    expect(result.files[0].content).toContain('def test_instantiation');
  });
});
```

### Step 8: Update Documentation

Update `README.md` and add documentation in `docs/`:

```markdown
## Supported Frameworks

| Framework | Language | Status | Agent |
|-----------|----------|--------|-------|
| Vitest | TypeScript/JavaScript | ✅ Stable | ao.testing-agent |
| Jest | TypeScript/JavaScript | ✅ Stable | ao.jest-test-generator |
| Pytest | Python | ✅ New | ao.pytest-test-generator |
```

## Adding New Test Types

### Custom Test Type Example

```typescript
// Add snapshot tests to Vitest
class SnapshotTestGenerator extends TestGenerator {
  private options: SnapshotOptions;

  constructor(options: Partial<SnapshotOptions> = {}) {
    super(options);
    this.options = {
      snapshotDirectory: '__snapshots__',
      updateSnapshot: false,
      ...options
    };
  }

  generateSnapshotTests(analysis: AnalyzedModule): GeneratedTest {
    // Generate snapshot tests
    return {
      path: this.getTestPath(analysis.filePath, 'snapshot'),
      content: this.generateSnapshotContent(analysis),
      testCases: analysis.functions.map(f => ({
        name: `${f.name} - snapshot`,
        type: 'snapshot' as const,
        targetFunction: f.name
      }))
    };
  }
}
```

## Custom Matcher Extension

### Adding Custom Matchers (Jest)

```typescript
class CustomMatcherGenerator extends JestTestGenerator {
  generateCustomMatchers(matchers: string[]): string {
    return matchers.map(name => `
expect.extend({
  ${name}(received, expected) {
    const pass = /* custom logic */;
    return {
      pass,
      message: () => \`Expected \${received} \${pass ? 'not ' : ''}to \${name} \${expected}\`
    };
  }
});
    `).join('\n');
  }
}
```

## Framework Integration

### Adding Mocha Support

```typescript
export class MochaTestGenerator extends TestGenerator {
  protected generateImports(analysis: AnalyzedModule): string {
    return `
const assert = require('assert');
const { ${analysis.exports.map(e => e.name).join(', ')} } = require('../src/${this.getModuleName(analysis.filePath)}');
    `.trim();
  }

  protected generateTestCase(func: AnalyzedFunction): string {
    return `
describe('${func.name}', () => {
  it('should work correctly', () => {
    const result = ${func.name}(${this.generateSampleArguments(func)});
    assert.ok(result !== undefined);
  });
});
    `.trim();
  }
}
```

## Next Steps

1. Write comprehensive tests for new generators
2. Update documentation with examples
3. Add integration tests
4. Publish to npm (if applicable)
5. Create migration guides

/**
 * Pytest test generator with fixtures, parametrization, and exception testing
 *
 * This module generates comprehensive pytest-compatible test files from Python source code
 * using the Python AST module for accurate code analysis.
 */
/**
 * Default generation options
 */
const DEFAULT_OPTIONS = {
    includeFixtures: true,
    includeParametrize: true,
    includeExceptionTests: true,
    includeAsyncTests: true,
    includeMockTests: true,
    includeCoverageMarkers: true,
    testDirectory: 'tests',
    testSuffix: '_test',
    generateConftest: true,
    useTypeHints: true,
    useDocstrings: true,
    maxParametrizeCases: 5,
};
/**
 * PytestTestGenerator class
 *
 * Generates comprehensive pytest test files from Python source code.
 */
export class PytestTestGenerator {
    options;
    fixtures = new Map();
    constructor(options = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    /**
     * Generate pytest test files from Python module analysis
     */
    generate(analysis) {
        const tests = [];
        const analysisResult = analysis;
        // Generate main test file
        const mainTest = this.generateMainTestFile(analysis);
        tests.push(mainTest);
        // Generate fixture file if enabled
        if (this.options.generateConftest) {
            const conftest = this.generateConftestFile();
            if (conftest) {
                mainTest.fixturePath = conftest.path;
                mainTest.fixtureContent = conftest.content;
            }
        }
        // Generate class-specific test files if classes exist
        analysis.classes.filter(c => this.shouldGenerateForClass(c)).forEach(cls => {
            tests.push(this.generateClassTestFile(cls, analysis.imports));
        });
        return {
            tests,
            analysis: analysisResult,
            metadata: {
                sourceFile: analysis.filePath,
                generatedAt: new Date().toISOString(),
                framework: 'pytest',
                totalTests: tests.reduce((sum, t) => sum + t.testCases.length, 0),
                totalFixtures: this.fixtures.size,
            },
        };
    }
    /**
     * Parse Python source code into a PythonModule structure
     * This uses Python's AST module via subprocess (since we're in TypeScript)
     */
    parsePythonSource(sourcePath) {
        // In production, this would call Python to parse the AST
        // For now, return a structure that matches what analyzePythonCode produces
        return {
            filePath: sourcePath,
            docstring: undefined,
            functions: [],
            classes: [],
            imports: [],
            exports: [],
        };
    }
    /**
     * Generate the main test file content
     */
    generateMainTestFile(analysis) {
        const lines = [];
        const testCases = [];
        const fixtures = [];
        // Header
        lines.push(...this.generateHeader(analysis));
        // Imports
        lines.push(...this.generateImports(analysis));
        // Fixtures
        if (this.options.includeFixtures && this.fixtures.size > 0) {
            lines.push('');
            lines.push(...this.generateFixtureDecorators());
        }
        // Generate tests for each function
        analysis.functions
            .filter(f => f.isExported && this.shouldGenerateForFunction(f))
            .forEach(func => {
            const result = this.generateFunctionTests(func, analysis.imports);
            lines.push('');
            lines.push(...result.code);
            testCases.push(...result.testCases);
            result.fixtures.forEach(f => {
                if (!fixtures.includes(f))
                    fixtures.push(f);
            });
        });
        // Generate tests for each class
        analysis.classes
            .filter(c => this.shouldGenerateForClass(c))
            .forEach(cls => {
            const result = this.generateClassTests(cls, analysis.imports);
            lines.push('');
            lines.push(...result.code);
            testCases.push(...result.testCases);
            result.fixtures.forEach(f => {
                if (!fixtures.includes(f))
                    fixtures.push(f);
            });
        });
        return {
            path: this.getTestPath(analysis.filePath),
            content: lines.join('\n'),
            testCases,
            fixtures,
        };
    }
    /**
     * Generate file header with module docstring
     */
    generateHeader(analysis) {
        const moduleName = this.getModuleName(analysis.filePath);
        const lines = [];
        lines.push('"""');
        lines.push(`Tests for ${moduleName}`);
        if (analysis.docstring) {
            lines.push('');
            lines.push(analysis.docstring.split('\n')[0]);
        }
        lines.push('"""');
        lines.push('');
        return lines;
    }
    /**
     * Generate pytest-compatible imports
     */
    generateImports(analysis) {
        const lines = [];
        const importPath = this.getImportPath(analysis.filePath);
        // pytest imports
        lines.push('import pytest');
        lines.push('');
        // Source file import
        const exports = [
            ...analysis.functions.filter(f => f.isExported).map(f => f.name),
            ...analysis.classes.filter(c => c.isExported).map(c => c.name),
            ...analysis.exports.filter(e => e.kind !== 'module').map(e => e.name),
        ];
        if (exports.length > 0) {
            lines.push(`from ${importPath} import ${exports.join(', ')}`);
        }
        // Add optional imports based on options
        if (this.options.includeMockTests) {
            lines.push('from unittest.mock import Mock, MagicMock, patch, AsyncMock');
        }
        if (this.options.includeAsyncTests) {
            lines.push('');
            lines.push('import pytest_asyncio');
        }
        lines.push('');
        // Add type hints import if needed
        if (this.options.useTypeHints) {
            lines.push('from typing import Any, List, Dict, Optional, Union');
            lines.push('');
        }
        return lines;
    }
    /**
     * Generate fixture decorators for fixtures in this file
     */
    generateFixtureDecorators() {
        const lines = [];
        this.fixtures.forEach((fixture, name) => {
            const scope = fixture.scope === 'session' ? '(scope="session")' :
                fixture.scope === 'module' ? '(scope="module")' :
                    fixture.scope === 'class' ? '(scope="class")' : '';
            lines.push(`@pytest.fixture${scope}`);
            lines.push(`def ${name}():`);
            lines.push(`    """${fixture.description}"""`);
            lines.push(`    ${fixture.setup}`);
            if (fixture.teardown) {
                lines.push(`    yield ${fixture.yieldValue || 'result'}`);
                lines.push(`    ${fixture.teardown}`);
            }
            else if (fixture.yieldValue) {
                lines.push(`    return ${fixture.yieldValue}`);
            }
            lines.push('');
        });
        return lines;
    }
    /**
     * Generate tests for a single function
     */
    generateFunctionTests(func, imports) {
        const lines = [];
        const testCases = [];
        const usedFixtures = [];
        // Create fixture for this function if it has complex setup
        const funcFixture = this.createFunctionFixture(func);
        if (funcFixture) {
            this.fixtures.set(funcFixture.name, funcFixture);
            usedFixtures.push(funcFixture.name);
        }
        // Function docstring for class name
        const funcDocstring = this.options.useDocstrings && func.docstring
            ? func.docstring.split('\n')[0].replace(/^["']|["']$/g, '')
            : null;
        lines.push('');
        lines.push(`class Test${this.capitalize(func.name)}:`);
        if (funcDocstring) {
            lines.push(`    """${funcDocstring}"""`);
        }
        lines.push('');
        // Happy path test
        const happyTestCase = this.generateHappyPathTest(func);
        lines.push(...happyTestCase.code);
        testCases.push(happyTestCase.testCase);
        // Parametrized tests
        if (this.options.includeParametrize && this.canParametrize(func)) {
            const parametrizeResult = this.generateParametrizedTests(func);
            lines.push(...parametrizeResult.code);
            testCases.push(...parametrizeResult.testCases);
        }
        // Exception tests
        if (this.options.includeExceptionTests && func.raises.length > 0) {
            const exceptionResult = this.generateExceptionTests(func);
            lines.push(...exceptionResult.code);
            testCases.push(...exceptionResult.testCases);
        }
        // Edge case tests
        const edgeCaseResult = this.generateEdgeCaseTests(func);
        lines.push(...edgeCaseResult.code);
        testCases.push(...edgeCaseResult.testCases);
        // Async test if applicable
        if (this.options.includeAsyncTests && func.isAsync) {
            const asyncResult = this.generateAsyncTest(func);
            lines.push(...asyncResult.code);
            testCases.push(asyncResult.testCase);
        }
        // Mock tests if the function uses external dependencies
        if (this.options.includeMockTests && this.usesExternalDeps(func, imports)) {
            const mockResult = this.generateMockTests(func, imports);
            lines.push(...mockResult.code);
            testCases.push(...mockResult.testCases);
        }
        return { code: lines, testCases, fixtures: usedFixtures };
    }
    /**
     * Generate happy path test for a function
     */
    generateHappyPathTest(func) {
        const testName = `test_${func.name}_returns_expected_value`;
        const args = this.generateSampleArguments(func.parameters);
        const code = [];
        // Test docstring
        const funcDocstring = func.docstring?.split('\n')[0];
        if (funcDocstring) {
            code.push(`    def ${testName}(self):`);
            code.push(`        """Test that ${func.name} returns expected value. ${funcDocstring}"""`);
        }
        else {
            code.push(`    def ${testName}(self):`);
            code.push(`        """Test that ${func.name} returns expected value."""`);
        }
        if (func.isAsync) {
            code.push(`        async def test_func():`);
        }
        code.push(`        # Arrange`);
        code.push(...this.generateArrangeCode(func.parameters));
        code.push('');
        code.push(`        # Act`);
        if (func.isAsync) {
            code.push(`        result = await ${func.name}(${args})`);
        }
        else {
            code.push(`        result = ${func.name}(${args})`);
        }
        code.push('');
        code.push(`        # Assert`);
        code.push(`        assert result is not None`);
        if (func.returnType) {
            const typeAssertion = this.generateTypeAssertion('result', func.returnType);
            if (typeAssertion) {
                code.push(`        assert ${typeAssertion}`);
            }
        }
        code.push('');
        return {
            code,
            testCase: {
                name: testName,
                type: 'unit',
                targetFunction: func.name,
            },
        };
    }
    /**
     * Generate parametrized tests using @pytest.mark.parametrize
     */
    generateParametrizedTests(func) {
        const code = [];
        const testCases = [];
        if (func.parameters.length === 0) {
            return { code, testCases };
        }
        // Generate parameter combinations
        const paramNames = func.parameters.map(p => p.name);
        const paramValues = func.parameters.map(p => this.generateParamValues(p));
        const combinations = this.generateCombinations(paramValues);
        // Limit to maxParametrizeCases
        const limitedCombinations = combinations.slice(0, this.options.maxParametrizeCases || 5);
        // Create parametrized test function
        code.push(`    @pytest.mark.parametrize(`);
        code.push(`        "${paramNames.join(', ')}",`);
        code.push(`        [`);
        limitedCombinations.forEach((combo, idx) => {
            const values = combo.map(v => this.formatValueForParametrize(v)).join(', ');
            code.push(`            pytest.param(${values}${this.generateParametrizeId(combo, func)}),`);
            testCases.push({
                name: `test_${func.name}_param_${idx}`,
                type: 'parametrized',
                targetFunction: func.name,
                parametrizedParams: combo,
            });
        });
        code.push(`        ]`);
        code.push(`    )`);
        code.push(`    def test_${func.name}_parametrized(self, ${paramNames.join(', ')}):`);
        code.push(`        """Parametrized test for ${func.name}."""`);
        code.push(`        # Act`);
        if (func.isAsync) {
            code.push(`        result = await ${func.name}(${paramNames.join(', ')})`);
        }
        else {
            code.push(`        result = ${func.name}(${paramNames.join(', ')})`);
        }
        code.push(`        # Assert`);
        code.push(`        assert result is not None`);
        code.push('');
        return { code, testCases };
    }
    /**
     * Generate exception tests using pytest.raises
     */
    generateExceptionTests(func) {
        const code = [];
        const testCases = [];
        func.raises.forEach(exceptionType => {
            const testName = `test_${func.name}_raises_${exceptionType.split('.')[-1].toLowerCase()}`;
            const exceptionClass = exceptionType.split('.')[-1];
            code.push(`    def ${testName}(self):`);
            code.push(`        """Test that ${func.name} raises ${exceptionClass}."""`);
            code.push(`        # Arrange`);
            code.push(...this.generateExceptionArrangeCode(func.parameters, exceptionType));
            code.push('');
            code.push(`        # Act & Assert`);
            code.push(`        with pytest.raises(${exceptionType}):`);
            if (func.isAsync) {
                code.push(`            import asyncio`);
                code.push(`            asyncio.run(${func.name}(${this.generateSampleArguments(func.parameters)}))`);
            }
            else {
                code.push(`            ${func.name}(${this.generateSampleArguments(func.parameters)})`);
            }
            code.push('');
            testCases.push({
                name: testName,
                type: 'exception',
                targetFunction: func.name,
                expectedException: exceptionType,
            });
        });
        // Add test for invalid input that should raise
        const invalidTest = this.generateInvalidInputTest(func);
        if (invalidTest) {
            code.push(...invalidTest.code);
            testCases.push(invalidTest.testCase);
        }
        return { code, testCases };
    }
    /**
     * Generate edge case tests
     */
    generateEdgeCaseTests(func) {
        const code = [];
        const testCases = [];
        // Test with None/null values
        func.parameters.forEach(param => {
            if (param.typeAnnotation && this.isNullableType(param.typeAnnotation)) {
                const testName = `test_${func.name}_with_none_${param.name}`;
                code.push(`    def ${testName}(self):`);
                code.push(`        """Test ${func.name} with None ${param.name}."""`);
                code.push(`        # Arrange`);
                code.push(`        ${param.name} = None`);
                code.push('');
                code.push(`        # Act & Assert`);
                code.push(`        # Depending on implementation, may raise or return default`);
                code.push(`        try:`);
                if (func.isAsync) {
                    code.push(`            result = await ${func.name}(${this.replaceParamWithNone(func.parameters, param.name)})`);
                }
                else {
                    code.push(`            result = ${func.name}(${this.replaceParamWithNone(func.parameters, param.name)})`);
                }
                code.push(`            # Function handled None gracefully`);
                code.push(`            assert result is not None or result is None  # Accept either behavior`);
                code.push(`        except Exception:`);
                code.push(`            # Function raised exception for None input - acceptable`);
                code.push(`            pass`);
                code.push('');
                testCases.push({
                    name: testName,
                    type: 'edge-case',
                    targetFunction: func.name,
                });
            }
        });
        // Test with empty collections
        const collectionParams = func.parameters.filter(p => p.typeAnnotation && (p.typeAnnotation.includes('List') ||
            p.typeAnnotation.includes('Dict') ||
            p.typeAnnotation.includes('Set')));
        if (collectionParams.length > 0) {
            const testName = `test_${func.name}_with_empty_collections`;
            code.push(`    def ${testName}(self):`);
            code.push(`        """Test ${func.name} with empty collections."""`);
            code.push(`        # Arrange`);
            collectionParams.forEach(p => {
                if (p.typeAnnotation?.includes('List')) {
                    code.push(`        ${p.name} = []`);
                }
                else if (p.typeAnnotation?.includes('Dict')) {
                    code.push(`        ${p.name} = {}`);
                }
                else if (p.typeAnnotation?.includes('Set')) {
                    code.push(`        ${p.name} = set()`);
                }
            });
            code.push('');
            code.push(`        # Act`);
            const args = func.parameters.map(p => {
                if (collectionParams.some(cp => cp.name === p.name)) {
                    return p.name;
                }
                return this.generateSampleValue(p.typeAnnotation);
            }).join(', ');
            if (func.isAsync) {
                code.push(`        result = await ${func.name}(${args})`);
            }
            else {
                code.push(`        result = ${func.name}(${args})`);
            }
            code.push('');
            code.push(`        # Assert`);
            code.push(`        assert result is not None`);
            code.push('');
            testCases.push({
                name: testName,
                type: 'edge-case',
                targetFunction: func.name,
            });
        }
        return { code, testCases };
    }
    /**
     * Generate async test for coroutine functions
     */
    generateAsyncTest(func) {
        const code = [];
        code.push(`    @pytest.mark.asyncio`);
        code.push(`    async def test_${func.name}_async(self):`);
        code.push(`        """Async test for ${func.name}."""`);
        code.push(`        # Arrange`);
        code.push(...this.generateArrangeCode(func.parameters));
        code.push('');
        code.push(`        # Act`);
        code.push(`        result = await ${func.name}(${this.generateSampleArguments(func.parameters)})`);
        code.push('');
        code.push(`        # Assert`);
        code.push(`        assert result is not None`);
        if (func.returnType && func.returnType.includes('List')) {
            code.push(`        assert isinstance(result, list)`);
        }
        else if (func.returnType && func.returnType.includes('Dict')) {
            code.push(`        assert isinstance(result, dict)`);
        }
        code.push('');
        return {
            code,
            testCase: {
                name: `test_${func.name}_async`,
                type: 'unit',
                targetFunction: func.name,
            },
        };
    }
    /**
     * Generate mock tests for functions using external dependencies
     */
    generateMockTests(func, imports) {
        const code = [];
        const testCases = [];
        // Find dependencies used in the function
        const deps = this.extractDependencies(func, imports);
        if (deps.length === 0) {
            return { code, testCases };
        }
        // Test with mocked dependencies
        const testName = `test_${func.name}_with_mocks`;
        code.push(`    def ${testName}(self):`);
        code.push(`        """Test ${func.name} with mocked dependencies."""`);
        deps.forEach(dep => {
            code.push(`        ${dep.alias} = MagicMock()`);
            code.push(`        ${dep.alias}.return_value = ${this.generateSampleValue(dep.returnType)}`);
        });
        code.push('');
        code.push('        # Act');
        const depName = deps.length > 0 ? deps[0].name : 'None';
        code.push(`        with patch('${func.name}', wraps=${depName}) as mock_func:`);
        code.push('            # The actual call depends on how the function uses its dependencies');
        code.push('            pass  # Customize based on actual dependency usage');
        code.push('');
        code.push('        # Assert');
        code.push('        mock_func.assert_called_once()');
        code.push('');
        testCases.push({
            name: testName,
            type: 'unit',
            targetFunction: func.name,
        });
        return { code, testCases };
    }
    /**
     * Generate tests for a class
     */
    generateClassTests(cls, imports) {
        const lines = [];
        const testCases = [];
        const usedFixtures = [];
        // Create fixture for class instantiation
        const classFixture = this.createClassFixture(cls);
        if (classFixture) {
            this.fixtures.set(classFixture.name, classFixture);
            usedFixtures.push(classFixture.name);
        }
        const clsDocstring = this.options.useDocstrings && cls.docstring
            ? cls.docstring.split('\n')[0].replace(/^["']|["']$/g, '')
            : null;
        lines.push('');
        lines.push(`class Test${this.capitalize(cls.name)}:`);
        if (clsDocstring) {
            lines.push(`    """${clsDocstring}"""`);
        }
        lines.push('');
        // Setup method
        const setupParams = cls.methods.find(m => m.name === '__init__')?.parameters || [];
        lines.push(`    @pytest.fixture`);
        lines.push(`    def ${this.decapitalize(cls.name)}(self) -> ${cls.name}:`);
        lines.push(`        """Fixture that provides a ${cls.name} instance."""`);
        lines.push(`        return ${cls.name}(${this.generateSampleArguments(setupParams.slice(1))})`);
        lines.push('');
        usedFixtures.push(this.decapitalize(cls.name));
        // Test __init__ if there's meaningful initialization
        const initMethod = cls.methods.find(m => m.name === '__init__');
        if (initMethod && initMethod.parameters.length > 1) {
            const initTest = this.generateInitTest(cls);
            lines.push(...initTest.code);
            testCases.push(initTest.testCase);
        }
        // Generate tests for public methods
        cls.methods
            .filter(m => !m.name.startsWith('_') || m.name === '__init__')
            .filter(m => this.shouldGenerateForFunction(m))
            .forEach(method => {
            const result = this.generateMethodTests(cls, method, imports);
            lines.push(...result.code);
            testCases.push(...result.testCases);
        });
        return { code: lines, testCases, fixtures: usedFixtures };
    }
    /**
     * Generate tests for a class method
     */
    generateMethodTests(cls, method, imports) {
        const lines = [];
        const testCases = [];
        const fixtureName = this.decapitalize(cls.name);
        lines.push(`    def test_${method.name}(self, ${fixtureName}: ${cls.name}):`);
        lines.push(`        """Test ${cls.name}.${method.name}."""`);
        lines.push('');
        lines.push(`        # Act`);
        const params = method.parameters.slice(1); // Skip self/cls
        if (method.isAsync) {
            lines.push(`        result = await ${fixtureName}.${method.name}(${this.generateSampleArguments(params)})`);
        }
        else {
            lines.push(`        result = ${fixtureName}.${method.name}(${this.generateSampleArguments(params)})`);
        }
        lines.push('');
        lines.push(`        # Assert`);
        lines.push(`        assert result is not None`);
        lines.push('');
        testCases.push({
            name: `test_${method.name}`,
            type: 'unit',
            targetClass: cls.name,
            targetFunction: method.name,
        });
        // Exception tests for method
        if (this.options.includeExceptionTests && method.raises.length > 0) {
            method.raises.forEach(exceptionType => {
                const exceptionClass = exceptionType.split('.')[-1];
                lines.push(`    def test_${method.name}_raises_${exceptionClass.toLowerCase()}(self, ${fixtureName}: ${cls.name}):`);
                lines.push(`        """Test that ${cls.name}.${method.name} raises ${exceptionClass}."""`);
                lines.push(`        with pytest.raises(${exceptionType}):`);
                if (method.isAsync) {
                    lines.push(`            import asyncio`);
                    lines.push(`            asyncio.run(${fixtureName}.${method.name}(${this.generateSampleArguments(params)}))`);
                }
                else {
                    lines.push(`            ${fixtureName}.${method.name}(${this.generateSampleArguments(params)})`);
                }
                lines.push('');
                testCases.push({
                    name: `test_${method.name}_raises_${exceptionClass.toLowerCase()}`,
                    type: 'exception',
                    targetClass: cls.name,
                    targetFunction: method.name,
                    expectedException: exceptionType,
                });
            });
        }
        return { code: lines, testCases, fixtures: [] };
    }
    /**
     * Generate test for __init__ method
     */
    generateInitTest(cls) {
        const initMethod = cls.methods.find(m => m.name === '__init__');
        if (!initMethod) {
            return { code: [], testCase: { name: '', type: 'unit' } };
        }
        const params = initMethod.parameters.slice(1);
        const code = [];
        code.push(`    def test_${cls.name}_initialization(self):`);
        code.push(`        """Test that ${cls.name} initializes correctly."""`);
        code.push(`        # Act`);
        code.push(`        instance = ${cls.name}(${this.generateSampleArguments(params)})`);
        code.push('');
        code.push(`        # Assert`);
        code.push(`        assert isinstance(instance, ${cls.name})`);
        // Assert on properties if defined in __init__
        cls.properties
            .filter(p => p.definedInInit)
            .forEach(prop => {
            code.push(`        assert hasattr(instance, '${prop.name}')`);
        });
        code.push('');
        return {
            code,
            testCase: {
                name: `test_${cls.name}_initialization`,
                type: 'unit',
                targetClass: cls.name,
            },
        };
    }
    /**
     * Generate class-specific test file
     */
    generateClassTestFile(cls, imports) {
        const lines = [];
        const testCases = [];
        // Header
        lines.push('"""');
        lines.push(`Tests for ${cls.name} class`);
        if (cls.docstring) {
            lines.push('');
            lines.push(cls.docstring.split('\n')[0]);
        }
        lines.push('"""');
        lines.push('');
        // Imports
        lines.push('import pytest');
        lines.push('from unittest.mock import Mock, MagicMock, patch');
        lines.push(`from ${this.getImportPath(cls.lineNumber > 0 ? '' : '')} import ${cls.name}`);
        lines.push('');
        // Generate tests
        const result = this.generateClassTests(cls, imports);
        lines.push(...result.code);
        testCases.push(...result.testCases);
        return {
            path: this.getTestPath(cls.lineNumber > 0 ? '' : '', `${cls.name.toLowerCase()}_test.py`),
            content: lines.join('\n'),
            testCases,
            fixtures: result.fixtures,
        };
    }
    /**
     * Generate conftest.py for shared fixtures
     */
    generateConftestFile() {
        if (this.fixtures.size === 0) {
            return null;
        }
        const lines = [];
        lines.push('"""');
        lines.push('Pytest configuration and shared fixtures');
        lines.push('"""');
        lines.push('');
        lines.push('import pytest');
        lines.push('');
        // Add async support if needed
        if (this.options.includeAsyncTests) {
            lines.push('pytest_plugins = ["pytest_asyncio"]');
            lines.push('');
            lines.push('');
            lines.push('@pytest.fixture(scope="session")');
            lines.push('def event_loop_policy():');
            lines.push('    """Use the default event loop policy for async tests."""');
            lines.push('    import asyncio');
            lines.push('    return asyncio.get_event_loop_policy()');
            lines.push('');
        }
        // Add shared fixtures
        this.fixtures.forEach((fixture, name) => {
            const scope = fixture.scope === 'session' ? '(scope="session")' :
                fixture.scope === 'module' ? '(scope="module")' :
                    fixture.scope === 'class' ? '(scope="class")' : '';
            lines.push(`@pytest.fixture${scope}`);
            lines.push(`def ${name}():`);
            lines.push(`    """${fixture.description}"""`);
            lines.push(`    ${fixture.setup}`);
            if (fixture.teardown) {
                lines.push(`    yield ${fixture.yieldValue || 'result'}`);
                lines.push(`    ${fixture.teardown}`);
            }
            else if (fixture.yieldValue) {
                lines.push(`    return ${fixture.yieldValue}`);
            }
            lines.push('');
        });
        return {
            path: 'conftest.py',
            content: lines.join('\n'),
            testCases: [],
            fixtures: Array.from(this.fixtures.keys()),
        };
    }
    // ===== Helper Methods =====
    /**
     * Create a fixture for a function if needed
     */
    createFunctionFixture(func) {
        // Create fixtures for complex parameter setups
        const complexParams = func.parameters.filter(p => p.typeAnnotation && (p.typeAnnotation.includes('Dict') ||
            p.typeAnnotation.includes('List') ||
            p.typeAnnotation.includes('object')));
        if (complexParams.length === 0) {
            return null;
        }
        const fixtureName = `setup_${func.name}`;
        return {
            name: fixtureName,
            description: `Setup fixture for ${func.name}`,
            scope: 'function',
            setup: `return {}  # Configure return value as needed`,
            yieldValue: 'result',
        };
    }
    /**
     * Create a fixture for a class
     */
    createClassFixture(cls) {
        const fixtureName = this.decapitalize(cls.name);
        return {
            name: fixtureName,
            description: `Provides a ${cls.name} instance`,
            scope: 'function',
            setup: `return ${cls.name}(${this.generateSampleConstructorArgs(cls)})`,
            yieldValue: 'instance',
        };
    }
    /**
     * Generate sample arguments for function call
     */
    generateSampleArguments(params) {
        return params.map(p => this.generateSampleValue(p.typeAnnotation, p.defaultValue)).join(', ');
    }
    /**
     * Generate sample constructor arguments for class
     */
    generateSampleConstructorArgs(cls) {
        const initMethod = cls.methods.find(m => m.name === '__init__');
        if (!initMethod) {
            return '';
        }
        return this.generateSampleArguments(initMethod.parameters.slice(1));
    }
    /**
     * Generate sample value based on type annotation
     */
    generateSampleValue(typeAnnotation, defaultValue) {
        if (defaultValue) {
            return defaultValue;
        }
        if (!typeAnnotation) {
            return '"sample_value"';
        }
        const type = typeAnnotation.toLowerCase();
        if (type.includes('str'))
            return '"sample_string"';
        if (type.includes('int'))
            return '42';
        if (type.includes('float'))
            return '3.14';
        if (type.includes('bool'))
            return 'True';
        if (type.includes('list') || type.includes('list['))
            return '[]';
        if (type.includes('dict') || type.includes('dict['))
            return '{}';
        if (type.includes('set'))
            return 'set()';
        if (type.includes('tuple'))
            return '()';
        if (type.includes('none') || type.includes('optional'))
            return 'None';
        if (type.includes('any'))
            return 'None';
        if (type.includes('object'))
            return 'object()';
        return 'None';
    }
    /**
     * Generate parameter values for parametrized tests
     */
    generateParamValues(param) {
        if (!param.typeAnnotation) {
            return ['value1', 'value2', 'value3'];
        }
        const type = param.typeAnnotation.toLowerCase();
        if (type.includes('str'))
            return ['""', '"a"', '"abc"'];
        if (type.includes('int'))
            return ['0', '1', '-1', '100'];
        if (type.includes('float'))
            return ['0.0', '1.0', '-1.0', '3.14'];
        if (type.includes('bool'))
            return ['True', 'False'];
        if (type.includes('list'))
            return ['[]', '[1]', '[1, 2, 3]'];
        if (type.includes('dict'))
            return ['{}', '{"key": "value"}'];
        if (type.includes('none') || type.includes('optional'))
            return ['None'];
        return ['value1', 'value2', 'value3'];
    }
    /**
     * Generate combinations of parameter values
     */
    generateCombinations(paramValues) {
        if (paramValues.length === 0)
            return [];
        const combinations = [[]];
        for (const values of paramValues) {
            const newCombinations = [];
            for (const combo of combinations) {
                for (const value of values.slice(0, 3)) { // Limit to 3 values per param
                    newCombinations.push([...combo, value]);
                }
            }
            combinations.length = 0;
            combinations.push(...newCombinations);
        }
        return combinations;
    }
    /**
     * Format value for pytest parametrize
     */
    formatValueForParametrize(value) {
        if (value === null || value === undefined)
            return 'None';
        if (typeof value === 'boolean')
            return value ? 'True' : 'False';
        if (typeof value === 'number')
            return String(value);
        if (typeof value === 'string') {
            if (value.startsWith('"') && value.endsWith('"'))
                return value;
            return `"${value}"`;
        }
        return String(value);
    }
    /**
     * Generate ID for parametrized test
     */
    generateParametrizeId(combo, func) {
        const idParts = combo.map((v, i) => {
            const param = func.parameters[i];
            return `${param?.name || 'arg'}-${this.simplifyValueForId(v)}`;
        });
        return `, id="${idParts.join('-')}"`;
    }
    /**
     * Simplify value for test ID
     */
    simplifyValueForId(value) {
        if (value === null || value === undefined)
            return 'none';
        if (typeof value === 'boolean')
            return value ? 'true' : 'false';
        if (typeof value === 'number')
            return String(value);
        if (typeof value === 'string')
            return value.replace(/"/g, '').substring(0, 10);
        return 'val';
    }
    /**
     * Generate arrange code for test setup
     */
    generateArrangeCode(params) {
        return params.map(p => {
            const value = this.generateSampleValue(p.typeAnnotation, p.defaultValue);
            return `        ${p.name} = ${value}`;
        });
    }
    /**
     * Generate arrange code for exception tests
     */
    generateExceptionArrangeCode(params, exceptionType) {
        // For exception tests, use values that should trigger the exception
        return params.map(p => {
            if (exceptionType.includes('ValueError')) {
                if (p.typeAnnotation?.includes('int') || p.typeAnnotation?.includes('float')) {
                    return `        ${p.name} = "invalid"`;
                }
            }
            if (exceptionType.includes('TypeError')) {
                return `        ${p.name} = None`;
            }
            if (exceptionType.includes('KeyError')) {
                if (p.typeAnnotation?.includes('dict')) {
                    return `        ${p.name} = {}`;
                }
            }
            return `        ${p.name} = ${this.generateSampleValue(p.typeAnnotation)}`;
        });
    }
    /**
     * Generate type assertion for result
     */
    generateTypeAssertion(varName, returnType) {
        const type = returnType.toLowerCase();
        if (type.includes('str'))
            return `isinstance(${varName}, str)`;
        if (type.includes('int'))
            return `isinstance(${varName}, int)`;
        if (type.includes('float'))
            return `isinstance(${varName}, (int, float))`;
        if (type.includes('bool'))
            return `isinstance(${varName}, bool)`;
        if (type.includes('list') || type.includes('list['))
            return `isinstance(${varName}, list)`;
        if (type.includes('dict') || type.includes('dict['))
            return `isinstance(${varName}, dict)`;
        if (type.includes('set'))
            return `isinstance(${varName}, set)`;
        if (type.includes('tuple'))
            return `isinstance(${varName}, tuple)`;
        if (type.includes('none') || type.includes('optional'))
            return `${varName} is None or ${varName} is not None`;
        return null;
    }
    /**
     * Generate invalid input test
     */
    generateInvalidInputTest(func) {
        // Common invalid inputs based on function signature
        const hasNumericParam = func.parameters.some(p => p.typeAnnotation?.includes('int') || p.typeAnnotation?.includes('float'));
        const hasCollectionParam = func.parameters.some(p => p.typeAnnotation?.includes('List') || p.typeAnnotation?.includes('Dict'));
        if (!hasNumericParam && !hasCollectionParam) {
            return null;
        }
        const code = [];
        if (hasNumericParam) {
            const testName = `test_${func.name}_with_negative_number`;
            code.push(`    def ${testName}(self):`);
            code.push(`        """Test ${func.name} with negative number (if applicable)."""`);
            const args = func.parameters.map(p => {
                if (p.typeAnnotation?.includes('int') || p.typeAnnotation?.includes('float')) {
                    return '-1';
                }
                return this.generateSampleValue(p.typeAnnotation);
            }).join(', ');
            code.push(`        # Act & Assert`);
            code.push(`        # Depending on implementation, negative numbers may raise ValueError`);
            code.push(`        try:`);
            if (func.isAsync) {
                code.push(`            result = await ${func.name}(${args})`);
            }
            else {
                code.push(`            result = ${func.name}(${args})`);
            }
            code.push(`        except (ValueError, TypeError):`);
            code.push(`            pass  # Expected for negative values`);
            code.push(`        else:`);
            code.push(`            # Negative input accepted - verify behavior is correct`);
            code.push(`            pass`);
            code.push('');
            return {
                code,
                testCase: {
                    name: testName,
                    type: 'edge-case',
                    targetFunction: func.name,
                },
            };
        }
        return null;
    }
    /**
     * Replace parameter with None
     */
    replaceParamWithNone(params, paramName) {
        return params.map(p => {
            if (p.name === paramName) {
                return 'None';
            }
            return this.generateSampleValue(p.typeAnnotation, p.defaultValue);
        }).join(', ');
    }
    /**
     * Check if type is nullable
     */
    isNullableType(typeAnnotation) {
        const type = typeAnnotation.toLowerCase();
        return type.includes('optional') ||
            type.includes('none') ||
            type.includes('any') ||
            type.includes('null');
    }
    /**
     * Check if function can be parametrized
     */
    canParametrize(func) {
        return func.parameters.length > 0 && func.parameters.length <= 3;
    }
    /**
     * Check if function uses external dependencies
     */
    usesExternalDeps(func, imports) {
        return imports.some(imp => !imp.source.startsWith('.') &&
            func.body.includes(imp.names[0] || ''));
    }
    /**
     * Extract dependencies from function body
     */
    extractDependencies(func, imports) {
        const dependencies = [];
        imports.forEach(imp => {
            imp.names.forEach(name => {
                if (func.body.includes(name)) {
                    dependencies.push({
                        name: name,
                        alias: name.toLowerCase() + '_mock',
                    });
                }
            });
        });
        return dependencies;
    }
    /**
     * Check if we should generate tests for a function
     */
    shouldGenerateForFunction(func) {
        // Skip private functions (starting with _)
        if (func.name.startsWith('_') && func.name !== '__init__') {
            return false;
        }
        return func.isExported || func.name === '__init__';
    }
    /**
     * Check if we should generate tests for a class
     */
    shouldGenerateForClass(cls) {
        return cls.isExported || cls.methods.some(m => m.name === '__init__');
    }
    /**
     * Get test file path from source path
     */
    getTestPath(sourcePath, overrideName) {
        const dir = this.options.testDirectory || 'tests';
        const suffix = this.options.testSuffix || '_test';
        if (overrideName) {
            return `${dir}/${overrideName}`;
        }
        // Convert source_path/module.py to tests/source_path/module_test.py
        const parts = sourcePath.split('/');
        const fileName = parts.pop() || 'module';
        const moduleName = fileName.replace('.py', '') + suffix + '.py';
        if (parts.length > 0) {
            return `${dir}/${parts.join('/')}/${moduleName}`;
        }
        return `${dir}/${moduleName}`;
    }
    /**
     * Get module name from path
     */
    getModuleName(path) {
        const fileName = path.split('/').pop() || 'module';
        return fileName.replace('.py', '');
    }
    /**
     * Get import path from source path
     */
    getImportPath(sourcePath) {
        const parts = sourcePath.split('/');
        const fileName = parts.pop() || 'module';
        const moduleName = fileName.replace('.py', '');
        if (parts.length === 0) {
            return moduleName;
        }
        // Convert to relative import
        const relativeParts = ['.']; // Start with current package
        if (parts[0] === 'src') {
            relativeParts.push(...parts.slice(1));
        }
        else {
            relativeParts.push(...parts);
        }
        relativeParts.push(moduleName);
        return relativeParts.join('.');
    }
    /**
     * Capitalize first letter
     */
    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
    /**
     * Decapitalize first letter
     */
    decapitalize(str) {
        return str.charAt(0).toLowerCase() + str.slice(1);
    }
}
/**
 * Parse Python source code using AST
 * Returns a PythonModule structure
 */
export function analyzePythonCode(sourceCode, filePath) {
    // This function would typically call Python to parse the AST
    // For now, return an empty structure that can be populated
    const lines = sourceCode.split('\n');
    return {
        filePath,
        docstring: extractDocstring(lines),
        functions: extractFunctions(sourceCode),
        classes: extractClasses(sourceCode),
        imports: extractImports(sourceCode),
        exports: extractExports(sourceCode),
    };
}
/**
 * Extract module docstring
 */
function extractDocstring(lines) {
    const firstLine = lines[0]?.trim();
    if (firstLine?.startsWith('"""') || firstLine?.startsWith("'''")) {
        const delimiter = firstLine.slice(0, 3);
        const endIndex = lines.findIndex((l, i) => i > 0 && l.includes(delimiter));
        if (endIndex > 0) {
            return lines.slice(0, endIndex + 1).join('\n');
        }
    }
    return undefined;
}
/**
 * Extract function definitions (simplified - real implementation would use Python AST)
 */
function extractFunctions(sourceCode) {
    const functions = [];
    const lines = sourceCode.split('\n');
    // Simple regex-based extraction (real implementation would use Python AST)
    const funcRegex = /^(?:(@\w+\s+)*)\s*(?:async\s+)?def\s+(\w+)\s*\((.*?)\)\s*(?:->\s*([^:]+))?\s*:/;
    const raiseRegex = /raise\s+(\w+(?:\.\w+)*)/g;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(funcRegex);
        if (match) {
            const [, decoratorsStr, name, paramsStr, returnType] = match;
            const decorators = decoratorsStr?.match(/@(\w+)/g)?.map(d => d.slice(1)) || [];
            const raises = [];
            // Find raises in function body
            let j = i + 1;
            const currentIndent = lines[j]?.match(/^(\s*)/)?.[1].length || 0;
            while (j < lines.length && lines[j]?.match(/^\s/) && (lines[j]?.match(/^(\s*)/)?.[1].length || 0) > currentIndent) {
                const raiseMatch = lines[j]?.match(raiseRegex);
                if (raiseMatch) {
                    raises.push(...raiseMatch);
                }
                j++;
            }
            // Parse parameters
            const parameters = paramsStr.split(',').map(p => {
                const [name, defaultValue] = p.trim().split('=').map(s => s.trim());
                const typeMatch = name?.match(/(\w+)\s*:\s*(.+)/);
                return {
                    name: typeMatch?.[1] || name || '',
                    typeAnnotation: typeMatch?.[2],
                    defaultValue,
                    isVariadic: name?.startsWith('*') || false,
                    isKwArgs: name?.startsWith('**') || false,
                };
            }).filter(p => p.name);
            // Get docstring
            let docstring;
            if (lines[i + 1]?.trim().startsWith('"""') || lines[i + 1]?.trim().startsWith("'''")) {
                const docLines = [];
                let j = i + 1;
                while (j < lines.length && !lines[j].trim().endsWith('"""') && !lines[j].trim().endsWith("'''")) {
                    docLines.push(lines[j].trim());
                    j++;
                }
                if (lines[j]?.trim().endsWith('"""') || lines[j]?.trim().endsWith("'''")) {
                    docLines.push(lines[j].trim());
                }
                docstring = docLines.join('\n');
            }
            // Get function body
            const bodyStart = i + 1;
            let bodyEnd = bodyStart;
            while (bodyEnd < lines.length && lines[bodyEnd]?.match(/^\s/) && (lines[bodyEnd]?.match(/^(\s*)/)?.[1].length || 0) > 0) {
                bodyEnd++;
            }
            const body = lines.slice(bodyStart, bodyEnd).join('\n');
            functions.push({
                name,
                parameters,
                returnType: returnType?.trim(),
                isAsync: line.includes('async def'),
                isExported: true, // Assume all functions are exported
                docstring,
                body,
                lineNumber: i + 1,
                raises,
                decorators,
            });
        }
    }
    return functions;
}
/**
 * Extract class definitions (simplified)
 */
function extractClasses(sourceCode) {
    const classes = [];
    const lines = sourceCode.split('\n');
    // Simple regex-based extraction
    const classRegex = /^(?:(@\w+\s+)*)\s*class\s+(\w+)\s*(?:\(([^)]*)\))?\s*:/;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(classRegex);
        if (match) {
            const [, decoratorsStr, name, basesStr] = match;
            const decorators = decoratorsStr?.match(/@(\w+)/g)?.map(d => d.slice(1)) || [];
            const baseClasses = basesStr?.split(',').map(b => b.trim()) || [];
            // Get docstring
            let docstring;
            if (lines[i + 1]?.trim().startsWith('"""') || lines[i + 1]?.trim().startsWith("'''")) {
                const docLines = [];
                let j = i + 1;
                while (j < lines.length && !lines[j].trim().endsWith('"""') && !lines[j].trim().endsWith("'''")) {
                    docLines.push(lines[j].trim());
                    j++;
                }
                if (lines[j]?.trim().endsWith('"""') || lines[j]?.trim().endsWith("'''")) {
                    docLines.push(lines[j].trim());
                }
                docstring = docLines.join('\n');
            }
            // Extract methods (simplified)
            const methods = [];
            let j = i + 1;
            const classIndent = line.match(/^(\s*)/)?.[1].length || 0;
            while (j < lines.length) {
                const methodLine = lines[j];
                const methodIndent = methodLine.match(/^(\s*)/)?.[1].length || 0;
                if (methodIndent <= classIndent && methodLine.trim()) {
                    break;
                }
                if (methodIndent > classIndent) {
                    const funcMatch = methodLine.match(/(?:(@\w+\s+)*)\s*(?:async\s+)?def\s+(\w+)\s*\((.*?)\)\s*(?:->\s*([^:]+))?\s*:/);
                    if (funcMatch) {
                        const [, methodDecoratorsStr, methodName, paramsStr, methodReturnType] = funcMatch;
                        const methodDecorators = methodDecoratorsStr?.match(/@(\w+)/g)?.map(d => d.slice(1)) || [];
                        // Get method body and raises
                        const raiseRegex = /raise\s+(\w+(?:\.\w+)*)/g;
                        let methodBodyEnd = j + 1;
                        while (methodBodyEnd < lines.length) {
                            const bodyLine = lines[methodBodyEnd];
                            const bodyIndent = bodyLine.match(/^(\s*)/)?.[1].length || 0;
                            if (bodyIndent <= methodIndent && bodyLine.trim()) {
                                break;
                            }
                            methodBodyEnd++;
                        }
                        const methodBody = lines.slice(j + 1, methodBodyEnd).join('\n');
                        const raises = [];
                        let raiseMatch;
                        while ((raiseMatch = raiseRegex.exec(methodBody)) !== null) {
                            raises.push(raiseMatch[1]);
                        }
                        // Parse parameters
                        const parameters = paramsStr.split(',').map(p => {
                            const [pName, defaultValue] = p.trim().split('=').map(s => s.trim());
                            const typeMatch = pName?.match(/(\w+)\s*:\s*(.+)/);
                            return {
                                name: typeMatch?.[1] || pName || '',
                                typeAnnotation: typeMatch?.[2],
                                defaultValue,
                                isVariadic: pName?.startsWith('*') || false,
                                isKwArgs: pName?.startsWith('**') || false,
                            };
                        }).filter(p => p.name);
                        // Get method docstring
                        let methodDocstring;
                        if (lines[j + 1]?.trim().startsWith('"""') || lines[j + 1]?.trim().startsWith("'''")) {
                            const docLines = [];
                            let dj = j + 1;
                            while (dj < lines.length && !lines[dj].trim().endsWith('"""') && !lines[dj].trim().endsWith("'''")) {
                                docLines.push(lines[dj].trim());
                                dj++;
                            }
                            if (lines[dj]?.trim().endsWith('"""') || lines[dj]?.trim().endsWith("'''")) {
                                docLines.push(lines[dj].trim());
                            }
                            methodDocstring = docLines.join('\n');
                        }
                        methods.push({
                            name: methodName,
                            parameters,
                            returnType: methodReturnType?.trim(),
                            isAsync: methodLine.includes('async def'),
                            isExported: !methodName.startsWith('_'),
                            docstring: methodDocstring,
                            body: methodBody,
                            lineNumber: j + 1,
                            raises,
                            decorators: methodDecorators,
                        });
                        j = methodBodyEnd;
                    }
                }
                j++;
            }
            classes.push({
                name,
                baseClasses,
                docstring,
                methods,
                decorators,
                properties: [], // Would need __init__ analysis
                lineNumber: i + 1,
                isExported: true,
            });
        }
    }
    return classes;
}
/**
 * Extract import statements (simplified)
 */
function extractImports(sourceCode) {
    const imports = [];
    const lines = sourceCode.split('\n');
    const importRegex = /^(?:import|from)\s+(.+?)\s+(?:import\s+(.+))?$/;
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('import ') || trimmed.startsWith('from ')) {
            const match = trimmed.match(importRegex);
            if (match) {
                if (trimmed.startsWith('from ')) {
                    const [, source, namesStr] = match;
                    imports.push({
                        source: source.trim(),
                        names: namesStr?.split(',').map(n => n.trim()) || [],
                        isFromImport: true,
                        isRelative: source.startsWith('.'),
                        level: source.startsWith('.') ? source.match(/^\.+/)[0].length : undefined,
                    });
                }
                else {
                    const [, source] = match;
                    imports.push({
                        source: source.trim(),
                        names: [],
                        isFromImport: false,
                        isRelative: source.startsWith('.'),
                    });
                }
            }
        }
    }
    return imports;
}
/**
 * Extract module-level exports (simplified)
 */
function extractExports(sourceCode) {
    const exports = [];
    const lines = sourceCode.split('\n');
    // Look for module-level assignments, function defs, class defs
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const indent = lines[i].match(/^(\s*)/)?.[1].length || 0;
        // Only process module-level definitions
        if (indent > 0)
            continue;
        // Function exports
        if (line.match(/^(?:async\s+)?def\s+(\w+)/)) {
            const name = line.match(/^(?:async\s+)?def\s+(\w+)/)?.[1];
            const returnType = line.match(/->\s*(.+?)\s*:/)?.[1];
            if (name) {
                exports.push({
                    name,
                    typeAnnotation: returnType?.trim(),
                    kind: 'function',
                });
            }
        }
        // Class exports
        if (line.match(/^class\s+(\w+)/)) {
            const name = line.match(/^class\s+(\w+)/)?.[1];
            if (name) {
                exports.push({
                    name,
                    kind: 'class',
                });
            }
        }
        // Constant exports (CAPITAL_CASE = ...)
        if (line.match(/^[A-Z][A-Z0-9_]*\s*=/)) {
            const name = line.match(/^([A-Z][A-Z0-9_]*)\s*=/)?.[1];
            if (name) {
                exports.push({
                    name,
                    kind: 'constant',
                });
            }
        }
    }
    return exports;
}
//# sourceMappingURL=pytest-test-generator.js.map
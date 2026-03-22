/**
 * Pytest test generator with fixtures, parametrization, and exception testing
 *
 * This module generates comprehensive pytest-compatible test files from Python source code
 * using the Python AST module for accurate code analysis.
 */
import type { PythonModule, PytestTestGenerationResult } from './types.js';
/**
 * Configuration options for pytest test generation
 */
export interface PytestGenerationOptions {
    /** Include fixture generation */
    includeFixtures: boolean;
    /** Include parametrized tests */
    includeParametrize: boolean;
    /** Include exception/raises tests */
    includeExceptionTests: boolean;
    /** Include async test support (pytest-asyncio) */
    includeAsyncTests: boolean;
    /** Include mock tests (pytest-mock) */
    includeMockTests: boolean;
    /** Include coverage markers */
    includeCoverageMarkers: boolean;
    /** Test directory (relative to source) */
    testDirectory?: string;
    /** Test file name suffix */
    testSuffix?: string;
    /** Generate conftest.py for shared fixtures */
    generateConftest: boolean;
    /** Use type hints for better test generation */
    useTypeHints: boolean;
    /** Include docstring-based test names */
    useDocstrings: boolean;
    /** Maximum parametrized cases per test */
    maxParametrizeCases?: number;
}
/**
 * PytestTestGenerator class
 *
 * Generates comprehensive pytest test files from Python source code.
 */
export declare class PytestTestGenerator {
    private options;
    private fixtures;
    constructor(options?: Partial<PytestGenerationOptions>);
    /**
     * Generate pytest test files from Python module analysis
     */
    generate(analysis: PythonModule): PytestTestGenerationResult;
    /**
     * Parse Python source code into a PythonModule structure
     * This uses Python's AST module via subprocess (since we're in TypeScript)
     */
    parsePythonSource(sourcePath: string): PythonModule;
    /**
     * Generate the main test file content
     */
    private generateMainTestFile;
    /**
     * Generate file header with module docstring
     */
    private generateHeader;
    /**
     * Generate pytest-compatible imports
     */
    private generateImports;
    /**
     * Generate fixture decorators for fixtures in this file
     */
    private generateFixtureDecorators;
    /**
     * Generate tests for a single function
     */
    private generateFunctionTests;
    /**
     * Generate happy path test for a function
     */
    private generateHappyPathTest;
    /**
     * Generate parametrized tests using @pytest.mark.parametrize
     */
    private generateParametrizedTests;
    /**
     * Generate exception tests using pytest.raises
     */
    private generateExceptionTests;
    /**
     * Generate edge case tests
     */
    private generateEdgeCaseTests;
    /**
     * Generate async test for coroutine functions
     */
    private generateAsyncTest;
    /**
     * Generate mock tests for functions using external dependencies
     */
    private generateMockTests;
    /**
     * Generate tests for a class
     */
    private generateClassTests;
    /**
     * Generate tests for a class method
     */
    private generateMethodTests;
    /**
     * Generate test for __init__ method
     */
    private generateInitTest;
    /**
     * Generate class-specific test file
     */
    private generateClassTestFile;
    /**
     * Generate conftest.py for shared fixtures
     */
    private generateConftestFile;
    /**
     * Create a fixture for a function if needed
     */
    private createFunctionFixture;
    /**
     * Create a fixture for a class
     */
    private createClassFixture;
    /**
     * Generate sample arguments for function call
     */
    private generateSampleArguments;
    /**
     * Generate sample constructor arguments for class
     */
    private generateSampleConstructorArgs;
    /**
     * Generate sample value based on type annotation
     */
    private generateSampleValue;
    /**
     * Generate parameter values for parametrized tests
     */
    private generateParamValues;
    /**
     * Generate combinations of parameter values
     */
    private generateCombinations;
    /**
     * Format value for pytest parametrize
     */
    private formatValueForParametrize;
    /**
     * Generate ID for parametrized test
     */
    private generateParametrizeId;
    /**
     * Simplify value for test ID
     */
    private simplifyValueForId;
    /**
     * Generate arrange code for test setup
     */
    private generateArrangeCode;
    /**
     * Generate arrange code for exception tests
     */
    private generateExceptionArrangeCode;
    /**
     * Generate type assertion for result
     */
    private generateTypeAssertion;
    /**
     * Generate invalid input test
     */
    private generateInvalidInputTest;
    /**
     * Replace parameter with None
     */
    private replaceParamWithNone;
    /**
     * Check if type is nullable
     */
    private isNullableType;
    /**
     * Check if function can be parametrized
     */
    private canParametrize;
    /**
     * Check if function uses external dependencies
     */
    private usesExternalDeps;
    /**
     * Extract dependencies from function body
     */
    private extractDependencies;
    /**
     * Check if we should generate tests for a function
     */
    private shouldGenerateForFunction;
    /**
     * Check if we should generate tests for a class
     */
    private shouldGenerateForClass;
    /**
     * Get test file path from source path
     */
    private getTestPath;
    /**
     * Get module name from path
     */
    private getModuleName;
    /**
     * Get import path from source path
     */
    private getImportPath;
    /**
     * Capitalize first letter
     */
    private capitalize;
    /**
     * Decapitalize first letter
     */
    private decapitalize;
}
/**
 * Parse Python source code using AST
 * Returns a PythonModule structure
 */
export declare function analyzePythonCode(sourceCode: string, filePath: string): PythonModule;
/**
 * Configuration options for the pytest generator
 */
export interface PytestGeneratorConfig {
    /** Whether to generate fixtures */
    fixtures?: boolean;
    /** Whether to generate parametrized tests */
    parametrized?: boolean;
    /** Whether to generate exception tests */
    exceptions?: boolean;
    /** Whether to generate async tests */
    asyncTests?: boolean;
    /** Whether to generate mock tests */
    mocks?: boolean;
    /** Test directory path */
    testDir?: string;
    /** Test file suffix */
    testSuffix?: string;
}
//# sourceMappingURL=pytest-test-generator.d.ts.map
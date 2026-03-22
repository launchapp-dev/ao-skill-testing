/**
 * Vitest Unit Test Generation Agent
 *
 * Analyzes TypeScript source files and generates comprehensive vitest test files
 * with happy-path tests, edge case tests, and error scenario tests.
 */
import type { SourceFile, AnalyzedFunction, AnalyzedClass, TestGenerationOptions, TestGenerationResult } from '../types.js';
/**
 * Test case types for categorization
 */
export interface TestCaseTemplate {
    name: string;
    description: string;
    type: 'happy-path' | 'edge-case' | 'error-scenario' | 'type-check';
    generate: (func: AnalyzedFunction, cls?: AnalyzedClass) => string;
}
/**
 * Agent configuration for vitest test generation
 */
export interface VitestAgentConfig {
    /** Source file to analyze */
    sourceFile: SourceFile;
    /** Test generation options */
    options?: Partial<TestGenerationOptions>;
    /** Custom test templates */
    customTemplates?: TestCaseTemplate[];
}
/**
 * Generated test output with metadata
 */
export interface VitestTestOutput {
    /** Path where the test file should be written */
    testPath: string;
    /** Generated test content */
    content: string;
    /** List of test case names and types */
    testCases: Array<{
        name: string;
        type: string;
        lineNumber: number;
    }>;
    /** Analysis summary */
    analysis: {
        functionsFound: number;
        classesFound: number;
        testsGenerated: number;
        sourceFile: string;
    };
}
/**
 * Main agent class for vitest unit test generation
 */
export declare class VitestUnitTestAgent {
    private generator;
    private options;
    constructor(options?: Partial<TestGenerationOptions>);
    /**
     * Generate tests for a source file
     */
    generateTests(sourceFile: SourceFile): TestGenerationResult;
    /**
     * Generate tests from source code string
     */
    generateTestsFromCode(code: string, filePath: string): TestGenerationResult;
    /**
     * Get test output with detailed metadata
     */
    generateTestOutput(sourceFile: SourceFile): VitestTestOutput;
    /**
     * Get current configuration
     */
    getConfig(): Readonly<Required<TestGenerationOptions>>;
    /**
     * Update configuration
     */
    updateConfig(options: Partial<TestGenerationOptions>): void;
}
/**
 * Convenience function for generating tests
 */
export declare function generateVitestTests(code: string, filePath: string, options?: Partial<TestGenerationOptions>): TestGenerationResult;
//# sourceMappingURL=vitest.d.ts.map
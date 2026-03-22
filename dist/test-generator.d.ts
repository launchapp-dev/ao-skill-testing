import type { AnalyzedModule, TestGenerationOptions, TestGenerationResult } from './types.js';
/**
 * Generates vitest tests from analyzed source code
 */
export declare class TestGenerator {
    private options;
    constructor(options?: Partial<TestGenerationOptions>);
    /**
     * Generate tests for an analyzed module
     */
    generate(analysis: AnalyzedModule): TestGenerationResult;
    /**
     * Generate tests for functions
     */
    private generateFunctionTests;
    /**
     * Generate tests for a single function
     */
    private generateTestsForFunction;
    /**
     * Generate tests for a class
     */
    private generateClassTests;
    /**
     * Generate tests for a class method
     */
    private generateMethodTests;
    /**
     * Generate import statements
     */
    private generateImports;
    /**
     * Generate sample arguments for a function
     */
    private generateSampleArguments;
    /**
     * Generate sample constructor arguments
     */
    private generateSampleConstructorArgs;
    /**
     * Generate edge case arguments
     */
    private generateEdgeCaseArguments;
    /**
     * Generate null/undefined arguments
     */
    private generateNullArguments;
    /**
     * Generate a sample value for a type
     */
    private generateSampleValue;
    /**
     * Generate an edge case value for a type
     */
    private generateEdgeCaseValue;
    /**
     * Infer JavaScript type from TypeScript type
     */
    private inferTypeFromTypeScript;
    /**
     * Get test file path
     */
    private getTestPath;
    /**
     * Get import path from source file path
     */
    private getImportPath;
    /**
     * Get module name from file path
     */
    private getModuleName;
}
//# sourceMappingURL=test-generator.d.ts.map
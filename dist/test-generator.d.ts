import type { AnalyzedModule, AnalyzedFunction, AnalyzedClass, TestGenerationOptions, GeneratedTest, TestGenerationResult } from './types.js';
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
    protected generateFunctionTests(analysis: AnalyzedModule): GeneratedTest;
    /**
     * Generate tests for a single function
     */
    protected generateTestsForFunction(func: AnalyzedFunction): {
        code: string;
        testCases: GeneratedTest['testCases'];
    };
    /**
     * Generate tests for a class
     */
    protected generateClassTests(analysis: AnalyzedModule, cls: AnalyzedClass): GeneratedTest;
    /**
     * Generate tests for a class method
     */
    protected generateMethodTests(cls: AnalyzedClass, method: AnalyzedFunction): {
        code: string;
        testCases: GeneratedTest['testCases'];
    };
    /**
     * Generate import statements
     */
    protected generateImports(analysis: AnalyzedModule): string;
    /**
     * Generate sample arguments for a function
     */
    protected generateSampleArguments(func: AnalyzedFunction): string;
    /**
     * Generate sample constructor arguments
     */
    protected generateSampleConstructorArgs(cls: AnalyzedClass): string;
    /**
     * Generate edge case arguments
     */
    protected generateEdgeCaseArguments(func: AnalyzedFunction, edgeParam: string): string;
    /**
     * Generate null/undefined arguments
     */
    protected generateNullArguments(func: AnalyzedFunction): string;
    /**
     * Generate a sample value for a type
     */
    protected generateSampleValue(type?: string): string;
    /**
     * Generate an edge case value for a type
     */
    protected generateEdgeCaseValue(type?: string): string;
    /**
     * Infer JavaScript type from TypeScript type
     */
    protected inferTypeFromTypeScript(tsType: string): string;
    /**
     * Get test file path
     */
    protected getTestPath(sourcePath: string, suffix: string): string;
    /**
     * Get import path from source file path
     */
    protected getImportPath(sourcePath: string): string;
    /**
     * Get module name from file path
     */
    protected getModuleName(filePath: string): string;
}
//# sourceMappingURL=test-generator.d.ts.map
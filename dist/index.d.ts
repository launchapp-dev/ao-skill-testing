/**
 * Main API for the test generation skill pack
 */
import type { SourceFile, TestGenerationOptions, TestGenerationResult } from './types.js';
export { SourceAnalyzer } from './source-analyzer.js';
export { TestGenerator } from './test-generator.js';
export * from './types.js';
export { VitestUnitTestAgent, generateVitestTests } from './agents/vitest.js';
export type { VitestAgentConfig, VitestTestOutput, TestCaseTemplate } from './agents/vitest.js';
/**
 * Main API for generating tests from source code
 */
export declare class UnitTestAgent {
    private analyzer;
    private generator;
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
     * Analyze source code without generating tests
     */
    analyze(sourceFile: SourceFile): import("./types.js").AnalyzedModule;
}
/**
 * Convenience function to generate tests
 */
export declare function generateTests(code: string, filePath: string, options?: Partial<TestGenerationOptions>): TestGenerationResult;
//# sourceMappingURL=index.d.ts.map
import type { AnalyzedModule, AnalyzedFunction, AnalyzedClass, TestGenerationOptions, GeneratedTest } from './types.js';
import { TestGenerator } from './test-generator.js';
/**
 * Jest-specific test generator with advanced mocking and assertion capabilities
 */
export declare class JestTestGenerator extends TestGenerator {
    private jestOptions;
    constructor(options?: Partial<TestGenerationOptions> & Partial<JestTestOptions>);
    /**
     * Override generate method to add Jest-specific test generation
     */
    generate(analysis: AnalyzedModule): import("./types.js").TestGenerationResult;
    /**
     * Generate Jest-specific imports
     */
    protected generateImports(analysis: AnalyzedModule): string;
    /**
     * Generate mock tests for module dependencies
     */
    private generateMockTests;
    /**
     * Generate tests with jest.spyOn for method mocking
     */
    protected generateTestsForFunction(func: AnalyzedFunction): {
        code: string;
        testCases: GeneratedTest['testCases'];
    };
    /**
     * Generate class tests with Jest-specific mocking
     */
    protected generateMethodTests(cls: AnalyzedClass, method: AnalyzedFunction): {
        code: string;
        testCases: GeneratedTest['testCases'];
    };
    /**
     * Generate snapshot tests
     */
    private generateSnapshotTests;
    /**
     * Generate Jest configuration file
     */
    generateJestConfig(options?: JestConfigOptions): string;
    /**
     * Generate Jest setup file
     */
    generateJestSetup(customMatchers?: string[]): string;
    /**
     * Generate mock arguments with jest.fn()
     */
    private generateMockArguments;
    /**
     * Extract dependencies from function body
     */
    private extractDependencies;
    /**
     * Get module alias from import path
     */
    private getModuleAlias;
}
/**
 * Jest-specific test options
 */
export interface JestTestOptions {
    /** Include automatic mock generation */
    includeAutoMocks: boolean;
    /** Include jest.spyOn tests */
    includeSpyOn: boolean;
    /** Include mock restore tests */
    includeMockRestore: boolean;
    /** Include snapshot tests */
    includeSnapshotTests: boolean;
    /** Include timer mocks */
    includeTimers: boolean;
    /** Custom matchers to include */
    customMatchers: string[];
}
/**
 * Jest configuration options
 */
export interface JestConfigOptions {
    testEnvironment?: string;
    roots?: string[];
    testMatch?: string[];
    transform?: Record<string, string>;
    collectCoverageFrom?: string[];
    coverageDirectory?: string;
    coverageReporters?: string[];
    moduleNameMapper?: Record<string, string>;
    setupFilesAfterEnv?: string[];
    verbose?: boolean;
    testTimeout?: number;
    extraConfig?: Record<string, any>;
}
//# sourceMappingURL=jest-test-generator.d.ts.map
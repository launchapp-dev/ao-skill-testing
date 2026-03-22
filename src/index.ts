import type { SourceFile, TestGenerationOptions, TestGenerationResult } from './types.js';
import { SourceAnalyzer } from './source-analyzer.js';
import { TestGenerator } from './test-generator.js';
import { JestTestGenerator } from './jest-test-generator.js';
import {
  EdgeCaseTestGenerator,
  EdgeCaseGenerator,
  ErrorConditionDetector,
  type EdgeCaseTestGeneratorOptions,
  type GeneratedEdgeCaseTests,
  generateAsyncErrorScenarios,
} from './edge-cases/index.js';

export { SourceAnalyzer } from './source-analyzer.js';
export { TestGenerator } from './test-generator.js';
export { JestTestGenerator } from './jest-test-generator.js';
export { EdgeCaseGenerator } from './edge-cases/index.js';
export { ErrorConditionDetector } from './edge-cases/index.js';
export { EdgeCaseTestGenerator } from './edge-cases/index.js';
export type { EdgeCaseTestGeneratorOptions, GeneratedEdgeCaseTests } from './edge-cases/index.js';
export { generateAsyncErrorScenarios } from './edge-cases/index.js';
export type { EdgeCase, EdgeCaseTestCase, AsyncErrorScenario, AssertionPattern } from './edge-cases/index.js';
export * from './types.js';

/**
 * Main API for generating tests from source code
 */
export class UnitTestAgent {
  private analyzer: SourceAnalyzer;
  private generator: TestGenerator;

  constructor(options: Partial<TestGenerationOptions> = {}) {
    this.analyzer = new SourceAnalyzer();
    this.generator = new TestGenerator(options);
  }

  /**
   * Generate tests for a source file
   */
  generateTests(sourceFile: SourceFile): TestGenerationResult {
    // Analyze the source code
    const analysis = this.analyzer.analyze(sourceFile);
    
    // Generate tests based on analysis
    const result = this.generator.generate(analysis);
    
    return result;
  }

  /**
   * Generate tests from source code string
   */
  generateTestsFromCode(code: string, filePath: string): TestGenerationResult {
    return this.generateTests({
      path: filePath,
      content: code,
      language: filePath.endsWith('.ts') ? 'typescript' : 'javascript'
    });
  }

  /**
   * Analyze source code without generating tests
   */
  analyze(sourceFile: SourceFile) {
    return this.analyzer.analyze(sourceFile);
  }
}

/**
 * Convenience function to generate tests
 */
export function generateTests(
  code: string, 
  filePath: string, 
  options?: Partial<TestGenerationOptions>
): TestGenerationResult {
  const agent = new UnitTestAgent(options);
  return agent.generateTestsFromCode(code, filePath);
}

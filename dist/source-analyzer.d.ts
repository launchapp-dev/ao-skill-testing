import type { AnalyzedModule, SourceFile } from './types.js';
/**
 * Analyzes source files to extract testable units
 */
export declare class SourceAnalyzer {
    /**
     * Create a fresh project for each analysis to avoid caching issues
     */
    private createProject;
    /**
     * Analyze a source file and extract testable units
     */
    analyze(sourceFile: SourceFile): AnalyzedModule;
    /**
     * Extract function declarations and expressions
     */
    private extractFunctions;
    /**
     * Parse a function declaration
     */
    private parseFunctionDeclaration;
    /**
     * Extract class declarations
     */
    private extractClasses;
    /**
     * Parse a class declaration
     */
    private parseClassDeclaration;
    /**
     * Extract exports from the file
     */
    private extractExports;
    /**
     * Extract import statements
     */
    private extractImports;
    /**
     * Check if a declaration is exported
     */
    private isExported;
    /**
     * Get JSDoc comment from a node
     */
    private getJsDoc;
    /**
     * Get visibility of a property
     */
    private getVisibility;
    /**
     * Get the kind of declaration
     */
    private getDeclarationKind;
    /**
     * Get the type of a declaration
     */
    private getDeclarationType;
}
//# sourceMappingURL=source-analyzer.d.ts.map
/**
 * Vitest Unit Test Generation Agent
 *
 * Analyzes TypeScript source files and generates comprehensive vitest test files
 * with happy-path tests, edge case tests, and error scenario tests.
 */
import { Project } from 'ts-morph';
/**
 * Analyzes source files using ts-morph
 */
class SourceAnalyzer {
    createProject() {
        return new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
                strict: true,
            }
        });
    }
    /**
     * Analyze a source file and extract testable units
     */
    analyze(sourceFile) {
        const project = this.createProject();
        const tsFile = project.createSourceFile(sourceFile.path, sourceFile.content, {
            overwrite: true
        });
        return {
            filePath: sourceFile.path,
            functions: this.extractFunctions(tsFile),
            classes: this.extractClasses(tsFile),
            exports: this.extractExports(tsFile),
            imports: this.extractImports(tsFile)
        };
    }
    /**
     * Extract function declarations
     */
    extractFunctions(file) {
        const functions = [];
        file.getFunctions().forEach(func => {
            functions.push({
                name: func.getName() || 'anonymous',
                parameters: func.getParameters().map(p => ({
                    name: p.getName(),
                    type: p.getType().getText(),
                    optional: p.isOptional(),
                    defaultValue: p.getInitializer()?.getText()
                })),
                returnType: func.getReturnType().getText(),
                isAsync: func.isAsync(),
                isExported: func.isExported(),
                documentation: this.getJsDoc(func),
                body: func.getBodyText() || '',
                lineNumber: func.getStartLineNumber()
            });
        });
        // Handle exported arrow functions
        file.getVariableDeclarations().forEach(varDecl => {
            const initializer = varDecl.getInitializer();
            if (initializer &&
                (initializer.getKindName() === 'ArrowFunction' ||
                    initializer.getKindName() === 'FunctionExpression')) {
                const name = varDecl.getNameNode().getText();
                functions.push({
                    name,
                    parameters: initializer.getParameters?.()?.map((p) => ({
                        name: p.getName(),
                        type: p.getType()?.getText(),
                        optional: p.isOptional?.(),
                        defaultValue: p.getInitializer()?.getText()
                    })) || [],
                    returnType: initializer.getReturnType?.()?.getText?.() || undefined,
                    isAsync: initializer.isAsync?.() || false,
                    isExported: true,
                    body: initializer.getText(),
                    lineNumber: varDecl.getStartLineNumber()
                });
            }
        });
        return functions;
    }
    /**
     * Extract class declarations
     */
    extractClasses(file) {
        return file.getClasses().map(cls => ({
            name: cls.getName() || 'AnonymousClass',
            constructorParams: cls.getConstructors()[0]?.getParameters().map(p => ({
                name: p.getName(),
                type: p.getType().getText(),
                optional: p.isOptional()
            })) || [],
            methods: cls.getMethods().map(method => ({
                name: method.getName(),
                parameters: method.getParameters().map(p => ({
                    name: p.getName(),
                    type: p.getType().getText(),
                    optional: p.isOptional(),
                    defaultValue: p.getInitializer()?.getText()
                })),
                returnType: method.getReturnType().getText(),
                isAsync: method.isAsync(),
                isExported: false,
                documentation: this.getJsDoc(method),
                body: method.getBodyText() || '',
                lineNumber: method.getStartLineNumber()
            })),
            properties: cls.getProperties().map(prop => ({
                name: prop.getName(),
                type: prop.getType().getText(),
                visibility: this.getVisibility(prop)
            })),
            isExported: cls.isExported(),
            lineNumber: cls.getStartLineNumber()
        }));
    }
    /**
     * Extract exports
     */
    extractExports(file) {
        const exports = [];
        file.getExportedDeclarations().forEach((declarations, name) => {
            declarations.forEach(decl => {
                exports.push({
                    name,
                    type: this.getDeclarationType(decl),
                    kind: this.getDeclarationKind(decl)
                });
            });
        });
        return exports;
    }
    /**
     * Extract imports
     */
    extractImports(file) {
        return file.getImportDeclarations().map(imp => ({
            source: imp.getModuleSpecifierValue(),
            specifiers: [
                ...(imp.getDefaultImport() ? ['default'] : []),
                ...imp.getNamedImports().map(ni => ni.getName())
            ],
            isDefault: imp.getDefaultImport() !== undefined
        }));
    }
    getJsDoc(node) {
        try {
            const docs = node.getJsDocs?.();
            return docs?.[0]?.getDescription();
        }
        catch {
            return undefined;
        }
    }
    getVisibility(prop) {
        try {
            if (prop.getScope?.() === 'private')
                return 'private';
            if (prop.getScope?.() === 'protected')
                return 'protected';
            return 'public';
        }
        catch {
            return 'public';
        }
    }
    getDeclarationKind(decl) {
        const kindName = decl.getKindName?.();
        if (kindName === 'FunctionDeclaration')
            return 'function';
        if (kindName === 'ClassDeclaration')
            return 'class';
        return 'const';
    }
    getDeclarationType(decl) {
        try {
            return decl.getType?.()?.getText();
        }
        catch {
            return undefined;
        }
    }
}
/**
 * Generates vitest test files from analyzed source code
 */
class VitestTestGenerator {
    options;
    analyzer;
    constructor(options = {}) {
        this.options = {
            framework: 'vitest',
            includeTypeTests: true,
            includeEdgeCases: true,
            includeMocks: true,
            testDirectory: 'tests',
            testSuffix: '.test',
            maxTestsPerFunction: 10,
            ...options
        };
        this.analyzer = new SourceAnalyzer();
    }
    /**
     * Generate tests for a source file
     */
    generate(sourceFile) {
        const analysis = this.analyzer.analyze(sourceFile);
        const tests = [];
        // Generate function tests
        const exportedFunctions = analysis.functions.filter(f => f.isExported);
        if (exportedFunctions.length > 0) {
            tests.push(this.generateFunctionTests(analysis, exportedFunctions));
        }
        // Generate class tests
        for (const cls of analysis.classes.filter(c => c.isExported)) {
            tests.push(this.generateClassTests(analysis, cls));
        }
        return {
            tests,
            analysis,
            metadata: {
                sourceFile: sourceFile.path,
                generatedAt: new Date().toISOString(),
                framework: this.options.framework,
                totalTests: tests.reduce((sum, t) => sum + t.testCases.length, 0)
            }
        };
    }
    /**
     * Generate tests for exported functions
     */
    generateFunctionTests(analysis, functions) {
        const lines = [];
        const testCases = [];
        const testPath = this.getTestPath(analysis.filePath);
        const moduleName = this.getModuleName(analysis.filePath);
        // Header with imports
        lines.push(...this.generateHeader(analysis));
        lines.push('');
        lines.push(`describe('${moduleName}', () => {`);
        lines.push('');
        for (const func of functions) {
            const funcTests = this.generateTestsForFunction(func);
            lines.push(funcTests.code);
            testCases.push(...funcTests.testCases);
        }
        lines.push('});');
        return { path: testPath, content: lines.join('\n'), testCases };
    }
    /**
     * Generate tests for a class
     */
    generateClassTests(analysis, cls) {
        const lines = [];
        const testCases = [];
        const testPath = this.getTestPath(analysis.filePath, cls.name);
        lines.push(...this.generateHeader(analysis));
        lines.push('');
        lines.push(`describe('${cls.name}', () => {`);
        lines.push('');
        // Instance creation test
        lines.push("  let instance: any;");
        lines.push('');
        lines.push('  beforeEach(() => {');
        lines.push(`    instance = new ${cls.name}(${this.generateConstructorArgs(cls)});`);
        lines.push('  });');
        lines.push('');
        testCases.push({
            name: `${cls.name} instantiation`,
            type: 'happy-path',
            targetClass: cls.name
        });
        // Constructor test
        lines.push(`  it('should instantiate correctly', () => {`);
        lines.push(`    expect(instance).toBeDefined();`);
        lines.push(`    expect(instance).toBeInstanceOf(${cls.name});`);
        lines.push('  });');
        lines.push('');
        // Method tests
        for (const method of cls.methods) {
            const methodTests = this.generateTestsForMethod(cls, method);
            lines.push(methodTests.code);
            testCases.push(...methodTests.testCases);
        }
        lines.push('});');
        return { path: testPath, content: lines.join('\n'), testCases };
    }
    /**
     * Generate tests for a function
     */
    generateTestsForFunction(func) {
        const lines = [];
        const testCases = [];
        lines.push(`  describe('${func.name}', () => {`);
        // Happy path test
        testCases.push({ name: `${func.name} - happy path`, type: 'happy-path', targetFunction: func.name });
        lines.push(`    it('should execute ${func.name} successfully', () => {`);
        const args = this.generateTestArgs(func);
        if (func.isAsync) {
            lines.push(`      const result = await ${func.name}(${args});`);
            lines.push(`      expect(result).toBeDefined();`);
        }
        else {
            lines.push(`      const result = ${func.name}(${args});`);
            lines.push(`      expect(result).toBeDefined();`);
        }
        lines.push('    });');
        lines.push('');
        // Return type test
        if (this.options.includeTypeTests && func.returnType) {
            testCases.push({ name: `${func.name} - return type`, type: 'type-check', targetFunction: func.name });
            lines.push(`    it('should return correct type', () => {`);
            if (func.isAsync) {
                lines.push(`      const result = await ${func.name}(${args});`);
            }
            else {
                lines.push(`      const result = ${func.name}(${args});`);
            }
            lines.push(`      expect(typeof result).toBe('${this.inferJsType(func.returnType)}');`);
            lines.push('    });');
            lines.push('');
        }
        // Edge case tests
        if (this.options.includeEdgeCases) {
            // Empty/null inputs
            testCases.push({ name: `${func.name} - null/undefined handling`, type: 'edge-case', targetFunction: func.name });
            lines.push(`    it('should handle null/undefined inputs gracefully', () => {`);
            const nullArgs = func.parameters.map(() => 'null').join(', ');
            lines.push(`      expect(() => ${func.name}(${nullArgs})).not.toThrow();`);
            lines.push('    });');
            lines.push('');
            // Empty string for string params
            const stringParams = func.parameters.filter(p => p.type?.toLowerCase().includes('string'));
            if (stringParams.length > 0) {
                testCases.push({ name: `${func.name} - empty string handling`, type: 'edge-case', targetFunction: func.name });
                lines.push(`    it('should handle empty string inputs', () => {`);
                const emptyArgs = func.parameters.map(p => p.type?.toLowerCase().includes('string') ? "''" : this.generateSampleValue(p.type)).join(', ');
                lines.push(`      expect(() => ${func.name}(${emptyArgs})).not.toThrow();`);
                lines.push('    });');
                lines.push('');
            }
            // Zero for number params
            const numberParams = func.parameters.filter(p => p.type?.toLowerCase().includes('number'));
            if (numberParams.length > 0) {
                testCases.push({ name: `${func.name} - zero value handling`, type: 'edge-case', targetFunction: func.name });
                lines.push(`    it('should handle zero values correctly', () => {`);
                const zeroArgs = func.parameters.map(p => p.type?.toLowerCase().includes('number') ? '0' : this.generateSampleValue(p.type)).join(', ');
                lines.push(`      const result = ${func.name}(${zeroArgs});`);
                lines.push(`      expect(result).toBeDefined();`);
                lines.push('    });');
                lines.push('');
            }
        }
        // Error scenario tests
        testCases.push({ name: `${func.name} - error handling`, type: 'error-scenario', targetFunction: func.name });
        lines.push(`    it('should handle invalid inputs', () => {`);
        const invalidArgs = func.parameters.map(p => 'undefined').join(', ');
        lines.push(`      // Test that function handles invalid inputs gracefully`);
        lines.push(`      try {`);
        if (func.isAsync) {
            lines.push(`        await ${func.name}(${invalidArgs});`);
        }
        else {
            lines.push(`        ${func.name}(${invalidArgs});`);
        }
        lines.push(`      } catch (error) {`);
        lines.push(`        expect(error).toBeDefined();`);
        lines.push(`      }`);
        lines.push('    });');
        lines.push('');
        lines.push('  });');
        lines.push('');
        return { code: lines.join('\n'), testCases };
    }
    /**
     * Generate tests for a class method
     */
    generateTestsForMethod(cls, method) {
        const lines = [];
        const testCases = [];
        lines.push(`  describe('${method.name}', () => {`);
        // Happy path
        testCases.push({ name: `${cls.name}.${method.name} - happy path`, type: 'happy-path', targetClass: cls.name });
        lines.push(`    it('should execute ${method.name} successfully', () => {`);
        const args = this.generateTestArgs(method);
        if (method.isAsync) {
            lines.push(`      const result = await instance.${method.name}(${args});`);
            lines.push(`      expect(result).toBeDefined();`);
        }
        else {
            lines.push(`      const result = instance.${method.name}(${args});`);
            lines.push(`      expect(result).toBeDefined();`);
        }
        lines.push('    });');
        lines.push('');
        // Edge cases
        if (this.options.includeEdgeCases) {
            testCases.push({ name: `${cls.name}.${method.name} - edge case`, type: 'edge-case', targetClass: cls.name });
            lines.push(`    it('should handle edge cases', () => {`);
            const edgeArgs = method.parameters.map(p => p.type?.toLowerCase().includes('string') ? "''" :
                p.type?.toLowerCase().includes('number') ? '0' : 'null').join(', ');
            lines.push(`      expect(() => instance.${method.name}(${edgeArgs})).not.toThrow();`);
            lines.push('    });');
            lines.push('');
        }
        lines.push('  });');
        return { code: lines.join('\n'), testCases };
    }
    /**
     * Generate import header
     */
    generateHeader(analysis) {
        const lines = [];
        // Framework imports
        if (this.options.framework === 'vitest') {
            lines.push("import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';");
        }
        else {
            lines.push("import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';");
        }
        // Source imports
        const exports = analysis.exports.filter(e => e.kind === 'function' || e.kind === 'class');
        if (exports.length > 0) {
            const importPath = this.getImportPath(analysis.filePath);
            lines.push(`import { ${exports.map(e => e.name).join(', ')} } from '${importPath}';`);
        }
        return lines;
    }
    /**
     * Generate sample arguments for a function
     */
    generateTestArgs(func) {
        return func.parameters.map(p => p.defaultValue || this.generateSampleValue(p.type)).join(', ');
    }
    /**
     * Generate constructor arguments for a class
     */
    generateConstructorArgs(cls) {
        return cls.constructorParams.map(p => this.generateSampleValue(p.type)).join(', ');
    }
    /**
     * Generate a sample value based on type
     */
    generateSampleValue(type) {
        if (!type)
            return 'undefined';
        const lower = type.toLowerCase();
        if (lower.includes('string'))
            return "'test'";
        if (lower.includes('number'))
            return '42';
        if (lower.includes('boolean'))
            return 'true';
        if (lower.includes('array'))
            return '[]';
        if (lower.includes('object'))
            return '{}';
        if (lower.includes('function'))
            return '() => {}';
        if (lower.includes('promise'))
            return 'Promise.resolve(undefined)';
        if (lower.includes('date'))
            return 'new Date()';
        if (lower.includes('map'))
            return 'new Map()';
        if (lower.includes('set'))
            return 'new Set()';
        return 'undefined';
    }
    /**
     * Infer JavaScript type from TypeScript type annotation
     */
    inferJsType(tsType) {
        const lower = tsType.toLowerCase();
        if (lower.includes('string'))
            return 'string';
        if (lower.includes('number'))
            return 'number';
        if (lower.includes('boolean'))
            return 'boolean';
        if (lower.includes('function'))
            return 'function';
        if (lower.includes('symbol'))
            return 'symbol';
        if (lower.includes('bigint'))
            return 'bigint';
        if (lower.includes('void') || lower.includes('undefined'))
            return 'undefined';
        if (lower.includes('null'))
            return 'object';
        if (lower.includes('promise'))
            return 'object';
        return 'object';
    }
    /**
     * Get test file path from source path
     */
    getTestPath(sourcePath, suffix = '') {
        const dir = this.options.testDirectory;
        const baseName = sourcePath.split('/').pop()?.replace(/\.(ts|js)x?$/, '') || 'test';
        const testSuffix = this.options.testSuffix;
        return `${dir}/${baseName}${suffix ? '-' + suffix : ''}${testSuffix}.ts`;
    }
    /**
     * Get import path from source file path
     */
    getImportPath(sourcePath) {
        return sourcePath.replace(/\.(ts|js)x?$/, '');
    }
    /**
     * Get module name from file path
     */
    getModuleName(filePath) {
        return filePath.split('/').pop()?.replace(/\.(ts|js)x?$/, '') || 'module';
    }
}
/**
 * Main agent class for vitest unit test generation
 */
export class VitestUnitTestAgent {
    generator;
    options;
    constructor(options = {}) {
        this.options = {
            framework: 'vitest',
            includeTypeTests: true,
            includeEdgeCases: true,
            includeMocks: true,
            testDirectory: 'tests',
            testSuffix: '.test',
            maxTestsPerFunction: 10,
            ...options
        };
        this.generator = new VitestTestGenerator(this.options);
    }
    /**
     * Generate tests for a source file
     */
    generateTests(sourceFile) {
        return this.generator.generate(sourceFile);
    }
    /**
     * Generate tests from source code string
     */
    generateTestsFromCode(code, filePath) {
        return this.generator.generate({
            path: filePath,
            content: code,
            language: filePath.endsWith('.ts') ? 'typescript' : 'javascript'
        });
    }
    /**
     * Get test output with detailed metadata
     */
    generateTestOutput(sourceFile) {
        const result = this.generateTests(sourceFile);
        const mainTest = result.tests[0];
        return {
            testPath: mainTest?.path || this.options.testDirectory + '/test.test.ts',
            content: mainTest?.content || '',
            testCases: mainTest?.testCases.map((tc, i) => ({
                name: tc.name,
                type: tc.type,
                lineNumber: i * 5 + 10 // Approximate line numbers
            })) || [],
            analysis: {
                functionsFound: result.analysis.functions.filter(f => f.isExported).length,
                classesFound: result.analysis.classes.filter(c => c.isExported).length,
                testsGenerated: result.metadata.totalTests,
                sourceFile: result.metadata.sourceFile
            }
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.options };
    }
    /**
     * Update configuration
     */
    updateConfig(options) {
        this.options = { ...this.options, ...options };
        this.generator = new VitestTestGenerator(this.options);
    }
}
/**
 * Convenience function for generating tests
 */
export function generateVitestTests(code, filePath, options) {
    const agent = new VitestUnitTestAgent(options);
    return agent.generateTestsFromCode(code, filePath);
}
//# sourceMappingURL=vitest.js.map
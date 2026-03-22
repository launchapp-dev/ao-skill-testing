/**
 * Core types for the test generation skill pack
 */
/**
 * Python-specific types for pytest test generation
 */
export interface PythonFunction {
    /** Function name */
    name: string;
    /** Function parameters */
    parameters: PythonParameter[];
    /** Return type annotation (string representation) */
    returnType?: string;
    /** Whether the function is async (coroutine) */
    isAsync: boolean;
    /** Whether the function is exported (public) */
    isExported: boolean;
    /** Docstring if present */
    docstring?: string;
    /** Function body source */
    body: string;
    /** Line number in source file */
    lineNumber: number;
    /** Raises clauses (exception types raised) */
    raises: string[];
    /** Decorators applied to the function */
    decorators: string[];
}
export interface PythonParameter {
    /** Parameter name */
    name: string;
    /** Type annotation (string representation) */
    typeAnnotation?: string;
    /** Default value if any */
    defaultValue?: string;
    /** Whether the parameter is *args */
    isVariadic: boolean;
    /** Whether the parameter is **kwargs */
    isKwArgs: boolean;
}
export interface PythonClass {
    /** Class name */
    name: string;
    /** Base classes */
    baseClasses: string[];
    /** Class docstring */
    docstring?: string;
    /** Class methods */
    methods: PythonFunction[];
    /** Class decorators */
    decorators: string[];
    /** Properties (instance/class variables defined in __init__) */
    properties: PythonProperty[];
    /** Line number in source file */
    lineNumber: number;
    /** Whether the class is exported */
    isExported: boolean;
}
export interface PythonProperty {
    /** Property name */
    name: string;
    /** Type annotation */
    typeAnnotation?: string;
    /** Defined in __init__ method */
    definedInInit: boolean;
}
export interface PythonImport {
    /** Import source module */
    source: string;
    /** Imported names */
    names: string[];
    /** Is a 'from X import Y' style import */
    isFromImport: boolean;
    /** Is a relative import */
    isRelative: boolean;
    /** Relative import level (e.g., 1 for '.', 2 for '..') */
    level?: number;
}
export interface PythonModule {
    /** Source file path */
    filePath: string;
    /** Module docstring */
    docstring?: string;
    /** Analyzed functions */
    functions: PythonFunction[];
    /** Analyzed classes */
    classes: PythonClass[];
    /** Import statements */
    imports: PythonImport[];
    /** Module-level constants/exports */
    exports: Array<{
        name: string;
        typeAnnotation?: string;
        kind: 'constant' | 'function' | 'class' | 'module';
    }>;
}
export interface PytestTestCase {
    /** Test case name */
    name: string;
    /** Test type */
    type: 'unit' | 'integration' | 'exception' | 'parametrized' | 'fixture' | 'edge-case';
    /** Target function name */
    targetFunction?: string;
    /** Target class name */
    targetClass?: string;
    /** Parameters for parametrized tests */
    parametrizedParams?: Array<Record<string, any>>;
    /** Expected exception type for exception tests */
    expectedException?: string;
}
export interface GeneratedPytestTest {
    /** Test file path */
    path: string;
    /** Test file content */
    content: string;
    /** Fixture file path (if fixtures are generated) */
    fixturePath?: string;
    /** Fixture content (if generated) */
    fixtureContent?: string;
    /** Test cases generated */
    testCases: PytestTestCase[];
    /** Fixtures used */
    fixtures: string[];
}
export interface PytestTestGenerationResult {
    /** Generated test files */
    tests: GeneratedPytestTest[];
    /** Source analysis results */
    analysis: PythonModule;
    /** Generation metadata */
    metadata: {
        sourceFile: string;
        generatedAt: string;
        framework: 'pytest';
        totalTests: number;
        totalFixtures: number;
    };
}
export interface AnalyzedFunction {
    /** Function name */
    name: string;
    /** Function parameters */
    parameters: Array<{
        name: string;
        type?: string;
        optional: boolean;
        defaultValue?: string;
    }>;
    /** Return type annotation */
    returnType?: string;
    /** Whether the function is async */
    isAsync: boolean;
    /** Whether the function is exported */
    isExported: boolean;
    /** JSDoc comment if present */
    documentation?: string;
    /** Function body source */
    body: string;
    /** Line number in source file */
    lineNumber: number;
}
export interface AnalyzedClass {
    /** Class name */
    name: string;
    /** Constructor parameters */
    constructorParams: Array<{
        name: string;
        type?: string;
        optional: boolean;
    }>;
    /** Class methods */
    methods: AnalyzedFunction[];
    /** Class properties */
    properties: Array<{
        name: string;
        type?: string;
        visibility: 'public' | 'private' | 'protected';
    }>;
    /** Whether the class is exported */
    isExported: boolean;
    /** Line number in source file */
    lineNumber: number;
}
export interface AnalyzedModule {
    /** Source file path */
    filePath: string;
    /** Exported functions */
    functions: AnalyzedFunction[];
    /** Exported classes */
    classes: AnalyzedClass[];
    /** Exported constants/variables */
    exports: Array<{
        name: string;
        type?: string;
        kind: 'const' | 'let' | 'var' | 'function' | 'class';
    }>;
    /** Import statements */
    imports: Array<{
        source: string;
        specifiers: string[];
        isDefault: boolean;
    }>;
}
export interface TestGenerationOptions {
    /** Test framework to use */
    framework: 'vitest' | 'jest' | 'pytest';
    /** Include type-based test generation */
    includeTypeTests: boolean;
    /** Include edge case tests */
    includeEdgeCases: boolean;
    /** Include mock generation */
    includeMocks: boolean;
    /** Custom test directory */
    testDirectory?: string;
    /** Test file name suffix */
    testSuffix?: string;
    /** Maximum tests per function */
    maxTestsPerFunction?: number;
}
export interface GeneratedTest {
    /** Test file path */
    path: string;
    /** Test file content */
    content: string;
    /** Test cases generated */
    testCases: Array<{
        name: string;
        type: 'unit' | 'integration' | 'edge-case' | 'type-check';
        targetFunction?: string;
        targetClass?: string;
    }>;
}
export interface TestGenerationResult {
    /** Generated test files */
    tests: GeneratedTest[];
    /** Source analysis results */
    analysis: AnalyzedModule;
    /** Generation metadata */
    metadata: {
        sourceFile: string;
        generatedAt: string;
        framework: string;
        totalTests: number;
    };
}
export interface SourceFile {
    /** Absolute or relative path to the source file */
    path: string;
    /** File content */
    content: string;
    /** Language/framework type */
    language: 'typescript' | 'javascript' | 'python';
}
//# sourceMappingURL=types.d.ts.map
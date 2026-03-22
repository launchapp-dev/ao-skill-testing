import { Project } from 'ts-morph';
/**
 * Analyzes source files to extract testable units
 */
export class SourceAnalyzer {
    /**
     * Create a fresh project for each analysis to avoid caching issues
     */
    createProject() {
        return new Project({
            useInMemoryFileSystem: true,
            compilerOptions: {
                allowJs: true,
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
     * Extract function declarations and expressions
     */
    extractFunctions(file) {
        const functions = [];
        // Get function declarations
        file.getFunctions().forEach(func => {
            functions.push(this.parseFunctionDeclaration(func));
        });
        // Get exported arrow functions and function expressions
        file.getVariableDeclarations().forEach(varDecl => {
            const initializer = varDecl.getInitializer();
            if (initializer && (initializer.getKindName() === 'ArrowFunction' || initializer.getKindName() === 'FunctionExpression')) {
                const nameNode = varDecl.getNameNode();
                const name = nameNode.getText();
                const func = {
                    name,
                    parameters: [],
                    returnType: undefined,
                    isAsync: false,
                    isExported: this.isExported(varDecl),
                    documentation: undefined,
                    body: initializer.getText(),
                    lineNumber: varDecl.getStartLineNumber()
                };
                // Try to get parameters from the function
                const funcExpr = initializer;
                if (funcExpr.getParameters) {
                    func.parameters = funcExpr.getParameters().map((p) => ({
                        name: p.getName(),
                        type: p.getType()?.getText(),
                        optional: p.isOptional(),
                        defaultValue: p.getInitializer()?.getText()
                    }));
                    func.isAsync = funcExpr.isAsync?.() || false;
                }
                functions.push(func);
            }
        });
        return functions;
    }
    /**
     * Parse a function declaration
     */
    parseFunctionDeclaration(func) {
        return {
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
        };
    }
    /**
     * Extract class declarations
     */
    extractClasses(file) {
        const classes = [];
        file.getClasses().forEach(cls => {
            classes.push(this.parseClassDeclaration(cls));
        });
        return classes;
    }
    /**
     * Parse a class declaration
     */
    parseClassDeclaration(cls) {
        const ctor = cls.getConstructors()[0];
        return {
            name: cls.getName() || 'AnonymousClass',
            constructorParams: ctor?.getParameters().map(p => ({
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
                isExported: false, // methods aren't directly exported
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
        };
    }
    /**
     * Extract exports from the file
     */
    extractExports(file) {
        const exports = [];
        file.getExportedDeclarations().forEach((declarations, name) => {
            declarations.forEach(decl => {
                const kind = this.getDeclarationKind(decl);
                exports.push({
                    name,
                    type: this.getDeclarationType(decl),
                    kind
                });
            });
        });
        return exports;
    }
    /**
     * Extract import statements
     */
    extractImports(file) {
        const imports = [];
        file.getImportDeclarations().forEach(imp => {
            const source = imp.getModuleSpecifierValue();
            const isDefault = imp.getDefaultImport() !== undefined;
            const specifiers = imp.getNamedImports().map(ni => ni.getName());
            if (imp.getDefaultImport()) {
                specifiers.unshift('default');
            }
            imports.push({
                source,
                specifiers,
                isDefault
            });
        });
        return imports;
    }
    /**
     * Check if a declaration is exported
     */
    isExported(decl) {
        try {
            return decl.isExported?.() || false;
        }
        catch {
            return false;
        }
    }
    /**
     * Get JSDoc comment from a node
     */
    getJsDoc(node) {
        try {
            const docs = node.getJsDocs?.();
            if (docs && docs.length > 0) {
                return docs.map((d) => d.getDescription()).join('\n');
            }
        }
        catch { }
        return undefined;
    }
    /**
     * Get visibility of a property
     */
    getVisibility(prop) {
        try {
            if (prop.hasDeclareKeyword?.())
                return 'public';
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
    /**
     * Get the kind of declaration
     */
    getDeclarationKind(decl) {
        const kindName = decl.getKindName?.();
        if (kindName === 'FunctionDeclaration')
            return 'function';
        if (kindName === 'ClassDeclaration')
            return 'class';
        if (kindName === 'VariableDeclaration') {
            const parent = decl.getParent();
            if (parent) {
                const declKind = parent.getDeclarationKind?.();
                if (declKind)
                    return declKind;
            }
        }
        return 'const';
    }
    /**
     * Get the type of a declaration
     */
    getDeclarationType(decl) {
        try {
            return decl.getType?.()?.getText();
        }
        catch {
            return undefined;
        }
    }
}
//# sourceMappingURL=source-analyzer.js.map
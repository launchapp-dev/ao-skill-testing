import { describe, it, expect } from 'vitest';
import { SourceAnalyzer } from '../src/source-analyzer.js';

describe('SourceAnalyzer', () => {
  const analyzer = new SourceAnalyzer();

  describe('analyze', () => {
    it('should analyze a simple function', () => {
      const code = `
        export function add(a: number, b: number): number {
          return a + b;
        }
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('add');
      expect(result.functions[0].parameters).toHaveLength(2);
      expect(result.functions[0].isExported).toBe(true);
      expect(result.functions[0].isAsync).toBe(false);
    });

    it('should analyze async functions', () => {
      const code = `
        export async function fetchData(url: string): Promise<string> {
          const response = await fetch(url);
          return response.text();
        }
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].name).toBe('fetchData');
      expect(result.functions[0].isAsync).toBe(true);
    });

    it('should analyze class declarations', () => {
      const code = `
        export class Calculator {
          private value: number = 0;
          
          add(x: number): number {
            this.value += x;
            return this.value;
          }
          
          getValue(): number {
            return this.value;
          }
        }
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.classes).toHaveLength(1);
      expect(result.classes[0].name).toBe('Calculator');
      expect(result.classes[0].methods).toHaveLength(2);
      expect(result.classes[0].isExported).toBe(true);
    });

    it('should extract imports', () => {
      const code = `
        import { foo, bar } from './utils';
        import baz from './baz';
        
        export function test() {
          return foo();
        }
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.imports).toHaveLength(2);
      expect(result.imports[0].source).toBe('./utils');
      expect(result.imports[0].specifiers).toContain('foo');
      expect(result.imports[0].specifiers).toContain('bar');
    });

    it('should handle functions with default parameters', () => {
      const code = `
        export function greet(name: string, greeting: string = 'Hello'): string {
          return \`\${greeting}, \${name}!\`;
        }
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.functions).toHaveLength(1);
      expect(result.functions[0].parameters).toHaveLength(2);
      expect(result.functions[0].parameters[1].optional).toBe(true);
    });

    it('should extract arrow function exports', () => {
      const code = `
        export const multiply = (a: number, b: number): number => a * b;
      `;
      
      const result = analyzer.analyze({
        path: 'test.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.functions.length).toBeGreaterThanOrEqual(1);
      const arrowFunc = result.functions.find(f => f.name === 'multiply');
      expect(arrowFunc).toBeDefined();
    });
  });
});

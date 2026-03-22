import { describe, it, expect } from 'vitest';
import { UnitTestAgent, generateTests } from '../src/index.js';

describe('UnitTestAgent', () => {
  describe('generateTests', () => {
    it('should generate tests from source code', () => {
      const agent = new UnitTestAgent({ framework: 'vitest' });
      
      const code = `
        export function capitalize(str: string): string {
          return str.charAt(0).toUpperCase() + str.slice(1);
        }
      `;

      const result = agent.generateTests({
        path: 'src/string-utils.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.tests).toBeDefined();
      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.analysis.functions.length).toBeGreaterThan(0);
      expect(result.metadata.framework).toBe('vitest');
    });

    it('should analyze classes and methods', () => {
      const agent = new UnitTestAgent();
      
      const code = `
        export class Queue<T> {
          private items: T[] = [];
          
          enqueue(item: T): void {
            this.items.push(item);
          }
          
          dequeue(): T | undefined {
            return this.items.shift();
          }
          
          size(): number {
            return this.items.length;
          }
        }
      `;

      const result = agent.generateTests({
        path: 'src/queue.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.analysis.classes.length).toBeGreaterThan(0);
      expect(result.analysis.classes[0].name).toBe('Queue');
      expect(result.analysis.classes[0].methods.length).toBe(3);
      
      // Should generate tests for the class
      const classTest = result.tests.find(t => t.content.includes('Queue'));
      expect(classTest).toBeDefined();
      expect(classTest?.content).toContain('describe(\'Queue\'');
    });

    it('should handle multiple exports', () => {
      const agent = new UnitTestAgent();
      
      const code = `
        export const PI = 3.14159;
        
        export function circleArea(radius: number): number {
          return PI * radius * radius;
        }
        
        export function circleCircumference(radius: number): number {
          return 2 * PI * radius;
        }
      `;

      const result = agent.generateTests({
        path: 'src/circle.ts',
        content: code,
        language: 'typescript'
      });

      expect(result.analysis.functions.length).toBe(2);
      expect(result.analysis.exports.length).toBeGreaterThan(0);
    });
  });

  describe('generateTestsFromCode', () => {
    it('should generate tests from code string', () => {
      const agent = new UnitTestAgent();
      
      const code = `
        export function isEven(num: number): boolean {
          return num % 2 === 0;
        }
      `;

      const result = agent.generateTestsFromCode(code, 'math.ts');

      expect(result.tests.length).toBeGreaterThan(0);
      expect(result.tests[0].content).toContain('isEven');
    });
  });

  describe('analyze', () => {
    it('should return analysis without generating tests', () => {
      const agent = new UnitTestAgent();
      
      const code = `
        export function multiply(a: number, b: number): number {
          return a * b;
        }
      `;

      const analysis = agent.analyze({
        path: 'math.ts',
        content: code,
        language: 'typescript'
      });

      expect(analysis.functions.length).toBe(1);
      expect(analysis.functions[0].name).toBe('multiply');
    });
  });
});

describe('generateTests convenience function', () => {
  it('should generate tests with default options', () => {
    const code = `
      export function negate(value: boolean): boolean {
        return !value;
      }
    `;

    const result = generateTests(code, 'logic.ts');

    expect(result.tests.length).toBeGreaterThan(0);
    expect(result.metadata.framework).toBe('vitest');
  });

  it('should accept custom options', () => {
    const code = `
      export function identity<T>(value: T): T {
        return value;
      }
    `;

    const result = generateTests(code, 'utils.ts', {
      framework: 'vitest',
      includeEdgeCases: false,
      includeTypeTests: false
    });

    expect(result.metadata.framework).toBe('vitest');
    const edgeCases = result.tests[0].testCases.filter(tc => tc.type === 'edge-case');
    expect(edgeCases.length).toBe(0);
  });
});

describe('Integration tests', () => {
  it('should handle complex real-world code', () => {
    const agent = new UnitTestAgent();
    
    const code = `
      interface User {
        id: string;
        name: string;
        email: string;
      }
      
      export class UserService {
        private users: Map<string, User> = new Map();
        
        async createUser(data: Omit<User, 'id'>): Promise<User> {
          const id = crypto.randomUUID();
          const user = { id, ...data };
          this.users.set(id, user);
          return user;
        }
        
        getUser(id: string): User | undefined {
          return this.users.get(id);
        }
        
        async updateUser(id: string, data: Partial<User>): Promise<User | null> {
          const user = this.users.get(id);
          if (!user) return null;
          
          const updated = { ...user, ...data, id };
          this.users.set(id, updated);
          return updated;
        }
        
        deleteUser(id: string): boolean {
          return this.users.delete(id);
        }
        
        listUsers(): User[] {
          return Array.from(this.users.values());
        }
      }
      
      export function validateEmail(email: string): boolean {
        const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
        return emailRegex.test(email);
      }
    `;

    const result = agent.generateTests({
      path: 'src/user-service.ts',
      content: code,
      language: 'typescript'
    });

    expect(result.analysis.classes.length).toBe(1);
    expect(result.analysis.functions.length).toBe(1);
    
    const userServiceClass = result.analysis.classes[0];
    expect(userServiceClass.name).toBe('UserService');
    expect(userServiceClass.methods.length).toBe(5);
    
    // Check that async methods are detected
    const asyncMethods = userServiceClass.methods.filter(m => m.isAsync);
    expect(asyncMethods.length).toBe(2);
    
    // Should have generated multiple test files
    expect(result.tests.length).toBeGreaterThan(0);
    
    // Total test count should be substantial
    expect(result.metadata.totalTests).toBeGreaterThan(5);
  });

  it('should preserve imports and dependencies in generated tests', () => {
    const agent = new UnitTestAgent();
    
    const code = `
      import { config } from './config';
      import { Logger } from './logger';
      
      export class App {
        constructor(
          private logger: Logger,
          private config: typeof config
        ) {}
        
        start(): void {
          this.logger.info('Starting app');
        }
      }
    `;

    const result = agent.generateTests({
      path: 'src/app.ts',
      content: code,
      language: 'typescript'
    });

    expect(result.analysis.imports.length).toBe(2);
    expect(result.analysis.imports[0].source).toBe('./config');
    
    // Generated test should import the class
    const testContent = result.tests[0].content;
    expect(testContent).toContain('import { App }');
  });
});

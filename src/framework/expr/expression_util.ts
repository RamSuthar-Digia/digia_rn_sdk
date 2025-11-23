import { Expression } from '@digia/expr-rn';
import { to, ToType } from '../utils/object_util';
import { ScopeContext } from './scope_context';

/**
 * Evaluates a string expression and converts the result to the specified type.
 *
 * This function assumes that the input has already been validated and is a
 * valid string expression. It evaluates the expression using the provided
 * context and attempts to convert the result to type T.
 *
 * @template T - The expected return type
 * @param expression - The string expression to evaluate
 * @param scopeContext - The context for expression evaluation
 * @returns The evaluated result converted to type T, or null if conversion fails
 * 
 * @example
 * ```typescript
 * const result = evaluateExpression<number>('2 + 2', context);
 * // result: 4
 * 
 * const user = evaluateExpression<string>('user.name', context);
 * // result: "John"
 * ```
 */
export function evaluateExpression<T = any>(
    expression: string,
    scopeContext?: ScopeContext | null,
    type?: ToType
): T | null {
    const result = Expression.eval(expression, scopeContext ?? null);
    return to<T>(result, { type });
}

/**
 * Evaluates an expression (string or object) with optional decoding.
 *
 * Handles both expression strings and regular values. If the value is not
 * an expression, it's returned as-is or decoded if a decoder is provided.
 *
 * @template T - The expected return type
 * @param expression - The expression or value to evaluate
 * @param options - Evaluation options
 * @returns The evaluated result converted to type T, or null
 * 
 * @example
 * ```typescript
 * // Expression evaluation
 * const result1 = evaluate<number>('${count + 1}', { scopeContext });
 * 
 * // Direct value
 * const result2 = evaluate<string>('hello', {});
 * 
 * // With decoder
 * const user = evaluate<User>({ id: 1, name: 'John' }, {
 *   decoder: (obj) => User.fromJson(obj)
 * });
 * ```
 */
export function evaluate<T = any>(
    expression: any,
    options?: {
        scopeContext?: ScopeContext | null;
        decoder?: (value: any) => T | null;
    }
): T | null {
    if (expression == null) return null;

    if (!hasExpression(expression)) {
        return options?.decoder?.(expression) ?? to<T>(expression);
    }

    const result = Expression.eval(expression as string, options?.scopeContext ?? null);
    return to<T>(result);
}

/**
 * Checks if a value contains an expression pattern.
 *
 * Detects the expression syntax (e.g., "${...}") in strings.
 *
 * @param expression - The value to check
 * @returns True if the value is a string containing expression syntax
 * 
 * @example
 * ```typescript
 * hasExpression('${user.name}'); // true
 * hasExpression('Hello ${name}'); // true
 * hasExpression('plain text'); // false
 * hasExpression(123); // false
 * ```
 */
export function hasExpression(expression: any): boolean {
    return typeof expression === 'string' && Expression.hasExpression(expression);
}

/**
 * Recursively evaluates expressions in nested data structures.
 *
 * Walks through objects and arrays, evaluating any expressions found
 * in string values while preserving the structure.
 *
 * @param data - The data to evaluate (can be primitives, objects, or arrays)
 * @param context - The scope context for expression evaluation
 * @returns The data with all expressions evaluated
 * 
 * @example
 * ```typescript
 * const data = {
 *   name: '${user.name}',
 *   age: 30,
 *   address: {
 *     city: '${user.city}',
 *     zip: '${user.zip}'
 *   },
 *   tags: ['${tag1}', '${tag2}']
 * };
 * 
 * const result = evaluateNestedExpressions(data, context);
 * // All expressions replaced with actual values
 * ```
 */
export function evaluateNestedExpressions(
    data: any,
    context?: ScopeContext | null
): any {
    if (data == null) return null;

    // Evaluate primitive types directly
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean') {
        return evaluate(data, { scopeContext: context });
    }

    // Recursively evaluate Map/Object entries
    if (typeof data === 'object' && !Array.isArray(data)) {
        const result: Record<string, any> = {};

        for (const key in data) {
            if (data.hasOwnProperty(key)) {
                const evaluatedKey = evaluate<string>(key, { scopeContext: context }) ?? key;
                const evaluatedValue = evaluateNestedExpressions(data[key], context);
                result[evaluatedKey] = evaluatedValue;
            }
        }

        return result;
    }

    // Recursively evaluate List/Array elements
    if (Array.isArray(data)) {
        return data.map(element => evaluateNestedExpressions(element, context));
    }

    // Return unchanged for unsupported types
    return data;
}

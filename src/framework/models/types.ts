import { to, ToType } from '../utils/object_util';
import { ScopeContext } from '../expr/scope_context';
import * as expr from '../expr/expression_util';

/**
 * Type alias for expression evaluator function.
 * 
 * @template T - The expected return type
 * @param expression - The expression to evaluate
 * @param options - Optional evaluation options
 * @returns The evaluated result or null
 */
export type ExpressionEvaluatorFn<T = any> = (
    expression: any,
    options?: {
        scopeContext?: ScopeContext;
        decoder?: (value: any) => T | null;
    }
) => T | null;

/**
 * Represents a value that can be either a direct value or an expression.
 * 
 * This class handles both old and new expression formats:
 * - Old format: "${expression}"
 * - New format: {"expr": "expression"}
 * 
 * @template T - The expected type after evaluation
 * 
 * @example
 * ```typescript
 * // Direct value
 * const direct = new ExprOr<string>("hello");
 * const result = direct.evaluate(context); // "hello"
 * 
 * // Old format expression
 * const oldExpr = new ExprOr<number>("${2 + 2}");
 * const result = oldExpr.evaluate(context); // 4
 * 
 * // New format expression
 * const newExpr = new ExprOr<boolean>({ expr: "value > 10" });
 * const result = newExpr.evaluate(context); // true/false
 * ```
 */
export class ExprOr<T = any> {
    /** The underlying value, which can be either a direct value or an expression */
    private readonly _value: any;

    /** Determines if the value is an expression */
    public readonly isExpr: boolean;

    constructor(value: any) {
        this._value = value;
        this.isExpr = ExprOr._isExpression(value);
    }

    /**
     * Helper method to determine if a value is an expression.
     * 
     * Checks for both formats:
     * - New format: {"expr": "expression"}
     * - Old format: "${expression}"
     */
    private static _isExpression(value: any): boolean {
        if (typeof value === 'object' && value !== null && 'expr' in value) {
            // New format: {"expr": "expression"}
            return true;
        }
        // Old format: "${expression}" - use existing logic
        return expr.hasExpression(value);
    }

    /**
     * Evaluates the value, returning a result of type T.
     * 
     * @param scopeContext - The context for expression evaluation
     * @param options - Optional decoder function
     * @returns The evaluated result or null
     * 
     * @example
     * ```typescript
     * const exprOr = new ExprOr<User>({ expr: "currentUser" });
     * const user = exprOr.evaluate(context, {
     *   decoder: (obj) => User.fromJson(obj)
     * });
     * ```
     */
    evaluate(
        scopeContext?: ScopeContext | null,
        options?: {
            type?: ToType;
            decoder?: (value: any) => T | null;
        }
    ): T | null {
        if (this.isExpr) {
            let expressionString: string;

            if (typeof this._value === 'object' && this._value !== null && 'expr' in this._value) {
                // New format: extract expression from map
                expressionString = this._value.expr as string;
            } else {
                // Old format: use the value directly as string
                expressionString = this._value as string;
            }

            // Evaluate the expression using the expression utility
            return expr.evaluateExpression<T>(expressionString, scopeContext, options?.type);
        } else {
            // If it's not an expression, cast it to T
            return options?.decoder?.(this._value) ?? to<T>(this._value, { type: options?.type });
        }
    }

    /**
     * Evaluates the value deeply, resolving nested expressions.
     *
     * This method performs a deep evaluation of the value, resolving any nested
     * expressions within complex data structures like maps and lists.
     *
     * @param scopeContext - The context for expression evaluation
     * @returns The deeply evaluated result
     * 
     * @example
     * ```typescript
     * const exprOr = new ExprOr({
     *   name: "${user.name}",
     *   age: { expr: "user.age" }
     * });
     * const result = exprOr.deepEvaluate(context);
     * // { name: "John", age: 30 }
     * ```
     */
    deepEvaluate(scopeContext?: ScopeContext | null): any {
        if (this.isExpr) {
            let valueToEvaluate: any;

            if (typeof this._value === 'object' && this._value !== null && 'expr' in this._value) {
                // New format: extract expression from map
                valueToEvaluate = this._value.expr;
            } else {
                // Old format: use the value directly
                valueToEvaluate = this._value;
            }

            return expr.evaluateNestedExpressions(valueToEvaluate, scopeContext);
        } else {
            return expr.evaluateNestedExpressions(this._value, scopeContext);
        }
    }

    /**
     * Creates an ExprOr instance from a JSON representation.
     * 
     * Handles both old and new expression formats.
     * 
     * @param json - The JSON value to parse
     * @returns An ExprOr instance or null if json is null
     * 
     * @example
     * ```typescript
     * // New format
     * const expr1 = ExprOr.fromJson<number>({ expr: "2 + 2" });
     * 
     * // Old format
     * const expr2 = ExprOr.fromJson<string>("${user.name}");
     * 
     * // Direct value
     * const expr3 = ExprOr.fromJson<boolean>(true);
     * ```
     */
    static fromJson<T = any>(json: any): ExprOr<T> | null {
        if (json == null) return null;

        // Handle both old and new formats
        if (typeof json === 'object' && json !== null) {
            if ('expr' in json) {
                // New format: {"expr": "expression"}
                return new ExprOr<T>(json);
            } else {
                // Map without 'expr' key - treat as regular value
                return new ExprOr<T>(json);
            }
        }

        // Old format or primitive value
        return new ExprOr<T>(json);
    }

    /**
     * Converts the ExprOr instance to a JSON-compatible representation.
     * 
     * @returns The underlying value
     */
    toJson(): any {
        return this._value;
    }

    /**
     * String representation of the ExprOr instance.
     */
    toString(): string {
        return `ExprOr(${JSON.stringify(this._value)})`;
    }
}

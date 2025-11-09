import { Logger } from '../../utils/logger';

/**
 * Provides a safe way to apply a function to a nullable value.
 * 
 * This function allows for chaining operations on nullable types,
 * similar to Optional in Java or Option in Scala.
 * 
 * @param value - The nullable value to operate on
 * @param fn - The function to apply if the value is not null/undefined
 * @returns The result of fn if value is not null/undefined, otherwise returns null
 * 
 * @example
 * ```typescript
 * const result = maybe(someNullableValue, (v) => doSomething(v));
 * 
 * // Chaining
 * const final = maybe(
 *   maybe(data, d => d.user),
 *   user => user.name
 * );
 * ```
 */
export function maybe<T, R>(
    value: T | null | undefined,
    fn: (value: T) => R
): R | null {
    return value !== null && value !== undefined ? fn(value) : null;
}

/**
 * Provides a safe way to apply a function to two nullable values.
 * 
 * This function allows for combining two nullable values
 * and applying a function to them only if both are non-null.
 * 
 * @param value1 - The first nullable value
 * @param value2 - The second nullable value
 * @param fn - The function to apply if both values are not null/undefined
 * @returns The result of fn if both values are not null/undefined, otherwise returns null
 * 
 * @example
 * ```typescript
 * const result = maybe2(firstName, lastName, (first, last) => `${first} ${last}`);
 * 
 * const combined = maybe2(width, height, (w, h) => w * h);
 * ```
 */
export function maybe2<T, U, R>(
    value1: T | null | undefined,
    value2: U | null | undefined,
    fn: (value1: T, value2: U) => R
): R | null {
    return value1 !== null &&
        value1 !== undefined &&
        value2 !== null &&
        value2 !== undefined
        ? fn(value1, value2)
        : null;
}

/**
 * Attempts to cast a value to a specified type with a fallback.
 * 
 * This function provides type-safe casting with an optional fallback
 * function if the cast fails. Unlike as$(), this function is stricter
 * and requires either a successful validation or an orElse handler.
 * 
 * @param x - The value to cast
 * @param validator - Optional function to validate if x is of type T. If not provided, just checks for null/undefined.
 * @param orElse - Optional function to provide a default value if casting fails
 * @returns The cast value, or the result of orElse if provided
 * @throws TypeError if casting fails and no orElse is provided
 * 
 * @example
 * ```typescript
 * // With validator - throws if validation fails
 * const str = as(value, (v): v is string => typeof v === 'string');
 * 
 * // With fallback - never throws
 * const num = as(
 *   value,
 *   (v): v is number => typeof v === 'number',
 *   () => 0
 * );
 * 
 * // Without validator - just checks if value exists
 * const obj = as(data, TypeValidators.object); // Throws if not an object
 * ```
 */
export function as<T>(
    x: any,
    validator?: (value: any) => value is T,
    orElse?: () => T
): T {
    // If no validator provided, just check if value exists and return it
    if (!validator) {
        if (x !== null && x !== undefined) {
            return x as T;
        }
        if (orElse !== undefined) {
            return orElse();
        }
        throw new TypeError(`Cannot cast null/undefined value to specified type`);
    }

    // With validator, perform validation
    if (validator(x)) {
        return x;
    }

    // Validation failed
    if (orElse !== undefined) {
        return orElse();
    }

    // Log the failure in dev mode before throwing
    if (__DEV__) {
        Logger.warning(
            `Type validation failed for value: ${JSON.stringify(x)}`,
            'FunctionalUtil'
        );
    }

    throw new TypeError(`Cannot cast value to specified type`);
}

/**
 * Safely attempts to cast a value to a specified type, with graceful fallback.
 * 
 * This function differs significantly from TypeScript's type assertions:
 * - It returns `null` instead of throwing an exception if the cast fails.
 * - It logs a warning in development mode when casting fails (only if validator is provided).
 * 
 * Key differences from TypeScript's `as`:
 * 1. `as$(x, validator)` returns `null` if `x` is not of type `T`.
 * 2. `x as T` provides no runtime safety - it's a compile-time only assertion.
 * 
 * @param x - The value to cast
 * @param validator - Optional function to validate if x is of type T. If not provided, performs a simple null check.
 * @returns The cast value if successful, null if casting fails or x is null/undefined
 * 
 * @example
 * ```typescript
 * const someValue = 42;
 * const result1 = as$(someValue, (v): v is string => typeof v === 'string'); // Returns null
 * 
 * const jsonValue: any = { name: 'John' };
 * const result2 = as$(jsonValue, (v): v is { name: string } => 
 *   typeof v === 'object' && v !== null && typeof v.name === 'string'
 * ); // Returns the object
 * 
 * // Without validator - just checks if value exists
 * const result3 = as$<string>("hello"); // Returns "hello"
 * const result4 = as$<string>(null); // Returns null
 * ```
 * 
 * This function is particularly useful in scenarios where you want to
 * attempt a cast without the risk of runtime exceptions, such as when
 * working with dynamic data or when graceful degradation is preferred.
 */
export function as$<T>(
    x: any,
    validator?: (value: any) => value is T
): T | null {
    // If no validator provided, just check if value exists
    if (!validator) {
        return x !== null && x !== undefined ? (x as T) : null;
    }

    // With validator, perform validation
    if (validator(x)) {
        return x;
    }

    // Log casting failures in debug mode only when validator was provided
    if (__DEV__) {
        Logger.warning(
            `CastError when trying to cast ${JSON.stringify(x)} to specified type`,
            'FunctionalUtil'
        );
    }

    return null;
}

/**
 * Common type validators for use with as() and as$() functions.
 */
export const TypeValidators = {
    /**
     * Validates if a value is a string.
     */
    string: (value: any): value is string => typeof value === 'string',

    /**
     * Validates if a value is a number.
     */
    number: (value: any): value is number => typeof value === 'number',

    /**
     * Validates if a value is a boolean.
     */
    boolean: (value: any): value is boolean => typeof value === 'boolean',

    /**
     * Validates if a value is an array.
     */
    array: (value: any): value is any[] => Array.isArray(value),

    /**
     * Validates if a value is a plain object.
     */
    object: (value: any): value is Record<string, any> =>
        typeof value === 'object' && value !== null && !Array.isArray(value),

    /**
     * Validates if a value is a function.
     */
    function: (value: any): value is Function => typeof value === 'function',

    /**
     * Creates a validator for an array of a specific type.
     */
    arrayOf: <T>(
        itemValidator: (value: any) => value is T
    ): ((value: any) => value is T[]) => {
        return (value: any): value is T[] =>
            Array.isArray(value) && value.every(itemValidator);
    },

    /**
     * Creates a validator that checks if a value has specific properties.
     */
    hasProperties: <T extends Record<string, any>>(
        properties: { [K in keyof T]: (value: any) => value is T[K] }
    ): ((value: any) => value is T) => {
        return (value: any): value is T => {
            if (typeof value !== 'object' || value === null) {
                return false;
            }
            return Object.entries(properties).every(([key, validator]) =>
                validator(value[key])
            );
        };
    },
};

/**
 * Convenience functions using common type validators.
 */

/**
 * Safely cast to string.
 */
export function asString(x: any): string | null {
    return as$(x, TypeValidators.string);
}

/**
 * Safely cast to number.
 */
export function asNumber(x: any): number | null {
    return as$(x, TypeValidators.number);
}

/**
 * Safely cast to boolean.
 */
export function asBoolean(x: any): boolean | null {
    return as$(x, TypeValidators.boolean);
}

/**
 * Safely cast to array.
 */
export function asArray(x: any): any[] | null {
    return as$(x, TypeValidators.array);
}

/**
 * Safely cast to object.
 */
export function asObject(x: any): Record<string, any> | null {
    return as$(x, TypeValidators.object);
}

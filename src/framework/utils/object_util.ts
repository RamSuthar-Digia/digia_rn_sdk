import { Logger } from '../../utils/logger';
import { JsonLike } from './types';
import { as$ } from './functional_utils';
import { tryJsonDecode } from './json_util';
import AsyncController from '../../components/internals/async/async_controller';


export type ToType =
    | "string"
    | "int"
    | "double"
    | "number"
    | "num"
    | "boolean"
    | "object"
    | "array"
    | "asyncController";


/**
 * Number utility functions for type conversion.
 */
const NumUtil = {
    /**
     * Convert a value to integer.
     */
    toInt(value: any): number | null {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return Math.floor(value);
        if (typeof value === 'string') {
            const parsed = parseInt(value, 10);
            return isNaN(parsed) ? null : parsed;
        }
        if (typeof value === 'boolean') return value ? 1 : 0;
        return null;
    },

    /**
     * Convert a value to double/float.
     */
    toDouble(value: any): number | null {
        if (value === null || value === undefined) return null;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            return isNaN(parsed) ? null : parsed;
        }
        if (typeof value === 'boolean') return value ? 1 : 0;
        return null;
    },

    /**
     * Convert a value to num (number).
     */
    toNum(value: any): number | null {
        return this.toDouble(value);
    },

    /**
     * Convert a value to boolean.
     */
    toBool(value: any): boolean | null {
        if (value === null || value === undefined) return null;
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        if (typeof value === 'string') {
            const lower = value.toLowerCase().trim();
            if (lower === 'true' || lower === '1') return true;
            if (lower === 'false' || lower === '0') return false;
            return null;
        }
        return null;
    },
};

/**
 * Object utility functions for flexible type conversion.
 * 
 * Provides safe type conversion methods that mirror Dart's ObjectExt extension.
 * These utilities handle null values gracefully and provide fallback defaults.
 */

/**
 * Attempts to convert a value to a specified type.
 * 
 * This function provides flexible type conversion with built-in support for:
 * - String conversions using toString()
 * - Numeric conversions (int, double, num) using NumUtil
 * - Boolean conversions using NumUtil
 * - JsonLike (object) conversions with JSON parsing
 * - Array conversions with JSON parsing
 * 
 * @template R - The type to convert to
 * @param value - The value to convert
 * @param options - Conversion options
 * @param options.defaultValue - Default value if conversion fails
 * @param options.type - Type hint for runtime type checking (e.g., 'string', 'number', 'boolean', 'object', 'array')
 * @returns The converted value or the default value if conversion fails
 * 
 * @example
 * ```typescript
 * // String conversion
 * const str = to<string>(42); // "42"
 * 
 * // Number conversion
 * const num = to<number>("123", { type: 'number' }); // 123
 * 
 * // With default value
 * const value = to<number>("invalid", { defaultValue: 0, type: 'number' }); // 0
 * 
 * // Object conversion
 * const obj = to<JsonLike>('{"name":"John"}', { type: 'object' }); // { name: "John" }
 * 
 * // Array conversion
 * const arr = to<any[]>('[1,2,3]', { type: 'array' }); // [1, 2, 3]
 * ```
 */
export function to<R = any>(
    value: any,
    options?: {
        defaultValue?: R;
        type?: ToType;
    }
): R | null {
    const { defaultValue, type } = options || {};

    // If the value is null or undefined, return the default value
    if (value === null || value === undefined) {
        return defaultValue ?? null;
    }

    // Attempt type-specific conversions based on the type hint
    let converted: any = null;

    switch (type) {
        case 'string':
            converted = toString(value);
            break;

        case 'int':
            converted = NumUtil.toInt(value);
            break;

        case 'double':
        case 'number':
            converted = NumUtil.toDouble(value);
            break;

        case 'num':
            converted = NumUtil.toNum(value);
            break;

        case 'boolean':
            converted = NumUtil.toBool(value);
            break;

        case 'object':
            converted = toJsonLike(value);
            break;

        case 'array':
            converted = toList(value);
            break;
        case 'asyncController':
            if (value instanceof AsyncController) {
                converted = as$(value);
            }
            break;

        default:
            // If no type hint, try to infer from the value itself
            converted = value;
            break;
    }

    // If conversion succeeded, return it
    if (converted !== null && converted !== undefined) {
        return converted as R;
    }

    // Try safe cast as last resort (no validator needed for generic fallback)
    return (converted as R) ?? (defaultValue ?? null);
}

/**
 * Convert a value to string.
 * 
 * @param value - The value to convert
 * @returns String representation of the value
 */
export function toString(value: any): string {
    if (value === null || value === undefined) {
        return '';
    }
    return String(value);
}

/**
 * Helper function to convert a value to JsonLike (object).
 * 
 * @param value - The value to convert
 * @returns JsonLike object or null if conversion fails
 */
function toJsonLike(value: any): JsonLike | null {
    if (value === null || value === undefined) {
        return null;
    }

    // If already an object (and not an array)
    if (typeof value === 'object' && !Array.isArray(value)) {
        return value as JsonLike;
    }

    // Try to parse as JSON if it's a string
    if (typeof value === 'string') {
        const parsed = tryJsonDecode(value);
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed as JsonLike;
        }
    }

    return null;
}

/**
 * Helper function to convert a value to an array.
 * 
 * @param value - The value to convert
 * @returns Array or null if conversion fails
 */
function toList(value: any): any[] | null {
    if (value === null || value === undefined) {
        return null;
    }

    // If already an array
    if (Array.isArray(value)) {
        return value;
    }

    // Try to parse as JSON if it's a string
    if (typeof value === 'string') {
        const parsed = tryJsonDecode(value);
        if (Array.isArray(parsed)) {
            return parsed;
        }
    }

    return null;
}

/**
 * Safely attempt to cast a value to a specified type with graceful fallback to null.
 * 
 * This function differs from TypeScript's type assertions:
 * - Returns null instead of throwing if the cast fails
 * - Provides debug logging for failed casts in development mode
 * 
 * @template R - The type to cast to
 * @param value - The value to cast
 * @param validator - Optional type validator function
 * @returns The cast value or null if cast fails
 * 
 * @example
 * ```typescript
 * const someValue = 42;
 * const result = safeCast<string>(someValue); // Returns null, logs in dev mode
 * 
 * // With validator
 * const result2 = safeCast<string>(
 *   someValue,
 *   (v): v is string => typeof v === 'string'
 * ); // Returns null
 * ```
 */
export function safeCast<R>(
    value: any,
    validator?: (v: any) => v is R
): R | null {
    if (value === null || value === undefined) {
        return null;
    }

    // If validator is provided, use it
    if (validator) {
        if (validator(value)) {
            return value as R;
        }
    } else {
        // Without validator, just return the value
        // (TypeScript's structural typing will handle it at compile time)
        return value as R;
    }

    // Log the cast error in development mode
    if (process.env.NODE_ENV === 'development' && value !== null) {
        Logger.error(
            `CastError when trying to cast ${JSON.stringify(value)} to specified type`,
            'ObjectUtil',
            new TypeError('Type cast failed')
        );
    }

    return null;
}

/**
 * Object utility namespace for convenience.
 */
export namespace ObjectUtil {
    export const convert = to;
    export const cast = safeCast;
    export const toObject = toJsonLike;
    export const toArray = toList;
    export const asString = toString;
}

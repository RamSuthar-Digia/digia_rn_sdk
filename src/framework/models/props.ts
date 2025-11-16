import { valueFor } from '../utils/json_util';
import { NumUtil } from '../utils/num_util';
import { JsonLike } from '../utils/types';
import { as$ } from '../utils/functional_utils';

/**
 * Props class for accessing component properties with type-safe getters.
 * 
 * Provides convenient methods to access nested properties using dot notation
 * and automatic type conversion for common types (string, number, boolean).
 * 
 * @example
 * ```typescript
 * const props = new Props({
 *   user: {
 *     name: 'John',
 *     age: 30,
 *     active: true
 *   }
 * });
 * 
 * props.getString('user.name');   // 'John'
 * props.getInt('user.age');       // 30
 * props.getBool('user.active');   // true
 * ```
 */
export class Props {
    readonly value: JsonLike;

    constructor(value: JsonLike) {
        this.value = value;
    }

    /**
     * Get a value at the specified key path.
     * Supports dot notation for nested properties.
     * 
     * @param keyPath - The key path (e.g., 'user.name')
     * @returns The value at the key path, or undefined if not found
     */
    get(keyPath: string | null): any {
        if (keyPath == null) return null;
        return valueFor(this.value, keyPath);
    }

    /**
     * Get a string value at the specified key path.
     * 
     * @param keyPath - The key path
     * @returns The string value, or undefined if not found or not a string
     */
    getString(keyPath: string): string | null {
        return as$<string>(this.get(keyPath)) ?? null;
    }

    /**
     * Get an integer value at the specified key path.
     * Attempts to convert the value to an integer.
     * 
     * @param keyPath - The key path
     * @returns The integer value, or undefined if conversion fails
     */
    getInt(keyPath: string): number | undefined {
        return NumUtil.toInt(this.get(keyPath)) ?? undefined;
    }

    /**
     * Get a double/number value at the specified key path.
     * Attempts to convert the value to a number.
     * 
     * @param keyPath - The key path
     * @returns The number value, or undefined if conversion fails
     */
    getDouble(keyPath: string): number | undefined {
        return NumUtil.toDouble(this.get(keyPath)) ?? undefined;
    }

    /**
     * Get a boolean value at the specified key path.
     * Attempts to convert the value to a boolean.
     * 
     * @param keyPath - The key path
     * @returns The boolean value, or undefined if conversion fails
     */
    getBool(keyPath: string): boolean | undefined {
        return NumUtil.toBool(this.get(keyPath)) ?? undefined;
    }

    /**
     * Get a JSON object at the specified key path.
     * 
     * @param keyPath - The key path
     * @returns The JSON object, or undefined if not found or not an object
     */
    getMap(keyPath: string): JsonLike | undefined {
        return as$<JsonLike>(this.get(keyPath)) ?? undefined;
    }

    /**
     * Get an array at the specified key path.
     * 
     * @param keyPath - The key path
     * @returns The array, or undefined if not found or not an array
     */
    getList(keyPath: string): any[] | undefined {
        return as$<any[]>(this.get(keyPath)) ?? undefined;
    }

    /**
     * Get a Props instance for a nested object at the specified key path.
     * 
     * @param keyPath - The key path
     * @returns A new Props instance wrapping the nested object, or undefined if not found
     */
    toProps(keyPath: string): Props | undefined {
        const result = this.getMap(keyPath);
        if (result == null) return undefined;
        return new Props(result);
    }

    /**
     * Check if the props value is empty.
     */
    get isEmpty(): boolean {
        return Object.keys(this.value).length === 0;
    }

    /**
     * Check if the props value is not empty.
     */
    get isNotEmpty(): boolean {
        return Object.keys(this.value).length > 0;
    }

    /**
     * Create an empty Props instance.
     */
    static empty(): Props {
        return new Props({});
    }
}

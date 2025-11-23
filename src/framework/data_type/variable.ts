import { JsonLike } from '../utils';
import { DataType } from './data_type';


/**
 * Helper function to try multiple keys and return the first non-undefined value.
 * 
 * @param obj - The object to search
 * @param keys - Array of keys to try
 * @returns The first non-undefined value, or undefined
 */
function tryKeys<T>(obj: Record<string, any>, keys: string[]): T | undefined {
    for (const key of keys) {
        if (obj[key] !== undefined) {
            return obj[key] as T;
        }
    }
    return undefined;
}

/**
 * Options for creating a Variable.
 */
export interface VariableOptions {
    /** The variable name/identifier */
    name: string;

    /** The data type of the variable */
    type: DataType;

    /** Optional default value for the variable */
    defaultValue?: any;
}

/**
 * Represents a variable definition with type information.
 * 
 * Variables are used throughout the Digia UI framework to define
 * typed data that can be used in state management, page arguments,
 * component properties, and expressions.
 * 
 * @example
 * ```typescript
 * const userNameVar = new Variable({
 *   name: 'userName',
 *   type: DataType.String,
 *   defaultValue: 'Guest'
 * });
 * 
 * const countVar = new Variable({
 *   name: 'count',
 *   type: DataType.Number,
 *   defaultValue: 0
 * });
 * 
 * // From JSON
 * const varFromJson = Variable.fromJson({
 *   name: 'isActive',
 *   type: 'boolean',
 *   default: true
 * });
 * ```
 */
export class Variable {
    /** The data type of the variable */
    readonly type: DataType;

    /** The variable name/identifier */
    readonly name: string;

    /** Optional default value for the variable */
    readonly defaultValue?: any;

    /**
     * Creates a new Variable.
     * 
     * @param options - Variable configuration
     * @param options.name - The variable name
     * @param options.type - The data type
     * @param options.defaultValue - Optional default value
     */
    constructor(options: VariableOptions) {
        this.name = options.name;
        this.type = options.type;
        this.defaultValue = options.defaultValue;
    }

    /**
     * Create a Variable from JSON data.
     * 
     * Supports both 'default' and 'defaultValue' keys for the default value.
     * 
     * @param json - The JSON object to parse
     * @returns A new Variable instance, or null if parsing fails
     * 
     * @example
     * ```typescript
     * const variable = Variable.fromJson({
     *   name: 'price',
     *   type: 'number',
     *   default: 99.99
     * });
     * ```
     */
    static fromJson(json?: JsonLike | null): Variable | null {
        if (!json) return null;

        const type = DataType.fromString(json.type);
        const name = json.name as string | undefined;

        if (type === undefined || name === undefined) return null;

        return new Variable({
            name,
            type,
            defaultValue: tryKeys<any>(json, ['default', 'defaultValue']),
        });
    }

    /**
     * Convert the Variable to a JSON object.
     * 
     * @returns A plain JSON object representation
     * 
     * @example
     * ```typescript
     * const json = variable.toJson();
     * // { type: 'string', name: 'userName', default: 'Guest' }
     * ```
     */
    toJson(): Record<string, any> {
        return {
            type: DataType.getId(this.type),
            name: this.name,
            default: this.defaultValue,
        };
    }

    /**
     * Create a copy of this Variable with optional property overrides.
     * 
     * @param options - Properties to override
     * @param options.type - Override the data type
     * @param options.name - Override the name
     * @param options.defaultValue - Override the default value
     * @returns A new Variable instance with the specified changes
     * 
     * @example
     * ```typescript
     * const original = new Variable({ name: 'count', type: DataType.Number, defaultValue: 0 });
     * const modified = original.copyWith({ defaultValue: 10 });
     * ```
     */
    copyWith(options: {
        type?: DataType;
        name?: string;
        defaultValue?: any;
    }): Variable {
        return new Variable({
            type: options.type ?? this.type,
            name: options.name ?? this.name,
            defaultValue: options.defaultValue ?? this.defaultValue,
        });
    }
}

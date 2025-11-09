import type { JSFunctions } from '../core/function/js_functions';
import { Variable } from '../framework/data_type/variable';
import { VariableJsonConverter } from '../framework/data_type/variable_json_convertor';
import { as, as$, TypeValidators } from '../framework/utils/functional_utils';
import { APIModel } from '../network/api_request/api_request';

/**
 * Core configuration model for the Digia UI system.
 * 
 * DUIConfig represents the complete configuration loaded from the Digia Studio
 * backend, containing all the information needed to render pages, components,
 * and handle API interactions. This includes theme configuration, page definitions,
 * component definitions, API configurations, and environment settings.
 * 
 * The configuration is typically loaded during app initialization and used
 * throughout the application lifecycle to:
 * - Define UI structure and styling
 * - Configure API endpoints and authentication
 * - Manage environment variables and app state
 * - Handle routing and navigation
 * 
 * Key components:
 * - **Theme Configuration**: Colors, fonts, and styling tokens
 * - **Pages & Components**: UI definitions and structure
 * - **REST Configuration**: API endpoints and models
 * - **Environment Settings**: Variables and configuration per environment
 * - **App State**: Global state definitions and initial values
 * 
 * @example
 * ```typescript
 * const config = new DUIConfig(configData);
 * const primaryColor = config.getColorValue('primary');
 * const apiModel = config.getApiDataSource('userApi');
 * config.setEnvVariable('baseUrl', 'https://api.example.com');
 * ```
 */
export class DUIConfig {
    /** Theme configuration including colors and fonts */
    private readonly themeConfig: Record<string, any>;

    /** Map of all page definitions indexed by page ID */
    readonly pages: Record<string, any>;

    /** Map of all component definitions indexed by component ID (optional) */
    readonly components?: Record<string, any>;

    /** REST API configuration including endpoints and models */
    readonly restConfig: Record<string, any>;

    /** The initial route/page ID to display when the app starts */
    readonly initialRoute: string;

    /** Path to custom JavaScript functions file (optional) */
    readonly functionsFilePath?: string;

    /** Global app state definitions and initial values (optional) */
    readonly appState?: any[];

    /** Flag indicating if the configuration version was updated (optional) */
    readonly versionUpdated?: boolean;

    /** Configuration version number (optional) */
    readonly version?: number;

    /** Environment-specific variables and settings (optional) */
    environment?: Record<string, any>;

    /** JavaScript functions instance for custom logic (optional) */
    jsFunctions?: JSFunctions;

    /**
     * Creates a new DUIConfig instance from the provided configuration data.
     * 
     * The data parameter should be an object containing the complete configuration
     * structure as received from the Digia Studio backend. This constructor
     * parses and extracts all necessary configuration sections.
     * 
     * Required fields in data:
     * - `theme`: Theme configuration with colors and fonts
     * - `pages`: Page definitions
     * - `rest`: API configuration
     * - `appSettings.initialRoute`: Starting page ID
     * 
     * Optional fields:
     * - `components`: Component definitions
     * - `appState`: Global state definitions
     * - `version`: Configuration version
     * - `versionUpdated`: Version update flag
     * - `functionsFilePath`: Custom functions file path
     * - `environment`: Environment variables
     * 
     * @param data - The configuration data object
     */
    constructor(data: any) {
        console.log('DUIConfig initializing with data:', data);
        this.themeConfig = as(data?.theme, TypeValidators.object, () => ({}));
        this.pages = as(data?.pages, TypeValidators.object, () => ({}));
        this.components = as$(data?.components, TypeValidators.object) ?? undefined;
        this.restConfig = as(data?.rest, TypeValidators.object, () => ({}));
        this.initialRoute = as(
            data?.appSettings?.initialRoute,
            TypeValidators.string,
            () => ''
        );
        this.appState = as$(data?.appState, TypeValidators.array) ?? undefined;
        this.version = as$(data?.version, TypeValidators.number) ?? undefined;
        this.versionUpdated =
            as$(data?.versionUpdated, TypeValidators.boolean) ?? undefined;
        this.functionsFilePath =
            as$(data?.functionsFilePath, TypeValidators.string) ?? undefined;
        this.environment =
            as$(data?.environment, TypeValidators.object) ?? undefined;
    }

    /**
     * Internal getter for light theme colors.
     */
    private get colors(): Record<string, any> {
        return as(this.themeConfig?.colors?.light, TypeValidators.object, () => ({}));
    }

    /**
     * Gets the light theme color tokens as a map of color names to values.
     * 
     * @returns Map of color token names to color values
     */
    get colorTokens(): Record<string, any> {
        return as(this.themeConfig?.colors?.light, TypeValidators.object, () => ({}));
    }

    /**
     * Gets the dark theme color tokens as a map of color names to values.
     * 
     * @returns Map of color token names to color values
     */
    get darkColorTokens(): Record<string, any> {
        return as(this.themeConfig?.colors?.dark, TypeValidators.object, () => ({}));
    }

    /**
     * Gets the font tokens as a map of font names to font configurations.
     * 
     * @returns Map of font token names to font configurations
     */
    get fontTokens(): Record<string, any> {
        return as(this.themeConfig?.fonts, TypeValidators.object, () => ({}));
    }

    /**
     * Sets an environment variable value at runtime.
     * 
     * This method allows updating environment variables after configuration
     * loading, which is useful for dynamic configuration based on user
     * preferences or runtime conditions.
     * 
     * The method only updates variables that already exist in the configuration.
     * If the variable doesn't exist, the method returns without making changes.
     * 
     * @param varName - The name of the environment variable to update
     * @param value - The new value to set for the variable
     * 
     * @example
     * ```typescript
     * config.setEnvVariable('apiUrl', 'https://api.production.com');
     * ```
     */
    setEnvVariable(varName: string, value: any): void {
        const variables = this.getEnvironmentVariables();

        if (!variables[varName]) {
            return;
        }

        variables[varName] = variables[varName].copyWith({ defaultValue: value });

        if (this.environment) {
            const converter = new VariableJsonConverter();
            this.environment.variables = converter.toJson(variables);
        }
    }

    /**
     * Retrieves a color value by its token name.
     * 
     * This method looks up a color value from the light theme colors
     * using the provided token name. Returns null if the token doesn't exist.
     * 
     * @param colorToken - The name/key of the color token to retrieve
     * @returns The color value as a string (typically hex format) or null
     * 
     * @example
     * ```typescript
     * const primaryColor = config.getColorValue('primary');
     * // Returns something like '#FF5722'
     * ```
     */
    getColorValue(colorToken: string): string | null {
        return as$(this.colors?.[colorToken], TypeValidators.string);
    }

    /**
     * Gets the default HTTP headers for API requests.
     * 
     * These headers are applied to all API requests made through the
     * Digia UI system unless overridden by specific API configurations.
     * 
     * @returns A map of header names to values, or null if no default headers are configured
     * 
     * @example
     * ```typescript
     * const headers = config.getDefaultHeaders();
     * // Returns: { 'Authorization': 'Bearer token', 'Content-Type': 'application/json' }
     * ```
     */
    getDefaultHeaders(): Record<string, any> | null {
        return as$(this.restConfig?.defaultHeaders, TypeValidators.object);
    }

    /**
     * Gets all environment variables defined in the configuration.
     * 
     * Environment variables are used to store configuration values that
     * can vary between different environments (development, staging, production)
     * or be modified at runtime.
     * 
     * @returns A map of variable names to Variable objects containing
     *          type information, default values, and other metadata
     * 
     * @example
     * ```typescript
     * const envVars = config.getEnvironmentVariables();
     * const baseUrlVar = envVars['baseUrl'];
     * console.log(baseUrlVar?.defaultValue); // 'https://api.example.com'
     * ```
     */
    getEnvironmentVariables(): Record<string, Variable> {
        const converter = new VariableJsonConverter();
        const variablesData = as$(
            this.environment?.variables,
            TypeValidators.object
        );
        return converter.fromJson(variablesData);
    }

    /**
     * Retrieves an API model configuration by its identifier.
     * 
     * API models define the structure and configuration for making HTTP
     * requests to specific endpoints. This includes URL patterns, request
     * methods, authentication requirements, and response parsing.
     * 
     * @param id - The unique identifier of the API model to retrieve
     * @returns An APIModel instance configured for the specified endpoint
     * @throws Error if the API model with the given ID is not found
     * 
     * @example
     * ```typescript
     * const userApi = config.getApiDataSource('userApi');
     * // Use the API model to make requests
     * ```
     */
    getApiDataSource(id: string): APIModel {
        const resourceData = as(
            this.restConfig?.resources?.[id],
            TypeValidators.object
        );
        return APIModel.fromJson(resourceData);
    }
}

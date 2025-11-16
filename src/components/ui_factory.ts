import React from 'react';
import { DigiaUIManager } from '../init/digia_ui_manager';
import { DUIConfig } from '../config/model';
import { IconData, ImageProvider, UIResources } from './ui_resources';
import { DefaultVirtualWidgetRegistry, VirtualWidgetRegistry } from './virtual_widget_registry';
import { ConfigProvider, DUIConfigProvider } from './page/config_provider';
import { DUIPage, DUIPageProps, DUIPageController } from './page/page';
import { DUIComponent } from './component/component';
import { ComponentVirtualWidget } from './component/ComponentVirtualWidget';
import { DUIAppState } from '../config/app_state/global_state';
import { AppStateScopeContext } from '../config/app_state/app_state_scope_context';
import { ActionExecutor } from '../framework/actions/action_executor';
import { DefaultActionExecutor } from '../framework/actions/DefaultActionExecutor';
import { JsonLike } from '../framework/utils/types';
import { DUIFontFactory } from '../framework/font_factory';
import { ColorUtil } from '../framework/utils/color_util';
import { as$ } from '../framework/utils/functional_utils';
import { To } from '../framework/utils/type_convertors';
import { NumUtil } from '../framework/utils/num_util';
import { tryKeys } from '../framework/utils/json_util';
import { Image, TextStyle } from 'react-native';
import { createDUIPageRoute, DUIPageRoute } from './page/page_route';
import { presentBottomSheet } from '../framework/utils/navigation_util';
import { VirtualWidget } from './base/VirtualWidget';
import { convertToTextStyle } from '../framework/utils/textstyle_util';
import { StdLibFunctions } from '@digia/expr-rn';

/**
 * Central factory class for creating Digia UI widgets, pages, and components.
 *
 * DUIFactory is a singleton that serves as the main entry point for creating
 * UI elements from JSON configurations. It manages UI resources, widget registries,
 * and provides methods for creating various UI elements with optional customization.
 *
 * @example
 * ```typescript
 * // Initialize
 * DUIFactory.getInstance().initialize({
 *   fontFactory: myFontFactory
 * });
 *
 * // Create a page
 * const page = DUIFactory.getInstance().createPage('home', { userId: '123' });
 *
 * // Register custom widget
 * DUIFactory.getInstance().registerWidget(
 *   'custom/myWidget',
 *   (data, registry, parent) => new MyCustomWidget(...)
 * );
 * ```
 */
export class DUIFactory {
    private static _instance: DUIFactory;

    /** Page and component configuration provider */
    configProvider!: ConfigProvider;

    /** UI resources including icons, images, fonts, and colors */
    resources!: UIResources;

    /** Registry for managing virtual widget types and their builders */
    widgetRegistry!: DefaultVirtualWidgetRegistry;

    /** Registry for method bindings used in expressions */
    bindingRegistry: any; // TODO: Implement MethodBindingRegistry

    /** Execution context for the factory */
    actionExecutionContext: any; // TODO: Implement ActionExecutionContext

    /** Private constructor for singleton pattern */
    private constructor() { }

    /**
     * Returns the singleton instance of DUIFactory.
     */
    static getInstance(): DUIFactory {
        if (!DUIFactory._instance) {
            DUIFactory._instance = new DUIFactory();
        }
        return DUIFactory._instance;
    }

    /**
     * Initializes the singleton factory with all necessary configuration and resources.
     *
     * This method must be called before using any other factory methods. It sets up
     * the widget registry, configuration provider, and UI resources based on the
     * initialized DigiaUI instance and optional custom resources.
     *
     * @param options - Initialization options
     * @param options.pageConfigProvider - Custom configuration provider
     * @param options.icons - Custom icon mappings
     * @param options.images - Custom image provider mappings
     * @param options.fontFactory - Custom font factory for creating text styles
     * @throws Error if DigiaUIManager is not properly initialized
     */
    initialize(options?: {
        pageConfigProvider?: ConfigProvider;
        icons?: Record<string, IconData>;
        images?: Record<string, ImageProvider>;
        fontFactory?: DUIFontFactory | null;
    }): void {
        // Ensure DigiaUIManager is properly initialized
        const digiaUIInstance = DigiaUIManager.getInstance().safeInstance;
        if (!digiaUIInstance) {
            throw new Error(
                'DigiaUIManager is not initialized. Make sure to call DigiaUI.initialize() ' +
                'and await its completion before calling DUIFactory.getInstance().initialize().'
            );
        }

        // Initialize widget registry with component builder
        this.widgetRegistry = new DefaultVirtualWidgetRegistry({
            componentBuilder: (id, args) => {
                // Create the component element
                const componentElement = this.createComponent(id, args);

                // Wrap in ComponentVirtualWidget
                return componentElement;
            },
        });        // Initialize method binding registry for expression evaluation
        this.bindingRegistry = {}; // TODO: Implement MethodBindingRegistry

        // Initialize action execution context
        this.actionExecutionContext = {}; // TODO: Implement ActionExecutionContext

        // Set up configuration provider (use custom or default)
        this.configProvider =
            options?.pageConfigProvider ?? new DUIConfigProvider(digiaUIInstance.dslConfig);

        // Build UI resources from configuration and custom overrides
        const config = digiaUIInstance.dslConfig;

        this.resources = new UIResources({
            icons: options?.icons ? new Map(Object.entries(options.icons)) : undefined,
            images: options?.images ? new Map(Object.entries(options.images)) : undefined,
            // Convert font tokens from configuration to TextStyle objects
            textStyles: config.fontTokens
                ? new Map(
                    Object.entries(config.fontTokens)
                        .map(([key, value]) => [
                            key,
                            this.convertToTextStyle(value, options?.fontFactory ?? undefined),
                        ])
                        .filter(([_, v]) => v !== null) as [string, TextStyle][]
                )
                : undefined,
            fontFactory: options?.fontFactory ?? undefined,
            // Convert color tokens from configuration
            colors: config.colorTokens
                ? new Map(
                    Object.entries(config.colorTokens).map(([key, value]) => [
                        key,
                        ColorUtil.fromString(as$<string>(value)) ?? null,
                    ]).filter(([_, v]) => v !== null) as [string, string][]
                )
                : undefined,
            // Convert dark mode color tokens
            darkColors: config.darkColorTokens
                ? new Map(
                    Object.entries(config.
                        darkColorTokens).map(([key, value]) => [
                            key,
                            ColorUtil.fromString(as$<string>(value)) ?? null,
                        ]).filter(([_, v]) => v !== null) as [string, string][]
                )
                : undefined,
        });

    }

    /**
     * Helper to convert font token to TextStyle.
     */
    private convertToTextStyle(
        fontToken: any,
        fontFactory: DUIFontFactory | null | undefined
    ): TextStyle | null {
        return convertToTextStyle(fontToken, fontFactory);
    }

    /**
     * Sets a single environment variable value at runtime.
     *
     * @param varName - The name of the environment variable to update
     * @param value - The new value to set for the variable
     *
     * @example
     * ```typescript
     * DUIFactory.getInstance().setEnvironmentVariable('baseUrl', 'https://api.example.com');
     * ```
     */
    setEnvironmentVariable(varName: string, value: any): void {
        const digiaUIInstance = DigiaUIManager.getInstance().safeInstance;
        if (!digiaUIInstance) {
            throw new Error(
                'DigiaUIManager is not initialized. Make sure to call DigiaUI.initialize() ' +
                'and await its completion before calling setEnvironmentVariable().'
            );
        }
        digiaUIInstance.dslConfig.setEnvVariable(varName, value);
    }

    /**
     * Sets multiple environment variables at once.
     *
     * @param variables - A map of variable names to their new values
     *
     * @example
     * ```typescript
     * DUIFactory.getInstance().setEnvironmentVariables({
     *   'baseUrl': 'https://api.example.com',
     *   'userId': 12345,
     * });
     * ```
     */
    setEnvironmentVariables(variables: Record<string, any>): void {
        const digiaUIInstance = DigiaUIManager.getInstance().safeInstance;
        if (!digiaUIInstance) {
            throw new Error(
                'DigiaUIManager is not initialized.'
            );
        }
        for (const [key, value] of Object.entries(variables)) {
            digiaUIInstance.dslConfig.setEnvVariable(key, value);
        }
    }

    /**
     * Clears a single environment variable value at runtime.
     *
     * @param varName - The name of the environment variable to clear
     */
    clearEnvironmentVariable(varName: string): void {
        this.setEnvironmentVariable(varName, null);
    }

    /**
     * Clears multiple environment variables at once.
     *
     * @param varNames - A list of variable names to clear
     */
    clearEnvironmentVariables(varNames: string[]): void {
        for (const varName of varNames) {
            this.clearEnvironmentVariable(varName);
        }
    }

    /**
     * Destroys the factory and cleans up all resources.
     * 
     * This method should be called when the factory is no longer needed,
     * typically during app shutdown. It disposes of the widget registry
     * to free up resources.
     */
    destroy(): void {
        if (this.widgetRegistry && typeof (this.widgetRegistry as any).dispose === 'function') {
            (this.widgetRegistry as any).dispose();
        }
        // TODO: Dispose bindingRegistry when implemented
    }

    /**
     * Registers a new custom widget type with type-safe properties.
     *
     * This method allows you to extend Digia UI with custom widgets
     * that can be used in JSON configurations. The widget will be identified
     * by the provided type string and can receive typed properties.
     *
     * @param type - Unique identifier for the widget type (e.g., 'custom/myWidget')
     * @param fromJsonT - Function to deserialize JSON to typed properties
     * @param builder - Function that creates the VirtualWidget from properties
     *
     * @example
     * ```typescript
     * DUIFactory.getInstance().registerWidget<MapProps>(
     *   'custom/map',
     *   MapProps.fromJson,
     *   (props, childGroups) => new CustomMapWidget(props)
     * );
     * ```
     */
    registerWidgetTyped<T>(
        type: string,
        fromJsonT: (json: JsonLike) => T,
        builder: (
            props: T,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void {
        if (this.widgetRegistry && typeof (this.widgetRegistry as any).registerWidget === 'function') {
            (this.widgetRegistry as any).registerWidget(type, fromJsonT, builder);
        }
    }

    /**
     * Registers a new custom widget type that works directly with JSON properties.
     *
     * This is a simpler alternative to registerWidgetTyped when you don't need
     * type-safe properties and prefer to work directly with JSON-like objects.
     *
     * @param type - Unique identifier for the widget type
     * @param builder - Function that creates the VirtualWidget from JSON properties
     *
     * @example
     * ```typescript
     * DUIFactory.getInstance().registerJsonWidget(
     *   'custom/simpleWidget',
     *   (props, childGroups) => new SimpleWidget({ text: props['text'] })
     * );
     * ```
     */
    registerJsonWidget(
        type: string,
        builder: (
            props: JsonLike,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void {
        if (!this.widgetRegistry || typeof (this.widgetRegistry as any).registerJsonWidget !== 'function') {
            throw new Error('widgetRegistry is not initialized. Call DUIFactory.initialize() before registering widgets.');
        }

        (this.widgetRegistry as any).registerJsonWidget(type, builder);
    }

    /**
     * Registers a new custom widget type.
     *
     * @param type - Unique identifier for the widget type
     * @param builder - Function that creates the VirtualWidget
     *
     * @example
     * ```typescript
     * DUIFactory.getInstance().registerWidget(
     *   'custom/map',
     *   (data, registry, parent) => new CustomMapWidget({ data, parent })
     * );
     * ```
     */
    /**
     * Register a typed widget builder that deserializes props from JSON.
     * This mirrors the Dart signature:
     * registerWidget<T>(type, fromJsonT, builder)
     */
    registerWidget<T>(
        type: string,
        fromJsonT: (json: JsonLike) => T,
        builder: (
            props: T,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void {
        if (!this.widgetRegistry || typeof (this.widgetRegistry as any).registerWidget !== 'function') {
            throw new Error('widgetRegistry is not initialized. Call DUIFactory.initialize() before registering widgets.');
        }

        (this.widgetRegistry as any).registerWidget(type, fromJsonT, builder);
    }

    /**
     * Creates a page widget from a JSON configuration with optional resource overrides.
     *
     * Pages are full-screen UI definitions that typically represent app screens
     * with their own lifecycle, state management, and navigation capabilities.
     *
     * @param pageId - Unique identifier for the page configuration
     * @param pageArgs - Arguments to pass to the page (accessible via expressions)
     * @param options - Optional resource overrides and settings
     * @param options.overrideIcons - Custom icons to override defaults for this page
     * @param options.overrideImages - Custom images to override defaults for this page
     * @param options.overrideTextStyles - Custom text styles to override defaults for this page
     * @param options.overrideColorTokens - Custom colors to override defaults for this page
     * @param options.navigatorKey - Custom navigator key for page navigation
     * @param options.pageController - Custom page controller for advanced page management
     * @returns A fully configured React component
     *
     * @example
     * ```typescript
     * const page = DUIFactory.getInstance().createPage(
     *   'checkout',
     *   { cartId: '12345' },
     *   { overrideColorTokens: { primary: '#0000FF' } }
     * );
     * ```
     */
    createPage(
        pageId: string,
        pageArgs?: JsonLike | null,
        options?: {
            overrideIcons?: Record<string, any>;
            overrideImages?: Record<string, any>;
            overrideTextStyles?: Record<string, TextStyle>;
            overrideColorTokens?: Record<string, string | null>;
            navigatorKey?: any;
            pageController?: DUIPageController;
        }
    ): React.ReactElement {
        // Merge overriding resources with existing resources
        const mergedResources = new UIResources({
            icons: this.resources.icons
                ? new Map([...this.resources.icons, ...Object.entries(options?.overrideIcons ?? {})])
                : undefined,
            images: this.resources.images
                ? new Map([...this.resources.images, ...Object.entries(options?.overrideImages ?? {})])
                : undefined,
            textStyles: this.resources.textStyles
                ? new Map([...this.resources.textStyles, ...Object.entries(options?.overrideTextStyles ?? {})])
                : undefined,
            colors: this.resources.colors && options?.overrideColorTokens
                ? new Map(
                    [...this.resources.colors, ...Object.entries(options.overrideColorTokens)]
                        .filter(([_, v]) => v !== null) as [string, string][]
                )
                : this.resources.colors,
            darkColors: this.resources.darkColors,
            fontFactory: this.resources.fontFactory,
        });

        // Get page definition from configuration
        const pageDef = this.configProvider.getPageDefinition(pageId);

        // Get app state and create scope context
        const appState = DUIAppState.instance;
        const scope = new AppStateScopeContext({
            values: appState.values,
            variables: {
                // TODO: Add standard library functions
                ...StdLibFunctions.functions,
                ...DigiaUIManager.getInstance().jsVars,
            },
        });

        // Create action executor for this page
        const actionExecutor = new ActionExecutor({
            viewBuilder: (id: string, args?: JsonLike) => this._buildView(id, args),
            bindingRegistry: this.bindingRegistry,
        });

        // Wrap page with action executor provider
        return React.createElement(
            DefaultActionExecutor,
            {
                actionExecutor,
                children: React.createElement(DUIPage, {
                    pageId,
                    pageArgs,
                    resources: mergedResources,
                    navigatorKey: options?.navigatorKey,
                    pageDef,
                    registry: this.widgetRegistry,
                    apiModels: this.configProvider.getAllApiModels(),
                    controller: options?.pageController,
                    scope: scope as any,
                })
            }
        );
    }

    /**
     * Creates a Flutter Route for navigation to a specific page.
     *
     * This method wraps createPage in a DUIPageRoute for use with
     * React Navigation. The route can be used with navigation.navigate().
     *
     * @param pageId - Page identifier
     * @param pageArgs - Arguments to pass to the page
     * @param options - Optional resource overrides
     * @returns Route configuration object
     *
     * @example
     * ```typescript
     * const route = DUIFactory.getInstance().createPageRoute('profile', { userId: '123' });
     * navigation.navigate(route.name, route.params);
     * ```
     */
    createPageRoute(
        pageId: string,
        pageArgs?: JsonLike | null,
        options?: {
            overrideIcons?: Record<string, any>;
            overrideImages?: Record<string, any>;
            overrideTextStyles?: Record<string, TextStyle>;
            overrideColorTokens?: Record<string, string | null>;
            navigatorKey?: any;
            pageController?: DUIPageController;
        }
    ): DUIPageRoute {
        return createDUIPageRoute({
            pageId,
            params: {
                pageArgs,
                ...options,
            },
        });
    }

    /**
     * Creates the initial page of the application based on configuration.
     *
     * This method retrieves the initial route from the configuration provider
     * and creates the corresponding page widget. It's typically used as the
     * home page of the application.
     *
     * @param options - Optional resource overrides
     * @returns The initial page component
     *
     * @example
     * ```typescript
     * <NavigationContainer>
     *   {DUIFactory.getInstance().createInitialPage()}
     * </NavigationContainer>
     * ```
     */
    createInitialPage(options?: {
        overrideIcons?: Record<string, any>;
        overrideImages?: Record<string, any>;
        overrideTextStyles?: Record<string, TextStyle>;
        overrideColorTokens?: Record<string, string | null>;
    }): React.ReactElement {
        console.log('Creating initial page:', this.configProvider);
        return this.createPage(
            this.configProvider.getInitialRoute(),
            null,
            options
        );
    }

    /**
     * Internal method for building views (pages or components) based on ID.
     *
     * This method determines whether the given ID represents a page or component
     * and delegates to the appropriate creation method. It's used internally
     * by the action executor for view navigation.
     *
     * @param viewId - The view identifier
     * @param args - Arguments to pass to the view
     * @returns The created view component
     */
    private _buildView(
        viewId: string,
        args?: JsonLike
    ): React.ReactElement {
        if (this.configProvider.isPage(viewId)) {
            console.log('Building page view for ID:', viewId, args);
            return this.createPage(viewId, args);
        }
        console.log('Building component view for ID:', viewId, args);
        return this.createComponent(viewId, args) as React.ReactElement;
    }

    /**
     * Creates a reusable component widget from a JSON configuration.
     *
     * Components are smaller, reusable UI blocks that can be embedded within
     * pages or other components. They have their own state management and
     * can receive arguments for customization.
     *
     * @param componentId - Unique identifier for the component configuration
     * @param args - Arguments to pass to the component (accessible via expressions)
     * @param options - Optional resource overrides
     * @returns A fully configured component React element
     *
     * @example
     * ```typescript
     * const productCard = DUIFactory.getInstance().createComponent(
     *   'product_card',
     *   {
     *     title: 'iPhone 15',
     *     price: 999.99,
     *     imageUrl: 'https://...',
     *   }
     * );
     * ```
     */
    createComponent(
        componentId: string,
        args?: JsonLike | null,
        options?: {
            overrideIcons?: Record<string, any>;
            overrideImages?: Record<string, any>;
            overrideTextStyles?: Record<string, TextStyle>;
            overrideColorTokens?: Record<string, string | null>;
            navigatorKey?: any;
        }
    ): React.ReactElement {
        // Merge overriding resources with existing resources
        const mergedResources = new UIResources({
            icons: this.resources.icons
                ? new Map([...this.resources.icons, ...Object.entries(options?.overrideIcons ?? {})])
                : undefined,
            images: this.resources.images
                ? new Map([...this.resources.images, ...Object.entries(options?.overrideImages ?? {})])
                : undefined,
            textStyles: this.resources.textStyles
                ? new Map([...this.resources.textStyles, ...Object.entries(options?.overrideTextStyles ?? {})])
                : undefined,
            colors: this.resources.colors && options?.overrideColorTokens
                ? new Map(
                    [...this.resources.colors, ...Object.entries(options.overrideColorTokens)]
                        .filter(([_, v]) => v !== null) as [string, string][]
                )
                : this.resources.colors,
            darkColors: this.resources.darkColors,
            fontFactory: this.resources.fontFactory,
        });

        // Get component definition from configuration
        const componentDef = this.configProvider.getComponentDefinition(componentId);

        // Get app state and create scope context
        const appState = DUIAppState.instance;
        const scope = new AppStateScopeContext({
            values: appState.values,
            variables: {
                // TODO: Add standard library functions
                ...StdLibFunctions.functions,
                ...DigiaUIManager.getInstance().jsVars,
            },
        });

        // Wrap component with action executor provider
        const actionExecutor = new ActionExecutor({
            viewBuilder: (id: string, args?: JsonLike) => this._buildView(id, args),
            bindingRegistry: this.bindingRegistry,
        });

        return React.createElement(
            DefaultActionExecutor,
            {
                actionExecutor,
                children: React.createElement(DUIComponent, {
                    id: componentId,
                    args,
                    definition: componentDef,
                    registry: this.widgetRegistry,
                    resources: mergedResources,
                    scope: scope as any,
                    apiModels: this.configProvider.getAllApiModels(),
                    navigatorKey: options?.navigatorKey,
                })
            }
        );
    }

    /**
     * Shows a bottom sheet with a Digia UI view (page or component).
     *
     * @param viewId - ID of the view to display
     * @param args - Arguments to pass to the view
     * @param options - Bottom sheet configuration options
     * @returns Promise that resolves when the bottom sheet is dismissed
     *
     * @example
     * ```typescript
     * const result = await DUIFactory.getInstance().showBottomSheet(
     *   'filter_options',
     *   { category: 'electronics' },
     *   { backgroundColor: '#FFFFFF' }
     * );
     * ```
     */
    async showBottomSheet<T = any>(
        viewId: string,
        args?: JsonLike | null,
        options?: {
            scrollControlDisabledMaxHeightRatio?: number;
            backgroundColor?: string;
            barrierColor?: string;
            border?: { color?: string; width?: number };
            borderRadius?: number;
            iconBuilder?: React.ReactElement;
            useSafeArea?: boolean;
            navigatorKey?: any;
            navigation?: any;
        }
    ): Promise<T | null> {
        const view = this.configProvider.isPage(viewId)
            ? this.createPage(viewId, args)
            : null; // TODO: Create component when DUIComponent is implemented

        return presentBottomSheet<T>({
            content: view!,
            scrollControlDisabledMaxHeightRatio: options?.scrollControlDisabledMaxHeightRatio,
            backgroundColor: options?.backgroundColor,
            barrierColor: options?.barrierColor,
            border: options?.border,
            useSafeArea: options?.useSafeArea,
            borderRadius: options?.borderRadius,
            iconBuilder: options?.iconBuilder,
            navigation: options?.navigation,
        });
    }
}

/**
 * Convenience function to get the DUIFactory singleton instance.
 *
 * @returns The DUIFactory singleton
 *
 * @example
 * ```typescript
 * import { getDUIFactory } from '@digia/rn-sdk';
 *
 * const factory = getDUIFactory();
 * const page = factory.createPage('home');
 * ```
 */
export function getDUIFactory(): DUIFactory {
    return DUIFactory.getInstance();
}

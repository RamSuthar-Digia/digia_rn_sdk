import { VirtualWidget } from './base/VirtualWidget';
import { VWNodeData, VWData, VWStateData, VWComponentData } from '../framework/models/vw_data';
import { textBuilder, createChildGroups, buttonBuilder, navigationBarBuilder, containerBuilder, carouselBuilder, futureBuilder, conditionalBuilder, conditionalItemBuilder, stackBuilder } from './builders';
import { scaffoldBuilder, rowBuilder, columnBuilder, iconBuilder, imageBuilder } from './builders';
import { VirtualStateContainerWidget } from './base/VirtualStateContainerWidget';
import { VirtualBuilderWidget } from './base/VirtualBuilderWidget';
import { JsonLike } from '../framework/utils/types';
import React from 'react';

/**
 * Factory function type for creating virtual widgets from VWNodeData.
 */
export type VirtualWidgetBuilder = (
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) => VirtualWidget;

/**
 * Component builder function type.
 * Creates a widget from a component ID and arguments.
 */
export type ComponentBuilder = (
    componentId: string,
    args?: Record<string, any>
) => React.ReactElement | null;

/**
 * Registry interface for virtual widget types.
 * 
 * Defines the contract for widget registries that can create widgets from data
 * and register custom widget builders.
 */
export interface VirtualWidgetRegistry {
    /**
     * Create a virtual widget instance from VWData.
     * 
     * @param data - The widget data from JSON
     * @param parent - Optional parent widget
     * @returns The created VirtualWidget instance
     */
    createWidget(data: VWData, parent?: VirtualWidget): VirtualWidget;

    /**
     * Register a widget factory for a specific type with typed props.
     * 
     * @param type - The widget type string (e.g., 'text', 'button', 'container')
     * @param fromJsonT - Function to parse props from JSON
     * @param builder - Factory function to create the widget instance
     */
    registerWidget<T>(
        type: string,
        fromJsonT: (json: JsonLike) => T,
        builder: (
            props: T,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void;

    /**
     * Register a widget factory for a specific type with raw JSON props.
     * 
     * @param type - The widget type string
     * @param builder - Factory function that receives raw JSON props
     */
    registerJsonWidget(
        type: string,
        builder: (
            props: JsonLike,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void;

    /**
     * Clean up resources.
     */
    dispose(): void;
}

/**
 * Default implementation of VirtualWidgetRegistry.
 * 
 * Handles creation of widgets from VWNodeData, VWStateData, and VWComponentData.
 * Provides a builder pattern for registering custom widgets.
 * 
 * @example
 * ```typescript
 * const registry = new DefaultVirtualWidgetRegistry({
 *   componentBuilder: (id, args) => {
 *     // Create component from definition
 *     return myComponentFactory(id, args);
 *   }
 * });
 * 
 * // Register a custom widget
 * registry.registerWidget(
 *   'customText',
 *   CustomTextProps.fromJson,
 *   (props, childGroups) => new CustomTextWidget({ props })
 * );
 * ```
 */
export class DefaultVirtualWidgetRegistry implements VirtualWidgetRegistry {
    private componentBuilder: ComponentBuilder;

    private builders: Map<string, VirtualWidgetBuilder>;

    constructor(options: { componentBuilder: ComponentBuilder }) {
        this.componentBuilder = options.componentBuilder;
        this.builders = new Map<string, VirtualWidgetBuilder>([
            ['digia/text', textBuilder as VirtualWidgetBuilder],
            ['fw/scaffold', scaffoldBuilder as VirtualWidgetBuilder],
            ['digia/column', columnBuilder as VirtualWidgetBuilder],
            ['digia/row', rowBuilder as VirtualWidgetBuilder],
            ['digia/icon', iconBuilder as VirtualWidgetBuilder],
            ['digia/image', imageBuilder as VirtualWidgetBuilder],
            ['digia/button', buttonBuilder as VirtualWidgetBuilder],
            ['digia/navigationbar', navigationBarBuilder as VirtualWidgetBuilder],
            ['digia/futureBuilder', futureBuilder as VirtualWidgetBuilder],
            ['digia/stack', stackBuilder as VirtualWidgetBuilder],
            ['digia/container', containerBuilder as VirtualWidgetBuilder],
            [
                'digia/carousel', carouselBuilder as VirtualWidgetBuilder
            ],
            [
                'digia/conditionalBuilder', conditionalBuilder as VirtualWidgetBuilder
            ],
            [
                'digia/conditionalItem', conditionalItemBuilder as VirtualWidgetBuilder
            ]
        ]);
    }

    createWidget(data: VWData, parent?: VirtualWidget): VirtualWidget {
        if (data instanceof VWNodeData) {
            const type = data.type;
            const builder = this.builders.get(type);

            if (!builder) {
                throw new Error(
                    `Unknown widget type: ${data.type}. ` +
                    `Available types: ${Array.from(this.builders.keys()).join(', ')}`
                );
            }

            return builder(data, parent, this);
        } else if (data instanceof VWStateData) {
            // Create state container widget
            // First create children widgets from childGroups
            let child: VirtualWidget | null = null;
            if (data.childGroups && data.childGroups.size > 0) {
                // Get the first child from the first group (typically 'children' group)
                const firstGroup = Array.from(data.childGroups.values())[0];
                if (firstGroup && firstGroup.length > 0) {
                    child = this.createWidget(firstGroup[0], parent);
                }
            }

            return new VirtualStateContainerWidget({
                initStateDefs: data.initStateDefs,
                child,
                parent,
            });
        } else if (data instanceof VWComponentData) {
            // Create component using builder widget
            return new VirtualBuilderWidget(
                (payload) => {
                    // Evaluate args with scope context
                    const evaluatedArgs = data.args
                        ? Object.fromEntries(
                            Array.from(data.args.entries()).map(([k, v]) => [
                                k,
                                v?.evaluate(payload.context.scopeContext),
                            ])
                        )
                        : undefined;

                    // Build component
                    const component = this.componentBuilder(data.id, evaluatedArgs);
                    if (!component) {
                        throw new Error(`Component not found: ${data.id}`);
                    }

                    return component;
                },
                {
                    commonProps: data.commonProps,
                    parentProps: data.parentProps,
                    parent,
                    refName: data.refName,
                    extendHierarchy: false,
                }
            );
        }

        throw new Error(`Unknown VWData type: ${data.constructor.name}`);
    }

    registerWidget<T>(
        type: string,
        fromJsonT: (json: JsonLike) => T,
        builder: (
            props: T,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void {
        this.builders.set(type, (data, parent, registry) => {
            const props = fromJsonT(data.props.value);
            const childGroups = createChildGroups(data.childGroups, parent, this);
            return builder(props, childGroups);
        });
    }

    registerJsonWidget(
        type: string,
        builder: (
            props: JsonLike,
            childGroups?: Map<string, VirtualWidget[]>,
        ) => VirtualWidget
    ): void {
        this.builders.set(type, (data, parent, registry) => {
            const childGroups = createChildGroups(data.childGroups, parent, this);
            return builder(data.props.value, childGroups);
        });
    }

    dispose(): void {
        this.builders.clear();
    }
}

/**
 * Static registry for virtual widget types (deprecated, use DefaultVirtualWidgetRegistry).
 *
 * Maps widget type strings (from server) to factory functions that create
 * the appropriate VirtualWidget instances. Similar to Flutter's widget registry
 * but with a factory pattern for TypeScript.
 *
 *  Use DefaultVirtualWidgetRegistry for instance-based registries with proper lifecycle management.
 *
 * @example
 * ```typescript
 * // Register a custom widget
 * VirtualWidgetRegistry.register('customText', (data, parent, registry) => {
 *   return new CustomTextWidget({
 *     props: CustomTextProps.fromJson(data.props.value),
 *     commonProps: data.commonProps,
 *     parent,
 *     refName: data.refName
 *   });
 * });
 *
 * // Create widget from data
 * const nodeData = VWNodeData.fromJson(jsonData);
 * const widget = VirtualWidgetRegistry.create(nodeData);
 * ```
 */
// export class VirtualWidgetRegistry {
//     private static factories = new Map<string, VirtualWidgetBuilder>([
//         ['digia/text', textBuilder],
//         ['fw/scaffold', scaffoldBuilder],
//     ]);

//     /**
//      * Register a widget factory for a specific type.
//      * 
//      * @param type - The widget type string (e.g., 'text', 'button', 'container')
//      * @param factory - Factory function to create the widget instance
//      */
//     static register(type: string, factory: VirtualWidgetBuilder): void {
//         this.factories.set(type.toLowerCase(), factory);
//     }

//     /**
//      * Create a virtual widget instance from VWNodeData.
//      * 
//      * @param data - The widget node data from JSON
//      * @param parent - Optional parent widget
//      * @returns The created VirtualWidget instance
//      * @throws Error if the widget type is not registered
//      */
//     static create(data: VWNodeData, parent?: VirtualWidget): VirtualWidget {
//         const type = data.type.toLowerCase();
//         const factory = this.factories.get(type);

//         if (!factory) {
//             throw new Error(
//                 `Widget type '${data.type}' is not registered. ` +
//                 `Available types: ${Array.from(this.factories.keys()).join(', ')}`
//             );
//         }

//         // Pass parent, then undefined for registry (not used in static context)
//         return factory(data, parent, undefined as any);
//     }

//     /**
//      * Check if a widget type is registered.
//      * 
//      * @param type - The widget type string to check
//      * @returns true if the type is registered, false otherwise
//      */
//     static has(type: string): boolean {
//         return this.factories.has(type.toLowerCase());
//     }

//     /**
//      * Get all registered widget types.
//      * 
//      * @returns Array of registered widget type strings
//      */
//     static getTypes(): string[] {
//         return Array.from(this.factories.keys());
//     }

//     /**
//      * Unregister a widget type.
//      * 
//      * @param type - The widget type to remove
//      * @returns true if the type was removed, false if it wasn't registered
//      */
//     static unregister(type: string): boolean {
//         return this.factories.delete(type.toLowerCase());
//     }

//     /**
//      * Clear all registered widget factories.
//      */
//     static clear(): void {
//         this.factories.clear();
//     }
// }


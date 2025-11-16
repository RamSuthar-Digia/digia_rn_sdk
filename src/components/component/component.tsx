import React, { useEffect } from 'react';
import { View } from 'react-native';
import { UIResources } from '../ui_resources';
import { VirtualWidgetRegistry } from '../virtual_widget_registry';
import { ScopeContext } from '../../framework/expr/scope_context';
import { DefaultScopeContext } from '../../framework/expr/default_scope_context';
import { StateScopeContext } from '../state/state_scope_context';
import { StateContext } from '../state/state_context';
import { StatefulScopeWidget, StateType } from '../state/state_scope_widget';
import { DataTypeCreator } from '../../framework/data_type/data_type_creator';
import { RenderPayload } from '../../framework/render_payload';
import { ResourceProvider, useResourceProvider } from '../../framework/resource_provider';
import { useStateContext } from '../state/state_context_provider';
import { JsonLike } from '../../framework/utils/types';
import { APIModel } from '../../network/api_request/api_request';
import { DUIComponentDefinition } from '../../framework/models/component_definition';
import { useActionExecutor } from '../../framework';

/**
 * Props for DUIComponent component.
 */
export interface DUIComponentProps {
    /** Unique identifier for this component */
    id: string;

    /** Arguments passed to the component */
    args?: JsonLike | null;

    /** Component definition containing layout and state */
    definition: DUIComponentDefinition;

    /** Widget registry for creating virtual widgets */
    registry: VirtualWidgetRegistry;

    /** UI resources (colors, fonts, icons, etc.) */
    resources?: UIResources | null;

    /** Parent scope context for expression evaluation */
    scope?: ScopeContext | null;

    /** API model definitions */
    apiModels?: Record<string, APIModel>;

    /** React Navigation navigator reference */
    navigatorKey?: any;
}



/**
 * DUIComponent component - renders a server-driven component with state management.
 * 
 * DUIComponent is a reusable UI block that can be embedded within pages or other components.
 * It handles:
 * - Component argument resolution with defaults
 * - State initialization and management
 * - Resource provision (colors, fonts, icons, etc.)
 * - Expression context creation
 * 
 * @example
 * ```tsx
 * <DUIComponent
 *   id="product_card"
 *   args={{ title: 'iPhone', price: 999 }}
 *   definition={componentDefinition}
 *   registry={widgetRegistry}
 *   resources={uiResources}
 * />
 * ```
 */
export const DUIComponent: React.FC<DUIComponentProps> = ({
    id,
    args,
    definition,
    registry,
    resources,
    scope,
    apiModels,
    navigatorKey,
}) => {
    // Resolve component arguments with defaults
    const resolvedArgs = React.useMemo(() => {
        if (!definition.argDefs) {
            return args ?? {};
        }

        const resolved: Record<string, any> = {};
        for (const [key, variable] of Object.entries(definition.argDefs)) {
            resolved[key] = args?.[key] ?? (variable as any).defaultValue;
        }
        return resolved;
    }, [definition.argDefs, args]);

    // Resolve initial state with DataTypeCreator
    const resolvedState = React.useMemo(() => {
        if (!definition.initStateDefs) {
            return {};
        }

        const result: Record<string, any> = {};
        for (const [key, stateDef] of Object.entries(definition.initStateDefs)) {
            result[key] = DataTypeCreator.create(
                stateDef as any,
                new DefaultScopeContext({
                    variables: { ...resolvedArgs },
                    enclosing: scope ?? undefined,
                })
            );
        }
        return result;
    }, [definition.initStateDefs, resolvedArgs, scope]);

    // Generate unique state ID for this component instance
    const stateId = React.useMemo(() => generateRandomId(), []);

    return (
        <ResourceProvider
            icons={resources?.icons ? mapToRecord(resources.icons) : {}}
            images={resources?.images ? mapToRecord(resources.images) : {}}
            textStyles={resources?.textStyles ? mapToRecord(resources.textStyles) : {}}
            fontFactory={resources?.fontFactory ?? null}
            colors={resources?.colors ? mapToRecord(resources.colors) : {}}
            darkColors={resources?.darkColors ? mapToRecord(resources.darkColors) : {}}
            apiModels={apiModels ?? {}}
            navigatorKey={navigatorKey}
        >
            <StatefulScopeWidget
                stateId={stateId}
                namespace={id}
                initialState={resolvedState}
                stateType={StateType.Component}
                childBuilder={(stateContext) => (
                    <DUIComponentContent
                        id={id}
                        args={resolvedArgs}
                        definition={definition}
                        registry={registry}
                        scope={createExprContext(resolvedArgs, stateContext, scope)}
                    />
                )}
            />
        </ResourceProvider>
    );
};

/**
 * Helper function to create expression context for component.
 */
function createExprContext(
    params: Record<string, any> | null,
    stateContext: StateContext | null,
    enclosingScope?: ScopeContext | null
): ScopeContext {
    if (stateContext === null) {
        return new DefaultScopeContext({
            variables: { ...params },
            enclosing: enclosingScope ?? undefined,
        });
    }

    return new StateScopeContext({
        stateContext,
        variables: { ...params },
        enclosing: enclosingScope ?? undefined,
    });
}

/**
 * Props for DUIComponentContent component.
 */
interface DUIComponentContentProps {
    id: string;
    args: Record<string, any> | null;
    definition: DUIComponentDefinition;
    registry: VirtualWidgetRegistry;
    scope: ScopeContext;
}

/**
 * Internal component that manages component content rendering.
 */
const DUIComponentContent: React.FC<DUIComponentContentProps> = ({
    id,
    args,
    definition,
    registry,
    scope,
}) => {
    // Build component content
    const rootNode = definition.layout?.root;

    // Blank layout
    if (!rootNode) {
        return <View />;
    }

    const virtualWidget = registry.createWidget(rootNode, undefined);

    // Obtain resources, state context and action executor
    const resources = useResourceProvider();
    const executor = useActionExecutor();
    const stateContext = useStateContext();


    return virtualWidget.toWidget(
        new RenderPayload({
            context: {
                scopeContext: scope,
                resources: resources!,
                resourceProvider: resources!,
                stateContext: stateContext!,
                navigation: resources?.navigatorKey ?? undefined,
                executeActionFlow: executor ? executor.execute.bind(executor) : undefined,
            },
            currentEntityId: id,
            widgetHierarchy: [],
            actionExecutor: executor,
        })
    );
};

/**
 * Generate a random ID (similar to Flutter's IdHelper.randomId).
 */
function generateRandomId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Convert Map to Record for React Native compatibility.
 */
function mapToRecord<T>(map: Map<string, T>): Record<string, T> {
    const record: Record<string, T> = {};
    map.forEach((value, key) => {
        record[key] = value;
    });
    return record;
}

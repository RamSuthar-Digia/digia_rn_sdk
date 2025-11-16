import React, { useEffect, useRef, useCallback } from 'react';
import { BackHandler, View } from 'react-native';
import { DUIPageDefinition } from '../../framework/models/page_definition';
import { UIResources } from '../ui_resources';
import { VirtualWidgetRegistry } from '../virtual_widget_registry';
import { ScopeContext } from '../../framework/expr/scope_context';
import { DefaultScopeContext } from '../../framework/expr/default_scope_context';
import { StateScopeContext } from '../state/state_scope_context';
import { StateContext } from '../state/state_context';
import { StatefulScopeWidget, StateType } from '../state/state_scope_widget';
import { DataTypeCreator } from '../../framework/data_type/data_type_creator';
import { ActionFlow } from '../../framework/actions/base/action_flow';
import { RenderPayload } from '../../framework/render_payload';
import { ResourceContextValue, useResourceProvider } from '../../framework/resource_provider';
import { ResourceProvider } from '../../framework/resource_provider';
import { ActionExecutor } from '../../framework/actions/action_executor';
import { JsonLike } from '../../framework/utils/types';
import { useActionExecutor } from '../../framework';
import { useStateContext } from '../state/state_context_provider';

/**
 * Props for DUIPage component.
 */
export interface DUIPageProps {
    /** Unique identifier for this page */
    pageId: string;

    /** Arguments passed to the page */
    pageArgs?: JsonLike | null;

    /** UI resources (colors, fonts, icons, etc.) */
    resources?: UIResources | null;

    /** Page definition containing layout and state */
    pageDef: DUIPageDefinition;

    /** Widget registry for creating virtual widgets */
    registry: VirtualWidgetRegistry;

    /** Parent scope context for expression evaluation */
    scope?: ScopeContext | null;

    /** API model definitions */
    apiModels?: Record<string, any>;

    /** React Navigation navigator reference */
    navigatorKey?: any;

    /** Optional page controller for external control */
    controller?: DUIPageController | null;
}

/**
 * Page controller for external control of page state and lifecycle.
 */
export class DUIPageController {
    private _listeners: Set<() => void> = new Set();

    /** Notify listeners that the page should rebuild */
    notifyListeners(): void {
        this._listeners.forEach((listener) => listener());
    }

    /** Add a listener for rebuild notifications */
    addListener(listener: () => void): void {
        this._listeners.add(listener);
    }

    /** Remove a listener */
    removeListener(listener: () => void): void {
        this._listeners.delete(listener);
    }

    /** Remove all listeners */
    dispose(): void {
        this._listeners.clear();
    }
}

/**
 * DUIPage component - renders a server-driven page with state management.
 * 
 * DUIPage is the main component for rendering pages defined by the server.
 * It handles:
 * - Page argument resolution with defaults
 * - State initialization and management
 * - Resource provision (colors, fonts, icons, etc.)
 * - Action execution (onPageLoad, onBackPress)
 * - Expression context creation
 * 
 * @example
 * ```tsx
 * <DUIPage
 *   pageId="home"
 *   pageDef={pageDefinition}
 *   registry={widgetRegistry}
 *   resources={uiResources}
 *   apiModels={apiModels}
 * />
 * ```
 */
export const DUIPage: React.FC<DUIPageProps> = ({
    pageId,
    pageArgs,
    pageDef,
    registry,
    resources,
    scope,
    apiModels,
    navigatorKey,
    controller,
}) => {
    // Resolve page arguments with defaults
    const resolvedPageArgs = React.useMemo(() => {
        if (!pageDef.pageArgDefs) {
            return pageArgs ?? {};
        }

        const resolved: Record<string, any> = {};
        for (const [key, variable] of Object.entries(pageDef.pageArgDefs)) {
            resolved[key] = pageArgs?.[key] ?? variable.defaultValue;
        }
        return resolved;
    }, [pageDef.pageArgDefs, pageArgs]);

    // Resolve initial state with DataTypeCreator
    const resolvedState = React.useMemo(() => {
        if (!pageDef.initStateDefs) {
            return {};
        }

        // Create expression context for resolving initial state
        const exprContext = createExprContext(resolvedPageArgs, null, scope);

        return DataTypeCreator.createMany(pageDef.initStateDefs, exprContext);
    }, [pageDef.initStateDefs, resolvedPageArgs, scope]);

    // Generate unique state ID for this page instance
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
                namespace={pageId}
                initialState={resolvedState}
                stateType={StateType.Page}
                childBuilder={(stateContext) => (
                    <DUIPageContent
                        pageId={pageId}
                        args={resolvedPageArgs}
                        initialStateDef={pageDef.initStateDefs}
                        layout={pageDef.layout}
                        registry={registry}
                        scope={createExprContext(resolvedPageArgs, stateContext, scope)}
                        controller={controller}
                        onPageLoaded={pageDef.onPageLoad}
                        onBackPress={pageDef.onBackPress}
                    />
                )}
            />
        </ResourceProvider>
    );
};

/**
 * Helper function to create expression context for page.
 */
function createExprContext(
    pageParams: Record<string, any> | null,
    stateContext: StateContext | null,
    enclosingScope?: ScopeContext | null
): ScopeContext {
    const pageVariables = {
        // Backward compatibility
        pageParams: pageParams,
        // New convention - spread page params as individual variables
        ...(pageParams ?? {}),
    };

    if (stateContext === null) {
        return new DefaultScopeContext({
            variables: pageVariables,
            enclosing: enclosingScope ?? undefined,
        });
    }

    return new StateScopeContext({
        stateContext,
        variables: pageVariables,
        enclosing: enclosingScope ?? undefined,
    });
}

/**
 * Props for DUIPageContent component.
 */
interface DUIPageContentProps {
    pageId: string;
    args: Record<string, any> | null;
    initialStateDef?: Record<string, any>;
    layout?: { root?: any };
    registry: VirtualWidgetRegistry;
    scope: ScopeContext;
    controller?: DUIPageController | null;
    onPageLoaded?: ActionFlow;
    onBackPress?: ActionFlow;
}

/**
 * Internal component that manages page content and lifecycle.
 */
const DUIPageContent: React.FC<DUIPageContentProps> = ({
    pageId,
    args,
    initialStateDef,
    layout,
    registry,
    scope,
    controller,
    onPageLoaded,
    onBackPress,
}) => {
    const [renderCount, setRenderCount] = React.useState(0);

    // Obtain resources (navigatorKey), action executor and state context via hooks
    const resources = useResourceProvider();
    const executor = useActionExecutor();
    const stateContext = useStateContext();


    // Handle controller rebuild notifications
    useEffect(() => {
        if (!controller) return;

        const handleRebuild = () => {
            setRenderCount((count) => count + 1);
        };

        controller.addListener(handleRebuild);

        return () => {
            controller.removeListener(handleRebuild);
        };
    }, [controller]);

    // Handle page loaded callback
    useEffect(() => {
        if (onPageLoaded) {
            // Execute on next frame (similar to Flutter's addPostFrameCallback)
            const timeoutId = setTimeout(() => {
                executeAction(onPageLoaded, scope, stateContext!, resources!, 'onPageLoad');
            }, 0);

            return () => clearTimeout(timeoutId);
        }
    }, [onPageLoaded, scope, stateContext, resources]);

    // Handle back button press
    useEffect(() => {
        if (!onBackPress) return;

        const handleBackPress = () => {
            executeAction(onBackPress, scope, stateContext!, resources!, 'onBackPress');
            return true; // Prevent default back behavior
        };

        const subscription = BackHandler.addEventListener(
            'hardwareBackPress',
            handleBackPress
        );

        return () => subscription.remove();
    }, [onBackPress, scope, stateContext, resources]);

    // Build page content
    const rootNode = layout?.root;

    // Blank layout
    if (!rootNode) {
        return null;
    }

    const virtualWidget = registry.createWidget(rootNode, undefined);

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
            currentEntityId: pageId,
            widgetHierarchy: [],
            actionExecutor: executor,
        })
    );
};

/**
 * Execute an action flow.
 */
async function executeAction(
    actionFlow: ActionFlow,
    scopeContext: ScopeContext,
    stateContext: StateContext,
    resources: ResourceContextValue,
    triggerType: string
): Promise<any> {
    const actionExecutor = new ActionExecutor({
        viewBuilder: undefined,
        bindingRegistry: undefined,
    });

    return actionExecutor.execute(
        { scopeContext: scopeContext, stateContext: stateContext, resources: resources },
        actionFlow,
        {
            id: generateRandomId(),
        }
    );
}

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

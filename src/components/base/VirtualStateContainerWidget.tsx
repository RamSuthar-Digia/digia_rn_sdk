import React from 'react';
import { VirtualWidget } from './VirtualWidget';
import { Variable } from '../../framework/data_type/variable';
import { DataTypeCreator } from '../../framework/data_type/data_type_creator';
import { RenderPayload } from '../../framework/render_payload';
import { StateContext } from '../state/state_context';
import { StateScopeContext } from '../state/state_scope_context';
import { StatefulScopeWidget } from '../state/state_scope_widget';

/**
 * A widget that creates a state container for its child widget.
 * 
 * VirtualStateContainerWidget initializes state variables from initStateDefs
 * and provides them to descendant widgets through a StateContext. The state
 * is scoped to this widget and its children, allowing for isolated state management.
 * 
 * State variables are initialized using DataTypeCreator which resolves Variable
 * definitions to their default values. The child widget is wrapped in a
 * StatefulScopeWidget to enable event-driven re-renders when state changes.
 * 
 * @example
 * ```typescript
 * const initStateDefs = {
 *   counter: new Variable({ name: 'counter', type: DataType.Number, defaultValue: 0 }),
 *   name: new Variable({ name: 'name', type: DataType.String, defaultValue: 'Guest' })
 * };
 * 
 * const stateWidget = new VirtualStateContainerWidget({
 *   initStateDefs,
 *   child: someChildWidget
 * });
 * 
 * // Child widgets can access state via scopeContext.getValue('counter')
 * ```
 */
export class VirtualStateContainerWidget extends VirtualWidget {
    /** Initial state variable definitions */
    readonly initStateDefs: Record<string, Variable>;

    /** The child widget to render */
    child: VirtualWidget | null;

    constructor(options: {
        /** Initial state variable definitions */
        initStateDefs: Record<string, Variable>;
        /** The child widget to render */
        child?: VirtualWidget | null;
        /** Parent widget reference */
        parent?: VirtualWidget;
    }) {
        super({ parent: options.parent });
        this.initStateDefs = options.initStateDefs;
        this.child = options.child ?? null;
    }

    /**
     * Render the state container widget.
     * 
     * Creates a StateContext with initial state values, wraps the child
     * in a StatefulScopeWidget for event-driven re-renders, and creates
     * a StateScopeContext for expression evaluation.
     * 
     * @param payload - The render payload containing scopeContext and other metadata
     * @returns A React element that provides state to its child
     */
    render(payload: RenderPayload): React.ReactElement | null {
        if (!this.child) {
            return null;
        }

        // Create initial state values from variable definitions
        const initialState = DataTypeCreator.createMany(
            this.initStateDefs,
            payload.context.scopeContext
        );

        return (
            <StateContainerRenderer
                initialState={initialState}
                child={this.child}
                payload={payload}
            />
        );
    }
}

/**
 * Internal component that manages the StateContext and renders the child.
 * 
 * Separated from VirtualStateContainerWidget to ensure StateContext is created
 * only once and persists across re-renders of the parent.
 */
const StateContainerRenderer: React.FC<{
    initialState: Record<string, any>;
    child: VirtualWidget;
    payload: RenderPayload;
}> = ({ initialState, child, payload }) => {
    // Create StateContext with initial state (only created once via React.useRef)
    const stateContextRef = React.useRef<StateContext | null>(null);
    if (stateContextRef.current === null) {
        stateContextRef.current = new StateContext(undefined, {
            initialState,
        });
    }

    const stateContext = stateContextRef.current;

    // Create StateScopeContext for expression evaluation
    const stateScopeContext = React.useMemo(() => {
        return new StateScopeContext({
            stateContext,
            variables: {},
            enclosing: payload.context.scopeContext,
        });
    }, [stateContext, payload.context.scopeContext]);

    // Create updated payload with new scope context
    const updatedPayload = React.useMemo(() => {
        return payload.copyWith({ scopeContext: stateScopeContext });
    }, [payload, stateScopeContext]);

    return (
        <StatefulScopeWidget
            namespace={stateContext.namespace}
            stateId={stateContext.stateId}
            initialState={initialState}
            childBuilder={(ctx) => child.render(updatedPayload)}
        />
    );
};

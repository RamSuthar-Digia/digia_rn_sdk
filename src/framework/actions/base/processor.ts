import { Action, ActionId } from './action';
import { ScopeContext } from '../../expr/scope_context';
import { ResourceContextValue } from '../../resource_provider';
import { StateContext } from '../../../components/state/state_context';
import { ActionExecutor } from '../action_executor';
import { ActionFlow } from './action_flow';

/**
 * Context for action execution in React Native.
 * 
 * In Flutter, this would be BuildContext. In React Native, we use a more
 * flexible context object that can contain navigation, state, and other
 * runtime information.
 */
export interface ActionExecutionContext {

    /** Backwards-compatible alias for resourceProvider */
    resources: ResourceContextValue;

    /** Optional StateContext for processors that need direct access */
    stateContext: StateContext;

    scopeContext: ScopeContext;

    /** Allow additional custom keys for extensibility */
    [key: string]: any;
}

// Backwards-compatible alias used throughout the codebase
export type Context = ActionExecutionContext;

/**
 * Abstract base class for action processors.
 * 
 * Each action type has a corresponding processor that knows how to execute it.
 * Processors handle the actual logic of performing actions like navigation,
 * API calls, state updates, etc.
 * 
 * @template T - The specific Action subclass this processor handles
 * 
 * @example
 * ```typescript
 * class NavigateToPageProcessor extends ActionProcessor<NavigateToPageAction> {
 *   async execute(
 *     context: ActionExecutionContext,
 *     action: NavigateToPageAction,
 *     scopeContext?: ScopeContext | null,
 *     options?: { id: string; parentActionId?: ActionId }
 *   ): Promise<any> {
 *     const { navigation } = context;
 *     navigation.navigate(action.pageName);
 *     return null;
 *   }
 * }
 * ```
 */
export abstract class ActionProcessor<T extends Action = Action> {
    /** Execution context set by the factory */
    executionContext?: Context;

    /**
     * Executes the action with the given context.
     * 
     * @param context - The execution context (navigation, state, etc.)
     * @param action - The action to execute
     * @param scopeContext - Optional scope context for expression evaluation
     * @param options - Execution options with required id and optional parentActionId
     * @returns A promise that resolves to the action result (or null)
     */
    abstract execute(
        context: Context,
        action: T,
        options?: {
            /** Required unique identifier for this action execution */
            id: string;
            /** Optional ID of the parent action (if this is a nested action) */
            parentActionId?: ActionId;
        }
    ): Promise<any>;
}

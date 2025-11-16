import { ScopeContext } from '../expr/scope_context';
import { JsonLike } from '../utils/types';
import { Context } from './base/processor';
import { ActionProcessorFactory, ActionProcessorDependencies } from './action_processor_factory';
import { Action, ActionId } from './base/action';
import { ActionFlow } from './base/action_flow';

/**
 * Executes action flows in response to user interactions.
 * 
 * The ActionExecutor is responsible for:
 * - Assigning unique IDs to actions
 * - Evaluating disable conditions
 * - Creating processors for each action
 * - Executing actions sequentially
 */
export class ActionExecutor {
    private readonly viewBuilder?: (id: string, args?: JsonLike) => React.ReactElement;
    private readonly bindingRegistry?: any;

    constructor(options: {
        viewBuilder?: (id: string, args?: JsonLike) => React.ReactElement;
        bindingRegistry?: any;
    }) {
        this.viewBuilder = options.viewBuilder;
        this.bindingRegistry = options.bindingRegistry;
    }

    /**
     * Executes an action flow within the given context.
     * 
     * @param context - The execution context (navigation, state, etc.)
     * @param actionFlow - The flow of actions to execute
     * @param scopeContext - Optional scope context for expression evaluation
     * @param options - Optional execution options
     * @returns A promise that resolves when all actions complete
     * 
     * @example
     * ```typescript
     * const executor = new ActionExecutor({
     *   viewBuilder: (id, args) => <MyComponent {...args} />
     * });
     * 
     * await executor.execute(
     *   { navigation, route },
     *   actionFlow,
     *   scopeContext,
     *   { id: 'flow-1', parentActionId: 'parent-1' }
     * );
     * ```
     */
    async execute(
        context: Context,
        actionFlow: ActionFlow,
        options?: {
            id?: string;
            parentActionId?: string;
        }
    ): Promise<any> {

        // Execute actions sequentially
        for (const action of actionFlow.actions) {
            const actionEventId = action.actionId;

            // Check if action is disabled
            const disabled = action.disableActionIf?.evaluate(context.scopeContext) ?? false;
            if (disabled) {
                continue;
            }

            // Create dependencies for processor factory
            const dependencies: ActionProcessorDependencies = {
                viewBuilder: this.viewBuilder,
                executeActionFlow: this.execute.bind(this),
                bindingRegistry: this.bindingRegistry,
            };

            // Create processor and execute
            const factory = new ActionProcessorFactory(dependencies);
            const processor = factory.getProcessor(action);

            await processor.execute(
                context,
                action,
                {
                    id: actionEventId!,
                    parentActionId: options?.parentActionId,
                }
            );
        }

        return null;
    }
}

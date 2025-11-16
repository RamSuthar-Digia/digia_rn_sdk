import { ScopeContext } from '../../expr/scope_context';
import { ActionProcessor, Context } from '../base/processor';
import { SetStateAction } from './action';
import { StateContext } from '../../../components/state/state_context';
import { StateContextHelper } from '../../../components/state/state_context_provider';

/**
 * Processor for SetStateAction.
 *
 * Locates the StateContext starting from the provided scopeContext (if any),
 * or attempts to find an ancestor context by name when action.stateContextName
 * is provided. Evaluates update expressions and applies them via
 * StateContext.setValues(..., { notify }).
 */
export class SetStateProcessor extends ActionProcessor<SetStateAction> {
    async execute(
        context: Context,
        action: SetStateAction,
        options?: {
            id: string;
            parentActionId?: string;
        }
    ): Promise<any> {
        // Try to obtain the current StateContext from the scopeContext if present.
        if (action.stateContextName == null && action.stateContextName == undefined) {
            throw new Error(
                'Action.setState called on a widget which is not wrapped in a StateContext'
            );
        }
        const stateContext =
            StateContextHelper.findStateByName(context.stateContext, action.stateContextName);


        if (!stateContext) {
            throw new Error(
                'Action.setState called on a widget which is not wrapped in a StateContext'
            );
        }

        const updates = action.updates ?? [];
        const rebuildFlag = action.rebuild?.evaluate(context.sc) ?? false;

        if (updates.length > 0) {
            const updatesMap: Record<string, any> = {};
            for (const u of updates) {
                const val = u.newValue ? u.newValue.evaluate(context.scopeContext) : undefined;
                updatesMap[u.stateName] = val;
            }

            stateContext.setValues(updatesMap, { notify: Boolean(rebuildFlag) });
        }

        return null;
    }
}

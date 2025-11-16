import { StateContextHelper, StateContextProvider } from '../../../components/state/state_context_provider';
import { ScopeContext } from '../../expr/scope_context';
import { Context, ActionProcessor } from '../base/processor';
import { RebuildStateAction } from './action';

export class RebuildStateProcessor extends ActionProcessor<RebuildStateAction> {
    async execute(
        context: Context, // React context or similar
        action: RebuildStateAction,
        options?: {
            id: string;
            parentActionId?: string | null;
        }
    ): Promise<any | null> {

        if (action.stateContextName == null) {
            const originState = StateContextHelper.getOriginState();
            originState?.triggerListeners();
        } else {
            const stateContext = StateContextHelper.findStateByName(
                context.stateContext,
                action.stateContextName
            );
            stateContext?.triggerListeners();
        }

        return null;
    }
}
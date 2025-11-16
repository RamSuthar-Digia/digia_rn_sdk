import { ScopeContext } from '../../expr/scope_context';
import { ActionProcessor, Context } from '../base/processor';
import { CallRestApiAction } from './action';
import { DefaultScopeContext } from '../../expr/default_scope_context';
import { executeApiAction } from '../../utils/network_util';
import { ExprOr } from '../../models/types';

/**
 * Processor for CallRestApiAction.
 *
 * Looks up the API model from a ResourceProvider (if available on the
 * execution context), evaluates provided args, calls the api handler and
 * optionally executes onSuccess/onError action flows.
 */
export class CallRestApiProcessor extends ActionProcessor<CallRestApiAction> {
    async execute(
        context: Context,
        action: CallRestApiAction,
        options?: { id: string; parentActionId?: string }
    ): Promise<any> {
        try {
            const dataSource = action.dataSource?.evaluate(context.scopeContext) ?? null;

            // Try to obtain ResourceProvider from the execution context if one
            // was attached by the page (executionContext.resourceProvider).
            const resourceProvider = (context && ((context as any).resourceProvider ?? (context as any).resources ?? null)) as any | null;

            const apiModel = resourceProvider?.apiModels?.[(dataSource && (dataSource as any)['id']) ?? undefined] ?? null;

            if (!apiModel) {
                return Promise.reject(new Error('No API Selected'));
            }

            const argsMap = (dataSource && (dataSource as any)['args'])
                ? Object.fromEntries(
                    Object.entries((dataSource as any)['args']).map(([k, v]) => [k, ExprOr.fromJson<any>(v)])
                )
                : undefined;

            const result = await executeApiAction(
                context.scopeContext ?? null,
                apiModel,
                argsMap as Record<string, ExprOr<any> | null> | undefined | null,
                {
                    successCondition: action.successCondition,
                    onSuccess: async (response: any) => {
                        if (action.onSuccess) {
                            const executeActionFlow = (context as any)?.executeActionFlow;
                            if (typeof executeActionFlow === 'function') {
                                await executeActionFlow(
                                    context,
                                    action.onSuccess,
                                    new DefaultScopeContext({ variables: { response }, enclosing: context.scopeContext ?? null }),
                                    { id: options?.id ?? '', parentActionId: options?.parentActionId }
                                );
                            }
                        }
                    },
                    onError: async (response: any) => {
                        if (action.onError) {
                            const executeActionFlow = (context as any)?.executeActionFlow;
                            if (typeof executeActionFlow === 'function') {
                                await executeActionFlow(
                                    context,
                                    action.onError,
                                    new DefaultScopeContext({ variables: { response }, enclosing: context.scopeContext ?? null }),
                                    { id: options?.id ?? '', parentActionId: options?.parentActionId }
                                );
                            }
                        }
                    },
                }
            );

            return result;
        } catch (e) {
            throw e;
        }
    }
}

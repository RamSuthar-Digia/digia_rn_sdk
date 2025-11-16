import { ScopeContext } from '../../expr/scope_context';
import { ActionProcessor, Context } from '../base/processor';
import { NavigateToPageAction } from './action';
import { NavigatorHelper } from '../../utils/navigation_util';
import { DefaultScopeContext } from '../../expr/default_scope_context';

/**
 * Processor for NavigateToPageAction.
 *
 * Evaluates the page data and performs navigation using NavigatorHelper.
 * If waitForResult is true and an onResult flow is present, attempts to
 * execute the onResult flow using a provided executeActionFlow function on
 * the execution context (if available).
 */
export class NavigateToPageProcessor extends ActionProcessor<NavigateToPageAction> {
    async execute(
        context: Context,
        action: NavigateToPageAction,
        options?: {
            id: string;
            parentActionId?: string;
        }
    ): Promise<any> {
        // Deep-evaluate the page data (may contain expressions)
        const pageData = action.pageData?.deepEvaluate(context.scopeContext);
        const pageId = (pageData && (pageData as any)['id']) as string | undefined;
        if (!pageId) {
            throw new Error('NavigateToPageAction: page id is required');
        }

        const evaluatedArgs = (pageData && (pageData as any)['args']) ?? undefined;

        const removePreviousScreensInStack = action.shouldRemovePreviousScreensInStack;
        const routeNameToRemoveUntil = action.routeNametoRemoveUntil?.evaluate(context.scopeContext) as string | null | undefined;

        try {
            const navigation = (context as any)?.navigation;

            // Prepare predicate if routeNameToRemoveUntil is provided
            const removePredicate = routeNameToRemoveUntil
                ? (route: any) => route?.name === routeNameToRemoveUntil
                : undefined;

            // Use NavigatorHelper to perform navigation
            await NavigatorHelper.push({
                screenName: pageId,
                params: evaluatedArgs,
                navigation,
                removeRoutesUntilPredicate: removePredicate,
            });

            // In React Navigation we don't get a pushed route result by default.
            // Keep result as undefined for compatibility with waitForResult semantics.
            const result = undefined;

            // If caller expects to wait for result and provided an onResult flow,
            // attempt to execute it via executeActionFlow if available on context.
            if (action.waitForResult && action.onResult) {
                const executeActionFlow = (context as any)?.executeActionFlow;
                if (typeof executeActionFlow === 'function') {
                    await executeActionFlow(
                        context,
                        action.onResult,
                        new DefaultScopeContext({ variables: { result }, enclosing: context.scopeContext ?? null }),
                        { id: options?.id ?? '', parentActionId: options?.parentActionId }
                    );
                }
            }

            return null;
        } catch (error) {
            throw error;
        }
    }
}

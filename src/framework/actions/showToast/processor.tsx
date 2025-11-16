import { ScopeContext } from '../../expr/scope_context';
import { ActionProcessor, Context } from '../base/processor';
import { ShowToastAction } from './action';
import { To } from '../../utils/type_convertors';
import { NumUtil } from '../../utils/num_util';
import { Alert } from 'react-native';
import { makeTextStyle } from '../../utils/textstyle_util';
import { ResourceContextValue } from '../../resource_provider';
import { ExprOr } from '../../models/types';

/**
 * Processor for ShowToastAction.
 *
 * Attempts to use `react-native-root-toast` at runtime if available. If the
 * library is not installed, falls back to `Alert.alert` so the message is still
 * visible during development.
 */
export class ShowToastProcessor extends ActionProcessor<ShowToastAction> {
    async execute(
        context: Context,
        action: ShowToastAction,
        options?: { id: string; parentActionId?: string }
    ): Promise<any> {
        const message = action.message?.evaluate(context.scopeContext) ?? '';
        const durationVal = action.duration?.evaluate(context.scopeContext) ?? 2;

        const style = action.style ?? {};

        // Convert duration to milliseconds expected by many toast libs
        const durationMs = NumUtil.toDouble(durationVal) ?? 2;

        // Background color — prefer explicit bgColor, fall back to backgroundColor
        const bgColor = style['bgColor'] ?? style['backgroundColor'] ?? undefined;

        // Build an eval helper compatible with makeTextStyle which expects a
        // function that can evaluate expression-like values. We attempt to use
        // ExprOr.fromJson to support both expression wrappers and literal values.
        const evalExpr = <T extends Object>(expr: any): T | null => {
            return ExprOr.fromJson<T>(expr)?.evaluate(context.scopeContext) ?? null;
        };

        // Try to obtain a ResourceProvider from the execution context if one
        // was provided by the caller (optional). Processors run outside React
        // components, so we can't call hooks; but the ActionContext may carry
        // a resourceProvider for processors to use.
        const resourceProvider = (context && ((context as any).resourceProvider ?? (context as any).resources ?? null)) as ResourceContextValue | null;

        const textStyle = makeTextStyle(
            (style['textStyle'] as any) ?? null,
            resourceProvider ?? null,
            evalExpr
        );

        const textColor = textStyle?.color ?? undefined;

        // Border radius, padding, container sizing
        const borderRadius = To.borderRadius(style['borderRadius'] ?? 12);
        const padding = To.padding(style['padding'] ?? '24,12,24,12');
        const margin = To.margin(style['margin'] ?? 0);
        const height = NumUtil.toDouble(style['height']) ?? undefined;
        const width = NumUtil.toDouble(style['width']) ?? undefined;

        // Try to use react-native-root-toast if available at runtime.
        try {
            // Require at runtime so the library is optional for consumers.
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
            const Toast = require('react-native-root-toast');

            const toastOptions: any = {
                duration: (Toast && Toast.durations && Toast.durations.SHORT) || durationMs * 1000,
                position: Toast.positions ? Toast.positions.BOTTOM : undefined,
                shadow: true,
                animation: true,
                hideOnPress: true,
                delay: 0,
                containerStyle: {
                    backgroundColor: bgColor ?? '#000',
                    borderRadius: (borderRadius as any)?.borderTopLeftRadius ?? 12,
                    ...margin,
                    ...padding,
                    height: height,
                    width: width,
                },
                textStyle: textStyle,
            };

            // Show the toast
            Toast.show(String(message), toastOptions);

            return null;
        } catch (err) {
            // If toast lib is not available, fallback to an Alert for visibility
            try {
                Alert.alert('', String(message));
                return null;
            } catch (e) {
                // As a last resort, log to console
                // eslint-disable-next-line no-console
                console.warn('ShowToastAction:', message);
                return null;
            }
        }
    }
}

import { ScopeContext } from './expr/scope_context';
import { ExprOr } from './models/types';
import { ActionFlow } from './actions/base/action_flow';
import { JsonLike } from './utils/types';
import * as expr from './expr/expression_util';
import { DUIFontFactory } from './font_factory';
import { ResourceContextValue } from './resource_provider';
import { getIconDetails } from '../components/icon_helper/icon_data_serialization';
import { defaultTextStyle, makeTextStyle } from './utils/textstyle_util';
import { TextStyle } from 'react-native';
import { APIModel } from '../network/api_request/api_request';
import { Action, Context } from './actions';
import { ActionExecutor } from './actions/action_executor';
import { ToType } from './utils';
import { To } from './utils/type_convertors';

/**
 * Payload containing all necessary context for rendering UI components.
 * 
 * RenderPayload provides:
 * - Expression evaluation utilities
 * - Access to resources (colors, fonts, API models)
 * - Action execution
 * - Widget hierarchy tracking
 * - Context chaining for nested components
 */
export class RenderPayload {
    /** The React Native component context */
    readonly context: Context;

    /** Hierarchy of widget/component names from root to current */
    readonly widgetHierarchy: string[];

    /** Current entity (page or component) ID */
    readonly currentEntityId?: string;
    /** Optional action executor injected at payload construction time */
    readonly actionExecutor?: ActionExecutor;

    constructor(options: {
        context: Context;
        widgetHierarchy?: string[];
        currentEntityId?: string;
        actionExecutor?: any;
    }) {
        this.context = options.context;
        this.widgetHierarchy = options.widgetHierarchy ?? [];
        this.currentEntityId = options.currentEntityId;
        this.actionExecutor = options.actionExecutor;
    }

    /**
     * Retrieves an icon from a map (not yet implemented).
     * 
     * @param map - Icon configuration map
     * @returns Icon data or null
     */
    getIcon(map?: JsonLike | null): any | null {
        if (map == null) return null;

        // TODO: Implement icon retrieval logic
        return getIconDetails(map as any);
    }

    /**
     * Retrieves a color from the ResourceProvider using a key.
     * 
     * @param key - Color key/name
     * @returns Color value or null
     */
    getColor(key: string): string | null {
        const rp = this._getResourceProvider();
        return rp?.getColor(key) ?? null;
    }

    /**
     * Retrieves an API model from the ResourceProvider using an ID.
     * 
     * @param id - API model ID
     * @returns API model or null
     */
    getApiModel(id: string): APIModel | null {
        const rp = this._getResourceProvider();
        return rp?.apiModels?.[id] ?? null;
    }

    /**
     * Retrieves the font factory from the ResourceProvider.
     * 
     * @returns Font factory instance or null
     */
    getFontFactory(): DUIFontFactory | null {
        const rp = this._getResourceProvider();
        return rp?.getFontFactory() ?? null;
    }

    /**
     * Creates a TextStyle from JSON configuration.
     * 
     * @param json - Text style configuration
     * @param fallback - Fallback style if parsing fails
     * @returns TextStyle object or null
     */
    getTextStyle(json?: JsonLike | null, fallback: TextStyle = defaultTextStyle): TextStyle | null {
        return makeTextStyle(
            json ?? null,
            this._getResourceProvider(),
            this.eval.bind(this),
            fallback
        );
    }

    private _getResourceProvider(): ResourceContextValue | null {
        const ctx = this.context;
        return (ctx?.resourceProvider ?? ctx?.resources ?? null) as ResourceContextValue | null;
    }

    /**
     * Executes an action flow with optional trigger context.
     * 
     * @param actionFlow - The action flow to execute
     * @param options - Execution options
     * @returns Promise resolving to action result
     * 
     * @example
     * ```typescript
     * await payload.executeAction(actionFlow, {
     *   scopeContext: customScope,
     *   triggerType: 'button_click'
     * });
     * ```
     */
    async executeAction(
        actionFlow?: ActionFlow | null,
        options?: {
            // scopeContext?: ScopeContext;
            triggerType?: string;
        }
    ): Promise<any> {
        if (actionFlow == null) {
            return null;
        }


        const executor = this.actionExecutor;

        if (!executor) {
            throw new Error(
                'RenderPayload.executeAction requires an ActionExecutor instance on the payload. ' +
                'Provide `actionExecutor` when creating RenderPayload to execute actions from non-hook contexts.'
            );
        }

        return executor.execute(
            this.context,
            actionFlow,
            //Need to think about this part carefully
            //   this._chainExprContext(options?.scopeContext),
            {
                id: this._generateId(),
            }
        );
    }

    /**
     * Creates a new RenderPayload with an extended widget hierarchy.
     * 
     * Used when a virtual widget renders its children to add itself
     * to the hierarchy chain.
     * 
     * @param widgetName - Name of the widget to add to hierarchy
     * @returns New RenderPayload with extended hierarchy
     */
    withExtendedHierarchy(widgetName: string): RenderPayload {
        return this.copyWith({
            widgetHierarchy: [...this.widgetHierarchy, widgetName],
        });
    }
    /**
     * Evaluates an ExprOr expression.
     * 
     * @param exprOr - The expression wrapper to evaluate
     * @param options - Evaluation options
     * @returns Evaluated value or null
     */
    evalExpr<T>(
        exprOr?: ExprOr<T> | null,
        options?: {
            type?: ToType;
            decoder?: (value: any) => T | null;
        }
    ): T | null {
        return exprOr?.evaluate(this.context.scopeContext, options) ?? null;
    }

    /**
     * Evaluates an expression with an optional chained expression context.
     * 
     * @param expression - The expression to evaluate
     * @param options - Evaluation options
     * @returns Evaluated value or null
     */
    eval<T>(
        expression: any,
        options?: {
            scopeContext?: ScopeContext;
            decoder?: (value: any) => T | null;
        }
    ): T | null {
        return expr.evaluate<T>(expression, {
            scopeContext: this._chainExprContext(options?.scopeContext),
            decoder: options?.decoder,
        });
    }

    /**
     * Evaluates an ExprOr color expression and retrieves the color.
     * 
     * @param expression - The color expression
     * @param options - Evaluation options
     * @returns Color value or null
     */
    evalColorExpr(
        expression?: ExprOr<string> | null,
        options?: {
            scopeContext?: ScopeContext;
            decoder?: (value: any) => string | null;
        }
    ): string | null {
        const colorString = expression?.evaluate(
            options?.scopeContext ?? this.context.scopeContext,
            { type: 'string', decoder: options?.decoder }
        );

        if (colorString == null) return null;

        return this.getColor(colorString);
    }

    /**
     * Evaluates a color expression and retrieves the color from ResourceProvider.
     * 
     * @param expression - The color expression
     * @param options - Evaluation options
     * @returns Color value or null
     */
    evalColor(
        expression: any,
        options?: {
            scopeContext?: ScopeContext;
            decoder?: (value: any) => string | null;
        }
    ): string | null {
        const colorString = this.eval<string>(expression, options);

        if (colorString == null) return null;

        return this.getColor(colorString);
    }

    /**
     * Chains the incoming expression context with the existing one.
     * 
     * @param incoming - Optional incoming scope context
     * @returns Chained scope context
     */
    private _chainExprContext(incoming?: ScopeContext): ScopeContext {
        return this._createChain(this.context.scopeContext, incoming);
    }

    /**
     * Creates the expression context chain.
     * 
     * @param enclosing - The enclosing scope context
     * @param incoming - Optional incoming scope context
     * @returns Chained scope context
     */
    private _createChain(
        enclosing: ScopeContext,
        incoming?: ScopeContext
    ): ScopeContext {
        if (incoming == null) return enclosing;

        // Add the enclosing context at the tail of the incoming context
        // This allows incoming context to override enclosing values
        incoming.addContextAtTail(enclosing);
        return incoming;
    }

    /**
     * Copies the payload with a new expression context, chaining it with the current one.
     * 
     * @param scopeContext - New scope context to chain
     * @param options - Optional context override
     * @returns New RenderPayload with chained context
     */
    copyWithChainedContext(
        scopeContext: ScopeContext,
    ): RenderPayload {
        return this.copyWith({
            scopeContext: this._chainExprContext(scopeContext),
        });
    }

    /**
     * Copies the payload with optional new fields.
     * 
     * @param options - Fields to override
     * @returns New RenderPayload instance
     */
    copyWith(options?: {
        scopeContext?: ScopeContext;
        widgetHierarchy?: string[];
        currentEntityId?: string;
        actionExecutor?: any;
    }): RenderPayload {
        // If a new scopeContext is provided, create a shallow-cloned context
        // with the updated scopeContext so downstream evaluation uses it.
        const newContext: Context = {
            ...this.context,
            scopeContext: options?.scopeContext ?? this.context.scopeContext,
        } as Context;

        return new RenderPayload({
            context: newContext,
            widgetHierarchy: options?.widgetHierarchy ?? this.widgetHierarchy,
            currentEntityId: options?.currentEntityId ?? this.currentEntityId,
            actionExecutor: options?.actionExecutor ?? this.actionExecutor,
        });
    }

    /**
     * Generates a random ID for action execution.
     * 
     * @returns Random ID string
     */
    private _generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
}

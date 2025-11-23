import { DataType } from './data_type';
import { Variable } from './variable';
import { ScopeContext } from '../expr/scope_context';
import { ExprOr } from '../models/types';
import { Subject } from 'rxjs';
import AsyncController from '../../components/internals/async/async_controller';
import TimerController from '../../components/internals/timer/timer_controller';
import AdaptedFile from './adapted_type/file';
import AdaptedPageController from './adapted_type/page_controller';
import AdaptedScrollController from './adapted_type/scroll_controller';
import AdaptedTextEditingController from './adapted_type/text_editing_controller';
import axios from 'axios';

/**
 * Utility for creating default values from Variable definitions.
 * 
 * This class resolves Variable definitions to their actual default values
 * based on the variable's type and defaultValue property. Used primarily
 * for initializing state containers and component instances.
 * 
 * @example
 * ```typescript
 * const variable = new Variable({
 *   name: 'counter',
 *   type: DataType.Number,
 *   defaultValue: 0
 * });
 * 
 * const value = DataTypeCreator.create(variable, scopeContext);
 * // value = 0
 * 
 * const listVar = new Variable({
 *   name: 'items',
 *   type: DataType.List
 * });
 * 
 * const listValue = DataTypeCreator.create(listVar, scopeContext);
 * // listValue = []
 * ```
 */
export class DataTypeCreator {
    /**
     * Create a default value from a Variable definition.
     * 
     * If the variable has a defaultValue, that value is returned.
     * Otherwise, returns a type-appropriate default value:
     * - String: ''
     * - Number: 0
     * - Boolean: false
     * - List: []
     * - Map: {}
     * - Any/Null: null
     * 
     * @param variable - The variable definition
     * @param scopeContext - Optional scope context for expression evaluation (currently unused, for future use)
     * @returns The default value for this variable
     * 
     * @example
     * ```typescript
     * // With default value
     * const nameVar = new Variable({ name: 'name', type: DataType.String, defaultValue: 'Guest' });
     * DataTypeCreator.create(nameVar); // 'Guest'
     * 
     * // Without default value
     * const countVar = new Variable({ name: 'count', type: DataType.Number });
     * DataTypeCreator.create(countVar); // 0
     * 
     * const flagVar = new Variable({ name: 'flag', type: DataType.Boolean });
     * DataTypeCreator.create(flagVar); // false
     * ```
     */
    static create(variable: Variable, scopeContext?: ScopeContext): any {
        // Helper wrappers for expression-aware values
        const expr = (v: any) => new ExprOr(v).evaluate(scopeContext) ?? null;
        const deep = (v: any) => new ExprOr(v).deepEvaluate(scopeContext);

        switch (variable.type) {
            case DataType.String:
                return expr(variable.defaultValue) ?? '';
            case DataType.Number:
                return expr(variable.defaultValue) ?? 0;
            case DataType.Boolean:
                return expr(variable.defaultValue) ?? false;
            case DataType.JsonArray:
                return deep(variable.defaultValue) ?? [];
            case DataType.Json:
                return deep(variable.defaultValue) ?? {};

            case DataType.ScrollController:
                return new AdaptedScrollController();

            case DataType.File:
                return new AdaptedFile();

            case DataType.StreamController:
                return new Subject<any>();

            case DataType.AsyncController:
                return new AsyncController<any>();

            case DataType.TextEditingController: {
                const value = (deep(variable.defaultValue) as any) ?? {};
                const text = new ExprOr(value['text']).evaluate(scopeContext) ?? undefined;
                return new AdaptedTextEditingController(text ?? undefined);
            }

            case DataType.TimerController: {
                const value = (deep(variable.defaultValue) as any) ?? {};
                const initialValue = new ExprOr(value['initialValue']).evaluate(scopeContext) ?? 0;
                const updateSeconds = new ExprOr(value['updateInterval']).evaluate(scopeContext) ?? 1;
                const duration = new ExprOr(value['duration']).evaluate(scopeContext) ?? 0;
                const isCountDown = value['timerType'] === 'countDown';
                return new TimerController({
                    initialValue,
                    updateInterval: (typeof updateSeconds === 'number' ? updateSeconds : 1) * 1000,
                    isCountDown,
                    duration,
                });
            }

            case DataType.ApiCancelToken: {
                // Use axios CancelToken source token
                try {
                    return axios.CancelToken.source().token;
                } catch (e) {
                    return null;
                }
            }

            case DataType.PageController: {
                const value = (deep(variable.defaultValue) as any) ?? {};
                const initialPage = new ExprOr(value['initialPage']).evaluate(scopeContext) ?? 0;
                const controller = new AdaptedPageController({ page: initialPage });
                return controller;
            }

            case DataType.StoryController:
                // Story controller adapter not implemented yet; return a simple object placeholder
                return {};

            default:
                return null;
        }
    }

    /**
     * Create default values for multiple variables.
     * 
     * @param variables - Map of variable name to Variable definition
     * @param scopeContext - Optional scope context for expression evaluation
     * @returns Record of variable name to default value
     * 
     * @example
     * ```typescript
     * const variables = {
     *   name: new Variable({ name: 'name', type: DataType.String }),
     *   age: new Variable({ name: 'age', type: DataType.Number, defaultValue: 18 }),
     *   active: new Variable({ name: 'active', type: DataType.Boolean })
     * };
     * 
     * const values = DataTypeCreator.createMany(variables);
     * // { name: '', age: 18, active: false }
     * ```
     */
    static createMany(
        variables: Record<string, Variable>,
        scopeContext?: ScopeContext
    ): Record<string, any> {
        const result: Record<string, any> = {};

        for (const [name, variable] of Object.entries(variables)) {
            result[name] = DataTypeCreator.create(variable, scopeContext);
        }

        return result;
    }
}

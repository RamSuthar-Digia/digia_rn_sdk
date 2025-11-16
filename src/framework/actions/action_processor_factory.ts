import { Context, ActionProcessor } from './base/processor';
import React from 'react';
import { Action, ActionType } from './base/action';
// import { SetStateProcessor } from './set_state/processor';
// import { NavigateToPageProcessor } from './navigate_to_page/processor';
import { NavigateBackProcessor } from './navigateback/processor';
import { ScopeContext } from '../expr';
import { NavigateToPageProcessor } from './navigateToPage/processor';
import { SetStateProcessor } from './setState/processor';
import { CallRestApiProcessor } from './callRestApi/processor';
import { OpenUrlProcessor } from './openUrl/processor';
import { RebuildStateProcessor } from './rebuildState/processor';
import { ShowToastProcessor } from './showToast/processor';

/**
 * Dependencies required by action processors.
 * 
 * These are shared dependencies that processors may need to execute actions,
 * such as navigation builders, action flow execution, etc.
 */
export interface ActionProcessorDependencies {
    /** Function to build views/components by ID */
    viewBuilder?: (id: string, args?: any) => React.ReactElement;

    /** Function to execute nested action flows */
    executeActionFlow?: (
        context: Context,
        actionFlow: any,
        options?: {
            id: string;
            parentActionId?: string;
        }
    ) => Promise<any>;

    /** Method binding registry for controlObject actions */
    bindingRegistry?: any;

    /** Add other shared dependencies here */
    [key: string]: any;
}

/**
 * Factory class for creating ActionProcessor instances.
 * 
 * Maintains processor dependencies and creates the appropriate processor
 * for each action type. Processors are created on-demand and can be reused.
 */
export class ActionProcessorFactory {
    private readonly dependencies: ActionProcessorDependencies;

    constructor(
        dependencies: ActionProcessorDependencies,
    ) {
        this.dependencies = dependencies;
    }

    /**
     * Gets the appropriate processor for the given action.
     * 
     * Creates a new processor instance configured with the factory's
     * dependencies and execution context.
     * 
     * @param action - The action to get a processor for
     * @returns The processor instance for the action type
     * @throws Error if action type is not yet implemented
     */
    getProcessor(action: Action): ActionProcessor {
        let processor: ActionProcessor;

        switch (action.actionType) {
            case ActionType.SetState:
                processor = new SetStateProcessor();
                break;

            case ActionType.NavigateToPage:
                processor = new NavigateToPageProcessor(
                );
                break;

            case ActionType.NavigateBack:
                processor = new NavigateBackProcessor();
                break;

            case ActionType.CallRestApi:
                processor = new CallRestApiProcessor();

                break;

            case ActionType.OpenUrl:
                processor = new OpenUrlProcessor();
                break;

            case ActionType.RebuildState:
                processor = new RebuildStateProcessor();
                break;

            case ActionType.ShowToast:
                processor = new ShowToastProcessor();
                break;


            default:
                throw new Error(
                    `Processor for action type ${action.actionType} not yet implemented`
                );
        }

        return processor as ActionProcessor;
    }
}

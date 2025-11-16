import { tryKeys } from '../../utils/json_util';
import { Action, ActionType } from '../base/action';

export class RebuildStateAction extends Action {
    readonly stateContextName?: string | null;

    constructor({
        disableActionIf,
        stateContextName,
    }: {
        disableActionIf?: any;
        stateContextName?: string | null;
    }) {
        super({ disableActionIf });
        this.stateContextName = stateContextName;
    }

    get actionType(): ActionType {
        return ActionType.RebuildState;
    }

    toJson(): { [key: string]: any } {
        return { 'stateContextName': this.stateContextName };
    }

    static fromJson(json: any): RebuildStateAction {
        return new RebuildStateAction({
            stateContextName: tryKeys<string | null>(json, ['stateContextName']),
        });
    }
}
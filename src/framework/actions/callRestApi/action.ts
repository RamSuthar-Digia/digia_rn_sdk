import { ExprOr } from '../../models/types';
import { JsonLike } from '../../utils';
import { Action, ActionType } from '../base/action';
import { ActionFlow } from '../base/action_flow';

export class CallRestApiAction extends Action {
    readonly dataSource?: ExprOr<JsonLike> | null;
    readonly successCondition?: ExprOr<boolean> | null;
    readonly onSuccess?: ActionFlow | null;
    readonly onError?: ActionFlow | null;

    constructor({
        dataSource,
        successCondition,
        onSuccess,
        onError,
    }: {
        dataSource?: ExprOr<JsonLike> | null;
        successCondition?: ExprOr<boolean> | null;
        onSuccess?: ActionFlow | null;
        onError?: ActionFlow | null;
    }) {
        super();
        this.dataSource = dataSource;
        this.successCondition = successCondition;
        this.onSuccess = onSuccess;
        this.onError = onError;
    }

    get actionType(): ActionType {
        return ActionType.CallRestApi;
    }

    static fromJson(json: { [key: string]: any } | null): CallRestApiAction {
        return new CallRestApiAction({
            dataSource: ExprOr.fromJson<JsonLike>(json?.['dataSource']),
            successCondition: ExprOr.fromJson<boolean>(json?.['successCondition']),
            onSuccess: ActionFlow.fromJson(json?.['onSuccess']),
            onError: ActionFlow.fromJson(json?.['onError']),
        });
    }

    toJson(): { [key: string]: any } {
        return {
            'type': this.actionType.toString(),
            'dataSource': this.dataSource?.toJson?.(),
            'successCondition': this.successCondition?.toJson?.(),
            'onSuccess': this.onSuccess?.toJson?.(),
            'onError': this.onError?.toJson?.(),
        };
    }
}
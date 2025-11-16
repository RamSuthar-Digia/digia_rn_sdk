import { ExprOr } from '../../models/types';
import { JsonLike } from '../../utils/types';
import { Action, ActionType } from '../base/action';

export class ShowToastAction extends Action {
    readonly message?: ExprOr<string> | null;
    readonly duration?: ExprOr<number> | null;
    readonly style?: JsonLike | undefined;

    constructor(options: {
        message?: ExprOr<string> | null;
        duration?: ExprOr<number> | null;
        style?: JsonLike | undefined;
        disableActionIf?: any;
    }) {
        super({ disableActionIf: options.disableActionIf });
        this.message = options.message ?? undefined;
        this.duration = options.duration ?? undefined;
        this.style = options.style ?? undefined;
    }

    get actionType(): ActionType {
        return ActionType.ShowToast;
    }

    toJson(): JsonLike {
        return {
            type: this.actionType,
            message: this.message?.toJson(),
            duration: this.duration?.toJson(),
            style: this.style,
        };
    }

    static fromJson(json: JsonLike): ShowToastAction {
        const message = ExprOr.fromJson<string>(json['message'] as any) ?? undefined;
        const duration = ExprOr.fromJson<number>(json['duration'] as any) ?? undefined;
        const style = (json['style'] as JsonLike) ?? undefined;
        return new ShowToastAction({ message, duration, style });
    }
}

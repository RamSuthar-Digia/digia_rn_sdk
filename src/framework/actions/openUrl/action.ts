import { ExprOr } from '../../models/types';
import { JsonLike } from '../../utils/types';
import { Action, ActionType } from '../base/action';

export class OpenUrlAction extends Action {
    readonly url?: ExprOr<string> | null;
    readonly launchMode?: ExprOr<string> | null;

    constructor(options: {
        url?: ExprOr<string> | null;
        launchMode?: ExprOr<string> | null;
        disableActionIf?: any;
    }) {
        super({ disableActionIf: options.disableActionIf });
        this.url = options.url ?? undefined;
        this.launchMode = options.launchMode ?? undefined;
    }

    get actionType(): ActionType {
        return ActionType.OpenUrl;
    }

    toJson(): JsonLike {
        return {
            type: this.actionType,
            url: this.url?.toJson(),
            launchMode: this.launchMode?.toJson(),
        };
    }

    static fromJson(json: JsonLike): OpenUrlAction {
        const url = ExprOr.fromJson<string>(json['url'] as any) ?? undefined;
        const launchMode = ExprOr.fromJson<string>(json['launchMode'] as any) ?? undefined;
        return new OpenUrlAction({ url, launchMode });
    }
}

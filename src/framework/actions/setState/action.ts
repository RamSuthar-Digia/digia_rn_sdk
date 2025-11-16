import { ExprOr } from '../../models/types';
import { JsonLike } from '../../utils/types';
import { Action, ActionType } from '../base/action';

export class StateUpdate {
    readonly stateName: string;
    readonly newValue?: ExprOr<any> | null;

    constructor(options: { stateName: string; newValue?: ExprOr<any> | null }) {
        this.stateName = options.stateName;
        this.newValue = options.newValue ?? undefined;
    }

    toJson(): JsonLike {
        return {
            stateName: this.stateName,
            newValue: this.newValue?.toJson(),
        };
    }

    static fromJson(json: any): StateUpdate {
        const stateName = String(json['stateName']);
        const newValue = ExprOr.fromJson<any>(json['newValue']);
        return new StateUpdate({ stateName, newValue });
    }
}

export class SetStateAction extends Action {
    readonly stateContextName?: string | null;
    readonly updates: StateUpdate[];
    readonly rebuild?: ExprOr<boolean> | null;

    constructor(options: {
        stateContextName?: string | null;
        updates?: StateUpdate[];
        rebuild?: ExprOr<boolean> | null;
        disableActionIf?: any;
    }) {
        super({ disableActionIf: options.disableActionIf });
        this.stateContextName = options.stateContextName ?? null;
        this.updates = options.updates ?? [];
        this.rebuild = options.rebuild ?? undefined;
    }

    get actionType(): ActionType {
        return ActionType.SetState;
    }

    toJson(): JsonLike {
        return {
            type: this.actionType,
            stateContextName: this.stateContextName,
            updates: this.updates.map((u) => u.toJson()),
            rebuild: this.rebuild?.toJson(),
        };
    }

    static fromJson(json: any): SetStateAction {
        const stateContextName = json['stateContextName'] != null ? String(json['stateContextName']) : undefined;
        const updatesArr = Array.isArray(json['updates']) ? json['updates'] as any[] : [];
        const updates = updatesArr.map((it) => StateUpdate.fromJson(it));
        const rebuild = ExprOr.fromJson<boolean>(json['rebuild']);
        return new SetStateAction({ stateContextName, updates, rebuild });
    }
}

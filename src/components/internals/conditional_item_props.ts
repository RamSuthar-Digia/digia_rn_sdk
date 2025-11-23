import { ExprOr, JsonLike } from "../../framework";

export class ConditionalItemProps {
    readonly condition?: ExprOr<boolean> | null;

    constructor({
        condition,
    }: {
        condition?: ExprOr<boolean> | null;
    }) {
        this.condition = condition;
    }

    static fromJson(json: JsonLike | null): ConditionalItemProps {
        return new ConditionalItemProps({
            condition: ExprOr.fromJson<boolean>(json?.['condition']),
        });
    }
}
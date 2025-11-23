/**
 * AdaptedScrollController - minimal adapter exposing `offset` for expressions.
 *
 * Mirrors the Dart `AdaptedScrollController` which extended Flutter's
 * `ScrollController` and implemented an expression instance accessor.
 */

import { ExprInstance } from "@digia/expr-rn";

export class AdaptedScrollController implements ExprInstance {
    offset: number | null = null;

    constructor(options?: { offset?: number } | null) {
        if (options && typeof options.offset === 'number') this.offset = options.offset;
    }

    setOffset(offset: number | null) {
        this.offset = offset;
    }

    // Minimal expression compatibility
    getField(name: string): any {
        switch (name) {
            case 'offset':
                return this.offset;
            default:
                return null;
        }
    }
}

export default AdaptedScrollController;

/**
 * AdaptedPageController - a lightweight adapter exposing page/offset for expressions.
 *
 * The original Dart `AdaptedPageController` extended Flutter's `PageController` and
 * implemented `ExprInstance` to expose `offset` and `page`. In this TypeScript
 * port we provide a minimal adapter that can wrap any host page controller or be
 * used standalone by SDK consumers.
 */

import { ExprInstance } from "@digia/expr-rn";

export class AdaptedPageController implements ExprInstance {
    // Current page index (may be fractional depending on scroll)
    page: number | null = null;
    // Current scroll offset
    offset: number | null = null;

    constructor(options?: { page?: number; offset?: number } | null) {
        if (options) {
            if (typeof options.page === 'number') this.page = options.page;
            if (typeof options.offset === 'number') this.offset = options.offset;
        }
    }

    setPage(page: number | null) {
        this.page = page;
    }

    setOffset(offset: number | null) {
        this.offset = offset;
    }

    // Minimal expression compatibility: expose named fields
    getField(name: string): any {
        switch (name) {
            case 'offset':
                return this.offset;
            case 'page':
                return this.page;
            default:
                return null;
        }
    }
}

export default AdaptedPageController;

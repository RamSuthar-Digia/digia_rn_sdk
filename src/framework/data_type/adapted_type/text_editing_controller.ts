/**
 * AdaptedTextEditingController - minimal adapter exposing `text` for expressions.
 *
 * Mirrors the Dart `AdaptedTextEditingController` which extended Flutter's
 * `TextEditingController` and implemented an expression instance accessor.
 */

export class AdaptedTextEditingController {
    private _text: string = '';

    constructor(initial?: { text?: string } | string) {
        if (typeof initial === 'string') this._text = initial;
        else if (initial && typeof initial.text === 'string') this._text = initial.text;
    }

    get text(): string {
        return this._text;
    }

    set text(v: string) {
        this._text = v ?? '';
    }

    setText(v: string) {
        this.text = v ?? '';
    }

    clear() {
        this._text = '';
    }

    // Minimal expression compatibility: expose named fields
    getField(name: string): any {
        switch (name) {
            case 'text':
                return this.text;
            default:
                return null;
        }
    }
}

export default AdaptedTextEditingController;

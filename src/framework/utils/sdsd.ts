export const BoxFit = {
    FILL: 'stretch',
    CONTAIN: 'contain',
    COVER: 'cover',
    FIT_WIDTH: 'stretch', // Note: No direct equivalent in RN
    FIT_HEIGHT: 'stretch', // Note: No direct equivalent in RN
    NONE: 'center', // Note: No direct equivalent in RN
    SCALE_DOWN: 'contain'
};


// Alignment class for React Native
class Alignment {

    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    // Predefined alignment constants
    static topLeft = new Alignment(-1.0, -1.0);
    static topCenter = new Alignment(0.0, -1.0);
    static topRight = new Alignment(1.0, -1.0);
    static centerLeft = new Alignment(-1.0, 0.0);
    static center = new Alignment(0.0, 0.0);
    static centerRight = new Alignment(1.0, 0.0);
    static bottomLeft = new Alignment(-1.0, 1.0);
    static bottomCenter = new Alignment(0.0, 1.0);
    static bottomRight = new Alignment(1.0, 1.0);

    // Convert to React Native style object
    toStyle() {
        return {
            transform: [
                { translateX: this.x * 50 + '%' },
                { translateY: this.y * 50 + '%' }
            ],
            position: 'absolute',
            left: '50%',
            top: '50%',
        };
    }

    // Convert to percentage values for flexbox alignment
    toFlexbox() {
        return {
            justifyContent: this._getJustifyContent(),
            alignItems: this._getAlignItems(),
        };
    }

    _getJustifyContent() {
        if (this.y === -1.0) return 'flex-start';
        if (this.y === 0.0) return 'center';
        if (this.y === 1.0) return 'flex-end';
        return 'center';
    }

    _getAlignItems() {
        if (this.x === -1.0) return 'flex-start';
        if (this.x === 0.0) return 'center';
        if (this.x === 1.0) return 'flex-end';
        return 'center';
    }

    // Mathematical operations
    add(other: Alignment): Alignment {
        return new Alignment(this.x + other.x, this.y + other.y);
    }

    subtract(other: Alignment): Alignment {
        return new Alignment(this.x - other.x, this.y - other.y);
    }

    multiply(scalar: number): Alignment {
        return new Alignment(this.x * scalar, this.y * scalar);
    }

    divide(scalar: number): Alignment {
        return new Alignment(this.x / scalar, this.y / scalar);
    }

    negate(): Alignment {
        return new Alignment(-this.x, -this.y);
    }

    // String representation
    toString() {
        const pairs = [
            [-1.0, -1.0, 'Alignment.topLeft'],
            [0.0, -1.0, 'Alignment.topCenter'],
            [1.0, -1.0, 'Alignment.topRight'],
            [-1.0, 0.0, 'Alignment.centerLeft'],
            [0.0, 0.0, 'Alignment.center'],
            [1.0, 0.0, 'Alignment.centerRight'],
            [-1.0, 1.0, 'Alignment.bottomLeft'],
            [0.0, 1.0, 'Alignment.bottomCenter'],
            [1.0, 1.0, 'Alignment.bottomRight'],
        ];

        for (const [x, y, name] of pairs) {
            if (this.x === x && this.y === y) {
                return name;
            }
        }

        return `Alignment(${this.x.toFixed(1)}, ${this.y.toFixed(1)})`;
    }

    // Linear interpolation
    static lerp(a: Alignment | null, b: Alignment | null, t: number): Alignment | null {
        if (!a && !b) return null;
        if (!a) return new Alignment(0 + (b?.x ?? 0 - 0) * t, 0 + (b?.y ?? 0 - 0) * t);
        if (!b) return new Alignment(a.x + (0 - a.x) * t, a.y + (0 - a.y) * t);

        return new Alignment(
            a.x + (b.x - a.x) * t,
            a.y + (b.y - a.y) * t
        );
    }
}

export default Alignment;


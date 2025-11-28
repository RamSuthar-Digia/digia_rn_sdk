export class PositionedProps {
    top?: number | null;
    bottom?: number | null;
    left?: number | null;
    right?: number | null;
    width?: number | null;
    height?: number | null;

    constructor(data?: {
        top?: number | null;
        bottom?: number | null;
        left?: number | null;
        right?: number | null;
        width?: number | null;
        height?: number | null;
    }) {
        this.top = data?.top ?? null;
        this.bottom = data?.bottom ?? null;
        this.left = data?.left ?? null;
        this.right = data?.right ?? null;
        this.width = data?.width ?? null;
        this.height = data?.height ?? null;
    }

    // -------------------------------------------------------
    // fromJson: supports string like "10,20,null,30"
    // or object like { top: 10, left: 20 }
    // -------------------------------------------------------
    static fromJson(data: any): PositionedProps {
        // ---------------------------------------------
        // CASE 1: string "left,top,right,bottom"
        // ---------------------------------------------
        if (typeof data === "string") {
            const parse = (v: string): number | null => {
                v = v.trim();
                if (!v || v === "-" || v === "null" || v === "undefined") return null;
                const n = Number(v);
                return isNaN(n) ? null : n;
            };

            const parts = data.split(",");

            return new PositionedProps({
                left: parts[0] !== undefined ? parse(parts[0]) : null,
                top: parts[1] !== undefined ? parse(parts[1]) : null,
                right: parts[2] !== undefined ? parse(parts[2]) : null,
                bottom: parts[3] !== undefined ? parse(parts[3]) : null,
            });
        }

        // ---------------------------------------------
        // CASE 2: JSON object
        // ---------------------------------------------
        if (typeof data === "object" && data !== null) {
            const num = (x: any): number | null => {
                if (x == null) return null;
                const n = Number(x);
                return isNaN(n) ? null : n;
            };

            return new PositionedProps({
                top: num(data.top),
                bottom: num(data.bottom),
                left: num(data.left),
                right: num(data.right),
                width: num(data.width),
                height: num(data.height),
            });
        }

        // ---------------------------------------------
        // DEFAULT EMPTY
        // ---------------------------------------------
        return new PositionedProps();
    }
}

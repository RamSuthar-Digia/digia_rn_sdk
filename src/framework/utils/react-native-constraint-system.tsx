import React from 'react';
import {
    View,
    ViewStyle,
    LayoutChangeEvent,
    StyleProp,
    Text,
    DimensionValue,
} from 'react-native';
import { Layout } from 'react-native-reanimated';
import { isViewBased } from './widget_util';

// --------------------
// Constraint types
// --------------------

// -----------------------------------------------------------
// BoxConstraints (Flutter-like)
// -----------------------------------------------------------
export type BoxConstraints = {
    minWidth: DimensionValue;
    maxWidth: DimensionValue;
    minHeight: DimensionValue;
    maxHeight: DimensionValue;
};

export const loose = (
    maxW: DimensionValue,
    maxH: DimensionValue
): BoxConstraints => ({
    minWidth: 0,
    maxWidth: maxW,
    minHeight: 0,
    maxHeight: maxH,
});


/**
 * Try to resolve a DimensionValue to a numeric value when possible.
 * - number -> returns number
 * - percent string (e.g. "50%") -> if parentMax provided, returns percent*parentMax, otherwise undefined
 * - 'auto' / null / other -> undefined
 */
function resolveDimensionToNumber(v: DimensionValue | undefined | null, parentMax?: number): number | undefined {
    if (v === undefined || v === null) return undefined;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') {
        const s = v.trim();
        if (s.endsWith('%')) {
            if (parentMax == null || !Number.isFinite(parentMax)) return undefined;
            const p = parseFloat(s);
            if (Number.isFinite(p)) return (p / 100) * parentMax;
            return undefined;
        }
        const n = parseFloat(s);
        if (Number.isFinite(n)) return n;
        return undefined;
    }
    return undefined;
}

/**
 * Dimension-aware min/max helpers.
 * Behavior:
 * - If child is a percent (and parentMax provided) treat child as smaller (prefer child for min).
 * - If child is numeric compare numerically with parent.
 * - Otherwise fall back to parent when parent is numeric, or undefined.
 */
export function dimensionMin(child: DimensionValue | undefined | null, parent: DimensionValue | undefined | null, parentMax?: number): number | undefined {
    const childResolved = resolveDimensionToNumber(child, parentMax);
    if (childResolved !== undefined) return childResolved; // percent-treated-as-less or numeric child

    const parentResolved = resolveDimensionToNumber(parent, parentMax);
    if (parentResolved !== undefined) return parentResolved;

    return undefined;
}

export function dimensionMax(child: DimensionValue | undefined | null, parent: DimensionValue | undefined | null, parentMax?: number): number | undefined {
    const childResolved = resolveDimensionToNumber(child, parentMax);
    const parentResolved = resolveDimensionToNumber(parent, parentMax);

    if (childResolved !== undefined && parentResolved !== undefined) return Math.max(childResolved, parentResolved);
    if (childResolved !== undefined) {
        // if child is percent it was resolved above; otherwise prefer child numeric
        return childResolved;
    }
    if (parentResolved !== undefined) return parentResolved;
    return undefined;
}

export function isWidthBounded(
    constraints: BoxConstraints | null | undefined
): boolean {
    if (!constraints) return false;
    const v = constraints.maxWidth;
    // Treat explicit null/undefined/'auto' as unbounded; everything else (including
    // percent strings) is considered a bounded declaration at this level.
    if (v === null || v === undefined || v === Infinity) return false;
    if (typeof v === 'string' && v.trim().toLowerCase() === 'auto') return false;
    return true;
}

export function isHeightBounded(
    constraints: BoxConstraints | null | undefined
): boolean {
    if (!constraints) return false;
    const v = constraints.maxHeight;
    if (v === null || v === undefined || v === Infinity) return false;
    if (typeof v === 'string' && v.trim().toLowerCase() === 'auto') return false;
    return true;
}

export function isUnbounded(
    constraints: BoxConstraints | null | undefined
): boolean {
    return !isWidthBounded(constraints) || !isHeightBounded(constraints);
}

export function clampToConstraints(
    value: number | undefined,
    dimension: "width" | "height",
    constraints?: BoxConstraints | null
): number | undefined {
    if (value == null) return undefined;
    if (!constraints) return value;

    const min = resolveDimensionToNumber(
        dimension === "width" ? constraints.minWidth : constraints.minHeight
    ) ?? 0;
    const max = resolveDimensionToNumber(
        dimension === "width" ? constraints.maxWidth : constraints.maxHeight
    ) ?? Infinity;

    if (!Number.isFinite(max)) return Math.max(min, value);
    return Math.max(min, Math.min(max, value));
}

// -----------------------------------------------------------
// Layout types
// -----------------------------------------------------------
export type LayoutRectangle = {
    x: number;
    y: number;
    width: number;
    height: number;
};

// -----------------------------------------------------------
// LayoutContext
// -----------------------------------------------------------
type LayoutContextValue = {
    layout: LayoutRectangle | null;
    constraints: BoxConstraints;
} | null;

const LayoutContext = React.createContext<LayoutContextValue>(null);
LayoutContext.displayName = "LayoutContext";

// -----------------------------------------------------------
// LayoutProvider
// -----------------------------------------------------------
export const LayoutProvider: React.FC<{
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
}> = ({ style, children }) => {
    const parentCtx = useConstraints();
    const parentConstraints =
        parentCtx?.constraints ?? loose(Infinity, Infinity);

    // -------------------------------------
    // Convert styling → constraints (Flutter-like)
    // -------------------------------------
    function resolveStyleConstraints(
        styleProp: StyleProp<ViewStyle>
    ): BoxConstraints {
        const flat = Array.isArray(styleProp)
            ? Object.assign({}, ...styleProp)
            : ((styleProp || {}) as ViewStyle);

        let c: BoxConstraints = {
            minWidth: 0,
            maxWidth: Infinity,
            minHeight: 0,
            maxHeight: Infinity,
        };

        const w = flat.width as DimensionValue;
        const h = flat.height as DimensionValue;

        // width
        if (w != null) {
            c.minWidth = w;
            c.maxWidth = w;
        } else {
            if (flat.minWidth != null) c.minWidth = flat.minWidth;
            if (flat.maxWidth != null) c.maxWidth = flat.maxWidth;
        }

        // height
        if (h != null) {
            c.minHeight = h;
            c.maxHeight = h;
        } else {
            if (flat.minHeight != null) c.minHeight = flat.minHeight;
            if (flat.maxHeight != null) c.maxHeight = flat.maxHeight;
        }

        // --- fix width % / number handling ---
        if (typeof parentConstraints.maxWidth === "string" && parentConstraints.maxWidth.endsWith("%")) {
            // keep % as-is
            c.maxWidth = '100%';
        } else if (typeof flat.maxWidth === "number") {
            // compare only when both are numbers
            c.maxWidth =
                typeof parentConstraints.maxWidth === "number" &&
                    parentConstraints.maxWidth < flat.maxWidth
                    ? flat.maxWidth
                    : parentConstraints.maxWidth;
        }

        // --- fix height % / number handling ---
        if (typeof parentConstraints.maxHeight === "string" && parentConstraints.maxHeight.endsWith("%")) {
            // keep % as-is
            c.maxHeight = parentConstraints.maxHeight;
        } else if (typeof flat.maxHeight === "number") {
            c.maxHeight =
                typeof parentConstraints.maxHeight === "number" &&
                    parentConstraints.maxHeight < flat.maxHeight
                    ? flat.maxHeight
                    : parentConstraints.maxHeight;
        }

        return c;
    }

    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        const l = e.nativeEvent.layout;

    }, []);

    // Memo constraints
    const constraints = React.useMemo(
        () => resolveStyleConstraints(style),
        [style, parentConstraints.maxWidth, parentConstraints.maxHeight]
    );

    var content = children;
    // if (isViewBased(content)) {
    //     content = React.cloneElement(content as React.ReactElement, { style });
    // } else {
    content = <View style={style}>{content}</View>;
    // }

    return content;

    return (

        <LayoutContext.Provider
            value={{ layout: null, constraints }}
        >
            {content}
        </LayoutContext.Provider>

    );
};

// -----------------------------------------------------------
// Hook: useConstraints
// -----------------------------------------------------------
export const useConstraints = () => {
    const ctx = React.useContext(LayoutContext);
    return {
        layout: { x: 0, y: 0, width: Infinity, height: Infinity },
        constraints: loose(null, null),
    } as LayoutContextValue;
    if (!ctx) {
        return {
            layout: { x: 0, y: 0, width: Infinity, height: Infinity },
            constraints: loose(Infinity, Infinity),
        } as LayoutContextValue;
    }

    return ctx;
};


// --------------------
// LayoutBuilder
// --------------------
// export const LayoutBuilder: React.FC<{
//     children: (ctx: { layout: LayoutRectangle; constraints: BoxConstraints }) => React.ReactNode;
//     style?: StyleProp<ViewStyle>;
// }> = ({ children, style }) => {
//     const [measured, setMeasured] = React.useState<LayoutRectangle | null>(null);

//     const onLayout = React.useCallback((e: LayoutChangeEvent) => {
//         const l = e.nativeEvent.layout;
//         setMeasured((prev) => (layoutEqual(prev, l) ? prev : l));
//     }, []);

//     if (!measured) {
//         return <View style={style} onLayout={onLayout} />;
//     }

//     const constraints = loose(measured.width, measured.height);

//     return (
//         <View style={style} onLayout={onLayout}>
//             {children({ layout: measured, constraints })}
//         </View>
//     );
// };

// // --------------------
// // Helper components
// // --------------------
// export const SizedBox: React.FC<{ width?: number; height?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode; }> = ({ width, height, style, children }) => {
//     const s: ViewStyle = {};
//     if (width !== undefined) s.width = width;
//     if (height !== undefined) s.height = height;
//     return (
//         <View style={[s, style]}>
//             {children}
//         </View>
//     );
// };

// export const Expanded: React.FC<{ flex?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode; }> = ({ flex = 1, style, children }) => {
//     return (
//         <View style={[{ flex }, style]}>
//             {children}
//         </View>
//     );
// };

export default {
    LayoutProvider,
    // LayoutBuilder,
    useConstraints,
    // SizedBox,
    // Expanded,
    // tightForSize,
    // loose,
};

import React from 'react';
import {
    View,
    ViewStyle,
    LayoutChangeEvent,
    LayoutRectangle,
    StyleProp,
    Text,
} from 'react-native';

// --------------------
// Constraint types
// --------------------
export type BoxConstraints = {
    minWidth: number;
    maxWidth: number;
    minHeight: number;
    maxHeight: number;
};

export const tightForSize = (w: number, h: number): BoxConstraints => ({
    minWidth: w,
    maxWidth: w,
    minHeight: h,
    maxHeight: h,
});

export const loose = (maxW: number, maxH: number): BoxConstraints => ({
    minWidth: 0,
    maxWidth: maxW,
    minHeight: 0,
    maxHeight: maxH,
});

// --------------------
// LayoutContext
// --------------------
type LayoutContextValue = {
    layout: LayoutRectangle; // {x,y,width,height}
    constraints: BoxConstraints;
} | null;

const LayoutContext = React.createContext<LayoutContextValue>(null);
LayoutContext.displayName = 'LayoutContext';

// --------------------
// Utility: shallow equal for layout
// --------------------
function layoutEqual(a: LayoutRectangle | null, b: LayoutRectangle | null) {
    if (a === b) return true;
    if (!a || !b) return false;
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
}

// --------------------
// LayoutProvider
// --------------------
export const LayoutProvider: React.FC<{
    style?: StyleProp<ViewStyle>;
    children?: React.ReactNode;
    constraintsFromLayout?: (layout: LayoutRectangle) => BoxConstraints;
}> = ({ style, children, constraintsFromLayout }) => {
    const [measured, setMeasured] = React.useState<LayoutRectangle | null>(null);

    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        const l = e.nativeEvent.layout;
        setMeasured((prev) => {
            if (layoutEqual(prev, l)) return prev;
            return l;
        });
    }, []);

    const value = React.useMemo<LayoutContextValue>(() => {
        if (!measured) return null;
        const constraints = constraintsFromLayout
            ? constraintsFromLayout(measured)
            : loose(measured.width, measured.height);
        return { layout: measured, constraints };
    }, [measured, constraintsFromLayout]);

    return (
        <View style={style} onLayout={onLayout}>
            <LayoutContext.Provider value={value}>
                {children}
            </LayoutContext.Provider>
        </View>
    );
};

// --------------------
// Hook: useConstraints
// --------------------
export const useConstraints = () => {
    const ctx = React.useContext(LayoutContext);
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
export const LayoutBuilder: React.FC<{
    children: (ctx: { layout: LayoutRectangle; constraints: BoxConstraints }) => React.ReactNode;
    style?: StyleProp<ViewStyle>;
}> = ({ children, style }) => {
    const [measured, setMeasured] = React.useState<LayoutRectangle | null>(null);

    const onLayout = React.useCallback((e: LayoutChangeEvent) => {
        const l = e.nativeEvent.layout;
        setMeasured((prev) => (layoutEqual(prev, l) ? prev : l));
    }, []);

    if (!measured) {
        return <View style={style} onLayout={onLayout} />;
    }

    const constraints = loose(measured.width, measured.height);

    return (
        <View style={style} onLayout={onLayout}>
            {children({ layout: measured, constraints })}
        </View>
    );
};

// --------------------
// Helper components
// --------------------
export const SizedBox: React.FC<{ width?: number; height?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode; }> = ({ width, height, style, children }) => {
    const s: ViewStyle = {};
    if (width !== undefined) s.width = width;
    if (height !== undefined) s.height = height;
    return (
        <View style={[s, style]}>
            {children}
        </View>
    );
};

export const Expanded: React.FC<{ flex?: number; style?: StyleProp<ViewStyle>; children?: React.ReactNode; }> = ({ flex = 1, style, children }) => {
    return (
        <View style={[{ flex }, style]}>
            {children}
        </View>
    );
};

export default {
    LayoutProvider,
    LayoutBuilder,
    useConstraints,
    SizedBox,
    Expanded,
    tightForSize,
    loose,
};

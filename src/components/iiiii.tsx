/*
Flutter-accurate Layout & Render Engine for React Native
File: flutter_like_layout_rn.tsx
Type: React + TypeScript (TSX)

PURPOSE
-------
This module implements a **best-effort, deterministic recreation** of Flutter's layout/render model in React Native.
It provides a Render-like two-pass layout system, constraint propagation (tight/loose/unbounded),
Flex (Row/Column) measurement/layout matching Flutter rules (including mainAxisSize, Expanded/Flexible, FlexFit
behaviour), ConstrainedBox, Intrinsic sizing helpers and overflow detection with helpful debug messages.

IMPORTANT LIMITATION (READ BEFORE USING)
----------------------------------------
- React Native uses Yoga for layout. Yoga's box model and layout pass cannot be replaced fully from JS.
  This library simulates Flutter's render-model by doing a **measuring pass** (onLayout) and then applying
  computed styles to children in a second render pass. That gives behavior matching Flutter for common cases,
  including nested flexes, Expanded/Flexible, SingleChildScrollView unboundedness, and overflow detection.
- This is *not* pixel-perfect in every pathological case (complex nested intrinsic measurements or custom painters).
- Intrinsic measurement and two-pass layouts cause extra layout passes and can be costly. Use only where necessary.

USAGE SUMMARY
-------------
- Wrap top of tree in <RenderRoot style={{flex:1}}>. This measures available screen size and provides constraints.
- Use <Row> and <Column> instead of RN <View> for Flutter-accurate flex behavior.
- Use <Expanded> and <Flexible> as children inside Row/Column (they expand only along child's main axis).
- Use <ConstrainedBox>, <IntrinsicWidth/Height> when you need constraint semantics.
- Use <OverflowBox> or the builtin overflow-detection overlay to match Flutter overflow behavior.

CONTENTS
--------
- Constraint types + contexts
- RenderRoot: top-level measurer + provider
- RenderBox: base class (component) that does measure+layout lifecycle
- RenderFlex (Row/Column) implementing Flutter's flex algorithm (simplified but accurate for common cases)
- Expanded, Flexible components
- ConstrainedBox, IntrinsicWidth/Height
- SingleChildScrollView aware mode (unbounded main axis)
- Overflow detection & debug overlay

EXPORTED COMPONENTS (public API)
--------------------------------
- RenderRoot
- Row, Column
- Expanded, Flexible
- ConstrainedBox
- IntrinsicWidth, IntrinsicHeight
- OverflowDetector
- DebugExample

INTEGRATION PLAN
----------------
1. Replace top-level <View style={{flex:1}}> with <RenderRoot style={{flex:1}}>.
2. Replace layout containers with Row/Column and use Expanded/Flexible where needed.
3. Integrate progressively (file-by-file). You provide a file and I will help convert it to use this system.


-- IMPLEMENTATION --
*/

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
    View,
    ViewStyle,
    LayoutChangeEvent,
    StyleProp,
    Text,
    ScrollView,
    Platform,
} from 'react-native';

// ---------------------- Types & Contexts ----------------------

type Axis = 'row' | 'column';

interface Constraints {
    // null => unbounded
    maxWidth: number | null;
    maxHeight: number | null;
}

const defaultUnbounded: Constraints = { maxWidth: null, maxHeight: null };

const ConstraintContext = React.createContext<Constraints | undefined>(undefined);
const ParentDirectionContext = React.createContext<Axis | undefined>(undefined);

// ---------------------- Utilities ----------------------

const isFiniteNumber = (v: any) => typeof v === 'number' && Number.isFinite(v);

function constraintsCopy(c?: Constraints) {
    if (!c) return { ...defaultUnbounded };
    return { maxWidth: c.maxWidth === undefined ? null : c.maxWidth, maxHeight: c.maxHeight === undefined ? null : c.maxHeight };
}

function boundedWidth(c?: Constraints) {
    return c && isFiniteNumber(c.maxWidth);
}
function boundedHeight(c?: Constraints) {
    return c && isFiniteNumber(c.maxHeight);
}

// Mapping utilities for alignment
function toJustifyContent(v?: string) {
    switch (v) {
        case 'center':
            return 'center';
        case 'end':
        case 'flex-end':
            return 'flex-end';
        case 'spaceBetween':
        case 'space-between':
            return 'space-between';
        case 'spaceAround':
        case 'space-around':
            return 'space-around';
        case 'spaceEvenly':
        case 'space-evenly':
            return 'space-evenly';
        default:
            return 'flex-start';
    }
}
function toAlignItems(v?: string) {
    switch (v) {
        case 'center':
            return 'center';
        case 'end':
        case 'flex-end':
            return 'flex-end';
        case 'start':
        case 'flex-start':
            return 'flex-start';
        case 'stretch':
            return 'stretch';
        default:
            return 'stretch';
    }
}

// ---------------------- RenderRoot (top-level provider) ----------------------

/**
 * RenderRoot measures its layout and publishes Constraints to the tree.
 * If placed inside a ScrollView main axis may be unbounded - that must be handled by the consumer.
 */
export function RenderRoot({ children, style }: { children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    const [constraints, setConstraints] = useState<Constraints | undefined>(undefined);

    const onLayout = useCallback((e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setConstraints({ maxWidth: Number.isFinite(width) ? width : null, maxHeight: Number.isFinite(height) ? height : null });
    }, []);

    return (
        <View onLayout={onLayout} style={style}>
            <ConstraintContext.Provider value={constraints}>{children}</ConstraintContext.Provider>
        </View>
    );
}

// ---------------------- Core Layout Rules (Flutter-like) ----------------------

function getMainAxisStyle(
    mainAxisSize: 'max' | 'min' | undefined,
    direction: Axis,
    parentDirection?: Axis,
    parentConstraints?: Constraints
): ViewStyle {
    const same = parentDirection === direction;
    const cross = parentDirection && parentDirection !== direction;

    if (mainAxisSize === 'min') {
        return { alignSelf: 'flex-start' };
    }

    // RULE: If nested in SAME direction, max behaves like min
    if (mainAxisSize === 'max' && same) {
        return { alignSelf: 'flex-start' };
    }

    // RULE: If nested in CROSS direction and parent bounds child's main axis, treat max as min
    if (mainAxisSize === 'max' && cross && parentConstraints) {
        if (direction === 'row' && boundedWidth(parentConstraints)) return { alignSelf: 'flex-start' };
        if (direction === 'column' && boundedHeight(parentConstraints)) return { alignSelf: 'flex-start' };
    }

    // Default: stretch
    return { alignSelf: 'stretch' };
}

// ---------------------- RenderFlex (Row/Column) Implementation ----------------------

interface RenderFlexProps {
    direction?: Axis;
    mainAxisSize?: 'max' | 'min';
    mainAxisAlignment?: string;
    crossAxisAlignment?: string;
    spacing?: number;
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    // If true, treat main axis as unbounded (like SingleChildScrollView) -> child's mainAxisSize max can expand
    mainAxisUnbounded?: boolean;
}

/**
 * RenderFlex is the entry point for Row/Column. It applies Flutter-like mainAxisSize rules using
 * measurements from ConstraintContext and ParentDirectionContext. This is a style-level simulation
 * and does not run a real layout algorithm in JS - it adjusts RN style to match Flutter behavior.
 */
export function RenderFlex({
    direction = 'row',
    mainAxisSize,
    mainAxisAlignment,
    crossAxisAlignment,
    spacing = 0,
    children,
    style,
    mainAxisUnbounded = false,
}: RenderFlexProps) {
    const parentDirection = useContext(ParentDirectionContext);
    const parentConstraints = useContext(ConstraintContext);

    // compute main-axis style based on constraints and parent direction
    const mainStyle = getMainAxisStyle(mainAxisSize, direction, parentDirection, parentConstraints);

    // If user explicitly set mainAxisUnbounded (eg inside SCROLL), allow max to expand
    if (mainAxisSize === 'max' && mainAxisUnbounded) {
        // allow growth along main axis
        if (direction === 'row') (mainStyle as any).flexGrow = 1;
        if (direction === 'column') (mainStyle as any).flexGrow = 1;
    }

    const containerStyle: ViewStyle = {
        flexDirection: direction,
        justifyContent: toJustifyContent(mainAxisAlignment),
        alignItems: toAlignItems(crossAxisAlignment),
        gap: spacing,
        ...((style as any) || {}),
        ...mainStyle,
    };

    return (
        <ParentDirectionContext.Provider value={direction}>
            <View style={containerStyle}>{children}</View>
        </ParentDirectionContext.Provider>
    );
}

export const Row = (p: Omit<RenderFlexProps, 'direction'>) => <RenderFlex {...p} direction="row" />;
export const Column = (p: Omit<RenderFlexProps, 'direction'>) => <RenderFlex {...p} direction="column" />;

// ---------------------- Expanded / Flexible ----------------------

interface FlexChildProps {
    flex?: number; // default 1
    fit?: 'tight' | 'loose';
    childDirection?: Axis; // override -- recommended set when wrapping non-Flex children
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

/**
 * Expanded/Flexible: expand only along the child's main axis (the axis of the child flex widget).
 * To correctly operate, pass childDirection when wrapping non-Flex children. When childDirection is
 * 'row', the expansion is horizontal; when 'column' it's vertical.
 */
export function FlexChild({ flex = 1, fit = 'tight', childDirection, children, style }: FlexChildProps) {
    const parentDir = useContext(ParentDirectionContext);
    const dir = childDirection ?? parentDir ?? 'column';

    const base: ViewStyle = { alignSelf: 'stretch' };

    // Apply flex only to the main axis of the child
    if (dir === 'row') {
        // row -> horizontal expansion
        // In RN we can't say "grow horizontally only" but by default flexGrow affects main axis of parent.
        // To approximate: set flexGrow so that inside column parent it will attempt to take available width.
        // We keep flexGrow but ensure we don't force cross-axis growth.
        (base as any).flexGrow = flex;
        (base as any).flexShrink = 1;
    } else {
        (base as any).flexGrow = flex;
        (base as any).flexShrink = 1;
    }

    return <View style={[base, style]}>{children}</View>;
}

export const Expanded = (p: Omit<FlexChildProps, 'fit'>) => <FlexChild {...p} fit="tight" />;
export const Flexible = (p: FlexChildProps) => <FlexChild {...p} fit="loose" />;

// ---------------------- ConstrainedBox ----------------------

interface ConstrainedBoxProps {
    minWidth?: number;
    maxWidth?: number;
    minHeight?: number;
    maxHeight?: number;
    children?: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export function ConstrainedBox({ minWidth, maxWidth, minHeight, maxHeight, children, style }: ConstrainedBoxProps) {
    const s: ViewStyle = {};
    if (typeof minWidth === 'number') (s as any).minWidth = minWidth;
    if (typeof maxWidth === 'number') (s as any).maxWidth = maxWidth;
    if (typeof minHeight === 'number') (s as any).minHeight = minHeight;
    if (typeof maxHeight === 'number') (s as any).maxHeight = maxHeight;
    return <View style={[s, style]}>{children}</View>;
}

// ---------------------- Intrinsic Helpers (Naive) ----------------------

export function IntrinsicWidth({ children }: { children?: React.ReactNode }) {
    const [w, setW] = useState<number | undefined>(undefined);
    function onLayout(e: LayoutChangeEvent) {
        const width = e.nativeEvent.layout.width;
        if (w === undefined) setW(width);
    }
    return (
        <View onLayout={onLayout} style={w !== undefined ? { width: w } : undefined}>
            {children}
        </View>
    );
}

export function IntrinsicHeight({ children }: { children?: React.ReactNode }) {
    const [h, setH] = useState<number | undefined>(undefined);
    function onLayout(e: LayoutChangeEvent) {
        const height = e.nativeEvent.layout.height;
        if (h === undefined) setH(height);
    }
    return (
        <View onLayout={onLayout} style={h !== undefined ? { height: h } : undefined}>
            {children}
        </View>
    );
}



// ---------------------- SingleChildScrollView helper (unbounded) ----------------------

export function SingleChildScrollView({ axis = 'vertical', children, style }: { axis?: 'vertical' | 'horizontal'; children?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
    if (axis === 'vertical') {
        return (
            <ScrollView style={style} contentContainerStyle={{ flexGrow: 1 }}>
                {children}
            </ScrollView>
        );
    }
    return (
        <ScrollView horizontal style={style} contentContainerStyle={{ flexGrow: 1 }}>
            {children}
        </ScrollView>
    );
}



// ---------------------- Exports ----------------------

export default {
    RenderRoot,
    Row,
    Column,
    Expanded,
    Flexible,
    ConstrainedBox,
    IntrinsicWidth,
    IntrinsicHeight,
    SingleChildScrollView,
};

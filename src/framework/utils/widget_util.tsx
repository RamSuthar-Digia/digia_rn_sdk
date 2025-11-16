import React from 'react';
import {
    View,
    TouchableOpacity,
    ViewStyle,
    SafeAreaView,
    DimensionValue,
} from 'react-native';
import { RenderPayload } from '../render_payload';
import { CommonProps, CommonStyle } from '../models/common_props';
import { ActionFlow } from '../actions/base/action_flow';
import { To } from './type_convertors';
import { as$ } from './functional_utils';
import { JsonLike } from './types';
import { NumUtil } from './num_util';
import { LayoutProvider, useConstraints, BoxConstraints } from './react-native-constraint-system';

type WrapOptions = {
    payload: RenderPayload;
    style?: CommonProps | null;
    aspectRatio?: number | null;
    child: React.ReactNode;
    actionFlow?: ActionFlow | null;
    /** If true, wraps content with LayoutProvider to provide constraints to children */
    provideConstraints?: boolean;
};

/**
 * Unified widget wrapper – merges container, alignment, aspectRatio & gesture logic.
 * 
 * Integration with Constraint System:
 * - Set provideConstraints=true to wrap with LayoutProvider (for containers that have children)
 * - Children can use useConstraints() hook to access parent constraints
 */
export function wrapWidget({
    payload,
    style,
    aspectRatio,
    child,
    actionFlow,
    provideConstraints = true,
}: WrapOptions): React.ReactElement {
    const mergedStyle: ViewStyle = {};

    if (style) {
        // 🟠 Padding
        const padding = To.padding(style.style?.padding);
        if (typeof padding === 'object') Object.assign(mergedStyle, padding);
        else if (typeof padding === 'number') mergedStyle.padding = padding;

        // 🟣 Margin
        const margin = To.margin(style.style?.margin);
        if (typeof margin === 'object') Object.assign(mergedStyle, margin);
        else if (typeof margin === 'number') mergedStyle.margin = margin;

        // 🟢 Background
        const bgColor = style.style?.bgColor?.evaluate(payload.context.scopeContext);
        if (bgColor) {
            const color = payload.getColor(bgColor);
            if (color) mergedStyle.backgroundColor = color;
        }

        // 🔵 Border radius
        const radius = To.borderRadius(style.style?.borderRadius);
        if (typeof radius === 'object') Object.assign(mergedStyle, radius);
        else if (typeof radius === 'number') mergedStyle.borderRadius = radius;

        // 🟣 Border
        const border = style.style?.border;
        if (border) {
            const borderType = as$<JsonLike>(
                border['borderType'],
                (v): v is JsonLike =>
                    typeof v === 'object' && v !== null && !Array.isArray(v)
            );
            const borderColor = border['borderColor'];
            const borderWidth = NumUtil.toDouble(border['borderWidth']);
            const borderPattern = as$<string>(
                borderType?.['borderPattern'],
                (v): v is string => typeof v === 'string'
            );
            if (borderPattern === 'solid' && borderWidth && borderWidth > 0) {
                const color = payload.evalColor(borderColor);
                if (color) {
                    mergedStyle.borderColor = color;
                    mergedStyle.borderWidth = borderWidth;
                    mergedStyle.borderStyle = 'solid';
                }
            }
        }

        // 🟤 Sizing
        Object.assign(mergedStyle, _applySizing(mergedStyle, style.style ?? {}, payload));

        // ⚫ Alignment
        const alignment = To.alignment(style.align);
        if (alignment) {
            mergedStyle.justifyContent = alignment.justifyContent;
            mergedStyle.alignItems = alignment.alignItems;
            mergedStyle.alignSelf = alignment.alignSelf;
        }

    }
    if (aspectRatio) mergedStyle.aspectRatio = aspectRatio;


    // 🟩 Safe Area
    const content = (
        child
    );

    // 🟥 Action Flow (Tap)
    if (actionFlow && actionFlow.actions.length > 0) {
        const handlePress = () => {
            payload.executeAction(actionFlow, { triggerType: 'onTap' });
        };

        const touchable = (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={actionFlow.inkwell ? 0.7 : 1}
                style={mergedStyle}
            >
                {content}
            </TouchableOpacity>
        );

        return provideConstraints ? (
            <LayoutProvider style={mergedStyle}>
                <TouchableOpacity
                    onPress={handlePress}
                    activeOpacity={actionFlow.inkwell ? 0.7 : 1}
                // style={{ flex: 1 }}
                >
                    {content}
                </TouchableOpacity>
            </LayoutProvider>
        ) : touchable;
    }

    // 🟦 Normal View (Single Layer)
    if (provideConstraints) {
        return (
            <LayoutProvider style={mergedStyle}>
                {content}
            </LayoutProvider>
        );
    }

    return <View style={{ ...mergedStyle, }}>{content}</View>;
}

/** Sizing Helper */
function _applySizing(
    baseStyle: ViewStyle,
    style: CommonStyle,
    payload: RenderPayload
): ViewStyle {
    const isHeightIntrinsic = _isIntrinsic(style.height);
    const isWidthIntrinsic = _isIntrinsic(style.width);

    const sized: ViewStyle = { ...baseStyle };

    if (!isHeightIntrinsic && style.height != null) {
        sized.height = _toDimensionValue(style.height);
    } else if (isHeightIntrinsic) {
        sized.height = undefined;
    }

    if (!isWidthIntrinsic && style.width != null) {
        sized.width = _toDimensionValue(style.width);
    } else if (isWidthIntrinsic) {
        sized.width = undefined;
    }

    return sized;
}

function _isIntrinsic(v?: DimensionValue | string) {
    return typeof v === 'string' && v.trim().toLowerCase() === 'intrinsic';
}

function _toDimensionValue(value: any): DimensionValue | undefined {
    if (value == null) return undefined;
    if (typeof value === 'string' && value.endsWith('%')) return value as DimensionValue;
    const num = NumUtil.toDouble(value);
    return num ?? undefined;
}

/**
 * Helper to apply parent constraints to a dimension value.
 * If constraints are available, respects min/max constraints.
 */
export function applyConstraints(
    value: DimensionValue | undefined,
    dimension: 'width' | 'height',
    constraints?: BoxConstraints
): DimensionValue | undefined {
    if (!constraints || value === undefined) return value;

    const isWidth = dimension === 'width';
    const min = isWidth ? constraints.minWidth : constraints.minHeight;
    const max = isWidth ? constraints.maxWidth : constraints.maxHeight;

    // If value is a percentage, return as-is (RN handles it)
    if (typeof value === 'string' && value.endsWith('%')) return value;

    // If value is a number, clamp it to constraints
    if (typeof value === 'number') {
        if (!isFinite(max)) return Math.max(value, min);
        return Math.max(min, Math.min(value, max));
    }

    return value;
}

/**
 * Export the useConstraints hook for widgets to use directly
 */
export { useConstraints } from './react-native-constraint-system';

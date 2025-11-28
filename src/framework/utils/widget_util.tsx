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
    /** Optional parent constraints to seed LayoutProvider when not available from context */
    parentConstraints?: BoxConstraints | null;
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
    provideConstraints = false,
    parentConstraints = null,
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

        if (typeof radius === 'object') Object.assign(mergedStyle, { ...radius, overflow: 'hidden' });
        else if (typeof radius === 'number') {
            mergedStyle.borderRadius = radius;
            mergedStyle.overflow = 'hidden';
        }

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

        const align = To.alignment(style.align);
        if (align) {
            Object.assign(mergedStyle, align);
            // mergedStyle.flexShrink = 1;
        }
        // ⚫ Alignment



    }
    if (aspectRatio) mergedStyle.aspectRatio = aspectRatio;


    // 🟩 Safe Area
    var content: React.ReactNode = child;




    // const Default: React.FC = () => {

    // 🟥 Action Flow (Tap)
    if (actionFlow && actionFlow.actions.length > 0) {
        const handlePress = () => {
            payload.executeAction(actionFlow, { triggerType: 'onTap' });
        };

        content = (
            <TouchableOpacity
                onPress={handlePress}
                activeOpacity={actionFlow.inkwell ? 0.7 : 1}
                style={mergedStyle}
            >
                {content}
            </TouchableOpacity>
        );



    }

    if (isEmptyObject(mergedStyle)) {
        return content as React.ReactElement;
    }

    // if (provideConstraints) {
    //     const ctx = useConstraints();
    //     const ctxConstraints = ctx?.constraints ?? null;
    //     const effectiveParent = parentConstraints ?? ctxConstraints ?? null;

    //     const styleToPass: any = { ...mergedStyle };


    //     return (
    //         <LayoutProvider style={styleToPass}>
    //             {content}
    //         </LayoutProvider>
    //     );
    // }

    // If component cannot take style → wrap it
    if (!componentSupportsStyle(content as React.ReactElement)) {
        // if (isChildrenImage(content as React.ReactElement)) {
        //     mergedStyle.overflow = 'hidden';
        // }
        return <View style={mergedStyle}>{content}</View>;
    }


    // Normalize existing styles
    const existingStyle = (content as any).props?.style;

    const mergedFinalStyle: any[] = [];

    if (Array.isArray(existingStyle)) {
        mergedFinalStyle.push(...existingStyle);
    } else if (existingStyle) {
        mergedFinalStyle.push(existingStyle);
    }

    // Add wrapper style last
    mergedFinalStyle.push(mergedStyle);
    // if (isChildrenImage(content as React.ReactElement)) {
    //     mergedFinalStyle.push({ overflow: 'hidden' });
    // }

    return React.cloneElement(content as React.ReactElement, {
        style: mergedFinalStyle,
    });
}

/** Sizing Helper */
function _applySizing(
    baseStyle: ViewStyle,
    style: CommonStyle,
    payload: RenderPayload
): ViewStyle {

    const sized: ViewStyle = { ...baseStyle };
    const width = _toDimensionValue(style.width);
    const height = _toDimensionValue(style.height);
    if (width != null) sized.width = width;
    if (height != null) sized.height = height;

    return sized;
}

function _isIntrinsic(v?: DimensionValue | string) {
    return typeof v === 'string' && v.trim().toLowerCase() === 'intrinsic';
}

function _toDimensionValue(value: any): DimensionValue | null {
    return value ?? null;
}


/** Utility to check if an object has no own properties */
function isEmptyObject(obj: object): boolean {
    return Object.keys(obj).length === 0;
}


export function isViewBased(el: any): boolean {
    if (!React.isValidElement(el)) return false;

    // Native View
    if (el.type === View) return true;

    // Functional component returning a View
    if (typeof el.type === 'function') {
        try {
            if (
                !el.type.prototype ||
                !el.type.prototype.isReactComponent
            ) {
                const rendered = (el.type as Function)(el.props);
                return React.isValidElement(rendered) && rendered.type === View;
            }
        } catch { /* ignore */ }
    }

    return false;
}



export function componentSupportsStyle(el: React.ReactElement): boolean {
    const type: any = el.type;
    if (type.displayName === 'View' || type.displayName === 'ScrollView') return true;
    // Native components: View, Text, Image, etc.
    if (typeof type === "string") return true;

    // Functional or class component with default props including style
    if (type?.defaultProps && "style" in type.defaultProps) return true;

    // If style prop exists AND is not undefined
    if (el.props && "style" in el.props) return true;

    return false;
}

export function isChildrenImage(el: React.ReactElement): boolean {
    const type: any = el.type;
    if (type.displayName === 'InternalImage') return true;

    return false;
}
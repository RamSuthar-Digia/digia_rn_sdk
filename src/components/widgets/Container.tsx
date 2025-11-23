import React from 'react';
import {
    View,
    StyleSheet,
    ViewStyle,
    ImageBackground,
    FlexAlignType,
} from 'react-native';
import Svg, {
    Defs,
    LinearGradient,
    Rect,
    Stop,
    RadialGradient,
} from 'react-native-svg';
import { RenderPayload } from '../../framework/render_payload';
import { Props } from '../../framework/models/props';
import { CommonProps } from '../../framework/models/common_props';
import { VirtualWidget } from '../base/VirtualWidget';
import { BorderPattern, StrokeAlign } from '../../framework/utils/custon_types';
import { BorderWithPattern } from '../../framework/utils/BorderWithPattern';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { Svg as SvgBase } from 'react-native-svg';
import { To } from '../../framework/utils/type_convertors';
import { LayoutProvider, useConstraints } from '../../framework/utils/react-native-constraint-system';

export class VWContainer extends VirtualStatelessWidget<Props> {
    constructor(options: {
        props: Props;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const self = this;

        function _isIntrinsic(v?: any) {
            return typeof v === 'string' && v.trim().toLowerCase() === 'intrinsic';
        }
        function _toDimensionValue(value: any): any {
            if (value == null) return undefined;
            if (typeof value === 'string' && value.endsWith('%')) return value; // keep percent for now
            const num = Number(value);
            return isNaN(num) ? undefined : num;
        }

        // Read props (raw)
        const rawWidth = self.props.get('width');
        const rawHeight = self.props.get('height');
        const minWidth = self.props.get('minWidth');
        const maxWidth = self.props.get('maxWidth');
        const minHeight = self.props.get('minHeight');
        const maxHeight = self.props.get('maxHeight');

        const color = payload.evalColor(self.props.get('color')) ?? 'transparent';
        const bgImage = self.props.get('bgImage');
        const borderRadius = To.borderRadius(self.props.get('borderRadius'));
        const borderWidth = self.props.get('borderWidth') ?? 0;
        const borderColor = payload.evalColor(self.props.get('borderColor')) ?? 'transparent';
        const borderPattern = self.props.get('borderPattern') ?? BorderPattern.solid;
        const style = self.props.get('style') ?? {};
        const padding = To.padding(self.props.get('padding')) ?? {};
        const margin = To.margin(self.props.get('margin')) ?? {};
        const alignment = To.alignment(self.props.get('alignment'));

        // Keep original parsed values (may be percent strings)
        let widthRaw = !_isIntrinsic(rawWidth) && rawWidth != null ? _toDimensionValue(rawWidth) : undefined;
        let heightRaw = !_isIntrinsic(rawHeight) && rawHeight != null ? _toDimensionValue(rawHeight) : undefined;

        // The inner functional component uses hooks correctly
        const ContainerComponent: React.FC = () => {
            const ctx = useConstraints();
            const parentConstraints = ctx?.constraints ?? null;




            // Compute constrainedStyle similar to your original logic, but using resolved values and parentConstraints fallback
            const constrainedStyle: ViewStyle = {
                ...(minWidth != null ? { minWidth: _toDimensionValue(minWidth) } : {}),
                ...(maxWidth != null ? { maxWidth: _toDimensionValue(maxWidth) } : (parentConstraints && parentConstraints.maxWidth !== Infinity ? { maxWidth: parentConstraints.maxWidth } : {})),
                ...(minHeight != null ? { minHeight: _toDimensionValue(minHeight) } : {}),
                ...(maxHeight != null ? { maxHeight: _toDimensionValue(maxHeight) } : (parentConstraints && parentConstraints.maxHeight !== Infinity ? { maxHeight: parentConstraints.maxHeight } : {})),
            };

            // Merge container style
            const containerStyle: ViewStyle = {
                width: widthRaw,
                height: heightRaw,

                ...borderRadius,
                backgroundColor: !bgImage ? color : 'transparent',
                borderWidth,
                borderColor,
                ...padding,
                ...margin,
                borderStyle: borderPattern,
                alignItems: alignment?.alignItems,
                justifyContent: alignment?.justifyContent,

                ...constrainedStyle,
                ...(style as ViewStyle),
            };

            // // IMPORTANT: if useConstraints() returned null (no measured constraints yet) and there are percent-based widths/heights,
            // // we must *delay* rendering children until constraints exist, otherwise children see Infinity.
            // const hasPercentWidth = typeof widthRaw === 'string' && widthRaw.endsWith('%');
            // const hasPercentHeight = typeof heightRaw === 'string' && heightRaw.endsWith('%');
            // const needParentForPercent = (hasPercentWidth || hasPercentHeight);

            // // If percent values are used but parent constraints aren't available yet, render a placeholder (or nothing)
            // if (needParentForPercent && !parentConstraints) {
            //     // Render an empty wrapper so LayoutProvider can measure this view; children will be rendered on next pass
            //     return (
            //         <View style={containerStyle} />
            //     );
            // }

            // Now it's safe to create the child widget: build it here so it re-renders when this functional component re-runs (on constraints change)
            const child = self.child ? self.child.toWidget(payload) : null;

            // // If this container has an explicit width/height, force the child to fill that space
            // const hasExplicitWidth = widthRaw != null;
            // const hasExplicitHeight = heightRaw != null;

            // let innerContent: React.ReactNode = child;
            // if (child != null && (hasExplicitWidth || hasExplicitHeight)) {
            //     const fillStyle: ViewStyle = {
            //         ...(hasExplicitWidth ? { width: '100%' as any } : {}),
            //         ...(hasExplicitHeight ? { height: '100%' as any } : {}),
            //     };
            //     innerContent = <View style={fillStyle}>{child}</View>;
            // }

            // Wrap the inner view with LayoutProvider so children can read the available constraints
            return (
                <LayoutProvider style={containerStyle}>
                    {bgImage ? (
                        <ImageBackground
                            source={{ uri: bgImage }}
                            style={[StyleSheet.absoluteFill, { ...(borderRadius as any) }]}
                            imageStyle={{ ...(borderRadius as any) }}
                        >
                            {child}
                        </ImageBackground>
                    ) : (
                        child
                    )}
                </LayoutProvider>
            );
        };

        return <ContainerComponent />;
        // Return the functional component (so hooks are valid)
        // return wrapWidget({
        //     payload,
        //     actionFlow: self.commonProps?.onClick ?? null,
        //     child: <ContainerComponent />,
        // });
    }

}

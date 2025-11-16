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
import { wrapWidget } from '../../framework/utils/widget_util';
import { BorderPattern, StrokeAlign } from '../../framework/utils/custon_types';
import { BorderWithPattern } from '../../framework/utils/BorderWithPattern';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { Svg as SvgBase } from 'react-native-svg';
import { To } from '../../framework/utils/type_convertors';
import { LayoutProvider } from '../../framework/utils/react-native-constraint-system';

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
        // Capture class context
        const self = this;

        // Sizing logic
        function _isIntrinsic(v?: any) {
            return typeof v === 'string' && v.trim().toLowerCase() === 'intrinsic';
        }
        function _toDimensionValue(value: any): any {
            if (value == null) return undefined;
            if (typeof value === 'string' && value.endsWith('%')) return value;
            const num = Number(value);
            return isNaN(num) ? undefined : num;
        }

        const rawWidth = self.props.get('width');
        const rawHeight = self.props.get('height');
        const minWidth = self.props.get('minWidth');
        const maxWidth = self.props.get('maxWidth');
        const minHeight = self.props.get('minHeight');
        const maxHeight = self.props.get('maxHeight');

        let width = !_isIntrinsic(rawWidth) && rawWidth != null ? _toDimensionValue(rawWidth) : undefined;
        let height = !_isIntrinsic(rawHeight) && rawHeight != null ? _toDimensionValue(rawHeight) : undefined;

        const color = payload.evalColor(self.props.get('color')) ?? 'transparent';
        const gradient = self.props.get('gradiant');
        const bgImage = self.props.get('bgImage');
        const borderRadius = To.borderRadius(self.props.get('borderRadius'));
        const borderWidth = self.props.get('borderWidth') ?? 0;
        const borderColor = payload.evalColor(self.props.get('borderColor')) ?? 'transparent';
        const borderPattern = self.props.get('borderPattern') ?? BorderPattern.solid;
        const strokeAlign = self.props.get('strokeAlign') ?? StrokeAlign.outside;
        const dashPattern = self.props.get('dashPattern');
        const style = self.props.get('style') ?? {};
        const padding = To.padding(self.props.get('padding')) ?? {};
        const margin = To.margin(self.props.get('margin')) ?? {};
        const elevation = self.props.get('elevation') ?? 0;
        const alignment = To.alignment(self.props.get('alignment'));
        const aspectRatio = self.props.get('aspectRatio');

        // Always apply min/max constraints
        const constrainedStyle: ViewStyle = {
            ...(minWidth != null ? { minWidth: _toDimensionValue(minWidth) } : {}),
            ...(maxWidth != null ? { maxWidth: _toDimensionValue(maxWidth) } : {}),
            ...(minHeight != null ? { minHeight: _toDimensionValue(minHeight) } : {}),
            ...(maxHeight != null ? { maxHeight: _toDimensionValue(maxHeight) } : {}),
        };

        const containerStyle: ViewStyle = {
            width,
            height,
            ...borderRadius,
            backgroundColor: !bgImage ? color : 'transparent',
            borderWidth,
            borderColor,
            ...padding,
            ...margin,
            borderStyle: borderPattern,
            elevation,
            alignItems: alignment?.alignItems,
            justifyContent: alignment?.justifyContent,
            overflow: 'hidden',
            ...constrainedStyle,
            ...(style as ViewStyle),
        };

        const child = self.child ? self.child.toWidget(payload) : null;

        // Wrap children in LayoutProvider so they know the available space
        const composed = (
            <View style={containerStyle}>
                {bgImage ? (
                    <ImageBackground
                        source={{ uri: bgImage }}
                        style={[StyleSheet.absoluteFill, { ...borderRadius }]}
                        imageStyle={{ ...borderRadius }}
                    >
                        <LayoutProvider >
                            {child}
                        </LayoutProvider>
                    </ImageBackground>
                ) : (
                    <LayoutProvider >
                        {child}
                    </LayoutProvider>
                )}
            </View>
        );

        return wrapWidget({
            payload,
            aspectRatio: this.props.get('aspectRatio'),
            child: composed,
        });
    }
}

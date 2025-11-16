import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Svg, { Rect, Circle } from 'react-native-svg';
import { BorderPattern, StrokeAlign } from './custon_types';

interface BorderWithPatternProps {
    width: number;
    height: number;
    strokeWidth?: number;
    color?: string;
    borderPattern?: BorderPattern;
    strokeAlign?: StrokeAlign;
    dashPattern?: number[];
    borderRadius?: number;
    style?: ViewStyle;
    children?: React.ReactNode;
}

export const BorderWithPattern: React.FC<BorderWithPatternProps> = ({
    width,
    height,
    strokeWidth = 2,
    color = '#000',
    borderPattern = BorderPattern.solid,
    strokeAlign = StrokeAlign.outside,
    dashPattern,
    borderRadius = 0,
    style,
    children,
}) => {
    // Calculate stroke position
    let halfStroke = strokeWidth / 2;
    let rectX = strokeAlign === StrokeAlign.inside ? halfStroke : 0;
    let rectY = strokeAlign === StrokeAlign.inside ? halfStroke : 0;
    let rectWidth = width - (strokeAlign === StrokeAlign.inside ? strokeWidth : 0);
    let rectHeight = height - (strokeAlign === StrokeAlign.inside ? strokeWidth : 0);

    // Dash array for SVG
    let strokeDasharray: string | undefined;
    if (borderPattern === BorderPattern.dotted) {
        strokeDasharray = `${strokeWidth},${strokeWidth * 2}`;
    } else if (borderPattern === BorderPattern.dashed && dashPattern) {
        strokeDasharray = dashPattern.join(',');
    }

    return (
        <View style={[{ width, height }, style]}>
            <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
                <Rect
                    x={rectX}
                    y={rectY}
                    width={rectWidth}
                    height={rectHeight}
                    rx={borderRadius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDasharray}
                    fill="none"
                />
            </Svg>
            {children}
        </View>
    );
};

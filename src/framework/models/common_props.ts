import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { tryKeys } from '../utils/json_util';
import { as$ } from '../utils/functional_utils';
import { ActionFlow } from '../actions/base/action_flow';
import { ExprOr } from './types';
import { JsonLike } from '../utils';



// CommonStyle equivalent
interface CommonStyleProps {
    padding?: number | string;
    margin?: number | string;
    bgColor?: ExprOr<string> | null;
    border?: JsonLike;
    borderRadius?: number | string;
    height?: DimensionValue | null;
    width?: DimensionValue | null;
    clipBehavior?: 'visible' | 'hidden';
}

export class CommonStyle implements CommonStyleProps {
    padding?: number | string;
    margin?: number | string;
    bgColor?: ExprOr<string> | null;
    border?: JsonLike;
    borderRadius?: number | string;
    height?: DimensionValue | null;
    width?: DimensionValue | null;
    clipBehavior?: 'visible' | 'hidden';

    constructor({
        padding,
        margin,
        bgColor,
        border,
        height,
        width,
        clipBehavior,
        borderRadius,
    }: CommonStyleProps) {
        this.padding = padding;
        this.margin = margin;
        this.bgColor = bgColor;
        this.border = border;
        this.height = height;
        this.width = width;
        this.clipBehavior = clipBehavior;
        this.borderRadius = borderRadius;
    }

    static fromJson(json: JsonLike): CommonStyle {
        return new CommonStyle({
            padding: json['padding'],
            margin: json['margin'],
            bgColor: tryKeys<ExprOr<string>>(
                json,
                ['bgColor', 'backgroundColor'],
                {
                    parse: (it: any) => ExprOr.fromJson<string>(it),
                }
            ) ?? undefined,
            borderRadius: tryKeys(
                json,
                ['borderRadius', 'border.borderRadius'],
            ) ?? undefined,
            border: as$<JsonLike>(json['border']) ?? json,
            height: as$<DimensionValue | null>(json['height']) ?? undefined,
            width: as$<DimensionValue | null>(json['width']) ?? undefined,
            clipBehavior: as$<'visible' | 'hidden'>(json['clipBehavior']) ?? undefined,
        });
    }
}

// CommonProps equivalent
export class CommonProps {
    readonly visibility?: ExprOr<boolean>;
    readonly align?: string;
    readonly style?: CommonStyle;
    readonly onClick?: ActionFlow;

    constructor({
        visibility,
        align,
        style,
        onClick,
    }: {
        visibility?: ExprOr<boolean>;
        align?: string;
        style?: CommonStyle;
        onClick?: ActionFlow;
    }) {
        this.visibility = visibility;
        this.align = align;
        this.style = style;
        this.onClick = onClick;
    }

    static fromJson(json: JsonLike): CommonProps {
        return new CommonProps({
            visibility: ExprOr.fromJson<boolean>(json['visibility']) ?? undefined,
            align: as$<string>(json['align']) ?? undefined,
            style: tryKeys<CommonStyle>(
                json,
                ['style', 'styleClass'],
                { parse: (it: any) => it ? CommonStyle.fromJson(it) : null }
            ) ?? undefined,
            onClick: ActionFlow.fromJson(json['onClick']) ?? undefined,
        });
    }
}

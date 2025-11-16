import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleSheet, Animated, Pressable } from 'react-native';
import { VirtualLeafStatelessWidget } from '../base/VirtualLeafStatelessWidget';
import { RenderPayload } from '../../framework/render_payload';
import { Props } from '../../framework/models/props';
import { VirtualWidget } from '../base/VirtualWidget';
import { CommonProps } from '../../framework/models/common_props';
import { TextPropsClass } from '../widget_props/text_props';
import { IconProps } from '../widget_props/icon_props';
import { VWText } from './text';
import { VWIcon } from './icon';
import { ActionFlow } from '../../framework/actions/base/action_flow';
import { NumUtil } from '../../framework/utils/num_util';
import { To } from '../../framework/utils/type_convertors';
import { Props as PropsType } from '../../framework/models/props';

/**
 * VWButton - simplified port of the Flutter VWButton.
 * Supports defaultStyle/disabledStyle, optional leading/trailing icons and text.
 */
export class VWButton extends VirtualLeafStatelessWidget<Props> {
    constructor(options: {
        props: Props;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const defaultStyleJson = this.props.toProps("defaultStyle") ?? Props.empty();
        const disabledStyleJson = this.props.toProps("disabledStyle") ?? Props.empty();

        // ---- SIZE CONTROL (supports %, px) ----
        const widthRaw = defaultStyleJson.get("width");
        const heightRaw = defaultStyleJson.get("height");

        const width =
            typeof widthRaw === "string" && widthRaw.endsWith("%")
                ? widthRaw
                : NumUtil.toDouble(widthRaw);

        const height =
            typeof heightRaw === "string" && heightRaw.endsWith("%")
                ? heightRaw
                : NumUtil.toDouble(heightRaw);

        const isDisabled =
            (payload.eval(this.props.get("isDisabled")) ??
                this.props.get("onClick") == null) as boolean | null;

        // ---- BASE STYLE ----
        const container: ViewStyle = {
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
        };

        // background color
        const bgKey = isDisabled
            ? disabledStyleJson.getString("backgroundColor")
            : defaultStyleJson.getString("backgroundColor");

        if (bgKey) {
            const color = payload.getColor(bgKey);
            if (color) container.backgroundColor = color;
        }

        // padding
        const padding = To.padding(defaultStyleJson.get("padding"));
        if (typeof padding === "number") container.padding = padding;
        else if (typeof padding === "object") Object.assign(container, padding);

        // shape / border radius
        const br = To.borderRadius(defaultStyleJson.get("borderRadius"));
        if (typeof br === "number") container.borderRadius = br;
        else if (typeof br === "object") Object.assign(container, br as any);

        // assign width / height
        if (width != null) container.width = width as any;
        if (height != null) container.height = height as any;

        // elevation
        const elevation = defaultStyleJson.getDouble("elevation") ?? 0;
        if (elevation > 0) container.elevation = elevation;

        // alignment
        const alignment = To.alignment(defaultStyleJson.get("alignment"));
        if (alignment) {
            container.justifyContent = alignment.justifyContent;
            container.alignItems = alignment.alignItems;
        }

        // ----- PRESSED STATE ANIMATION -----
        const scale = new Animated.Value(1);
        const handlePressIn = () => {
            Animated.spring(scale, {
                toValue: 0.98,
                useNativeDriver: true,
                speed: 40,
                bounciness: 0,
            }).start();
        };
        const handlePressOut = () => {
            Animated.spring(scale, {
                toValue: 1,
                useNativeDriver: true,
                speed: 40,
                bounciness: 0,
            }).start();
        };

        // ---- BUILD CONTENT ----
        const localProps = JSON.parse(JSON.stringify(this.props.value || {}));

        if (isDisabled) {
            const disabledTextColor = disabledStyleJson.getString("disabledTextColor");
            const disabledIconColor = disabledStyleJson.getString("disabledIconColor");

            if (disabledTextColor) {
                if (!localProps.text) localProps.text = {};
                if (!localProps.text.textStyle) localProps.text.textStyle = {};
                localProps.text.textStyle.textColor = disabledTextColor;
            }
            if (disabledIconColor) {
                if (localProps.leadingIcon)
                    localProps.leadingIcon.iconColor = disabledIconColor;
                if (localProps.trailingIcon)
                    localProps.trailingIcon.iconColor = disabledIconColor;
            }
        }

        const textProps = TextPropsClass.fromJson(localProps["text"] ?? {});
        const textNode = new VWText({
            props: textProps,
            commonProps: null,
            parent: this,
        } as any).toWidget(payload);

        let leadingIconNode = null;
        let trailingIconNode = null;

        if (localProps.leadingIcon) {
            const ip = IconProps.fromJson(localProps.leadingIcon);
            leadingIconNode = new VWIcon({
                props: ip,
                commonProps: null,
                parent: this,
            } as any).toWidget(payload);
        }

        if (localProps.trailingIcon) {
            const ip = IconProps.fromJson(localProps.trailingIcon);
            trailingIconNode = new VWIcon({
                props: ip,
                commonProps: null,
                parent: this,
            } as any).toWidget(payload);
        }

        const content =
            !leadingIconNode && !trailingIconNode ? (
                textNode
            ) : (
                <View style={[styles.row, { alignItems: 'stretch', alignContent: 'stretch' }]}>
                    {leadingIconNode}
                    <View style={{ overflow: 'visible', }}>{textNode}</View>
                    {trailingIconNode}
                </View>
            );

        // ---- onPress → ActionFlow ----
        const onPress = () => {
            if (isDisabled) return;
            const onClick = ActionFlow.fromJson(this.props.get("onClick"));
            if (onClick) payload.executeAction(onClick, { triggerType: "onPressed" });
        };

        return (
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={isDisabled}

                style={({ pressed }) => [
                    container,
                    pressed && !isDisabled && styles.pressedOverlay,
                ]}
            >
                <Animated.View style={{ transform: [{ scale }] }}>
                    {content}
                </Animated.View>
            </Pressable>
        );
    }
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    pressedOverlay: {
        opacity: 0.85,
    },
});

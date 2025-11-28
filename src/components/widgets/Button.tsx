import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleSheet, Animated, Pressable, DimensionValue } from 'react-native';
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
// export class VWButton extends VirtualLeafStatelessWidget<Props> {
//     constructor(options: {
//         props: Props;
//         commonProps?: CommonProps;
//         parentProps?: Props;
//         parent?: VirtualWidget;
//         refName?: string;
//     }) {
//         super(options as any);
//     }

//     render(payload: RenderPayload): React.ReactNode {
//         const defaultStyleJson = this.props.toProps("defaultStyle") ?? Props.empty();
//         const disabledStyleJson = this.props.toProps("disabledStyle") ?? Props.empty();

//         // ---- SIZE CONTROL (supports %, px) ----
//         const widthRaw = defaultStyleJson.get("width");
//         const heightRaw = defaultStyleJson.get("height");

//         const width =
//             typeof widthRaw === "string" && widthRaw.endsWith("%")
//                 ? widthRaw
//                 : NumUtil.toDouble(widthRaw);

//         const height =
//             typeof heightRaw === "string" && heightRaw.endsWith("%")
//                 ? heightRaw
//                 : NumUtil.toDouble(heightRaw);

//         const isDisabled =
//             (payload.eval(this.props.get("isDisabled")) ??
//                 this.props.get("onClick") == null) as boolean | null;

//         // ---- BASE STYLE ----
//         const container: ViewStyle = {
//             justifyContent: "center",
//             alignItems: "center",
//             overflow: "hidden",
//         };

//         // background color
//         const bgKey = isDisabled
//             ? disabledStyleJson.getString("backgroundColor")
//             : defaultStyleJson.getString("backgroundColor");

//         if (bgKey) {
//             const color = payload.getColor(bgKey);
//             if (color) container.backgroundColor = color;
//         }

//         // padding
//         const padding =(defaultStyleJson.get("padding")==null)?{
//            paddingLeft:12,
//            paddingRight:12,
//            paddingTop:4,
//            paddingBottom:4,
//         }:
//          To.padding(defaultStyleJson.get("padding"));
//         if (typeof padding === "number") container.padding = padding;
//         else if (typeof padding === "object") Object.assign(container, padding);

//         // shape / border radius
//         const br = To.borderRadius(defaultStyleJson.get("borderRadius"));
//         if (typeof br === "number") container.borderRadius = br;
//         else if (typeof br === "object") Object.assign(container, br as any);

//         // assign width / height
//         if (width != null) container.width = width as any;
//         if (height != null) container.height = height as any;

//         // elevation
//         const elevation = defaultStyleJson.getDouble("elevation") ?? 0;
//         if (elevation > 0) container.elevation = elevation;

//         // alignment
//         const alignment = To.alignment(defaultStyleJson.get("alignment"));
//         if (alignment) {
//             container.justifyContent = alignment.justifyContent;
//             container.alignItems = alignment.alignItems;
//         }

//         // ----- PRESSED STATE ANIMATION -----
//         const scale = new Animated.Value(1);
//         const handlePressIn = () => {
//             Animated.spring(scale, {
//                 toValue: 0.98,
//                 useNativeDriver: true,
//                 speed: 40,
//                 bounciness: 0,
//             }).start();
//         };
//         const handlePressOut = () => {
//             Animated.spring(scale, {
//                 toValue: 1,
//                 useNativeDriver: true,
//                 speed: 40,
//                 bounciness: 0,
//             }).start();
//         };

//         // ---- BUILD CONTENT ----
//         const localProps = JSON.parse(JSON.stringify(this.props.value || {}));

//         if (isDisabled) {
//             const disabledTextColor = disabledStyleJson.getString("disabledTextColor");
//             const disabledIconColor = disabledStyleJson.getString("disabledIconColor");

//             if (disabledTextColor) {
//                 if (!localProps.text) localProps.text = {};
//                 if (!localProps.text.textStyle) localProps.text.textStyle = {};
//                 localProps.text.textStyle.textColor = disabledTextColor;
//             }
//             if (disabledIconColor) {
//                 if (localProps.leadingIcon)
//                     localProps.leadingIcon.iconColor = disabledIconColor;
//                 if (localProps.trailingIcon)
//                     localProps.trailingIcon.iconColor = disabledIconColor;
//             }
//         }

//         const textProps = TextPropsClass.fromJson(localProps["text"] ?? {});
//         const textNode = new VWText({
//             props: textProps,
//             commonProps: null,
//             parent: this,
//         } as any).toWidget(payload);

//         let leadingIconNode = null;
//         let trailingIconNode = null;

//         if (localProps.leadingIcon) {
//             const ip = IconProps.fromJson(localProps.leadingIcon);
//             leadingIconNode = new VWIcon({
//                 props: ip,
//                 commonProps: null,
//                 parent: this,
//             } as any).toWidget(payload);
//         }

//         if (localProps.trailingIcon) {
//             const ip = IconProps.fromJson(localProps.trailingIcon);
//             trailingIconNode = new VWIcon({
//                 props: ip,
//                 commonProps: null,
//                 parent: this,
//             } as any).toWidget(payload);
//         }

//         const content =
//             !leadingIconNode && !trailingIconNode ? (
//                 textNode
//             ) : (
//                 <View style={[styles.row, { alignItems: 'stretch', alignContent: 'stretch' }]}>
//                     {leadingIconNode}
//                     <View style={{ overflow: 'visible', }}>{textNode}</View>
//                     {trailingIconNode}
//                 </View>
//             );

//         // ---- onPress → ActionFlow ----
//         const onPress = () => {
//             if (isDisabled) return;
//             const onClick = ActionFlow.fromJson(this.props.get("onClick"));
//             if (onClick) payload.executeAction(onClick, { triggerType: "onPressed" });
//         };

//         return (
//             <Pressable
//                 onPress={onPress}
//                 onPressIn={handlePressIn}
//                 onPressOut={handlePressOut}
//                 disabled={isDisabled}

//                 style={({ pressed }) => [
//                     container,
//                     pressed && !isDisabled && styles.pressedOverlay,
//                 ]}
//             >
//                 <Animated.View style={{ transform: [{ scale }] }}>
//                     {content}
//                 </Animated.View>
//             </Pressable>
//         );
//     }
// }

// const styles = StyleSheet.create({
//     row: {
//         flexDirection: "row",
//         alignItems: "center",
//         gap: 6,
//     },
//     pressedOverlay: {
//         opacity: 0.85,
//     },
// });



export class VWButton extends VirtualLeafStatelessWidget<Props> {
    constructor(options: any) {
        super(options);
    }

    render(payload: RenderPayload): React.ReactNode {
        const defaultStyleJson = this.props.toProps("defaultStyle") ?? Props.empty();
        const disabledStyleJson = this.props.toProps("disabledStyle") ?? Props.empty();

        // ----------------------------------------------------------------------
        // SIZE
        // ----------------------------------------------------------------------
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
                this.props.get("onClick") == null) as boolean;

        // ----------------------------------------------------------------------
        // MAIN BUTTON STYLE (LIKE FLUTTER ELEVATED BUTTON)
        // ----------------------------------------------------------------------
        const container: ViewStyle = {
            // justifyContent: "center",
            // alignItems: "center",
            // flexDirection: "row",
            gap: 6,
            overflow: "hidden",
            alignSelf: "flex-start",     // IMPORTANT → match Flutter
        };

        // BG COLOR
        const bgKey = isDisabled
            ? disabledStyleJson.getString("backgroundColor")
            : defaultStyleJson.getString("backgroundColor");

        if (bgKey) {
            const color = payload.getColor(bgKey);
            if (color) container.backgroundColor = color;
        }

        // padding
        const paddingValue = defaultStyleJson.get("padding");
        const padding =
            paddingValue == null
                ? {
                    paddingLeft: 12,
                    paddingRight: 12,
                    paddingTop: 8,
                    paddingBottom: 8,
                }
                : To.padding(paddingValue);

        Object.assign(container, padding);

        // border radius
        const br = shape(this.props.get("shape"), {
            width: toNumberOrUndefined(width),
            height: toNumberOrUndefined(height),
        });
        Object.assign(container, br);

        // width / height
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

        // ----------------------------------------------------------------------
        // PRESS FEEDBACK (scale)
        // ----------------------------------------------------------------------
        const scale = new Animated.Value(1);

        const handlePressIn = () => {
            Animated.spring(scale, {
                toValue: 0.97,
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

        // ----------------------------------------------------------------------
        // TEXT + ICONS
        // ----------------------------------------------------------------------
        const localProps = JSON.parse(JSON.stringify(this.props.value || {}));

        if (isDisabled) {
            const tColor = disabledStyleJson.getString("disabledTextColor");
            const iColor = disabledStyleJson.getString("disabledIconColor");

            if (tColor) {
                if (!localProps.text) localProps.text = {};
                if (!localProps.text.textStyle) localProps.text.textStyle = {};
                localProps.text.textStyle.textColor = tColor;
            }

            if (iColor) {
                if (localProps.leadingIcon) localProps.leadingIcon.iconColor = iColor;
                if (localProps.trailingIcon) localProps.trailingIcon.iconColor = iColor;
            }
        }

        // build text
        const textProps = TextPropsClass.fromJson(localProps["text"] ?? {});
        const textNode = new VWText({
            props: textProps,
            commonProps: null,
            parent: this,
        } as any).toWidget(payload);

        // icons
        let leading = null;
        let trailing = null;

        if (localProps.leadingIcon) {
            leading = new VWIcon({
                props: IconProps.fromJson(localProps.leadingIcon),
                commonProps: null,
                parent: this,
            } as any).toWidget(payload);
        }

        if (localProps.trailingIcon) {
            trailing = new VWIcon({
                props: IconProps.fromJson(localProps.trailingIcon),
                commonProps: null,
                parent: this,
            } as any).toWidget(payload);
        }

        // final content (tightly wrapped like Flutter)
        const content = (
            <View style={styles.row}>
                {leading}
                {textNode}
                {/* <View style={{ flex: 1, alignSelf: 'flex-end', alignContent: 'flex-start' }}>{textNode}</View> */}
                {trailing}
            </View>
        );

        // ----------------------------------------------------------------------
        // onPress event
        // ----------------------------------------------------------------------
        const onPress = () => {
            if (isDisabled) return;
            const onClick = ActionFlow.fromJson(this.props.get("onClick"));
            if (onClick) payload.executeAction(onClick, { triggerType: "onPressed" });
        };

        // ----------------------------------------------------------------------
        // RENDER
        // ----------------------------------------------------------------------
        return (
            <Animated.View style={{ transform: [{ scale }], width: container.width, height: container.height, }}>
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
                    {content}
                </Pressable>
            </Animated.View>
        );
    }
}

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
    },
    pressedOverlay: {
        opacity: 0.90,
    },
});

function toNumberOrUndefined(v: any): number | undefined {
    if (typeof v === "number") return v;
    if (typeof v === "string") {
        // "100%" → cannot compute, return undefined
        if (v.endsWith("%")) return undefined;

        const n = Number(v);
        if (!isNaN(n)) return n;
    }
    return undefined;
}


function shape(shape: any, containerSize: { width?: DimensionValue; height?: DimensionValue }) {
    if (!shape || typeof shape !== "object") return {};

    const style: any = {};

    // ------------------------------------
    // numeric-safe width/height
    // ------------------------------------
    const wNum = toNumberOrUndefined(containerSize.width);
    const hNum = toNumberOrUndefined(containerSize.height);

    // ------------------------------------
    // BORDER RADIUS
    // ------------------------------------
    const borderRadius = _parseBorderRadius(shape.borderRadius);
    if (borderRadius) Object.assign(style, borderRadius);

    // ------------------------------------
    // BORDER WIDTH
    // ------------------------------------
    if (typeof shape.borderWidth === "number") {
        style.borderWidth = shape.borderWidth;
    }

    // ------------------------------------
    // BORDER STYLE
    // ------------------------------------
    if (shape.borderStyle) {
        const map: any = {
            none: undefined,
            solid: "solid",
            dashed: "dashed",
            dotted: "dotted",
        };
        const bs = map[String(shape.borderStyle).toLowerCase()];
        if (bs !== undefined) style.borderStyle = bs;
    }

    // ------------------------------------
    // BORDER COLOR
    // ------------------------------------
    if (shape.borderColor) {
        style.borderColor = shape.borderColor;
    }

    // ------------------------------------
    // SHAPE TYPE
    // ------------------------------------
    if (shape.value === "circle") {
        // Can compute circle ONLY if numeric width/height present
        if (wNum && hNum) {
            const size = Math.min(wNum, hNum);
            style.width = size;
            style.height = size;
            style.borderRadius = size / 2;
        } else {
            // fallback: make circle-ish if no numbers
            style.borderRadius = 9999;
        }
    }

    if (shape.value === "stadium") {
        if (hNum) {
            style.borderRadius = hNum / 2;
        } else {
            // fallback if % height
            style.borderRadius = 9999;
        }
    }

    // ------------------------------------
    // ECCENTRICITY
    // ------------------------------------
    if (typeof shape.eccentricity === "number" && shape.eccentricity !== 0) {
        const e = 1 - shape.eccentricity;

        if (style.borderTopLeftRadius) style.borderTopLeftRadius *= e;
        if (style.borderTopRightRadius) style.borderTopRightRadius *= e;
        if (style.borderBottomLeftRadius) style.borderBottomLeftRadius *= e;
        if (style.borderBottomRightRadius) style.borderBottomRightRadius *= e;
    }

    return style;
}


// ------------------------------------------------------------
// INTERNAL: PARSE BORDER RADIUS "12,12,8,8"
// ------------------------------------------------------------
function _parseBorderRadius(raw: any) {
    if (!raw) return undefined;

    let parts: number[] = [];

    if (typeof raw === "string") {
        parts = raw
            .split(",")
            .map((v) => Number(v.trim()))
            .filter((v) => !isNaN(v));
    } else if (Array.isArray(raw)) {
        parts = raw.map((v) => Number(v));
    } else if (typeof raw === "number") {
        parts = [raw];
    }

    if (parts.length === 0) return undefined;

    let tl, tr, br, bl;

    switch (parts.length) {
        case 1:
            tl = tr = br = bl = parts[0];
            break;
        case 2:
            tl = tr = parts[0];
            br = bl = parts[1];
            break;
        case 3:
            tl = parts[0];
            tr = bl = parts[1];
            br = parts[2];
            break;
        default:
            [tl, tr, br, bl] = parts;
    }

    return {
        borderTopLeftRadius: tl,
        borderTopRightRadius: tr,
        borderBottomRightRadius: br,
        borderBottomLeftRadius: bl,
    };
}
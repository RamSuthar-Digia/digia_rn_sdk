import React from "react";
import { View, StyleSheet } from "react-native";

import { RenderPayload } from "../../framework/render_payload";
import { VirtualStatelessWidget, VirtualWidget } from "../base";
import { Props } from "../../framework/models/props";
import { To } from "../../framework/utils/type_convertors";
import { VWPositioned } from "./Positioned";
import { PositionedProps } from "../widget_props/position_props";

export class VWStack extends VirtualStatelessWidget<Props> {
    constructor(options: {
        props: Props;
        commonProps?: any;
        parentProps?: Props;
        childGroups?: Map<string, VirtualWidget[]>;
        parent?: VirtualWidget;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const children = this.children;
        if (!children || children.length === 0) return null;

        // Flutter-like stack alignment
        const alignment = stackChildAlignment(this.props.getString("childAlignment"));
        const fit = stackFit(this.props.get("fit"));

        const wrappedChildren = children.map(child => {
            return this.wrapPositioned(child).toWidget(payload);
        });

        return (
            <View
                style={[
                    styles.container,
                    {
                        justifyContent: alignment.justifyContent,
                        alignItems: alignment.alignItems,
                    },
                    fit === "expand" ? styles.expand : {},
                ]}
            >
                {wrappedChildren}
            </View>
        );
    }

    wrapPositioned(child: VirtualWidget): VirtualWidget {
        // Already positioned
        if (child instanceof VWPositioned) return child;

        const parentProps = child.parentProps;
        if (!parentProps) return child;

        const position = parentProps.get("position");
        if (!position) return child;

        return new VWPositioned({
            props: PositionedProps.fromJson(position),
            child,
            parent: null,
        });
    }
}

const styles = StyleSheet.create({
    container: {
        position: "relative", // base stack container
    },
    expand: {
        flex: 1,
    },
});


function stackChildAlignment(value?: string | null): {
    justifyContent: "flex-start" | "center" | "flex-end";
    alignItems: "flex-start" | "center" | "flex-end";
} {
    if (!value) {
        return { justifyContent: "center", alignItems: "center" }; // default flutter
    }

    const v = value.toLowerCase().trim();

    switch (v) {
        case "topleft":

            return { justifyContent: "flex-start", alignItems: "flex-start" };

        case "topcenter":

            return { justifyContent: "flex-start", alignItems: "center" };

        case "topright":
            return { justifyContent: "flex-start", alignItems: "flex-end" };

        case "centerleft":
            return { justifyContent: "center", alignItems: "flex-start" };

        case "center":
            return { justifyContent: "center", alignItems: "center" };

        case "centerright":
            return { justifyContent: "center", alignItems: "flex-end" };

        case "bottomleft":

            return { justifyContent: "flex-end", alignItems: "flex-start" };

        case "bottomcenter":

            return { justifyContent: "flex-end", alignItems: "center" };

        case "bottomright":
            return { justifyContent: "flex-end", alignItems: "flex-end" };

        default:
            return { justifyContent: "center", alignItems: "center" };
    }
};


function stackFit(value: any): "loose" | "expand" | "passthrough" {
    const v = (typeof value === "string" ? value.toLowerCase() : "") as string;

    switch (v) {
        case "expand":
            return "expand";

        case "passthrough":
            return "passthrough";

        case "loose":
        default:
            return "loose";
    }
}
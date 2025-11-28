import React from "react";
import { View } from "react-native";
import { VirtualStatelessWidget, VirtualWidget } from "../base";
import { RenderPayload } from "../../framework/render_payload";
import { PositionedProps } from "../widget_props/position_props";
import { componentSupportsStyle } from "../../framework/utils/widget_util";


export class VWPositioned extends VirtualStatelessWidget<PositionedProps> {
    constructor(options: {
        props: PositionedProps;
        parent: VirtualWidget | null;
        refName?: string;
        child: VirtualWidget;
    }) {
        super({
            ...options,
            commonProps: null,
            childGroups: { child: [options.child] },
        } as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        if (!this.child) return null;

        const p = this.props;

        const style: any = {
            position: "absolute",
        };

        if (p.top != null) style.top = p.top;
        if (p.bottom != null) style.bottom = p.bottom;
        if (p.left != null) style.left = p.left;
        if (p.right != null) style.right = p.right;

        if (p.width != null) style.width = p.width;
        if (p.height != null) style.height = p.height;

        const childWidget = this.child.toWidget(payload);

        // Merge styles correctly
        if (componentSupportsStyle(childWidget as React.ReactElement)) {
            return React.cloneElement(childWidget as React.ReactElement, {
                style: [
                    (childWidget as any).props?.style,
                    style,
                ],
            });
        }

        return <View style={style}>{childWidget}</View>;
    }
}

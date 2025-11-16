import React from 'react';
import { View, ViewStyle } from 'react-native';
import { VirtualLeafStatelessWidget } from '../base/VirtualLeafStatelessWidget';
import { AppBarProps } from '../widget_props/app_bar_props';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { VWText } from './text';
import { SimpleIcon } from '../internals/icon';
import { IconProps } from '../widget_props/icon_props';
import { NumUtil } from '../../framework/utils/num_util';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { wrapWidget } from '../../framework/utils/widget_util';

/**
 * AppBar virtual widget.
 * Renders a horizontal toolbar with optional leading/trailing icons and a title.
 */
export class VWAppBar extends VirtualLeafStatelessWidget<AppBarProps> {
    constructor(options: {
        props: AppBarProps;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        // Background and colors
        const backgroundColor = payload.evalColor(this.props.backgroundColor) ?? undefined;
        const iconColor = payload.evalColor(this.props.iconColor) ?? payload.evalColor(this.props.defaultButtonColor) ?? undefined;

        // Heights: try toolbarHeight then height
        const rawToolbarHeight = payload.evalExpr(this.props.toolbarHeight) ?? payload.evalExpr(this.props.height);
        const toolbarHeight = NumUtil.toDouble(rawToolbarHeight) ?? 56; // default toolbar height

        // Title widget
        const titleWidget = new VWText({ props: (this.props.title as any), parent: this });

        // Leading
        let leadingElement: React.ReactNode = null;
        const leadingIconJson = this.props.leadingIcon;
        if (leadingIconJson != null) {
            const leadingIconProps = IconProps.fromJson(leadingIconJson) ?? IconProps.empty();
            const size = payload.evalExpr(leadingIconProps.size) ?? 24;
            const color = payload.evalColor(leadingIconProps.color) ?? iconColor ?? '#000';
            const iconData = payload.getIcon(leadingIconProps.iconData);

            if (iconData) {
                const iconEl = <SimpleIcon {...iconData} size={size} color={color} />;
                leadingElement = wrapWidget({
                    payload,
                    actionFlow: this.props.onTapLeadingIcon ?? undefined,
                    child: iconEl,
                });
            }
        }

        // Trailing
        let trailingElement: React.ReactNode = null;
        const trailingIconJson = this.props.trailingIcon;
        if (trailingIconJson != null) {
            const trailingIconProps = IconProps.fromJson(trailingIconJson) ?? IconProps.empty();
            const size = payload.evalExpr(trailingIconProps.size) ?? 24;
            const color = payload.evalColor(trailingIconProps.color) ?? iconColor ?? '#000';
            const iconData = payload.getIcon(trailingIconProps.iconData);

            if (iconData) {
                trailingElement = <SimpleIcon {...iconData} size={size} color={color} />;
            }
        }

        // Title alignment
        const centerTitle = payload.evalExpr(this.props.centerTitle) ?? false;

        const containerStyle: ViewStyle = {
            height: toolbarHeight,
            backgroundColor: backgroundColor ?? undefined,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            justifyContent: centerTitle ? 'center' : 'space-between',
        };

        // Reserve side space so centered title stays centered
        const sideStyle: ViewStyle = { width: 56, alignItems: 'center', justifyContent: 'center' };

        return (
            <View style={containerStyle}>
                <View style={sideStyle}>
                    {leadingElement}
                </View>

                <View style={{ flex: 1, alignItems: centerTitle ? 'center' : 'flex-start', justifyContent: 'center' }}>
                    {titleWidget.toWidget(payload)}
                </View>

                <View style={sideStyle}>
                    {trailingElement}
                </View>
            </View>
        );
    }
}

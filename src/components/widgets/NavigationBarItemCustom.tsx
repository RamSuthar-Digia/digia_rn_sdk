import React from 'react';
import { View } from 'react-native';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { RenderPayload } from '../../framework/render_payload';
import { NavigationBarProps } from '../widget_props/nav_bar_props';

/**
 * Custom navigation bar item that uses child groups 'selected' and 'unselected'.
 */
export class VWNavigationBarItemCustom extends VirtualStatelessWidget<any> {
    constructor(options: any) {
        super(options);
    }

    render(payload: RenderPayload): React.ReactNode {
        const itemIndex = (this as any).props?.itemIndex ?? null;

        // Choose child group based on context (selected vs unselected).
        // For simplicity, render 'selected' group if present, otherwise 'unselected' or fallback to children.
        const selected = this.childGroups?.get('selected')?.[0];
        const unselected = this.childGroups?.get('unselected')?.[0];

        const node = selected?.toWidget(payload) ?? unselected?.toWidget(payload) ?? this.child;

        return <View>{node as any}</View>;
    }
}

export default VWNavigationBarItemCustom;

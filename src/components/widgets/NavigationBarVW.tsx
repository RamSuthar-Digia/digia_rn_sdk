import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { NavigationBarProps } from '../widget_props/nav_bar_props';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import BottomTabsNavigator, { BottomTabEntry } from '../BottomTabsNavigator';

/**
 * VWNavigationBar (virtual) - builds a bottom-tabs navigator from child items.
 * Children are expected to be NavigationBarItemDefault/Custom virtual widgets
 * which will be rendered inside each tab.
 */
export class VWNavigationBar extends VirtualStatelessWidget<NavigationBarProps> {
    constructor(options: any) {
        super(options);
    }

    render(payload: RenderPayload): React.ReactNode {
        const children = this.childrenOf('children') ?? [];

        const tabs: BottomTabEntry[] = children.map((child, idx) => {
            const name = (child.refName && String(child.refName)) || `tab_${idx}`;

            // Component that renders the child widget using the captured payload
            const Comp = () => {
                return child.toWidget(payload) as any;
            };

            // Try to extract a title/label from child's props if available
            let title: string | undefined;
            try {
                // some virtual widgets expose props.getString('label')
                // @ts-ignore
                title = child['props']?.getString?.('label') ?? undefined;
            } catch (e) {
                title = undefined;
            }

            return {
                name,
                component: Comp,
                initialParams: {},
                options: { title: title ?? name },
            } as BottomTabEntry;
        });

        return <BottomTabsNavigator tabs={tabs} initialRouteName={tabs[0]?.name} />;
    }
}

export default VWNavigationBar;

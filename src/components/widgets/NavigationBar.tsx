import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { NavigationBarProps } from '../widget_props/nav_bar_props';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import BottomNavigationBarInternal from '../internal_widgets/bottom_navigation_bar/bottom_navigation_bar';
import { ActionFlow } from '../../framework/actions/base/action_flow';

/**
 * VWNavigationBar - maps server-driven navigation bar props and children
 * to an internal BottomNavigationBar implementation.
 */
export class VWNavigationBar extends VirtualStatelessWidget<NavigationBarProps> {
    onDestinationSelected?: (index: number) => void;
    selectedIndex: number;

    constructor(options: {
        props: NavigationBarProps;
        commonProps?: any;
        parentProps?: any;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
        onDestinationSelected?: (index: number) => void;
        selectedIndex?: number;
    }) {
        super(options as any);
        this.onDestinationSelected = options.onDestinationSelected;
        this.selectedIndex = options.selectedIndex ?? 0;
    }

    handleDestinationSelected(index: number, payload: RenderPayload) {
        const children = this.childrenOf('children') ?? [];
        const selectedChild = children[index];

        // If selected child contains an onSelect action, try to execute it
        try {
            const onSelect = (selectedChild as any)?.props?.onSelect as any | undefined;
            const actionJson = onSelect?.['action'];
            if (actionJson) {
                const actionFlow = ActionFlow.fromJson(actionJson);
                if (actionFlow) {
                    payload.executeAction(actionFlow, { triggerType: 'onPageSelected' });
                }
            }
        } catch (e) {
            // swallow errors from malformed child props
        }

        this.onDestinationSelected?.(index);
    }

    render(payload: RenderPayload): React.ReactNode {
        const destinations = this.childrenOf('children')?.map((c) => c.toWidget(payload)) ?? [];

        // Prefer using react-native-paper's BottomNavigation when available
        // to leverage a well-tested, material implementation. Fall back to
        // the internal BottomNavigationBar otherwise.
        let Paper: any = null;
        try {
            // runtime require so the package is optional
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            Paper = require('react-native-paper');
        } catch (e) {
            Paper = null;
        }

        if (Paper && Paper.BottomNavigation) {
            // Build routes and scene map for Paper BottomNavigation
            const routes: any[] = destinations.map((dest, i) => ({ key: `r${i}`, title: (this.childrenOf('children')?.[i] as any)?.props?.label ?? `Page ${i}` }));

            const sceneMap: Record<string, any> = {};
            destinations.forEach((dest, i) => {
                // each scene is a function that returns the rendered destination
                sceneMap[`r${i}`] = () => dest;
            });

            const NavigationComp = Paper.BottomNavigation as any;

            return (
                <NavigationComp
                    navigationState={{ index: this.selectedIndex ?? 0, routes }}
                    onIndexChange={(idx: number) => this.handleDestinationSelected(idx, payload)}
                    renderScene={(route: any) => {
                        const fn = sceneMap[route.key];
                        return fn ? fn() : null;
                    }}
                />
            );
        }

        // Fallback to internal implementation when paper is not available
        return (
            <BottomNavigationBarInternal
                backgroundColor={payload.evalColorExpr(this.props.backgroundColor) ?? undefined}
                animationDuration={payload.evalExpr(this.props.animationDuration) ?? undefined}
                selectedIndex={this.selectedIndex}
                destinations={destinations}
                onDestinationSelected={(idx) => this.handleDestinationSelected(idx, payload)}
                surfaceTintColor={payload.evalColorExpr(this.props.surfaceTintColor) ?? undefined}
                indicatorColor={payload.evalColorExpr(this.props.indicatorColor) ?? undefined}
                height={payload.evalExpr(this.props.height) ?? undefined}
                elevation={payload.evalExpr(this.props.elevation) ?? undefined}
                labelBehavior={payload.evalExpr(this.props.showLabels) ?? true ? 'alwaysShow' : 'alwaysHide'}
                borderRadius={this.props.borderRadius ? (this.props.borderRadius as any) : undefined}
                shadow={this.props.shadow ?? undefined}
            />
        );
    }
}

export default VWNavigationBar;


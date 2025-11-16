import React from 'react';
import { View, Text as RNText } from 'react-native';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { FlexFitProps } from '../widget_props/flex_fit_props';
import { Props } from '../../framework/models/props';
import { useConstraints, LayoutProvider } from '../../framework/utils/react-native-constraint-system';

/**
 * VWFlexFit
 * - 'tight' -> Expanded equivalent: force child to fill available space (flex)
 * - 'loose' -> Flexible equivalent: allow child to be flexible but keep intrinsic sizing when possible
 */
export class VWFlexFit extends VirtualStatelessWidget<FlexFitProps> {
    constructor(options: {
        props: FlexFitProps;
        parent?: VirtualWidget;
        parentProps?: Props;
        refName?: string;
        childGroups?: Map<string, VirtualWidget[]>;
        commonProps?: any;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const child = this.child;
        if (!child) return this.empty();

        const flexFitType = this.props.flexFitType ?? undefined;
        const flexValue = this.props.flexValue ?? 1;

        // Wrap in functional component to use constraints hook
        const FlexFitContent = () => {
            const ctx = useConstraints();
            const childElement = child.toWidget(payload) as React.ReactElement;
            const maxWidth = ctx?.constraints.maxWidth;

            if (flexFitType === 'tight') {
                // Expanded: make child fill available space
                // Apply maxWidth constraint to prevent overflow
                return (
                    <View style={{
                        flex: flexValue,
                        maxWidth: maxWidth && isFinite(maxWidth) ? maxWidth : undefined,
                    }}>
                        {childElement}
                    </View>
                );
            }

            if (flexFitType === 'loose') {
                // Flexible (loose): allow child to size itself but give it flexGrow
                // Apply maxWidth constraint to prevent overflow
                return (
                    <View style={{
                        flexGrow: flexValue,
                        flexShrink: 1,
                        maxWidth: maxWidth && isFinite(maxWidth) ? maxWidth : undefined,
                    }}>
                        {childElement}
                    </View>
                );
            }

            // No flex behavior requested
            return childElement;
        };

        return <FlexFitContent />;
    }
}

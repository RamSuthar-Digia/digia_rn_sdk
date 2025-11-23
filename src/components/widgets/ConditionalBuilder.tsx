import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { Props } from '../../framework/models/props';
import { RenderPayload } from '../../framework/render_payload';
import VWConditionalItem from './ConditionalItem';

/**
 * VWConditionalBuilder - selects first conditional child that evaluates to true
 * and renders it. If no conditional child matches, renders nothing.
 */
export class VWConditionalBuilder extends VirtualStatelessWidget<Props> {
    constructor(options: {
        props?: Props;
        commonProps?: any;
        parentProps?: any;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const conditionalChildren = this.children?.filter((c) => {
            // Consider a child a conditional item if it exposes an evaluate method
            return typeof (c as any).evaluate === 'function';
        }) as VWConditionalItem[] | undefined;

        if (!conditionalChildren || conditionalChildren.length === 0) return this.empty();

        const match = conditionalChildren.find((c) => {
            try {
                return (c as any).evaluate(payload) === true;
            } catch (e) {
                // ignore evaluation errors and treat as non-matching
                // eslint-disable-next-line no-console
                console.error('ConditionalBuilder evaluation error:', e);
                return false;
            }
        });

        if (!match) return this.empty();

        return match.toWidget(payload) ?? this.empty();
    }
}

export default VWConditionalBuilder;

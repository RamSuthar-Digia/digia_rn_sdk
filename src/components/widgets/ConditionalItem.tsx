import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { ConditionalItemProps } from '../internals/conditional_item_props';

/**
 * VWConditionalItem - renders its child only when the provided condition
 * expression evaluates to true. If no condition is provided, the item
 * evaluates to false (won't render the child).
 */
export class VWConditionalItem extends VirtualStatelessWidget<ConditionalItemProps> {
    constructor(options: {
        props: ConditionalItemProps;
        commonProps?: any;
        parentProps?: any;
        parent?: VirtualWidget;
        childGroups?: Map<string, VirtualWidget[]>;
        refName?: string;
    }) {
        super(options as any);
    }

    private evaluate(payload: RenderPayload): boolean {
        // Evaluate the condition expression in the current payload scope
        const cond = this.props.condition ? payload.evalExpr<boolean>(this.props.condition) : null;
        return cond ?? false;
    }

    render(payload: RenderPayload): React.ReactNode {
        if (!this.evaluate(payload)) return this.empty();
        return this.child?.toWidget(payload) ?? this.empty();
    }
}

export default VWConditionalItem;

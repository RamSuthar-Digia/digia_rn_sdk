import React from 'react';
import { VirtualWidget } from '../base/VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';

/**
 * A VirtualWidget wrapper that renders a React component directly.
 * 
 * Used to bridge the gap between React components (like DUIComponent)
 * and VirtualWidget-based rendering system.
 */
export class ComponentVirtualWidget extends VirtualWidget {
    private readonly component: React.ReactElement;

    constructor(component: React.ReactElement, parent?: VirtualWidget) {
        super({ parent });
        this.component = component;
    }

    render(payload: RenderPayload): React.ReactNode {
        return this.component;
    }

    toWidget(payload: RenderPayload): React.ReactElement {
        return this.component;
    }
}

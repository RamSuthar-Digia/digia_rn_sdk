import React from 'react';
import { RenderPayload } from '../../framework/render_payload';
import { Props } from '../../framework/models/props';

/**
 * Base class for all virtual widgets in the Digia RN SDK.
 * Equivalent to Flutter's VirtualWidget.
 * 
 * VirtualWidget provides:
 * - Abstract render method for subclasses to implement
 * - Weak reference to parent to avoid circular references
 * - Reference name for debugging/identification
 * - Parent props for component communication
 */
export abstract class VirtualWidget {
  readonly refName?: string;
  private readonly _parent?: WeakRef<VirtualWidget>;
  parentProps?: Props;

  /**
   * Gets the parent widget (may be undefined if garbage collected).
   */
  get parent(): VirtualWidget | undefined {
    return this._parent?.deref();
  }

  constructor(options: {
    refName?: string;
    parent?: VirtualWidget;
    parentProps?: Props;
  }) {
    this.refName = options.refName;
    this._parent = options.parent ? new WeakRef(options.parent) : undefined;
    this.parentProps = options.parentProps;
  }

  /**
   * Renders the widget with the given payload.
   * 
   * Subclasses must implement this method to define their rendering logic.
   * 
   * @param payload - The render payload containing context and utilities
   * @returns React node to render
   */
  abstract render(payload: RenderPayload): React.ReactNode;

  /**
   * Returns an empty widget (null in React).
   * 
   * Equivalent to Flutter's SizedBox.shrink().
   * 
   * @returns null
   */
  empty(): React.ReactNode {
    return null;
  }

  /**
   * Converts this virtual widget to a React component.
   * 
   * By default, delegates to render(). Subclasses can override
   * for custom conversion logic.
   * 
   * @param payload - The render payload
   * @returns React node to render
   */
  toWidget(payload: RenderPayload): React.ReactNode {
    return this.render(payload);
  }
}

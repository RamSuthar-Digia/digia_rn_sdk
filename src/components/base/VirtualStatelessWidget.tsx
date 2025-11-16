import React from 'react';
import { VirtualLeafStatelessWidget } from './VirtualLeafStatelessWidget';
import { VirtualWidget } from './VirtualWidget';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';

/**
 * Base class for stateless virtual widgets
 * Equivalent to Flutter's VirtualStatelessWidget
 */
export abstract class VirtualStatelessWidget<T = any> extends VirtualLeafStatelessWidget<T> {
  childGroups?: Map<string, VirtualWidget[]>;

  constructor(options: {
    props: T;
    commonProps?: CommonProps;
    parentProps?: Props;
    parent?: VirtualWidget;
    refName?: string;
    childGroups?: Map<string, VirtualWidget[]>;
  }) {
    super({
      props: options.props,
      commonProps: options.commonProps,
      parent: options.parent,
      refName: options.refName,
      parentProps: options.parentProps,
    });
    this.childGroups = options.childGroups;
  }

  /**
   * Get single child by key
   */
  childOf(key: string): VirtualWidget | undefined {
    const children = this.childGroups?.get(key);
    return children?.[0];
  }

  /**
   * Get multiple children by key
   */
  childrenOf(key: string): VirtualWidget[] | undefined {
    return this.childGroups?.get(key);
  }

  /**
   * Get child widget
   */
  get child(): VirtualWidget | undefined {
    return this.childOf('child');
  }

  /**
   * Get children widgets
   */
  get children(): VirtualWidget[] | undefined {
    return this.childrenOf('children');
  }
}

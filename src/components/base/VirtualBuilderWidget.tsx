import React from 'react';
import { View, Text } from 'react-native';
import { VirtualWidget } from './VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { wrapWidget } from '../../framework/utils/widget_util';

/**
 * Widget that uses a builder function to render
 * Equivalent to Flutter's VirtualBuilderWidget
 */
export class VirtualBuilderWidget extends VirtualWidget {
  private builder: (payload: RenderPayload) => React.ReactNode;
  commonProps?: CommonProps;
  extendHierarchy: boolean;

  constructor(
    builder: (payload: RenderPayload) => React.ReactNode,
    options: {
      commonProps?: CommonProps;
      parentProps?: Props;
      refName?: string;
      parent?: VirtualWidget;
      extendHierarchy?: boolean;
    }
  ) {
    super({
      refName: options.refName,
      parent: options.parent,
      parentProps: options.parentProps,
    });
    this.builder = builder;
    this.commonProps = options.commonProps;
    this.extendHierarchy = options.extendHierarchy ?? true;
  }

  render(payload: RenderPayload): React.ReactNode {
    return this.builder(payload);
  }

  toWidget(payload: RenderPayload): React.ReactNode {
    try {
      // Extend hierarchy if requested and refName exists 
      const extendedPayload =
        this.extendHierarchy && this.refName
          ? payload.withExtendedHierarchy(this.refName)
          : payload;

      if (!this.commonProps) {
        return this.render(extendedPayload);
      }

      // Check visibility
      const isVisible =
        this.commonProps.visibility?.evaluate(extendedPayload.context.scopeContext) ?? true;
      if (!isVisible) {
        return this.empty();
      }

      let current = this.render(extendedPayload);

      // Apply styling, alignment, gestures, etc. using shared wrapper
      if (this.commonProps) {
        return wrapWidget({
          payload: extendedPayload,
          style: this.commonProps,
          child: current as React.ReactNode,
          actionFlow: (this.commonProps as any)?.onClick ?? null,
        });
      }

      return current;
    } catch (error) {
      // Error handling - show error widget in development
      if (__DEV__) {
        return (
          <View style={{ padding: 16, backgroundColor: '#F9E6EB' }}>
            <Text style={{ color: 'red', fontWeight: 'bold' }}>
              Error Rendering Widget {this.refName}
            </Text>
            <Text style={{ color: '#000', marginTop: 8 }}>
              {error instanceof Error ? error.message : String(error)}
            </Text>
          </View>
        );
      }
      throw error;
    }
  }
}

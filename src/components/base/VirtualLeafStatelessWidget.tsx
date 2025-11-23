import React from 'react';
import { View } from 'react-native';
import { VirtualWidget } from './VirtualWidget';
import { RenderPayload } from '../../framework/render_payload';
import { CommonProps } from '../../framework/models/common_props';
import { To } from '../../framework/utils/type_convertors';
import { DefaultErrorWidget } from './default_error_widget';
import { wrapWidget } from '../../framework/utils/widget_util';
import { Props } from '../../framework/models/props';

export abstract class VirtualLeafStatelessWidget<T> extends VirtualWidget {
    props: T;
    commonProps?: CommonProps;

    constructor(options: {
        props: T;
        commonProps?: CommonProps;
        parent?: VirtualWidget;
        refName?: string;
        parentProps?: Props;
    }) {
        super({
            parent: options.parent,
            refName: options.refName,
            parentProps: options.parentProps,
        });
        this.props = options.props;
        this.commonProps = options.commonProps;
    }

    toWidget(payload: RenderPayload): React.ReactElement {
        try {
            // Extend hierarchy with this widget's name for observability
            const extendedPayload =
                this.refName != null
                    ? payload.withExtendedHierarchy(this.refName)
                    : payload;
            if (this.commonProps == null) {
                const rendered = this.render(extendedPayload);
                return rendered as React.ReactElement;
            }

            const isVisible =
                this.commonProps?.visibility?.evaluate(extendedPayload.context.scopeContext) ??
                true;
            if (!isVisible) {
                return this.empty() as React.ReactElement;
            }

            let current = this.render(extendedPayload) as React.ReactElement;

            // Styling
            current = wrapWidget({
                payload: extendedPayload,
                style: this.commonProps,
                aspectRatio: null,
                child: current,
                actionFlow: this.commonProps?.onClick ?? null,
            });



            return current;
        } catch (error) {
            // In debug mode or dashboard, show error widget
            if (__DEV__) {
                return (
                    <DefaultErrorWidget
                        refName={this.refName}
                        errorMessage={String(error)}
                        errorDetails={error}
                    />
                );
            } else {
                throw error;
            }
        }
    }

    empty(): React.ReactElement {
        return <View style={{ display: 'none' }} />;
    }
}

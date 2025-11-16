import React from 'react';
import { View, ScrollView, ViewStyle } from 'react-native';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { DefaultScopeContext } from '../../framework/expr/default_scope_context';
import { ScopeContext } from '../../framework/expr/scope_context';
import { Props } from '../../framework/models/props';
import { RenderPayload } from '../../framework/render_payload';
import { To } from '../../framework/utils/type_convertors';
import { FlexFitProps } from '../widget_props/flex_fit_props';
import { VWFlexFit } from './FlexFit';
import { CommonProps } from '../../framework/models/common_props';
import { LayoutProvider } from '../../framework/utils/react-native-constraint-system';

export class VWFlex extends VirtualStatelessWidget<Props> {
    direction: 'horizontal' | 'vertical';

    constructor(options: {
        direction: 'horizontal' | 'vertical';
        props: Props;
        commonProps?: CommonProps;
        parent?: VirtualWidget;
        refName?: string;
        childGroups?: Map<string, VirtualWidget[]>;
    }) {
        super(options as any);
        this.direction = options.direction;
    }

    get shouldRepeatChild(): boolean {
        return this.props.get('dataSource') != null;
    }

    render(payload: RenderPayload): React.ReactNode {
        const children = this.children;
        if (!children || children.length === 0) return this.empty();

        const flexWidget = this.shouldRepeatChild
            ? this._buildRepeatingFlex(payload)
            : this._buildStaticFlex(payload);

        return this._wrapWithScrollViewIfNeeded(flexWidget);
    }

    private _buildRepeatingFlex(payload: RenderPayload): React.ReactElement {
        const childToRepeat = this.children![0];
        const data = payload.eval<any[]>(this.props.get('dataSource')) ?? [];

        const nodes = data.map((item, index) => {
            const scoped = payload.copyWithChainedContext(
                this._createExprContext(item, index)
            );
            return this._wrapInFlexFit(childToRepeat, scoped).toWidget(scoped);
        });

        return this._buildFlex(() => nodes);
    }

    private _buildStaticFlex(payload: RenderPayload): React.ReactElement {
        const nodes = this.children!
            .map((child) => this._wrapInFlexFit(child, payload))
            .map((vw) => vw.toWidget(payload));

        return this._buildFlex(() => nodes);
    }

    private _wrapWithScrollViewIfNeeded(flexWidget: React.ReactElement): React.ReactElement {
        const isScrollable = this.props.getBool('isScrollable') === true;
        if (!isScrollable) return flexWidget;

        const horizontal = this.direction === 'horizontal';

        return (
            <ScrollView
                horizontal={horizontal}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 0,            // 🔥 IMPORTANT: shrink-wrap (Flutter behavior)
                    flexDirection: horizontal ? 'row' : 'column',
                    alignItems: 'flex-start',
                }}
            >
                {flexWidget}
            </ScrollView>
        );
    }

    private _wrapInFlexFit(child: VirtualWidget, payload: RenderPayload): VirtualWidget {
        if (child instanceof VWFlexFit) return child;

        const parentProps = (child as any).parentProps as Props | null;
        if (!parentProps) return child;

        const type = parentProps.getString('expansion.type') ?? null;
        const flexValue = payload.eval<number>(parentProps.get('expansion.flexValue')) ?? 1;
        if (type === null) return child;

        return new VWFlexFit({
            props: new FlexFitProps({
                flexFitType: type,
                flexValue,
            }),
            parent: this,
            childGroups: new Map([['child', [child]]]),
        } as any);
    }

    private _buildFlex(childrenBuilder: () => React.ReactNode[]): React.ReactElement {
        const spacing = this.props.getDouble('spacing') ?? 0;
        const startSpacing = this.props.getDouble('startSpacing') ?? 0;
        const endSpacing = this.props.getDouble('endSpacing') ?? 0;

        const justifyContent = To.mainAxisAlignment(this.props.get('mainAxisAlignment')) ?? 'flex-start';
        const alignItems = To.crossAxisAlignment(this.props.get('crossAxisAlignment')) ?? 'center';

        const direction = this.direction === 'horizontal' ? 'row' : 'column';

        const children = childrenBuilder();

        // ➤ build child's list with spacing
        const spaced: React.ReactNode[] = [];

        // start
        if (startSpacing > 0) {
            spaced.push(
                <View
                    key="start"
                    style={{
                        width: direction === 'row' ? startSpacing : undefined,
                        height: direction === 'column' ? startSpacing : undefined,
                    }}
                />
            );
        }

        children.forEach((c, i) => {
            spaced.push(
                <React.Fragment key={`child-${i}`}>{c}</React.Fragment>
            );
            if (i < children.length - 1 && spacing > 0) {
                spaced.push(
                    <View
                        key={`space-${i}`}
                        style={{
                            width: direction === 'row' ? spacing : undefined,
                            height: direction === 'column' ? spacing : undefined,
                        }}
                    />
                );
            }
        });

        // end
        if (endSpacing > 0) {
            spaced.push(
                <View
                    key="end"
                    style={{
                        width: direction === 'row' ? endSpacing : undefined,
                        height: direction === 'column' ? endSpacing : undefined,
                    }}
                />
            );
        }

        const containerStyle: ViewStyle = {
            flexDirection: direction as any,
            justifyContent: justifyContent as any,
            alignItems: alignItems as any,
            // flex: 1, // Allow flex to fill parent
        };

        // Wrap in LayoutProvider so children know the available space
        // This fixes the issue where Flexible children don't know parent width
        return (
            <LayoutProvider style={containerStyle}>
                {spaced}
            </LayoutProvider>
        );
    }

    private _createExprContext(item: any, index: number): ScopeContext {
        return new DefaultScopeContext({
            variables: { currentItem: item, index },
        });
    }
}

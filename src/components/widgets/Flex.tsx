import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { View, ScrollView, ViewStyle, LayoutChangeEvent, StyleSheet } from 'react-native';
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
import { LayoutProvider, useConstraints, isWidthBounded, isHeightBounded, clampToConstraints } from '../../framework/utils/react-native-constraint-system';
import type { BoxConstraints } from '../../framework/utils/react-native-constraint-system';

const ParentDirectionContext = React.createContext<'row' | 'column' | undefined>(undefined);

export class VWFlex extends VirtualStatelessWidget<Props> {
    direction: 'horizontal' | 'vertical';

    constructor(options: {
        direction: 'horizontal' | 'vertical';
        props: Props;
        commonProps?: CommonProps;
        parentProps?: Props;
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
            const vw = this._wrapInFlexFit(childToRepeat, scoped);
            const node = vw.toWidget(scoped);

            return (
                React.cloneElement(node as React.ReactElement, { key: `rep_${index}` })
            );
        });

        return this._buildFlex(() => nodes);
    }

    private _buildStaticFlex(payload: RenderPayload): React.ReactElement {
        const nodes = this.children!
            .map((child, idx) => {
                const vw = this._wrapInFlexFit(child, payload);
                const node = vw.toWidget(payload);
                return (
                    React.cloneElement(node as React.ReactElement, { key: `c_${idx}` })
                );
            });

        return this._buildFlex(() => nodes);
    }

    private _wrapWithScrollViewIfNeeded(flexWidget: React.ReactElement): React.ReactElement {
        const isScrollable = this.props.getBool('isScrollable') === true;
        if (!isScrollable) return flexWidget;

        const horizontal = this.direction === 'horizontal';

        const Scrollable: React.FC = () => {
            const parentDirection = React.useContext(ParentDirectionContext);
            const ctx = useConstraints();
            const parentConstraints = ctx?.constraints ?? null;



            return (
                <ScrollView
                    horizontal={horizontal}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        flexDirection: horizontal ? 'row' : 'column',
                    }}
                >
                    {/* <LayoutProvider style={{ ...ctx?.constraints, ...(horizontal ? { maxWidth: Infinity } : { maxHeight: Infinity }) }}> */}
                    {flexWidget}
                    {/* </LayoutProvider> */}

                </ScrollView>
            );
        };

        return <Scrollable />;

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
        const mainAxisSize = (this.props.getString('mainAxisSize') ?? 'max') as 'min' | 'max';
        const justifyContent = To.mainAxisAlignment(this.props.get('mainAxisAlignment')) ?? 'flex-start';
        const alignItems = To.crossAxisAlignment(this.props.get('crossAxisAlignment')) ?? 'stretch';
        const direction = this.direction === 'horizontal' ? 'row' : 'column';

        const FlexContainer: React.FC = () => {
            const parentDirection = React.useContext(ParentDirectionContext);
            const ctx = useConstraints();
            const parentConstraints = ctx?.constraints ?? null;

            // build children *here* so they are created after hooks are available
            const builtChildren = childrenBuilder();

            const containerStyle: ViewStyle = {
                flexDirection: direction,
                justifyContent: justifyContent as any,
                alignItems: alignItems as any,
                gap: spacing,
                paddingStart: startSpacing,
                paddingEnd: endSpacing,
                // alignSelf: 'flex-start',
                ...this._getFlutterAccurateMainAxisSize(mainAxisSize, direction, parentConstraints),
            };

            return (
                // <ParentDirectionContext.Provider value={direction}>
                <View style={{ ...containerStyle }}>
                    {/* <LayoutProvider style={containerStyle}> */}
                    {builtChildren}
                    {/* </LayoutProvider> */}
                </View>
                // {/* </ParentDirectionContext.Provider> */ }
            );
        };

        return <FlexContainer />;
    }



    private _getFlutterAccurateMainAxisSize(
        mainAxisSize: 'min' | 'max',
        direction: 'row' | 'column',
        parentConstraints?: BoxConstraints | null,
    ): ViewStyle {

        // const mainBounded =
        //     direction === 'row'
        //         ? isWidthBounded(parentConstraints)
        //         : isHeightBounded(parentConstraints);

        let style: ViewStyle = {};

        // ----------------------------------------------------
        // ① mainAxisSize.min → always shrink wrap
        // ----------------------------------------------------
        if (mainAxisSize === 'min') {
            style = {
                // flexGrow: 0,
                // flexShrink: 1,
                // flexBasis: 'auto',
            };
        }
        // ----------------------------------------------------
        // ② mainAxisSize.max & MAIN AXIS BOUNDED → expand in OWN direction
        // ----------------------------------------------------
        // else if (mainBounded) {
        //     // ✅ Expand in the flex container's OWN main axis direction
        //     if (direction === 'row') {
        //         style = {
        //             width: '100%',  // Expand horizontally
        //             flexShrink: 1,
        //         };
        //     } else {
        //         style = {
        //             height: '100%', // Expand vertically
        //             flexShrink: 1,
        //         };
        //     }
        // }
        // ----------------------------------------------------
        // ③ mainAxisSize.max & MAIN AXIS UNBOUNDED → grow to fit children
        // ----------------------------------------------------
        else {
            style = {
                flex: 1,
            };
        }

        return style;
    }


    private _createExprContext(item: any, index: number): ScopeContext {
        return new DefaultScopeContext({
            variables: { currentItem: item, index },
        });
    }
}

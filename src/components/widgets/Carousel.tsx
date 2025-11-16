import React from 'react';
import { VirtualStatelessWidget } from '../base/VirtualStatelessWidget';
import { VirtualWidget } from '../base/VirtualWidget';
import { DefaultScopeContext } from '../../framework/expr/default_scope_context';
import { ScopeContext } from '../../framework/expr/scope_context';
import InternalCarousel from '../internals/carousel';
import { RenderPayload } from '../../framework/render_payload';
import { ExtentUtil } from '../../framework/utils/extensions';
import { CarouselProps } from '../widget_props/carousel_props';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { as$ } from '../../framework';

/**
 * VWCarousel - Virtual widget wrapper for the internal carousel implementation.
 * Supports repeating child via `dataSource` and single-child mode.
 */
export class VWCarousel extends VirtualStatelessWidget<CarouselProps> {
    constructor(options: {
        props: CarouselProps;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        refName?: string;
        childGroups?: Map<string, VirtualWidget[]>;
    }) {
        super(options as any);
    }

    private get shouldRepeatChild(): boolean {
        return this.props.dataSource != null;
    }

    render(payload: RenderPayload): React.ReactNode {
        const child = this.child;
        if (!child) return this.empty();

        if (this.shouldRepeatChild) {
            const items = payload.eval<any[]>(this.props.dataSource?.evaluate(payload.context.scopeContext)) ?? [];

            return (
                <InternalCarousel
                    itemCount={items.length}
                    itemBuilder={({ index }: { index: number }) =>
                        child.toWidget(
                            payload.copyWithChainedContext(this._createExprContext(items[index], index))
                        )
                    }
                    width={this._resolveWidth(payload)}
                    height={this._resolveHeight(payload)}
                    direction={this.props.direction === 'vertical' ? 'vertical' : 'horizontal'}
                    aspectRatio={this.props.aspectRatio ?? 0.25}
                    autoPlay={this.props.autoPlay ?? false}
                    showIndicator={this.props.showIndicator ?? false}
                    animationDuration={this.props.animationDuration ?? 800}
                    autoPlayInterval={this.props.autoPlayInterval ?? 1600}
                    infiniteScroll={this.props.infiniteScroll ?? false}
                    initialPage={payload.evalExpr(this.props.initialPage) ?? 0}
                    pageSnapping={this.props.pageSnapping ?? true}
                    viewportFraction={this.props.viewportFraction ?? 0.8}
                    enlargeFactor={this.props.enlargeFactor ?? 0.3}
                    enlargeCenterPage={this.props.enlargeCenterPage ?? false}
                    reverseScroll={this.props.reverseScroll ?? false}
                    offset={this.props.offset ?? 16}
                    padEnds={this.props.padEnds ?? false}
                    dotHeight={this.props.dotHeight ?? 8}
                    dotWidth={this.props.dotWidth ?? 8}
                    spacing={this.props.spacing ?? 16}
                    keepAlive={this.props.keepAlive ?? false}
                    dotColor={payload.evalColorExpr(this.props.dotColor) ?? undefined}
                    activeDotColor={payload.evalColorExpr(this.props.activeDotColor) ?? undefined}
                    indicatorEffectType={this.props.indicatorEffectType as any ?? 'slide'}
                    onChanged={async (index: number) => {
                        await payload.executeAction(this.props.onChanged ?? undefined, {
                            scopeContext: this._createExprContextForAction(index),
                        } as any);
                    }}
                />
            );
        }

        // Single child mode
        return (
            <InternalCarousel
                width={this._resolveWidth(payload)}
                height={this._resolveHeight(payload)}
                direction={this.props.direction === 'vertical' ? 'vertical' : 'horizontal'}
                aspectRatio={this.props.aspectRatio ?? 0.25}
                autoPlay={this.props.autoPlay ?? false}
                animationDuration={this.props.animationDuration ?? 800}
                autoPlayInterval={this.props.autoPlayInterval ?? 1600}
                infiniteScroll={this.props.infiniteScroll ?? false}
                pageSnapping={this.props.pageSnapping ?? true}
                initialPage={payload.evalExpr(this.props.initialPage) ?? 0}
                padEnds={this.props.padEnds ?? false}
                viewportFraction={this.props.viewportFraction ?? 0.8}
                enlargeFactor={this.props.enlargeFactor ?? 0.3}
                enlargeCenterPage={this.props.enlargeCenterPage ?? false}
                reverseScroll={this.props.reverseScroll ?? false}
                offset={this.props.offset ?? 16}
                dotHeight={this.props.dotHeight ?? 8}
                dotWidth={this.props.dotWidth ?? 8}
                spacing={this.props.spacing ?? 16}
                showIndicator={this.props.showIndicator ?? false}
                keepAlive={this.props.keepAlive ?? false}
                dotColor={payload.evalColorExpr(this.props.dotColor) ?? undefined}
                activeDotColor={payload.evalColorExpr(this.props.activeDotColor) ?? undefined}
                indicatorEffectType={this.props.indicatorEffectType as any ?? 'slide'}
                children={[child.toWidget(payload)]}
                onChanged={async (index: number) => {
                    await payload.executeAction(this.props.onChanged ?? undefined, {
                        scopeContext: this._createExprContextForAction(index),
                    } as any);
                }}
            />
        );
    }

    private _resolveWidth(payload: RenderPayload): number | undefined {
        const val = as$<string>(this.props.width ?? null);
        if (val == null) return undefined;
        const parsed = ExtentUtil.toWidth(String(val));
        return parsed ?? undefined;
    }

    private _resolveHeight(payload: RenderPayload): number | undefined {
        const val = as$<string>(this.props.height ?? null);
        if (val == null) return undefined;
        const parsed = ExtentUtil.toHeight(String(val));
        return parsed ?? undefined;
    }

    private _createExprContextForAction(index: number) {
        return new DefaultScopeContext({ variables: { index } });
    }

    private _createExprContext(item: any, index: number): ScopeContext {
        const carouselObj = { currentItem: item, index };
        const vars: Record<string, any> = { ...carouselObj };
        // optionally expose refName as variable name mapping — keep simple here
        return new DefaultScopeContext({ variables: vars });
    }
}

export default VWCarousel;

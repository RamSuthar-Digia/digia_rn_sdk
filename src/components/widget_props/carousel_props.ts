import { as$, ExprOr, JsonLike } from "../../framework";
import { ActionFlow } from "../../framework/actions/base/action_flow";
import { NumUtil } from "../../framework/utils/num_util";
import { To } from "../../framework/utils/type_convertors";

export enum Axis {
    horizontal = 'horizontal',
    vertical = 'vertical'
}

export enum IndicatorEffectType {
    slide = 'slide',
    dot = 'dot',
    worm = 'worm',
    color = 'color'
}

export class CarouselProps {
    readonly width?: string | null;
    readonly height?: string | null;
    readonly direction: string | null;
    readonly aspectRatio: number;
    readonly initialPage?: ExprOr<number> | null;
    readonly enlargeCenterPage: boolean;
    readonly viewportFraction: number;
    readonly autoPlay: boolean;
    readonly animationDuration: number;
    readonly autoPlayInterval: number;
    readonly infiniteScroll: boolean;
    readonly reverseScroll: boolean;
    readonly enlargeFactor: number;
    readonly showIndicator: boolean;
    readonly offset: number;
    readonly dotHeight: number;
    readonly dotWidth: number;
    readonly padEnds: boolean;
    readonly spacing: number;
    readonly pageSnapping: boolean;
    readonly dotColor?: ExprOr<string> | null;
    readonly activeDotColor?: ExprOr<string> | null;
    readonly indicatorEffectType: string;
    readonly keepAlive?: boolean | null;
    readonly onChanged?: ActionFlow | null;
    readonly dataSource?: ExprOr<any> | null;

    constructor({
        width,
        height,
        direction = Axis.horizontal,
        aspectRatio = 0.25,
        initialPage,
        enlargeCenterPage = false,
        viewportFraction = 0.8,
        autoPlay = false,
        animationDuration = 800,
        autoPlayInterval = 1600,
        infiniteScroll = false,
        pageSnapping = true,
        padEnds = true,
        reverseScroll = false,
        enlargeFactor = 0.3,
        showIndicator = false,
        offset = 16.0,
        dotHeight = 8.0,
        dotWidth = 8.0,
        spacing = 16.0,
        dotColor,
        activeDotColor,
        indicatorEffectType = 'slide',
        keepAlive = false,
        onChanged,
        dataSource,
    }: {
        width?: string | null;
        height?: string | null;
        direction?: string | null;
        aspectRatio?: number;
        initialPage?: ExprOr<number> | null;
        enlargeCenterPage?: boolean;
        viewportFraction?: number;
        autoPlay?: boolean;
        animationDuration?: number;
        autoPlayInterval?: number;
        infiniteScroll?: boolean;
        pageSnapping?: boolean;
        padEnds?: boolean;
        reverseScroll?: boolean;
        enlargeFactor?: number;
        showIndicator?: boolean;
        offset?: number;
        dotHeight?: number;
        dotWidth?: number;
        spacing?: number;
        dotColor?: ExprOr<string> | null;
        activeDotColor?: ExprOr<string> | null;
        indicatorEffectType?: string;
        keepAlive?: boolean | null;
        onChanged?: ActionFlow | null;
        dataSource?: ExprOr<any> | null;
    }) {
        this.width = width;
        this.height = height;
        this.direction = direction;
        this.aspectRatio = aspectRatio;
        this.initialPage = initialPage;
        this.enlargeCenterPage = enlargeCenterPage;
        this.viewportFraction = viewportFraction;
        this.autoPlay = autoPlay;
        this.animationDuration = animationDuration;
        this.autoPlayInterval = autoPlayInterval;
        this.infiniteScroll = infiniteScroll;
        this.reverseScroll = reverseScroll;
        this.pageSnapping = pageSnapping;
        this.padEnds = padEnds;
        this.enlargeFactor = enlargeFactor;
        this.showIndicator = showIndicator;
        this.offset = offset;
        this.dotHeight = dotHeight;
        this.dotWidth = dotWidth;
        this.spacing = spacing;
        this.dotColor = dotColor;
        this.activeDotColor = activeDotColor;
        this.indicatorEffectType = indicatorEffectType;
        this.keepAlive = keepAlive;
        this.onChanged = onChanged;
        this.dataSource = dataSource;
    }

    /// Factory constructor to create an instance from JSON
    static fromJson(json: JsonLike | null): CarouselProps {
        const indicatorJson = (json?.['indicator'] as any)?.['indicatorAvailable'] ?? {};

        return new CarouselProps({
            width: as$<string | null>(json?.['width']),
            height: as$<string | null>(json?.['height']),
            direction: as$<string | null>(json?.['direction']),
            aspectRatio: as$<number | null>(NumUtil.toDouble(json?.['aspectRatio'])) ?? 0.25,
            initialPage: ExprOr.fromJson<number>(json?.['initialPage']),
            enlargeCenterPage: as$<boolean | null>(json?.['enlargeCenterPage']) ?? false,
            viewportFraction: as$<number | null>(NumUtil.toDouble(json?.['viewportFraction'])) ?? 0.8,
            autoPlay: as$<boolean | null>(json?.['autoPlay']) ?? false,
            animationDuration: as$<number | null>(json?.['animationDuration']) ?? 800,
            autoPlayInterval: as$<number | null>(json?.['autoPlayInterval']) ?? 1600,
            infiniteScroll: as$<boolean | null>(json?.['infiniteScroll']) ?? false,
            reverseScroll: as$<boolean | null>(json?.['reverseScroll']) ?? false,
            pageSnapping: as$<boolean | null>(json?.['pageSnapping']) ?? true,
            padEnds: as$<boolean | null>(json?.['padEnds']) ?? true,
            enlargeFactor: as$<number | null>(NumUtil.toDouble(json?.['enlargeFactor'])) ?? 0.3,
            showIndicator: as$<boolean | null>(indicatorJson['showIndicator']) ?? false,
            offset: as$<number | null>(NumUtil.toDouble(indicatorJson['offset'])) ?? 16.0,
            dotHeight: as$<number | null>(NumUtil.toDouble(indicatorJson['dotHeight'])) ?? 8.0,
            dotWidth: as$<number | null>(NumUtil.toDouble(indicatorJson['dotWidth'])) ?? 8.0,
            spacing: as$<number | null>(NumUtil.toDouble(indicatorJson['spacing'])) ?? 16.0,
            dotColor: ExprOr.fromJson<string>(indicatorJson['dotColor']),
            keepAlive: as$<boolean | null>(json?.['keepAlive']) ?? false,
            activeDotColor: ExprOr.fromJson<string>(indicatorJson['activeDotColor']),
            indicatorEffectType: as$<string | null>(indicatorJson['indicatorEffectType']) ?? IndicatorEffectType.slide,
            onChanged: ActionFlow.fromJson(json?.['onChanged']),
            dataSource: ExprOr.fromJson<any>(json?.['dataSource']),
        });
    }
}
import { VirtualWidget } from './base/VirtualWidget';
import { VWData, VWNodeData } from '../framework/models/vw_data';
import { VirtualWidgetRegistry } from './virtual_widget_registry';
import { TextPropsClass } from './widget_props/text_props';
import { VWText } from './widgets/text';
import { ScaffoldProps } from './widget_props/scafold_props';
import { VWScaffold } from './widgets/scaffold';
import { VWFlex } from './widgets/Flex';
import { VWIcon } from './widgets/icon';
import { IconProps } from './widget_props/icon_props';
import { VWImage } from './widgets/Image';
import { VWContainer } from './widgets/Container';
import { CarouselProps } from './widget_props/carousel_props';
import VWCarousel from './widgets/Carousel';

/**
 * Create child groups from VWData, converting each to VirtualWidget instances.
 * 
 * Recursively builds the widget hierarchy by creating child widgets using the registry.
 * 
 * @param childGroups - Map of child group names to arrays of VWData
 * @param parent - The parent VirtualWidget
 * @returns Map of child group names to arrays of VirtualWidget instances, or undefined if no children
 * 
 * @example
 * ```typescript
 * const childGroups = new Map([
 *   ['children', [textData1, textData2]],
 *   ['actions', [buttonData]]
 * ]);
 * 
 * const widgets = createChildGroups(childGroups, parentWidget);
 * // Map {
 * //   'children' => [VWText, VWText],
 * //   'actions' => [VWButton]
 * // }
 * ```
 */
export function createChildGroups(
    childGroups: Map<string, VWData[]> | undefined,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry
): Map<string, VirtualWidget[]> | undefined {
    if (childGroups == null || childGroups.size === 0) return undefined;

    const result = new Map<string, VirtualWidget[]>();

    for (const [key, childrenData] of childGroups.entries()) {
        const widgets = childrenData
            .map((data) => {
                return registry.createWidget(data, parent);

            })
            .filter((widget): widget is VirtualWidget => widget !== null);

        result.set(key, widgets);
    }

    return result;
}

/**
 * Builder function for creating VWText widgets from VWNodeData.
 * 
 * @param data - The widget node data
 * @param parent - Optional parent widget
 * @param registry - The widget registry (unused but required by signature)
 * @returns VWText instance
 */
export function textBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry
): VWText {
    return new VWText({
        props: TextPropsClass.fromJson(data.props.value),
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        refName: data.refName,
    });
}


/** * Builder function for creating VWScaffold widgets from VWNodeData.
 * 
 * @param data - The widget node data
 * @param parent - Optional parent widget
 * @param registry - The widget registry (unused but required by signature)
 * @returns VWScaffold instance
 */
export function scaffoldBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry
): VWScaffold {
    return new VWScaffold({
        props: ScaffoldProps.fromJson(data.props.value),
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        childGroups: createChildGroups(data.childGroups, parent, registry),
        refName: data.refName,
    });
}

export function flexBuilder(
    direction: 'horizontal' | 'vertical',
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return new VWFlex({
        direction: direction,
        props: data.props,
        commonProps: data.commonProps,
        parent: parent,
        childGroups: createChildGroups(data.childGroups, parent, registry),
        refName: data.refName,
    });
}


export function columnBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return flexBuilder('vertical', data, parent, registry);
}

export function rowBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return flexBuilder('horizontal', data, parent, registry);
}

export function iconBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {


    return new VWIcon({
        props: IconProps.fromJson(data.props.value),
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        refName: data.refName,
    });
}


export function imageBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return new VWImage({
        props: data.props,
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        refName: data.refName,
    });
}


export function buttonBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    // Lazy import to avoid circular dependency
    const { VWButton } = require('./widgets/Button');
    return new VWButton({
        props: data.props,
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        refName: data.refName,
    });
}

export function navigationBarBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    // Lazy import to avoid circular dependency
    const { VWNavigationBar } = require('./widgets/NavigationBar');
    return new VWNavigationBar({
        props: data.props,
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        childGroups: createChildGroups(data.childGroups, parent, registry),
        refName: data.refName,
    });
}




export function containerBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return new VWContainer({
        props: data.props,
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        childGroups: createChildGroups(data.childGroups, parent, registry),

        refName: data.refName,
    });
}


export function carouselBuilder(
    data: VWNodeData,
    parent: VirtualWidget | undefined,
    registry: VirtualWidgetRegistry,
) {
    return new VWCarousel({
        props: CarouselProps.fromJson(data.props.value),
        commonProps: data.commonProps,
        parentProps: data.parentProps,
        parent: parent,
        childGroups: createChildGroups(data.childGroups, parent, registry),
        refName: data.refName,
    });
}
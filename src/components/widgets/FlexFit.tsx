import React from 'react';
import { ViewStyle, StyleSheet } from 'react-native';
import { VirtualStatelessWidget, VirtualWidget } from '../base';
import { FlexFitProps } from '../widget_props/flex_fit_props';
import { Props } from '../../framework/models/props';
import { RenderPayload } from '../../framework/render_payload';
import { isHeightBounded, isWidthBounded, useConstraints } from '../../framework/utils/react-native-constraint-system';
import { isViewBased } from '../../framework/utils/widget_util';


/**
 * VWFlexFit
 * - 'tight' (Expanded): child fills available space in parent's main axis
 * - 'loose' (Flexible): child participates in flex distribution proportionally
 */
// export class VWFlexFit extends VirtualStatelessWidget<FlexFitProps> {
//     private _parentType: 'row' | 'column' | undefined;

//     constructor(options: {
//         props: FlexFitProps;
//         parent?: VirtualWidget;
//         parentProps?: Props;
//         refName?: string;
//         childGroups?: Map<string, VirtualWidget[]>;
//         commonProps?: any;
//     },
//         parentType?: 'row' | 'column',
//     ) {
//         super(options as any);
//         this._parentType = parentType;
//     }

//     render(payload: RenderPayload): React.ReactNode {
//         const child = this.child;
//         if (!child) return this.empty();

//         const flexFitType = this.props.flexFitType;
//         const flexValue = this.props.flexValue ?? 1;

//         // Wrap in a functional component to use hooks
//         const FlexFitWrapper: React.FC = () => {
//             const parentCtx = useConstraints();
//             const parentConstraints = parentCtx?.constraints ?? null;

//             // Render child first
//             const childElement = child.toWidget(payload) as React.ReactElement;

//             // Determine if parent is bounded in main axis
//             // const mainBounded =
//             //     this._parentType === 'row'
//             //         ? isWidthBounded(parentConstraints)
//             //         : isHeightBounded(parentConstraints);

//             let style: ViewStyle = {};


//             switch (flexFitType) {
//                 case "tight": {
//                     // EXPANDED behavior - fills available space
//                     // if (mainBounded) {
//                     //     // Parent is bounded → expand to fill
//                     //     style = {
//                     //         flex: flexValue,
//                     //     };
//                     // } else {
//                     // Parent is unbounded → shrink-wrap content
//                     // Don't try to expand in unbounded space
//                     style = {
//                         flex: flexValue,
//                     };
//                     // }
//                     break;
//                 }

//                 case "loose": {
//                     // FLEXIBLE behavior - proportional distribution
//                     // if (mainBounded) {
//                     //     // Parent is bounded → participate in flex distribution
//                     //     style = {
//                     //         flexGrow: flexValue,
//                     //         flexShrink: 1,
//                     //         flexBasis: 0, // Important: use 0 for proper flex distribution
//                     //     };
//                     // } else {
//                     // Parent is unbounded → shrink-wrap content
//                     style = {
//                         flexGrow: flexValue,
//                         flexShrink: 1,
//                         flexBasis: 'auto',
//                     };
//                     // }
//                     break;
//                 }


//                 default:
//                     return childElement;
//             }

//             // Merge styles properly
//             const childStyle = childElement.props?.style;

//             // Flatten child style if it's an array
//             const normalizedChildStyle = childStyle
//                 ? (Array.isArray(childStyle) ? StyleSheet.flatten(childStyle) : childStyle)
//                 : {};

//             // Merge: child style first, then flex style
//             const mergedStyle = [normalizedChildStyle, style];

//             return React.cloneElement(childElement, {
//                 style: mergedStyle,
//             });
//         };

//         return <FlexFitWrapper />;
//     }
// }



export class VWFlexFit extends VirtualStatelessWidget<FlexFitProps> {
    private _parentType: 'row' | 'column' | undefined;

    constructor(
        options: {
            props: FlexFitProps;
            parent?: VirtualWidget;
            parentProps?: Props;
            refName?: string;
            childGroups?: Map<string, VirtualWidget[]>;
            commonProps?: any;
        },
        parentType?: 'row' | 'column',
    ) {
        super(options as any);
        this._parentType = parentType;
    }

    render(payload: RenderPayload): React.ReactNode {
        const child = this.child;
        if (!child) return this.empty();

        const flexFitType = this.props.flexFitType;
        const flexValue = this.props.flexValue ?? 1;

        // Render child element once (flat)
        const childElement = child.toWidget(payload) as React.ReactElement;
        if (!childElement) return null;

        let style: ViewStyle = {};

        switch (flexFitType) {
            case "tight": {
                // Expanded behavior: take flexValue portion
                style = {
                    flex: flexValue,
                };
                break;
            }
            case "loose": {
                // Flexible behavior: proportionally grow but allow content to shrink/wrap
                style = {
                    flexGrow: flexValue,
                    flexShrink: 1,
                    flexBasis: "auto",
                };
                break;
            }

            default:
                return childElement;
        }

        // Extract child style
        const childStyle = childElement.props?.style;
        const normalized = childStyle
            ? Array.isArray(childStyle)
                ? StyleSheet.flatten(childStyle)
                : childStyle
            : {};

        // Merge final styles
        const mergedStyle = [normalized, style];

        return React.cloneElement(childElement, {
            style: mergedStyle,
        });
    }
}

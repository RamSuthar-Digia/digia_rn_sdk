
import React from 'react';
import { VirtualLeafStatelessWidget } from '../base/VirtualLeafStatelessWidget';
import { RenderPayload } from '../../framework/render_payload';
import { Props } from '../../framework/models/props';
import { To } from '../../framework/utils/type_convertors';
import { VirtualWidget } from '../base/VirtualWidget';
import { CommonProps } from '../../framework/models/common_props';
import { wrapWidget } from '../../framework/utils/widget_util';
import { ExtentUtil } from '../../framework/utils/extensions';
import InternalImage from '../internals/image';

/**
 * VWImage - Virtual image widget ported from Flutter VWImage.
 * Behavior:
 * - Reads image source expression from `src.imageSrc` or `imageSrc` props.
 * - If `imageType` indicates a file (or InternalImage detects a file), it will
 *   render directly without size-based optimization.
 * - Supports `fit`, `svgColor`, `placeholder`, `placeholderSrc`, `errorImage`.
 */
export class VWImage extends VirtualLeafStatelessWidget<Props> {
    constructor(options: {
        props: Props;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        refName?: string;
    }) {
        super(options as any);
    }

    render(payload: RenderPayload): React.ReactNode {
        const imageSourceExpr = this.props.get('src.imageSrc') ?? this.props.get('imageSrc');
        const imageType = this.props.getString('imageType');

        // fit can be an expression; evaluate then convert to RN resizeMode
        const fitValue = payload.eval(this.props.get('fit'));
        const fit = To.resizeMode(fitValue);

        // svgColor may be an expression that resolves to a resource key
        const svgColor = payload.evalColor(this.props.get('svgColor'));

        const placeholderType = this.props.getString('placeholder');
        const placeholderSrc = this.props.getString('placeholderSrc');
        const errorImage = this.props.get('errorImage');



        return wrapWidget({
            payload,
            aspectRatio: this.props.get('aspectRatio'),
            child: (
                <InternalImage
                    imageSourceExpr={imageSourceExpr}
                    payload={payload}
                    imageType={imageType}
                    fit={To.boxFit(this.props.get('fit'))}
                    alignment={To.alignment(this.props.get('alignment'))}
                    svgColor={svgColor ?? undefined}
                    placeholderType={placeholderType}
                    placeholderSrc={placeholderSrc}
                    errorImage={errorImage}
                    height={ExtentUtil.toHeight(this.commonProps?.style?.height ?? '')}
                    width={ExtentUtil.toWidth(this.commonProps?.style?.width ?? '')}
                />
            ),
        });
    }
}


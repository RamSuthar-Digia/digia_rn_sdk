import React, { useEffect, useRef } from 'react';
import { Text as RNText, Animated, View, TextStyle } from 'react-native';
import { VirtualLeafStatelessWidget } from '../base/VirtualLeafStatelessWidget';
import { RenderPayload } from '../../framework/render_payload';
import { To } from '../../framework/utils/type_convertors';
import { TextPropsClass } from '../widget_props/text_props';
import { VirtualWidget } from '../base/VirtualWidget';
import { CommonProps } from '../../framework/models/common_props';
import { Props } from '../../framework/models/props';
import { useConstraints } from '../../framework/utils/react-native-constraint-system';

/**
 * Marquee text component that scrolls continuously.
 */
const MarqueeText: React.FC<{
    text: string;
    style?: TextStyle | null;
    maxLines?: number | null;
    textAlign?: TextStyle['textAlign'];
}> = ({ text, style, maxLines, textAlign }) => {
    const translateX = useRef(new Animated.Value(0)).current;
    const textRef = useRef<RNText>(null);
    const [textWidth, setTextWidth] = React.useState(0);

    useEffect(() => {
        if (textWidth > 0) {
            // Create a continuous scrolling animation
            const animation = Animated.loop(
                Animated.sequence([
                    Animated.timing(translateX, {
                        toValue: -textWidth - 100, // Move left by text width + gap
                        duration: 11000, // 11 seconds to match Flutter
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateX, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            );

            animation.start();

            return () => animation.stop();
        }
    }, [textWidth, translateX]);

    const textStyle = textAlign ? { ...style, textAlign } : style;

    return (
        <View style={{ overflow: 'hidden', flexDirection: 'row' }}>
            <Animated.View style={{ transform: [{ translateX }] }}>
                <RNText
                    ref={textRef}
                    style={textStyle}
                    numberOfLines={maxLines ?? undefined}
                    onLayout={(event) => {
                        setTextWidth(event.nativeEvent.layout.width);
                    }}
                >
                    {text}
                </RNText>
            </Animated.View>
        </View>
    );
};/**
 * Virtual text widget component.
 * Renders text with optional styling, alignment, and overflow handling.
 */
export class VWText extends VirtualLeafStatelessWidget<TextPropsClass> {
    constructor(options: {
        props: TextPropsClass;
        commonProps?: CommonProps;
        parentProps?: Props;
        parent?: VirtualWidget;
        refName?: string;
    }) {
        super(options);
    }

    render(payload: RenderPayload): React.ReactNode {
        const text = payload.evalExpr(this.props.text);
        const style = payload.getTextStyle(this.props.textStyle);
        const maxLines = payload.evalExpr(this.props.maxLines);
        const alignment = To.textAlign(payload.evalExpr(this.props.alignment));
        const overflow = payload.evalExpr(this.props.overflow);

        const textContent = text != null ? String(text) : '';

        // Handle marquee overflow
        if (overflow === 'marquee') {
            return (
                <MarqueeText
                    text={textContent}
                    style={style}
                    maxLines={maxLines}
                    textAlign={alignment}
                />
            );
        }

        // Wrap in functional component to properly use constraints hook
        const TextContent = () => {
            const ctx = useConstraints();
            const maxWidth = ctx?.constraints.maxWidth;

            const ellipsizeMode = overflow === 'clip' ? 'clip' : 'tail';
            const textStyle = alignment ? { ...style, textAlign: alignment } : style;

            return (
                <RNText
                    style={{
                        ...textStyle,
                        // flex: 1,
                        // flexShrink: 1,
                        // minHeight: textStyle?.lineHeight,
                        // maxWidth: maxWidth != null ? '100%' : undefined,
                        // maxWidth: maxWidth && isFinite(maxWidth) ? maxWidth : undefined,
                    }}
                    numberOfLines={maxLines ?? undefined}

                    ellipsizeMode={ellipsizeMode}
                >
                    {textContent}
                </RNText>
            );
        };

        return <TextContent />;
    }
}

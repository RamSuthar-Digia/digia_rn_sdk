import {
    TextStyle,
    ViewStyle,
    FlexAlignType,
    DimensionValue,
    KeyboardType,
    ReturnKeyType,
    TextInput,
    LayoutChangeEvent,
    KeyboardTypeOptions
} from 'react-native';
import { NumUtil } from './num_util';

// Types for React Native equivalents
type MainAxisAlignment = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
type CrossAxisAlignment = 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
type FlexDirection = 'row' | 'column';
type FlexWrap = 'wrap' | 'nowrap' | 'wrap-reverse';
type TextAlign = 'auto' | 'left' | 'right' | 'center' | 'justify';
type TextAlignVertical = 'top' | 'center' | 'bottom';
type Overflow = 'visible' | 'hidden' | 'scroll';
type ResizeMode = 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';



// Main conversion class
export class To {
    // Layout alignment
    static mainAxisAlignment(value: any): MainAxisAlignment | undefined {
        switch (value) {
            case 'start':
                return 'flex-start';
            case 'end':
                return 'flex-end';
            case 'center':
                return 'center';
            case 'spaceBetween':
                return 'space-between';
            case 'spaceAround':
                return 'space-around';
            case 'spaceEvenly':
                return 'space-evenly';
            default:
                return undefined;
        }
    }

    static crossAxisAlignment(value: any): CrossAxisAlignment | undefined {
        switch (value) {
            case 'start':
                return 'flex-start';
            case 'end':
                return 'flex-end';
            case 'center':
                return 'center';
            case 'stretch':
                return 'stretch';
            case 'baseline':
                return 'baseline';
            default:
                return undefined;
        }
    }

    // Text styles
    static fontWeight(value: any): TextStyle['fontWeight'] {
        switch (value) {
            case 'thin':
                return '100';
            case 'extralight':
            case 'extra-light':
            case 'extra_light':
            case 'extraLight':
                return '200';
            case 'light':
                return '300';
            case 'regular':
                return 'normal';
            case 'medium':
                return '500';
            case 'semibold':
            case 'semi-bold':
            case 'semiBold':
                return '600';
            case 'bold':
                return '700';
            case 'extrabold':
            case 'extra-bold':
            case 'extraBold':
                return '800';
            case 'black':
            case 'thick':
                return '900';
            default:
                return 'normal';
        }
    }

    static fontStyle(value: any): TextStyle['fontStyle'] {
        switch (value) {
            case 'italic':
            case true:
                return 'italic';
            default:
                return 'normal';
        }
    }

    static textAlign(value: any): TextAlign {
        switch (value) {
            case 'right':
                return 'right';
            case 'left':
                return 'left';
            case 'center':
                return 'center';
            case 'end':
                return 'right'; // RTL aware would need I18nManager
            case 'justify':
                return 'justify';
            default:
                return 'left';
        }
    }

    static textAlignVertical(value: any): TextAlignVertical | undefined {
        switch (value) {
            case 'top':
                return 'top';
            case 'center':
                return 'center';
            case 'bottom':
                return 'bottom';
            default:
                return undefined;
        }
    }

    // React Native uses numberOfLines instead of overflow for ellipsis
    static numberOfLines(value: any): number | undefined {
        // You might want to map this differently based on your needs
        return undefined; // Let the parent component handle this
    }

    static textDecoration(value: any): TextStyle['textDecorationLine'] {
        switch (value) {
            case 'underline':
                return 'underline';
            case 'overline':
                return 'underline'; // React Native doesn't support overline
            case 'lineThrough':
                return 'line-through';
            case 'none':
                return 'none';
            default:
                return undefined;
        }
    }

    static textDecorationStyle(value: any): TextStyle['textDecorationStyle'] {
        switch (value) {
            case 'dashed':
                return 'dashed';
            case 'dotted':
                return 'dotted';
            case 'double':
                return 'double';
            case 'solid':
                return 'solid';
            case 'wavy':
                return 'dashed'; // React Native doesn't support wavy
            default:
                return undefined;
        }
    }

    // Layout positioning
    static alignment(value: any): { alignSelf?: FlexAlignType, alignItems?: FlexAlignType, justifyContent?: MainAxisAlignment } | undefined {
        if (typeof value === 'string') {
            switch (value) {
                case 'topLeft':
                    return { alignSelf: 'flex-start', alignItems: 'flex-start' };
                case 'topCenter':
                    return { alignSelf: 'center', alignItems: 'center' };
                case 'topRight':
                    return { alignSelf: 'flex-end', alignItems: 'flex-end' };
                case 'centerLeft':
                    return { justifyContent: 'center', alignItems: 'flex-start' };
                case 'center':
                    return { justifyContent: 'center', alignItems: 'center' };
                case 'centerRight':
                    return { justifyContent: 'center', alignItems: 'flex-end' };
                case 'bottomLeft':
                    return { justifyContent: 'flex-end', alignItems: 'flex-start' };
                case 'bottomCenter':
                    return { justifyContent: 'flex-end', alignItems: 'center' };
                case 'bottomRight':
                    return { justifyContent: 'flex-end', alignItems: 'flex-end' };
                default:
                    // Try to parse as coordinates "x,y"
                    if (value.includes(',')) {
                        const parts = value.split(',');
                        const x = NumUtil.toDouble(parts[0]);
                        const y = NumUtil.toDouble(parts[1]);
                        if (x !== null && y !== null) {
                            // React Native doesn't have exact Alignment equivalent, 
                            // but we can approximate with transforms or percentage positioning
                            return {};
                        }
                    }
                    return undefined;
            }
        }

        if (value && typeof value === 'object') {
            // Handle object with x,y coordinates
            return {};
        }

        return undefined;
    }

    // Image resize mode
    static resizeMode(value: any): ResizeMode {
        switch (value) {
            case 'fill':
                return 'stretch';
            case 'contain':
                return 'contain';
            case 'cover':
                return 'cover';
            case 'fitWidth':
                return 'contain'; // approximate
            case 'fitHeight':
                return 'contain'; // approximate
            case 'scaleDown':
                return 'contain'; // approximate
            default:
                return 'cover';
        }
    }

    /**
     * Map a BoxFit-like value to a ResizeMode used in React Native.
     * Mirrors the Dart switch-expression:
     *   'fill' -> BoxFit.fill
     *   'contain' -> BoxFit.contain
     *   'cover' -> BoxFit.cover
     *   'fitWidth' -> BoxFit.fitWidth
     *   'fitHeight' -> BoxFit.fitHeight
     *   'scaleDown' -> BoxFit.scaleDown
     *   _ -> BoxFit.none
     *
     * We map those to RN ResizeMode values; default maps to 'center' (approx BoxFit.none).
     */
    static boxFit(value: any): ResizeMode {
        switch (value) {
            case 'fill':
                return 'stretch';
            case 'contain':
                return 'contain';
            case 'cover':
                return 'cover';
            case 'fitWidth':
                return 'contain';
            case 'fitHeight':
                return 'contain';
            case 'scaleDown':
                return 'contain';
            default:
                return 'center';
        }
    }

    // Spacing and margin
    static margin(value: any, defaultValue: any = 0): { marginTop?: number, marginRight?: number, marginBottom?: number, marginLeft?: number } {
        if (value == null) return defaultValue;

        // Handle array input
        if (Array.isArray(value)) {
            const values = value.map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                marginTop: values[0],
                marginRight: values[0],
                marginBottom: values[0],
                marginLeft: values[0]
            };
            if (values.length === 2) {
                return {
                    marginTop: values[0],
                    marginBottom: values[0],
                    marginLeft: values[1],
                    marginRight: values[1]
                };
            }
            if (values.length === 4) {
                return {
                    marginTop: values[1],
                    marginRight: values[2],
                    marginBottom: values[3],
                    marginLeft: values[0]
                };
            }
            return {
                marginTop: defaultValue,
                marginRight: defaultValue,
                marginBottom: defaultValue,
                marginLeft: defaultValue
            };
        }

        // Handle string input (comma-separated)
        if (typeof value === 'string') {
            const values = value.split(',').map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                marginTop: values[0],
                marginRight: values[0],
                marginBottom: values[0],
                marginLeft: values[0]
            };
            if (values.length === 2) {
                return {
                    marginTop: values[0],
                    marginBottom: values[0],
                    marginLeft: values[1],
                    marginRight: values[1]
                };
            }
            if (values.length === 4) {
                return {
                    marginTop: values[1],
                    marginRight: values[2],
                    marginBottom: values[3],
                    marginLeft: values[0]
                };
            }
            return {
                marginTop: defaultValue,
                marginRight: defaultValue,
                marginBottom: defaultValue,
                marginLeft: defaultValue
            };
        }

        // Handle single number
        if (typeof value === 'number') {
            return {
                marginTop: value,
                marginRight: value,
                marginBottom: value,
                marginLeft: value
            };
        }

        // Handle object input
        if (typeof value === 'object') {
            // Check for 'all' key
            if (value.all != null) {
                return {
                    marginTop: NumUtil.toDouble(value.all) ?? defaultValue,
                    marginRight: NumUtil.toDouble(value.all) ?? defaultValue,
                    marginBottom: NumUtil.toDouble(value.all) ?? defaultValue,
                    marginLeft: NumUtil.toDouble(value.all) ?? defaultValue
                };
            }

            // Check for symmetric margin
            if (value.horizontal != null && value.vertical != null) {
                return {
                    marginTop: NumUtil.toDouble(value.vertical) ?? 0,
                    marginBottom: NumUtil.toDouble(value.vertical) ?? 0,
                    marginLeft: NumUtil.toDouble(value.horizontal) ?? 0,
                    marginRight: NumUtil.toDouble(value.horizontal) ?? 0
                };
            }

            // Individual margin
            return {
                marginTop: NumUtil.toDouble(value.top) ?? 0,
                marginRight: NumUtil.toDouble(value.right) ?? 0,
                marginBottom: NumUtil.toDouble(value.bottom) ?? 0,
                marginLeft: NumUtil.toDouble(value.left) ?? 0
            };
        }

        return {
            marginTop: defaultValue,
            marginRight: defaultValue,
            marginBottom: defaultValue,
            marginLeft: defaultValue
        };
    }

    // Spacing and padding
    static padding(value: any, defaultValue: any = 0): { paddingTop?: number, paddingRight?: number, paddingBottom?: number, paddingLeft?: number } {
        if (value == null) return defaultValue;


        // Handle array input
        if (Array.isArray(value)) {
            const values = value.map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                paddingTop: values[0],
                paddingRight: values[0],
                paddingBottom: values[0],
                paddingLeft: values[0]
            };
            if (values.length === 2) {
                return {
                    paddingTop: values[0],
                    paddingBottom: values[0],
                    paddingLeft: values[1],
                    paddingRight: values[1]
                };
            }
            if (values.length === 4) {
                return {
                    paddingTop: values[1],
                    paddingRight: values[2],
                    paddingBottom: values[3],
                    paddingLeft: values[0]
                };
            }
            return {
                paddingTop: defaultValue,
                paddingRight: defaultValue,
                paddingBottom: defaultValue,
                paddingLeft: defaultValue
            };
        }

        // Handle string input (comma-separated)
        if (typeof value === 'string') {
            const values = value.split(',').map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                paddingTop: values[0],
                paddingRight: values[0],
                paddingBottom: values[0],
                paddingLeft: values[0]
            };
            if (values.length === 2) {
                return {
                    paddingTop: values[0],
                    paddingBottom: values[0],
                    paddingLeft: values[1],
                    paddingRight: values[1]
                };
            }
            if (values.length === 4) {
                return {
                    paddingTop: values[1],
                    paddingRight: values[2],
                    paddingBottom: values[3],
                    paddingLeft: values[0]
                };
            }
            return {
                paddingTop: defaultValue,
                paddingRight: defaultValue,
                paddingBottom: defaultValue,
                paddingLeft: defaultValue
            };
        }

        // Handle single number
        if (typeof value === 'number') {
            return {
                paddingTop: value,
                paddingRight: value,
                paddingBottom: value,
                paddingLeft: value
            };
        }

        // Handle object input
        if (typeof value === 'object') {
            // Check for 'all' key
            if (value.all != null) {
                return {
                    paddingTop: NumUtil.toDouble(value.all) ?? defaultValue,
                    paddingRight: NumUtil.toDouble(value.all) ?? defaultValue,
                    paddingBottom: NumUtil.toDouble(value.all) ?? defaultValue,
                    paddingLeft: NumUtil.toDouble(value.all) ?? defaultValue
                };
            }

            // Check for symmetric padding
            if (value.horizontal != null && value.vertical != null) {
                return {
                    paddingTop: NumUtil.toDouble(value.vertical) ?? 0,
                    paddingBottom: NumUtil.toDouble(value.vertical) ?? 0,
                    paddingLeft: NumUtil.toDouble(value.horizontal) ?? 0,
                    paddingRight: NumUtil.toDouble(value.horizontal) ?? 0
                };
            }

            // Individual padding
            return {
                paddingTop: NumUtil.toDouble(value.top) ?? 0,
                paddingRight: NumUtil.toDouble(value.right) ?? 0,
                paddingBottom: NumUtil.toDouble(value.bottom) ?? 0,
                paddingLeft: NumUtil.toDouble(value.left) ?? 0
            };
        }

        return {
            paddingTop: defaultValue,
            paddingRight: defaultValue,
            paddingBottom: defaultValue,
            paddingLeft: defaultValue
        };
    }

    // Keyboard types
    static keyboardType(value: any): KeyboardTypeOptions | undefined {
        if (typeof value !== 'string') return undefined;

        switch (value) {
            case 'text':
                return 'default';
            case 'multiline':
                return 'default';
            case 'number':
                return 'numeric';
            case 'phone':
                return 'phone-pad';
            case 'datetime':
                return 'default'; // No direct equivalent
            case 'emailAddress':
                return 'email-address';
            case 'url':
                return 'url';
            case 'visiblePassword':
                return 'visible-password';
            case 'name':
                return 'default';
            case 'streetAddress':
                return 'default';
            case 'none':
                return 'default';
            default:
                return undefined;
        }
    }

    static returnKeyType(value: any): ReturnKeyType | undefined {
        // Valid ReturnKeyType values in React Native:
        // 'done' | 'go' | 'next' | 'search' | 'send'
        const actionMap: { [key: string]: ReturnKeyType } = {
            'done': 'done',
            'go': 'go',
            'next': 'next',
            'search': 'search',
            'send': 'send',
            'default': 'done', // Map to closest equivalent
            'emergencyCall': 'done', // No direct equivalent
            'google': 'go',
            'join': 'go',
            'route': 'go',
            'yahoo': 'go'
        };

        if (typeof value === 'string') {
            return actionMap[value] || 'done';
        }
        return undefined;
    }

    // Border radius
    static borderRadius(value: any, defaultValue: any = 0): object {
        if (value == null) return defaultValue;

        if (Array.isArray(value)) {
            const values = value.map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                borderTopLeftRadius: values[0],
                borderTopRightRadius: values[0],
                borderBottomRightRadius: values[0],
                borderBottomLeftRadius: values[0]
            };
            if (values.length === 4) {
                return {
                    borderTopLeftRadius: values[0],
                    borderTopRightRadius: values[1],
                    borderBottomRightRadius: values[2],
                    borderBottomLeftRadius: values[3]
                };
            }
            return {
                borderTopLeftRadius: defaultValue,
                borderTopRightRadius: defaultValue,
                borderBottomRightRadius: defaultValue,
                borderBottomLeftRadius: defaultValue
            };
        }

        if (typeof value === 'string') {
            const values = value.split(',').map(e => NumUtil.toDouble(e) ?? 0);
            if (values.length === 1) return {
                borderTopLeftRadius: values[0],
                borderTopRightRadius: values[0],
                borderBottomRightRadius: values[0],
                borderBottomLeftRadius: values[0]
            };
            if (values.length === 4) {
                return {
                    borderTopLeftRadius: values[0],
                    borderTopRightRadius: values[1],
                    borderBottomRightRadius: values[2],
                    borderBottomLeftRadius: values[3]
                };
            }
            return {
                borderTopLeftRadius: defaultValue,
                borderTopRightRadius: defaultValue,
                borderBottomRightRadius: defaultValue,
                borderBottomLeftRadius: defaultValue
            };
        }

        if (typeof value === 'number') {
            return {
                borderTopLeftRadius: value,
                borderTopRightRadius: value,
                borderBottomRightRadius: value,
                borderBottomLeftRadius: value
            };
        }

        if (typeof value === 'object') {
            return {
                borderTopLeftRadius: NumUtil.toDouble(value.topLeft) ?? 0,
                borderTopRightRadius: NumUtil.toDouble(value.topRight) ?? 0,
                borderBottomRightRadius: NumUtil.toDouble(value.bottomRight) ?? 0,
                borderBottomLeftRadius: NumUtil.toDouble(value.bottomLeft) ?? 0
            };
        }

        return defaultValue;
    }

    // Flex direction
    static flexDirection(value: any): FlexDirection | undefined {
        switch (value) {
            case 'horizontal':
                return 'row';
            case 'vertical':
                return 'column';
            default:
                return undefined;
        }
    }

    // Flex wrap
    static flexWrap(value: any): FlexWrap | undefined {
        switch (value) {
            case 'wrap':
                return 'wrap';
            case 'nowrap':
                return 'nowrap';
            case 'wrap-reverse':
                return 'wrap-reverse';
            default:
                return undefined;
        }
    }

    // Overflow
    static overflow(value: any): Overflow | undefined {
        switch (value) {
            case 'visible':
                return 'visible';
            case 'hidden':
                return 'hidden';
            case 'scroll':
                return 'scroll';
            default:
                return undefined;
        }
    }

    // Border styles
    static border(value: any, toColor?: (color: string) => string): ViewStyle | undefined {
        if (!value || value.style !== 'solid') {
            return undefined;
        }

        const borderStyle: ViewStyle = {
            borderStyle: 'solid',
            borderWidth: value.width ?? 1,
        };

        if (value.color && toColor) {
            borderStyle.borderColor = toColor(value.color);
        }

        // React Native doesn't have strokeAlign equivalent
        return borderStyle;
    }

    // Gradient (React Native requires additional libraries like react-native-linear-gradient)
    static gradient(data: any, evalColor?: (color: any) => string | undefined): any {
        if (!data || !evalColor) return undefined;

        const type = data.type;
        const colorList = data.colorList || [];
        const colors = colorList
            .map((e: any) => evalColor(e.color))
            .filter((color: string | undefined): color is string => color !== undefined);

        if (colors.length === 0) return undefined;

        const stops = colorList.map((e: any) => NumUtil.toDouble(e.stop)).filter((stop: number | null): stop is number => stop !== null);

        if (type === 'linear') {
            return {
                type: 'linear',
                colors,
                stops: stops.length === colors.length ? stops : undefined,
                start: this.alignment(data.begin) || { x: 0, y: 0 },
                end: this.alignment(data.end) || { x: 1, y: 0 }
            };
        }

        if (type === 'angular') {
            return {
                type: 'radial',
                colors,
                stops: stops.length === colors.length ? stops : undefined,
                center: this.alignment(data.center) || { x: 0.5, y: 0.5 },
                radius: NumUtil.toDouble(data.radius) || 0.5
            };
        }

        return undefined;
    }
}

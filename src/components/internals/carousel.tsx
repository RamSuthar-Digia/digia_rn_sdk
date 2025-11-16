import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    View,
    Dimensions,
    ViewStyle,
    StyleSheet,
    LayoutChangeEvent,
    TouchableWithoutFeedback,
    Animated,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolate,
    withTiming,
} from "react-native-reanimated";
import { ScalingDot, SlidingDot } from "react-native-animated-pagination-dots";
// Indicator package

type IndicatorEffectType =
    | "slide"
    | "scale"
    // future: "worm" | "jumping" | "scrolling" | "expanding" | "swap" | "circleAroundDot"
    ;

type InternalCarouselProps = {
    itemBuilder?: (ctx: { index: number }) => React.ReactNode;
    children?: React.ReactNode[];
    itemCount?: number;
    width?: number;
    height?: number;
    direction?: "horizontal" | "vertical";
    aspectRatio?: number; // itemWidth / itemHeight or used to compute height from width
    keepAlive?: boolean;
    initialPage?: number;
    enlargeCenterPage?: boolean;
    viewportFraction?: number; // fraction of carousel width each item occupies (0..1)
    autoPlay?: boolean;
    animationDuration?: number; // ms
    autoPlayInterval?: number; // ms
    infiniteScroll?: boolean;
    reverseScroll?: boolean;
    enlargeFactor?: number; // scale factor (0.0..1.0) -> finalScale = 1 + enlargeFactor
    showIndicator?: boolean;
    offset?: number;
    dotHeight?: number;
    dotWidth?: number;
    padEnds?: boolean;
    spacing?: number;
    pageSnapping?: boolean;
    dotColor?: string;
    activeDotColor?: string;
    indicatorEffectType?: 'slide' | 'scale';
    onChanged?: (index: number) => void;
};





const { width: screenWidth } = Dimensions.get("window");

// export default function InternalCarousel(props: InternalCarouselProps) {
//     const {
//         itemBuilder,
//         children = [],
//         itemCount = 0,
//         width,
//         height,
//         direction = "horizontal",
//         aspectRatio = 0.25,
//         initialPage = 0,
//         viewportFraction = 0.8,
//         autoPlay = false,
//         autoPlayInterval = 1600,
//         infiniteScroll = false,
//         enlargeCenterPage = false,
//         showIndicator = false,
//         indicatorEffectType = "slide",
//         dotWidth = 8,
//         dotHeight = 8,
//         spacing = 12,
//         activeDotColor = "#3F51B5",
//         dotColor = "#C0C0C0",
//         onChanged,
//     } = props;

//     const dataLength = itemBuilder ? itemCount : children.length;

//     const carouselWidth = width ?? screenWidth;
//     const carouselHeight =
//         height ?? carouselWidth * aspectRatio;

//     const progressValue = useSharedValue(0);
//     const [activeIndex, setActiveIndex] = useState(0);

//     const itemWidth = useMemo(() => {
//         return carouselWidth * viewportFraction;
//     }, [carouselWidth, viewportFraction]);

//     const carouselRef = useRef<any>(null);

//     /** Render item */
//     const renderItem = useCallback(
//         ({ index }: any) => {
//             const node = itemBuilder ? itemBuilder({ index }) : children[index];
//             return (
//                 <View style={{ width: itemWidth, alignItems: "center", justifyContent: "center" }}>
//                     {node}
//                 </View>
//             );
//         },
//         [itemBuilder, children, itemWidth]
//     );

//     /** Snap handler */
//     const handleSnap = useCallback(
//         (i: number) => {
//             setActiveIndex(i);
//             onChanged?.(i);
//         },
//         [onChanged]
//     );

//     /** Indicator Component */
//     const Indicator = () => {
//         if (!showIndicator || dataLength <= 1) return null;

//         const commonProps = {
//             data: Array.from({ length: dataLength }),
//             scrollX: progressValue,
//             dotSize: dotWidth,
//             dotScale: 1.4,
//             inActiveDotOpacity: 0.4,
//             activeDotColor,
//             inActiveDotColor: dotColor,
//             containerStyle: { marginTop: 12 },
//             spacing,
//         };

//         if (indicatorEffectType === "scale") {
//             // commonProps.data is unknown[]; the pagination library expects Object[] —
//             // cast to any to satisfy typings at compile time. Runtime data is not used
//             // beyond length, so this is safe here.
//             return <ScalingDot {...(commonProps as any)} />;
//         }

//         // default: slide
//         return <SlidingDot {...(commonProps as any)} />;
//     };

//     return (
//         <View style={{ width: carouselWidth, height: carouselHeight + 40 }}>
//             <Carousel
//                 ref={carouselRef}
//                 width={itemWidth}
//                 height={carouselHeight}
//                 data={Array.from({ length: dataLength })}
//                 renderItem={renderItem}
//                 defaultIndex={initialPage}
//                 loop={infiniteScroll}
//                 autoPlay={autoPlay}
//                 autoPlayInterval={autoPlayInterval}
//                 onProgressChange={(_, absoluteProgress) => {
//                     progressValue.value = absoluteProgress;
//                 }}
//                 onSnapToItem={handleSnap}
//                 style={{ alignSelf: "center" }}
//                 vertical={direction === "vertical"}
//                 scrollAnimationDuration={800}
//             />

//             {showIndicator && <Indicator />}
//         </View>
//     );
// }

const styles = StyleSheet.create({
    indicatorContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
});



export default function InternalCarousel(props: InternalCarouselProps) {
    const {
        itemBuilder,
        children = [],
        itemCount = 0,
        width,
        height,
        direction = "horizontal",
        aspectRatio = 0.25,
        initialPage = 0,
        viewportFraction = 0.8,
        autoPlay = false,
        autoPlayInterval = 1600,
        infiniteScroll = false,
        showIndicator = false,
        indicatorEffectType = "slide",
        dotWidth = 8,
        spacing = 12,
        activeDotColor = "#3F51B5",
        dotColor = "#C0C0C0",
        onChanged,
    } = props;

    const dataLength = itemBuilder ? itemCount : children.length;

    const carouselWidth = width ?? screenWidth;
    const carouselHeight = height ?? carouselWidth * aspectRatio;

    // FIX: Animated.Value for pagination dots
    const scrollX = useRef(new Animated.Value(0)).current;

    const [activeIndex, setActiveIndex] = useState(initialPage);

    const itemWidth = useMemo(
        () => carouselWidth * viewportFraction,
        [carouselWidth, viewportFraction]
    );

    /** Update scrollX when snapping */
    useEffect(() => {
        Animated.timing(scrollX, {
            toValue: activeIndex * itemWidth,
            duration: 250,
            useNativeDriver: false,
        }).start();
    }, [activeIndex, itemWidth]);

    /** Render item */
    const renderItem = useCallback(
        ({ index }: { index: number }) => {
            const node = itemBuilder ? itemBuilder({ index }) : children[index];
            return (
                <View style={{ width: itemWidth, alignItems: "center", justifyContent: "center" }}>
                    {node}
                </View>
            );
        },
        [itemBuilder, children, itemWidth]
    );

    /** Snap handler */
    const handleSnap = useCallback(
        (i: number) => {
            setActiveIndex(i);
            onChanged?.(i);
        },
        [onChanged]
    );

    /** Indicator Component */
    const Indicator = () => {
        if (!showIndicator || dataLength <= 1) return null;

        const commonProps = {
            data: Array.from({ length: dataLength }) as Object[],
            scrollX: scrollX, // FIXED: Animated.Value
            dotSize: dotWidth,
            dotScale: 1.4,
            inActiveDotOpacity: 0.4,
            activeDotColor,
            inActiveDotColor: dotColor,
            containerStyle: { marginTop: 12 },
            spacing,
        };

        if (indicatorEffectType === "scale") {
            return <ScalingDot {...commonProps} />;
        }

        return <SlidingDot {...commonProps} />;
    };

    return (
        <View style={{ width: carouselWidth, height: carouselHeight + 40 }}>
            <Carousel
                width={itemWidth}
                height={carouselHeight}
                data={Array.from({ length: dataLength })}
                renderItem={renderItem}
                defaultIndex={initialPage}
                loop={infiniteScroll}
                autoPlay={autoPlay}
                autoPlayInterval={autoPlayInterval}
                onSnapToItem={handleSnap}
                vertical={direction === "vertical"}
                scrollAnimationDuration={800}
                style={{ alignSelf: "center" }}
            />

            {showIndicator && <Indicator />}
        </View>
    );
}


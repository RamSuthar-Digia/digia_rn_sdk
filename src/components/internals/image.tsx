import React, { useEffect, useState } from "react";
import { Image as RNImage, View, ImageResizeMode } from "react-native";
import { SvgXml } from "react-native-svg";
import type { DimensionValue } from "react-native";
import type { ImageRequireSource, ImageURISource } from "react-native";
import { RenderPayload } from "../../framework/render_payload";
import { useConstraints } from "../../framework/utils/react-native-constraint-system";

interface InternalImageProps {
    imageSourceExpr: any;
    payload: RenderPayload;
    imageType?: string | null;
    // Flutter BoxFit equivalents
    fit?: "contain" | "cover" | "fill" | "fitWidth" | "fitHeight" | "scaleDown" | "none";

    alignment?: any;
    svgColor?: string;
    placeholderSrc?: any;
    placeholderType?: string | null;
    errorImage?: any;
    imageAspectRatio?: number | null;
    height?: DimensionValue | null;
    width?: DimensionValue | null;
}

/* ---------------- HELPERS ---------------- */

const hasSvgExtension = (s: any) => {
    if (!s || typeof s !== "string") return false;
    const v = s.trim().toLowerCase();
    return (
        v.startsWith("<svg") ||
        v.startsWith("data:image/svg") ||
        v.endsWith(".svg")
    );
};

/**
 * Maps Flutter BoxFit to React Native ImageResizeMode
 * Flutter BoxFit options:
 * - contain: Scale the image to fit within bounds while maintaining aspect ratio
 * - cover: Scale the image to fill bounds while maintaining aspect ratio (may clip)
 * - fill: Stretch the image to fill bounds (ignores aspect ratio)
 * - fitWidth: Scale to fit width, height may overflow
 * - fitHeight: Scale to fit height, width may overflow
 * - scaleDown: Like contain, but never scale up
 * - none: Display at original size (centered)
 */
const mapFitToResizeMode = (fit?: string): 'cover' | 'contain' | 'fill' | 'fitWidth' | 'fitHeight' | 'scale-down' | undefined => {
    if (!fit) return undefined;
    switch (fit.toLowerCase()) {

        case "scaledown":
            return "scale-down";
        default: {
            const lower = fit.toLowerCase();
            if (
                lower === "contain" ||
                lower === "cover" ||
                lower === "fill" ||
                lower === "fitwidth" ||
                lower === "fitheight" ||
                lower === "scale-down"
            ) {
                return lower as 'contain' | 'cover' | 'fill' | 'fitWidth' | 'fitHeight' | 'scale-down';
            }
            // fallback to undefined if not a valid value
            return undefined;
        }
    }
};

const normalizeSource = (
    src: any
): ImageRequireSource | ImageURISource | number | null => {
    if (!src) return null;
    if (typeof src === "number") return src;
    if (typeof src === "string") return { uri: src };
    if (src.uri) return { uri: src.uri };
    if (src.url) return { uri: src.url };
    return null;
};

const applySvgColor = (xml: string, color?: string | null) => {
    if (!color) return xml;
    try {
        return xml
            .replace(/fill="[^"]*"/gi, `fill="${color}"`)
            .replace(/stroke="[^"]*"/gi, `stroke="${color}"`);
    } catch {
        return xml;
    }
};

/* ---------------- MAIN COMPONENT ---------------- */

const InternalImage: React.FC<InternalImageProps> = ({
    imageSourceExpr,
    payload,
    imageType = "auto",
    fit = "contain",
    svgColor,
    placeholderSrc,
    errorImage,
    imageAspectRatio,
    height,
    width,
}) => {
    const [svgXml, setSvgXml] = useState<string | null>(null);
    const [svgLoading, setSvgLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);
    const [calculatedAspectRatio, setCalculatedAspectRatio] = useState<number | null>(null);
    const [isLoadingDimensions, setIsLoadingDimensions] = useState<boolean>(false);

    const evaluated =
        payload && typeof payload.eval === "function"
            ? payload.eval(imageSourceExpr)
            : imageSourceExpr;

    const actualImageType =
        imageType === "auto"
            ? hasSvgExtension(evaluated)
                ? "svg"
                : "image"
            : imageType;

    // Calculate effective aspect ratio
    const effectiveAspectRatio = imageAspectRatio || calculatedAspectRatio;

    /* ---------------- IMAGE DIMENSION CALCULATION ---------------- */
    useEffect(() => {
        // Only calculate if:
        // 1. No aspect ratio provided
        // 2. It's a regular image (not SVG)
        // 3. It's fitWidth or fitHeight
        // 4. Source is a network URL
        if (
            imageAspectRatio ||
            actualImageType === "svg"
            // ||
            // (fit !== "fitWidth" && fit !== "fitHeight") ||
            // !evaluated ||
            // typeof evaluated !== "string"
        ) {
            return;
        }

        // Check if it's a network URL (not local require or data URI)
        const isNetworkUrl = evaluated.startsWith("http://") || evaluated.startsWith("https://");

        if (!isNetworkUrl) {
            return;
        }

        let mounted = true;
        setIsLoadingDimensions(true);

        RNImage.getSize(
            evaluated,
            (width, height) => {
                if (mounted && width && height) {
                    const aspectRatio = width / height;
                    setCalculatedAspectRatio(aspectRatio);
                    setIsLoadingDimensions(false);
                }
            },
            (error) => {
                if (mounted) {
                    console.warn("Failed to get image dimensions:", error);
                    setIsLoadingDimensions(false);
                    // Don't set error state, just proceed without aspect ratio
                }
            }
        );

        return () => {
            mounted = false;
        };
    }, [evaluated, imageAspectRatio, actualImageType, fit]);

    /* ---------------- CONTAINER STYLE (Flutter-like) ---------------- */
    const getContainerStyle = () => {
        const baseStyle: any = {
            overflow: "hidden",
        };

        // For fitWidth and fitHeight, container behavior is special
        if (fit === "fitWidth") {
            // Container should span full width
            baseStyle.width = width || "100%";
            // If aspect ratio is provided, container can calculate height
            // if (effectiveAspectRatio) {
            //     baseStyle.aspectRatio = effectiveAspectRatio;
            // }
            // Otherwise height will come from image's intrinsic aspect ratio
        } else if (fit === "fitHeight") {
            // Container should span full height
            baseStyle.height = height || "100%";
            // If aspect ratio is provided, container can calculate width
            // if (effectiveAspectRatio) {
            //     baseStyle.aspectRatio = effectiveAspectRatio;
            // }
        } else if (fit === "scaleDown") {
            // scaleDown is like contain but never scales up
            baseStyle.maxWidth = width || "100%";
            baseStyle.maxHeight = height || "100%";
            // if (effectiveAspectRatio) {
            //     baseStyle.aspectRatio = effectiveAspectRatio;
            // }
        } else if (fit === "none") {
            // none displays at original size, centered
            baseStyle.justifyContent = "center";
            baseStyle.alignItems = "center";
            if (width !== null && width !== undefined) {
                baseStyle.width = width;
            }
            if (height !== null && height !== undefined) {
                baseStyle.height = height;
            }
        } else {
            // Standard fits: contain, cover, fill
            // Apply dimensions like Flutter does
            if (width !== null && width !== undefined) {
                baseStyle.width = width;
            }
            if (height !== null && height !== undefined) {
                baseStyle.height = height;
            }
            if (effectiveAspectRatio && !height && !width) {
                // baseStyle.aspectRatio = effectiveAspectRatio;
            }
        }

        return baseStyle;
    };

    const containerStyle = getContainerStyle();

    /* ---------------- IMAGE/SVG LOADING ---------------- */
    useEffect(() => {
        let mounted = true;
        const src = evaluated;

        // Inline SVG
        if (actualImageType === "svg" && typeof src === "string" && src.startsWith("<svg")) {
            if (mounted) {
                setSvgXml(applySvgColor(src, svgColor));
                setHasError(false);
            }
            return () => { mounted = false; };
        }

        // Network / DataURI SVG
        if (actualImageType === "svg" && typeof src === "string" && hasSvgExtension(src)) {
            (async () => {
                try {
                    setSvgLoading(true);
                    let xmlData = src;

                    // Fetch only when remote (not inline)
                    if (!src.trim().startsWith("<svg")) {
                        const response = await fetch(src);
                        xmlData = await response.text();
                    }

                    if (!mounted) return;

                    setSvgXml(applySvgColor(xmlData, svgColor));
                    setHasError(false);
                } catch (err) {
                    if (mounted) {
                        console.warn("SVG Load Error:", err);
                        setHasError(true);
                    }
                } finally {
                    if (mounted) setSvgLoading(false);
                }
            })();

            return () => { mounted = false; };
        }

        return () => { mounted = false; };
    }, [evaluated, actualImageType, svgColor]);

    /* ---------------- SVG PLACEHOLDER (only for remote SVG fetch) ---------------- */
    if (svgLoading && placeholderSrc && actualImageType === "svg") {
        if (typeof placeholderSrc === "string" && placeholderSrc.startsWith("<svg")) {
            return (
                <View style={containerStyle}>
                    <SvgXml
                        xml={placeholderSrc}
                        width="100%"
                        height="100%"
                        preserveAspectRatio="xMidYMid meet"
                    />
                </View>
            );
        }
        const placeholderSource = normalizeSource(placeholderSrc);
        if (placeholderSource) {
            return (
                <RNImage
                    source={placeholderSource}
                    style={{ ...containerStyle, objectFit: mapFitToResizeMode(fit) }}
                    resizeMode='cover'
                />
            );
        }
    }

    /* ---------------- ERROR FALLBACK ---------------- */
    if (hasError && errorImage) {
        const errorSource = normalizeSource(errorImage);
        if (errorSource) {
            return (
                <RNImage
                    source={errorSource}
                    style={{ ...containerStyle }}
                    resizeMode="contain"
                />
            );
        }
    }

    /* ---------------- SVG RENDER ---------------- */
    if (actualImageType === "svg") {
        if (!svgXml) {
            return <View style={containerStyle} />;
        }

        // Get SVG-specific aspect ratio behavior
        const getSvgAspectRatio = () => {
            switch (fit) {
                case "cover":
                    return "xMidYMid slice";
                case "fill":
                    return "none";
                case "none":
                    return "xMidYMid meet"; // centered at original size
                case "contain":
                case "fitWidth":
                case "fitHeight":
                case "scaleDown":
                default:
                    return "xMidYMid meet";
            }
        };

        return (
            <SvgXml
                xml={svgXml}
                width="100%"
                height="100%"
                style={{ ...containerStyle }}
                preserveAspectRatio={getSvgAspectRatio()}
            />
        );
    }

    /* ---------------- NORMAL IMAGE (Flutter-like behavior) ---------------- */
    const imgSrc = normalizeSource(evaluated);
    if (!imgSrc) return null;

    // Show placeholder while calculating dimensions for fitWidth/fitHeight
    if (isLoadingDimensions && placeholderSrc && (fit === "fitWidth" || fit === "fitHeight")) {
        const placeholderSource = normalizeSource(placeholderSrc);
        if (placeholderSource) {
            return (
                <RNImage
                    source={placeholderSource}
                    style={{ ...containerStyle, objectFit: mapFitToResizeMode(fit) }}
                    resizeMode='cover'
                />
            );
        }
    }
    const resizeMode = mapFitToResizeMode(fit);

    return (
        <RNImage
            source={imgSrc}
            style={{ ...containerStyle, flex: 1, objectFit: resizeMode }}
            resizeMode="cover"
            onError={() => setHasError(true)}
        />
    );
};

export default InternalImage;
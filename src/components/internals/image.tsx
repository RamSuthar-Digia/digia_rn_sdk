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
    fit?: string;
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

const mapFitToResizeMode = (fit?: string): ImageResizeMode => {
    if (!fit) return "contain";
    switch (fit.toLowerCase()) {
        case "cover": return "cover";
        case "fill":
        case "stretch": return "stretch";
        case "center":
        case "none": return "center";
        default: return "contain";
    }
};

const normalizeSource = (
    src: any
): ImageRequireSource | ImageURISource | null => {
    if (!src) return null;
    if (typeof src === "number") return src;
    if (typeof src === "string") return { uri: src };
    if (src.uri) return { uri: src.uri };
    if (src.url) return { uri: src.url };
    return null;
};

const isFiniteNumber = (value?: DimensionValue): boolean => {
    return value !== undefined && value !== null && value != Infinity;
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
    const [loading, setLoading] = useState<boolean>(false);
    const [hasError, setHasError] = useState<boolean>(false);

    const ctx = useConstraints();
    const parentConstraints = ctx?.constraints ?? null;

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

    /* ---------------- CONTAINER STYLE ---------------- */
    const containerStyle: any = {
        width,
        height,
        aspectRatio: imageAspectRatio,
    };

    // if (parentConstraints) {
    //     containerStyle.maxWidth = parentConstraints.maxWidth;
    //     containerStyle.maxHeight = parentConstraints.maxHeight;
    // }

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
            return () => { mounted = false };
        }

        // Network / DataURI SVG
        if (actualImageType === "svg" && typeof src === "string" && hasSvgExtension(src)) {
            (async () => {
                try {
                    setLoading(true);
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
                    if (mounted) setLoading(false);
                }
            })();

            return () => { mounted = false };
        }

        return () => { mounted = false };
    }, [evaluated, actualImageType, svgColor]);

    /* ---------------- PLACEHOLDER ---------------- */
    if (loading && placeholderSrc) {
        if (typeof placeholderSrc === "string" && placeholderSrc.startsWith("<svg")) {
            return (
                <View style={containerStyle}>
                    <SvgXml xml={placeholderSrc} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" />
                </View>
            );
        }
        return (
            <RNImage
                source={normalizeSource(placeholderSrc)!}
                style={containerStyle}
                resizeMode={mapFitToResizeMode(fit)}
            />
        );
    }

    /* ---------------- ERROR FALLBACK ---------------- */
    if (hasError && errorImage) {
        return (
            <View
                style={{
                    ...containerStyle,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <RNImage
                    source={normalizeSource(errorImage)!}
                    style={{ width: 40, height: 40 }}
                    resizeMode="contain"
                />
            </View>
        );
    }

    /* ---------------- SVG RENDER ---------------- */
    if (actualImageType === "svg") {
        if (!svgXml) return <View style={containerStyle} />;

        return (
            <SvgXml
                xml={svgXml}
                style={containerStyle}
                preserveAspectRatio="xMidYMid meet"
            />
        );
    }

    /* ---------------- NORMAL IMAGE ---------------- */
    const imgSrc = normalizeSource(evaluated);
    if (!imgSrc) return null;

    return (
        <RNImage
            source={imgSrc}
            style={containerStyle}
            resizeMode={mapFitToResizeMode(fit)}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
                setLoading(false);
                setHasError(true);
            }}
        />
    );
};

export default InternalImage;

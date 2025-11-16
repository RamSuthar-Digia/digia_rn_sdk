// InternalImage.tsx
import React, { useEffect, useState } from "react";
import {
    View,
    Image as RNImage,
    ActivityIndicator,
    ImageRequireSource,
    ImageURISource,
    ImageResizeMode,
    StyleProp,
    ImageStyle,
} from "react-native";
import { SvgXml } from "react-native-svg";
import { RenderPayload } from "../../framework/render_payload";

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
    style?: StyleProp<ImageStyle>;
    imageAspectRatio?: number | null;
    height?: number | null;
    width?: number | null;
}

/* Helpers */
const hasSvgExtension = (s: any) => {
    if (!s || typeof s !== "string") return false;
    const v = s.trim().toLowerCase();
    return v.startsWith("<svg") || v.startsWith("data:image/svg") || v.endsWith(".svg");
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

/* Main Component */
const InternalImage: React.FC<InternalImageProps> = ({
    imageSourceExpr,
    payload,
    imageType = "auto",
    fit = "contain",
    svgColor,
    placeholderSrc,
    errorImage,
    style,
    imageAspectRatio,
    height,
    width,
}) => {
    const [aspectRatio, setAspectRatio] = useState<number | null>(imageAspectRatio ?? null);
    const [svgXml, setSvgXml] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);

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

    /* Load image or svg */
    useEffect(() => {
        let mounted = true;
        setLoading(true);
        setHasError(false);
        setSvgXml(null);
        setAspectRatio(null);

        const src = evaluated;

        if (!src) {
            if (mounted) {
                setAspectRatio(1);
                setLoading(false);
            }
            return () => { mounted = false; };
        }

        // Inline SVG
        if (actualImageType === "svg" && typeof src === "string" && src.startsWith("<svg")) {
            if (mounted) {
                setSvgXml(applySvgColor(src, svgColor));
                setAspectRatio(1);
                setLoading(false);
            }
            return () => { mounted = false; };
        }

        // Remote SVG
        const uri = typeof src === "string" ? src : src?.uri || src?.url;
        const isRemoteSvg = actualImageType === "svg" && typeof uri === "string" && uri.endsWith(".svg");

        if (isRemoteSvg) {
            fetch(uri)
                .then(r => r.text())
                .then(text => {
                    if (!mounted) return;
                    setSvgXml(applySvgColor(text, svgColor));
                    setAspectRatio(1);
                    setLoading(false);
                })
                .catch(() => {
                    if (mounted) {
                        setHasError(true);
                        setLoading(false);
                    }
                });
            return () => { mounted = false; };
        }

        // Normal images
        if (typeof src === "number") {
            const resolved = RNImage.resolveAssetSource(src);
            if (resolved?.width && resolved.height) {
                if (mounted) {
                    setAspectRatio(resolved.width / resolved.height);
                    setLoading(false);
                }
            }
            return () => { mounted = false; };
        }

        if (uri) {
            RNImage.getSize(
                uri,
                (w, h) => {
                    if (!mounted) return;
                    setAspectRatio(w / h);
                    setLoading(false);
                },
                () => {
                    if (mounted) {
                        setAspectRatio(1);
                        setLoading(false);
                        setHasError(true);
                    }
                }
            );
        }

        return () => { mounted = false; };
    }, [evaluated, actualImageType, svgColor]);

    /* Placeholder when loading */
    if (loading && placeholderSrc) {
        const n = normalizeSource(placeholderSrc);
        if (typeof placeholderSrc === "string" && placeholderSrc.startsWith("<svg")) {
            return (
                <View style={[{ width: width ?? "100%", aspectRatio: aspectRatio ?? 1 }, style]}>
                    <SvgXml xml={placeholderSrc} width="100%" height="100%" />
                </View>
            );
        }
        return (
            <RNImage
                source={n!}
                style={[{ width: width ?? "100%", aspectRatio: aspectRatio ?? 1 }, style]}
                resizeMode={mapFitToResizeMode(fit)}
            />
        );
    }

    /* SVG */
    if (actualImageType === "svg") {
        if (!svgXml) {
            if (hasError && errorImage) {
                return (
                    <RNImage
                        source={normalizeSource(errorImage)!}
                        style={[{ width: width ?? "100%", aspectRatio: aspectRatio ?? 1 }, style]}
                        resizeMode="contain"
                    />
                );
            }
            return <View style={[{ width: width ?? "100%", aspectRatio: 1 }, style]} />;
        }

        return (
            <View style={[{ width: width ?? "100%", aspectRatio: aspectRatio ?? 1 }, style]}>
                <SvgXml xml={svgXml} width="100%" height="100%" />
            </View>
        );
    }

    /* Normal Image */
    const imgSrc = normalizeSource(evaluated);
    if (!imgSrc) return null;

    return (
        <View style={[{ width: width ?? "100%", overflow: "hidden" }, style]}>
            <RNImage
                source={imgSrc}
                style={{ width: "100%", height: "100%", alignSelf: 'center', aspectRatio: aspectRatio ?? 1, }}
                resizeMode={mapFitToResizeMode(fit)}
                onLoad={() => {
                    setLoading(false);
                    setHasError(false);
                }}
                onError={() => {
                    setLoading(false);
                    setHasError(true);
                }}
            />

            {/* Error Image */}
            {hasError && errorImage ? (
                <View style={{
                    position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
                    alignItems: "center", justifyContent: "center"
                }}>
                    <RNImage
                        source={normalizeSource(errorImage)!}
                        style={{ width: 40, height: 40 }}
                        resizeMode="contain"
                    />
                </View>
            ) : null}

            {/* Loading overlay */}
            {loading ? (
                <View style={{
                    position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
                    alignItems: "center", justifyContent: "center"
                }}>
                    <ActivityIndicator />
                </View>
            ) : null}
        </View>
    );
};

export default InternalImage;

/**
 * Utility class for parsing and converting color values.
 * 
 * Supports multiple color formats:
 * - Hex strings: "#RGB", "#RRGGBB", "#RRGGBBAA"
 * - RGBA strings: "255,0,0" or "255,0,0,0.5"
 */
export class ColorUtil {
    /**
     * Regular expression pattern to validate hex color strings.
     *
     * The pattern checks for valid hex color strings in the following formats:
     * - "#RGB" or "#RRGGBB" (with or without the leading "#").
     * - "#RGBA" or "#RRGGBBAA" (with or without the leading "#").
     *
     * The `R`, `G`, `B`, and `A` represent hexadecimal digits (0-9, A-F, a-f) that
     * define the red, green, blue, and alpha components of the color, respectively.
     * 
     * If the alpha value is not provided, the pattern assumes it to be 255 (fully opaque).
     * The alpha value can be either a double ranging from 0.0 to 1.0, or a hexadecimal value
     * ranging from 00 to FF (0 to 255 in decimal).
     */
    static readonly hexColorPattern = /^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

    /**
     * Checks if a given hex color string is a valid color value.
     *
     * @param hex - The hex color string to validate
     * @returns True if the hex string is a valid color value
     * 
     * @example
     * ```typescript
     * ColorUtil.isValidColorHex("#FF0000");     // true
     * ColorUtil.isValidColorHex("00FF00");      // true
     * ColorUtil.isValidColorHex("#12345F80");   // true
     * ColorUtil.isValidColorHex("invalid");     // false
     * ```
     */
    static isValidColorHex(hex: string): boolean {
        return this.hexColorPattern.test(hex);
    }

    /**
     * Converts the given hex color string to the corresponding unsigned integer.
     *
     * Note that when no alpha/opacity is specified, 0xFF is assumed.
     * This method is kept for compatibility but React Native uses hex strings directly.
     *
     * @param hex - The hex color string
     * @returns Unsigned integer representation of the color
     * 
     * @example
     * ```typescript
     * ColorUtil.hexToInt("#FF0000");      // 4294901760 (0xFFFF0000 unsigned)
     * ColorUtil.hexToInt("#4945FF");      // 4283416063 (0xFF4945FF unsigned)
     * ColorUtil.hexToInt("00FF00");       // 4278255360 (0xFF00FF00 unsigned)
     * ColorUtil.hexToInt("#12345F80");    // 2153684864 (0x8012345F unsigned)
     * ```
     */
    static hexToInt(hex: string): number {
        const hexDigits = hex.startsWith('#') ? hex.substring(1) : hex;
        const hexMask = hexDigits.length <= 6 ? 0xff000000 : 0;
        const hexValue = parseInt(hexDigits, 16);

        if (isNaN(hexValue) || hexValue < 0) {
            throw new Error(`Invalid hex color value: ${hex}`);
        }

        // Use unsigned right shift to ensure we get an unsigned 32-bit integer
        return (hexValue | hexMask) >>> 0;
    }

    /**
     * Converts the given hex color string to a React Native color string.
     *
     * @param hex - The hex color string
     * @returns Color string in "#RRGGBB" or "#RRGGBBAA" format
     * 
     * @example
     * ```typescript
     * ColorUtil.fromHexString("#FF0000");      // "#FF0000"
     * ColorUtil.fromHexString("00FF00");       // "#00FF00"
     * ColorUtil.fromHexString("#12345F80");    // "#12345F80"
     * ColorUtil.fromHexString("#4945FF");      // "#4945FF"
     * ```
     */
    static fromHexString(hex: string): string {
        // Validate hex format
        if (!this.isValidColorHex(hex)) {
            throw new Error(`Invalid hex color: ${hex}`);
        }

        const hexDigits = hex.startsWith('#') ? hex.substring(1) : hex;

        // Add alpha if not present (3 or 6 digit hex)
        let result: string;
        if (hexDigits.length === 3) {
            // Convert #RGB to #RRGGBB
            result = '#' + hexDigits[0] + hexDigits[0] +
                hexDigits[1] + hexDigits[1] +
                hexDigits[2] + hexDigits[2];
        } else if (hexDigits.length === 6) {
            // Already #RRGGBB format
            result = '#' + hexDigits;
        } else if (hexDigits.length === 8) {
            // Already #RRGGBBAA format
            result = '#' + hexDigits;
        } else {
            result = '#' + hexDigits;
        }

        return result.toUpperCase();
    }

    /**
     * Tries to convert a hex string to color, returns null if invalid.
     *
     * @param hex - The hex color string
     * @returns Color string or null if parsing fails
     */
    static tryFromHexString(hex: string): string | null {
        try {
            return this.fromHexString(hex);
        } catch (e) {
            return null;
        }
    }

    /**
     * Tries to create a color from comma-separated red, green, blue, and opacity values.
     *
     * Format: "R,G,B" or "R,G,B,A"
     * - R, G, B: 0-255
     * - A (optional): 0.0-1.0 (double) or 0-255 (hex)
     * 
     * Out of range values are brought into range using clamp.
     *
     * @param rgba - The RGBA string
     * @returns Color string in "rgba(R, G, B, A)" format
     * 
     * @example
     * ```typescript
     * ColorUtil.fromRgbaString("255,0,0");        // "rgba(255, 0, 0, 1)"
     * ColorUtil.fromRgbaString("0,255,0,0.5");    // "rgba(0, 255, 0, 0.5)"
     * ColorUtil.fromRgbaString("0,0,255,128");    // "rgba(0, 0, 255, 0.5)"
     * ```
     */
    static fromRgbaString(rgba: string): string {
        // Extract the individual components
        const components = rgba.split(',');

        // Invalid format, throw error
        if (components.length < 3) {
            throw new Error('Invalid RGBA format');
        }

        // Extract R, G, B and clamp to valid range
        const r = Math.max(0, Math.min(255, parseInt(components[0].trim(), 10)));
        const g = Math.max(0, Math.min(255, parseInt(components[1].trim(), 10)));
        const b = Math.max(0, Math.min(255, parseInt(components[2].trim(), 10)));

        let a = 1.0;
        if (components.length === 4) {
            const alphaStr = components[3].trim();
            const alpha0_255 = parseInt(alphaStr, 10);

            if (!isNaN(alpha0_255)) {
                // Integer format (0-255)
                a = Math.max(0, Math.min(255, alpha0_255)) / 255.0;
            } else {
                // Double format (0.0-1.0)
                const alphaDouble = parseFloat(alphaStr);
                a = !isNaN(alphaDouble) ? Math.max(0, Math.min(1, alphaDouble)) : 1.0;
            }
        }

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Tries to convert an RGBA string to color, returns null if invalid.
     *
     * @param rgba - The RGBA string
     * @returns Color string or null if parsing fails
     */
    static tryFromRgbaString(rgba: string): string | null {
        try {
            return this.fromRgbaString(rgba);
        } catch (e) {
            return null;
        }
    }

    /**
     * Tries to convert a string value to a color.
     *
     * Attempts to parse as hex first, then as RGBA.
     *
     * @param value - The color string
     * @returns Color string or null if parsing fails
     * 
     * @example
     * ```typescript
     * ColorUtil.fromString("#FF0000");        // "#FF0000"
     * ColorUtil.fromString("255,0,0");        // "rgba(255, 0, 0, 1)"
     * ColorUtil.fromString("invalid");        // null
     * ColorUtil.fromString(null);             // null
     * ```
     */
    static fromString(value?: string | null): string | null {
        if (value == null || value.length === 0) {
            return null;
        }

        return this.tryFromHexString(value) ?? this.tryFromRgbaString(value);
    }

    /**
     * Converts a string value to a color with fallback.
     *
     * @param value - The color string
     * @param defaultColor - Fallback color if parsing fails (default: "transparent")
     * @returns Color string
     */
    static fromStringOrDefault(
        value: string,
        defaultColor: string = 'transparent'
    ): string {
        return this.fromString(value) ?? defaultColor;
    }

    /**
     * Converts an integer color value to hex string.
     *
     * Note that only the RGB values will be returned (like #RRGGBB), so
     * any alpha/opacity value will be stripped unless includeAlpha is set.
     *
     * @param i - Integer color value
     * @param options - Conversion options
     * @returns Hex string with leading #
     * 
     * @example
     * ```typescript
     * ColorUtil.intToHex(0xFFFF0000);                        // "#FF0000"
     * ColorUtil.intToHex(0x80FF0000, { includeAlpha: true }); // "#80FF0000"
     * ```
     */
    static intToHex(
        i: number,
        options?: {
            includeAlpha?: boolean;
            skipAlphaIfOpaque?: boolean;
        }
    ): string {
        if (i < 0 || i > 0xffffffff) {
            throw new Error(`Invalid color integer: ${i}`);
        }

        const a = (i >>> 24) & 0xff;
        const r = (i >>> 16) & 0xff;
        const g = (i >>> 8) & 0xff;
        const b = i & 0xff;

        const includeAlpha = options?.includeAlpha ?? false;
        const skipAlphaIfOpaque = options?.skipAlphaIfOpaque ?? true;

        let hex = '#';

        if (includeAlpha && !(skipAlphaIfOpaque && a === 0xff)) {
            hex += this._padRadix(a);
        }

        hex += this._padRadix(r);
        hex += this._padRadix(g);
        hex += this._padRadix(b);

        return hex.toUpperCase();
    }

    /**
     * Converts RGBA color values to hex string.
     * 
     * This is the equivalent of Dart's toHexString method.
     *
     * @param color - Object with r, g, b, a properties (0-1 range) or RGBA string
     * @param options - Conversion options
     * @returns Hex string with leading #
     * 
     * @example
     * ```typescript
     * ColorUtil.toHexString({ r: 1, g: 0, b: 0, a: 1 });  // "#FF0000"
     * ColorUtil.toHexString("rgba(255, 0, 0, 0.5)", { includeHashSign: true, skipAlphaIfOpaque: false });  // "#80FF0000"
     * ```
     */
    static toHexString(
        color: { r: number; g: number; b: number; a: number } | string,
        options?: {
            includeHashSign?: boolean;
            skipAlphaIfOpaque?: boolean;
        }
    ): string {
        const includeHashSign = options?.includeHashSign ?? true;
        const skipAlphaIfOpaque = options?.skipAlphaIfOpaque ?? true;

        let r: number, g: number, b: number, a: number;

        if (typeof color === 'string') {
            // Parse RGBA string
            const rgba = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
            if (!rgba) {
                throw new Error(`Invalid color string: ${color}`);
            }
            r = parseInt(rgba[1]) / 255;
            g = parseInt(rgba[2]) / 255;
            b = parseInt(rgba[3]) / 255;
            a = rgba[4] ? parseFloat(rgba[4]) : 1;
        } else {
            r = color.r;
            g = color.g;
            b = color.b;
            a = color.a;
        }

        const alphaHex = this._padRadix(Math.round(a * 255) & 0xff);
        const alphaString = (skipAlphaIfOpaque && alphaHex.toUpperCase() === 'FF') ? '' : alphaHex;

        const hex = (includeHashSign ? '#' : '') +
            alphaString +
            this._padRadix(Math.round(r * 255) & 0xff) +
            this._padRadix(Math.round(g * 255) & 0xff) +
            this._padRadix(Math.round(b * 255) & 0xff);

        return hex.toUpperCase();
    }

    /**
     * Fills up a 3-character hex string to 6 characters.
     *
     * @param hex - The hex color string
     * @returns Expanded hex string
     * 
     * @example
     * ```typescript
     * ColorUtil.fillUpHex("#F00");    // "#FF0000"
     * ColorUtil.fillUpHex("ABC");     // "#AABBCC"
     * ```
     */
    static fillUpHex(hex: string): string {
        if (!hex.startsWith('#')) {
            hex = '#' + hex;
        }

        if (hex.length === 7) {
            return hex;
        }

        let filledUp = '';
        for (const char of hex) {
            if (char === '#') {
                filledUp += char;
            } else {
                filledUp += char + char;
            }
        }
        return filledUp;
    }

    /**
     * Generates a random color with specified opacity.
     *
     * @param opacity - Alpha value from 0.0 to 1.0 (default: 0.3)
     * @returns Random color string
     * 
     * @example
     * ```typescript
     * ColorUtil.randomColor();         // Random color with 0.3 opacity
     * ColorUtil.randomColor(1.0);      // Random opaque color
     * ```
     */
    static randomColor(opacity: number = 0.3): string {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        const a = Math.max(0, Math.min(1, opacity));

        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    /**
     * Pads a number to 2-digit hex string.
     * @private
     */
    private static _padRadix(value: number): string {
        return value.toString(16).padStart(2, '0');
    }
}

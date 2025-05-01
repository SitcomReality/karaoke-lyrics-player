// colorUtils.js - Utility functions for color manipulation and calculations

/**
 * Converts RGB color values to a hex string.
 * @param {number} r - Red value (0-255).
 * @param {number} g - Green value (0-255).
 * @param {number} b - Blue value (0-255).
 * @returns {string} Hex color string (e.g., "#RRGGBB").
 */
export function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}

/**
 * Converts a hex color string to an RGB object.
 * @param {string} hex - Hex color string (e.g., "#RRGGBB" or "#RGB").
 * @returns {{r: number, g: number, b: number} | null} RGB object or null if invalid hex.
 */
export function hexToRgb(hex) {
    if (!hex) return null; // Handle null or undefined input
    // Expand shorthand form (e.g. "03F") to full form ("0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null; // Return null on invalid hex
}

/**
 * Converts RGB color values to HSL values.
 * Assumes r, g, and b are contained in the set [0, 255] and
 * returns h in the set [0, 360], s and l in the set [0, 100].
 * @param {number} r - Red value.
 * @param {number} g - Green value.
 * @param {number} b - Blue value.
 * @returns {{h: number, s: number, l: number} | null} HSL object or null if input is invalid.
 */
export function rgbToHsl(r, g, b) {
    if (r == null || g == null || b == null) return null;
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
        h = s = 0; // achromatic
    } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
}

/**
 * Converts HSL color values to RGB values.
 * Assumes h is contained in [0, 360] and s, l are contained in [0, 100] and
 * returns r, g, and b in the set [0, 255].
 * @param {number} h - Hue.
 * @param {number} s - Saturation.
 * @param {number} l - Lightness.
 * @returns {{r: number, g: number, b: number} | null} RGB object or null if input is invalid.
 */
export function hslToRgb(h, s, l) {
    if (h == null || s == null || l == null) return null;
    h /= 360; s /= 100; l /= 100;
    let r, g, b;

    if (s === 0) {
        r = g = b = l; // achromatic
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

/**
 * Calculates the relative luminance of an RGB color.
 * @param {{r: number, g: number, b: number} | null} rgb - RGB object.
 * @returns {number} Luminance value (0-1).
 */
export function getLuminance(rgb) {
    if (!rgb) return 0; // Handle potential null input
    const RsRGB = rgb.r / 255;
    const GsRGB = rgb.g / 255;
    const BsRGB = rgb.b / 255;

    const R = (RsRGB <= 0.03928) ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = (GsRGB <= 0.03928) ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = (BsRGB <= 0.03928) ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calculates the WCAG contrast ratio between two RGB colors.
 * @param {{r: number, g: number, b: number} | null} rgb1 - First RGB color.
 * @param {{r: number, g: number, b: number} | null} rgb2 - Second RGB color.
 * @returns {number} Contrast ratio (1-21).
 */
export function calculateContrast(rgb1, rgb2) {
    if (!rgb1 || !rgb2) return 1; // Return minimum contrast if colors are invalid
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Checks if two colors meet a minimum contrast ratio (WCAG AA for normal text).
 * @param {string} color1Hex - First hex color string.
 * @param {string} color2Hex - Second hex color string.
 * @param {number} [minRatio=4.5] - The minimum required contrast ratio.
 * @returns {boolean} True if contrast is sufficient, false otherwise.
 */
export function ensureContrast(color1Hex, color2Hex, minRatio = 4.5) {
    const rgb1 = hexToRgb(color1Hex);
    const rgb2 = hexToRgb(color2Hex);
    if (!rgb1 || !rgb2) return false; // Cannot ensure contrast if colors are invalid
    return calculateContrast(rgb1, rgb2) >= minRatio;
}

/**
 * Calculates a simple perceived brightness of an RGB color.
 * @param {{r: number, g: number, b: number} | null} rgb - RGB object.
 * @returns {number} Brightness value (0-255).
 */
export function calculateBrightness(rgb) {
    if (!rgb) return 0;
    return (rgb.r + rgb.g + rgb.b) / 3;
}

/**
 * Calculates the saturation of an RGB color in HSL space.
 * @param {{r: number, g: number, b: number} | null} rgb - RGB object.
 * @returns {number} Saturation value (0-100).
 */
export function calculateSaturation(rgb) {
    if (!rgb) return 0;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

    if (max === 0 || delta === 0) return 0; // Achromatic or single color

    const lightness = (max + min) / 2;

    let saturation;
    if (lightness < 0.5) {
        saturation = delta / (max + min);
    } else {
        saturation = delta / (2 - max - min);
    }

    return saturation * 100;
}
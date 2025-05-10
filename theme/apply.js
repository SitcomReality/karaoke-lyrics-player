// theme/apply.js - Functions for applying theme to CSS variables
import { elements } from '../dom.js';
import * as ColorUtils from '../colorUtils.js';

/**
 * Converts a hex color to its RGB components string (e.g., "255, 0, 128").
 * @param {string} hex - Hex color string.
 * @returns {string} RGB component string or default if invalid.
 */
function hexToRgbString(hex) {
    const rgb = ColorUtils.hexToRgb(hex);
    if (!rgb) return '255, 255, 255'; // Default to white components if conversion fails
    return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
}

/**
 * Applies the given theme object to the document's CSS variables.
 * @param {object} theme - The theme object with color properties.
 */
export function applyTheme(theme) {
    elements.root.style.setProperty('--primary-color', theme.primary);
    elements.root.style.setProperty('--secondary-color', theme.secondary);
    elements.root.style.setProperty('--accent-color', theme.accent);
    elements.root.style.setProperty('--background-color', theme.background);
    elements.root.style.setProperty('--on-background', theme.text);
    elements.root.style.setProperty('--on-surface', theme.text); // Use same text color for surface by default

    // Derive surface color from background
    const currentBgRgb = ColorUtils.hexToRgb(theme.background);
    let surfaceColorHex;
    if (currentBgRgb) {
        const brightness = ColorUtils.calculateBrightness(currentBgRgb);
        // Adjust brightness slightly based on how dark the background is
        // Increase brightness slightly for dark backgrounds, decrease for light ones
        const adjustment = brightness < 128 ? 5 : -3;
        surfaceColorHex = ColorUtils.adjustBrightness(theme.background, adjustment);
    } else {
        surfaceColorHex = ColorUtils.adjustBrightness(theme.background, 5); // Fallback adjustment
    }
    elements.root.style.setProperty('--surface-color', surfaceColorHex);

    // Set contrast colors based on the main colors
    const onPrimary = ColorUtils.getContrastColor(theme.primary);
    const onSecondary = ColorUtils.getContrastColor(theme.secondary);
    // For surface, derive contrast from the *calculated* surface color
    const onSurface = ColorUtils.getContrastColor(surfaceColorHex);
    const onError = ColorUtils.getContrastColor(elements.root.style.getPropertyValue('--error-color') || '#cf6679'); // Use existing or default error color

    elements.root.style.setProperty('--on-primary', onPrimary);
    elements.root.style.setProperty('--on-secondary', onSecondary);
    elements.root.style.setProperty('--on-surface', onSurface); // Override default text color if needed for surface contrast
    elements.root.style.setProperty('--on-error', onError);

    // Set RGB versions of all colors for rgba() usage
    elements.root.style.setProperty('--rgb-primary', hexToRgbString(theme.primary));
    elements.root.style.setProperty('--rgb-secondary', hexToRgbString(theme.secondary));
    elements.root.style.setProperty('--rgb-accent', hexToRgbString(theme.accent));
    elements.root.style.setProperty('--rgb-background', hexToRgbString(theme.background));
    elements.root.style.setProperty('--rgb-surface', hexToRgbString(surfaceColorHex));
    elements.root.style.setProperty('--rgb-error', hexToRgbString(elements.root.style.getPropertyValue('--error-color') || '#cf6679'));

    elements.root.style.setProperty('--rgb-on-primary', hexToRgbString(onPrimary));
    elements.root.style.setProperty('--rgb-on-secondary', hexToRgbString(onSecondary));
    elements.root.style.setProperty('--rgb-on-background', hexToRgbString(theme.text));
    elements.root.style.setProperty('--rgb-on-surface', hexToRgbString(onSurface));
    elements.root.style.setProperty('--rgb-on-error', hexToRgbString(onError));
}
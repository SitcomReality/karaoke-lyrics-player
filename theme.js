// theme.js - Manages theme application, state, and UI updates related to theme
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as ColorUtils from './colorUtils.js';
import { applyFont } from './fontLoader.js'; // Import only necessary function

// Module-level variable to track theme variation for extracted colors
let themeVariationIndex = 0;

/**
 * Resets the rotation offset for applying extracted themes.
 * Called when opening the modal or loading a new image.
 */
export function resetThemeRotationOffset() {
    themeVariationIndex = 0;
}

/**
 * Updates the theme preview UI elements and applies the theme and font.
 */
export function updateThemeUI() {
    // Update theme color previews in the sidebar
    elements.primaryColor.style.backgroundColor = state.currentSong.theme.primary;
    elements.secondaryColor.style.backgroundColor = state.currentSong.theme.secondary;
    elements.accentColor.style.backgroundColor = state.currentSong.theme.accent;
    elements.backgroundColor.style.backgroundColor = state.currentSong.theme.background;
    elements.textColor.style.backgroundColor = state.currentSong.theme.text;

    // Apply theme colors to CSS variables
    applyTheme(state.currentSong.theme);

    // Update font selector dropdown and apply the font
    updateFontSelector();
    if (state.currentSong.font) {
        applyFont(state.currentSong.font);
    } else {
        applyFont('Roboto'); // Apply default if none is set
    }
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

    // Derive surface color from background
    const currentBgRgb = ColorUtils.hexToRgb(theme.background);
    let surfaceColor;
    if (currentBgRgb) {
        const brightness = ColorUtils.calculateBrightness(currentBgRgb);
        // Adjust brightness slightly based on how dark the background is
        const adjustment = brightness < 50 ? 10 : (brightness < 100 ? 7 : 5);
        surfaceColor = ColorUtils.adjustBrightness(theme.background, adjustment);
    } else {
        surfaceColor = ColorUtils.lightenColor(theme.background, 5); // Fallback adjustment
    }
    elements.root.style.setProperty('--surface-color', surfaceColor);

    // Set text contrast colors based on background colors
    // Use a helper function for better readability
    elements.root.style.setProperty('--on-primary', ColorUtils.getContrastColor(theme.primary));
    elements.root.style.setProperty('--on-secondary', ColorUtils.getContrastColor(theme.secondary));
    // Don't usually need contrast for accent, but can add if needed:
    // elements.root.style.setProperty('--on-accent', ColorUtils.getContrastColor(theme.accent));
    elements.root.style.setProperty('--on-error', ColorUtils.getContrastColor('#cf6679')); // Assuming error color is fixed
}

/**
 * Updates the font selector dropdown based on the current song's font.
 * Adds the current font to the list if it's custom and not already present.
 */
function updateFontSelector() {
    const currentFont = state.currentSong.font;
    const standardFonts = ['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'custom'];

    // Add the current font to the list if it's custom and not already present
    if (currentFont && !standardFonts.includes(currentFont)) {
        let optionExists = false;
        for (let i = 0; i < elements.fontSelector.options.length; i++) {
            if (elements.fontSelector.options[i].value === currentFont) {
                optionExists = true;
                break;
            }
        }
        if (!optionExists) {
            const option = document.createElement('option');
            option.value = currentFont;
            option.textContent = currentFont;
            // Insert before the 'custom' option
            const customOption = elements.fontSelector.querySelector('option[value="custom"]');
            if (customOption) {
                 elements.fontSelector.insertBefore(option, customOption);
            } else {
                elements.fontSelector.appendChild(option); // Fallback if 'custom' not found
            }
        }
    }
    // Set the selected value
    elements.fontSelector.value = currentFont || 'Roboto'; // Default to Roboto if no font is set
}

/**
 * Populates the color input fields in the color edit modal with the current theme colors.
 */
export function populateColorInputs() {
    elements.primaryColorInput.value = state.currentSong.theme.primary;
    elements.secondaryColorInput.value = state.currentSong.theme.secondary;
    elements.accentColorInput.value = state.currentSong.theme.accent;
    elements.backgroundColorInput.value = state.currentSong.theme.background;
    elements.textColorInput.value = state.currentSong.theme.text;
}

// --- Theme Generation Strategies ---

/** Minimum required difference between primary, secondary, and accent colors */
const MIN_COLOR_DIFF = 50;

/**
 * Generates fallback colors based on a background color.
 * @param {string} bgColor - The background color hex string.
 * @param {string} textColor - The text color hex string.
 * @returns {object} Object containing fallback primary, secondary, and accent colors.
 */
function generateFallbackThemeColors(bgColor, textColor) {
    const primary = ColorUtils.shiftHue(bgColor, 30); // Shift hue slightly
    const accent = ColorUtils.shiftHue(primary, 120); // Complementary-ish
    const secondary = ColorUtils.adjustBrightness(primary, -10); // Slightly darker primary

    return {
        primary: ColorUtils.ensureContrast(primary, bgColor) ? primary : textColor, // Ensure contrast or use text color
        secondary: ColorUtils.ensureContrast(secondary, bgColor) ? secondary : ColorUtils.adjustBrightness(textColor, -10),
        accent: ColorUtils.ensureContrast(accent, bgColor) ? accent : ColorUtils.shiftHue(textColor, 120)
    };
}

/**
 * Assigns primary, secondary, and accent colors from a list of remaining colors,
 * ensuring some difference between them and falling back if necessary.
 * @param {Array} remainingColors - Array of analyzed color objects.
 * @param {string} bgColor - Background color hex string.
 * @param {string} textColor - Text color hex string.
 * @returns {object} Object with primary, secondary, and accent color hex strings.
 */
function assignRemainingColors(remainingColors, bgColor, textColor) {
    const fallbacks = generateFallbackThemeColors(bgColor, textColor);
    let primaryColor = fallbacks.primary;
    let secondaryColor = fallbacks.secondary;
    let accentColor = fallbacks.accent;

    if (remainingColors.length > 0) {
        primaryColor = remainingColors[0].hex;
    }
    if (remainingColors.length > 1) {
        // Find secondary different enough from primary
        const potentialSecondary = remainingColors.slice(1).find(c => ColorUtils.calculateColorDifference(primaryColor, c.hex) > MIN_COLOR_DIFF);
        secondaryColor = potentialSecondary ? potentialSecondary.hex : fallbacks.secondary;
    }
    if (remainingColors.length > 2) {
         // Find accent different enough from primary and secondary
        const potentialAccent = remainingColors.slice(1).find(c =>
            c.hex !== secondaryColor && ColorUtils.calculateColorDifference(primaryColor, c.hex) > MIN_COLOR_DIFF
        );
        accentColor = potentialAccent ? potentialAccent.hex : fallbacks.accent;
    }

    // Final fallback if accent is too similar to secondary (can happen if only 2 remaining colors)
    if (ColorUtils.calculateColorDifference(secondaryColor, accentColor) < MIN_COLOR_DIFF && accentColor !== fallbacks.accent) {
        accentColor = fallbacks.accent;
    }

    return { primary: primaryColor, secondary: secondaryColor, accent: accentColor };
}

/** Strategy 1: Dark Background (Original Logic) */
function strategyDarkBackground(analyzedPalette) {
    const sortedByBrightness = [...analyzedPalette].sort((a, b) => a.brightness - b.brightness);

    let bgColor = sortedByBrightness[0].hex;
    let textColor = sortedByBrightness[sortedByBrightness.length - 1].hex;

    if (!ColorUtils.ensureContrast(textColor, bgColor)) {
        textColor = ColorUtils.getContrastColor(bgColor);
    }

    const remainingColors = analyzedPalette
        .filter(c => c.hex !== bgColor && c.hex !== textColor)
        .sort((a, b) => b.saturation - a.saturation); // Sort remaining by saturation

    const assigned = assignRemainingColors(remainingColors, bgColor, textColor);

    return { ...assigned, background: bgColor, text: textColor };
}

/** Strategy 2: Light Background */
function strategyLightBackground(analyzedPalette) {
    const sortedByBrightness = [...analyzedPalette].sort((a, b) => b.brightness - a.brightness); // Lightest first

    let bgColor = sortedByBrightness[0].hex;
    let textColor = sortedByBrightness[sortedByBrightness.length - 1].hex;

    if (!ColorUtils.ensureContrast(textColor, bgColor)) {
        textColor = ColorUtils.getContrastColor(bgColor);
    }

    const remainingColors = analyzedPalette
        .filter(c => c.hex !== bgColor && c.hex !== textColor)
        .sort((a, b) => b.saturation - a.saturation); // Sort remaining by saturation

    const assigned = assignRemainingColors(remainingColors, bgColor, textColor);

    return { ...assigned, background: bgColor, text: textColor };
}

/** Strategy 3: Vibrant Background */
function strategyVibrantBackground(analyzedPalette) {
    const sortedBySaturation = [...analyzedPalette].sort((a, b) => b.saturation - a.saturation); // Most saturated first

    let bgColor = sortedBySaturation[0].hex;
    let textColor = ColorUtils.getContrastColor(bgColor);

    // Filter out BG, sort remaining by brightness (less vibrant first)
    const remainingColors = analyzedPalette
        .filter(c => c.hex !== bgColor) // Don't filter text as it was generated
        .sort((a, b) => a.saturation - b.saturation);

    const assigned = assignRemainingColors(remainingColors, bgColor, textColor);

    return { ...assigned, background: bgColor, text: textColor };
}

/** Strategy 4: Balanced Luminance Background */
function strategyBalancedLuminance(analyzedPalette) {
     const sortedByLuminance = [...analyzedPalette].sort((a, b) => a.luminance - b.luminance);

     let bgColor = sortedByLuminance[0].hex; // Lowest luminance BG
     let textColor = sortedByLuminance[sortedByLuminance.length - 1].hex; // Highest luminance Text

    if (!ColorUtils.ensureContrast(textColor, bgColor)) {
        textColor = ColorUtils.getContrastColor(bgColor);
    }

    // Filter BG/Text, sort remaining by saturation
    const remainingColors = analyzedPalette
        .filter(c => c.hex !== bgColor && c.hex !== textColor)
        .sort((a, b) => b.saturation - a.saturation);

    const assigned = assignRemainingColors(remainingColors, bgColor, textColor);

    return { ...assigned, background: bgColor, text: textColor };
}

/**
 * Applies a theme variation based on the currently extracted colors.
 * Cycles through different strategies on subsequent calls.
 * Populates the color input fields in the modal.
 */
export function applyExtractedTheme() {
    const palette = state.currentSong.extractedPalette;
    if (!palette || palette.length === 0) {
        alert("No extracted colors available. Please extract colors from an image first.");
        return;
    }

    const MIN_COLORS_FOR_VARIETY = 3; // Need at least BG, Text, Primary

    // Duplicate palette if too small to provide enough unique colors for roles
    let usablePalette = [...palette];
    while (usablePalette.length < MIN_COLORS_FOR_VARIETY && palette.length > 0) {
        usablePalette = usablePalette.concat(palette);
    }
     // Ensure palette has at least MIN_COLORS_FOR_VARIETY unique-ish colors if possible
    usablePalette = usablePalette.slice(0, Math.max(MIN_COLORS_FOR_VARIETY, palette.length * 2)); // Allow duplicates

    // Analyze colors (brightness and saturation)
    const analyzedPalette = usablePalette.map(hex => {
        const rgb = ColorUtils.hexToRgb(hex);
        return {
            hex: hex,
            rgb: rgb,
            brightness: rgb ? ColorUtils.calculateBrightness(rgb) : 0,
            saturation: rgb ? ColorUtils.calculateSaturation(rgb) : 0,
            luminance: rgb ? ColorUtils.getLuminance(rgb) : 0
        };
    });

    // --- Theme Selection Logic ---
    const strategies = [
        strategyDarkBackground,
        strategyLightBackground,
        strategyVibrantBackground,
        strategyBalancedLuminance,
    ];
    const numStrategies = strategies.length;
    const strategyIndex = themeVariationIndex % numStrategies;

    // Get the theme using the selected strategy
    const generatedTheme = strategies[strategyIndex](analyzedPalette);

    // --- Populate Inputs in the Modal ---
    elements.backgroundColorInput.value = generatedTheme.background;
    elements.textColorInput.value = generatedTheme.text;
    elements.primaryColorInput.value = generatedTheme.primary;
    elements.secondaryColorInput.value = generatedTheme.secondary;
    elements.accentColorInput.value = generatedTheme.accent;

    // Increment variation index for the next click
    themeVariationIndex++;

    // Update button title to show which variation is next (optional)
    elements.applyExtractedThemeBtn.title = `Apply theme based on extracted colors (Click for variation ${themeVariationIndex % numStrategies + 1}/${numStrategies})`;
}
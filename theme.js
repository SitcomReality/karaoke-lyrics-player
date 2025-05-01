// theme.js - Manages theme application, state, and UI updates related to theme
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import * as ColorUtils from './colorUtils.js';
import { applyFont } from './fontLoader.js'; // Import only necessary function

// Module-level variable to track theme rotation for extracted colors
let themeRotationOffset = 0;

/**
 * Resets the rotation offset for applying extracted themes.
 */
export function resetThemeRotationOffset() {
    themeRotationOffset = 0;
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

/**
 * Applies a theme based on the currently extracted colors.
 * Rotates through the extracted palette on subsequent calls.
 * Populates the color input fields in the modal.
 */
export function applyExtractedTheme() {
    const palette = state.currentSong.extractedPalette;
    if (!palette || palette.length === 0) {
        alert("No extracted colors available. Please extract colors from an image first.");
        return;
    }

    const MIN_COLORS = 5;

    // Rotate the palette based on the offset
    const rotationIndex = themeRotationOffset % palette.length;
    const rotatedPalette = [...palette.slice(rotationIndex), ...palette.slice(0, rotationIndex)];

    // Ensure we have enough colors, duplicating if necessary
    let usablePalette = [...rotatedPalette];
    while (usablePalette.length < MIN_COLORS && palette.length > 0) {
        // Append original palette rotated differently to avoid immediate repeats
        const nextRotation = (rotationIndex + Math.floor(palette.length / 2)) % palette.length;
        usablePalette = usablePalette.concat([...palette.slice(nextRotation), ...palette.slice(0, nextRotation)]);
    }
    // Ensure usablePalette length is at least MIN_COLORS if possible
    usablePalette = usablePalette.slice(0, Math.max(MIN_COLORS, palette.length));

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

    // Sort by brightness (darkest first) for background/text candidates
    analyzedPalette.sort((a, b) => a.brightness - b.brightness);

    // Choose background (darkest) and text (lightest)
    let bgColor = analyzedPalette[0].hex;
    let textColor = analyzedPalette[analyzedPalette.length - 1].hex;

    // Ensure minimum contrast
    const contrastRatio = ColorUtils.calculateContrast(ColorUtils.hexToRgb(bgColor), ColorUtils.hexToRgb(textColor));
    if (contrastRatio < 4.5) {
        console.warn(`Initial BG/Text contrast low (${contrastRatio.toFixed(2)}). Adjusting text.`);
        // If contrast is too low, generate a compliant text color based on the chosen background
        textColor = ColorUtils.getContrastColor(bgColor);
    }

    // Filter out background and text colors for selecting primary/secondary/accent
    const remainingColors = analyzedPalette.filter(c => c.hex !== bgColor && c.hex !== textColor);

    // Sort remaining by saturation (most saturated first) for primary/accent
    remainingColors.sort((a, b) => b.saturation - a.saturation);

    // Fallback color generation if not enough distinct colors
    const fallbackPrimary = ColorUtils.lightenColor(bgColor, 30);
    const fallbackAccent = ColorUtils.shiftHue(fallbackPrimary, 120);
    const fallbackSecondary = ColorUtils.darkenColor(fallbackPrimary, 15);

    let primaryColor = remainingColors.length > 0 ? remainingColors[0].hex : fallbackPrimary;
    let accentColor = remainingColors.length > 1 ? remainingColors[1].hex : fallbackAccent;
    let secondaryColor = remainingColors.length > 2 ? remainingColors[2].hex : fallbackSecondary;

    // Avoid primary/secondary/accent being too similar if palette allows
    const MIN_DIFF = 50; // Minimum color difference threshold
    if (remainingColors.length > 2) {
        if (ColorUtils.calculateColorDifference(primaryColor, secondaryColor) < MIN_DIFF) {
            secondaryColor = remainingColors[2].hex; // Try the next most saturated
            // If still too similar, generate fallback
            if (ColorUtils.calculateColorDifference(primaryColor, secondaryColor) < MIN_DIFF) {
                 secondaryColor = ColorUtils.darkenColor(primaryColor, 15);
            }
        }
         if (ColorUtils.calculateColorDifference(primaryColor, accentColor) < MIN_DIFF || accentColor === secondaryColor) {
             // Try the next available distinct color if possible
             const potentialAccent = remainingColors.find(c =>
                c.hex !== primaryColor && c.hex !== secondaryColor && c.hex !== accentColor
             );
             accentColor = potentialAccent ? potentialAccent.hex : ColorUtils.shiftHue(primaryColor, 120);
         }
    }


    // --- Populate Inputs in the Modal ---
    elements.backgroundColorInput.value = bgColor;
    elements.textColorInput.value = textColor;
    elements.primaryColorInput.value = primaryColor;
    elements.secondaryColorInput.value = secondaryColor;
    elements.accentColorInput.value = accentColor;

    // Increment rotation offset for the next click
    themeRotationOffset++;
}
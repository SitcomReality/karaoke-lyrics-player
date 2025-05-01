// Theme management functions
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import ColorThief from 'color-thief';

export function updateThemeUI() {
    // Update theme color previews
    elements.primaryColor.style.backgroundColor = state.currentSong.theme.primary;
    elements.secondaryColor.style.backgroundColor = state.currentSong.theme.secondary;
    elements.accentColor.style.backgroundColor = state.currentSong.theme.accent;
    elements.backgroundColor.style.backgroundColor = state.currentSong.theme.background;
    elements.textColor.style.backgroundColor = state.currentSong.theme.text;

    // Apply theme to the document
    applyTheme(state.currentSong.theme);

    // Update font selector and apply font
    updateFontSelector();
    if (state.currentSong.font) {
        applyFont(state.currentSong.font);
    }
}

export function applyTheme(theme) {
    elements.root.style.setProperty('--primary-color', theme.primary);
    elements.root.style.setProperty('--secondary-color', theme.secondary);
    elements.root.style.setProperty('--accent-color', theme.accent);
    elements.root.style.setProperty('--background-color', theme.background);
    elements.root.style.setProperty('--on-background', theme.text);
    // Add surface color derived from background (e.g., slightly lighter)
    const surface = adjustBrightness(theme.background, 5);
    elements.root.style.setProperty('--surface-color', surface);
    // Ensure text contrast on primary/accent if needed
    // For simplicity, keeping these fixed for now
    // elements.root.style.setProperty('--on-primary', getContrastColor(theme.primary));
    // elements.root.style.setProperty('--on-accent', getContrastColor(theme.accent));
}

function updateFontSelector() {
    // Add the current font to the list if it's not already there (e.g., loaded from storage)
     const currentFont = state.currentSong.font;
     if (currentFont && !['Roboto', 'Open Sans', 'Lato', 'Montserrat', 'custom'].includes(currentFont)) {
         if (!Array.from(elements.fontSelector.options).some(option => option.value === currentFont)) {
             const option = document.createElement('option');
             option.value = currentFont;
             option.textContent = currentFont;
             elements.fontSelector.insertBefore(option, elements.fontSelector.querySelector('option[value="custom"]'));
         }
     }
     // Set the selected value
     elements.fontSelector.value = currentFont || 'Roboto';
}

export function applyFont(fontName) {
    if (fontName === 'Roboto' || fontName === 'Open Sans' ||
        fontName === 'Lato' || fontName === 'Montserrat') {
        // Standard fonts already available or pre-linked
        elements.root.style.fontFamily = `'${fontName}', var(--default-font-stack, sans-serif)`;
    } else {
        // Try to load from Google Fonts
        loadGoogleFont(fontName);
        elements.root.style.fontFamily = `'${fontName}', var(--default-font-stack, sans-serif)`;
    }
}

function loadGoogleFont(fontName) {
    const sanitizedFontName = fontName.replace(/\s+/g, '+');
    const fontUrl = `https://fonts.googleapis.com/css2?family=${sanitizedFontName}:wght@300;400;700&display=swap`;

    // Check if already loaded
    if (document.querySelector(`link[href="${fontUrl}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
}

export function populateColorInputs() {
    elements.primaryColorInput.value = state.currentSong.theme.primary;
    elements.secondaryColorInput.value = state.currentSong.theme.secondary;
    elements.accentColorInput.value = state.currentSong.theme.accent;
    elements.backgroundColorInput.value = state.currentSong.theme.background;
    elements.textColorInput.value = state.currentSong.theme.text;
}

export function extractColorsFromImage(imageElement) {
    try {
        const colorThief = new ColorThief();

        // Wait for the image to be loaded (especially important after upload)
        if (imageElement.complete && imageElement.naturalWidth > 0) { // Check naturalWidth to ensure image is loaded
            extractColors(colorThief, imageElement);
        } else {
            imageElement.onload = function() {
                // Check again in case onload fires before image data is ready
                if(imageElement.naturalWidth > 0) {
                    extractColors(colorThief, imageElement);
                } else {
                     console.warn("Image loaded but naturalWidth is 0, skipping color extraction.");
                }
                imageElement.onload = null; // Remove listener after execution
            };
             imageElement.onerror = function() {
                 console.error("Image failed to load, cannot extract colors.");
                 imageElement.onerror = null; // Remove listener
             }
        }
    } catch (error) {
        console.error("Error initiating ColorThief:", error);
    }
}

function extractColors(colorThief, imageElement) {
    try {
        // Get dominant color
        const dominantColor = colorThief.getColor(imageElement);
        // Get a palette
        const palette = colorThief.getPalette(imageElement, 5); // Get 5 colors

        // Convert RGB arrays to hex
        const primaryHex = rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]);

        // Pick contrasting colors from the palette for other theme elements
        // Prefer colors from palette, but have fallbacks
        const paletteHex = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        // Choose background: Ensure it's dark. Start with dominant, darken if needed.
        let backgroundHex = primaryHex;
        if (calculateBrightness(dominantColor) > 128) { // If dominant is light, find a dark color in palette or darken dominant
             backgroundHex = paletteHex.find(hex => calculateBrightness(hexToRgb(hex)) < 80) || darkenColor(primaryHex, 85); // Darken significantly
        } else {
            backgroundHex = darkenColor(primaryHex, 50); // Darken even if already dark-ish
        }
        // Ensure minimum darkness
        if(calculateBrightness(hexToRgb(backgroundHex)) > 50) {
             backgroundHex = '#121212'; // Force dark if necessary
        }

        // Choose text: Ensure it's light and contrasts with background
        let textHex = '#e1e1e1'; // Default light text
        const bgRgb = hexToRgb(backgroundHex);
        if (calculateContrast(bgRgb, hexToRgb(textHex)) < 4.5) { // WCAG contrast ratio check
             textHex = '#ffffff'; // Try pure white
             if (calculateContrast(bgRgb, hexToRgb(textHex)) < 4.5) {
                 // If white also fails, might need a more complex approach, but rare for dark bg
                 console.warn("Could not find sufficient contrast for text color.");
             }
        }

        // Choose Primary: Use dominant color unless it's too close to background
        let primaryActualHex = primaryHex;
        if (calculateColorDifference(primaryHex, backgroundHex) < 50 || calculateContrast(hexToRgb(primaryHex), hexToRgb(backgroundHex)) < 1.5) {
             primaryActualHex = paletteHex.find(hex => hex !== backgroundHex && calculateContrast(hexToRgb(hex), hexToRgb(backgroundHex)) > 2) || shiftHue(backgroundHex, 180);
        }

        // Choose Secondary: Darker/Lighter shade of Primary or distinct palette color
        let secondaryHex = paletteHex.find(hex =>
                hex !== backgroundHex &&
                hex !== primaryActualHex &&
                calculateColorDifference(hex, primaryActualHex) > 80
        ) || adjustBrightness(primaryActualHex, -20); // Darken primary as fallback

        // Choose Accent: Vibrant color from palette, distinct from others
        let accentHex = findVibrantAccent(paletteHex, [backgroundHex, primaryActualHex, secondaryHex]);
         if (!accentHex) { // Fallback if no suitable vibrant color found
             accentHex = shiftHue(primaryActualHex, 90); // Shift hue significantly from primary
             if (calculateColorDifference(accentHex, backgroundHex) < 100) { // Ensure it's not too close to bg
                 accentHex = '#03dac6'; // Default accent fallback
             }
         }

        // Update state
        state.currentSong.theme = {
            primary: primaryActualHex,
            secondary: secondaryHex,
            accent: accentHex,
            background: backgroundHex,
            text: textHex
        };

        // Apply the new theme
        updateThemeUI();
        // Populate the color inputs in the modal if it's open
        if (elements.colorEditModal.style.display === 'block') {
             populateColorInputs();
        }
        Storage.saveCurrentSongState();
    } catch (error) {
        // Catch errors from colorThief (e.g., CORS issues if using external images)
        console.error("Error processing image colors with ColorThief:", error);
         // Optionally revert to default colors or show an error message
         // state.currentSong.theme = { ...defaultTheme }; // Assuming defaultTheme exists
         // updateThemeUI();
    }
}

function findVibrantAccent(paletteHex, existingColors) {
     let bestAccent = null;
     let highestScore = -1;

     for (const hex of paletteHex) {
         // Check if distinct enough from existing colors
         const distinct = existingColors.every(existing => calculateColorDifference(hex, existing) > 100);
         if (!distinct) continue;

         const rgb = hexToRgb(hex);
         const saturation = calculateSaturation(rgb);
         const brightness = calculateBrightness(rgb);

         // Score based on saturation and suitable brightness (not too dark, not too light)
         // Avoid overly dark/light accents which might not stand out
         if (saturation > 40 && brightness > 100 && brightness < 220) {
              // Give higher score to more saturated colors
              const score = saturation + (1 - Math.abs(brightness - 180) / 180); // Prefer brightness around 180
             if (score > highestScore) {
                 highestScore = score;
                 bestAccent = hex;
             }
         }
     }
     return bestAccent;
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).padStart(6, '0');
}

function calculateColorDifference(color1, color2) {
    // Simple Euclidean distance in RGB space
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    if (!rgb1 || !rgb2) return 0;

    return Math.sqrt(
        Math.pow(rgb1.r - rgb2.r, 2) +
        Math.pow(rgb1.g - rgb2.g, 2) +
        Math.pow(rgb1.b - rgb2.b, 2)
    );
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null; // Return null on invalid hex
}

// Luminance calculation helper for contrast
function getLuminance(rgb) {
    const RsRGB = rgb.r / 255;
    const GsRGB = rgb.g / 255;
    const BsRGB = rgb.b / 255;

    const R = (RsRGB <= 0.03928) ? RsRGB / 12.92 : Math.pow((RsRGB + 0.055) / 1.055, 2.4);
    const G = (GsRGB <= 0.03928) ? GsRGB / 12.92 : Math.pow((GsRGB + 0.055) / 1.055, 2.4);
    const B = (BsRGB <= 0.03928) ? BsRGB / 12.92 : Math.pow((BsRGB + 0.055) / 1.055, 2.4);

    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

// WCAG Contrast Ratio calculation
function calculateContrast(rgb1, rgb2) {
    if (!rgb1 || !rgb2) return 1; // Return minimum contrast if colors are invalid
    const lum1 = getLuminance(rgb1);
    const lum2 = getLuminance(rgb2);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    return (brightest + 0.05) / (darkest + 0.05);
}

// Calculate perceived brightness (simple average)
function calculateBrightness(rgb) {
    if (!rgb) return 0;
    return (rgb.r + rgb.g + rgb.b) / 3;
}

function calculateSaturation(rgb) {
     if (!rgb) return 0;
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;

     if (max === 0) return 0; // Achromatic

    const lightness = (max + min) / 2;

    if (max === min) return 0; // Achromatic

     let saturation;
     if (lightness < 0.5) {
         saturation = delta / (max + min);
     } else {
         saturation = delta / (2 - max - min);
     }

    return saturation * 100;
}

function shiftHue(color, degrees) {
    const rgb = hexToRgb(color);
    if (!rgb) return color; // Return original if invalid
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

    hsl.h = (hsl.h + degrees) % 360;
    if (hsl.h < 0) hsl.h += 360; // Ensure positive hue

    const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function adjustBrightness(color, percent) {
     const rgb = hexToRgb(color);
     if (!rgb) return color;
     const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

     hsl.l = Math.max(0, Math.min(100, hsl.l + percent)); // Adjust lightness

     const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l);
     return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
 }

 function darkenColor(color, percent) {
     return adjustBrightness(color, -Math.abs(percent));
 }

 function lightenColor(color, percent) {
     return adjustBrightness(color, Math.abs(percent));
 }

// --- HSL Conversion Functions ---

function rgbToHsl(r, g, b) {
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

function hslToRgb(h, s, l) {
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
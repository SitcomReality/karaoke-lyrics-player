// Theme management functions
import { state } from './state.js';
import { elements } from './dom.js';
import * as Storage from './storage.js';
import ColorThief from 'color-thief';

// Module-level variable to track theme rotation
let themeRotationOffset = 0;

export function resetThemeRotationOffset() {
    themeRotationOffset = 0;
}

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
    // Basic check to prevent making already very dark colors even darker
    const currentBg = hexToRgb(theme.background);
    let surface;
    if (currentBg && calculateBrightness(currentBg) < 30) {
         surface = adjustBrightness(theme.background, 8); // Lighten slightly more if very dark
    } else {
         surface = adjustBrightness(theme.background, 5);
    }
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

        // Wait for the image to be loaded
        if (imageElement.complete && imageElement.naturalWidth > 0) {
            _processImageColors(colorThief, imageElement);
        } else {
            imageElement.onload = function() {
                if(imageElement.naturalWidth > 0) {
                    _processImageColors(colorThief, imageElement);
                    resetThemeRotationOffset(); // Reset rotation when new colors are extracted
                } else {
                     console.warn("Image loaded but naturalWidth is 0, skipping color extraction.");
                }
                imageElement.onload = null; // Remove listener after execution
            };
             imageElement.onerror = function() {
                 console.error("Image failed to load, cannot extract colors.");
                 alert("Could not load the image. Color extraction failed.");
                 // Clear any previously extracted palette
                 state.currentSong.extractedPalette = [];
                 updateExtractedPaletteDisplay(); // Update display to show message
                 resetThemeRotationOffset(); // Reset rotation
                 imageElement.onerror = null; // Remove listener
             }
        }
    } catch (error) {
        console.error("Error initiating ColorThief:", error);
        alert("Error initializing color extraction tool.");
         // Clear any previously extracted palette
         state.currentSong.extractedPalette = [];
         updateExtractedPaletteDisplay();
         resetThemeRotationOffset(); // Reset rotation
    }
}

// Internal helper function to handle the actual color extraction logic
function _processImageColors(colorThief, imageElement) {
     try {
        // Get a palette
        const palette = colorThief.getPalette(imageElement, 8); // Get 8 colors

        // Convert RGB arrays to hex
        const paletteHex = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        // Store the extracted palette in state
        state.currentSong.extractedPalette = paletteHex;

        // Only update the display of extracted swatches
        updateExtractedPaletteDisplay();
        // Don't save state here, as only the transient extractedPalette changed

    } catch (error) {
        console.error("Error processing image colors with ColorThief:", error);
        alert("Failed to extract colors from the image. Please ensure it's a valid image format (JPEG, PNG, GIF).");
        // Clear extracted palette on error
        state.currentSong.extractedPalette = [];
        updateExtractedPaletteDisplay();
    }
}

// --- New function to update the extracted palette display ---
export function updateExtractedPaletteDisplay() {
    const paletteDisplay = elements.extractedPaletteDisplay;
    paletteDisplay.innerHTML = ''; // Clear previous swatches

    const palette = state.currentSong.extractedPalette;

    if (palette && palette.length > 0) {
        // Add a label indicating what these colors are
        const label = document.createElement('p');
        label.className = 'note';
        label.style.width = '100%';
        label.style.marginBottom = 'var(--spacing-xs)';
        label.style.textAlign = 'left';
        label.textContent = 'Extracted Colors (Click to Copy):';
        paletteDisplay.appendChild(label);

        palette.forEach(colorHex => {
            const swatch = document.createElement('div');
            swatch.className = 'extracted-palette-swatch';
            swatch.style.backgroundColor = colorHex;
            swatch.title = `Copy ${colorHex}`; // Add title for hover tooltip

            // Add click to copy hex code
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(colorHex).then(() => {
                    // Optional: Show temporary feedback
                    swatch.style.borderColor = 'var(--accent-color)';
                    swatch.style.transform = 'scale(1.15)';
                    setTimeout(() => {
                        swatch.style.borderColor = 'rgba(255, 255, 255, 0.3)';
                        swatch.style.transform = 'scale(1)';
                     }, 1000);
                }).catch(err => {
                    console.error('Failed to copy color:', err);
                    // Fallback for older browsers or if permission denied
                    alert(`Could not copy. Color: ${colorHex}`);
                });
            });

            paletteDisplay.appendChild(swatch);
        });
        // Enable the 'Apply Extracted' button
        elements.applyExtractedThemeBtn.disabled = false;
    } else {
        // Show placeholder text if no palette exists
        const placeholder = document.createElement('p');
        placeholder.className = 'note';
        placeholder.style.width = '100%'; // Ensure it takes full width
        placeholder.textContent = 'No colors extracted from image yet. Upload an image and click "Extract from Image".';
        paletteDisplay.appendChild(placeholder);
        // Disable the 'Apply Extracted' button
        elements.applyExtractedThemeBtn.disabled = true;
    }
}

// --- New function to apply theme based on extracted colors ---
export function applyExtractedTheme() {
    const palette = state.currentSong.extractedPalette;
    if (!palette || palette.length === 0) {
        alert("No extracted colors available. Please extract colors from an image first.");
        return;
    }

    // Minimum number of colors needed for a full theme
    const MIN_COLORS = 5; 
    
    // Rotate the palette based on the offset
    const rotatedPalette = [...palette.slice(themeRotationOffset % palette.length), ...palette.slice(0, themeRotationOffset % palette.length)];
    
    // Ensure we have enough colors, duplicating if necessary
    let usablePalette = [...rotatedPalette];
    while (usablePalette.length < MIN_COLORS && palette.length > 0) {
        usablePalette = usablePalette.concat(palette); // Append original palette to fill up
    }
    usablePalette = usablePalette.slice(0, Math.max(MIN_COLORS, palette.length)); // Trim excess if needed

    // Analyze colors (brightness and saturation)
    const analyzedPalette = usablePalette.map(hex => ({
        hex: hex,
        rgb: hexToRgb(hex),
        brightness: calculateBrightness(hexToRgb(hex)),
        saturation: calculateSaturation(hexToRgb(hex))
    }));

    // Sort by brightness (darkest first)
    analyzedPalette.sort((a, b) => a.brightness - b.brightness);

    // --- Selection Logic ---
    let bgColor = analyzedPalette[0].hex; // Darkest for background
    let textColor = analyzedPalette[analyzedPalette.length - 1].hex; // Lightest for text

    // Check contrast and adjust if necessary
    const contrastRatio = calculateContrast(hexToRgb(bgColor), hexToRgb(textColor));
    if (contrastRatio < 4.5) { // WCAG AA threshold
        console.warn(`Initial BG/Text contrast low (${contrastRatio.toFixed(2)}). Adjusting.`);
        // Try making background darker or text lighter from the palette if possible
        if (analyzedPalette.length > 1 && analyzedPalette[analyzedPalette.length - 2].brightness > analyzedPalette[analyzedPalette.length - 1].brightness * 0.9) {
            // If second lightest isn't much darker, use it maybe? - tricky
        }
        // Simple fix: generate a compliant text color based on background
        textColor = getContrastColor(bgColor);
    }

    // Filter out background and text colors for selecting primary/secondary/accent
    const remainingColors = analyzedPalette.filter(c => c.hex !== bgColor && c.hex !== textColor);

    // Sort remaining by saturation (most saturated first)
    remainingColors.sort((a, b) => b.saturation - a.saturation);

    let primaryColor = remainingColors.length > 0 ? remainingColors[0].hex : lightenColor(bgColor, 30); // Most saturated remaining, fallback
    let accentColor = remainingColors.length > 1 ? remainingColors[1].hex : shiftHue(primaryColor, 120); // Second most saturated, fallback
    let secondaryColor = remainingColors.length > 2 ? remainingColors[2].hex : darkenColor(primaryColor, 15); // Third most saturated, fallback

    // Avoid primary/secondary being too similar if possible
    if (calculateColorDifference(primaryColor, secondaryColor) < 50 && remainingColors.length > 3) {
        secondaryColor = remainingColors[3].hex; // Try the next one
    }
    // Avoid accent being too similar to primary
    if (calculateColorDifference(primaryColor, accentColor) < 50 && remainingColors.length > 3) {
         accentColor = remainingColors.length > 2 && remainingColors[2].hex !== secondaryColor ? remainingColors[2].hex : shiftHue(primaryColor, 120); // try 3rd or generate
    }


    // --- Populate Inputs ---
    elements.backgroundColorInput.value = bgColor;
    elements.textColorInput.value = textColor;
    elements.primaryColorInput.value = primaryColor;
    elements.secondaryColorInput.value = secondaryColor;
    elements.accentColorInput.value = accentColor;

    // Increment rotation offset for the next click
    themeRotationOffset++;
}

// Helper function to determine a contrasting color (simple black/white)
function getContrastColor(hexColor) {
    const rgb = hexToRgb(hexColor);
    if (!rgb) return '#ffffff'; // Default to white if input is invalid
    const brightness = calculateBrightness(rgb);
    // Threshold can be adjusted, 128 is midpoint
    return brightness > 128 ? '#000000' : '#ffffff'; 
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
    if (!rgb) return 0; // Handle potential null input
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
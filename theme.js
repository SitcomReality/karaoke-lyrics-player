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
    
    // Update font
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
}

export function applyFont(fontName) {
    if (fontName === 'Roboto' || fontName === 'Open Sans' || 
        fontName === 'Lato' || fontName === 'Montserrat') {
        // Standard fonts already available
        elements.root.style.fontFamily = `'${fontName}', sans-serif`;
    } else {
        // Try to load from Google Fonts
        loadGoogleFont(fontName);
        elements.root.style.fontFamily = `'${fontName}', var(--font-family)`;
    }
}

function loadGoogleFont(fontName) {
    // Check if already loaded
    if (document.querySelector(`link[href*="${fontName}"]`)) return;
    
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/\s+/g, '+')}:wght@300;400;700&display=swap`;
    document.head.appendChild(link);
}

export function extractColorsFromImage(imageElement) {
    try {
        const colorThief = new ColorThief();
        
        // Wait for the image to be loaded
        if (imageElement.complete) {
            extractColors(colorThief, imageElement);
        } else {
            imageElement.addEventListener('load', function() {
                extractColors(colorThief, imageElement);
            });
        }
    } catch (error) {
        console.error("Error extracting colors:", error);
    }
}

function extractColors(colorThief, imageElement) {
    try {
        // Get dominant color
        const dominantColor = colorThief.getColor(imageElement);
        // Get a palette
        const palette = colorThief.getPalette(imageElement, 5);
        
        // Convert RGB arrays to hex
        const primary = rgbToHex(dominantColor[0], dominantColor[1], dominantColor[2]);
        
        // Pick contrasting colors from the palette for other theme elements
        const secondary = getContrastingColor(primary, palette);
        const accent = getAccentColor(primary, secondary, palette);
        
        // Ensure background is dark and text is light for readability
        const background = darkenColor(primary);
        const text = '#e1e1e1'; // Keep text light for readability
        
        // Update state
        state.currentSong.theme = {
            primary,
            secondary,
            accent,
            background,
            text
        };
        
        // Apply the new theme
        updateThemeUI();
        Storage.saveCurrentSongState();
    } catch (error) {
        console.error("Error processing image colors:", error);
    }
}

function rgbToHex(r, g, b) {
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function getContrastingColor(color, palette) {
    // Simple implementation - pick a color from palette that's visually different
    for (const rgb of palette) {
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        if (calculateColorDifference(color, hex) > 100) {
            return hex;
        }
    }
    // Fallback
    return shiftHue(color, 180);
}

function getAccentColor(primary, secondary, palette) {
    // Pick a vibrant color from palette for accent
    for (const rgb of palette) {
        const hex = rgbToHex(rgb[0], rgb[1], rgb[2]);
        const saturation = calculateSaturation(rgb);
        if (saturation > 50 && 
            calculateColorDifference(hex, primary) > 80 &&
            calculateColorDifference(hex, secondary) > 80) {
            return hex;
        }
    }
    // Fallback
    return '#03dac6'; // Default accent
}

function calculateColorDifference(color1, color2) {
    // Convert hex to RGB
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    // Simple distance formula
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
    } : null;
}

function calculateSaturation(rgb) {
    const r = rgb[0] / 255;
    const g = rgb[1] / 255;
    const b = rgb[2] / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    
    if (max === 0) return 0;
    
    return ((max - min) / max) * 100;
}

function shiftHue(color, degrees) {
    // A simplified hue shift implementation
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    
    // Shift the hue
    hsv.h = (hsv.h + degrees) % 360;
    
    const newRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}

function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    
    let h, s, v = max;
    
    s = max === 0 ? 0 : d / max;
    
    if (max === min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToRgb(h, s, v) {
    h /= 360;
    s /= 100;
    v /= 100;
    
    let r, g, b;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
        case 0: r = v; g = t; b = p; break;
        case 1: r = q; g = v; b = p; break;
        case 2: r = p; g = v; b = t; break;
        case 3: r = p; g = q; b = v; break;
        case 4: r = t; g = p; b = v; break;
        case 5: r = v; g = p; b = q; break;
    }
    
    return {
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
    };
}

function darkenColor(color) {
    // Ensure background is dark for readability
    const rgb = hexToRgb(color);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    
    // Lower the value (brightness)
    hsv.v = Math.min(hsv.v, 15); // Max 15% brightness
    
    const newRgb = hsvToRgb(hsv.h, hsv.s, hsv.v);
    return rgbToHex(newRgb.r, newRgb.g, newRgb.b);
}
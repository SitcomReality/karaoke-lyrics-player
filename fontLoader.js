// fontLoader.js - Handles loading and applying fonts
import { elements } from './dom.js';

/**
 * Applies the specified font family to the root element.
 * Loads the font from Google Fonts if it's not a standard web font.
 * @param {string} fontName - The name of the font family.
 */
export function applyFont(fontName) {
    const defaultStack = 'var(--default-font-stack, sans-serif)'; // Define fallback stack
    if (!fontName) {
        // Apply default if fontName is empty or null
        elements.root.style.fontFamily = defaultStack;
        return;
    }

    if (['Roboto', 'Open Sans', 'Lato', 'Montserrat'].includes(fontName)) {
        // Standard fonts already available or pre-linked
        elements.root.style.fontFamily = `'${fontName}', ${defaultStack}`;
    } else {
        // Try to load from Google Fonts
        loadGoogleFont(fontName);
        elements.root.style.fontFamily = `'${fontName}', ${defaultStack}`;
    }
}

/**
 * Creates and appends a <link> element to load a font from Google Fonts.
 * Skips if the font link already exists.
 * @param {string} fontName - The name of the Google Font.
 */
function loadGoogleFont(fontName) {
    const sanitizedFontName = fontName.replace(/\s+/g, '+');
    // Request common weights
    const fontUrl = `https://fonts.googleapis.com/css2?family=${sanitizedFontName}:wght@300;400;700&display=swap`;

    // Check if already loaded to prevent duplicates
    if (document.querySelector(`link[href="${fontUrl}"]`)) return;

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = fontUrl;
    // Handle potential loading errors (optional but good practice)
    link.onerror = () => {
        console.warn(`Failed to load Google Font: ${fontName}.`);
        // Optionally revert to a default font here if loading fails
        // elements.root.style.fontFamily = 'var(--default-font-stack, sans-serif)';
    };
    document.head.appendChild(link);
}
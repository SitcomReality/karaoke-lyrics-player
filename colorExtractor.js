// colorExtractor.js - Handles color extraction from images using ColorThief
import ColorThief from 'color-thief';
import { rgbToHex } from './colorUtils.js';
import { state } from './state.js';
import { updateExtractedPaletteDisplay } from './ui/index.js';

/**
 * Extracts a color palette from an image element using ColorThief.
 * Updates the state and UI with the extracted palette.
 * @param {HTMLImageElement} imageElement - The image element to extract colors from.
 */
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
                } else {
                     console.warn("Image loaded but naturalWidth is 0, skipping color extraction.");
                }
                imageElement.onload = null; 
            };
             imageElement.onerror = function() {
                 console.error("Image failed to load, cannot extract colors.");
                 alert("Could not load the image. Color extraction failed.");
                 state.currentSong.extractedPalette = [];
                 updateExtractedPaletteDisplay(); 
                 imageElement.onerror = null; 
             }
        }
    } catch (error) {
        console.error("Error initiating ColorThief:", error);
        alert("Error initializing color extraction tool.");
         state.currentSong.extractedPalette = [];
         updateExtractedPaletteDisplay();
    }
}

/**
 * Internal helper function to handle the actual color extraction logic.
 * @param {ColorThief} colorThief - The ColorThief instance.
 * @param {HTMLImageElement} imageElement - The loaded image element.
 */
function _processImageColors(colorThief, imageElement) {
     try {
        const palette = colorThief.getPalette(imageElement, 8); 
        const paletteHex = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));
        state.currentSong.extractedPalette = paletteHex;
        updateExtractedPaletteDisplay();

    } catch (error) {
        console.error("Error processing image colors with ColorThief:", error);
        alert("Failed to extract colors from the image. Please ensure it's a valid image format (JPEG, PNG, GIF).");
        state.currentSong.extractedPalette = [];
        updateExtractedPaletteDisplay();
    }
}
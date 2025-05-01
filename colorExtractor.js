// colorExtractor.js - Handles color extraction from images using ColorThief
import ColorThief from 'color-thief';
import { rgbToHex } from './colorUtils.js';
import { state } from './state.js';
import { updateExtractedPaletteDisplay } from './ui.js'; // Need to import from UI now

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
                    // Reset rotation offset? Theme.resetThemeRotationOffset() was here, maybe belongs in the event handler?
                    // For now, let the event handler manage the rotation offset reset.
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
                 // Theme.resetThemeRotationOffset(); // Reset rotation - belongs in event handler?
                 imageElement.onerror = null; // Remove listener
             }
        }
    } catch (error) {
        console.error("Error initiating ColorThief:", error);
        alert("Error initializing color extraction tool.");
         // Clear any previously extracted palette
         state.currentSong.extractedPalette = [];
         updateExtractedPaletteDisplay();
         // Theme.resetThemeRotationOffset(); // Reset rotation - belongs in event handler?
    }
}

/**
 * Internal helper function to handle the actual color extraction logic.
 * @param {ColorThief} colorThief - The ColorThief instance.
 * @param {HTMLImageElement} imageElement - The loaded image element.
 */
function _processImageColors(colorThief, imageElement) {
     try {
        // Get a palette
        const palette = colorThief.getPalette(imageElement, 8); // Get 8 colors

        // Convert RGB arrays to hex
        const paletteHex = palette.map(rgb => rgbToHex(rgb[0], rgb[1], rgb[2]));

        // Store the extracted palette in state
        state.currentSong.extractedPalette = paletteHex;

        // Update the display of extracted swatches
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

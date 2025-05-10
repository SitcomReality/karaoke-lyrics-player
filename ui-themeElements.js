// ui-themeElements.js - UI Updates for theme-specific elements like color palettes
import { state } from './state.js';
import { elements } from './dom.js';

export function updateExtractedPaletteDisplay() {
    const palette = state.currentSong.extractedPalette || [];
    const displayElement = elements.extractedPaletteDisplay;
    const noteElement = displayElement.querySelector('.note');

    // Clear previous swatches
    displayElement.querySelectorAll('.extracted-palette-swatch').forEach(swatch => swatch.remove());

    if (palette.length > 0) {
        // Hide the 'no colors' note
        if (noteElement) noteElement.style.display = 'none';

        // Create and append swatches
        palette.forEach(colorHex => {
            const swatch = document.createElement('div');
            swatch.className = 'extracted-palette-swatch';
            swatch.style.backgroundColor = colorHex;
            swatch.title = `Extracted color: ${colorHex}`;
            // Optionally add click handler to copy color
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(colorHex).then(() => {
                    // Optional feedback: Maybe flash the swatch or show a tooltip
                    console.log(`Copied ${colorHex} to clipboard.`);
                }).catch(err => {
                    console.error('Failed to copy color:', err);
                });
            });
            displayElement.appendChild(swatch);
        });
    } else {
        // Show the 'no colors' note
        if (noteElement) {
            noteElement.style.display = 'block';
             noteElement.textContent = 'No colors extracted from image yet.';
        } else {
            // Create the note if it doesn't exist (shouldn't happen with current HTML)
            const p = document.createElement('p');
            p.className = 'note';
            p.textContent = 'No colors extracted from image yet.';
            displayElement.appendChild(p);
        }
    }
}
// ui-themeElements.js - UI Updates for theme-specific elements like color palettes
import { state } from '../state.js';
import { elements } from '../dom.js';

export function updateExtractedPaletteDisplay() {
    const palette = state.currentSong.extractedPalette || [];
    const displayElement = elements.extractedPaletteDisplay;
    const noteElement = displayElement.querySelector('.note');

    displayElement.querySelectorAll('.extracted-palette-swatch').forEach(swatch => swatch.remove());

    if (palette.length > 0) {
        if (noteElement) noteElement.style.display = 'none';

        palette.forEach(colorHex => {
            const swatch = document.createElement('div');
            swatch.className = 'extracted-palette-swatch';
            swatch.style.backgroundColor = colorHex;
            swatch.title = `Extracted color: ${colorHex}`;
            swatch.addEventListener('click', () => {
                navigator.clipboard.writeText(colorHex).then(() => {
                    console.log(`Copied ${colorHex} to clipboard.`);
                }).catch(err => {
                    console.error('Failed to copy color:', err);
                });
            });
            displayElement.appendChild(swatch);
        });
    } else {
        if (noteElement) {
            noteElement.style.display = 'block';
            noteElement.textContent = 'No colors extracted from image yet.';
        } else {
            const p = document.createElement('p');
            p.className = 'note';
            p.textContent = 'No colors extracted from image yet.';
            displayElement.appendChild(p);
        }
    }
}
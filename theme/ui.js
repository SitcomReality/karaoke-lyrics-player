// theme/ui.js - UI Updates for theme display and controls
import { state } from '../state.js';
import { elements } from '../dom.js';
import { applyFont } from '../fontLoader.js';
import { applyTheme } from './apply.js';

/**
 * Updates the theme preview UI elements and applies the theme and font.
 */
export function updateThemeUI() {
    // Update theme color previews in the sidebar
    elements.primaryColor.style.backgroundColor = state.currentSong.theme.primary;
    elements.secondaryColor.style.backgroundColor = state.currentSong.theme.secondary;
    elements.accentColor.style.backgroundColor = state.currentSong.theme.accent;
    elements.backgroundColor.style.backgroundColor = state.currentSong.theme.background;
    elements.textColor.style.backgroundColor = state.currentSong.theme.text; // This preview shows the "--on-background" color

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
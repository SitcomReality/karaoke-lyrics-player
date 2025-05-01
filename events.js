// Event handlers and main event setup
import { state } from './state.js';
import { elements } from './dom.js';
import * as Audio from './audio.js';
import * as UI from './ui.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as Theme from './theme.js';
import * as Modal from './modal.js';
import * as ImportExport from './importExport.js';

export function setupEventListeners() {
    // Audio player controls
    elements.playBtn.addEventListener('click', Audio.togglePlay);
    elements.progressBar.addEventListener('click', Audio.seekAudio);
    elements.volumeSlider.addEventListener('input', Audio.adjustVolume);

    // Upload handlers
    elements.uploadAudio.addEventListener('change', Audio.handleAudioUpload);
    elements.uploadImage.addEventListener('change', handleImageUpload);
    elements.uploadLyrics.addEventListener('change', Lyrics.handleLyricsUpload);

    // Lyrics controls
    elements.nextLineBtn.addEventListener('click', Lyrics.markNextLine);
    elements.resetTimingBtn.addEventListener('click', Lyrics.resetTiming);
    elements.editTimingModeBtn.addEventListener('click', Lyrics.toggleEditMode);
    elements.saveProjectBtn.addEventListener('click', Storage.saveProject);

    // Lyrics editing
    elements.editLyricsBtn.addEventListener('click', () => openLyricsEditor());
    elements.saveLyricsBtn.addEventListener('click', Lyrics.saveLyricsFromEditor);
    elements.cancelLyricsBtn.addEventListener('click', () => Modal.closeModal(elements.lyricsEditorModal));

    // Song info editing
    elements.songTitle.addEventListener('input', handleSongInfoChange);
    elements.songArtist.addEventListener('input', handleSongInfoChange);

    // Modal buttons
    elements.importExportBtn.addEventListener('click', () => Modal.openModal(elements.importExportModal));
    elements.editColorsBtn.addEventListener('click', handleOpenColorEditor); 
    elements.createPlaylistBtn.addEventListener('click', () => Modal.openModal(elements.createPlaylistModal));

    // Theme/Color editing modal handlers
    elements.applyColorsBtn.addEventListener('click', handleApplyColors);
    elements.extractColorsBtn.addEventListener('click', () => Theme.extractColorsFromImage(elements.songImage));
    elements.applyExtractedThemeBtn.addEventListener('click', Theme.applyExtractedTheme); 

    // Font selection
    elements.fontSelector.addEventListener('change', handleFontChange);
    elements.applyFontBtn.addEventListener('click', handleApplyCustomFont);

    // Modal content handlers can be added here...

    // Keyboard shortcut for marking next line
    document.addEventListener('keydown', (e) => {
        // Check if the active element is an input or textarea to avoid interfering
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

        if (e.code === 'Space' && !Modal.isAnyModalOpen() && !isInputActive) {
            e.preventDefault(); // Prevent page scroll or space in inputs
            // Check if play/pause button is focused, if so, trigger click instead
            if (activeElement === elements.playBtn) {
                 elements.playBtn.click();
            } else {
                 Lyrics.markNextLine();
            }
        }
    });
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Create object URL for the image
    const imageUrl = URL.createObjectURL(file);
    state.currentSong.image = imageUrl;
    elements.songImage.src = imageUrl;

    // Optionally extract colors from image
    Theme.extractColorsFromImage(elements.songImage);

    // Save state
    Storage.saveCurrentSongState();
}

function handleSongInfoChange() {
    state.currentSong.title = elements.songTitle.value;
    state.currentSong.artist = elements.songArtist.value;
    Storage.saveCurrentSongState();
}

// Helper function to open the lyrics editor with current lyrics
function openLyricsEditor() {
    // Populate the editor with current lyrics, even if empty
    const currentLyrics = state.currentSong.lyrics.join('\n');
    elements.lyricsEditor.value = currentLyrics;

    // Open the modal
    Modal.openModal(elements.lyricsEditorModal);
}

// Specific handler for opening the color editor
function handleOpenColorEditor() {
    // Populate inputs with current theme colors before opening
    Theme.populateColorInputs();
    // Populate the extracted palette display
    Theme.updateExtractedPaletteDisplay();
    // Reset rotation offset when modal opens
    Theme.resetThemeRotationOffset(); 
    Modal.openModal(elements.colorEditModal);
}

// Handler for applying colors from the modal
function handleApplyColors() {
    // Read values from inputs
    const newTheme = {
        primary: elements.primaryColorInput.value,
        secondary: elements.secondaryColorInput.value,
        accent: elements.accentColorInput.value,
        background: elements.backgroundColorInput.value,
        text: elements.textColorInput.value
    };

    // Update state
    state.currentSong.theme = newTheme;

    // Apply theme visually
    Theme.updateThemeUI();

    // Save state
    Storage.saveCurrentSongState();

    // Close modal
    Modal.closeModal(elements.colorEditModal);
}

// Handler for font change
function handleFontChange() {
    const selectedFont = elements.fontSelector.value;
    if (selectedFont === 'custom') {
        // Open custom font modal
        elements.customFontInput.value = ''; // Clear previous input
        Modal.openModal(elements.customFontModal);
    } else {
        state.currentSong.font = selectedFont;
        Theme.applyFont(selectedFont);
        Storage.saveCurrentSongState();
    }
}

// Handler for applying custom font
function handleApplyCustomFont() {
    const fontName = elements.customFontInput.value.trim();
    if (fontName) {
        state.currentSong.font = fontName;
        Theme.applyFont(fontName);
        Storage.saveCurrentSongState();

        // Add font to selector if not already present
        if (!Array.from(elements.fontSelector.options).some(option => option.value === fontName)) {
            const option = document.createElement('option');
            option.value = fontName;
            option.textContent = fontName;
            // Insert before the 'custom' option
            elements.fontSelector.insertBefore(option, elements.fontSelector.querySelector('option[value="custom"]'));
        }
        elements.fontSelector.value = fontName; // Select the newly applied font

        Modal.closeModal(elements.customFontModal);
    } else {
        alert("Please enter a Google Font name.");
    }
}
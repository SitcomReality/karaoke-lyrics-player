// Event handlers and main event setup
import { state } from './state.js';
import { elements } from './dom.js';
import * as Audio from './audio.js';
import * as UI from './ui/index.js';
import * as Lyrics from './lyrics.js';
import * as Storage from './storage.js';
import * as Theme from './theme/index.js'; 
import * as Modal from './modal.js';
// import * as ImportExport from './importExport.js'; // Main project I/E
import { extractColorsFromImage } from './colorExtractor.js'; 
import * as Playlist from './playlist.js'; 
import * as PlaylistIO from './playlistIO.js'; // Specific Playlist I/O
import * as FolderPlaylistImport from './folderPlaylistImport.js'; // Import new module
import * as AudioLocator from './audioLocator.js'; // Import new module

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
    elements.saveProjectBtn.addEventListener('click', () => Storage.saveProject()); // Explicit save, not silent

    // Lyrics editing
    elements.editLyricsBtn.addEventListener('click', () => Lyrics.openLyricsEditor()); 
    elements.saveLyricsBtn.addEventListener('click', Lyrics.saveLyricsFromEditor);
    elements.cancelLyricsBtn.addEventListener('click', () => Modal.closeModal(elements.lyricsEditorModal));

    // Song info editing
    elements.songTitle.addEventListener('input', handleSongInfoChange);
    elements.songArtist.addEventListener('input', handleSongInfoChange);

    // Modal buttons
    elements.importExportBtn.addEventListener('click', () => {
        // Lazy load and setup main import/export if not done
        import('./importExport.js').then(ImportExportModule => {
            ImportExportModule.setupImportExport(); // Ensure it's set up before opening
            Modal.openModal(elements.importExportModal);
            // Pre-populate export tab if opened for export
            const exportTabBtn = Array.from(elements.importExportModal.querySelectorAll('.tab-btn')).find(btn => btn.dataset.tab === 'export');
             if (exportTabBtn && exportTabBtn.classList.contains('active')) {
                ImportExportModule.generateExportJSON(); // Assuming this function exists and is exported
             } else if (elements.importExportModal.querySelector('#export-tab').style.display !== 'none') {
                 ImportExportModule.generateExportJSON();
             }
        });
    });
    elements.editColorsBtn.addEventListener('click', handleOpenColorEditor);
    elements.createPlaylistBtn.addEventListener('click', Playlist.openCreatePlaylistModal); 

    // Playlist I/O Buttons
    elements.exportPlaylistsBtn.addEventListener('click', PlaylistIO.openExportPlaylistsModal);
    elements.importPlaylistsBtn.addEventListener('click', PlaylistIO.openImportPlaylistsModal);
    PlaylistIO.setupPlaylistIOModal(); // Setup listeners for the playlist I/O modal

    // Folder Playlist Import
    elements.importPlaylistFromFolderBtn.addEventListener('click', FolderPlaylistImport.triggerFolderImport);
    elements.importFolderInput.addEventListener('change', FolderPlaylistImport.handleFolderFilesSelected);


    // Theme/Color editing modal handlers
    elements.applyColorsBtn.addEventListener('click', handleApplyColors);
    elements.extractColorsBtn.addEventListener('click', () => extractColorsFromImage(elements.songImage)); 
    elements.applyExtractedThemeBtn.addEventListener('click', Theme.applyExtractedTheme);

    // Font selection
    elements.fontSelector.addEventListener('change', handleFontChange);
    elements.applyFontBtn.addEventListener('click', handleApplyCustomFont);

    // Playlist controls
    elements.prevSongBtn.addEventListener('click', () => Playlist.playPreviousSong()); 
    elements.nextSongBtn.addEventListener('click', () => Playlist.playNextSong()); 
    elements.addNewSongBtn.addEventListener('click', Playlist.createNewSong); 
    elements.toggleAutoAdvanceBtn.addEventListener('click', Playlist.toggleAutoAdvance); 

    // Playlist modal controls
    elements.savePlaylistBtn.addEventListener('click', Playlist.saveNewPlaylist); 

    // Edit Playlist Modal controls
    elements.updatePlaylistBtn.addEventListener('click', Playlist.handleSavePlaylistChanges);
    elements.addCurrentSongToPlaylistBtn.addEventListener('click', Playlist.handleAddCurrentlyLoadedSongToPlaylist);
    elements.cancelEditPlaylistBtn.addEventListener('click', () => {
        Modal.closeModal(elements.editPlaylistModal);
        state.editingPlaylistId = null; // Clear editing state
    });

    // Keyboard shortcut for marking next line
    document.addEventListener('keydown', (e) => {
        const activeElement = document.activeElement;
        const isInputActive = activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA');

        if (e.code === 'Space' && !Modal.isAnyModalOpen() && !isInputActive) {
            e.preventDefault(); 
            if (activeElement === elements.playBtn || document.body === activeElement /* if no specific element is focused */) {
                 elements.playBtn.click();
            } else if (state.editMode || (state.currentSong.lyrics && state.currentSong.lyrics.length > 0 && state.audio)) { // Allow space for next line if in edit mode or if lyrics and audio exist
                 Lyrics.markNextLine();
            }
        }
    });

    // Locate Audio Modal listeners
    if (elements.audioSourceFolderInput) { // Ensure elements exist
        elements.audioSourceFolderInput.addEventListener('change', AudioLocator.handleAudioFolderSelected);
    }
    if (elements.skipLocatingAudioBtn) {
        elements.skipLocatingAudioBtn.addEventListener('click', AudioLocator.handleSkipLocatingAudio);
    }
    // Assuming modal.js handles the 'X' button to call closeModal, we need to hook into that.
    // A bit of a workaround: if locateAudioModal specific close button exists:
    const locateAudioModalCloseBtn = elements.locateAudioModal?.querySelector('.close');
    if (locateAudioModalCloseBtn) {
        locateAudioModalCloseBtn.addEventListener('click', AudioLocator.handleLocateAudioModalClosed);
    }
    // If modal.js uses a generic approach, this might need adjustment in modal.js or AudioLocator.
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (state.currentSong.image && state.currentSong.image.startsWith('blob:')) {
        URL.revokeObjectURL(state.currentSong.image);
    }

    const imageUrl = URL.createObjectURL(file);
    state.currentSong.image = imageUrl;
    elements.songImage.src = imageUrl;

    Theme.resetThemeRotationOffset();
    extractColorsFromImage(elements.songImage); 
    Storage.saveCurrentSongState();
    e.target.value = '';
}

function handleSongInfoChange() {
    state.currentSong.title = elements.songTitle.value;
    state.currentSong.artist = elements.songArtist.value;
    Storage.saveCurrentSongState();

    // Auto-save to history if title/artist and lyrics exist
    if ((state.currentSong.title || state.currentSong.artist) && state.currentSong.lyrics && state.currentSong.lyrics.length > 0) {
        Storage.saveProject(true); // true for silent save
    }
}

function handleOpenColorEditor() {
    Theme.populateColorInputs();
    UI.updateExtractedPaletteDisplay(); 
    Theme.resetThemeRotationOffset(); 
    Modal.openModal(elements.colorEditModal);
}

function handleApplyColors() {
    const newTheme = {
        primary: elements.primaryColorInput.value,
        secondary: elements.secondaryColorInput.value,
        accent: elements.accentColorInput.value,
        background: elements.backgroundColorInput.value,
        text: elements.textColorInput.value
    };

    state.currentSong.theme = newTheme;
    Theme.updateThemeUI();
    Storage.saveCurrentSongState();
    Modal.closeModal(elements.colorEditModal);
}

function handleFontChange() {
    const selectedFont = elements.fontSelector.value;
    if (selectedFont === 'custom') {
        elements.customFontInput.value = ''; 
        Modal.openModal(elements.customFontModal);
    } else {
        state.currentSong.font = selectedFont;
        Theme.applyFont(selectedFont);
        Storage.saveCurrentSongState();
    }
}

function handleApplyCustomFont() {
    const fontName = elements.customFontInput.value.trim();
    if (fontName) {
        state.currentSong.font = fontName;
        Theme.applyFont(fontName);
        Storage.saveCurrentSongState();

        if (!Array.from(elements.fontSelector.options).some(option => option.value === fontName)) {
            const option = document.createElement('option');
            option.value = fontName;
            option.textContent = fontName;
            elements.fontSelector.insertBefore(option, elements.fontSelector.querySelector('option[value="custom"]'));
        }
        elements.fontSelector.value = fontName; 

        Modal.closeModal(elements.customFontModal);
    } else {
        alert("Please enter a Google Font name.");
    }
}
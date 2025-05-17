// DOM Element references

export const elements = {
    // Audio player
    playBtn: document.getElementById('play-btn'),
    progressBar: document.getElementById('progress-bar'),
    progress: document.getElementById('progress'),
    timeDisplay: document.getElementById('time-display'),
    volumeSlider: document.getElementById('volume-slider'),

    // Song info
    songTitle: document.getElementById('song-title'),
    songArtist: document.getElementById('song-artist'),
    songImage: document.getElementById('song-image'),

    // Lyrics
    lyricsContainer: document.getElementById('lyrics-container'),
    lyricsPlaceholder: document.querySelector('.lyrics-placeholder'),

    // Upload controls
    uploadAudio: document.getElementById('upload-audio'),
    uploadImage: document.getElementById('upload-image'),
    uploadLyrics: document.getElementById('upload-lyrics'),
    lyricsUploadLabel: document.querySelector('label[for="upload-lyrics"]'),
    audioFileInfo: document.getElementById('audio-file-info'), 

    // Timing controls
    nextLineBtn: document.getElementById('next-line-btn'),
    resetTimingBtn: document.getElementById('reset-timing-btn'),
    editTimingModeBtn: document.getElementById('edit-timing-mode-btn'),
    saveProjectBtn: document.getElementById('save-project-btn'),

    // Playlist controls
    prevSongBtn: document.getElementById('prev-song-btn'),
    nextSongBtn: document.getElementById('next-song-btn'),
    addNewSongBtn: document.getElementById('add-new-song-btn'),
    toggleAutoAdvanceBtn: document.getElementById('toggle-auto-advance-btn'), 

    // Panels
    historyPanel: document.getElementById('history-panel'),
    playlistsPanel: document.getElementById('playlists-panel'),
    currentPlaylistPanel: document.getElementById('current-playlist-panel'),

    // Theme
    primaryColor: document.getElementById('primary-color'),
    secondaryColor: document.getElementById('secondary-color'),
    accentColor: document.getElementById('accent-color'),
    backgroundColor: document.getElementById('background-color'),
    textColor: document.getElementById('text-color'),
    fontSelector: document.getElementById('font-selector'),

    // Modal buttons
    importExportBtn: document.getElementById('import-export-btn'),
    editColorsBtn: document.getElementById('edit-colors-btn'),
    createPlaylistBtn: document.getElementById('create-playlist'),

    // Modals
    importExportModal: document.getElementById('import-export-modal'),
    colorEditModal: document.getElementById('color-edit-modal'),
    customFontModal: document.getElementById('custom-font-modal'),
    createPlaylistModal: document.getElementById('create-playlist-modal'),

    // Modal elements
    importJson: document.getElementById('import-json'),
    exportJson: document.getElementById('export-json'),
    copyJsonBtn: document.getElementById('copy-json-btn'),
    importBtn: document.getElementById('import-btn'),
    tabButtons: document.querySelectorAll('.tab-btn'), 
    importTab: document.getElementById('import-tab'),
    exportTab: document.getElementById('export-tab'),
    modalCloseButtons: document.querySelectorAll('.modal .close'),

    // Color inputs
    primaryColorInput: document.getElementById('primary-color-input'),
    secondaryColorInput: document.getElementById('secondary-color-input'),
    accentColorInput: document.getElementById('accent-color-input'),
    backgroundColorInput: document.getElementById('background-color-input'),
    textColorInput: document.getElementById('text-color-input'),
    applyColorsBtn: document.getElementById('apply-colors-btn'),
    extractColorsBtn: document.getElementById('extract-colors-btn'),
    extractedPaletteDisplay: document.getElementById('extracted-palette-display'),
    applyExtractedThemeBtn: document.getElementById('apply-extracted-theme-btn'),

    // Font modal
    customFontInput: document.getElementById('custom-font-input'),
    applyFontBtn: document.getElementById('apply-font-btn'),

    // Playlist modal
    playlistNameInput: document.getElementById('playlist-name-input'),
    availableSongsList: document.getElementById('available-songs-list'),
    savePlaylistBtn: document.getElementById('save-playlist-btn'),

    // Edit Playlist Modal
    editPlaylistModal: document.getElementById('edit-playlist-modal'),
    editPlaylistNameInput: document.getElementById('edit-playlist-name-input'),
    songsInPlaylistList: document.getElementById('songs-in-playlist-list'),
    editPlaylistAvailableSongsList: document.getElementById('edit-playlist-available-songs-list'),
    addCurrentSongToPlaylistBtn: document.getElementById('add-current-song-to-playlist-btn'),
    updatePlaylistBtn: document.getElementById('update-playlist-btn'),
    cancelEditPlaylistBtn: document.getElementById('cancel-edit-playlist-btn'),

    // Lyrics editing
    editLyricsBtn: document.getElementById('edit-lyrics-btn'),
    lyricsEditorModal: document.getElementById('lyrics-editor-modal'),
    lyricsEditor: document.getElementById('lyrics-editor'),
    saveLyricsBtn: document.getElementById('save-lyrics-btn'),
    cancelLyricsBtn: document.getElementById('cancel-lyrics-btn'),

    // Root element for theme variables
    root: document.documentElement,

    // Main layout elements referenced by presentation mode
    mainContentArea: document.getElementById('main-content-area'),
    playerSectionArea: document.getElementById('player-section-area'),

    // Playlist I/O Buttons and Modal
    exportPlaylistsBtn: document.getElementById('export-playlists-btn'),
    importPlaylistsBtn: document.getElementById('import-playlists-btn'),
    playlistIoModal: document.getElementById('playlist-io-modal'),
    playlistExportJson: document.getElementById('playlist-export-json'),
    copyPlaylistJsonBtn: document.getElementById('copy-playlist-json-btn'),
    downloadPlaylistJsonBtn: document.getElementById('download-playlist-json-btn'),
    playlistImportJson: document.getElementById('playlist-import-json'),
    uploadPlaylistJson: document.getElementById('upload-playlist-json'),
    playlistFileInfo: document.getElementById('playlist-file-info'),
    importPlaylistDataBtn: document.getElementById('import-playlist-data-btn'),
    playlistIoModalTabButtons: document.querySelectorAll('#playlist-io-modal .tab-btn'),
    playlistExportTab: document.getElementById('playlist-export-tab'),
    playlistImportTab: document.getElementById('playlist-import-tab'),
};
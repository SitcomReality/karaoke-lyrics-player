// DOM Element references

export let elements = {}; // Initialized by initializeElements()

export function initializeElements() {
    elements.playBtn = document.getElementById('play-btn');
    elements.progressBar = document.getElementById('progress-bar');
    elements.progress = document.getElementById('progress');
    elements.timeDisplay = document.getElementById('time-display');
    elements.volumeSlider = document.getElementById('volume-slider');

    elements.songTitle = document.getElementById('song-title');
    elements.songArtist = document.getElementById('song-artist');
    elements.songImage = document.getElementById('song-image');

    elements.lyricsContainer = document.getElementById('lyrics-container');
    elements.lyricsPlaceholder = document.querySelector('.lyrics-placeholder');

    elements.uploadAudio = document.getElementById('upload-audio');
    elements.uploadImage = document.getElementById('upload-image');
    elements.uploadLyrics = document.getElementById('upload-lyrics');
    elements.lyricsUploadLabel = document.querySelector('label[for="upload-lyrics"]');
    elements.audioFileInfo = document.getElementById('audio-file-info'); 

    elements.nextLineBtn = document.getElementById('next-line-btn');
    elements.resetTimingBtn = document.getElementById('reset-timing-btn');
    elements.editTimingModeBtn = document.getElementById('edit-timing-mode-btn');
    elements.saveProjectBtn = document.getElementById('save-project-btn');

    elements.prevSongBtn = document.getElementById('prev-song-btn');
    elements.nextSongBtn = document.getElementById('next-song-btn');
    elements.addNewSongBtn = document.getElementById('add-new-song-btn');
    elements.toggleAutoAdvanceBtn = document.getElementById('toggle-auto-advance-btn'); 

    elements.historyPanel = document.getElementById('history-panel');
    elements.playlistsPanel = document.getElementById('playlists-panel');
    elements.currentPlaylistPanel = document.getElementById('current-playlist-panel');

    elements.primaryColor = document.getElementById('primary-color');
    elements.secondaryColor = document.getElementById('secondary-color');
    elements.accentColor = document.getElementById('accent-color');
    elements.backgroundColor = document.getElementById('background-color');
    elements.textColor = document.getElementById('text-color');
    elements.fontSelector = document.getElementById('font-selector');

    elements.importExportBtn = document.getElementById('import-export-btn');
    elements.editColorsBtn = document.getElementById('edit-colors-btn');
    elements.createPlaylistBtn = document.getElementById('create-playlist');

    elements.importExportModal = document.getElementById('import-export-modal');
    elements.colorEditModal = document.getElementById('color-edit-modal');
    elements.customFontModal = document.getElementById('custom-font-modal');
    elements.createPlaylistModal = document.getElementById('create-playlist-modal');

    elements.importJson = document.getElementById('import-json');
    elements.exportJson = document.getElementById('export-json');
    elements.copyJsonBtn = document.getElementById('copy-json-btn');
    elements.importBtn = document.getElementById('import-btn');
    elements.tabButtons = document.querySelectorAll('#import-export-modal .tab-btn'); 
    elements.importTab = document.getElementById('import-tab');
    elements.exportTab = document.getElementById('export-tab');
    elements.modalCloseButtons = document.querySelectorAll('.modal .close');

    elements.primaryColorInput = document.getElementById('primary-color-input');
    elements.secondaryColorInput = document.getElementById('secondary-color-input');
    elements.accentColorInput = document.getElementById('accent-color-input');
    elements.backgroundColorInput = document.getElementById('background-color-input');
    elements.textColorInput = document.getElementById('text-color-input');
    elements.applyColorsBtn = document.getElementById('apply-colors-btn');
    elements.extractColorsBtn = document.getElementById('extract-colors-btn');
    elements.extractedPaletteDisplay = document.getElementById('extracted-palette-display');
    elements.applyExtractedThemeBtn = document.getElementById('apply-extracted-theme-btn');

    elements.customFontInput = document.getElementById('custom-font-input');
    elements.applyFontBtn = document.getElementById('apply-font-btn');

    elements.playlistNameInput = document.getElementById('playlist-name-input');
    elements.availableSongsList = document.getElementById('available-songs-list');
    elements.savePlaylistBtn = document.getElementById('save-playlist-btn');

    elements.editPlaylistModal = document.getElementById('edit-playlist-modal');
    elements.editPlaylistNameInput = document.getElementById('edit-playlist-name-input');
    elements.songsInPlaylistList = document.getElementById('songs-in-playlist-list');
    elements.editPlaylistAvailableSongsList = document.getElementById('edit-playlist-available-songs-list');
    elements.addCurrentSongToPlaylistBtn = document.getElementById('add-current-song-to-playlist-btn');
    elements.updatePlaylistBtn = document.getElementById('update-playlist-btn');
    elements.cancelEditPlaylistBtn = document.getElementById('cancel-edit-playlist-btn');

    elements.editLyricsBtn = document.getElementById('edit-lyrics-btn');
    elements.lyricsEditorModal = document.getElementById('lyrics-editor-modal');
    elements.lyricsEditor = document.getElementById('lyrics-editor');
    elements.saveLyricsBtn = document.getElementById('save-lyrics-btn');
    elements.cancelLyricsBtn = document.getElementById('cancel-lyrics-btn');

    elements.root = document.documentElement;

    elements.mainContentArea = document.getElementById('main-content-area');
    elements.playerSectionArea = document.getElementById('player-section-area');

    elements.exportPlaylistsBtn = document.getElementById('export-playlists-btn');
    elements.importPlaylistsBtn = document.getElementById('import-playlists-btn');
    elements.playlistIoModal = document.getElementById('playlist-io-modal');
    elements.playlistExportJson = document.getElementById('playlist-export-json');
    elements.copyPlaylistJsonBtn = document.getElementById('copy-playlist-json-btn');
    elements.downloadPlaylistJsonBtn = document.getElementById('download-playlist-json-btn');
    elements.playlistImportJson = document.getElementById('playlist-import-json');
    elements.uploadPlaylistJson = document.getElementById('upload-playlist-json');
    elements.playlistFileInfo = document.getElementById('playlist-file-info');
    elements.importPlaylistDataBtn = document.getElementById('import-playlist-data-btn');
    elements.playlistIoModalTabButtons = document.querySelectorAll('#playlist-io-modal .tab-btn');
    elements.playlistExportTab = document.getElementById('playlist-export-tab');
    elements.playlistImportTab = document.getElementById('playlist-import-tab');

    elements.importPlaylistFromFolderBtn = document.getElementById('import-playlist-from-folder-btn');
    elements.importFolderInput = document.getElementById('import-folder-input');

    elements.locateAudioModal = document.getElementById('locate-audio-modal');
    elements.missingFilenameDisplay = document.getElementById('missing-filename-display');
    elements.missingSongTitleDisplay = document.getElementById('missing-song-title-display');
    elements.audioSourceFolderInputBtn = document.querySelector('label[for="audio-source-folder-input-btn"]'); 
    elements.audioSourceFolderInput = document.getElementById('audio-source-folder-input');
    elements.audioLocatorStatus = document.getElementById('audio-locator-status');
    elements.skipLocatingAudioBtn = document.getElementById('skip-locating-audio-btn');
}
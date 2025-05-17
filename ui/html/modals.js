export function createModalsHTML() {
    return `
    <div id="import-export-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Import/Export Project</h2>
            <div class="tabs">
                <button class="tab-btn active" data-tab="import">Import</button>
                <button class="tab-btn" data-tab="export">Export</button>
            </div>
            <div class="tab-content" id="import-tab">
                <p>Paste the project data JSON below:</p>
                <textarea id="import-json" rows="10"></textarea>
                <button id="import-btn" class="btn primary-btn">Import</button>
            </div>
            <div class="tab-content" id="export-tab" style="display: none;">
                <p>Copy the project data JSON:</p>
                <textarea id="export-json" rows="10" readonly></textarea>
                <button id="copy-json-btn" class="btn primary-btn">Copy to Clipboard</button>
            </div>
        </div>
    </div>

    <div id="color-edit-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Theme Colors</h2>
            <div id="extracted-palette-display" class="extracted-palette">
                <p class="note" style="display: none;">No colors extracted from image yet.</p>
            </div>
            <button id="apply-extracted-theme-btn" class="btn small-btn" title="Apply theme based on extracted colors (click again to cycle)">
                <i class="fas fa-palette"></i> Use Extracted Colors
            </button>
            <div class="color-inputs">
                <div class="color-input">
                    <label>Primary Color:</label>
                    <input type="color" id="primary-color-input">
                </div>
                <div class="color-input">
                    <label>Secondary Color:</label>
                    <input type="color" id="secondary-color-input">
                </div>
                <div class="color-input">
                    <label>Accent Color:</label>
                    <input type="color" id="accent-color-input">
                </div>
                <div class="color-input">
                    <label>Background Color:</label>
                    <input type="color" id="background-color-input">
                </div>
                <div class="color-input">
                    <label>Text Color:</label>
                    <input type="color" id="text-color-input">
                </div>
            </div>
            <button id="apply-colors-btn" class="btn primary-btn">Apply Colors</button>
            <button id="extract-colors-btn" class="btn">Extract from Image</button>
        </div>
    </div>

    <div id="custom-font-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Custom Font</h2>
            <p>Enter a Google Font name:</p>
            <input type="text" id="custom-font-input" placeholder="e.g. Pacifico">
            <p class="note">The font must be available on Google Fonts</p>
            <button id="apply-font-btn" class="btn primary-btn">Apply Font</button>
        </div>
    </div>

    <div id="create-playlist-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Create New Playlist</h2>
            <input type="text" id="playlist-name-input" placeholder="Playlist Name">
            <div class="available-songs">
                <h3>Available Songs from History</h3>
                <div id="available-songs-list" class="checklist"></div>
            </div>
            <button id="save-playlist-btn" class="btn primary-btn">Save Playlist</button>
        </div>
    </div>

    <div id="edit-playlist-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Playlist</h2>
            <input type="text" id="edit-playlist-name-input" placeholder="Playlist Name">
            
            <div class="playlist-editor-section">
                <h3>Songs in this Playlist</h3>
                <div id="songs-in-playlist-list" class="editable-song-list">
                    <!-- Songs with remove buttons will be populated here -->
                </div>
            </div>

            <div class="playlist-editor-section">
                <h3>Add Songs from History</h3>
                <div id="edit-playlist-available-songs-list" class="checklist">
                    <!-- Available songs from history (not in current playlist) will be populated here -->
                </div>
            </div>
            
            <button id="add-current-song-to-playlist-btn" class="btn"><i class="fas fa-plus-circle"></i> Add Currently Loaded Song</button>
            
            <div class="modal-actions">
                <button id="update-playlist-btn" class="btn primary-btn">Save Changes</button>
                <button id="cancel-edit-playlist-btn" class="btn">Cancel</button>
            </div>
        </div>
    </div>

    <div id="lyrics-editor-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Edit Lyrics</h2>
            <p class="note">Enter each line of lyrics on a separate line.</p>
            <textarea id="lyrics-editor" rows="20" placeholder="Enter lyrics here..."></textarea>
            <div class="modal-actions">
                <button id="save-lyrics-btn" class="btn primary-btn">Save Lyrics</button>
                <button id="cancel-lyrics-btn" class="btn">Cancel</button>
            </div>
        </div>
    </div>

    <div id="playlist-io-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Manage Playlists Data</h2>
            <div class="tabs">
                <button class="tab-btn active" data-tab="playlist-export">Export</button>
                <button class="tab-btn" data-tab="playlist-import">Import</button>
            </div>
            <div class="tab-content" id="playlist-export-tab">
                <p>Copy the playlists data JSON or download it as a file:</p>
                <textarea id="playlist-export-json" rows="10" readonly></textarea>
                <div class="modal-actions" style="justify-content: space-between; margin-top: var(--spacing-sm);">
                    <button id="copy-playlist-json-btn" class="btn primary-btn"><i class="fas fa-copy"></i> Copy to Clipboard</button>
                    <button id="download-playlist-json-btn" class="btn"><i class="fas fa-download"></i> Download .json</button>
                </div>
            </div>
            <div class="tab-content" id="!playlist-import-tab" style="display: none;">
                <p>Paste the playlist data JSON below or upload a .json file:</p>
                <textarea id="playlist-import-json" rows="10" placeholder="Paste playlist JSON here..."></textarea>
                <div style="margin: var(--spacing-sm) 0;">
                    <label for="upload-playlist-json" class="btn">
                        <i class="fas fa-upload"></i> Upload Playlists File (.json)
                    </label>
                    <input type="file" id="upload-playlist-json" accept=".json" class="file-input">
                    <span id="playlist-file-info" class="file-info-display" style="margin-left: var(--spacing-sm);">No file selected</span>
                </div>
                <button id="import-playlist-data-btn" class="btn primary-btn" style="margin-top: var(--spacing-sm);">Import Playlists</button>
            </div>
        </div>
    </div>

    <div id="locate-audio-modal" class="modal">
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Locate Audio File</h2>
            <p>The audio file <strong id="missing-filename-display">filename.mp3</strong> for song <em id="missing-song-title-display">Song Title</em> could not be found locally.</p>
            <p>Please select the folder where this audio file is stored:</p>
            
            <div style="margin: var(--spacing-md) 0;">
                <label for="audio-source-folder-input-btn" class="btn primary-btn">
                    <i class="fas fa-folder-open"></i> Select Audio Folder
                </label>
                <input type="file" id="audio-source-folder-input" webkitdirectory directory style="display: none;" />
            </div>
            
            <p id="audio-locator-status" class="note" style="margin-top: var(--spacing-sm); min-height: 1.2em;"></p>
            
            <div class="modal-actions" style="margin-top: var(--spacing-md);">
                <button id="skip-locating-audio-btn" class="btn">Skip Audio for this Song</button>
            </div>
        </div>
    </div>
    `;
}
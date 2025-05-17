export function createLeftSidebarHTML() {
    return `
        <div class="sidebar left-sidebar">
            <div class="sidebar-section">
                <h3>History</h3>
                <div id="history-panel" class="panel">
                    <!-- History items will be populated here -->
                    <p class="empty-message">No saved songs yet</p>
                </div>
            </div>
            <div class="sidebar-section">
                <h3>Playlists</h3>
                <div id="playlists-panel" class="panel">
                    <!-- Playlist items will be populated here -->
                    <p class="empty-message">No playlists yet</p>
                </div>
                <button id="create-playlist" class="btn"><i class="fas fa-plus"></i> New Playlist</button>
                <button id="import-playlist-from-folder-btn" class="btn" style="margin-top: var(--spacing-xs);"><i class="fas fa-folder-open"></i> Import from Folder</button>
                <input type="file" id="import-folder-input" webkitdirectory directory multiple style="display: none;" />
                <div class="playlist-management-buttons">
                    <button id="export-playlists-btn" class="btn small-btn"><i class="fas fa-file-export"></i> Export Playlists</button>
                    <button id="import-playlists-btn" class="btn small-btn"><i class="fas fa-file-import"></i> Import Playlists</button>
               </div>
            </div>
        </div>
    `;
}


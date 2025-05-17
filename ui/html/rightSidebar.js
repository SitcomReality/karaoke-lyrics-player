export function createRightSidebarHTML() {
    return `
        <div class="sidebar right-sidebar">
            <div class="sidebar-section">
                <h3>Current Playlist</h3>
                <div id="current-playlist-panel" class="panel">
                    <!-- Current playlist will be populated here -->
                    <p class="empty-message">No active playlist</p>
                </div>
                <div class="playlist-controls">
                    <button id="prev-song-btn" class="btn" title="Previous Song"><i class="fas fa-step-backward"></i></button>
                    <button id="add-new-song-btn" class="btn" title="New Song"><i class="fas fa-plus-circle"></i></button>
                    <button id="next-song-btn" class="btn" title="Next Song"><i class="fas fa-step-forward"></i></button>
                    <button id="toggle-auto-advance-btn" class="btn" title="Toggle Auto-Advance">
                        <i class="fas fa-forward"></i>
                    </button>
                </div>
            </div>
            <div class="sidebar-section">
                <h3>Theme Settings</h3>
                <div id="theme-panel" class="panel">
                    <div class="color-theme">
                        <div class="theme-color primary" id="primary-color"></div>
                        <div class="theme-color secondary" id="secondary-color"></div>
                        <div class="theme-color accent" id="accent-color"></div>
                        <div class="theme-color background" id="background-color"></div>
                        <div class="theme-color text" id="text-color"></div>
                    </div>
                    <button id="edit-colors-btn" class="btn small-btn">Edit Colors</button>
                    <div class="font-selection">
                        <label for="font-selector">Font:</label>
                        <select id="font-selector">
                            <option value="Roboto">Roboto</option>
                            <option value="Open Sans">Open Sans</option>
                            <option value="Lato">Lato</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="custom">Custom...</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    `;
}
export function createMainContentHTML() {
    return `
        <div class="main-content" id="main-content-area">
            <div class="header-section">
                <div class="song-header">
                    <div id="song-image-container">
                        <img id="song-image" src="default-song-image.png" alt="Song Image">
                    </div>
                    <div class="song-info">
                        <input type="text" id="song-title" placeholder="Song Title" class="editable-title">
                        <input type="text" id="song-artist" placeholder="Artist Name" class="editable-title">
                    </div>
                </div>
                <div class="upload-section">
                    <span id="audio-file-info" class="file-info-display">No audio file loaded</span>
                    <div class="upload-buttons">
                        <label for="upload-audio" class="upload-btn">
                            <i class="fas fa-music"></i> Upload Audio
                        </label>
                        <input type="file" id="upload-audio" accept="audio/*" class="file-input">

                        <button id="load-audio-url-btn" class="upload-btn">
                            <i class="fas fa-link"></i> Load Audio from URL
                        </button>

                        <label for="upload-image" class="upload-btn">
                            <i class="fas fa-image"></i> Upload Image
                        </label>
                        <input type="file" id="upload-image" accept="image/*" class="file-input">

                        <button id="import-export-btn" class="upload-btn">
                            <i class="fas fa-file-import"></i> Import/Export
                        </button>
                    </div>
                </div>
            </div>

            <div class="player-section" id="player-section-area">
                <div class="audio-player">
                    <div class="controls">
                        <button id="play-btn" class="control-btn"><i class="fas fa-play"></i></button>
                        <div class="progress-container">
                            <div id="progress-bar" class="progress-bar">
                                <div id="progress" class="progress"></div>
                            </div>
                            <div id="time-display" class="time-display">0:00 / 0:00</div>
                        </div>
                        <div class="volume-control">
                            <i class="fas fa-volume-up"></i>
                            <input type="range" id="volume-slider" min="0" max="1" step="0.01" value="1">
                        </div>
                    </div>
                </div>
            </div>

            <div class="lyrics-section">
                <div class="lyrics-placeholder" style="display: none;">
                    <i class="fas fa-microphone-alt placeholder-icon"></i>
                    <p>No lyrics loaded. Upload a lyrics file or click "Edit Lyrics" to add them manually.</p>
                </div>
                <div class="lyrics-container" id="lyrics-container">
                    <!-- Lyrics lines will be populated here -->
                </div>
                <div class="lyrics-actions">
                    <label for="upload-lyrics" class="upload-btn">
                        <i class="fas fa-file-alt"></i> Upload Lyrics
                    </label>
                    <input type="file" id="upload-lyrics" accept=".txt,.lrc" class="file-input">
                    
                    <button id="edit-lyrics-btn" class="upload-btn">
                        <i class="fas fa-edit"></i> Edit Lyrics
                    </button>
                </div>
                <div class="timing-controls">
                    <button id="next-line-btn" class="btn primary-btn">
                        <i class="fas fa-arrow-right"></i> Next Line (Space)
                    </button>
                    <button id="reset-timing-btn" class="btn">
                        <i class="fas fa-redo"></i> Reset Timing
                    </button>
                    <button id="edit-timing-mode-btn" class="btn">
                        <i class="fas fa-edit"></i> Edit Timing
                    </button>
                    <button id="save-project-btn" class="btn primary-btn">
                        <i class="fas fa-save"></i> Save Project
                    </button>
                </div>
            </div>
        </div>
    `;
}
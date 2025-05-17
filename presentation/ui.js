// presentation/ui.js - UI elements for presentation mode
import { state } from '../state.js';
import { elements } from '../dom.js';

// Store references to created presentation elements
const presentationElements = {
  headerContainer: null,
  webcamSpace: null,
  settingsPanel: null,
  modeToggle: null,
  visualizer: null
};

/**
 * Get the main presentation header DOM element.
 * @returns {HTMLElement | null}
 */
export function getPresentationHeaderElement() {
  return presentationElements.headerContainer;
}

/**
 * Create the mode toggle button
 */
export function createModeToggle() {
  const toggle = document.createElement('button');
  toggle.className = 'mode-toggle';
  toggle.innerHTML = '<i class="fas fa-tv"></i>';
  toggle.title = 'Toggle Presentation Mode';
  
  document.body.appendChild(toggle);
  presentationElements.modeToggle = toggle;
}

/**
 * Create all presentation mode elements
 */
export function createPresentationElements() {
  createPresentationHeader();
  createSettingsPanel();
  createAudioVisualizer();
}

/**
 * Create presentation header with image area
 */
function createPresentationHeader() {
  const header = document.createElement('div');
  header.className = 'presentation-header';
  
  // Image container
  const img = document.createElement('img');
  img.alt = 'Song Image';
  
  // Song info overlay
  const infoOverlay = document.createElement('div');
  infoOverlay.className = 'song-info-overlay';
  infoOverlay.innerHTML = `
    <h1 class="song-title"></h1>
    <h2 class="song-artist"></h2>
  `;
  
  header.appendChild(img);
  header.appendChild(infoOverlay);
  presentationElements.headerContainer = header;
}

/**
 * Create the settings panel for presentation mode
 */
function createSettingsPanel() {
  const panel = document.createElement('div');
  panel.className = 'presentation-settings';
  
  panel.innerHTML = `
    <button class="close-settings"><i class="fas fa-times"></i></button>
    <h3>Presentation Settings</h3>
    
    <div class="settings-row">
      <label for="show-header">Show Header Image</label>
      <input type="checkbox" id="show-header" checked>
    </div>
    
    <div class="animation-selector">
      <div class="settings-row">
        <label for="animation-type">Animation Type</label>
        <select id="animation-type">
          <option value="fade">Fade</option>
          <option value="slide">Slide</option>
          <option value="zoom">Zoom</option>
          <option value="typewriter">Typewriter</option>
          <option value="none">None</option>
        </select>
      </div>
    </div>
    
    <div class="webcam-controls">
      <div class="settings-row">
        <label for="enable-webcam-space">Reserve Webcam Space</label>
        <input type="checkbox" id="enable-webcam-space">
      </div>
      
      <div class="settings-row">
        <label for="webcam-position">Position</label>
        <select id="webcam-position">
          <option value="top-left">Top Left</option>
          <option value="top-right">Top Right</option>
          <option value="bottom-left">Bottom Left</option>
          <option value="bottom-right">Bottom Right</option>
        </select>
      </div>
      
      <div class="settings-row">
        <label for="webcam-width">Width (px)</label>
        <input type="number" id="webcam-width" value="320" min="100" max="800">
      </div>
      
      <div class="settings-row">
        <label for="webcam-height">Height (px)</label>
        <input type="number" id="webcam-height" value="240" min="100" max="600">
      </div>
    </div>
  `;
  
  presentationElements.settingsPanel = panel;
}

/**
 * Create audio visualizer element
 */
function createAudioVisualizer() {
  const visualizer = document.createElement('canvas');
  visualizer.className = 'audio-visualizer';
  presentationElements.visualizer = visualizer;
}

/**
 * Update the presentation UI with current song data
 */
export function updatePresentationUI() {
  const mainContent = elements.mainContentArea; // Use mainContentArea
  
  if (!mainContent) {
    console.error("Main content area not found for presentation UI setup.");
    return;
  }
  if (!elements.lyricsContainer) {
    console.error("Lyrics container not found for presentation UI setup.");
    return;
  }
  if (!elements.playerSectionArea) { // Use playerSectionArea
     console.error("Player section area not found for presentation UI setup.");
  }

  // Add header to the DOM if not already present
  // Ensure presentationElements.headerContainer is not null before using it
  if (presentationElements.headerContainer && !mainContent.contains(presentationElements.headerContainer)) {
    mainContent.insertBefore(presentationElements.headerContainer, mainContent.firstChild);
  }
  
  // Add settings panel if not already in DOM
  if (presentationElements.settingsPanel && !document.body.contains(presentationElements.settingsPanel)) {
    document.body.appendChild(presentationElements.settingsPanel);
  }
  
  // Add visualizer if not already in DOM
  if (presentationElements.visualizer && elements.lyricsContainer && !elements.lyricsContainer.contains(presentationElements.visualizer)) {
    elements.lyricsContainer.appendChild(presentationElements.visualizer);
  }
  
  // Update song info
  updateHeaderContent();
  
  // Setup player styling
  if (elements.playerSectionArea) {
      elements.playerSectionArea.classList.add('presentation-player');
  }
  
  // Update settings panel values
  updateSettingsPanelValues();
}

/**
 * Update header image and text with current song data
 */
function updateHeaderContent() {
  if (!presentationElements.headerContainer) return;
  
  const headerImg = presentationElements.headerContainer.querySelector('img');
  const titleElement = presentationElements.headerContainer.querySelector('.song-title');
  const artistElement = presentationElements.headerContainer.querySelector('.song-artist');
  
  if (!headerImg || !titleElement || !artistElement) {
    console.error("Header content elements not found within presentation header.");
    return;
  }

  // Set header image
  if (state.currentSong.image) {
    headerImg.src = state.currentSong.image;
  } else {
    headerImg.src = 'default-song-image.png';
  }
  
  // Set song info
  titleElement.textContent = state.currentSong.title || 'Untitled Song';
  artistElement.textContent = state.currentSong.artist || 'Unknown Artist';
}

/**
 * Update settings panel with current state values
 */
function updateSettingsPanelValues() {
  const panel = presentationElements.settingsPanel;
  if (!panel) return;
  
  const showHeaderCheckbox = panel.querySelector('#show-header');
  const animationSelect = panel.querySelector('#animation-type');
  const enableWebcamCheckbox = panel.querySelector('#enable-webcam-space');
  const webcamPositionSelect = panel.querySelector('#webcam-position');
  const webcamWidthInput = panel.querySelector('#webcam-width');
  const webcamHeightInput = panel.querySelector('#webcam-height');

  if (!showHeaderCheckbox || !animationSelect || !enableWebcamCheckbox || !webcamPositionSelect || !webcamWidthInput || !webcamHeightInput) {
      console.error("One or more settings panel controls not found.");
      return;
  }
  
  showHeaderCheckbox.checked = state.presentation.showHeader;
  animationSelect.value = state.presentation.animationType;
  enableWebcamCheckbox.checked = state.presentation.webcam.enabled;
  webcamPositionSelect.value = state.presentation.webcam.position;
  webcamWidthInput.value = state.presentation.webcam.width;
  webcamHeightInput.value = state.presentation.webcam.height;
}

/**
 * Clean up presentation UI elements
 */
export function cleanupPresentationUI() {
  // Remove presentation-specific classes
  if (elements.playerSectionArea) {
      elements.playerSectionArea.classList.remove('presentation-player');
  }
  
  // Remove header if present and ensure it's not collapsed
  if (presentationElements.headerContainer) {
    if (presentationElements.headerContainer.parentElement) {
        presentationElements.headerContainer.parentElement.removeChild(presentationElements.headerContainer);
    }
    presentationElements.headerContainer.classList.remove('header-collapsed');
  }
  
  // Remove webcam space if present
  hideWebcamSpace();
  
  // Hide settings panel
  if (presentationElements.settingsPanel) {
    presentationElements.settingsPanel.classList.remove('visible');
  }
  
  // Remove visualizer if present
  if (presentationElements.visualizer && presentationElements.visualizer.parentElement) {
    presentationElements.visualizer.parentElement.removeChild(presentationElements.visualizer);
  }
}

/**
 * Show webcam space based on current settings
 */
export function showWebcamSpace() {
  hideWebcamSpace(); // Clear any existing webcam space
  
  const { position, width, height } = state.presentation.webcam;
  
  const webcamSpace = document.createElement('div');
  webcamSpace.className = `webcam-space ${position}`;
  webcamSpace.style.width = `${width}px`;
  webcamSpace.style.height = `${height}px`;
  webcamSpace.innerHTML = '<span>Webcam Space</span>';
  
  document.body.appendChild(webcamSpace);
  presentationElements.webcamSpace = webcamSpace;
}

/**
 * Hide the webcam space element
 */
export function hideWebcamSpace() {
  if (presentationElements.webcamSpace && presentationElements.webcamSpace.parentElement) {
    presentationElements.webcamSpace.parentElement.removeChild(presentationElements.webcamSpace);
    presentationElements.webcamSpace = null;
  }
}

/**
 * Update the visibility of the header based on settings.
 * The collapsed/expanded state is managed by audio events, not directly here.
 */
export function updateHeaderVisibility() {
  if (!presentationElements.headerContainer) return;
  
  if (state.presentation.showHeader) {
    presentationElements.headerContainer.style.display = 'block'; // Or 'flex' or its default
  } else {
    presentationElements.headerContainer.style.display = 'none';
  }
}

/**
 * Scroll to the active lyric line in presentation mode
 */
export function scrollToActiveLyricPresentation() {
  if (state.currentLineIndex < 0 || !elements.lyricsContainer) return;
  
  const activeElement = elements.lyricsContainer.querySelector(`.lyrics-line[data-index="${state.currentLineIndex}"]`);
  if (!activeElement) return;
  
  // Center the active lyric in the container
  activeElement.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'center'
  });
}

/**
 * Toggle visibility of settings panel
 */
export function toggleSettingsPanel() {
  if (!presentationElements.settingsPanel) return;
  
  presentationElements.settingsPanel.classList.toggle('visible');
}

/**
 * Adds the 'header-collapsed' class to the presentation header.
 */
export function collapseHeader() {
  if (presentationElements.headerContainer) {
    presentationElements.headerContainer.classList.add('header-collapsed');
  }
}

/**
 * Removes the 'header-collapsed' class from the presentation header.
 */
export function expandHeader() {
  if (presentationElements.headerContainer) {
    presentationElements.headerContainer.classList.remove('header-collapsed');
  }
}
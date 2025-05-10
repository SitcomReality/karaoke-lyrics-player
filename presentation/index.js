// presentation/index.js - Main controller for presentation mode
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as UI from './ui.js';
import * as Animations from './animations.js';
import { setupEventListeners } from './events.js';

/**
 * Initialize the presentation mode functionality
 */
export function init() {
  // Add presentation mode state to the application state
  if (!state.presentation) {
    state.presentation = {
      active: false,
      animationType: 'fade', // Default animation
      showHeader: true,
      webcam: {
        enabled: false,
        position: 'bottom-right',
        width: 320,
        height: 240
      }
    };
  }
  
  // Create UI elements
  UI.createModeToggle();
  UI.createPresentationElements();
  
  // Setup event listeners
  setupEventListeners();
  
  // Initialize animations
  Animations.init();
}

/**
 * Toggle between presentation and edit modes
 */
export function togglePresentationMode() {
  state.presentation.active = !state.presentation.active;
  
  if (state.presentation.active) {
    enterPresentationMode();
  } else {
    exitPresentationMode();
  }
}

/**
 * Enter presentation mode
 */
function enterPresentationMode() {
  document.body.classList.add('presentation-mode');
  
  // Setup presentation UI
  UI.updatePresentationUI();
  
  // Apply current animation type
  Animations.applyAnimation(state.presentation.animationType);
  
  // Apply webcam space if enabled
  if (state.presentation.webcam.enabled) {
    UI.showWebcamSpace();
  }
  
  // Update the visibility of header image
  UI.updateHeaderVisibility();
  
  // Scroll to active lyric immediately
  UI.scrollToActiveLyricPresentation();
}

/**
 * Exit presentation mode
 */
function exitPresentationMode() {
  document.body.classList.remove('presentation-mode');
  
  // Reset any presentation-specific elements
  UI.cleanupPresentationUI();
}

/**
 * Update presentation display when lyrics change
 */
export function updateLyricsDisplay() {
  if (!state.presentation.active) return;
  
  // Update lyrics display with current animation
  Animations.updateLyricsAnimation();
  
  // Scroll to the active lyric line
  UI.scrollToActiveLyricPresentation();
}

/**
 * Save presentation settings
 * @param {Object} settings - Updated settings object
 */
export function saveSettings(settings) {
  state.presentation = {
    ...state.presentation,
    ...settings
  };
  
  if (state.presentation.active) {
    // Re-apply settings
    Animations.applyAnimation(state.presentation.animationType);
    UI.updateHeaderVisibility();
    
    if (state.presentation.webcam.enabled) {
      UI.showWebcamSpace();
    } else {
      UI.hideWebcamSpace();
    }
  }
  
  // Save to storage
  import('../storage.js').then(Storage => {
    Storage.savePresentationSettings();
  });
}
// presentation/index.js - Main controller for presentation mode
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as PresentationUI from './ui.js';
import * as Animations from './animations.js';
import { setupEventListeners as setupPresentationSpecificEventListeners } from './events.js'; // Renamed to avoid confusion
import * as Storage from '../storage.js'; // Import for saving settings

// Keep track of the audio element we're listening to for presentation events
let listenedAudioElement = null;

// Event handlers for audio state changes in presentation mode
function handleAudioPlayInPresentation() {
    if (state.presentation.active && PresentationUI.getPresentationHeaderElement()) {
        PresentationUI.collapseHeader();
    }
}

function handleAudioPauseOrEndedInPresentation() {
    if (state.presentation.active && PresentationUI.getPresentationHeaderElement()) {
        PresentationUI.expandHeader();
    }
}

/**
 * Sets up or refreshes audio event listeners specific to presentation mode.
 */
function setupPresentationAudioListeners() {
    // Clean up listeners from any previously tracked audio element
    if (listenedAudioElement) {
        listenedAudioElement.removeEventListener('play', handleAudioPlayInPresentation);
        listenedAudioElement.removeEventListener('pause', handleAudioPauseOrEndedInPresentation);
        listenedAudioElement.removeEventListener('ended', handleAudioPauseOrEndedInPresentation);
        listenedAudioElement = null;
    }

    // If new audio is available, add listeners
    if (state.audio) {
        state.audio.addEventListener('play', handleAudioPlayInPresentation);
        state.audio.addEventListener('pause', handleAudioPauseOrEndedInPresentation);
        state.audio.addEventListener('ended', handleAudioPauseOrEndedInPresentation);
        listenedAudioElement = state.audio; // Track the current audio element

        // Set initial header state based on current playback
        if (state.isPlaying) {
            handleAudioPlayInPresentation();
        } else {
            handleAudioPauseOrEndedInPresentation();
        }
    } else {
        // No audio, ensure header is expanded
        handleAudioPauseOrEndedInPresentation();
    }
}


/**
 * Initialize the presentation mode functionality
 */
export function init() {
  // Add presentation mode state to the application state
  if (!state.presentation) {
    state.presentation = {
      active: false,
      animationType: 'fade', 
      showHeader: true,
      webcam: {
        enabled: false,
        position: 'bottom-right',
        width: 320,
        height: 240
      }
    };
  }
  
  PresentationUI.createModeToggle();
  PresentationUI.createPresentationElements();
  setupPresentationSpecificEventListeners(); // Setup UI event listeners for presentation mode
  Animations.init();

  // Listen for 'audioready' events to re-setup listeners if audio changes during presentation mode
  document.body.addEventListener('audioready', () => {
      if (state.presentation.active) {
          setupPresentationAudioListeners();
      }
  });
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
  PresentationUI.updatePresentationUI(); // Sets up general UI structure
  Animations.applyAnimation(state.presentation.animationType);
  
  if (state.presentation.webcam.enabled) {
    PresentationUI.showWebcamSpace();
  }
  
  PresentationUI.updateHeaderVisibility(); // Controls display: block/none based on settings
  setupPresentationAudioListeners(); // Manages play/pause listeners and initial collapse/expand state
  
  PresentationUI.scrollToActiveLyricPresentation();
}

/**
 * Exit presentation mode
 */
function exitPresentationMode() {
  document.body.classList.remove('presentation-mode');
  
  // Clean up audio listeners specific to presentation mode
  if (listenedAudioElement) {
    listenedAudioElement.removeEventListener('play', handleAudioPlayInPresentation);
    listenedAudioElement.removeEventListener('pause', handleAudioPauseOrEndedInPresentation);
    listenedAudioElement.removeEventListener('ended', handleAudioPauseOrEndedInPresentation);
    listenedAudioElement = null;
  }

  PresentationUI.cleanupPresentationUI(); // General UI cleanup
  
  // Explicitly expand header on exit, if it exists and was part of DOM
  const headerEl = PresentationUI.getPresentationHeaderElement();
  if (headerEl) { // Check if element is still valid
      PresentationUI.expandHeader();
  }
}

/**
 * Update presentation display when lyrics change
 */
export function updateLyricsDisplay() {
  if (!state.presentation.active) return;
  
  // Update lyrics display with current animation
  Animations.updateLyricsAnimation();
  
  // Scroll to the active lyric line
  PresentationUI.scrollToActiveLyricPresentation();
}

/**
 * Save presentation settings
 * @param {Object} settings - Updated settings object
 */
export function saveSettings(settings) {
  // Merge new settings, ensuring webcam object is also merged, not overwritten
  state.presentation = {
    ...state.presentation,
    ...settings,
    webcam: {
      ...state.presentation.webcam,
      ...(settings.webcam || {}),
    }
  };
  
  if (state.presentation.active) {
    Animations.applyAnimation(state.presentation.animationType);
    PresentationUI.updateHeaderVisibility(); // Reflect showHeader setting
    
    if (state.presentation.webcam.enabled) {
      PresentationUI.showWebcamSpace();
    } else {
      PresentationUI.hideWebcamSpace();
    }
    // Header collapse/expand state is driven by audio, no need to explicitly call here
  }
  
  Storage.savePresentationSettings();
}
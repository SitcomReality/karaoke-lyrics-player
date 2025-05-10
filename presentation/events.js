// presentation/events.js - Event handlers for presentation mode
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as PresentationUI from './ui.js';
import * as Animations from './animations.js';
import { togglePresentationMode, saveSettings } from './index.js';

/**
 * Set up all event listeners for presentation mode
 */
export function setupEventListeners() {
  // Mode toggle button
  const modeToggle = document.querySelector('.mode-toggle');
  if (modeToggle) {
    modeToggle.addEventListener('click', handleModeToggle);
  }
  
  // Settings panel toggle (add gear icon to mode toggle on hover)
  modeToggle.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    PresentationUI.toggleSettingsPanel();
  });
  
  // Add settings icon to the mode toggle
  const settingsIcon = document.createElement('div');
  settingsIcon.className = 'settings-icon';
  settingsIcon.innerHTML = '<i class="fas fa-cog"></i>';
  settingsIcon.style.position = 'absolute';
  settingsIcon.style.bottom = '-5px';
  settingsIcon.style.right = '-5px';
  settingsIcon.style.background = 'var(--accent-color)';
  settingsIcon.style.color = 'var(--on-accent)';
  settingsIcon.style.borderRadius = '50%';
  settingsIcon.style.width = '16px';
  settingsIcon.style.height = '16px';
  settingsIcon.style.fontSize = '10px';
  settingsIcon.style.display = 'flex';
  settingsIcon.style.alignItems = 'center';
  settingsIcon.style.justifyContent = 'center';
  settingsIcon.title = 'Right-click for settings';
  modeToggle.appendChild(settingsIcon);
  
  // Close button for settings panel
  const closeSettings = document.querySelector('.close-settings');
  if (closeSettings) {
    closeSettings.addEventListener('click', () => {
      const panel = document.querySelector('.presentation-settings');
      if (panel) panel.classList.remove('visible');
    });
  }
  
  // Settings form controls
  setupSettingsFormListeners();
  
  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // ESC key to exit presentation mode
    if (e.key === 'Escape' && state.presentation.active) {
      togglePresentationMode();
    }
    
    // F key to toggle fullscreen
    if (e.key === 'f' && state.presentation.active) {
      toggleFullscreen();
    }
  });
}

/**
 * Handle the mode toggle button click
 */
function handleModeToggle() {
  togglePresentationMode();
}

/**
 * Set up event listeners for the settings form
 */
function setupSettingsFormListeners() {
  const settingsPanel = document.querySelector('.presentation-settings');
  if (!settingsPanel) return;
  
  // Header visibility
  const showHeaderCheckbox = settingsPanel.querySelector('#show-header');
  showHeaderCheckbox.addEventListener('change', () => {
    saveSettings({
      ...state.presentation,
      showHeader: showHeaderCheckbox.checked
    });
  });
  
  // Animation type
  const animationSelect = settingsPanel.querySelector('#animation-type');
  animationSelect.addEventListener('change', () => {
    saveSettings({
      ...state.presentation,
      animationType: animationSelect.value
    });
  });
  
  // Webcam space settings
  const enableWebcamCheckbox = settingsPanel.querySelector('#enable-webcam-space');
  const webcamPositionSelect = settingsPanel.querySelector('#webcam-position');
  const webcamWidthInput = settingsPanel.querySelector('#webcam-width');
  const webcamHeightInput = settingsPanel.querySelector('#webcam-height');
  
  const updateWebcamSettings = () => {
    saveSettings({
      ...state.presentation,
      webcam: {
        enabled: enableWebcamCheckbox.checked,
        position: webcamPositionSelect.value,
        width: parseInt(webcamWidthInput.value, 10),
        height: parseInt(webcamHeightInput.value, 10)
      }
    });
  };
  
  enableWebcamCheckbox.addEventListener('change', updateWebcamSettings);
  webcamPositionSelect.addEventListener('change', updateWebcamSettings);
  webcamWidthInput.addEventListener('change', updateWebcamSettings);
  webcamHeightInput.addEventListener('change', updateWebcamSettings);
}

/**
 * Toggle fullscreen mode
 */
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen: ${err.message}`);
    });
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
}

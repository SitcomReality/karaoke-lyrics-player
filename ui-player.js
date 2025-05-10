// ui-player.js - UI Updates for audio player controls and progress
import { state } from './state.js';
import { elements } from './dom.js';

export function updatePlayerControls() {
    // Update audio controls based on current state
    if (state.isPlaying) {
        elements.playBtn.innerHTML = '<i class="fas fa-pause"></i>';
        elements.playBtn.title = "Pause (Space)";
    } else {
        elements.playBtn.innerHTML = '<i class="fas fa-play"></i>';
         elements.playBtn.title = "Play (Space)";
    }

    // Volume - Check if state.audio exists before accessing volume
    if (state.audio) {
        elements.volumeSlider.value = state.audio.volume;
    } else {
        // If no audio object, set slider to default (e.g., 1 or stored preference)
        elements.volumeSlider.value = 1; // Default to max volume visually
    }
     // Disable play button if no audio is loaded
    elements.playBtn.disabled = !state.audio;
}

export function updateProgressUI() {
    if (state.audio && state.duration > 0 && state.currentTime >= 0) {
        const percentage = (state.currentTime / state.duration) * 100;
        elements.progress.style.width = `${percentage}%`;
    } else {
        elements.progress.style.width = '0%'; // Reset if no duration or time
    }
}
// lyrics/timing.js - Handles lyric timing and synchronized UI
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as Storage from '../storage.js';
import { renderLyrics } from './render.js';

/**
 * Handles lyric line click in edit mode: sets timing for that line.
 * @param {Event} event
 */
export function handleLyricLineClick(event) {
    const lineElement = event.currentTarget;
    const index = parseInt(lineElement.dataset.index, 10);

    if (state.audio && state.editMode && !isNaN(index)) {
        const newTime = state.audio.currentTime;
        const adjustedTime = newTime < 0.1 ? 0 : newTime;
        state.currentSong.timing[index] = adjustedTime;
        state.currentLineIndex = index;
        Storage.saveCurrentSongState();
        renderLyrics();
    }
}

/**
 * Advances to the next lyric line and marks its start time.
 */
export function markNextLine() {
    if (!state.audio) {
        alert('Please upload an audio file first.');
        return;
    }
    if (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0) {
        alert('Please upload or add lyrics first.');
        return;
    }

    let targetIndex = -1;
    if (state.currentLineIndex >= 0 && state.currentLineIndex < state.currentSong.lyrics.length - 1) {
        targetIndex = state.currentLineIndex + 1;
    } else if (state.currentLineIndex === -1) {
        targetIndex = 0;
    } else {
        elements.nextLineBtn.classList.add('flash');
        setTimeout(() => elements.nextLineBtn.classList.remove('flash'), 300);
        return;
    }

    if (targetIndex >= 0 && targetIndex < state.currentSong.lyrics.length) {
        const currentTime = state.audio.currentTime;
        const adjustedTime = (currentTime < 0.1 && targetIndex === 0) ? 0 : (currentTime < 0.1 ? 0.1 : currentTime);
        const previousTime = targetIndex > 0 ? (state.currentSong.timing[targetIndex - 1] ?? -1) : -1;
        if (previousTime !== null && adjustedTime < previousTime) {
             console.warn(`Attempted to set time (${adjustedTime}) for line ${targetIndex} earlier than previous line (${previousTime}). Adjusting.`);
             state.currentSong.timing[targetIndex] = previousTime + 0.01;
        } else {
            state.currentSong.timing[targetIndex] = adjustedTime;
        }
        state.currentLineIndex = targetIndex;
        Storage.saveCurrentSongState();
        renderLyrics();
    }
}

/**
 * Resets timing data for all lyric lines.
 * Prompts for confirmation.
 */
export function resetTiming() {
    if (!state.currentSong.lyrics || state.currentSong.lyrics.length === 0) {
        alert('No lyrics to reset timing for.');
        return;
    }
    if (!confirm("Are you sure you want to reset all timing information for this song?")) {
        return;
    }

    state.currentSong.timing = Array(state.currentSong.lyrics.length).fill(null);
    state.currentLineIndex = -1;
    Storage.saveCurrentSongState();
    renderLyrics();
}

/**
 * Toggles lyric edit (timing) mode.
 * Updates button state and container CSS.
 */
export function toggleEditMode() {
    state.editMode = !state.editMode;

    elements.editTimingModeBtn.innerHTML = state.editMode ?
        '<i class="fas fa-check"></i> Done Editing' :
        '<i class="fas fa-edit"></i> Edit Timing';
    elements.editTimingModeBtn.classList.toggle('active', state.editMode);
    elements.lyricsContainer.classList.toggle('edit-mode', state.editMode);

    renderLyrics();
}

/**
 * Highlights (or clears) lyric line in sync with audio playback and timing.
 * If no valid timing, removes highlight.
 */
export function updateHighlightedLyrics() {
    if (!state.audio || !state.currentSong.timing || !state.currentSong.timing.length || !state.isPlaying) {
        if (state.currentLineIndex !== -1) {
            state.currentLineIndex = -1;
            renderLyrics();
        }
        return;
    }
    const currentTime = state.currentTime;
    let foundIndex = -1;
    let nextTimeIndex = -1;
    for (let i = 0; i < state.currentSong.timing.length; i++) {
        const time = state.currentSong.timing[i];
        if (time === null || time === undefined) continue;
        if (time > currentTime) {
            nextTimeIndex = i;
            break;
        }
        foundIndex = i;
    }
    if (nextTimeIndex === 0) {
        foundIndex = -1;
    }
    if (foundIndex !== state.currentLineIndex) {
        state.currentLineIndex = foundIndex;
        renderLyrics();
    }
}
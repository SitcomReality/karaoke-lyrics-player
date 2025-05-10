// lyrics/core.js - Core lyric parsing logic and helpers
import { state } from '../state.js';

/**
 * Parses lyrics from plain text content.
 * Each non-empty line is considered a lyric line.
 * Resets timing to match new line count.
 * @param {string} content - Text content of the lyrics.
 */
export function parseLyrics(content) {
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    state.currentSong.lyrics = lines;
    // Reset timing when new lyrics are loaded
    state.currentSong.timing = Array(lines.length).fill(null);
    state.currentLineIndex = -1; // Reset highlight
}
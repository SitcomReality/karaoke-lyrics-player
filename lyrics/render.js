// lyrics/render.js - Rendering UI for lyrics and scroll logic
import { state } from '../state.js';
import { elements } from '../dom.js';
import * as Presentation from '../presentation/index.js';

/**
 * Renders all lyrics to the page, displaying timestamps if present.
 * Handles edit mode and current line highlight.
 */
export function renderLyrics() {
    const hasLyrics = state.currentSong.lyrics && state.currentSong.lyrics.length > 0;
    elements.lyricsContainer.innerHTML = '';

    if (hasLyrics) {
        elements.lyricsPlaceholder.style.display = 'none';
        elements.lyricsContainer.style.display = 'block';

        state.currentSong.lyrics.forEach((line, index) => {
            const lineElement = document.createElement('div');
            lineElement.className = 'lyrics-line';
            lineElement.dataset.index = index;

            // Show timestamp if exists for line
            const timestamp = state.currentSong.timing[index];
            let timePrefix = '';
            if (timestamp !== null && timestamp !== undefined) {
                const minutes = Math.floor(timestamp / 60);
                const seconds = Math.floor(timestamp % 60);
                const timeString = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;
                const timeSpan = document.createElement('span');
                timeSpan.className = 'line-time';
                timeSpan.textContent = timeString;
                lineElement.appendChild(timeSpan);
                timePrefix = ' ';
            }

            const textNode = document.createTextNode(`${timePrefix}${line}`);
            lineElement.appendChild(textNode);

            if (state.editMode) {
                lineElement.style.cursor = 'pointer';
                lineElement.title = 'Click to set timing for this line';
                lineElement.addEventListener('click', (e) => {
                    // lazy-load to avoid circular dep
                    import('./timing.js').then(mod => mod.handleLyricLineClick(e));
                });
            } else {
                lineElement.style.cursor = 'default';
                lineElement.title = '';
            }

            // Highlight current line
            if (index === state.currentLineIndex) {
                lineElement.classList.add('active');
            }
            elements.lyricsContainer.appendChild(lineElement);
        });

        scrollToActiveLine();
        
        // Notify presentation mode about lyrics update
        if (state.presentation && state.presentation.active) {
            Presentation.updateLyricsDisplay();
        }
    } else {
        elements.lyricsPlaceholder.style.display = 'flex';
        elements.lyricsContainer.style.display = 'none';
    }
}

/**
 * Scrolls active lyric line into view, smoothly and centered if necessary.
 */
export function scrollToActiveLine() {
    if (state.currentLineIndex >= 0) {
        const activeElement = elements.lyricsContainer.querySelector(`.lyrics-line[data-index="${state.currentLineIndex}"]`);
        if (activeElement) {
            const containerRect = elements.lyricsContainer.getBoundingClientRect();
            const elementRect = activeElement.getBoundingClientRect();
            const desiredTop = containerRect.top + (containerRect.height / 2) - (elementRect.height / 2);
            if (Math.abs(elementRect.top - desiredTop) > elementRect.height) {
                activeElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                    inline: 'nearest'
                });
            }
        }
    }
}
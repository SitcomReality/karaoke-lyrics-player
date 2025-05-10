// presentation/animations.js - Lyrics animation system
import { state } from '../state.js';
import { elements } from '../dom.js';

// Available animation types
const ANIMATION_TYPES = ['fade', 'slide', 'zoom', 'typewriter', 'none'];

/**
 * Initialize animations
 */
export function init() {
  // Set up base styles
  setupAnimationStyles();
}

/**
 * Set up any animation-specific styles
 */
function setupAnimationStyles() {
  // Add any additional styles for animations
  // Base styles are in presentation.css
}

/**
 * Apply the selected animation to lyrics container
 * @param {string} animationType - Type of animation to apply
 */
export function applyAnimation(animationType) {
  if (!ANIMATION_TYPES.includes(animationType)) {
    console.warn(`Invalid animation type: ${animationType}. Using 'fade' instead.`);
    animationType = 'fade';
  }
  
  // Remove any existing animation classes
  ANIMATION_TYPES.forEach(type => {
    elements.lyricsContainer.classList.remove(`animation-${type}`);
  });
  
  // Add the selected animation class
  if (animationType !== 'none') {
    elements.lyricsContainer.classList.add(`animation-${animationType}`);
  }
  
  // Update the active state in settings
  state.presentation.animationType = animationType;
  
  // Initial update of lyrics with new animation
  updateLyricsAnimation();
}

/**
 * Update the lyric lines with appropriate classes for animation
 */
export function updateLyricsAnimation() {
  if (!state.presentation.active) return;
  
  const currentIndex = state.currentLineIndex;
  const animationType = state.presentation.animationType;
  
  // Get all lyric lines
  const lines = elements.lyricsContainer.querySelectorAll('.lyrics-line');
  
  lines.forEach(line => {
    const lineIndex = parseInt(line.dataset.index, 10);
    
    // Clear any previous animation classes
    line.classList.remove('active', 'past', 'future');
    
    // Set appropriate class based on relation to current line
    if (lineIndex === currentIndex) {
      line.classList.add('active');
    } else if (lineIndex < currentIndex) {
      line.classList.add('past');
    } else {
      line.classList.add('future');
    }
    
    // Apply animation-specific adjustments
    applyAnimationSpecificEffects(line, lineIndex, currentIndex, animationType);
  });
}

/**
 * Apply specific effects based on the selected animation type
 * @param {HTMLElement} line - The lyric line element
 * @param {number} lineIndex - Index of this line
 * @param {number} currentIndex - Current active line index
 * @param {string} animationType - Current animation type
 */
function applyAnimationSpecificEffects(line, lineIndex, currentIndex, animationType) {
  switch (animationType) {
    case 'zoom':
      // Apply zoom effect - past lines smaller, future lines normal, active line larger
      if (lineIndex < currentIndex) {
        // Past lines
        line.style.transform = 'scale(0.8)';
        line.style.opacity = '0.3';
      } else if (lineIndex === currentIndex) {
        // Current line
        line.style.transform = 'scale(1.1)';
        line.style.opacity = '1';
      } else {
        // Future lines
        line.style.transform = 'scale(1)';
        line.style.opacity = '0.6';
      }
      break;
      
    case 'typewriter':
      // Typewriter effect is applied with CSS animations
      if (lineIndex === currentIndex) {
        simulateTypewriterEffect(line);
      } else {
        line.style.visibility = lineIndex < currentIndex ? 'visible' : 'hidden';
      }
      break;
    
    // Other animations are handled by CSS classes
    default:
      // Clear any inline styles that might interfere
      line.style.transform = '';
      line.style.opacity = '';
      line.style.visibility = '';
      break;
  }
}

/**
 * Simulate a typewriter effect for the active line
 * @param {HTMLElement} line - The lyric line element
 */
function simulateTypewriterEffect(line) {
  // Reset any existing effect
  line.style.visibility = 'visible';
  
  // Store original text
  const originalText = line.textContent;
  line.setAttribute('data-original-text', originalText);
  
  // Clear the line to prepare for animation
  const timeElement = line.querySelector('.line-time');
  if (timeElement) {
    // Keep the time element if present
    line.textContent = '';
    line.appendChild(timeElement);
    line.appendChild(document.createTextNode(' ')); // Add space after timestamp
  } else {
    line.textContent = '';
  }
  
  // Animate the text typing
  let charIndex = 0;
  const textToType = line.getAttribute('data-original-text');
  const interval = setInterval(() => {
    // Add next character
    if (charIndex < textToType.length) {
      if (timeElement) {
        // If we have a time element, append to text node after it
        if (line.childNodes.length > 1) {
          line.childNodes[1].textContent += textToType.charAt(charIndex);
        } else {
          line.appendChild(document.createTextNode(textToType.charAt(charIndex)));
        }
      } else {
        line.textContent += textToType.charAt(charIndex);
      }
      charIndex++;
    } else {
      clearInterval(interval);
    }
  }, 30); // Adjust speed if needed
}

/**
 * Start the audio visualizer
 * @param {HTMLCanvasElement} canvas - The canvas element for visualization
 * @param {AudioContext} audioContext - Web Audio API context
 * @param {AnalyserNode} analyser - Audio analyser node
 */
export function startVisualizer(canvas, audioContext, analyser) {
  if (!canvas || !audioContext || !analyser) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width = canvas.offsetWidth;
  const height = canvas.height = canvas.offsetHeight;
  
  // Set up the drawing function
  function draw() {
    if (!state.presentation.active) return;
    
    requestAnimationFrame(draw);
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw visualization
    const barWidth = width / bufferLength;
    let x = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] / 2;
      
      // Use theme colors
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, state.currentSong.theme.accent);
      gradient.addColorStop(1, state.currentSong.theme.primary);
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
  }
  
  // Start the visualization
  draw();
}
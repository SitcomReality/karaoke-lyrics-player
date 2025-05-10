// theme/index.js - Barrel file for theme modules
// Re-exports functions to maintain consistent API for other parts of the application.

import { applyFont as applyFontFromLoader } from '../fontLoader.js';
import { applyTheme as applyThemeInternal } from './apply.js';
import { updateThemeUI as updateThemeUIInternal, populateColorInputs as populateColorInputsInternal } from './ui.js';
import { resetThemeRotationOffset as resetThemeRotationOffsetInternal, applyExtractedTheme as applyExtractedThemeInternal } from './generator.js';

// Re-export functions
export const applyFont = applyFontFromLoader;
export const applyTheme = applyThemeInternal;
export const updateThemeUI = updateThemeUIInternal;
export const populateColorInputs = populateColorInputsInternal;
export const resetThemeRotationOffset = resetThemeRotationOffsetInternal;
export const applyExtractedTheme = applyExtractedThemeInternal;
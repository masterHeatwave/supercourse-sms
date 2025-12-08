/**
 * Session Mode Utility
 * 
 * Centralized configuration for session modes across the application.
 * This ensures consistency in mode values, labels, and formatting.
 */

import { PostSessionsBodyMode } from '@gen-api/schemas';

/**
 * Session mode option interface
 */
export interface SessionModeOption {
  label: string;
  value: string;
  apiValue: PostSessionsBodyMode;
}

/**
 * Available session modes
 */
export const SESSION_MODES: SessionModeOption[] = [
  {
    label: 'In Person',
    value: 'in_person',
    apiValue: 'in_person'
  },
  {
    label: 'Online',
    value: 'online',
    apiValue: 'online'
  },
  {
    label: 'Hybrid',
    value: 'hybrid',
    apiValue: 'hybrid'
  }
];

/**
 * Get all session mode options for dropdowns
 */
export function getSessionModeOptions(): Array<{ label: string; value: string }> {
  return SESSION_MODES.map(mode => ({
    label: mode.label,
    value: mode.value
  }));
}

/**
 * Convert UI mode value to API mode format
 * Handles both underscore and hyphen formats for backward compatibility
 */
export function convertModeToApiFormat(uiMode: string | undefined): PostSessionsBodyMode {
  if (!uiMode) {
    return 'in_person'; // Default
  }

  // Normalize: convert hyphens to underscores and lowercase
  const normalized = uiMode.replace(/-/g, '_').toLowerCase();

  // Find matching mode
  const mode = SESSION_MODES.find(m => m.value === normalized);
  if (mode) {
    return mode.apiValue;
  }

  // Fallback to default
  console.warn(`Unknown session mode: "${uiMode}", defaulting to "in_person"`);
  return 'in_person';
}

/**
 * Convert API mode value to UI format
 */
export function convertModeFromApiFormat(apiMode: string | undefined): string {
  if (!apiMode) {
    return 'in_person'; // Default
  }

  const normalized = apiMode.toLowerCase();
  const mode = SESSION_MODES.find(m => m.apiValue === normalized);
  
  if (mode) {
    return mode.value;
  }

  // Fallback
  console.warn(`Unknown API mode: "${apiMode}", defaulting to "in_person"`);
  return 'in_person';
}

/**
 * Get human-readable label for a mode value
 */
export function getModeLabel(mode: string | undefined): string {
  if (!mode) {
    return 'N/A';
  }

  const normalized = mode.replace(/-/g, '_').toLowerCase();
  const modeOption = SESSION_MODES.find(m => m.value === normalized);
  
  return modeOption ? modeOption.label : 'N/A';
}

/**
 * Validate if a mode value is valid
 */
export function isValidMode(mode: string): boolean {
  if (!mode) {
    return false;
  }

  const normalized = mode.replace(/-/g, '_').toLowerCase();
  return SESSION_MODES.some(m => m.value === normalized);
}


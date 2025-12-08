/**
 * Session Mode Utility
 *
 * Centralized configuration for session modes across the API.
 * This ensures consistency in mode values, labels, and validation.
 */

/**
 * Available session modes
 */
export const SESSION_MODES = ['in_person', 'online', 'hybrid'] as const;

/**
 * Session mode type
 */
export type SessionMode = (typeof SESSION_MODES)[number];

/**
 * Validate if a mode value is valid
 */
export function isValidSessionMode(mode: string): mode is SessionMode {
  return SESSION_MODES.includes(mode as SessionMode);
}

/**
 * Get session mode enum for Zod schema
 */
export function getSessionModeEnum() {
  return SESSION_MODES;
}

/**
 * Get session mode enum for Mongoose schema
 */
export function getSessionModeValues(): string[] {
  return [...SESSION_MODES];
}

/**
 * Format mode for display (convert underscore to readable format)
 */
export function formatSessionMode(mode: SessionMode | string | undefined): string {
  if (!mode) return 'N/A';

  switch (mode) {
    case 'in_person':
      return 'In-person';
    case 'online':
      return 'Online';
    case 'hybrid':
      return 'Hybrid';
    default:
      return 'N/A';
  }
}

/**
 * Normalize mode input (handle different formats)
 */
export function normalizeSessionMode(mode: string | undefined): SessionMode | undefined {
  if (!mode) return undefined;

  const normalized = mode.toLowerCase().replace(/-/g, '_');

  if (isValidSessionMode(normalized)) {
    return normalized;
  }

  return undefined;
}

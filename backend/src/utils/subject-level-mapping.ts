/**
 * Subject and Level Mapping Utility
 * Provides standardized subject codes and level options for the application
 */

export interface SubjectOption {
  label: string;
  value: string;
  code: string;
}

export interface LevelOption {
  label: string;
  value: string;
}

/**
 * Map of subject keys to their display codes
 */
export const SUBJECT_CODE_MAP: { [key: string]: string } = {
  english: 'ENG',
  french: 'FRA',
  spanish: 'ESP',
  italian: 'ITA',
  italy: 'ITA', // Alternative spelling
  german: 'DEU',
  portuguese: 'POR',
  russian: 'RUS',
  arabic: 'ARAB',
  chinese: 'CHI',
  japanese: 'JAP',
};

/**
 * List of all available subjects with their codes
 */
export const SUBJECT_OPTIONS: SubjectOption[] = [
  { label: 'ENG', value: 'english', code: 'ENG' },
  { label: 'FRA', value: 'french', code: 'FRA' },
  { label: 'ESP', value: 'spanish', code: 'ESP' },
  { label: 'ITA', value: 'italian', code: 'ITA' },
  { label: 'DEU', value: 'german', code: 'DEU' },
  { label: 'POR', value: 'portuguese', code: 'POR' },
  { label: 'RUS', value: 'russian', code: 'RUS' },
  { label: 'ARAB', value: 'arabic', code: 'ARAB' },
  { label: 'CHI', value: 'chinese', code: 'CHI' },
  { label: 'JAP', value: 'japanese', code: 'JAP' },
];

/**
 * Get all subject values for random selection
 */
export const getSubjectValues = (): string[] => {
  return SUBJECT_OPTIONS.map((s) => s.value);
};

/**
 * Maps a subject value to its display code
 * @param subject - The subject value (e.g., 'english', 'french')
 * @returns The subject code (e.g., 'ENG', 'FRA')
 */
export function mapSubjectToCode(subject: string): string {
  if (!subject) {
    return '';
  }

  const normalizedSubject = subject.toLowerCase().trim();
  return SUBJECT_CODE_MAP[normalizedSubject] || subject.toUpperCase();
}

/**
 * Maps a subject code to its full value
 * @param code - The subject code (e.g., 'ENG', 'FRA')
 * @returns The subject value (e.g., 'english', 'french')
 */
export function mapCodeToSubject(code: string): string {
  if (!code) {
    return '';
  }

  const normalizedCode = code.toUpperCase().trim();
  const entry = Object.entries(SUBJECT_CODE_MAP).find(([_, subjectCode]) => subjectCode === normalizedCode);

  return entry ? entry[0] : code.toLowerCase();
}

// ========================================
// LEVEL MAPPING
// ========================================

/**
 * List of all available levels
 */
export const LEVEL_OPTIONS: LevelOption[] = [
  { label: 'Pre-Junior', value: 'pre-junior' },
  { label: 'A Junior', value: 'a-junior' },
  { label: 'B Junior', value: 'b-junior' },
  { label: 'A+B Junior', value: 'a-b-junior' },
  { label: 'A Senior', value: 'a-senior' },
  { label: 'B Senior', value: 'b-senior' },
  { label: 'C Senior', value: 'c-senior' },
  { label: 'D Senior', value: 'd-senior' },
  { label: 'Pre-Lower', value: 'pre-lower' },
  { label: 'Lower', value: 'lower' },
  { label: 'Advanced', value: 'advanced' },
  { label: 'Proficiency', value: 'proficiency' },
  { label: 'Advanced+Proficiency', value: 'advanced-proficiency' },
  { label: 'Adults', value: 'adults' },
  { label: 'Panhellenic Examinations', value: 'panhellenic-examinations' },
  { label: 'English for Specific Purposes', value: 'english-for-specific-purposes' },
  { label: 'Not Specified / Other', value: 'not-specified-other' },
];

/**
 * Map of level values to their display labels
 */
export const LEVEL_LABEL_MAP: { [key: string]: string } = {
  'pre-junior': 'Pre-Junior',
  'a-junior': 'A Junior',
  'b-junior': 'B Junior',
  'a-b-junior': 'A+B Junior',
  'a-senior': 'A Senior',
  'b-senior': 'B Senior',
  'c-senior': 'C Senior',
  'd-senior': 'D Senior',
  'pre-lower': 'Pre-Lower',
  lower: 'Lower',
  advanced: 'Advanced',
  proficiency: 'Proficiency',
  'advanced-proficiency': 'Advanced+Proficiency',
  adults: 'Adults',
  'panhellenic-examinations': 'Panhellenic Examinations',
  'english-for-specific-purposes': 'English for Specific Purposes',
  'not-specified-other': 'Not Specified / Other',
};

/**
 * Get all level values for random selection
 */
export const getLevelValues = (): string[] => {
  return LEVEL_OPTIONS.map((l) => l.value);
};

/**
 * Maps a level value to its display label
 * @param level - The level value (e.g., 'pre-junior', 'a-senior')
 * @returns The level label (e.g., 'Pre-Junior', 'A Senior')
 */
export function mapLevelToLabel(level: string): string {
  if (!level) {
    return '';
  }

  const normalizedLevel = level.toLowerCase().trim();
  return LEVEL_LABEL_MAP[normalizedLevel] || level;
}

/**
 * Maps a level label to its value
 * @param label - The level label (e.g., 'Pre-Junior', 'A Senior')
 * @returns The level value (e.g., 'pre-junior', 'a-senior')
 */
export function mapLabelToLevel(label: string): string {
  if (!label) {
    return '';
  }

  const normalizedLabel = label.trim();
  const entry = Object.entries(LEVEL_LABEL_MAP).find(
    ([_, levelLabel]) => levelLabel.toLowerCase() === normalizedLabel.toLowerCase()
  );

  return entry ? entry[0] : label.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Validates if a subject value is valid
 * @param subject - The subject value to validate
 * @returns True if valid, false otherwise
 */
export function isValidSubject(subject: string): boolean {
  if (!subject) {
    return false;
  }

  const normalizedSubject = subject.toLowerCase().trim();
  return normalizedSubject in SUBJECT_CODE_MAP;
}

/**
 * Validates if a level value is valid
 * @param level - The level value to validate
 * @returns True if valid, false otherwise
 */
export function isValidLevel(level: string): boolean {
  if (!level) {
    return false;
  }

  const normalizedLevel = level.toLowerCase().trim();
  return normalizedLevel in LEVEL_LABEL_MAP;
}

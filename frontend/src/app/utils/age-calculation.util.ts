/**
 * Utility function to calculate age from a birthdate
 * @param birthdate - The birthdate as a Date object, string, or undefined
 * @returns The age in years, or 0 if birthdate is invalid or not provided
 */
export function calculateAge(birthdate?: string | Date): number {
  if (!birthdate) {
    return 0; // If no birthdate, return 0 (assumes not a minor)
  }

  const dob = new Date(birthdate);
  if (isNaN(dob.getTime())) {
    return 0; // Invalid date, return 0 (assumes not a minor)
  }

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();

  // Adjust age if birthday hasn't occurred this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

/**
 * Check if a person is a minor (under 18 years old)
 * @param birthdate - The birthdate as a Date object, string, or undefined
 * @returns true if the person is under 18, false otherwise
 */
export function isMinor(birthdate?: string | Date): boolean {
  return calculateAge(birthdate) < 18;
}


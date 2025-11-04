import { DayOfWeek } from './session.interface';

/**
 * Utility class for generating recurring sessions based on day, frequency, and date range
 */
export class SessionGenerator {
  private static readonly DAYS_OF_WEEK: Record<DayOfWeek, number> = {
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
    sunday: 0,
  };

  /**
   * Generate session dates based on the specified parameters
   * @param day - Day of the week
   * @param startDate - Start date for the recurring sessions
   * @param endDate - End date for the recurring sessions
   * @param frequency - Frequency in weeks (1 = every week, 2 = every 2 weeks, etc.)
   * @returns Array of Date objects representing the session dates
   */
  static generateSessionDates(day: DayOfWeek, startDate: Date, endDate: Date, frequency: number): Date[] {
    const sessionDates: Date[] = [];
    const targetDayOfWeek = this.DAYS_OF_WEEK[day];

    // Find the first occurrence of the target day on or after the start date
    const firstSessionDate = this.findFirstOccurrence(startDate, targetDayOfWeek);

    if (firstSessionDate > endDate) {
      return sessionDates; // No sessions possible within the date range
    }

    // Generate all session dates
    let currentDate = new Date(firstSessionDate);
    while (currentDate <= endDate) {
      sessionDates.push(new Date(currentDate));
      currentDate = this.addWeeks(currentDate, frequency);
    }

    return sessionDates;
  }

  /**
   * Create a session date with specific time
   * @param date - Base date
   * @param time - Time in HH:MM format
   * @param duration - Duration in hours
   * @returns Object with start and end dates
   */
  static createSessionDateTime(date: Date, time: string, duration: number): { startDate: Date; endDate: Date } {
    const [hours, minutes] = time.split(':').map(Number);

    const startDate = new Date(date);
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + duration);

    return { startDate, endDate };
  }

  /**
   * Find the first occurrence of a specific day of the week on or after a given date
   * @param startDate - The date to start searching from
   * @param targetDayOfWeek - The target day of the week (0 = Sunday, 1 = Monday, etc.)
   * @returns The first occurrence of the target day
   */
  private static findFirstOccurrence(startDate: Date, targetDayOfWeek: number): Date {
    const currentDate = new Date(startDate);
    const currentDayOfWeek = currentDate.getDay();

    // Calculate days to add to reach the target day
    let daysToAdd = targetDayOfWeek - currentDayOfWeek;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    currentDate.setDate(currentDate.getDate() + daysToAdd);
    return currentDate;
  }

  /**
   * Add a specified number of weeks to a date
   * @param date - The base date
   * @param weeks - Number of weeks to add
   * @returns New date with weeks added
   */
  private static addWeeks(date: Date, weeks: number): Date {
    const newDate = new Date(date);
    newDate.setDate(newDate.getDate() + weeks * 7);
    return newDate;
  }

  /**
   * Validate that the session parameters are valid
   * @param day - Day of the week
   * @param startDate - Start date
   * @param endDate - End date
   * @param frequency - Frequency in weeks
   * @returns Validation result with success flag and error message
   */
  static validateSessionParameters(
    day: DayOfWeek,
    startDate: Date,
    endDate: Date,
    frequency: number
  ): { isValid: boolean; error?: string } {
    if (startDate >= endDate) {
      return { isValid: false, error: 'Start date must be before end date' };
    }

    if (frequency < 1 || frequency > 52) {
      return { isValid: false, error: 'Frequency must be between 1 and 52 weeks' };
    }

    if (!Object.keys(this.DAYS_OF_WEEK).includes(day)) {
      return { isValid: false, error: 'Invalid day of the week' };
    }

    return { isValid: true };
  }

  /**
   * Calculate the number of sessions that will be generated
   * @param day - Day of the week
   * @param startDate - Start date
   * @param endDate - End date
   * @param frequency - Frequency in weeks
   * @returns Number of sessions that will be generated
   */
  static calculateSessionCount(day: DayOfWeek, startDate: Date, endDate: Date, frequency: number): number {
    const sessionDates = this.generateSessionDates(day, startDate, endDate, frequency);
    return sessionDates.length;
  }

  /**
   * Get a preview of the first few session dates
   * @param day - Day of the week
   * @param startDate - Start date
   * @param endDate - End date
   * @param frequency - Frequency in weeks
   * @param maxPreview - Maximum number of dates to preview (default: 5)
   * @returns Array of preview dates
   */
  static getSessionPreview(
    day: DayOfWeek,
    startDate: Date,
    endDate: Date,
    frequency: number,
    maxPreview: number = 5
  ): Date[] {
    const sessionDates = this.generateSessionDates(day, startDate, endDate, frequency);
    return sessionDates.slice(0, maxPreview);
  }
}

// {
//   "start_date": "2025-01-15T00:00:00.000Z",
//   "end_date": "2025-01-31T23:59:59.000Z",
//   "taxi": "68c2b3a661a07728733e91a1",
//   "classroom": "689b2bd26e19a8321d0887d4",
//   "students": [],
//   "teachers": [],
//   "academic_period": "68793052609498aa94fa8d55",
//   "academic_subperiod": "",
//   "is_recurring": true,
//   "room": "Room 101 - Main Hall",
//   "color": "#3B82F6",
//   "notes": "Weekly advanced mathematics sessions for grade 12 students. Please bring calculators and notebooks.",
//   "invite_participants": true,
//   "mode": "in_person",
//   "day": "monday",
//   "start_time": "18:25",
//   "duration": 2.5,
//   "frequency": 1
// }

// {
//   "start_date": "2025-09-11T11:46:52.398Z",
//   "end_date": "2025-09-11T11:48:52.398Z",
//   "taxi": "68c2b3a661a07728733e91a1",
//   "classroom": "68793052609498aa94fa8d83",
//   "students": [],
//   "teachers": [],
//   "academic_period": "689b27a86e19a8321d0872cf",
//   "is_recurring": true,
//   "room": "512",
//   "color": "#ed0073",
//   "notes": "Adeo ocer aliquam cupiditate.",
//   "invite_participants": true,
//   "mode": "online",
//   "day": "monday",
//   "duration": 0.5,
//   "frequency": 1
// }

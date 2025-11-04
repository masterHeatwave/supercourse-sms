import { DayOfWeek } from './session.interface';

export interface RecurringSessionInstance {
  start_date: Date;
  end_date: Date;
  instance_number: number;
  original_session_id?: string;
}

export interface RecurringValidationResult {
  isValid: boolean;
  error?: string;
  estimatedInstances?: number;
}

/**
 * Utility class for handling recurring session logic in the service layer
 */
export class RecurringSessionUtil {
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
   * Validate recurring session parameters
   */
  static validateRecurringSession(
    day: DayOfWeek,
    startDate: Date,
    endDate: Date,
    frequency: number,
    startTime: string,
    duration: number
  ): RecurringValidationResult {
    try {
      // Basic validations
      if (startDate >= endDate) {
        return { isValid: false, error: 'Start date must precede or equal end date' };
      }

      if (frequency < 1 || frequency > 52) {
        return { isValid: false, error: 'Frequency must be between 1 and 52 weeks' };
      }

      if (duration < 0.5 || duration > 24) {
        return { isValid: false, error: 'Duration must be between 0.5 and 24 hours' };
      }

      if (!this.DAYS_OF_WEEK.hasOwnProperty(day)) {
        return { isValid: false, error: 'Invalid day of the week' };
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(startTime)) {
        return { isValid: false, error: 'Please provide a valid time format (HH:MM)' };
      }

      // Handle same-day scenarios first (most restrictive case)
      if (startDate.toDateString() === endDate.toDateString()) {
        const dayOfWeek = startDate.getDay();
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const expectedDay = dayNames[dayOfWeek];

        if (day !== expectedDay) {
          return {
            isValid: false,
            error: 'No valid sessions can be generated; selected day does not match the date range',
          };
        }
        if (frequency !== 1) {
          return { isValid: false, error: 'For same-day ranges, frequency must be 1' };
        }
        return { isValid: true, estimatedInstances: 1 };
      }

      // Validate date range is sufficient for frequency
      const dateRangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const minimumDaysRequired = (frequency - 1) * 7 + 1; // For frequency N, need at least (N-1)*7+1 days

      if (dateRangeDays < minimumDaysRequired) {
        return {
          isValid: false,
          error: `Frequency ${frequency} requires at least ${minimumDaysRequired} days; range is only ${dateRangeDays} day(s).`,
        };
      }

      // Find first occurrence and validate
      const firstOccurrence = this.findFirstOccurrence(startDate, this.DAYS_OF_WEEK[day]);
      if (firstOccurrence > endDate) {
        return {
          isValid: false,
          error: 'No valid sessions can be generated; selected day does not match the date range',
        };
      }

      // Calculate estimated instances more efficiently
      const weeksBetween = Math.floor((endDate.getTime() - firstOccurrence.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const estimatedInstances = Math.floor(weeksBetween / frequency) + 1;

      // Validate that we can generate at least one session
      if (estimatedInstances < 1) {
        return { isValid: false, error: 'No valid sessions can be generated with the given parameters' };
      }

      return { isValid: true, estimatedInstances };
    } catch (error: any) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Generate session instances for a recurring session
   */
  static generateSessionInstances(
    day: DayOfWeek,
    startDate: Date,
    endDate: Date,
    frequency: number,
    startTime: string,
    duration: number,
    sessionId?: string
  ): RecurringSessionInstance[] {
    const instances: RecurringSessionInstance[] = [];
    const targetDayIndex = this.DAYS_OF_WEEK[day];

    // Find first occurrence
    let currentDate = this.findFirstOccurrence(startDate, targetDayIndex);
    let instanceNumber = 1;

    // Pre-calculate time components for efficiency
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMs = duration * 60 * 60 * 1000;
    const frequencyMs = frequency * 7 * 24 * 60 * 60 * 1000; // frequency weeks in milliseconds

    while (currentDate <= endDate) {
      // Create session start time
      const sessionStart = new Date(currentDate);
      sessionStart.setHours(hours, minutes, 0, 0);

      // Create session end time
      const sessionEnd = new Date(sessionStart.getTime() + durationMs);

      instances.push({
        start_date: sessionStart,
        end_date: sessionEnd,
        instance_number: instanceNumber,
        original_session_id: sessionId,
      });

      instanceNumber++;

      // Move to next occurrence (frequency weeks later) - more efficient with milliseconds
      currentDate = new Date(currentDate.getTime() + frequencyMs);
    }

    return instances;
  }

  /**
   * Get session instances within a specific date range
   */
  static getInstancesInRange(
    day: DayOfWeek,
    originalStartDate: Date,
    originalEndDate: Date,
    frequency: number,
    startTime: string,
    duration: number,
    rangeStart: Date,
    rangeEnd: Date,
    sessionId?: string
  ): RecurringSessionInstance[] {
    // Optimize: only generate instances within the requested range
    const targetDayIndex = this.DAYS_OF_WEEK[day];
    const instances: RecurringSessionInstance[] = [];

    // Find first occurrence within or after the range start
    let currentDate = this.findFirstOccurrence(
      rangeStart > originalStartDate ? rangeStart : originalStartDate,
      targetDayIndex
    );

    // If first occurrence is before range start, move to next occurrence
    if (currentDate < rangeStart) {
      const frequencyMs = frequency * 7 * 24 * 60 * 60 * 1000;
      currentDate = new Date(currentDate.getTime() + frequencyMs);
    }

    let instanceNumber = 1;
    const [hours, minutes] = startTime.split(':').map(Number);
    const durationMs = duration * 60 * 60 * 1000;
    const frequencyMs = frequency * 7 * 24 * 60 * 60 * 1000;

    // Generate instances only within the requested range
    while (currentDate <= rangeEnd && currentDate <= originalEndDate) {
      const sessionStart = new Date(currentDate);
      sessionStart.setHours(hours, minutes, 0, 0);

      const sessionEnd = new Date(sessionStart.getTime() + durationMs);

      instances.push({
        start_date: sessionStart,
        end_date: sessionEnd,
        instance_number: instanceNumber,
        original_session_id: sessionId,
      });

      instanceNumber++;
      currentDate = new Date(currentDate.getTime() + frequencyMs);
    }

    return instances;
  }

  /**
   * Check if a recurring session is active on a specific date
   */
  static isActiveOnDate(day: DayOfWeek, startDate: Date, endDate: Date, frequency: number, targetDate: Date): boolean {
    // Quick bounds check
    if (targetDate < startDate || targetDate > endDate) {
      return false;
    }

    const targetDayIndex = this.DAYS_OF_WEEK[day];
    const targetDayOfWeek = targetDate.getDay();

    // Must be the correct day of week
    if (targetDayOfWeek !== targetDayIndex) {
      return false;
    }

    // Find first occurrence
    const firstOccurrence = this.findFirstOccurrence(startDate, targetDayIndex);

    // Calculate weeks since first occurrence (more efficient with milliseconds)
    const weeksSinceFirst = Math.floor((targetDate.getTime() - firstOccurrence.getTime()) / (1000 * 60 * 60 * 24 * 7));

    // Check if this week aligns with the frequency
    return weeksSinceFirst >= 0 && weeksSinceFirst % frequency === 0;
  }

  /**
   * Find the first occurrence of a specific day of the week on or after a given date
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
}

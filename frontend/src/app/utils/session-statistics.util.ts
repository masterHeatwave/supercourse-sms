export interface SessionData {
  id: string;
  start_date: string;
  end_date: string;
  start_time?: string;
  duration?: number;
  is_cancelled?: boolean;
  taxi?: any;
  mode?: string;
  absences?: any[];
  classroom?: any;
  teachers?: any[];
  students?: any[];
}

export interface WeekTimetableEntry {
  day: string;
  startTime: string;
  endTime: string;
}

export interface SessionStatistics {
  totalSessionDuration: number;
  sessionsPerWeek: number;
  averageSessionDuration: number;
  totalHoursPerWeek: number;
  weekTimetable: WeekTimetableEntry[];
}

export class SessionStatisticsUtil {
  /**
   * Calculate session duration in minutes between start and end times
   */
  static calculateSessionDuration(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // Duration in minutes
  }

  /**
   * Format duration from minutes to readable format (e.g., "1h 30m")
   */
  static formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
    return `${mins}m`;
  }

  /**
   * Calculate total duration of all sessions combined
   */
  static calculateTotalSessionDuration(sessions: SessionData[]): number {
    if (!sessions || sessions.length === 0) return 0;

    const totalDuration = sessions.reduce((sum, session) => {
      return sum + this.calculateSessionDuration(session.start_date, session.end_date);
    }, 0);

    return totalDuration;
  }

  /**
   * Calculate sessions per week based on session data
   */
  static calculateSessionsPerWeek(sessions: SessionData[]): number {
    if (!sessions || sessions.length === 0) return 0;

    // Count sessions per day of the week
    const sessionsPerDay = new Map<number, number>();
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_date);
      const dayOfWeek = sessionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      sessionsPerDay.set(dayOfWeek, (sessionsPerDay.get(dayOfWeek) || 0) + 1);
    });

    // Calculate average sessions per week
    // If we have recurring sessions, we need to determine the pattern
    if (sessions.length === 0) return 0;
    
    // Simple approach: assume sessions represent a weekly pattern
    // Take the total count and divide by the number of unique weeks represented
    const totalSessions = sessions.length;
    const firstSessionDate = new Date(sessions[0].start_date);
    const lastSessionDate = new Date(sessions[sessions.length - 1].start_date);
    
    // Calculate number of weeks between first and last session
    const weeksDifference = Math.max(1, Math.ceil((lastSessionDate.getTime() - firstSessionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)));
    
    return Math.round(totalSessions / weeksDifference);
  }

  /**
   * Generate week timetable showing days and times when sessions occur
   */
  static generateWeekTimetable(sessions: SessionData[]): WeekTimetableEntry[] {
    if (!sessions || sessions.length === 0) return [];

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daySchedule = new Map<number, { startTime: string; endTime: string }>();

    // Group sessions by day of week and find typical start/end times
    sessions.forEach(session => {
      const sessionDate = new Date(session.start_date);
      const dayOfWeek = sessionDate.getDay();
      const startTime = sessionDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const endTime = new Date(session.end_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // For simplicity, use the first occurrence of each day
      if (!daySchedule.has(dayOfWeek)) {
        daySchedule.set(dayOfWeek, { startTime, endTime });
      }
    });

    // Convert to array format
    return Array.from(daySchedule.entries())
      .sort(([dayA], [dayB]) => dayA - dayB)
      .map(([dayIndex, times]) => ({
        day: dayNames[dayIndex],
        startTime: times.startTime,
        endTime: times.endTime
      }));
  }

  /**
   * Calculate all session statistics at once
   */
  static calculateAllStatistics(sessions: SessionData[]): SessionStatistics {
    const totalSessionDuration = this.calculateTotalSessionDuration(sessions);
    const sessionsPerWeek = this.calculateSessionsPerWeek(sessions);
    const averageSessionDuration = sessions.length > 0 ? totalSessionDuration / sessions.length : 0;
    const totalHoursPerWeek = (sessionsPerWeek * averageSessionDuration) / 60;
    const weekTimetable = this.generateWeekTimetable(sessions);

    return {
      totalSessionDuration,
      sessionsPerWeek,
      averageSessionDuration,
      totalHoursPerWeek,
      weekTimetable
    };
  }
} 
/**
 * Utility function to calculate session status based on Athens timezone
 * @param startDate - Session start date (ISO string or Date)
 * @param endDate - Session end date (ISO string or Date)
 * @param startTime - Session start time in HH:MM format (optional, for recurring sessions)
 * @param duration - Session duration in hours (optional, for recurring sessions)
 * @returns 'Live' | 'Scheduled' | 'Completed' | 'Cancelled'
 */
export function calculateSessionStatus(
  startDate: string | Date,
  endDate: string | Date,
  startTime?: string,
  duration?: number,
  isCancelled?: boolean
): 'Live' | 'Scheduled' | 'Completed' | 'Cancelled' {
  // Check if session is cancelled first
  if (isCancelled === true) {
    return 'Cancelled';
  }

  // Get current time in Athens timezone
  const currentDate = new Date();
  const athensTime = new Date(currentDate.toLocaleString("en-US", { timeZone: "Europe/Athens" }));
  const athensOffset = currentDate.getTime() - athensTime.getTime();
  const currentDateAthens = new Date(currentDate.getTime() + athensOffset);

  // If we have startTime and duration (for recurring sessions), calculate exact times
  if (startTime && duration) {
    const [hours, minutes] = startTime.split(':').map(Number);
    
    // Create session start time in Athens timezone
    const sessionDate = new Date(startDate);
    const sessionStartAthens = new Date(sessionDate);
    sessionStartAthens.setHours(hours, minutes, 0, 0);
    
    // Create session end time in Athens timezone
    const sessionEndAthens = new Date(sessionStartAthens.getTime() + (duration * 60 * 60 * 1000));
    
    // Check if current Athens time is between start and end Athens times
    if (currentDateAthens >= sessionStartAthens && currentDateAthens <= sessionEndAthens) {
      return 'Live';
    } else if (currentDateAthens < sessionStartAthens) {
      return 'Scheduled';
    } else {
      return 'Completed';
    }
  }

  // For non-recurring sessions, use the provided start and end dates directly
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (currentDateAthens < start) {
    return 'Scheduled';
  } else if (currentDateAthens >= start && currentDateAthens <= end) {
    return 'Live';
  } else {
    return 'Completed';
  }
}

/**
 * Get status severity for PrimeNG tags
 * @param status - Session status
 * @returns PrimeNG severity level
 */
export function getSessionStatusSeverity(status: 'Live' | 'Scheduled' | 'Completed' | 'Cancelled'): string {
  switch (status) {
    case 'Scheduled':
      return 'info';
    case 'Live':
      return 'success';
    case 'Completed':
      return 'success';
    case 'Cancelled':
      return 'danger';
    default:
      return 'warning';
  }
}

/**
 * Get translated status label
 * @param status - Session status
 * @param translateService - Angular translate service
 * @returns Translated status label
 */
export function getSessionStatusLabel(
  status: 'Live' | 'Scheduled' | 'Completed' | 'Cancelled',
  translateService: any
): string {
  const map: Record<string, string> = {
    Scheduled: 'sessions.status.scheduled',
    Live: 'sessions.status.live',
    Completed: 'sessions.status.completed',
    Cancelled: 'sessions.status.cancelled'
  };
  const key = map[status] || 'common.unknown';
  return translateService.instant(key);
}

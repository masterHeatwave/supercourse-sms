import { ErrorResponse } from '@utils/errorResponse';
import { IDashboardData } from './dashboard.interface';
import customerModel from '@components/customers/customer.model';
import User from '@components/users/user.model';
import { IUserType } from '@components/users/user.interface';
import Taxi from '@components/taxi/taxi.model';
import Session from '@components/sessions/session.model';
import SessionRecurring from '@components/sessions/session-recurring.model';
import { ActivityService } from '@components/activity/activity.service';

export class DashboardService {
  private activityService: ActivityService;

  constructor() {
    this.activityService = new ActivityService();
  }

  async getDashboardData(customer_id: string): Promise<IDashboardData | null> {
    // Find the customer with administrator and manager populated
    const customer = await customerModel.findById(customer_id).populate([
      { path: 'administrator', model: User },
      { path: 'manager', model: User },
    ]);

    if (!customer) {
      throw new ErrorResponse('Customer not found', 404);
    }

    // Get the current date in Athens timezone and week number
    const currentDate = new Date();

    // Convert to Athens timezone (UTC+2 or UTC+3)
    const athensTime = new Date(currentDate.toLocaleString('en-US', { timeZone: 'Europe/Athens' }));
    const athensOffset = currentDate.getTime() - athensTime.getTime();
    const currentDateAthens = new Date(currentDate.getTime() + athensOffset);

    const firstDayOfYear = new Date(currentDateAthens.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDateAthens.getTime() - firstDayOfYear.getTime()) / 86400000;
    const currentWeek = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);

    // Count students in this branch (users with type STUDENT that have this branch in their branches array)
    const studentsCount = await User.countDocuments({
      user_type: IUserType.STUDENT,
      branches: customer_id,
    });

    // Count staff members in this branch (includes teachers, managers, parents)
    const staffCount = await User.countDocuments({
      user_type: {
        $in: [IUserType.TEACHER, IUserType.MANAGER, IUserType.PARENT],
      },
      branches: customer_id,
    });

    // Count classes (taxis) in this branch
    const taxisCount = await Taxi.countDocuments({
      branch: customer_id,
    });

    // Get all taxis in this branch to find their sessions
    const branchTaxis = await Taxi.find({ branch: customer_id }).select('_id');
    const taxiIds = branchTaxis.map((taxi) => taxi._id);

    // Find parent sessions for this branch (recurring sessions)
    const parentSessions = await Session.find({
      taxi: { $in: taxiIds },
      is_recurring: true,
    }).select('_id');

    const parentSessionIds = parentSessions.map((session) => session._id);

    // Find all recurring session instances for this branch
    const allRecurringSessions = await SessionRecurring.find({
      parent_session: { $in: parentSessionIds },
    })
      .populate('taxi', 'name code')
      .populate('classroom', 'name')
      .populate('parent_session', 'day start_time duration')
      .select('start_date end_date taxi classroom parent_session day start_time duration');

    // Filter sessions that are actually ongoing based on Athens timezone
    const ongoingSessionsList = allRecurringSessions.filter((session) => {
      if (!session.start_time || !session.duration) return false;

      // Calculate session times in Athens timezone
      const [hours, minutes] = session.start_time.split(':').map(Number);

      // Create session start time in Athens timezone
      const sessionDate = new Date(session.start_date);
      const sessionStartAthens = new Date(sessionDate);
      sessionStartAthens.setHours(hours, minutes, 0, 0);

      // Create session end time in Athens timezone
      const sessionEndAthens = new Date(sessionStartAthens.getTime() + session.duration * 60 * 60 * 1000);
      // Check if current Athens time is between start and end Athens times
      return currentDateAthens >= sessionStartAthens && currentDateAthens <= sessionEndAthens;
    });
    // Log each session with time comparison
    ongoingSessionsList.forEach((session, index) => {
      // Calculate expected end time based on start_time + duration
      if (session.start_time && session.duration) {
        const [hours, minutes] = session.start_time.split(':').map(Number);
        const startMinutes = hours * 60 + minutes;
        const endMinutes = startMinutes + session.duration * 60;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const expectedEndTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;

        // Calculate corrected times using UTC
        const sessionStart = new Date(session.start_date);
        sessionStart.setUTCHours(hours, minutes, 0, 0);
      }
      // Show the actual time difference
      const timeUntilEnd = session.end_date.getTime() - currentDate.getTime();
      const minutesUntilEnd = Math.round(timeUntilEnd / (1000 * 60));
    });
    const ongoingSessions = ongoingSessionsList.length;

    // Get recent activities for the dashboard
    const recentActivities = await this.activityService.getDashboardActivities(10);

    const data: IDashboardData = {
      customer,
      date: currentDate,
      currentWeek,
      students_count: studentsCount,
      staff_count: staffCount,
      taxis_count: taxisCount,
      ongoing_sessions: ongoingSessions,
      recent_activities: recentActivities,
    };

    return data;
  }
}

import { ErrorResponse } from '@utils/errorResponse';
import { IDashboardData } from './dashboard.interface';
import customerModel from '@components/customers/customer.model';
import User from '@components/users/user.model';
import { IUserType } from '@components/users/user.interface';
import Taxi from '@components/taxi/taxi.model';
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

    // Get the current date and week number
    const currentDate = new Date();
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);
    const pastDaysOfYear = (currentDate.getTime() - firstDayOfYear.getTime()) / 86400000;
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

    // For ongoing sessions, just return a random number between 1 and 10 for now
    const ongoingSessions = Math.floor(Math.random() * 10) + 1;

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

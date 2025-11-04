import { ICustomer } from '@components/customers/customer.interface';
import { IActivity } from '@components/activity/activity.interface';

export interface IDashboardData {
  customer: ICustomer;
  date: Date;
  currentWeek: number;
  students_count: number;
  staff_count: number;
  taxis_count: number;
  ongoing_sessions: number;
  recent_activities: IActivity[];
}

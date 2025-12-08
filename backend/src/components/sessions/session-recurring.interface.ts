import { Document, Types } from 'mongoose';
import { ISession } from './session.interface';
import { ITaxi } from '@components/taxi/taxi.interface';
import { IClassroom } from '@components/classrooms/classroom.interface';
import { IUser } from '@components/users/user.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';
import { IAcademicSubperiod } from '@components/academic/academic-subperiods.interface';

/**
 * Interface for recurring session instances
 * These are the individual occurrences of a recurring session
 */
export interface ISessionRecurring extends Document {
  parent_session: ISession | Types.ObjectId | string; // Reference to the main session
  start_date: Date;
  end_date: Date;
  instance_number: number;

  // All fields from parent session
  taxi: ITaxi | Types.ObjectId | string;
  classroom?: IClassroom | Types.ObjectId | string; // Optional - can be used with any mode
  students: (IUser | Types.ObjectId | string)[];
  teachers: (IUser | Types.ObjectId | string)[];
  academic_period: IAcademicPeriod | Types.ObjectId | string;
  academic_subperiod?: IAcademicSubperiod | Types.ObjectId | string;
  room?: string;
  color?: string;
  notes?: string;
  invite_participants?: boolean;
  mode?: 'in_person' | 'online' | 'hybrid';

  // Recurring session fields (inherited from parent)
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time?: string; // Format: "HH:MM"
  duration?: number; // Duration in hours
  frequency?: number; // Frequency in weeks
}

export interface ISessionRecurringCreateDTO {
  parent_session: string;
  start_date: Date;
  end_date: Date;
  instance_number: number;
  taxi: string;
  classroom?: string; // Optional - can be used with any mode (online, hybrid, in_person)
  students?: string[];
  teachers?: string[];
  academic_period: string;
  academic_subperiod?: string;
  room?: string;
  color?: string;
  notes?: string;
  invite_participants?: boolean;
  mode?: 'in_person' | 'online' | 'hybrid';
  day?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  start_time?: string;
  duration?: number;
  frequency?: number;
}

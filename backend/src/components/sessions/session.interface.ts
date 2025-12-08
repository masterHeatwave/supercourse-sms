import { Document } from 'mongoose';
import { ITaxi } from '@components/taxi/taxi.interface';
import { IClassroom } from '@components/classrooms/classroom.interface';
import { IUser } from '@components/users/user.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';
import { IAcademicSubperiod } from '@components/academic/academic-subperiods.interface';
import { IAbsence } from '@components/absences/absence.interface';

export type SessionMode = 'in_person' | 'online' | 'hybrid';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ISession extends Document {
  start_date: Date;
  end_date: Date;
  taxi: ITaxi | string;
  classroom?: IClassroom | string; // Optional - can be used with any mode
  students: IUser[] | string[];
  teachers: IUser[] | string[];
  academic_period: IAcademicPeriod | string;
  academic_subperiod?: IAcademicSubperiod | string;
  is_recurring: boolean;
  room?: string;
  color?: string;
  notes?: string;
  invite_participants?: boolean;
  mode?: SessionMode;
  absences?: IAbsence[] | string[]; // Virtual field for absences

  // Recurring session fields - only present when is_recurring = true
  day?: DayOfWeek;
  start_time?: string; // Format: "HH:MM"
  duration?: number; // Duration in hours
  frequency?: number; // Frequency in weeks (1 = every week, 2 = every 2 weeks, etc.)

  // Virtual fields
  session_duration?: number;
  total_duration?: number;
  sessions_per_week?: number;
  total_hours_per_week?: number;
  estimated_instances?: number;
  overlap_risk?: string[];
}

export interface ISessionCreateDTO {
  start_date: Date;
  end_date: Date;
  taxi: string;
  classroom?: string; // Optional - can be used with any mode (online, hybrid, in_person)
  students?: string[];
  teachers?: string[];
  academic_period: string;
  academic_subperiod?: string;
  is_recurring?: boolean;
  room?: string;
  color?: string;
  notes?: string;
  invite_participants?: boolean;
  mode?: SessionMode;

  // Recurring session fields
  day?: DayOfWeek;
  start_time?: string; // Format: "HH:MM"
  duration?: number; // Duration in hours
  frequency?: number; // Frequency in weeks (1 = every week, 2 = every 2 weeks, etc.)
}

export interface IBulkSessionCreateDTO {
  sessions: ISessionCreateDTO[];
  allowOverlap?: boolean;
}

export interface ISessionInstance {
  start_date: Date;
  end_date: Date;
  instance_number: number;
}

export interface IOverlapValidationResult {
  hasOverlap: boolean;
  conflicts: IOverlapConflict[];
  warnings?: string[];
}

export interface IOverlapConflict {
  sessionIndex?: number;
  existingSessionId?: string;
  conflictType: 'taxi' | 'classroom' | 'students' | 'teachers';
  overlappingResource: string;
  conflictTime: {
    start: Date;
    end: Date;
  };
  message: string;
}

export interface ISessionUpdateDTO {
  id: string;
  start_date?: Date;
  end_date?: Date;
  taxi?: string;
  classroom?: string;
  students?: string[];
  teachers?: string[];
  academic_period?: string;
  academic_subperiod?: string;
  is_recurring?: boolean;
  room?: string;
  color?: string;
  notes?: string;
  invite_participants?: boolean;
  mode?: SessionMode;

  // Recurring session fields
  day?: DayOfWeek;
  start_time?: string; // Format: "HH:MM"
  duration?: number; // Duration in hours
  frequency?: number; // Frequency in weeks (1 = every week, 2 = every 2 weeks, etc.)
}

export interface IBulkSessionUpdateDTO {
  sessions: ISessionUpdateDTO[];
  allowOverlap?: boolean;
}

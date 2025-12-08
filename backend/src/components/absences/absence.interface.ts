import { Document } from 'mongoose';
import { ISession } from '@components/sessions/session.interface';
import { IUser } from '@components/users/user.interface';
import { ITaxi } from '@components/taxi/taxi.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';

export enum AbsenceStatus {
  UNEXCUSED = 'unexcused',
  EXCUSED = 'excused',
  JUSTIFIED = 'justified',
}

export interface IAbsence extends Document {
  session_type?: 'Session' | 'SessionRecurring';
  session: ISession | string;
  student: IUser | string;
  date: Date;
  reason?: string;
  status: AbsenceStatus;
  justification_document?: string;
  taxi: ITaxi | string;
  academic_period: IAcademicPeriod | string;
  note?: string;
  notified_parent: boolean;
  notification_date?: Date;
}

export interface IAbsenceCreateDTO {
  session_type?: 'Session' | 'SessionRecurring';
  session: string;
  student: string;
  date: Date;
  reason?: string;
  status?: AbsenceStatus;
  justification_document?: string;
  taxi: string;
  academic_period: string;
  note?: string;
  notified_parent?: boolean;
  notification_date?: Date;
}

export interface IAbsenceUpdateDTO {
  session_type?: 'Session' | 'SessionRecurring';
  session?: string;
  student?: string;
  date?: Date;
  reason?: string;
  status?: AbsenceStatus;
  justification_document?: string;
  taxi?: string;
  academic_period?: string;
  note?: string;
  notified_parent?: boolean;
  notification_date?: Date;
}

export interface IAbsenceReportParams {
  start_date?: Date;
  end_date?: Date;
  student_id?: string;
  taxi_id?: string;
  academic_period_id?: string;
  status?: AbsenceStatus;
}

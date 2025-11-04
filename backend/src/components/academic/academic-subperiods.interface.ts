import { Document } from 'mongoose';
import { IAcademicPeriod } from './academic-periods.interface';

export interface IAcademicSubperiod extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  academic_period: IAcademicPeriod | string;
}

export interface IAcademicSubperiodCreateDTO {
  name: string;
  start_date: Date;
  end_date: Date;
  academic_period: string;
}

export interface IAcademicSubperiodUpdateDTO {
  id: string;
  name?: string;
  start_date?: Date;
  end_date?: Date;
  academic_period?: string;
}

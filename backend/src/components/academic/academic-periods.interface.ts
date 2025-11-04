import { Document } from 'mongoose';
import { IAcademicYear } from './academic-years.interface';

export interface IAcademicPeriod extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  academic_year: IAcademicYear | string;
  is_active: boolean;
}

export interface IAcademicPeriodCreateDTO {
  name: string;
  start_date: Date;
  end_date: Date;
  academic_year: string;
  is_active?: boolean;
}

export interface IAcademicPeriodUpdateDTO {
  id: string;
  name?: string;
  start_date?: Date;
  end_date?: Date;
  academic_year?: string;
  is_active?: boolean;
}

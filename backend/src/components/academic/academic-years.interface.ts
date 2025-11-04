import { Document } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  is_current: boolean;
  notes?: string;
}

export interface IAcademicYearCreateDTO {
  name: string;
  start_date: Date;
  end_date: Date;
  is_current?: boolean;
  notes?: string;
}

export interface IAcademicYearUpdateDTO {
  id: string;
  name?: string;
  start_date?: Date;
  end_date?: Date;
  is_current?: boolean;
  notes?: string;
}

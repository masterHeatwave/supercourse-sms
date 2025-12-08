import { Document } from 'mongoose';

export interface IAcademicYear extends Document {
  name: string;
  start_date: Date;
  end_date: Date;
  is_manual_active: boolean; // User-selected active year from settings
  is_current: boolean; // Computed field: true if current date falls within start_date and end_date
  notes?: string;
}

export interface IAcademicYearCreateDTO {
  name: string;
  start_date: Date;
  end_date: Date;
  is_manual_active?: boolean;
  notes?: string;
}

export interface IAcademicYearUpdateDTO {
  id: string;
  name?: string;
  start_date?: Date;
  end_date?: Date;
  is_manual_active?: boolean;
  notes?: string;
}

/**
 * Combined status returned by dual-state queries
 * Provides both manual and date-derived academic year information
 */
export interface IAcademicYearStatus {
  manual_active_academic_year: IAcademicYear | null;
  date_current_academic_year: IAcademicYear | null;
  are_the_same: boolean;
}

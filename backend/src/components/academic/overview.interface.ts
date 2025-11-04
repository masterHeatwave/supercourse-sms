import { Document } from 'mongoose';

export interface IAcademicOverviewBranch {
  id: string;
  name?: string;
  address?: string;
}

export interface IAcademicOverviewClass {
  id: string;
  name: string;
}

export interface IAcademicOverviewUserRole {
  userId: string;
  fullName: string;
  role: 'ADMIN' | 'MANAGER' | 'TEACHER';
  title?: string; // e.g., Headmaster, Sales manager, English teacher
}

export interface IAcademicOverviewPeriod {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  branches: IAcademicOverviewBranch[];
  classes: IAcademicOverviewClass[];
  roles: {
    administrators: IAcademicOverviewUserRole[];
    managers: IAcademicOverviewUserRole[];
    teachers: IAcademicOverviewUserRole[];
  };
}

export interface IAcademicOverviewYear extends Document {
  id: string;
  name: string;
  start_date: Date;
  end_date: Date;
  periods: IAcademicOverviewPeriod[];
}

export interface IAcademicOverviewForUserParams {
  userId: string;
}

export interface AcademicOverviewBranch {
  id: string;
  name?: string;
  address?: string;
}

export interface AcademicOverviewClass {
  id: string;
  name: string;
}

export type AcademicOverviewRoleType = 'ADMIN' | 'MANAGER' | 'TEACHER';

export interface AcademicOverviewUserRole {
  userId: string;
  fullName: string;
  role: AcademicOverviewRoleType;
  title?: string;
}

export interface AcademicOverviewPeriod {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  branches: AcademicOverviewBranch[];
  classes: AcademicOverviewClass[];
  roles: {
    administrators: AcademicOverviewUserRole[];
    managers: AcademicOverviewUserRole[];
    teachers: AcademicOverviewUserRole[];
  };
}

export interface AcademicOverviewYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  periods: AcademicOverviewPeriod[];
}

export interface GetAcademicOverviewResponse {
  success?: boolean;
  message?: string;
  count?: number;
  data: AcademicOverviewYear[];
}


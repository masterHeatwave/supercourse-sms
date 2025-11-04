import { Document } from 'mongoose';
import { IUser } from '@components/users/user.interface';
import { IAcademicYear } from '@components/academic/academic-years.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';
import { IRole } from '@components/roles/role.interface';
import { ICustomer } from '@components/customers/customer.interface';

export interface IStaffAcademicAssignment extends Document {
  staff_member: string | IUser;
  academic_year: string | IAcademicYear;
  academic_period: string | IAcademicPeriod;
  role: string | IRole;
  role_title: string;
  branches: string[] | ICustomer[];
  classes: string[]; // Class/Taxi IDs - using string array for now
  start_date: Date;
  end_date: Date;
  is_active: boolean;
  notes?: string;
  created_by?: string | IUser;
  updated_by?: string | IUser;
  createdAt?: Date;
  updatedAt?: Date;
}

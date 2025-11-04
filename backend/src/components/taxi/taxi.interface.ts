import { Document, Types } from 'mongoose';
import { IAcademicYear } from '@components/academic/academic-years.interface';
import { IAcademicPeriod } from '@components/academic/academic-periods.interface';
import { IAcademicSubperiod } from '@components/academic/academic-subperiods.interface';
import { ICustomer } from '@components/customers/customer.interface';

export interface ITaxi extends Document {
  name: string;
  color: string;
  branch: ICustomer | string;
  subject: string;
  level: string;
  academic_year: IAcademicYear | string;
  academic_period: IAcademicPeriod | string;
  academic_subperiods?: (IAcademicSubperiod | string)[];
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  users: string[];
  scap_products: string[];
}

export interface ITaxiCreateDTO {
  name: string;
  color?: string;
  branch?: string;
  subject?: string;
  level?: string;
  academic_year: string;
  academic_period: string;
  academic_subperiods?: string[];
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  users?: string[];
  scap_products?: string[];
}

export interface ITaxiUpdateDTO {
  id: string;
  name?: string;
  color?: string;
  branch?: string;
  subject?: string;
  level?: string;
  academic_year?: string;
  academic_period?: string;
  academic_subperiods?: string[];
  cefr_level?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  users?: string[];
  scap_products?: string[];
}

/**
 * Query parameters for filtering taxis
 */
export interface ITaxiQuery {
  academic_year?: string;
  academic_period?: string;
  branch?: string;
  subject?: string;
  level?: string;
  search?: string;
}

// ==================== MESSAGING INTERFACES ====================

/**
 * User information for messaging (matches frontend UserInTaxi interface)
 */
export interface IUserForMessaging {
  _id: Types.ObjectId | string;
  user: string; // String version of _id for matching
  username: string;
  userType: string;
  email?: string;
  firstname?: string;
  lastname?: string;
  isOnline: boolean;
}

/**
 * Taxi/Class formatted for messaging with separated students and teachers
 * This format is optimized for building TreeNodes in the frontend
 */
export interface ITaxiForMessaging {
  _id: Types.ObjectId | string;
  name: string;
  subject?: string;
  level?: string;
  students: IUserForMessaging[];
  teachers: IUserForMessaging[];
}

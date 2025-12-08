import { Document } from 'mongoose';
import { IRole } from '@components/roles/role.interface';
import { ICustomer, CustomerType } from '@components/customers/customer.interface';
import { ISession } from '@components/sessions/session.interface';
import { ITaxi } from '@components/taxi/taxi.interface';

export enum IUserType {
  ADMIN = 'admin',
  MANAGER = 'manager',
  TEACHER = 'teacher',
  STUDENT = 'student',
  PARENT = 'parent',
}

export interface IContact {
  name: string;
  phone: string;
  email: string;
  relationship: string;
  isPrimaryContact: boolean;
}

export interface IUser extends Document {
  username: string;
  code: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  mobile?: string;
  city: string;
  region?: string;
  country: string;
  address: string;
  zipcode: string;
  passwordHash?: string;
  birthday?: Date;
  is_active: boolean;
  customers: ICustomer[] | string[];
  roles: IRole[];
  taxis: ITaxi[] | string[];
  user_type: IUserType;
  avatar?: string;

  branches?: string[];
  default_branch?: string;
  role?: string;
  role_title?: string;
  status?: boolean;
  hire_date?: Date;
  registration_date?: Date;
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;
  documents?: string[];
  notes?: string;

  teaching_sessions: ISession[];
  student_sessions: ISession[];
  archived: boolean;

  // Student-specific fields
  contacts: IContact[];
  siblingAttending?: string[];
  hasAllergies?: boolean;
  healthDetails?: string;
  generalNotes?: string;
}

export interface IUserArchiveDTO {
  id: string;
  archived: boolean;
}

export interface IUserCreateDTO {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  mobile?: string;
  city?: string;
  country?: string;
  address?: string;
  zipcode?: string;
  password?: string;
  birthday?: Date;
  is_active?: boolean;
  customers?: string[];
  roles?: string[];
  branches?: string[];
  user_type?: IUserType;
  customer?: string;
  region?: string;
  startDate?: string | Date;
  registration_date?: string | Date;
  archived?: boolean;
  position?: string;
  notes?: string;
  tax_id?: number;
  internal_number?: string;
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;
  avatar?: string;
  // Student-specific fields
  contacts?: IContact[];
  siblingAttending?: string[];
  hasAllergies?: boolean;
  healthDetails?: string;
  generalNotes?: string;
}

export interface IUserUpdateDTO {
  id: string;
  username?: string;
  firstname?: string;
  lastname?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  city?: string;
  country?: string;
  address?: string;
  zipcode?: string;
  password?: string;
  birthday?: Date;
  is_active?: boolean;
  customers?: string[];
  roles?: string[];
  branches?: string[];
  user_type?: IUserType;
  // Student-specific fields
  contacts?: IContact[];
  siblingAttending?: string[];
  hasAllergies?: boolean;
  healthDetails?: string;
  generalNotes?: string;
  // Additional fields
  default_branch?: string;
  avatar?: string;
  documents?: string[];
  notes?: string;
}

export interface IUserDuplicateDTO {
  email?: string;
  phone?: string;
  username?: string;
  excludeId?: string;
}

export interface IInternalUserCreateDTO {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  mobile?: string;
  password: string;
  city?: string;
  country?: string;
  address?: string;
  zipcode?: string;
  birthday?: Date;
  is_active?: boolean;
  customers?: string[];
  roles?: string[];
  user_type?: IUserType;
}

export interface IInternalSchoolCreateDTO {
  main_customer: IInternalCustomerPayload;
  branch_customer?: IInternalCustomerPayload;
  user: {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    phone: string;
    password: string;
  };
}

export interface IStaffCreateDTO {
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: string;
  user_type: IUserType.TEACHER | IUserType.MANAGER; // Only allow valid user types for staff
  mobile?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  address?: string;
  region?: string;
  startDate?: string;
  registration_date?: string | Date;
  archived?: boolean;
  customer?: string;
  roles?: string[];
  branches?: string[];
  position?: string;
  notes?: string;
  tax_id?: number;
  internal_number?: string;
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;
  avatar?: string;
  password?: string;
  documents?: string[];
}

export interface IStaffUpdateDTO extends Omit<IUserUpdateDTO, 'customers' | 'roles' | 'user_type'> {
  branches?: string[];
  role?: string;
  role_title?: string;
  status?: boolean;
  hire_date?: Date;
  registration_date?: Date;
  facebook_link?: string;
  twitter_link?: string;
  linkedin_link?: string;
  documents?: string[];
  notes?: string;
  avatar?: string;
}

export interface IBranchCreateDTO {
  branch_customer: IInternalCustomerPayload;
  supercourse_sub_customer_id: string;
  parent_supercourse_customer_id: string;
}

export interface ISetPrimaryBranchDTO {
  supercourse_sub_customer_id: string;
  parent_supercourse_customer_id: string;
}

export interface IInternalCustomerPayload {
  name: string;
  slug: string;
  customer_type: CustomerType;
  nickname?: string;
  afm?: string;
  scap_id?: string;
  email?: string;
  customer_email?: string;
  manager_name?: string;
  phone?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  website?: string;
  description?: string;
  note?: string;
  vat?: string;
}

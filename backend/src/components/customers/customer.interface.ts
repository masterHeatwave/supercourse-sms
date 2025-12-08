import { Document, Schema } from 'mongoose';
import { IUser } from '@components/users/user.interface';

export enum CustomerType {
  PRIVATE_SCHOOL = 'PRIVATE_SCHOOL',
  PRIVATE_TUTORING = 'PRIVATE_TUTORING',
  PUBLIC_SCHOOL = 'PUBLIC_SCHOOL',
  PRIVATE_PROFESSOR = 'PRIVATE_PROFESSOR',
  SELF_TAUGHT_PROFESSOR = 'SELF_TAUGHT_PROFESSOR',
  SUB_STORE = 'SUB_STORE',
}

export interface ICustomer extends Document {
  name: string;
  slug: string;
  nickname: string;
  afm: string;
  facebook: string;
  instagram: string;
  twitter: string;
  youtube: string;
  avatar: string;
  website: string;
  customer_type: CustomerType;
  erp_code: string;
  scap_id: string;
  is_primary: boolean;
  is_main_customer: boolean;
  email: string;
  customer_email?: string;
  manager_name?: string;
  description?: string;
  note?: string;
  order?: number;
  parent_customer?: Schema.Types.ObjectId | ICustomer;
  administrator?: Schema.Types.ObjectId | IUser;
  manager?: Schema.Types.ObjectId | IUser;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  phone?: string;
  code?: string;
  vat?: string;
  mapLocation?: string;
  supercourse_sub_customer_id?: string;
  products?: string[];
}

export interface ICustomerCreateDTO {
  name: string;
  slug: string;
  nickname?: string;
  afm?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  avatar?: string;
  website?: string;
  customer_type: CustomerType;
  erp_code?: string;
  scap_id?: string;
  is_primary?: boolean;
  is_main_customer?: boolean;
  email?: string;
  customer_email?: string;
  manager_name?: string;
  description?: string;
  note?: string;
  order?: number;
  parent_customer?: string;
  administrator?: string;
  manager?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  phone?: string;
  code?: string;
  vat?: string;
  mapLocation?: string;
  supercourse_sub_customer_id?: string;
  products?: string[];
}

export interface ICustomerUpdateDTO {
  id: string;
  name?: string;
  slug?: string;
  nickname?: string;
  afm?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  avatar?: string;
  website?: string;
  customer_type?: CustomerType;
  erp_code?: string;
  scrap_id?: string;
  is_primary?: boolean;
  is_main_customer?: boolean;
  email?: string;
  customer_email?: string;
  manager_name?: string;
  description?: string;
  note?: string;
  order?: number;
  parent_customer?: string;
  administrator?: string;
  manager?: string;
  address?: string;
  city?: string;
  zipcode?: string;
  country?: string;
  phone?: string;
  code?: string;
  vat?: string;
  mapLocation?: string;
  supercourse_sub_customer_id?: string;
  products?: string[];
}

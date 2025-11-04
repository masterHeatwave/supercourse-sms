import { Document } from 'mongoose';
import { IUser } from '@components/users/user.interface';
import { ICustomer } from '@components/customers/customer.interface';

export type InventoryItemType = 'ASSET' | 'ELIBRARY';

export interface IInventory extends Document {
  user: IUser | string | null;
  title: string;
  code: string;
  billing_date: Date;
  return_date: Date;
  notes: string;
  customer: ICustomer | string;
  item_type: InventoryItemType;
  created_at: Date;
}

export interface IInventoryCreateDTO {
  user?: string;
  title: string;
  billing_date: Date;
  return_date?: Date;
  notes?: string;
  customer: string;
  item_type: InventoryItemType;
}

export interface IInventoryUpdateDTO {
  id: string;
  user?: string;
  title?: string;
  billing_date?: Date;
  return_date?: Date;
  notes?: string;
  customer?: string;
  item_type?: InventoryItemType;
}

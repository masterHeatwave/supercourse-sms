import { Document, Schema } from 'mongoose';
import { ICustomer } from '@components/customers/customer.interface';

export interface IClassroom extends Document {
  name: string;
  capacity: number;
  location: string;
  equipment: string[];
  customer: Schema.Types.ObjectId | ICustomer; // Customer/Branch ID this classroom belongs to
  availability: 'available' | 'unavailable' | 'out_of_order' | 'under_maintenance';
  type?: string;
  description?: string;
}

export interface IClassroomCreateDTO {
  name: string;
  capacity?: number;
  location?: string;
  equipment?: string[];
  customer: string; // Customer/Branch ID this classroom belongs to
  availability?: 'available' | 'unavailable' | 'out_of_order' | 'under_maintenance';
  type?: string;
  description?: string;
}

export interface IClassroomUpdateDTO {
  id: string;
  name?: string;
  capacity?: number;
  location?: string;
  equipment?: string[];
  customer?: string; // Customer/Branch ID this classroom belongs to
  availability?: 'available' | 'unavailable' | 'out_of_order' | 'under_maintenance';
  type?: string;
  description?: string;
}

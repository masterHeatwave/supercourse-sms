import { Document } from 'mongoose';

export interface IPermission extends Document {
  name: string;
  description: string;
}

export interface IPermissionCreateDTO {
  name: string;
  description: string;
}

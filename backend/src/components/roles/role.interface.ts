import { Document } from 'mongoose';
import { IPermission } from '@components/permissions/permission.interface';

export interface IRole extends Document {
  title: string;
  description: string;
  permissions: IPermission[];
}

export interface IRoleDTO {
  title: string;
  description?: string | undefined;
  permissions?:
    | {
        id: string;
        name: string;
        description?: string | undefined;
      }[]
    | undefined;
}

export interface IRoleCreateDTO {
  title: string;
  description: string;
  permissions: string[];
}

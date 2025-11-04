import { Document } from 'mongoose';

export enum EnumErrorLocation {
  FRONTEND = 'FRONTEND',
  BACKEND = 'BACKEND',
}
export interface IError extends Document {
  title: string;
  message: string;
  location: EnumErrorLocation;
  status_code: number;
}

export interface IErrorCreateDTO {
  title: string;
  message: string;
  location: EnumErrorLocation;
  status_code: number;
}

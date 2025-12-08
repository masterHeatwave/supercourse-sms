import { Document } from 'mongoose';

export interface IFile extends Document {
  path: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size?: number;
  user?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IFileCreateDTO {
  path: string;
  filename: string;
  originalname: string;
  mimetype: string;
  size?: number;
  user?: string;
}

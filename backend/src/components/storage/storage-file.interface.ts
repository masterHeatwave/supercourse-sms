import { Document, Types } from 'mongoose';

export interface IStorageFile extends Document {
  filename: string;
  type: 'file' | 'folder';
  size: number;
  ownerId: Types.ObjectId;
  key: string;
  location?: string;
  bucket: string;
  etag: string;
  parent: string;
  versionId?: string;
  contentType?: string;
  metadata?: Map<string, string>;
  deleted?: boolean;
  deletedAt?: Date;
  lastModified?: Date;
  sharedWithUsers?: string[];
  sharedWithGroups?: string[];
  permissions?: Map<string, 'read' | 'read-write'>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IStorageFileCreateDTO {
  filename: string;
  type: 'file' | 'folder';
  size: number;
  ownerId: string;
  key: string;
  bucket: string;
  etag: string;
  parent: string;
  location?: string;
  versionId?: string;
  contentType?: string;
  metadata?: Map<string, string>;
  sharedWithUsers?: string[];
  sharedWithGroups?: string[];
  permissions?: Map<string, 'read' | 'read-write'>;
  lastModified?: Date;
}

export interface ISizeInfo {
  used: number;
  quota: number;
}

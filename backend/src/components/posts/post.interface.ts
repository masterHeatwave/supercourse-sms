import { Document } from 'mongoose';
import { IUser } from '@components/users/user.interface';

export interface IPost extends Document {
  title: string;
  content: string;
  author: IUser | string;
  tags: string[];
  status: PostStatus;
  featured_image?: string;
  published_at?: Date;
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export interface IPostCreateDTO {
  title: string;
  content: string;
  author: string;
  tags?: string[];
  status?: PostStatus;
  featured_image?: string;
  published_at?: Date;
}

export interface IPostUpdateDTO {
  id: string;
  title?: string;
  content?: string;
  author?: string;
  tags?: string[];
  status?: PostStatus;
  featured_image?: string;
  published_at?: Date;
}

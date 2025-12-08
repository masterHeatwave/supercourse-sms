import { Document } from 'mongoose';
import { IUser } from '@components/users/user.interface';

export interface IPostPollOption {
  id: string;
  text: string;
  voteCount: number;
}

export interface IPostPoll {
  question: string;
  allowMultiple: boolean;
  options: IPostPollOption[];
  closed_at?: Date;
}

export interface IPostRecipients {
  branches: string[];
  taxis: string[];
  users: string[];
}

export interface IPost extends Document {
  title: string;
  content: string;
  author: IUser | string;
  tags: string[];
  status: PostStatus;
  priority: PostPriority;
  pinned: boolean;
  likedBy: string[];
  recipients: IPostRecipients;
  scheduled_at?: Date;
  expires_at?: Date;
  allow_reactions?: boolean;
  allow_replies?: boolean;
  poll?: IPostPoll;
  featured_image?: string;
  published_at?: Date;
}

export enum PostStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum PostPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
}

export interface IPostCreateDTO {
  title: string;
  content: string;
  author: string;
  tags?: string[];
  status?: PostStatus;
  priority?: PostPriority;
  pinned?: boolean;
  likedBy?: string[];
  recipients?: IPostRecipients;
  scheduled_at?: Date;
  expires_at?: Date;
  allow_reactions?: boolean;
  allow_replies?: boolean;
  poll?: IPostPoll;
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
  priority?: PostPriority;
  pinned?: boolean;
  likedBy?: string[];
  recipients?: IPostRecipients;
  scheduled_at?: Date;
  expires_at?: Date;
  allow_reactions?: boolean;
  allow_replies?: boolean;
  poll?: IPostPoll | null;
  featured_image?: string;
  published_at?: Date;
}

export interface IPostVoteDTO {
  optionIds: string[];
}

import { Document } from 'mongoose';
import { IUser } from '@components/users/user.interface';

export enum ActivityActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export enum ActivityEntityType {
  USER = 'user',
  STUDENT = 'student',
  TAXI = 'taxi',
  POST = 'post',
  SESSION = 'session',
  CLASSROOM = 'classroom',
  ABSENCE = 'absence',
  CHAT = 'chat',
  MESSAGE = 'message',
  CHAT_NOTIFICATION = 'chat_notification',
  ATTACHMENT = 'attachment',
}

export interface IActivity extends Document {
  action_type: ActivityActionType;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_name: string;
  performed_by: string | IUser;
  details?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IActivityCreateDTO {
  action_type: ActivityActionType;
  entity_type: ActivityEntityType;
  entity_id: string;
  entity_name: string;
  performed_by: string;
  details?: string;
}

export interface IActivityQueryDTO {
  action_type?: ActivityActionType;
  entity_type?: ActivityEntityType;
  entity_id?: string;
  performed_by?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
}

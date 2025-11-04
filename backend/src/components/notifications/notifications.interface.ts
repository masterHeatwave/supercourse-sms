import { Document } from 'mongoose';

export interface Notification extends Document {
  notification_type: string;
  title: string;
  content: string;
  isRead: boolean;
  read_at: Date;
  sent_at: Date;
}

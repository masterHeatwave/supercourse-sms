import { Document, Types } from 'mongoose';

export interface IBookmarkItem {
  id: number;
  label: string;
  page: string;
}

export interface IBookmark extends Document {
  appId: Types.ObjectId;
  userId: Types.ObjectId;
  items: IBookmarkItem[];
}

import { Document, Schema } from 'mongoose';

export interface IBookmarkItem {
  id: number;
  label: string;
  page: string;
}

export interface IBookmark extends Document {
  appId: Schema.Types.ObjectId;
  userId: Schema.Types.ObjectId;
  items: IBookmarkItem[];
}

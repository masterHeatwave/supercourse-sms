import { Document, Types } from 'mongoose';

export interface INoteUpdateData {
  recipients?: Types.ObjectId[] | string[];
  y?: number;
  x?: number;
  text?: string;
  image?: string | null;
  audio?: string | null;
}

export interface INoteData {
  recipients: Types.ObjectId[] | string[];
  location: Record<string, any>;
  y?: number;
  x?: number;
  text?: string;
  image?: string | null;
  audio?: string | null;
}

export interface INote extends Document {
  appId: Types.ObjectId;
  owner: Types.ObjectId;
  data: INoteData;
}
